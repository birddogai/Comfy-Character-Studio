import { weirdness, type Weirdness } from "./character.ts";
import { refName, type ModelId } from "./models.ts";

// Storyboard (was Scenes, Oct 29): one to four saved characters (each in their
// main sheet or an outfit), a place, an optional product and a brief become one
// storyboard image, a grid of photographic frames made in a single run. It is a
// reference for video models, next to the character and outfit sheets.

// Everyday rooms first: they're where most product videos happen (Oct 29).
export const placeGroups = [
  { group: "Everyday", places: ["Bedroom with a desk, morning light", "Kitchen", "Home office", "Living room with a sofa", "Bathroom with a big mirror", "Café window seat on a rainy day", "City sidewalk", "White photo studio"] },
  { group: "Out and about", places: ["Rooftop terrace at sunset", "Gym with a large mirror", "Seaside boardwalk in the morning", "Airport lounge with big windows", "Subway car at rush hour", "Busy diner booth at lunchtime"] },
  { group: "Cinematic", places: ["Neon-lit city street at night", "Abandoned diner at night", "Forest trail in morning fog", "Desert highway at golden hour", "Rain-soaked back alley", "Old motel parking lot at dusk"] },
] as const;
export const places = placeGroups.flatMap((g) => g.places);

export const framings = [
  "Extreme wide shot", "Wide shot", "Full body", "Knee-up shot", "Medium shot", "Two shot", "Close-up", "Extreme close-up",
  "Over the shoulder", "Point of view", "Detail insert",
] as const;

export const angles = [
  "Eye level", "Low angle", "Worm's-eye view", "High angle", "Bird's-eye view", "Top-down", "Dutch tilt",
  "Side profile", "Three-quarter view", "From behind", "Ground level",
] as const;

export const expressions = [
  "As the action suggests", "Big open laugh", "Soft closed-mouth smile", "Smug smirk", "Shocked, jaw dropped", "Furious scowl",
  "Angry frown", "Sulky pout", "Crying, tears running", "Deadpan stare", "Wide-eyed fear", "Dreamy, eyes half closed",
  "Mischievous wink", "Tongue out, goofy",
] as const;

// Film looks, described by what they look like (light, lens, color, texture),
// never by film titles. All photographic: storyboards are references for
// video models, so no drawn or comic looks (the owner's note, Oct 29). The look
// sets the camera and grade only; it doesn't change the era of clothes or place.
export const looks = [
  { id: "film", group: "Modern", label: "Cinematic film still", words: "a cinematic film still, anamorphic lens, natural film grain" },
  { id: "naturalism", group: "Modern", label: "Quiet naturalism", words: "a naturalistic film still, available light only, restrained muted grade, observational handheld framing" },
  { id: "neon-noir", group: "Modern", label: "Neon thriller", words: "an 1980s-style neon thriller film still at night, colored practical lights, wet reflective streets, teal and magenta haze, deep shadows" },
  { id: "editorial", group: "Modern", label: "Editorial", words: "an editorial magazine photo, 85mm lens, soft studio-quality light" },
  { id: "photo", group: "Social & UGC", label: "Phone video", words: "a still from a vertical phone video filmed by the creator, natural window light, true-to-life colors, casual framing" },
  { id: "ringlight", group: "Social & UGC", label: "Ring-light creator", words: "a still from a creator video lit by a ring light, bright even face light, round catchlights in the eyes, clean tidy background" },
  { id: "flash", group: "Social & UGC", label: "35mm flash snapshot", words: "a 35mm film snapshot with direct on-camera flash" },
  { id: "noir", group: "Classic eras", label: "1940s noir", words: "a black and white 1940s film noir still, high-contrast hard light, deep shadows, venetian-blind stripes of light, cigarette-smoke haze, no color at all" },
  { id: "technicolor", group: "Classic eras", label: "1950s Technicolor", words: "a 1950s Technicolor film still, saturated candy colors, bright even studio lighting, painted backdrop feel" },
  { id: "seventies", group: "Classic eras", label: "Gritty '70s thriller", words: "a gritty 1970s thriller film still, grainy 16mm film, warm faded colors, harsh practical light" },
  { id: "vhs", group: "Classic eras", label: "1990s VHS home video", words: "a still from a 1990s VHS camcorder home video, soft blurry detail, color bleed and faint scan lines" },
  { id: "grindhouse", group: "Genre", label: "Grindhouse", words: "a 1970s grindhouse exploitation film still, coarse heavy grain, scratched worn film stock, harsh practical lighting, faded worn color, crash zooms" },
  { id: "giallo", group: "Genre", label: "Italian giallo", words: "an Italian giallo thriller film still, saturated red and blue gel lighting, deep black shadows, stylized heightened compositions, extreme close-ups of eyes" },
  { id: "folk-horror", group: "Genre", label: "Folk horror", words: "a folk horror film still, flat overcast daylight, earthy desaturated greens and browns, uneasy wide shots of open landscape, grainy 16mm texture" },
  { id: "western", group: "Genre", label: "Dusty western", words: "a sun-bleached western film still, dusty golden light, wide desert vistas, heat haze and squinting extreme close-ups" },
  { id: "pastel", group: "Genre", label: "Pastel symmetry", words: "a whimsical film still with perfectly centered symmetrical framing, a soft pastel color palette, flat front lighting and tidy miniature-like sets" },
  { id: "animated", group: "Genre", label: "3D animated feature", words: "a frame from a 3D animated feature film, soft global illumination" },
] as const;

/** What the board is for; each loads sensible defaults (the owner's idea, Oct 29). */
export const formats = [
  { id: "story", label: "Story", hint: "Characters in a scene: action, reactions, cinematic coverage.", look: "film", ratio: "16:9", place: "Neon-lit city street at night", example: "@Name walks into an abandoned diner, notices someone watching through the window, and ducks behind the counter as the lights go out." },
  { id: "ugc", label: "UGC", hint: "A creator shows a product in an everyday place: intro, details, demo, verdict.", look: "photo", ratio: "9:16", place: "Bedroom with a desk, morning light", example: "@Name unboxes the product at their desk, shows it to the camera, tries it on and smiles." },
  { id: "custom", label: "Custom", hint: "A blank brief with the same tools.", look: "film", ratio: "16:9", place: "White photo studio", example: "Describe what happens, using @ to name characters." },
] as const;
export type FormatId = (typeof formats)[number]["id"];

/** How long the finished video should be (8 s is a common clip length), and how many shots: picked apart (Oct 29). */
export const durations = [5, 8, 10, 15, 30, 60] as const;
export const shotCounts = [2, 3, 4, 6, 8, 9, 12] as const;

/** The pace a length and shot count give, for the picker's labels. */
export function pace(seconds: number, shots: number) {
  const each = seconds / shots;
  return each >= 3 ? "slow" : each >= 1.5 ? "steady" : "quick cuts";
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
/** "0:00–0:03" for frame i of n in a video of the given length. */
export function timing(index: number, total: number, seconds: number) {
  const each = seconds / total;
  return `${clock(index * each)}–${clock((index + 1) * each)}`;
}

// Weirdness for scenes (Oct 27): chaos around the cast, who stay themselves.
const sceneWeird: Record<Weirdness, string> = {
  0: "",
  1: "Something slightly odd is happening around them that nobody comments on",
  2: "The scene is chaotic and absurd: things fly through the air, background people react in shock, props are wildly out of place and every expression is exaggerated",
  3: "The scene is unhinged surreal chaos: objects float, explode and melt, the physics are impossible, bizarre background characters stare, everything is turned up to an absurd extreme, yet it is still one clear moment centered on the cast",
};

// One odd event per frame: a single weirdness sentence in a long storyboard
// prompt changed nothing (owl tests, Oct 29). Cycled through the frames.
const frameWeird: Record<Weirdness, string[]> = {
  0: [],
  1: ["a cup slowly tips over by itself in the background", "a houseplant leans toward the camera", "a picture on the wall hangs upside down", "a cat watches from somewhere it shouldn't be"],
  2: ["small objects fly through the air around them", "the furniture behind them is wildly out of place, a sofa stacked on a table", "a crowd of tiny copies of the product cascades past", "the background is tilted at a crazy angle", "confetti and feathers explode across the frame", "a giant version of the product looms in the background"],
  3: ["the room melts and drips around them", "everything floats in zero gravity, the walls breaking apart", "a swarm of copies of the product spirals around them like a tornado", "the windows show an impossible sky with three moons", "the floor cracks open, glowing light pouring up", "bizarre masked figures stare from the background", "the colors invert and smear like wet paint", "the whole room is upside down while they stay upright"],
};

const angleWords: Record<(typeof angles)[number], string> = {
  "Eye level": "camera at eye level",
  "Low angle": "camera low, looking up at them",
  "Worm's-eye view": "camera on the floor pointing steeply up",
  "High angle": "camera above, looking down at them",
  "Bird's-eye view": "camera high overhead, looking far down",
  "Top-down": "camera straight overhead, looking directly down",
  "Dutch tilt": "camera tilted sideways for a tense diagonal horizon",
  "Side profile": "camera at their side, showing them in profile",
  "Three-quarter view": "camera at a three-quarter angle to them",
  "From behind": "camera behind them, showing their backs",
  "Ground level": "camera resting at ground level",
};

export type Shot = { action: string; framing: (typeof framings)[number]; angle: (typeof angles)[number]; expression: (typeof expressions)[number] };
export type LookId = (typeof looks)[number]["id"];
/** One cast member as the prompt sees them. */
export type CastMember = { name: string; description?: string; outfit?: string; role?: string };

export const maxShots = 12;
export const maxCast = 4;

export function isShot(value: unknown): value is Shot {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  return typeof s.action === "string" && s.action.trim().length > 0 && s.action.length <= 300
    && framings.includes(s.framing as never) && angles.includes(s.angle as never) && expressions.includes(s.expression as never);
}

export function isLook(value: unknown): value is LookId {
  return looks.some((look) => look.id === value);
}

export function isFormat(value: unknown): value is FormatId {
  return formats.some((f) => f.id === value);
}

/** The saved description's opening, e.g. "An axolotl-human hybrid man in their 30s": enough to tell the cast apart. */
export function shortIdentity(description = "") {
  return description.split(/[.;]/)[0].split(/,| with /)[0].trim();
}

/**
 * The storyboard is one image (the owner's note, Oct 29): a grid of frames
 * made in a single run, like a contact sheet. The grid is picked so the board
 * is close to 16:9 with no empty row, then sized to about 2 megapixels.
 */
export function grid(count: number, ratio: string) {
  const [fw, fh] = ratio.split(":").map(Number);
  // As square a grid as fits with no empty cell, more columns than rows:
  // 6 shots are 3 over 3 in any frame shape, not one long strip (Oct 29).
  let best = { cols: count, rows: 1, score: Infinity };
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const empty = rows * cols - count;
    if (empty >= cols || rows > cols) continue;
    const score = empty * 3 + (cols - rows);
    if (score < best.score) best = { cols, rows, score };
  }
  const aspect = (best.cols * fw) / (best.rows * fh);
  const snap = (v: number) => Math.max(256, Math.round(v / 16) * 16);
  const height = Math.sqrt(2_000_000 / aspect);
  return { cols: best.cols, rows: best.rows, width: snap(height * aspect), height: snap(height) };
}

const framingShort: Record<(typeof framings)[number], string> = {
  "Extreme wide shot": "extreme wide shot, the characters small in the place", "Wide shot": "wide shot, head to toe with the place around them",
  "Full body": "full-body shot", "Knee-up shot": "knee-up shot", "Medium shot": "medium shot from the waist up", "Two shot": "two shot, side by side",
  "Close-up": "close-up of the face", "Extreme close-up": "extreme close-up of the eyes and mouth", "Over the shoulder": "over-the-shoulder shot",
  "Point of view": "point-of-view shot", "Detail insert": "detail insert of the hands and the object",
};

const spots: Record<number, string[]> = {
  2: ["on the left", "on the right"],
  3: ["on the left", "in the middle", "on the right"],
  4: ["on the far left", "left of center", "right of center", "on the far right"],
};

/**
 * One prompt for the whole storyboard. References: each cast member's sheet,
 * then a location photo, then a product photo. The frames are said as numbered
 * shots; "photographic stills, not drawings" keeps it from turning into a
 * sketched storyboard (the owner's note, Oct 29).
 */
export function storyboardPrompt(model: ModelId, shots: Shot[], options: { cast: CastMember[]; look: LookId; ratio: string; location?: string; brief?: string; hasPlace?: boolean; product?: string; hasProduct?: boolean; weird?: Weirdness; format?: FormatId }) {
  const look = looks.find((l) => l.id === options.look)!;
  const { cols, rows } = grid(shots.length, options.ratio);
  let next = options.cast.length;
  const placeRef = options.hasPlace ? refName(model, next++) : undefined;
  const productRef = options.hasProduct ? refName(model, next++) : undefined;
  // Picked places are names ("Forest trail in morning fog"); in a sentence they need "a".
  const words = options.location?.trim() ?? "";
  const route = !placeRef && /\bthen\b|,.*,|→|->/i.test(words);
  const where = placeRef ? `the exact place shown in ${placeRef}, keeping its layout and details`
    : !words ? "" : /^(a|an|the|my|our|his|her|their)\b/i.test(words) ? words.charAt(0).toLowerCase() + words.slice(1) : `a ${words.charAt(0).toLowerCase()}${words.slice(1)}`;
  const productWords = options.product?.trim() || "the product";
  const cast = options.cast.map((member, i) => {
    const name = member.name.trim() || `Character ${i + 1}`;
    // The short identity alone ("a non-binary person in their 20s") let MOSS draw
    // a stranger (Oct 29), so the look itself is said: the description's first sentence.
    const look = member.outfit ? "" : lookOf(member.description);
    return `${name}${member.role?.trim() ? ` (${member.role.trim()})` : ""} is the exact character in ${refName(model, i)}${look ? `: ${look.charAt(0).toLowerCase()}${look.slice(1)}` : ""}. ${member.outfit ? `The selected reference sheet is authoritative for ${name}'s identity and clothing; keep the outfit shown there. ` : ""}${name} has the same face, hair, body, outfit and style in every frame and appears only once per frame, never twice`;
  });
  return [
    `One storyboard image: ${shots.length} photographic film stills from one continuous scene, laid out in a grid of ${rows} row${rows > 1 ? "s" : ""} and ${cols} column${cols > 1 ? "s" : ""} of equal-size ${options.ratio} frames separated by thin white gutters, read left to right and top to bottom`,
    sceneWeird[options.weird ?? 0],
    options.brief?.trim() ? `Scene context, including the setting: ${options.brief.trim()}` : "",
    `Every frame is ${look.words}: real photographs from a film set, not drawings, sketches, comics or illustrations, with no text, numbers, captions or borders inside the frames`,
    // Several places ("a living room, then a street, then a park") are a route, not one room (Oct 29).
    route ? `The scene moves through these places in order, each frame in the right place for its moment: ${words.replace(/^(starting|starts)( off)? (in|at) /i, "")}. The same color grade throughout`
      : where ? `Every frame takes place in ${where}, with the same lighting and color grade throughout` : "The same place, lighting and color grade in every frame",
    ...cast,
    options.cast.length > 1 ? `When several characters share a frame they stand ${options.cast.map((m, i) => `${m.name.trim() || `Character ${i + 1}`} ${spots[options.cast.length][i]}`).join(", ")}, unless the action says otherwise` : "",
    productRef ? `${capitalize(productName(options.product))} ${plural(productWords) ? "are" : "is"} the exact product shown in ${productRef}: the same shape, colors, logo, label and packaging in every frame` : options.product?.trim() ? `The product is ${productWords}` : "",
    options.format === "ugc" ? `This is a product video: ${productName(options.product)} ${plural(productWords) ? "are" : "is"} the hero of every frame, large and in sharp focus, and ${options.cast[0]?.name.trim() || "the creator"} presents ${plural(productWords) ? "them" : "it"}, often only partly in frame (hands, arm, shoulder or half the face)` : "",
    "The frames tell the story in order from beginning to end: each frame shows a later moment than the one before, with a different camera setup",
    options.cast.length ? `No other people appear unless the action names them` : "",
    ...shots.map((shot, i) => {
      const odd = frameWeird[options.weird ?? 0];
      // The action leads and the camera follows: a face close-up next to "the sneakers bounce on the pavement" split the panel in two (Oct 29).
      return `Frame ${i + 1}${i ? ", a moment later" : ", the beginning"}${i === shots.length - 1 && shots.length > 1 ? " and the end" : ""}: ${shot.action.trim().replace(/\.$/, "")}${shot.expression === "As the action suggests" ? "" : `, ${shot.expression.toLowerCase()}`}${odd.length ? `, while ${odd[i % odd.length].replace(/the product/g, options.product?.trim() ? productName(options.product) : "the props")}` : ""}; shot as ${/^[aeiou]/.test(framingShort[shot.framing]) ? "an" : "a"} ${framingShort[shot.framing]}, ${angleWords[shot.angle]}`;
    }),
  ].filter(Boolean).join(". ") + ".";
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** The look from a saved description: its first sentence, cut at 300 characters. */
export function lookOf(description = "") {
  const sentences = description.split(/(?<=\.)\s/);
  // Creatures: the head sentence ("…not a mask or costume, with no human nose, lips…")
  // comes along, or Qwen gave an owl a human mouth (Oct 29).
  // Not the first sentence again: the jelly donut said "no human skin" in it and its look came out twice (Oct 30).
  const head = sentences.slice(1).find((x) => /not a mask|no human/i.test(x))?.trim().replace(/\.$/, "");
  const look = lookOfFirst(sentences[0] ?? "");
  return head ? `${look}. ${head}` : look;
}

function lookOfFirst(sentence: string) {
  const first = sentence.trim().replace(/\.$/, "");
  if (first.length <= 300) return first;
  // Cut at the last whole clause: a cut mid-phrase left "in the places where a." (owl, Oct 29).
  const cut = first.slice(0, 300);
  const end = Math.max(cut.lastIndexOf(", "), cut.lastIndexOf("; "), cut.lastIndexOf(": "));
  return end > 60 ? cut.slice(0, end) : cut.replace(/[,\s]+\S*$/, "");
}

/** The beats in a brief: sentences, lines, semicolons and "then". "@Gabe" becomes "Gabe". */
export function beats(brief: string, lead?: string) {
  return brief.replace(/@(\S+)/g, "$1")
    .split(/(?<=[.!?])\s+|\n+|;\s*|,?\s+(?:and\s+)?then\s+/i)
    // One long sentence is still a sequence: "riding through a forest as he gets
    // ambushed" is two moments (the owner's knight test, Oct 29).
    .flatMap((b) => b.split(/,?\s+(?:as|when|while|until|but|before|and suddenly|suddenly)\s+(?=(?:he|she|they|it|the|a|an|his|her|their|someone|something|[A-Z]))/))
    // "unboxes it, shows it to the camera and smiles": a list of verbs is a list of
    // moments, and each split-off verb gets its subject back. Only those: a
    // sentence that starts in lowercase ("settings keeping…") is left alone.
    // A piece under three words was a noun, not a verb ("…and features"): it stays joined.
    .flatMap((b) => b.split(/,\s+(?:and\s+)?(?=[a-z]+s\b)|\s+and\s+(?=[a-z]+s\b)/)
      .reduce<string[]>((parts, part, i) => {
        if (i && part.trim().split(/\s+/).length < 3) parts[parts.length - 1] += ` and ${part.trim()}`;
        else parts.push(i && lead ? `${lead} ${part.trim()}` : part);
        return parts;
      }, []))
    .map((b) => b.trim().replace(/^(?:and\s+)?then\s+/i, "").replace(/[.!?]+$/, ""))
    .map((b) => b.charAt(0).toUpperCase() + b.slice(1))
    .filter((b) => b.length > 2);
}

const storyFramings: Shot["framing"][] = ["Wide shot", "Medium shot", "Close-up", "Over the shoulder", "Knee-up shot", "Extreme close-up", "Medium shot", "Detail insert", "Close-up", "Wide shot", "Medium shot", "Close-up"];

type Step = { kind: "beat" | "before" | "reaction" | "detail" | "after"; beat: number };

/**
 * A first shot plan from the brief, with no model call. The frames must move
 * the story from start to finish (repeating one moment with closer shots read
 * as a still life, Oct 29). Too many beats are joined; too few get the shots an
 * editor would add, in this order: the aftermath, the moment before each later
 * beat, then reactions.
 */
export function planShots(brief: string, count: number, format: FormatId, lead = "the character", product = ""): Shot[] {
  if (format === "ugc") return productPlan(brief, count, lead, product);
  let list = beats(brief, lead === "the character" ? undefined : lead);
  if (!list.length) list = [`${lead} looks around the place`];
  if (list.length > count) {
    const per = list.length / count;
    list = Array.from({ length: count }, (_, i) => list.slice(Math.round(i * per), Math.round((i + 1) * per)).join(", then "));
  }
  const extras: Step[] = [{ kind: "after", beat: list.length - 1 }];
  for (let b = 1; b < list.length; b++) extras.push({ kind: "before", beat: b });
  // Reactions to the later beats first: the first beat is usually the calm setup.
  for (let b = list.length - 1; b >= 0; b--) extras.push({ kind: "reaction", beat: b });
  for (let b = list.length - 1; extras.length < count; b = (b + list.length - 1) % list.length) extras.push({ kind: "detail", beat: b });
  const chosen = extras.slice(0, count - list.length);
  const order = { before: 0, beat: 1, detail: 2, reaction: 3, after: 4 };
  const steps: Step[] = [...list.map((_, b) => ({ kind: "beat" as const, beat: b })), ...chosen]
    .sort((x, y) => x.beat - y.beat || order[x.kind] - order[y.kind]);
  const pattern = storyFramings;
  const lower = (beat: string) => /^(He|She|They|It|The|A|An|His|Her|Their|We|I|Someone|Something)\b/.test(beat) ? beat.charAt(0).toLowerCase() + beat.slice(1) : beat;
  let beatShot = 0;
  // Each frame is read on its own, so "flies up to her" needs her name: the
  // last other name the brief gave before it (Luna, the rooftop test, Oct 30).
  const names = list.map((_, b) => [...list.slice(0, b + 1).join(" ").matchAll(/(?<=\S\s+)([A-Z][a-z]+)\b/g)].map((m) => m[1]).filter((n) => n !== lead && !/^(I|The|A|An|He|She|They|It)$/.test(n)).pop());
  return steps.map((step) => {
    // A leading "He" becomes the lead's name; "They" stays the whole cast.
    let beat = lead !== "the character" ? list[step.beat].replace(/^(He|She)\b/, lead) : list[step.beat];
    const other = names[step.beat];
    // "They … together" with two named characters drew the lead twice (Oct 30): name them both.
    if (other && lead !== "the character") beat = beat.replace(/^They\b/, `${lead} and ${other}`);
    if (other) beat = beat.replace(/\b(to|at|with|on|for|toward|towards|over|beside|behind|grabs|catches|lifts|holds|hugs|helps|carries|reaches|saves|finds|sees|joins) (her|him)\b/g, `$1 ${other}`);
    // The camera follows the action: a face close-up of "flies up to her" can't show the flight (Oct 30).
    const moving = /\b(fl(y|ies|ying)|glid|soar|jump|leap|run|runs|running|fall|falls|chase|dives?|climb|swoop|lands?|rides?|riding|dances?)\w*/i.test(beat);
    const [action, framing]: [string, Shot["framing"]] =
      step.kind === "beat" ? [beat, moving ? (beatShot++, "Wide shot") : pattern[beatShot++ % pattern.length]]
      : step.kind === "before" ? [`The moment just before ${lower(beat)}: ${lead} senses it coming`, "Close-up"]
      : step.kind === "detail" ? [`A detail of hands and objects as ${lower(beat)}`, "Detail insert"]
      : step.kind === "reaction" ? [`${lead}'s reaction, right after ${lower(beat)}`, "Extreme close-up"]
      : [`The aftermath, right after ${lower(beat)}: how it ends for ${lead}`, "Wide shot"];
    return { action: action.slice(0, 300), framing, angle: "Eye level", expression: "As the action suggests" };
  });
}

/** Whether a product name is plural ("sneakers", not "glass"), for "is"/"are". */
const plural = (name: string) => /[^s]s$/i.test(name.trim()) && !/(us|is|os)$/i.test(name.trim());

/** "a matte black water bottle" → "the matte black water bottle"; nothing → "the product". */
export function productName(product = "") {
  const name = product.trim().replace(/[.]$/, "");
  return name ? `the ${name.replace(/^(an?|the|my|our)\s+/i, "")}` : "the product";
}

/**
 * Product videos keep the product the hero (the owner's owl-and-sneaker test,
 * Oct 29: the story plan gave four owl close-ups). A fixed product sequence,
 * the brief's own moments in the middle: hook, detail, the brief, another
 * angle, in use, point of view, texture, top-down, and the verdict last.
 */
function productPlan(brief: string, count: number, lead: string, product: string): Shot[] {
  const p = productName(product);
  const shot = (action: string, framing: Shot["framing"], angle: Shot["angle"] = "Eye level"): Shot => ({ action: action.slice(0, 300), framing, angle, expression: "As the action suggests" });
  const many = plural(p);
  const hook = shot(`${lead} holds ${p} up to the camera, ${p} large and in sharp focus in the foreground`, "Medium shot");
  // "Smiles" gave an owl a human mouth (Oct 29); this works for any face.
  const verdict = shot(`${lead} turns to the camera with ${p} held up next to their face, clearly pleased`, "Medium shot");
  let own = beats(brief, lead === "the character" ? undefined : lead).map((b) => shot(`${b}, ${p} in sharp focus`, "Knee-up shot"));
  const fillers = [
    shot(`${capitalize(p)} ${many ? "fill" : "fills"} the frame: ${many ? "their" : "its"} materials, stitching, logo and details in sharp focus`, "Detail insert"),
    shot(`${capitalize(p)} turned in ${lead}'s hands to show ${many ? "their" : "its"} side and back, in sharp focus`, "Close-up", "Three-quarter view"),
    shot(`${capitalize(p)} in use: ${lead} wearing or using it, ${p} filling the frame`, "Detail insert", "Low angle"),
    shot(`Looking down at ${p} in ${lead}'s hands`, "Point of view", "High angle"),
    shot(`A macro detail of ${p}'s texture and label`, "Extreme close-up"),
    shot(`${capitalize(p)} on the desk, seen from straight above`, "Detail insert", "Top-down"),
  ];
  if (count <= 1) return [hook];
  const middle = count - 2;
  // The brief's own actions get the middle frames before the filler shots: with 4
  // frames, "unboxes, puts them on, dances" were squeezed into one frame (Oct 30).
  if (own.length > Math.max(1, middle)) {
    const keep = Math.max(1, middle);
    const per = own.length / keep;
    own = Array.from({ length: keep }, (_, i) => shot(own.slice(Math.round(i * per), Math.round((i + 1) * per)).map((x) => x.action.replace(`, ${p} in sharp focus`, "")).join(", then ") + `, ${p} in sharp focus`, "Knee-up shot"));
  }
  const pool = own.length >= middle ? own : [fillers[0], ...own, ...fillers.slice(1)];
  while (pool.length < middle) pool.push(...fillers);
  return [hook, ...pool.slice(0, middle), verdict];
}

export const ratios = ["16:9", "9:16", "4:5", "1:1"] as const;

/** Everything behind a storyboard, saved with it so "Use these settings" brings it all back. */
export type SceneSettings = {
  cast: { characterId: string; outfitId?: string; role?: string }[];
  where: "preset" | "words" | "photo" | "brief";
  customPrompt?: string;
  scene: string;
  location: string;
  place?: string;
  look: LookId;
  ratio: (typeof ratios)[number];
  shots: Shot[];
  /** Missing on scenes saved before weirdness existed. */
  weird?: Weirdness;
  /** Missing on boards saved before the Storyboard page (Oct 29). */
  format?: FormatId;
  brief?: string;
  seconds?: number;
  product?: string;
  productImage?: string;
};

/** The chips for the details pop-up. */
export function sceneChips(settings: SceneSettings, names: string[]) {
  const look = looks.find((l) => l.id === settings.look)?.label ?? settings.look;
  const where = settings.where === "brief" ? "From description" : settings.where === "photo" ? "Own location photo" : settings.where === "words" ? settings.location : settings.scene;
  return [
    { label: "Cast", values: names },
    ...(settings.brief ? [{ label: "What happens", values: [settings.brief] }] : []),
    { label: "Where", values: [where] },
    ...(settings.product ? [{ label: "Product", values: [settings.product] }] : []),
    { label: "Look", values: [look] },
    { label: "Format", values: [settings.ratio, ...(settings.seconds ? [`${settings.seconds}s`] : [])] },
    ...(settings.weird ? [{ label: "Weirdness", values: [weirdness[settings.weird]] }] : []),
    ...settings.shots.map((shot, i) => ({
      label: settings.shots.length > 1 ? `Frame ${i + 1}` : "Frame",
      values: [shot.framing, shot.angle, ...(shot.expression === "As the action suggests" ? [] : [shot.expression]), shot.action],
    })),
  ];
}
