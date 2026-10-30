import { test } from "node:test";
import assert from "node:assert/strict";
import { editPrompt } from "../lib/edit.ts";
import { defaults, findModel, modelsFor, refName, sizes } from "../lib/models.ts";
import { buildWorkflow, isSeed, kleinBoxEdit, kleinEdit, qwenEdit, qwenText } from "../lib/workflows.ts";
import { wardrobePrompt } from "../lib/wardrobe.ts";

// Every link in a graph must point at a node that exists.
function linksResolve(graph: Record<string, { inputs: Record<string, unknown> }>) {
  for (const [id, node] of Object.entries(graph)) {
    for (const value of Object.values(node.inputs)) {
      if (Array.isArray(value) && typeof value[0] === "string" && typeof value[1] === "number") {
        assert.ok(graph[value[0]], `${id} links to missing node ${value[0]}`);
      }
    }
  }
}

test("open-model graphs are complete and take the seed", () => {
  for (const built of [
    qwenText({ prompt: "p", width: 1824, height: 1024, seed: 7 }),
    qwenEdit({ prompt: "p", references: 3, seed: 7 }),
    kleinEdit({ prompt: "p", references: 2, seed: 7, width: 896, height: 1120 }),
    kleinBoxEdit({ prompt: "p", box: { x: 1, y: 2, width: 30, height: 40 }, width: 1824, height: 1024, seed: 7 }),
  ]) {
    linksResolve(built.graph);
    assert.ok(built.graph[built.output]);
    assert.equal(built.graph.sample.inputs.seed, 7);
    for (const id of built.images) assert.equal(built.graph[id].class_type, "LoadImage");
  }
  assert.deepEqual(qwenEdit({ prompt: "p", references: 2, seed: 1 }).images, ["ref0", "ref1"]);
  assert.deepEqual(kleinEdit({ prompt: "p", references: 2, seed: 1 }).graph.refs.inputs["images.image1"], ["ref1", 0]);
});

test("box widget lists are wrapped so ComfyUI doesn't read them as links", () => {
  const { graph } = kleinBoxEdit({ prompt: "p", box: { x: 1, y: 2, width: 3, height: 4 }, width: 100, height: 100, seed: 1 });
  assert.deepEqual(graph.boxes.inputs.last_incoming, { __value__: [] });
  assert.equal((graph.boxes.inputs.editor_state as { __value__: { x: number }[] }).__value__[0].x, 1);
});

test("the engine picks text or reference graphs by task", () => {
  const base = { prompt: "p", width: 1824, height: 1024, seed: 1 };
  assert.equal(buildWorkflow("qwen-2.1", { ...base, task: "sheet" }).graph.text.class_type, "TextEncodeQwenImage21");
  assert.equal(buildWorkflow("qwen-2.1", { ...base, task: "sheet", references: ["a"] }).images.length, 1);
  assert.ok(buildWorkflow("flux-3-klein", { ...base, task: "edit", references: ["a", "b"] }).graph.refs);
  assert.ok(buildWorkflow("flux-3-klein", { ...base, task: "box", references: ["a"], box: { x: 0, y: 0, width: 1, height: 1 } }).graph.boxes);
  const moss = buildWorkflow("moss-image", { ...base, task: "sheet" }).graph;
  assert.equal(moss.clip.inputs.type, "moss_image");
  assert.equal(moss.sample.inputs.sampler_name, "er_sde");
  assert.equal(moss.latent.inputs.width, 1824);
});

test("MOSS-Image makes sheets from words and edits through its edit LoRA (Oct 28)", () => {
  assert.deepEqual(modelsFor("sheet").map((m) => m.id), ["qwen-2.1", "flux-3-klein", "moss-image"]);
  assert.ok(modelsFor("edit").some((m) => m.id === "moss-image") && !modelsFor("box").some((m) => m.id === "moss-image"));
  const base = { prompt: "p", width: 1824, height: 1024, seed: 1 };
  const edit = buildWorkflow("moss-image", { ...base, task: "edit", references: ["a", "b"] });
  assert.deepEqual(edit.images, ["ref0", "ref1"]);
  assert.equal(edit.graph.lora.inputs.lora_name, "moss_image_edit_lora_rank_64_bf16.safetensors");
  assert.deepEqual(edit.graph.text.inputs["images.image_1"], ["ref1s", 0]);
  assert.equal(edit.graph.sample.inputs.cfg, 4);
  // No size: the result takes the first reference's scaled shape.
  const own = buildWorkflow("moss-image", { prompt: "p", seed: 1, task: "edit", references: ["a"] } as never);
  assert.deepEqual(own.graph.latent.inputs.width, ["size", 0]);
  // A sheet started from a photo now runs on MOSS itself.
  assert.equal(buildWorkflow("moss-image", { ...base, task: "sheet", references: ["face"] }).graph.text.class_type, "TextEncodeMOSSImageEdit");
});

test("models: open defaults per task, unknown ids fall back", () => {
  assert.equal(defaults.sheet, "qwen-2.1");
  assert.equal(defaults.edit, "flux-3-klein");
  assert.equal(findModel("nope", "sheet").id, "qwen-2.1");
  assert.deepEqual(modelsFor("box").map((m) => m.id), ["flux-3-klein"]);
  assert.equal(refName("flux-3-klein", 1), "<ref_image_1>");
  assert.equal(refName("qwen-2.1", 1), "<image2>");
  assert.equal(sizes.sheet.width % 16, 0);
  assert.ok(isSeed(0) && isSeed(123) && !isSeed(-1) && !isSeed(1.5) && !isSeed("3"));
});

test("wardrobe names each dropped image and keeps the rest of the outfit", () => {
  const prompt = wardrobePrompt("flux-3-klein", [{ piece: "top", image: "x" }, { piece: "bottom", image: "y" }], { parts: "wings" });
  assert.ok(prompt.includes("the exact top shown in <ref_image_1>"));
  assert.ok(prompt.includes("shown in <ref_image_2>"));
  assert.ok(prompt.includes("The rest of the outfit stays exactly the same"));
  assert.ok(prompt.includes("ignore any person or mannequin"));
  assert.ok(prompt.includes("The wings come out through slits"));
  // Qwen gets one short sentence, like the owner's prompt that worked (Oct 30).
  assert.equal(wardrobePrompt("qwen-2.1", [{ piece: "full", words: "a knight costume" }]), "Replace the whole outfit of the character in <image1> with a knight costume, in both the close-up and the full-body shot.");
  assert.equal(wardrobePrompt("qwen-2.1", [{ piece: "top", image: "x" }, { piece: "shoes", image: "y" }]), "Add the top from <image2> and the shoes from <image3> to both the close-up and the full-body shot of the character in <image1>.");
});

test("edits name the crop, ask for a visible change, and crop around the mark", async () => {
  const { cropAround, editSize } = await import("../lib/edit.ts");
  const prompt = editPrompt("flux-3-klein", "an angry frown.");
  assert.ok(prompt.startsWith("Edit <ref_image_0>: an angry frown. Make this change clearly visible."));
  assert.ok(editPrompt("qwen-2.1", "x").startsWith("Edit <image1>: x."));
  // A small mouth box gets context around it and stays inside the image.
  const crop = cropAround({ x: 360, y: 270, width: 220, height: 120 }, { width: 1344, height: 768 });
  assert.ok(crop.x <= 360 && crop.y <= 270 && crop.x + crop.width >= 580 && crop.y + crop.height >= 390);
  assert.ok(crop.x >= 0 && crop.y >= 0 && crop.x + crop.width <= 1344 && crop.y + crop.height <= 768);
  const edge = cropAround({ x: 1300, y: 740, width: 40, height: 20 }, { width: 1344, height: 768 });
  assert.ok(edge.x + edge.width <= 1344 && edge.y + edge.height <= 768);
  const out = editSize(crop);
  assert.ok(Math.abs(out.width * out.height - 1024 * 1024) < 4000);
});

test("a storyboard is one prompt for one image: every frame, the cast, the place and the product", async () => {
  const { storyboardPrompt, isShot, shortIdentity } = await import("../lib/scene.ts");
  const shot = { action: "Nax hands Moth a coffee.", framing: "Two shot", angle: "Low angle", expression: "Smug smirk" } as const;
  const cast = [{ name: "Nax", description: "An axolotl-human hybrid man in their 30s with smooth glossy skin, a wide smile.", role: "hero" }, { name: "Moth" }];
  assert.equal(shortIdentity(cast[0].description), "An axolotl-human hybrid man in their 30s");
  const prompt = storyboardPrompt("flux-3-klein", [shot, { ...shot, action: "Moth spills it", framing: "Close-up" }], { cast, look: "film", ratio: "16:9", hasPlace: true, product: "a red thermos", hasProduct: true });
  assert.ok(prompt.startsWith("One storyboard image: 2 photographic film stills from one continuous scene, laid out in a grid of 1 row and 2 columns"));
  assert.ok(prompt.includes("not drawings, sketches, comics or illustrations"));
  assert.ok(prompt.includes("the exact place shown in <ref_image_2>") && prompt.includes("The red thermos is the exact product shown in <ref_image_3>"));
  assert.ok(prompt.includes("Nax (hero) is the exact character in <ref_image_0>: an axolotl-human hybrid man in their 30s with smooth glossy skin, a wide smile. Nax has the same face") && prompt.includes("appears only once per frame") && prompt.includes("No other people appear unless the action names them"));
  assert.ok(prompt.includes("Frame 1, the beginning: Nax hands Moth a coffee, smug smirk; shot as a two shot, side by side, camera low, looking up at them"));
  assert.ok(prompt.includes("Frame 2, a moment later and the end: Moth spills it, smug smirk; shot as a close-up of the face") && prompt.includes("each frame shows a later moment than the one before"));
  const trip = storyboardPrompt("qwen-2.1", [shot], { cast: [cast[0]], look: "photo", ratio: "9:16", location: "starting off in a living room, then a street, then a park" });
  assert.ok(trip.includes("The scene moves through these places in order, each frame in the right place for its moment: a living room, then a street, then a park") && !trip.includes("takes place in a starting"));
  const ad = storyboardPrompt("qwen-2.1", [shot], { cast: [cast[0]], look: "photo", ratio: "9:16", product: "a red thermos", format: "ugc" });
  assert.ok(ad.includes("This is a product video: the red thermos is the hero of every frame, large and in sharp focus"));
  const { lookOf } = await import("../lib/scene.ts");
  // Creatures keep their "no human mouth" sentence (owl, Oct 29).
  assert.ok(lookOf("An owl creature with orange eyes. The head is the real owl's head, not a mask or costume, with no human nose, lips, chin or skin. Feathers everywhere.").endsWith("not a mask or costume, with no human nose, lips, chin or skin"));
  const wild = storyboardPrompt("qwen-2.1", [shot, shot], { cast: [cast[0]], look: "photo", ratio: "9:16", weird: 3 });
  assert.ok(wild.indexOf("unhinged surreal chaos") < wild.indexOf("Every frame is") && wild.includes("while the room melts") && wild.includes("while everything floats") && wild.includes("the props") === false);
  assert.ok(!lookOf(`An owl, ${"a very long detail, ".repeat(20)}in the places where a owl has eyes.`).endsWith(" a"));
  const solo = storyboardPrompt("qwen-2.1", [shot], { cast: [cast[0]], look: "noir", ratio: "9:16", location: "a rooftop" });
  assert.ok(solo.includes("takes place in a rooftop") && solo.includes("no color at all") && !solo.includes("on the left") && solo.includes("<image1>"));
  assert.equal(isShot({ ...shot, framing: "Selfie" }), false);
  assert.equal(isShot({ ...shot, action: " " }), false);
});

test("storyboard grid, timing and the free frame plan", async () => {
  const { grid, timing, planShots, beats, durations, shotCounts, pace } = await import("../lib/scene.ts");
  assert.deepEqual([grid(6, "16:9").cols, grid(6, "16:9").rows], [3, 2]);
  assert.deepEqual([grid(12, "16:9").cols, grid(12, "16:9").rows], [4, 3]);
  const tall = grid(4, "9:16");
  assert.equal(tall.cols, 2);
  // 6 shots are 3 over 3 in any shape, not a strip (Oct 29).
  assert.deepEqual([grid(6, "9:16").cols, grid(6, "9:16").rows, grid(8, "16:9").cols, grid(3, "16:9").rows], [3, 2, 4, 1]);
  for (const g of [grid(6, "16:9"), tall, grid(9, "1:1")]) assert.ok(g.width % 16 === 0 && g.height % 16 === 0 && g.width * g.height < 2_100_000 && g.width * g.height > 1_800_000);
  assert.equal(timing(1, 4, 10), "0:03–0:05");
  assert.ok(durations.includes(8) && Math.max(...shotCounts) <= 12);
  assert.deepEqual([pace(8, 2), pace(8, 4), pace(8, 8)], ["slow", "steady", "quick cuts"]);
  assert.deepEqual(beats("@Gabe walks in. He sits down; then Mara waves"), ["Gabe walks in", "He sits down", "Mara waves"]);
  // Frames move the story forward: setup, the moment before, the event, the aftermath (Oct 29).
  const knight = planShots("@Gabe is riding through a forest as he gets ambushed by a shadow monster.", 4, "story", "Gabe");
  assert.deepEqual(knight.map((x) => x.action), [
    "Gabe is riding through a forest",
    "The moment just before Gabe gets ambushed by a shadow monster: Gabe senses it coming",
    "Gabe gets ambushed by a shadow monster",
    "The aftermath, right after Gabe gets ambushed by a shadow monster: how it ends for Gabe",
  ]);
  assert.deepEqual(knight.map((x) => x.framing), ["Wide shot", "Close-up", "Medium shot", "Wide shot"]);
  assert.deepEqual(beats("@Gabe unboxes it at his desk, shows it to the camera and smiles", "Gabe"), ["Gabe unboxes it at his desk", "Gabe shows it to the camera and smiles"]);
  assert.equal(beats("Joolio is promoting and showing off features of his new shoes, wanting to highlight details and features", "Joolio").length, 1);
  assert.deepEqual(beats("A black and white cat sits"), ["A black and white cat sits"]);
  assert.equal(new Set(planShots("Gabe dances.", 4, "story", "Gabe").map((x) => x.action)).size, 4);
  // Frames are read alone: "her" gets her name, "They" names both, and flying is a wide shot.
  const rescue = planShots("Birddog spots Luna stuck on a ledge, spreads his wings and flies up to her, then they glide over the city together", 4, "story", "Birddog");
  assert.equal(rescue[2].action, "Birddog flies up to Luna");
  assert.equal(rescue[2].framing, "Wide shot");
  assert.equal(rescue[3].action, "Birddog and Luna glide over the city together");
  const many = planShots("She runs. He hides. They meet. It rains. Lights die. Door slams.", 3, "story");
  assert.equal(many.length, 3);
  assert.ok(many[0].action.includes(", then "));
  // Product videos keep the product the hero: hook, detail, the brief, angles, verdict (owl and sneaker, Oct 29).
  const ugc = planShots("@Joolio tries them on. settings keeping the shoe in focus", 6, "ugc", "Joolio", "a lavender canvas sneaker");
  assert.equal(ugc.length, 6);
  assert.ok(ugc[0].action.startsWith("Joolio holds the lavender canvas sneaker up to the camera"));
  assert.equal(ugc[1].framing, "Detail insert");
  assert.ok(ugc.some((x) => x.action.startsWith("Settings keeping the shoe")) && !ugc.some((x) => x.action.includes("Joolio settings")));
  assert.ok(ugc[5].action.includes("turns to the camera with the lavender canvas sneaker held up next to their face") && !ugc.some((x) => /smile/.test(x.action)));
  assert.equal(new Set(ugc.map((x) => x.action)).size, 6);
  assert.equal(new Set(planShots("", 12, "ugc", "Joolio").map((x) => x.action)).size >= 8, true);
});

test("objects and food get their own prompt: shape first, no human face, the whole outfit fitted to the object", async () => {
  const { characterPrompt, identityDescription, defaultSelection } = await import("../lib/character.ts");
  const banana = characterPrompt({ ...defaultSelection, kind: ["banana"], features: ["nose-ring", "braces"], facialHair: ["mustache"], style: ["preppy"] });
  assert.ok(banana.startsWith("A hyper-realistic studio photograph laid out as two side-by-side panels of equal size of the same anthropomorphic banana character"));
  assert.ok(banana.includes("One giant whole unpeeled banana is the entire head and torso") && banana.includes("crescent curve"));
  assert.ok(banana.includes("no human head, neck, torso or skin"));
  assert.ok(banana.includes("realistic wet glossy eyes") && banana.includes("not a cartoon") && banana.includes("Right panel: a full-length shot of the front of the whole banana") && banana.includes("Left panel: an extreme close-up portrait of the same banana, a tight headshot with an 85mm portrait lens") && !banana.includes("back view") && banana.includes("Exactly two slim, toned arms"));
  assert.ok(!banana.includes("septum") && banana.includes("colorful dental braces") && banana.includes("mustache growing out of its surface just above the mouth"));
  assert.ok(banana.includes("It wears a cable-knit sweater over a collared shirt, pleated chinos and loafers: classic collegiate polish, crisp tidy pieces and heritage patterns, in a women's cut and fit, fitted to its banana body"));
  assert.ok(!banana.includes("pixie cut") && banana.includes("not hair, not a wig and not fur"));
  const shades = characterPrompt({ ...defaultSelection, kind: ["banana"], accessories: ["sunglasses"] });
  assert.ok(shades.includes("In every panel it wears sunglasses worn on the face over the eyes, clearly visible") && shades.includes("a graphic hoodie, baggy cargo trousers and chunky sneakers"));
  const mug = identityDescription({ ...defaultSelection, kind: ["coffee-cup"] });
  assert.ok(mug.includes("open round rim") && mug.includes('On top it has whipped cream'));
  const peel = characterPrompt({ ...defaultSelection, kind: ["banana"], hairStyle: ["mohawk"], hairColor: ["cherry"] });
  assert.ok(peel.includes("Right panel: a full-length shot of the front of the whole banana") && peel.includes("with the bright cherry red-colored strips of banana peel on top"));
  assert.ok(peel.includes('On top it has strips of banana peel curling down from the top, standing up in one tall ridge down the middle, the material painted bright cherry red on the outside'));
  assert.ok(!characterPrompt({ ...defaultSelection, kind: ["coffee-cup"], hairStyle: ["bald"] }).includes("On top it has"));
  assert.ok(!characterPrompt(defaultSelection).includes("not a cartoon"));
});

test("body tiles pick the real-world species or object variant", async () => {
  const { characterPrompt, variantLabel, defaultSelection } = await import("../lib/character.ts");
  const shark = { ...defaultSelection, kind: ["shark"] };
  assert.equal(variantLabel({ ...shark, build: ["muscular"] }), "great white shark");
  assert.equal(variantLabel({ ...shark, build: ["slim"] }), "blacktip reef shark");
  assert.equal(variantLabel({ ...shark, proportions: ["big-head"] }), "hammerhead shark");
  assert.equal(variantLabel({ ...defaultSelection, kind: ["coffee-cup"], build: ["slim"] }), "travel mug");
  assert.equal(variantLabel({ ...defaultSelection, kind: ["donut"], build: ["plus-size"] }), "jelly donut");
  assert.equal(variantLabel(defaultSelection), undefined);
  const prompt = characterPrompt({ ...shark, build: ["muscular"] });
  assert.ok(prompt.includes("an upright great white shark creature"));
  assert.ok(prompt.includes("The head is the real shark's head") && prompt.includes("no human nose"));
  assert.ok(prompt.includes("the dorsal fin rising from the upper back and the tail curling out behind the legs") && !prompt.includes("back view"));
  assert.ok(prompt.includes("The tail and dorsal fin grow out of the body"));
  assert.ok(!prompt.includes("with a human body"));
  assert.ok(prompt.includes("exactly one crescent tail fin"));
  assert.ok(prompt.includes("She clearly reads as female"));
  const hammer = characterPrompt({ ...shark, proportions: ["big-head"], eyes: ["amber"], accessories: ["sunglasses"], hairStyle: ["long-straight"] });
  assert.ok(hammer.includes("exactly two amber eyes, in the places where a hammerhead shark has its eyes, and no other eyes anywhere"));
  assert.ok(hammer.includes("In every panel it wears sunglasses worn on the face over the eyes, clearly visible, made oversized and shaped to fit the hammerhead shark's head"));
  assert.ok(hammer.includes("falls to the sides, leaving the tail and dorsal fin uncovered"));
});

test("people: outfits cut for the gender, a visible gender cue, glasses on the face", async () => {
  const { characterPrompt, defaultSelection } = await import("../lib/character.ts");
  const prompt = characterPrompt({ ...defaultSelection, gender: ["trans-woman"], style: ["techwear"], accessories: ["sunglasses"] });
  assert.ok(prompt.includes("Wearing a complete techwear outfit from top to shoes: functional technical fabrics, straps and pockets in a dark utilitarian palette, in a women's cut and fit"));
  assert.ok(prompt.includes("She is a trans woman and clearly presents as a woman"));
  assert.ok(prompt.includes("sunglasses worn on the face over the eyes"));
  assert.ok(characterPrompt({ ...defaultSelection, gender: ["man"] }).includes("in a men's cut and fit"));
});

test("whose body it is, stylized opener, headwear in the back view", async () => {
  const { characterPrompt, defaultSelection } = await import("../lib/character.ts");
  const p = characterPrompt({ ...defaultSelection, kind: ["stylized"], build: ["bodybuilder"], accessories: ["beanie"] });
  assert.ok(p.startsWith("A 3D animated-movie character sheet"));
  assert.ok(p.includes("Huge bodybuilder build with very large muscles, clearly a woman's body"));
  assert.ok(p.includes("two side-by-side panels of equal size") && !p.includes("back view") && p.includes("a beanie worn on the head"));
  assert.ok(characterPrompt(defaultSelection).startsWith("A photorealistic character sheet"));
});

test("gallery: search, filter, sort and pages, nothing dropped", async () => {
  const { viewGallery, defaultView, pageSize } = await import("../lib/gallery.ts");
  const items = Array.from({ length: 66 }, (_, i) => ({ id: String(i), saved: i % 3 === 0, name: i % 3 === 0 ? `Char ${i}` : undefined, kind: i < 5 ? "banana" : "shark", model: i % 2 ? "qwen-2.1" : "flux-3-klein", text: i < 5 ? "Banana" : "Shark", createdAt: i }));
  const all = viewGallery(items, defaultView);
  assert.equal(all.total, 66);
  assert.equal(pageSize, 30);
  assert.equal(all.items.length, pageSize);
  assert.equal(all.pages, 3);
  assert.equal(all.items[0].id, "65");
  assert.equal(viewGallery(items, { ...defaultView, page: 3 }).items.length, 6);
  assert.equal(viewGallery(items, { ...defaultView, page: 9 }).page, 3);
  assert.equal(viewGallery(items, { ...defaultView, show: "unsaved" }).total, 44);
  assert.equal(viewGallery(items, { ...defaultView, kind: "banana" }).total, 5);
  assert.equal(viewGallery(items, { ...defaultView, query: "banana" }).total, 5);
  assert.equal(viewGallery(items, { ...defaultView, model: "qwen-2.1" }).total, 33);
  assert.equal(viewGallery(items, { ...defaultView, sort: "oldest" }).items[0].id, "0");
  assert.equal(viewGallery(items, { ...defaultView, sort: "name" }).items[0].name, "Char 0");
});

test("restore: saved sheet details come back as a sheet, duplicates are skipped", async () => {
  const { fromSaved, alreadyKept } = await import("../lib/restore.ts");
  const { defaultSelection } = await import("../lib/character.ts");
  const r = fromSaved({ path: "2026-10-22/10-05-33-sheet-abc.png", details: { kind: "sheet", model: "bfl/flux-3-image", prompt: "p", description: "d", selection: { ...defaultSelection, kind: ["banana"] }, detail: "", createdAt: "2026-10-22T17:05:33.000Z" } });
  assert.equal(r.model, undefined);
  assert.equal(r.look.selection.kind[0], "banana");
  assert.equal(r.createdAt, Date.parse("2026-10-22T17:05:33.000Z"));
  assert.equal(fromSaved({ path: "x", details: { model: "qwen-2.1", seed: 5, selection: { kind: ["shark"] } } }).look.selection.gender[0], "woman");
  assert.equal(alreadyKept(r, [{ file: "2026-10-22/10-05-33-sheet-abc.png", createdAt: 0 }]), true);
  assert.equal(alreadyKept(r, [{ prompt: "p", createdAt: r.createdAt + 60_000 }]), true);
  assert.equal(alreadyKept(r, [{ prompt: "p", createdAt: r.createdAt + 3_600_000 }]), false);
});

test("weirdness reaches outfits and storyboards; film looks are photographic and grouped", async () => {
  const { storyboardPrompt, isLook, sceneChips, looks } = await import("../lib/scene.ts");
  const outfit = wardrobePrompt("flux-3-klein", [{ piece: "full", words: "a knight costume" }], { weird: 3 });
  assert.ok(outfit.includes("The outfit is unhinged and surreal") && !wardrobePrompt("flux-3-klein", [{ piece: "full", words: "x" }]).includes("over the top"));
  const shot = { action: "Nax dances.", framing: "Wide shot", angle: "Eye level", expression: "As the action suggests" } as const;
  const noir = storyboardPrompt("qwen-2.1", [shot], { cast: [{ name: "Nax" }], look: "noir", ratio: "16:9", weird: 2 });
  assert.ok(noir.includes("a black and white 1940s film noir still") && noir.includes("The scene is chaotic and absurd"));
  assert.ok(!storyboardPrompt("qwen-2.1", [shot], { cast: [{ name: "Nax" }], look: "film", ratio: "16:9" }).includes("chaotic"));
  assert.ok(isLook("grindhouse") && isLook("giallo") && isLook("folk-horror") && !isLook("comic"));
  assert.ok(looks.every((l) => !/graphic novel|ink lines|sketch/.test(l.words)));
  const chips = sceneChips({ cast: [], where: "preset", scene: "x", location: "", look: "noir", ratio: "16:9", shots: [shot], weird: 3, brief: "Nax dances", seconds: 10 }, []);
  assert.deepEqual(chips.find((c) => c.label === "Weirdness")?.values, ["Unhinged"]);
  assert.deepEqual(chips.find((c) => c.label === "Format")?.values, ["16:9", "10s"]);
});

test("the type filter groups character types and sorts each group A–Z", async () => {
  const { typeGroups } = await import("../lib/gallery.ts");
  const { fields } = await import("../lib/character.ts");
  const groups = typeGroups(fields[0].options, ["toaster", "retro-bot", "striking", "avocado", "true-to-life", "robot", "banana", "gone"]);
  assert.deepEqual(groups.map(([g]) => g), ["People", "Robots", "Objects", "Food", "Other"]);
  assert.deepEqual(groups[0][1].map((o) => o.label), ["Striking", "True to life"]);
  assert.deepEqual(groups[1][1].map((o) => o.label), ["Retro bot", "Robot"]);
  assert.deepEqual(groups[3][1].map((o) => o.label), ["Avocado", "Banana"]);
});

test("wardrobe keeps the two-panel sheet and never asks for a back view (Oct 28)", () => {
  const prompt = wardrobePrompt("flux-3-klein", [{ piece: "full", words: "a knight costume" }]);
  assert.ok(prompt.includes("exactly two side-by-side panels") && prompt.includes("Right panel: the same full-length shot from the front"));
  assert.ok(!/back view|turned completely around|heels/.test(prompt));
});

test("Qwen shot planner: text workflow, prompts and reading its reply (Oct 29)", async () => {
  const { textWorkflow } = await import("../lib/workflows.ts");
  const { plannerPrompt, plannerSystem, readShots } = await import("../lib/director.ts");
  const built = textWorkflow({ system: "s", prompt: "p", seed: 7 });
  assert.equal(built.graph.clip.inputs.type, "moss_image");
  assert.equal(built.graph.write.class_type, "TextGenerate");
  assert.equal(built.graph.write.inputs["sampling_mode.seed"], 7);
  assert.equal(built.graph.save.class_type, "SaveText");
  assert.ok(plannerSystem(6).includes("exactly 6 shots") && plannerSystem(6).includes("Detail insert"));
  const prompt = plannerPrompt({ brief: "@Joolio shows off his sneakers", count: 6, format: "ugc", cast: [{ name: "Joolio", description: "An owl." }], look: "photo", product: "lavender sneakers" });
  assert.ok(prompt.includes("product is the hero") && prompt.includes("Idea: Joolio shows off his sneakers") && prompt.includes("Joolio: An owl."));
  const reply = 'Sure!\n```json\n[{"framing":"wide","angle":"low angle","action":"Joolio bursts through the door"},{"framing":"Detail insert","angle":"Top-down","action":"The sneakers land on the bed"},{"framing":"Selfie","angle":"x","action":"Joolio grins"}]\n```';
  const shots = readShots(reply, 3)!;
  assert.equal(shots.length, 3);
  assert.equal(shots[0].framing, "Wide shot");
  assert.equal(shots[0].angle, "Low angle");
  assert.equal(shots[2].framing, "Medium shot");
  assert.equal(readShots("no json here", 3), undefined);
  assert.equal(readShots("<think>[1,2]</think> [{\"action\":\"A\"}]", 4), undefined);
});

test("planner sees the product photo, stays grounded, and creatures don't grin (Oct 29)", async () => {
  const { textWorkflow } = await import("../lib/workflows.ts");
  const { plannerPrompt, noHumanMouth } = await import("../lib/director.ts");
  const seeing = textWorkflow({ system: "s", prompt: "p", seed: 1, image: true });
  assert.deepEqual(seeing.images, ["ref0"]);
  assert.deepEqual(seeing.graph.write.inputs.image, ["small", 0]);
  assert.equal(textWorkflow({ system: "s", prompt: "p", seed: 1 }).graph.write.inputs.image, undefined);
  const p = plannerPrompt({ brief: "show it off", count: 6, format: "ugc", cast: [], look: "photo", productPhoto: true });
  assert.ok(p.includes("exactly the item in the attached photo") && p.includes("never replace it with another object"));
  assert.ok(p.includes("nothing magical, glowing, floating or holographic"));
  assert.ok(!plannerPrompt({ brief: "x", count: 2, format: "story", cast: [], look: "film", weird: 3 }).includes("nothing magical"));
  assert.equal(noHumanMouth("Joolio leans back to grin at the viewer, smiling"), "Joolio leans back to beam at the viewer, beaming");
  assert.equal(noHumanMouth("He grins and smiles"), "He beams and beams");
});

test("a one-piece wardrobe swap leads with the change (owl shoes, Oct 29)", () => {
  const prompt = wardrobePrompt("flux-3-klein", [{ piece: "shoes", image: "x" }], { character: "An owl." });
  assert.ok(prompt.startsWith("Edit <ref_image_0>: change only the shoes. Replace the character's shoes with the exact shoes shown in <ref_image_1>"));
  assert.ok(prompt.includes("worn on both feet, clearly visible in the full-length panel. Everything else stays exactly as in <ref_image_0>"));
  assert.ok(!wardrobePrompt("flux-3-klein", [{ piece: "full", words: "a knight costume" }]).startsWith("Edit"));
  // The picture is the only truth on a swap: no saved description, and the rest is named to keep (beanie, Oct 29).
  assert.ok(!prompt.includes("An owl.") && prompt.includes("Keep every other piece exactly as in <ref_image_0>, with nothing added or taken away: any hat, glasses, sunglasses and jewelry, the top, any jacket, the trousers, skirt or shorts, the bag and other accessories"));
  assert.ok(wardrobePrompt("flux-3-klein", [{ piece: "full", words: "x" }], { character: "An owl." }).includes("(An owl.)"));
});

test("custom prompts survive sheet recovery without replacing the saved image prompt", async () => {
  const { fromSaved } = await import("../lib/restore.ts");
  const recovered = fromSaved({ path: "custom-sheet.png", details: { prompt: "Final model prompt", customPrompt: "A revised character sheet", createdAt: "2026-10-29T12:00:00Z" } });
  assert.equal(recovered.customPrompt, "A revised character sheet");
  assert.equal(recovered.prompt, "Final model prompt");
  assert.equal(fromSaved({ path: "legacy.png", details: {} }).customPrompt, undefined);
});

test("storyboards can inherit a setting from the description while legacy custom formats still load", async () => {
  const { storyboardPrompt, planShots, isFormat, sceneChips } = await import("../lib/scene.ts");
  const shots = planShots("Gabe opens a letter", 4, "story", "Gabe");
  const prompt = storyboardPrompt("qwen-2.1", shots, { cast: [{ name: "Gabe" }], look: "film", ratio: "16:9", brief: "Gabe opens a letter in a quiet library." });
  assert.ok(prompt.includes("Scene context, including the setting: Gabe opens a letter in a quiet library."));
  assert.equal(isFormat("custom"), true);
  const info = sceneChips({ cast: [], where: "brief", scene: "Old preset", location: "", look: "film", ratio: "16:9", shots }, []);
  assert.deepEqual(info.find((g) => g.label === "Where")?.values, ["From description"]);
});

test("workflows/ files match the code (run npm run workflows after changing lib/workflows.ts)", async () => {
  const { readFile } = await import("node:fs/promises");
  const { workflowFiles, workflowJson } = await import("../lib/workflow-exports.ts");
  for (const w of workflowFiles) {
    const onDisk = await readFile(new URL(`../workflows/${w.file}`, import.meta.url), "utf8");
    assert.equal(onDisk, workflowJson(w), `${w.file} is out of date`);
    assert.ok(!onDisk.includes('"image": ""'), `${w.file} has an empty LoadImage`);
  }
});

test("Qwen edits that change one image size from it, like Comfy's template (Oct 30)", () => {
  const same = buildWorkflow("qwen-2.1", { task: "edit", prompt: "p", references: [1, 2], width: 1824, height: 1024, seed: 1, sameSize: true });
  assert.deepEqual(same.graph.sample.inputs.latent_image, ["text", 2]);
  assert.equal(same.graph.latent, undefined);
  assert.equal(same.graph.text.inputs.resolution, 0);
  const board = buildWorkflow("qwen-2.1", { task: "edit", prompt: "p", references: [1], width: 1056, height: 1888, seed: 1 });
  assert.deepEqual(board.graph.sample.inputs.latent_image, ["latent", 0]);
});
