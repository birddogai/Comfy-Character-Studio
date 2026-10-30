import assert from "node:assert/strict";
import test from "node:test";
import { lookChips, shotChips } from "../lib/details.ts";
import { defaultSelection, fields, fitKind, identityDescription, characterPrompt, isColor, isSelection, randomSelection, type Field } from "../lib/character.ts";

test("character tiles become visible prompt text in a three-panel sheet", () => {
  const prompt = characterPrompt({ ...defaultSelection, proportions: ["long-legs", "broad-shoulders"], accessories: ["cap"] }, "Always wears a gold locket");
  for (const text of ["two side-by-side panels", "Right panel: a full-length shot with a 35mm lens at eye level, front view", "original, fictional character", "woman in their late 20s", "warm medium-tan skin", "long wavy dark brown hair", "very long legs that make up about two-thirds of the full height, the hips well above the middle of the body and very broad shoulders", "freckles", "Wearing a complete streetwear outfit from top to shoes", "Always wears a gold locket"]) {
    assert.ok(prompt.includes(text), `missing "${text}" in: ${prompt}`);
  }
});

test("every option has a unique id, a label and prompt words", () => {
  assert.equal(new Set(fields.map((f) => f.id)).size, fields.length);
  for (const field of fields as readonly Field[]) {
    assert.equal(new Set(field.options.map((o) => o.id)).size, field.options.length, `${field.id} has duplicate ids`);
    for (const option of field.options) {
      assert.ok(option.label, `${field.id}/${option.id} needs a label`);
      if (!(field.id === "facialHair" && option.id === "none") && !(field.id === "decade" && option.id === "today")) assert.ok(option.prompt, `${field.id}/${option.id} needs prompt words`);
    }
  }
  for (const option of fields.find((f) => f.id === "hairStyle")!.options) {
    if (option.id !== "bald") assert.ok(option.prompt.includes("{color}"), `${option.id} should mention the hair color`);
  }
});

test("creatures keep the user's picks and skip human-only fields", () => {
  const fox = { ...defaultSelection, kind: ["fox"], hairStyle: ["bowl"], hairColor: ["silver"] };
  const prompt = characterPrompt(fox);
  assert.ok(prompt.includes("an upright fox creature with the personality of a woman in their late 20s"));
  assert.ok(prompt.includes("rounded silver grey bowl cut"));
  assert.ok(!prompt.includes("medium-tan") && !prompt.includes("oval face") && !prompt.includes("makeup"));
  const teal = characterPrompt(fox, "", {}, "#1288af");
  assert.ok(teal.includes("a fox whose fur is entirely deep teal blue all over, instead of its natural colors"));
  assert.ok(!teal.includes("#1288af") && !teal.includes("russet fur") && !teal.includes("skin, fur or feathers"));
});

test("a face reference is named as the first reference image", () => {
  const face = characterPrompt(defaultSelection, "", { face: true });
  assert.ok(face.includes("The person in the first reference image"));
  assert.ok(!face.includes("fictional") && !face.includes("styling from"));
});

test("the saved description says who they are, not what they wear", () => {
  const text = identityDescription({ ...defaultSelection, kind: ["owl"] });
  assert.ok(text.startsWith("An upright great horned owl creature with the personality of a woman in their late 20s"));
  assert.ok(text.includes("Athletic build"));
  assert.ok(!text.includes("streetwear"));
});

test("only listed options and allowed counts pass validation", () => {
  assert.equal(isSelection(defaultSelection), true);
  assert.equal(isSelection({ ...defaultSelection, eyes: ["laser"] }), false);
  assert.equal(isSelection({ ...defaultSelection, eyes: ["blue", "green"] }), false);
  assert.equal(isSelection({ ...defaultSelection, eyes: [] }), false);
  assert.equal(isSelection({ ...defaultSelection, features: ["freckles", "freckles"] }), false);
  assert.equal(isSelection({ ...defaultSelection, accessories: ["cap", "bag", "glasses", "beanie"] }), false);
  assert.equal(isSelection({ ...defaultSelection, style: undefined }), false);
  for (let i = 0; i < 50; i++) assert.equal(isSelection(randomSelection()), true);
  assert.equal(isColor("#7FD1C7"), true);
  assert.equal(isColor("red"), false);
});

test("creatures get a real animal head, not a mask", () => {
  const owl = { ...defaultSelection, kind: ["owl"] };
  assert.ok(characterPrompt(owl).includes("not a mask or costume"));
  assert.ok(identityDescription(owl).includes("not a mask or costume"));
  assert.ok(!characterPrompt(defaultSelection).includes("mask"));
});

test("wings, tails and fins come out through the clothes", () => {
  const moth = { ...defaultSelection, kind: ["moth"] };
  assert.ok(characterPrompt(moth).includes("The wings grow out of the body and come out through openings"));
  assert.ok(characterPrompt(moth).includes("the wings clearly visible from the front, spreading out beside the body"));
  assert.ok(characterPrompt(moth).includes("cut with slits at the back for the wings"));
  assert.ok(identityDescription(moth).includes("attached on top of the fabric"));
  assert.ok(characterPrompt(defaultSelection, "a long fox tail").includes("The tail grows out"));
  assert.ok(!characterPrompt(defaultSelection, "a high ponytail").includes("openings in the clothing"));
  assert.ok(!characterPrompt(defaultSelection).includes("openings in the clothing"));
});

test("details chips use tile labels, skip unused fields and show extras", () => {
  const chips = lookChips({ selection: { ...defaultSelection, kind: ["owl"], accessories: ["cap", "jewelry"] }, color: "#7fd1c7", detail: "Gold locket" });
  const find = (label: string) => chips.find((g) => g.label === label)?.values;
  assert.deepEqual(find("Character type"), ["Owl"]);
  assert.deepEqual(find("Accessories"), ["Cap", "Jewelry"]);
  assert.deepEqual(find("Custom color"), ["#7fd1c7"]);
  assert.deepEqual(find("Signature detail"), ["Gold locket"]);
  assert.equal(find("Skin"), undefined);
  assert.equal(find("Makeup"), undefined);
  assert.equal(find("Proportions"), undefined);
  assert.deepEqual(shotChips({ scene: "White photo studio", outfit: "Same outfit as the reference", pose: "Seated and relaxed", expression: "Natural, as in the pose", camera: "Front-camera selfie", ratio: "1:1" }, "Holding a record").at(-1), { label: "Extra direction", values: ["Holding a record"] });
});

test("weirdness exaggerates every feature early in the prompt, and is off by default", async () => {
  const { weirdLine } = await import("../lib/character.ts");
  assert.equal(weirdLine(0), "");
  const plain = characterPrompt(defaultSelection);
  const weird = characterPrompt(defaultSelection, "", {}, undefined, 3);
  assert.ok(!plain.includes("exaggerated"));
  assert.ok(weird.includes("They are a surreal, uncanny version of themselves: a huge swollen head three times too big for the body"));
  assert.ok(weird.includes("Their long wavy") && weird.includes("are each pushed to an unhinged, surreal extreme"));
  assert.ok(weird.includes("not a monster") && !weird.includes("spidery") && !weird.includes("bloodshot"));
  // Like the creatures (Oct 30): no fixed grin, face paint or body shape that fights the picks.
  assert.ok(!weird.includes("grin") && !weird.includes("face paint") && !weird.includes("tiny waist"));
  assert.ok(weird.indexOf("caricature") < weird.indexOf("Right panel"));
  assert.ok(identityDescription(defaultSelection, undefined, {}, 2).includes("They are a caricature of themselves"));
  assert.ok(!plain.includes("They are a"));
  // With a face photo the likeness is kept: the face and head are not caricatured.
  const photo = characterPrompt(defaultSelection, "", { face: true }, undefined, 3);
  assert.ok(photo.includes("only a likeness guide") && !photo.includes("swollen head") && photo.includes("the hair absurdly huge"));
  assert.ok(characterPrompt({ ...defaultSelection, hairStyle: ["bob"], height: ["very-tall"] }, "", {}, undefined, 2).includes("Their sleek chin-length bob, athletic build, very tall and towering"));
  const banana = characterPrompt({ ...defaultSelection, kind: ["banana"] }, "", {}, undefined, 3);
  assert.ok(banana.includes("The banana is a grotesque, surreal nightmare version of itself") && banana.includes("exactly the same face in every panel"));
  assert.ok(!banana.includes("Every picked feature"));
  assert.ok(banana.includes("the eyes and mouth set into the banana's own surface fill the frame"));
});

test("creature hair is a wig sitting on the animal's crown, in its own sentence", () => {
  const opossum = characterPrompt({ ...defaultSelection, kind: ["opossum"] });
  assert.ok(opossum.includes("In every panel it wears a long wavy dark brown wig on top of the Virginia opossum's head, sitting on the crown between the ears"));
  assert.ok(opossum.includes("the wig is clearly bright cherry red") || opossum.includes("the wig is clearly"));
  assert.ok(!opossum.includes("long wavy dark brown hair"));
  assert.ok(identityDescription({ ...defaultSelection, kind: ["opossum"] }).includes("wig on top of the Virginia opossum's head"));
  const bald = characterPrompt({ ...defaultSelection, kind: ["opossum"], hairStyle: ["bald"] });
  assert.ok(!bald.includes("wig"));
  assert.ok(characterPrompt(defaultSelection).includes("long wavy dark brown hair"));
});

test("unhinged creatures name the animal's own parts, in the panels too", () => {
  const off = characterPrompt({ ...defaultSelection, kind: ["opossum"] });
  const wild = characterPrompt({ ...defaultSelection, kind: ["opossum"] }, "", {}, undefined, 3);
  assert.ok(off.includes("big-budget live-action film") && off.includes("a relaxed, friendly expression") && !off.includes("nightmare"));
  assert.ok(wild.includes("This Virginia opossum is a surreal, uncanny nightmare version: a huge swollen head"));
  assert.ok(wild.includes("a nightmare caricature with a huge swollen head") && wild.includes("an unhinged, manic expression") && !wild.includes("grin"));
  assert.ok(wild.includes("surreal live-action horror-comedy") && !wild.includes("Every picked feature"));
  assert.ok(identityDescription({ ...defaultSelection, kind: ["opossum"] }, undefined, {}, 3).includes("nightmare version"));
});

test("weird objects and robots change their own body, face, limbs and panels, not just one sentence", () => {
  const plant = { ...defaultSelection, kind: ["houseplant"] };
  const off = characterPrompt(plant);
  const wild = characterPrompt(plant, "", {}, undefined, 3);
  assert.ok(off.includes("keeps the real") && off.includes("shape, proportions, color and texture") && off.includes("slightly uncanny") && off.includes("Exactly two slim, toned arms"));
  assert.ok(!wild.includes("shape, proportions, color and texture") && wild.includes("grotesquely warped"));
  assert.ok(wild.includes("enormous bulging bloodshot wet eyes") && wild.includes("gangly, spidery arms") && wild.includes("long, bony-fingered hands"));
  assert.ok(wild.includes("its grotesque warped proportions, spidery limbs and enormous face plain to see"));
  assert.ok(wild.includes("showing the enormous mismatched eyes") && wild.includes("like a nightmare caught on camera") && !wild.includes("${"));
  assert.ok(!wild.includes("-colored its "));
  assert.ok(characterPrompt(plant, "", {}, undefined, 2).includes("bulging wet eyes twice too big"));
  const robot = { ...defaultSelection, kind: ["robot"] };
  const bot = characterPrompt(robot, "", {}, undefined, 3);
  assert.ok(bot.includes("This robot is a surreal, uncanny nightmare machine") && !bot.includes("Every picked feature") && !bot.includes("friendly humanoid"));
  assert.ok(characterPrompt(robot).includes("a friendly humanoid robot"));
});

test("tiles that can't go together swap, and old saves holding both use only the first", async () => {
  const { withPick, cleanPicks, findField, randomSelection } = await import("../lib/character.ts");
  const acc = findField("accessories");
  assert.deepEqual(withPick(acc, ["glasses", "cap"], "beanie"), ["glasses", "beanie"]);
  assert.deepEqual(withPick(acc, ["glasses"], "sunglasses"), ["sunglasses"]);
  assert.deepEqual(withPick(findField("proportions"), ["long-legs", "big-head"], "short-legs"), ["big-head", "short-legs"]);
  assert.deepEqual(cleanPicks(acc, ["cap", "beanie", "bag"]), ["cap", "bag"]);
  const old = characterPrompt({ ...defaultSelection, accessories: ["glasses", "beanie", "cap"], proportions: ["short-legs", "long-legs"] });
  assert.ok(old.includes("a beanie worn on the head") && !old.includes("baseball cap"));
  assert.ok(old.includes("short stubby legs") && !old.includes("very long legs"));
  for (let i = 0; i < 100; i++) {
    const r = randomSelection();
    assert.ok(!(r.accessories.includes("cap") && r.accessories.includes("beanie")));
    assert.ok(!(r.proportions.includes("long-legs") && r.proportions.includes("short-legs")));
  }
});

test("height and proportions are said in the front panel, and height no longer says lanky", () => {
  const p = characterPrompt({ ...defaultSelection, build: ["bodybuilder"], height: ["very-tall"], proportions: ["big-head"] });
  assert.ok(p.includes("Right panel: a full-length shot with a 35mm lens at eye level, front view from head to feet, standing relaxed and facing the camera, toes and palms toward the camera, revealing the overall exaggerated proportions, including a very tall, towering figure and a huge head."));
  assert.ok(!p.includes("lanky"));
  assert.ok(!characterPrompt(defaultSelection).includes("revealing the overall"));
  assert.ok(!characterPrompt(defaultSelection).includes("holding") && !characterPrompt(defaultSelection).includes("creator"));
  assert.ok(characterPrompt({ ...defaultSelection, proportions: ["long-neck", "long-legs"] }).includes("revealing the overall exaggerated proportions, including a noticeably long, slender neck and very long legs that make up about two-thirds of the full height, the hips well above the middle of the body."));
});

test("hair shows under headwear; outfits with a choice pick by gender", () => {
  const capped = characterPrompt({ ...defaultSelection, accessories: ["cap"] });
  assert.ok(capped.includes("with the hair still clearly showing below and around the cap"));
  assert.ok(!characterPrompt({ ...defaultSelection, accessories: ["cap"], hairStyle: ["bald"] }).includes("still clearly showing"));
  // Styles are moods now (Oct 29): no garments named, the model picks them.
  const man = characterPrompt({ ...defaultSelection, gender: ["man"], style: ["goth"] });
  assert.ok(man.includes("a complete goth outfit from top to shoes") && man.includes("in a men's cut and fit") && !man.includes("{"));
});

test("robots get LED eyes and molded hair; animals skip human-only features", () => {
  const bot = characterPrompt({ ...defaultSelection, kind: ["robot"], eyes: ["blue"] });
  assert.ok(bot.includes("glowing blue LED eyes") && bot.includes("molded from glossy painted plastic"));
  const bearded = characterPrompt({ ...defaultSelection, kind: ["robot"], facialHair: ["braided-beard"] });
  assert.ok(bearded.includes("a long braided beard growing from the chin and jaw, hanging down the middle of the chest, dark brown, molded from glossy painted plastic and fixed to the face along the chin and jaw"));
  const fox = characterPrompt({ ...defaultSelection, kind: ["fox"], features: ["pointed-ears", "dimples", "gold-grill"] });
  assert.ok(!fox.includes("long pointed ears") && !fox.includes("dimples") && fox.includes("a shiny gold grill over its front teeth"));
  assert.ok(characterPrompt({ ...defaultSelection, features: ["dimples"] }).includes("deep dimples"));
});

test("animal wigs keep their color attached; beards say their color, and animals wear theirs in its own sentence", () => {
  const fox = { ...defaultSelection, kind: ["fox"], hairStyle: ["comet-ponytail"], hairColor: ["cherry"], facialHair: ["braided-beard"] };
  const p = characterPrompt(fox);
  assert.ok(p.includes("it wears a bright cherry red wig sculpted into a long ponytail"));
  assert.ok(p.includes("the wig is clearly bright cherry red, a different color from the fur"));
  assert.ok(p.includes("In every panel it also wears a bright cherry red long braided beard") && p.includes("attached to the fox's chin"));
  assert.ok(characterPrompt({ ...fox, hairStyle: ["afro"] }).includes("it wears a wig styled as a full rounded bright cherry red afro"));
  assert.ok(!characterPrompt({ ...fox, facialHair: ["stubble"] }).includes("stubble"));
  assert.ok(characterPrompt({ ...defaultSelection, gender: ["man"], facialHair: ["full-beard"], hairColor: ["copper"] }).includes("a full beard in copper red"));
});

test("custom colors are said in words, for what the character is made of", async () => {
  const { colorName } = await import("../lib/colors.ts");
  assert.equal(colorName("#1288af"), "deep teal blue");
  assert.equal(colorName("#7fd1c7"), "pale aqua");
  assert.equal(colorName("#ff0000"), "bright red");
  assert.equal(colorName("nope"), "nope");
  assert.ok(characterPrompt({ ...defaultSelection, kind: ["owl"] }, "", {}, "#ff69b4").includes("whose feathers are entirely hot pink"));
  assert.ok(characterPrompt({ ...defaultSelection, kind: ["robot"] }, "", {}, "#ff69b4").includes("body panels and casing painted hot pink"));
  assert.ok(characterPrompt(defaultSelection, "", {}, "#1288af").includes("deep teal blue skin all over, like full body paint"));
  assert.ok(characterPrompt({ ...defaultSelection, kind: ["banana"] }, "", {}, "#ff69b4").includes("tinted hot pink"));
});

test("stylized 3D names its animated features in every panel and drops realistic wording", () => {
  const p = characterPrompt({ ...defaultSelection, kind: ["stylized"] });
  assert.ok(p.startsWith("A 3D animated-movie character sheet") && p.includes("Right panel: a full-length shot of the animated character with a 35mm lens at eye level, front view from head to feet"));
  assert.ok(p.includes("big expressive eyes about twice real size") && p.includes("not a real person"));
  assert.ok(p.includes("rendered in the same 3D animated-movie style") && p.includes("clean 3D animated-film rendering"));
  assert.ok(!p.includes("lifelike") && !p.includes("realistic texture"));
  assert.ok(characterPrompt(defaultSelection).includes("realistic texture"));
});

test("objects show their gender in the face, and a cropped top keeps its sleeves and print", () => {
  const berry = characterPrompt({ ...defaultSelection, kind: ["strawberry"], gender: ["woman"] }, "", {}, undefined, 3);
  assert.ok(berry.includes("She clearly reads as female: long curled eyelashes and a touch of lipstick on the mouth set into the strawberry"));
  assert.ok(!berry.includes("full glossy lips"));
  const plain = characterPrompt({ ...defaultSelection, kind: ["strawberry"] });
  assert.ok(plain.includes("between the eyes and the mouth there is only the strawberry's own surface, with no nose"));
  assert.ok(plain.includes("the strawberry itself forming the whole head and torso, most of the character's height, down to where the short legs grow straight out of its bottom"));
  assert.ok(plain.includes("It wears a graphic hoodie, baggy cargo trousers and chunky sneakers: relaxed urban fits, layered casual pieces and sneaker-culture attitude, in a women's cut and fit, fitted to its strawberry body"));
  assert.ok(plain.includes("the bottoms and shoes are worn on its legs and feet below the strawberry"));
  assert.ok(characterPrompt({ ...defaultSelection, kind: ["strawberry"], style: ["runway"] }).includes("sculptural, unexpected silhouettes"));
  assert.ok(plain.includes("the top is cropped short and sits just below its face, its neckline showing at the bottom of the close-up, any jacket worn open") && !plain.includes("oversized white graphic tee"));
  assert.ok(plain.includes("no human hips, thighs or muscles"));
  assert.ok(berry.indexOf("She clearly reads as female") < berry.indexOf("Exactly two"));
  assert.ok(characterPrompt({ ...defaultSelection, kind: ["toaster"], gender: ["man"] }).includes("He clearly reads as male"));
  assert.ok(identityDescription({ ...defaultSelection, kind: ["banana"], gender: ["woman"] }).includes("She clearly reads as female"));
  assert.ok(berry.includes("posing like a woman with one hand on her hip") && berry.includes("with her long curled eyelashes and lipstick clearly visible."));
  assert.ok(!berry.includes("seen from directly behind") && berry.includes("Right panel: a full-length shot of the front of the whole strawberry"));
  assert.ok(berry.includes("a giant strawberry that stands, poses and gestures like a person") && berry.includes("real anthropomorphic strawberry"));
});

test("a face photo on an object shapes the face set into it, not a person wearing it", () => {
  const p = characterPrompt({ ...defaultSelection, kind: ["strawberry"] }, "", { face: true });
  assert.ok(p.startsWith("A hyper-realistic studio photograph laid out as two side-by-side panels of equal size of the same anthropomorphic strawberry character"));
  assert.ok(p.includes("modeled on the face of the person in the first reference image: their eye shape, eyebrows, smile and expression, clearly recognizable as them, but made of the strawberry's own surface"));
  assert.ok(p.includes("the same eye color as the person in the reference") && !p.includes("reimagined") && !p.includes("long wavy dark brown hair"));
  assert.ok(identityDescription({ ...defaultSelection, kind: ["strawberry"] }, undefined, { face: true }).includes("modeled on the face of the person"));
});

test("a decade restyles the outfit and grooming; Today adds nothing; old saves still work", async () => {
  const { upgradeSelection, isSelection } = await import("../lib/character.ts");
  const forties = characterPrompt({ ...defaultSelection, style: ["tailoring"], decade: ["1940s"] });
  assert.ok(forties.includes("Wearing a complete tailored outfit") && forties.includes("styled in the 1940s: its cuts, fabrics, colors and silhouettes are unmistakably 1940s") && !forties.includes("pinstripes"));
  assert.ok(forties.includes("nothing is added that wasn't picked, so the character clearly looks like someone from the 1940s"));
  assert.ok(!characterPrompt(defaultSelection).includes("set in the"));
  // Era items only replace what was picked: no cap unless Cap was picked.
  const twenties = characterPrompt({ ...defaultSelection, decade: ["1920s"] });
  assert.ok(!twenties.includes("newsboy") && !twenties.includes("cloche"));
  const capped = characterPrompt({ ...defaultSelection, decade: ["1920s"], accessories: ["cap", "sunglasses"] });
  assert.ok(capped.includes("a 1920s newsboy cap worn on the head") && capped.includes("small round tinted 1920s sunglasses") && !capped.includes("baseball cap"));
  assert.ok(characterPrompt({ ...defaultSelection, kind: ["strawberry"], decade: ["1980s"] }).includes("unmistakably 1980s"));
  // A look saved before the decade existed, with the removed Disco style.
  const old: Record<string, unknown> = { ...defaultSelection, style: ["disco"] };
  delete old.decade;
  const up = upgradeSelection(old) as typeof defaultSelection;
  assert.deepEqual(up.style, ["streetwear"]);
  assert.deepEqual(up.decade, ["1970s"]);
  assert.ok(isSelection(up));
  assert.ok(isSelection(upgradeSelection({ ...defaultSelection, decade: undefined })));
});

test("bolder features for absurd characters, skipped where they can't apply", () => {
  const p = characterPrompt({ ...defaultSelection, features: ["big-forehead", "gap-teeth", "pointy-nose", "jowls", "unibrow"] });
  for (const w of ["a huge, tall, bulging forehead", "a wide gap between the two front teeth", "a long, sharply pointed nose", "heavy sagging jowls", "one thick dark band of hair running straight across the forehead"]) assert.ok(p.includes(w), w);
  const fox = characterPrompt({ ...defaultSelection, kind: ["fox"], features: ["pointy-nose", "big-ears", "gap-teeth"] });
  assert.ok(!fox.includes("sharply pointed nose") && !fox.includes("stick far out") && fox.includes("a wide gap between its two front teeth"));
});

test("a whole-person photo keeps their face and body; the Body tiles step aside", () => {
  const sel = { ...defaultSelection, build: ["bodybuilder"], height: ["very-tall"], proportions: ["big-head"] };
  const body = characterPrompt(sel, "", { face: true, body: true });
  assert.ok(body.includes("keeping their exact face, features, skin tone, body shape, height and proportions, restyled with the hair, outfit and details below"));
  assert.ok(body.includes("with the same body as the person in the first reference image") && !body.includes("bodybuilder") && !body.includes("towering"));
  const faceOnly = characterPrompt(sel, "", { face: true });
  assert.ok(faceOnly.includes("keeping their exact face, features and skin tone") && faceOnly.includes("bodybuilder"));
});

test("head shapes are bold silhouettes; both panels are one photo session; a hat sits over an object's topping", () => {
  assert.ok(characterPrompt({ ...defaultSelection, face: ["egg"] }).includes("a tall egg-shaped head"));
  assert.ok(characterPrompt({ ...defaultSelection, face: ["caveman"] }).includes("a heavy jutting brow ridge"));
  const p = characterPrompt({ ...defaultSelection, kind: ["fox"] });
  assert.ok(p.indexOf("Right panel: a full-length shot with a 35mm lens at eye level, front view") < p.indexOf("Left panel: an extreme close-up portrait of the same character, a tight headshot with an 85mm portrait lens, framed from the forehead to the chin, the face filling the frame"));
  assert.ok(!p.includes("head-and-shoulders") && !p.includes("to the shoulders"));
  assert.ok(p.includes("Both panels are two shots of the same character from one photo shoot"));
  const avocado = characterPrompt({ ...defaultSelection, kind: ["avocado"], accessories: ["cap"] });
  assert.ok(avocado.includes("Left panel: an extreme close-up portrait of the same avocado, a tight headshot") && !avocado.includes("down to its chest"));
  assert.ok(avocado.includes("the hat sits on top of the dark brown wig") && avocado.includes("wearing a baseball cap in mustard yellow on its top"));
});

test("robots get a metal face plate, not a human face (FLUX 3 Klein, Oct 27)", () => {
  const sel = { ...defaultSelection, kind: ["retro-bot"], gender: ["woman"], features: ["freckles"] };
  const prompt = characterPrompt(sel);
  assert.ok(prompt.includes("one fully clothed robot character"));
  assert.ok(prompt.includes("extreme close-up portrait of the same robot") && !prompt.includes("forehead"));
  assert.ok(prompt.includes("painted tin face plate") && prompt.includes("not human skin"));
  assert.ok(prompt.includes("freckles across the nose and cheeks, painted onto the metal face plate"));
  assert.ok(!prompt.includes("a woman's body") && prompt.includes("narrow-waisted chassis"));
  // People keep the face close-up.
  assert.ok(characterPrompt(defaultSelection).includes("framed from the forehead to the chin"));
});

test("FLUX 3 (Klein and cloud) gets the short sheet prompt with the body shape in the full-body panel", () => {
  const sel = { ...defaultSelection, kind: ["retro-bot"], height: ["tall"], proportions: ["long-legs", "big-head"], decade: ["1940s"] };
  const full = characterPrompt(sel, "", {}, undefined, 1, "qwen-2.1");
  for (const model of ["flux-3-klein"]) {
    const short = characterPrompt(sel, "", {}, undefined, 1, model);
    assert.ok(short.includes("Right panel: a full-length shot of the whole robot, head to toe, front view, with a tall figure, very long legs that make up about two-thirds of the full height and a huge head, exaggerated and obvious"));
    assert.ok(short.split(" ").length < full.split(" ").length * 0.7);
    assert.ok(short.includes("unmistakably 1940s in its cuts, fabrics and colors") && short.includes("painted tin face plate"));
  }
  assert.equal(characterPrompt(sel, "", {}, undefined, 1), full);
  // A picked big head turns the Bold line's "is a head a little too big" into "has".
  assert.ok(full.includes("This robot has LED eyes a little too large") && !full.includes("a head a little too big"));
});

test("a picked hat stays on in the close-up (chameleon, Oct 28)", () => {
  const sel = { ...defaultSelection, kind: ["chameleon"], accessories: ["cap"], decade: ["1940s"] };
  const prompt = characterPrompt(sel);
  assert.ok(prompt.includes("framed from the top of a 1940s fedora to the chin, the same 1940s fedora worn exactly as in the full-length shot"));
  assert.ok(!prompt.includes("from the forehead"));
  assert.ok(characterPrompt(sel, "", {}, undefined, 0, "flux-3-klein").includes("still wearing a 1940s fedora"));
  assert.ok(characterPrompt(defaultSelection).includes("framed from the forehead to the chin"));
});

test("picks that can't both be true are made to add up (Oct 28)", () => {
  const tall = characterPrompt({ ...defaultSelection, height: ["tall"], proportions: ["short-legs", "big-head"], face: ["tiny"] });
  assert.ok(tall.includes("a very long torso that makes up most of the height"));
  assert.ok(!tall.includes("small head"));
  assert.ok(characterPrompt({ ...defaultSelection, height: ["petite"], proportions: ["long-legs"] }).includes("a very short torso"));
  assert.ok(!characterPrompt({ ...defaultSelection, proportions: ["short-legs"] }).includes("torso"));
});

test("caption-style wording from Midjourney's describe (Oct 29)", () => {
  const sel = { ...defaultSelection, proportions: ["short-legs"] };
  const p = characterPrompt(sel, "", {}, undefined, 2);
  assert.ok(p.includes("a real-looking woman in their late 20s, with exaggerated, surreal proportions"));
  assert.ok(p.includes("the neckline of the same outfit just visible at the bottom edge"));
  assert.ok(p.includes("dressed as a caricature character, the exaggerated features made with realistic prosthetics"));
  assert.ok(!characterPrompt(sel, "", {}, undefined, 1).includes("caricature character"));
  assert.ok(!characterPrompt(defaultSelection).includes("surreal proportions"));
});

test("accessories are named in both panels, and jewelry is concrete (Oct 29)", () => {
  const p = characterPrompt({ ...defaultSelection, accessories: ["glasses", "jewelry", "bag"] });
  assert.ok(p.includes("clearly wearing thin-framed glasses, layered gold chain necklaces, gold hoop earrings and stacked rings and a crossbody bag. Left panel"));
  assert.ok(p.includes("with the same thin-framed glasses and layered gold chain necklaces, gold hoop earrings and stacked rings clearly visible"));
  assert.ok(!p.includes("layered jewelry"));
});

test("headphones: on the head, around the neck under a hat, and wired in older decades", () => {
  const base = { ...defaultSelection, accessories: ["headphones"] };
  assert.ok(characterPrompt(base).includes("over-ear headphones worn over the ears on the head"));
  assert.ok(characterPrompt({ ...base, accessories: ["headphones", "cap"] }).includes("worn around the neck"));
  assert.ok(characterPrompt({ ...base, decade: ["1980s"] }).includes("1980s wired foam-pad Walkman-style headphones") && characterPrompt({ ...base, decade: ["1980s"] }).includes("one short, neat cord"));
});

test("animal outfits, mustaches and brows", () => {
  const owl = characterPrompt({ ...defaultSelection, kind: ["owl"], facialHair: ["mustache"], features: ["unibrow"], eyes: ["two-tone"] });
  assert.ok(owl.includes("fully dressed in a complete streetwear outfit from top to shoes") && owl.includes("it wears a graphic hoodie, baggy cargo trousers and chunky sneakers, mostly in deep burgundy, smooth woven fabric with no feathers texture")  && owl.includes("only the head, hands and tail show its feathers"));
  assert.ok(owl.includes("across the top of the") && owl.includes("band of hair running straight across the forehead") && owl.includes("made of hair fixed above the eyes"));
  assert.ok(!owl.includes("exactly two one ") && owl.includes("exactly two eyes, one brown eye and one blue eye"));
});

test("brow picks become one brow; animal-only tiles hidden; fox fur follows age", async () => {
  const { hiddenOption, creatureSpecies } = await import("../lib/character.ts");
  const p = characterPrompt({ ...defaultSelection, features: ["unibrow", "brow-slit", "bleached-brows"] });
  assert.ok(p.includes("one thick pale bleached band of hair running straight across the forehead from one side to the other just above both eyes, unbroken in the middle, cut clean through on the left by a short diagonal shaved line that splits it"));
  assert.ok(!p.includes("a shaved slit in one eyebrow") && !p.includes("bleached eyebrows"));
  const fox = { ...defaultSelection, kind: ["fox"] };
  assert.ok(hiddenOption(fox, "features", "dimples") && !hiddenOption(defaultSelection, "features", "dimples") && !hiddenOption(fox, "features", "unibrow"));
  assert.ok(creatureSpecies({ ...fox, age: ["late-20s"] })!.species.look.includes("bright russet-red fur"));
  assert.ok(creatureSpecies({ ...fox, age: ["60s"] })!.species.look.includes("mostly grey fur"));
  assert.equal(creatureSpecies({ ...fox, build: ["slim"] })!.species.name, "fox");
});

test("animal weirdness pushes the picked tiles; glasses hide the animal's own eyes", async () => {
  const { creatureSpecies } = await import("../lib/character.ts");
  const ax = { ...defaultSelection, kind: ["axolotl"], height: ["very-tall"], proportions: ["long-neck", "short-legs"], accessories: ["sunglasses"] };
  const p = characterPrompt(ax, "", {}, undefined, 2);
  assert.ok(p.includes("Its athletic build, very tall height, long neck, short legs, wig and sunglasses are each pushed to an extreme"), p.slice(0, 0));
  assert.ok(p.includes("two eyes, both hidden behind the lenses of the glasses") && !p.includes("with small round eyes"));
  assert.ok(characterPrompt(ax, "", {}, undefined, 3).includes("an unhinged, surreal nightmare caricature"));
  assert.ok(creatureSpecies(ax));
});

test("animals: male or female only; moth skips mouth and ear tiles; face picks said for fur; western style", async () => {
  const { hiddenOption } = await import("../lib/character.ts");
  const moth = { ...defaultSelection, kind: ["moth"] };
  assert.ok(hiddenOption(moth, "gender", "non-binary") && !hiddenOption(moth, "gender", "woman") && !hiddenOption(defaultSelection, "gender", "non-binary"));
  assert.ok(hiddenOption(moth, "features", "braces") && !hiddenOption({ ...defaultSelection, kind: ["fox"] }, "features", "braces"));
  const panda = characterPrompt({ ...defaultSelection, kind: ["red-panda"], features: ["face-tattoo", "glitter-freckles"] });
  assert.ok(panda.includes("tattoo designs dyed into the fur just below both eyes and in the middle of the forehead") && panda.includes("gold glitter dots"));
  assert.ok(characterPrompt({ ...defaultSelection, kind: ["fox"], style: ["western"] }).includes("cowboy boots"));
});

test("shuffle and type switches keep animals, robots and objects male or female", async () => {
  const { randomSelection, fitKind } = await import("../lib/character.ts");
  for (let i = 0; i < 200; i++) {
    const r = randomSelection();
    if (r.kind[0] !== "true-to-life" && ["trans-man", "trans-woman", "non-binary"].includes(r.gender[0])) {
      const { hiddenOption } = await import("../lib/character.ts");
      assert.ok(!hiddenOption(r, "gender", r.gender[0]), JSON.stringify(r.kind));
    }
  }
  assert.deepEqual(fitKind({ ...defaultSelection, kind: ["fox"], gender: ["trans-woman"] }).gender, ["woman"]);
  assert.deepEqual(fitKind({ ...defaultSelection, gender: ["trans-woman"] }).gender, ["trans-woman"]);
});

test("objects get their face picks on their surface; bald skips the era hairstyle", async () => {
  const { hiddenOption } = await import("../lib/character.ts");
  const toaster = { ...defaultSelection, kind: ["toaster"], hairStyle: ["bald"], decade: ["1920s"], features: ["freckles", "bleached-brows", "beauty-mark", "nose-ring"] };
  const p = characterPrompt(toaster);
  assert.ok(p.includes("freckle-like dots painted across the toaster's surface") && p.includes("bleached, almost white eyebrows") && p.includes("beauty mark beside the mouth"));
  assert.ok(!p.includes("finger waves") && !p.includes("septum"));
  assert.ok(hiddenOption(toaster, "features", "nose-ring") && !hiddenOption(toaster, "features", "freckles"));
});

test("plus-size drops a narrow waist, tall drops short legs; the tile just picked wins", async () => {
  const { fitKind } = await import("../lib/character.ts");
  const both = { ...defaultSelection, build: ["plus-size"], height: ["tall"], proportions: ["narrow-waist", "short-legs"] };
  assert.deepEqual(fitKind(both, Math.random, "build").proportions, []);
  const p = fitKind(both, Math.random, "proportions");
  assert.deepEqual([p.build, p.height, p.proportions], [["average"], ["average"], ["narrow-waist", "short-legs"]]);
});

test("parked types are hidden and never shuffled, but old looks still build", async () => {
  const { hiddenOption, randomSelection } = await import("../lib/character.ts");
  assert.ok(hiddenOption(defaultSelection, "kind", "sneaker") && !hiddenOption(defaultSelection, "kind", "toaster"));
  for (let i = 0; i < 300; i++) assert.notEqual(randomSelection().kind[0], "sneaker");
  assert.ok(characterPrompt({ ...defaultSelection, kind: ["sneaker"] }).includes("sneaker"));
});

test("coffee hairstyles are cream shapes; objects say their height", () => {
  const cup = characterPrompt({ ...defaultSelection, kind: ["coffee-cup"], hairStyle: ["afro"], height: ["very-tall"] });
  assert.ok(cup.includes("a huge round cloud of whipped cream puffed up on top like an afro") && !cup.includes("-colored a "));
  assert.ok(cup.includes("a very tall, stretched, towering figure"));
});

test("owner's strawberry and avocado findings (Oct 30): every pick shows, no fixed sentence fights it", () => {
  const berry = characterPrompt({ ...defaultSelection, kind: ["strawberry"], gender: ["man"], age: ["60s"], facialHair: ["braided-beard"], accessories: ["beanie", "jewelry"], style: ["goth"] });
  assert.ok(berry.includes("wearing a beanie in mustard yellow on its top"));
  assert.ok(berry.includes("Its age shows on its surface: clearly old, wrinkled"));
  assert.ok(berry.includes("In every panel it has a long dark brown braided beard growing out of its surface just below the mouth"));
  assert.ok(berry.includes("the hat sits on top of") && berry.includes("made of mustard yellow fabric"));
  assert.ok(berry.includes("a black velvet choker") && !berry.includes("gold hoop earrings"));
  const avocado = characterPrompt({ ...defaultSelection, kind: ["avocado"], gender: ["man"], features: ["unibrow"], facialHair: ["pencil"], build: ["plus-size"], height: ["tall"] });
  assert.ok(avocado.includes("the neckline of the same top just visible at the bottom edge"));
  assert.ok(!avocado.includes("bushy eyebrows") && avocado.includes("with his single unbroken unibrow clearly visible") && avocado.includes("He clearly reads as male: a gruff expression"));
  assert.ok(avocado.includes("pencil-thin dark brown mustache like a 1940s movie star"));
  assert.ok(avocado.includes("Exactly two thick, chunky arms and exactly two thick, chunky legs") && avocado.includes("heavy-set and plus-size") && !avocado.includes("thin arms"));
  assert.ok(avocado.includes("long legs, as long as its body is tall"));
  assert.ok(identityDescription({ ...defaultSelection, kind: ["avocado"], facialHair: ["goatee"] }).includes("pointed dark brown goatee"));
  // Unhinged keeps its spidery limbs.
  assert.ok(characterPrompt({ ...defaultSelection, kind: ["avocado"], build: ["plus-size"] }, "", {}, undefined, 3).includes("gangly, spidery arms"));
});

test("tall hairdos and hats can't be picked together; avocados wear a wig (Oct 30)", () => {
  const both = { ...defaultSelection, hairStyle: ["pagoda"], accessories: ["beanie", "bag"] };
  assert.deepEqual(fitKind(both, Math.random, "accessories").hairStyle, defaultSelection.hairStyle);
  assert.deepEqual(fitKind(both, Math.random, "hairStyle").accessories, ["bag"]);
  assert.deepEqual(fitKind({ ...both, hairStyle: ["bob"] }).accessories, ["beanie", "bag"]);
  const avocado = characterPrompt({ ...defaultSelection, kind: ["avocado"], hairStyle: ["mullet"], hairColor: ["silver"] });
  assert.ok(avocado.includes("In every panel it wears a") && avocado.includes("mullet") && avocado.includes("worn on top of the avocado like a cap") && !avocado.includes("avocado leaves"));
});

test("object panels name the outfit and the facial hair (Oct 30)", () => {
  const p = characterPrompt({ ...defaultSelection, kind: ["avocado"], style: ["y2k"], facialHair: ["pencil"] });
  assert.ok(p.includes("dressed in a bright patterned shirt, a colorful jacket, bold colored trousers and colorful sneakers with the top covering its upper half"));
  assert.ok(p.includes("with its pencil mustache clearly visible as one fine thin line"));
});

test("Western turns a cap or beanie into a cowboy hat (Oct 30)", () => {
  assert.ok(characterPrompt({ ...defaultSelection, style: ["western"], accessories: ["cap"] }).includes("a cowboy hat"));
  assert.ok(characterPrompt({ ...defaultSelection, kind: ["banana"], style: ["western"], decade: ["1940s"], accessories: ["beanie"] }).includes("wearing a cowboy hat in"));
  assert.ok(!characterPrompt({ ...defaultSelection, style: ["western"] }).includes("cowboy hat"));
});

test("plant hairstyles are leaf shapes, not fuzz (Oct 30)", () => {
  const p = characterPrompt({ ...defaultSelection, kind: ["houseplant"], hairStyle: ["buzz"], height: ["petite"] });
  assert.ok(p.includes("short, stubby leaf tips poking up all over the top") && !p.includes("fuzz"));
  assert.ok(p.includes("small glazed ceramic plant pot that is its waist and hips"));
});

test("a storyboard look isn't said twice when the first sentence already says 'no human' (Oct 30)", async () => {
  const { lookOf } = await import("../lib/scene.ts");
  const look = lookOf("One donut is the body, with no human skin anywhere. It is not a person: no human head. Its face is set in.");
  assert.equal(look, "One donut is the body, with no human skin anywhere. It is not a person: no human head");
});

test("robots are dressed in the style, in fabric, like animals (Oct 30)", () => {
  const p = characterPrompt({ ...defaultSelection, kind: ["robot"], style: ["runway"] });
  assert.ok(p.includes("fully dressed in a complete avant-garde look") && p.includes("it wears a sculptural oversized coat, wide structured trousers and statement boots, mostly in deep burgundy, real woven fabric, clearly different from its metal"));
  assert.ok(!characterPrompt(defaultSelection).includes("made to fit its metal body"));
});

test("weird people keep their skin tone in the first sentence (Oct 30)", () => {
  const p = characterPrompt({ ...defaultSelection, skin: ["very-deep"] }, "", {}, undefined, 3);
  assert.ok(p.split(". ")[0].includes("a real person with very deep skin as a surreal, uncanny caricature"));
  assert.ok(!characterPrompt(defaultSelection).split(". ")[0].includes("skin"));
});

test("weird outfits keep their colors, the build comes from the picks, and teeth picks part the lips (Oct 30)", () => {
  const sel = { ...defaultSelection, build: ["bodybuilder"], features: ["gold-grill"], style: ["tailoring"] };
  for (const level of [1, 2, 3] as const) {
    const p = characterPrompt(sel, "", {}, undefined, level);
    assert.ok(!p.includes("clashing") && !p.includes("brighter") && !p.includes("gangly") && !p.includes("longer limbs"), `level ${level}`);
    assert.ok(p.includes("in its own colors") || p.includes("in their own colors"));
  }
  assert.ok(characterPrompt(sel).includes("the lips parted so the gold grill clearly shows"));
});

test("weird people keep their shoes in the full-length shot (Oct 30)", () => {
  assert.ok(characterPrompt(defaultSelection, "", {}, undefined, 3).includes("fully dressed in the complete outfit down to the shoes on both feet"));
  assert.ok(!characterPrompt(defaultSelection).includes("down to the shoes on both feet"));
});

test("styles stay implied: Stage costume and Avant-garde name a setting, not garments (Oct 30)", () => {
  const p = characterPrompt({ ...defaultSelection, style: ["stage"] });
  assert.ok(p.includes("as if for a Broadway show, a play, a glam rock tour or a circus ring") && !p.includes("sequined"));
  assert.ok(characterPrompt({ ...defaultSelection, style: ["runway"] }, "", {}, undefined, 3, "flux-3-klein").includes("Paris fashion week runway"));
});

test("animal, robot and object outfits come from a pool per style, picked by the seed (Oct 30)", () => {
  const fox = { ...defaultSelection, kind: ["fox"], style: ["stage"] };
  const outfits = [0, 1, 2, 3].map((seed) => characterPrompt(fox, "", {}, undefined, 0, "qwen-2.1", seed).match(/it wears ([^,]+),/)?.[1]);
  assert.equal(new Set(outfits).size, 4);
  assert.equal(characterPrompt(fox, "", {}, undefined, 0, "qwen-2.1", 5), characterPrompt(fox, "", {}, undefined, 0, "qwen-2.1", 5));
  // People keep the mood only.
  assert.ok(!characterPrompt({ ...defaultSelection, style: ["stage"] }, "", {}, undefined, 0, "qwen-2.1", 1).includes("sequined"));
});

test("dogs, cats and wings for anyone (owner, Oct 30)", () => {
  const birddog = characterPrompt({ ...defaultSelection, kind: ["dog"], gender: ["man"], proportions: ["feathered-wings"] }, "", {}, undefined, 0, "qwen-2.1", 1);
  assert.ok(birddog.includes("Belgian Malinois") && birddog.includes("feathered bird wings growing from the shoulder blades"));
  assert.ok(birddog.includes("The wings and tail grow out of the body and come out through openings in the clothing"));
  assert.ok(characterPrompt({ ...defaultSelection, kind: ["cat"], build: ["plus-size"] }).includes("British Shorthair"));
  assert.ok(characterPrompt({ ...defaultSelection, proportions: ["bat-wings"] }).includes("leathery bat wings"));
  assert.ok(isSelection(fitKind({ ...defaultSelection, kind: ["toaster"], proportions: ["bat-wings"] })));
  assert.deepEqual(fitKind({ ...defaultSelection, kind: ["moth"], proportions: ["bat-wings", "long-legs"] }).proportions, ["long-legs"]);
});
