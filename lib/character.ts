// Visual controls for building an original character. Every option is plain
// data: an id (sent to the server), a label (shown on its tile) and the words
// it adds to the prompt. Add an option to a list and it appears as a tile in
// the Create panel. A preview picture is optional (see lib/previews.ts).
import { colorName } from "./colors.ts";
import { creatures, foxFur, objects, pickVariant } from "./species.ts";

export type Option = { id: string; label: string; prompt: string; group?: string };
export type Field = {
  id: string;
  label: string;
  options: readonly Option[];
  /** Fields that allow several picks give the maximum here; others take exactly one. */
  max?: number;
  /** Skipped for creature characters, where the words wouldn't make sense. */
  humanOnly?: boolean;
  /** Multi-pick fields: options that can't be worn or shown together; picking one drops the others. */
  exclusive?: readonly (readonly string[])[];
};

const o = (id: string, label: string, prompt: string, group?: string): Option => ({ id, label, prompt, ...(group ? { group } : {}) });

// "{who}" becomes the gender and age, e.g. "woman in their late 20s".
const kind: Field = {
  id: "kind", label: "Character type", options: [
    o("true-to-life", "True to life", "a real-looking {who}", "Human"),
    o("striking", "Striking", "a striking {who} with heightened, magazine-cover features: sharp cheekbones, full lips and large bright eyes, still photorealistic", "Human"),
    // "Lifelike skin" and a closing "realistic texture" made the body panels a real
    // person with only the close-up stylized (Oct 26), so the features are named.
    o("stylized", "Stylized 3D", "a 3D animated-movie character, a {who}, with a slightly oversized head, big expressive eyes about twice real size, a small simple nose, smooth simplified skin without pores and soft rounded shapes, like a modern animated feature film, not a real person", "Human"),
    o("dog", "Dog", "a dog-human hybrid {who} with a dog's head, a muzzle, dog ears and fur, standing upright with a human body", "Creature"),
    o("cat", "Cat", "a cat-human hybrid {who} with a cat's head, pointed ears, whiskers and fur, standing upright with a human body", "Creature"),
    o("fox", "Fox", "a fox-human hybrid {who} with a fox's head, pointed ears, a slim muzzle and russet fur, standing upright with a human body", "Creature"),
    o("owl", "Owl", "an owl-human hybrid {who} with an owl's round facial disc, large forward-facing eyes, a small hooked beak and soft speckled feathers, with a human body", "Creature"),
    o("axolotl", "Axolotl", "an axolotl-human hybrid {who} with smooth glossy skin, a wide gentle smile and feathery external gills framing the head, with a human body", "Creature"),
    o("chameleon", "Chameleon", "a chameleon-human hybrid {who} with fine beaded scales, turret-like eyes and a tall crest on the head, with a human body", "Creature"),
    o("red-panda", "Red panda", "a red-panda-human hybrid {who} with rust-and-cream fur, round white-tipped ears and tear-mark stripes under the eyes, with a human body", "Creature"),
    o("moth", "Moth", "a luna-moth-human hybrid {who} with fuzzy body fur, large feathery antennae and large luna-moth wings growing from the shoulder blades, with a human body", "Creature"),
    o("opossum", "Opossum", "an opossum-human hybrid {who} with an opossum's pale pointed face, a pink nose, round black eyes, thin rounded hairless ears and coarse grey-and-white fur, with a human body", "Creature"),
    o("shark", "Shark", "a shark-human hybrid {who} with smooth skin, a pointed snout, gill slits on the neck and a dorsal fin on the back, with a human body", "Creature"),
    o("robot", "Robot", "a friendly humanoid robot with the personality of a {who}, a smooth glossy enamel-and-brushed-chrome body, visible joints and glowing LED eyes", "Robot"),
    o("retro-bot", "Retro bot", "a boxy retro tin-toy robot with the personality of a {who}, painted metal panels, rivets, a dial on the chest and round lamp eyes", "Robot"),
    o("toaster", "Toaster", "a living chrome toaster character with the personality of a {who}, with exaggerated cartoon proportions and photorealistic materials", "Object"),
    o("coffee-cup", "Coffee cup", "a living ceramic coffee mug character with the personality of a {who}, with exaggerated cartoon proportions and photorealistic materials", "Object"),
    o("sneaker", "Sneaker", "a living high-top sneaker character with the personality of a {who}, with exaggerated cartoon proportions and photorealistic materials", "Object"),
    o("houseplant", "Houseplant", "a living potted monstera plant character with the personality of a {who}, with exaggerated cartoon proportions and photorealistic materials", "Object"),
    o("strawberry", "Strawberry", "a living giant strawberry character with the personality of a {who}, with exaggerated cartoon proportions and photorealistic textures", "Food"),
    o("avocado", "Avocado", "a living avocado character with the personality of a {who}, with exaggerated cartoon proportions and photorealistic textures", "Food"),
    o("banana", "Banana", "a living banana character with the personality of a {who}, with exaggerated cartoon proportions and photorealistic textures", "Food"),
    o("donut", "Donut", "a living frosted donut character with the personality of a {who}, with exaggerated cartoon proportions and photorealistic textures", "Food"),
  ],
};

export const fields = [
  kind,
  { id: "gender", label: "Gender", options: [
    o("woman", "Woman", "woman"), o("man", "Man", "man"), o("trans-woman", "Trans woman", "trans woman"),
    o("trans-man", "Trans man", "trans man"), o("non-binary", "Non-binary", "non-binary person"),
  ] },
  { id: "age", label: "Age", options: [
    o("early-20s", "Early 20s", "in their early 20s"), o("late-20s", "Late 20s", "in their late 20s"), o("30s", "30s", "in their 30s"),
    o("40s", "40s", "in their 40s"), o("50s", "50s", "in their 50s"), o("60s", "60s+", "in their 60s"),
  ] },
  { id: "skin", label: "Skin", options: [
    o("very-fair", "Very fair", "very fair skin"), o("fair-pink", "Fair, pink undertone", "fair skin with pink undertones"),
    o("light-olive", "Light olive", "light olive skin"), o("medium-tan", "Warm tan", "warm medium-tan skin"),
    o("golden-brown", "Golden brown", "golden brown skin"), o("deep-brown", "Deep brown", "deep brown skin"),
    o("very-deep", "Very deep", "very deep skin"), o("vitiligo", "Vitiligo", "skin with patches of vitiligo"),
  ] },
  // Head shape (was Face shape, Oct 27): bold silhouettes the model actually
  // draws, like the owner's references. The id stays "face" so old saves load.
  { id: "face", label: "Head shape", humanOnly: true, options: [
    o("oval", "Natural", "a natural oval head"),
    o("round", "Moon face", "a perfectly round, moon-shaped head with full round cheeks"),
    o("square", "Block head", "a square, block-shaped head with a flat top and a wide square jaw"),
    o("egg", "Egg head", "a tall egg-shaped head, narrow at the jaw and wide and domed at the top"),
    o("heart", "Heart", "a heart-shaped head with a wide forehead and a narrow pointed chin"),
    o("long", "Long face", "a very long, narrow face with high cheekbones"),
    o("caveman", "Heavy brow", "a heavy jutting brow ridge, a sloping forehead and a big jutting jaw"),
    o("chiseled", "Chiseled", "a chiseled V-shaped jaw, sharp angular cheekbones and a cleft chin"),
    o("pear", "Pear jaw", "a pear-shaped head, narrow at the temples and very wide at the jaw"),
    o("tiny", "Tiny head", "a noticeably small head for the size of the body"),
  ] },
  { id: "eyes", label: "Eyes", options: [
    o("dark-brown", "Dark brown", "dark brown eyes"), o("hazel", "Hazel", "hazel eyes"), o("green", "Green", "green eyes"),
    o("blue", "Blue", "blue eyes"), o("grey", "Grey", "grey eyes"), o("amber", "Amber", "amber eyes"),
    o("two-tone", "Two different colors", "one brown eye and one blue eye"),
  ] },
  // "{color}" becomes the hair color.
  { id: "hairStyle", label: "Hair style", options: [
    o("long-straight", "Long straight", "long straight {color} hair", "Everyday"),
    o("long-wavy", "Long wavy", "long wavy {color} hair", "Everyday"),
    o("curls", "Tight curls", "tight {color} curls", "Everyday"),
    o("afro", "Afro", "a full rounded {color} afro", "Everyday"),
    o("braids", "Braids", "long {color} box braids", "Everyday"),
    o("locs", "Locs", "shoulder-length {color} locs", "Everyday"),
    o("bob", "Bob", "a sleek chin-length {color} bob", "Everyday"),
    o("pixie", "Pixie cut", "a short {color} pixie cut", "Everyday"),
    o("wolf-cut", "Wolf cut", "a shaggy layered {color} wolf cut", "Everyday"),
    o("mullet", "Mullet", "a {color} mullet, short at the front and long at the back", "Everyday"),
    o("bowl", "Bowl cut", "a rounded {color} bowl cut", "Everyday"),
    o("buzz", "Buzz cut", "a {color} buzz cut", "Everyday"),
    o("mohawk", "Mohawk", "a spiked {color} mohawk", "Everyday"),
    o("ponytail", "High ponytail", "a high {color} ponytail", "Everyday"),
    o("pigtails", "Pigtails", "two {color} pigtails", "Everyday"),
    o("space-buns", "Space buns", "two {color} space buns on top of the head", "Everyday"),
    o("bald", "Bald", "a smooth shaved head", "Everyday"),
    o("comet-ponytail", "Comet tail", "{color} hair sculpted into a long ponytail that sweeps up and back like a comet tail", "Sculpted"),
    o("ribbon-loops", "Ribbon loops", "{color} hair sculpted into two glossy loops on top of the head, like a tied ribbon", "Sculpted"),
    o("lantern-bun", "Lantern bun", "{color} hair gathered into one oversized round bun banded in sections like a paper lantern", "Sculpted"),
    o("wave-crest", "Wave crest", "{color} hair sculpted into a single curling ocean-wave crest over the head", "Sculpted"),
    o("pagoda", "Pagoda stack", "{color} hair stacked into three neat buns of shrinking size, one on top of the other", "Sculpted"),
    o("crescent", "Crescent fringe", "{color} hair with a stiff fringe sculpted into a crescent moon shape across the forehead", "Sculpted"),
  ] },
  { id: "hairColor", label: "Hair color", options: [
    o("jet-black", "Jet black", "jet black"), o("dark-brown", "Dark brown", "dark brown"), o("chestnut", "Chestnut", "chestnut"),
    o("honey-blonde", "Honey blonde", "honey blonde"), o("platinum", "Platinum", "platinum blonde"), o("copper", "Copper", "copper red"),
    o("cherry", "Cherry red", "bright cherry red"), o("silver", "Silver grey", "silver grey"), o("white", "White", "snow white"),
    o("pastel-pink", "Pastel pink", "pastel pink"), o("lilac", "Lilac", "lilac"), o("electric-blue", "Electric blue", "electric blue"),
    o("mint", "Mint green", "mint green"), o("sunset", "Sunset ombré", "orange-to-pink ombré"),
  ] },
  { id: "facialHair", label: "Facial hair", options: [
    o("none", "None", ""), o("stubble", "Stubble", "light stubble"), o("full-beard", "Full beard", "a full beard"),
    o("goatee", "Goatee", "a goatee"), o("mustache", "Mustache", "a mustache"), o("pencil", "Pencil mustache", "a thin pencil mustache"),
    o("handlebar", "Handlebar", "a curled handlebar mustache"), o("braided-beard", "Braided beard", "a long braided beard growing from the chin and jaw, hanging down the middle of the chest"),
  ] },
  { id: "build", label: "Build", options: [
    o("slim", "Slim", "slim build"), o("average", "Average", "average build"), o("athletic", "Athletic", "athletic build"),
    o("curvy", "Curvy", "curvy build"), o("muscular", "Muscular", "muscular build"), o("plus-size", "Plus-size", "plus-size build"),
    o("bodybuilder", "Bodybuilder", "huge bodybuilder build with very large muscles"),
  ] },
  { id: "height", label: "Height", options: [
    // "Lanky" fought Bodybuilder; height now says only how tall.
    o("petite", "Petite", "petite and short, a small frame clearly shorter than average"), o("average", "Average", "average height"),
    o("tall", "Tall", "tall, clearly taller than average"), o("very-tall", "Very tall", "very tall and towering, head and shoulders taller than average"),
  ] },
  // Said as a visible comparison ("longer than the upper body"): plain
  // "long legs" and "a slightly oversized head" barely showed (Oct 26).
  { id: "proportions", label: "Proportions", max: 3, exclusive: [["long-legs", "short-legs"], ["feathered-wings", "bat-wings", "butterfly-wings"]], options: [
    // Measured against the height: FLUX 3 Klein ignored "longer than the upper body" (Oct 27).
    o("long-legs", "Long legs", "very long legs that make up about two-thirds of the full height, the hips well above the middle of the body"), o("short-legs", "Short legs", "short stubby legs that make up only about a third of the full height, the hips well below the middle of the body"),
    o("broad-shoulders", "Broad shoulders", "very broad shoulders, much wider than the hips"), o("narrow-waist", "Narrow waist", "a very narrow, cinched waist"),
    o("long-neck", "Long neck", "a noticeably long, slender neck"),
    // Wings on anyone (owner, Oct 30): they come out through the clothes like a moth's.
    o("feathered-wings", "Feathered wings", "a pair of large feathered bird wings growing from the shoulder blades"),
    o("bat-wings", "Bat wings", "a pair of large leathery bat wings growing from the shoulder blades"),
    o("butterfly-wings", "Butterfly wings", "a pair of large colorful butterfly wings growing from the shoulder blades"), o("big-head", "Big head", "a huge head, about twice the normal size for the body, like a bobblehead figurine"),
  ] },
  // Max 5 and some bolder picks (big forehead, gap teeth…) for absurd characters, like the owner's references (Oct 27).
  { id: "features", label: "Distinctive features", max: 5, exclusive: [["freckles", "glitter-freckles"], ["gold-grill", "braces", "gap-teeth"]], options: [
    o("freckles", "Freckles", "freckles across the nose and cheeks"), o("beauty-mark", "Beauty mark", "a beauty mark on the cheek"),
    o("dimples", "Dimples", "deep dimples"), o("face-tattoo", "Face tattoo", "dark fine-line face tattoos: small designs just below both eyes and one in the middle of the forehead"),
    o("nose-ring", "Nose ring", "a septum ring"), o("ear-piercings", "Ear piercings", "several ear piercings"),
    o("brow-slit", "Eyebrow slit", "a shaved slit in one eyebrow"), o("bleached-brows", "Bleached brows", "bleached eyebrows"),
    o("brow-scar", "Brow scar", "a small scar through one eyebrow"), o("gold-grill", "Gold grill", "a gold tooth grill"),
    o("braces", "Braces", "colorful dental braces"), o("face-gems", "Face gems", "tiny gems stuck along the cheekbones"),
    o("pointed-ears", "Pointed ears", "long pointed ears"), o("lashes", "Dramatic lashes", "long dramatic eyelashes"),
    o("glitter-freckles", "Glitter freckles", "gold glitter freckles"),
    o("big-forehead", "Big forehead", "a huge, tall, bulging forehead"), o("gap-teeth", "Gap teeth", "a wide gap between the two front teeth, clearly showing"),
    o("pointy-nose", "Pointy nose", "a long, sharply pointed nose"), o("jowls", "Jowls", "heavy sagging jowls and a double chin"),
    o("unibrow", "Unibrow", "one thick, bushy unibrow across the forehead"), o("big-ears", "Big ears", "big ears that stick far out from the head"),
  ] },
  { id: "makeup", label: "Makeup", humanOnly: true, options: [
    o("bare", "Bare", "bare, natural skin"), o("soft", "Soft natural", "soft natural makeup"), o("glam", "Bold glam", "bold glam makeup"),
    o("graphic", "Graphic liner", "graphic eyeliner"), o("goth", "Dark lips", "dark lipstick and smoky eyes"),
  ] },
  // Concrete garments, colors and materials: open models follow these far
  // better than a one-word style.
  { id: "style", label: "Style", options: [
    // Moods, not garments (the owner's idea, Oct 29): one fixed outfit per tile made
    // every "Colorful pop" sheet the same pink hoodie. The model now invents the
    // pieces, so each seed gives a different outfit in the same spirit.
    o("streetwear", "Streetwear", "a complete streetwear outfit from top to shoes: relaxed urban fits, layered casual pieces and sneaker-culture attitude"),
    o("athleisure", "Athleisure", "a complete athleisure outfit from top to shoes: sporty, comfortable performance fabrics styled for the street"),
    o("basics", "Minimal basics", "a complete minimal outfit from top to shoes: clean simple shapes in a calm neutral palette, nothing loud"),
    // Was "Y2K", which fought the Decade picker (Y2K + 1920s); the 2000s decade gives Y2K now.
    o("y2k", "Colorful pop", "a complete colorful pop outfit from top to shoes: bold saturated colors, playful clashing combinations and fun statement pieces"),
    o("tailoring", "Tailoring", "a complete tailored outfit from top to shoes: sharp structured cuts and a polished, dressed-up finish"),
    o("boho", "Boho", "a complete boho outfit from top to shoes: flowing layers, earthy warm tones, natural textures and handmade details"),
    o("techwear", "Techwear", "a complete techwear outfit from top to shoes: functional technical fabrics, straps and pockets in a dark utilitarian palette"),
    o("goth", "Goth", "a complete goth outfit from top to shoes: mostly black, dark romance with dramatic lace, leather or velvet touches"),
    o("preppy", "Preppy", "a complete preppy outfit from top to shoes: classic collegiate polish, crisp tidy pieces and heritage patterns"),
    o("runway", "Avant-garde", "a complete avant-garde look from top to shoes, as if straight off a Paris fashion week runway or a museum gala: sculptural, unexpected silhouettes, fashion as art"),
    o("western", "Western", "a complete western ranch outfit from top to shoes: denim, plaid flannel, a leather belt with a big buckle, fringe details and cowboy boots"),
    o("stage", "Stage costume", "a complete theatrical stage outfit from top to shoes, as if for a Broadway show, a play, a glam rock tour or a circus ring: showy and dramatic, made to be seen from the back row"),
  ] },
  // One thing on the head and one on the eyes: a cap and a beanie came back blended into one hat.
  // The era the character is dressed and groomed in (the owner's idea, Oct 27):
  // concrete cuts, fabrics and grooming per decade, so a 1940s tailoring pick
  // becomes pinstripes and padded shoulders instead of a modern suit.
  { id: "decade", label: "Decade", options: [
    o("1920s", "1920s", "1920s"), o("1940s", "1940s", "1940s"), o("1950s", "1950s", "1950s"), o("1960s", "1960s", "1960s"),
    o("1970s", "1970s", "1970s"), o("1980s", "1980s", "1980s"), o("1990s", "1990s", "1990s"), o("2000s", "2000s", "2000s"),
    o("2010s", "2010s", "2010s"), o("today", "Today", ""),
  ] },
  { id: "accessories", label: "Accessories", max: 3, exclusive: [["glasses", "sunglasses"], ["cap", "beanie"]], options: [
    o("glasses", "Glasses", "thin-framed glasses worn on the face over the eyes"), o("sunglasses", "Sunglasses", "sunglasses worn on the face over the eyes"), o("headphones", "Headphones", "over-ear headphones"),
    o("jewelry", "Jewelry", "layered gold chain necklaces, gold hoop earrings and stacked rings"), o("cap", "Cap", "a baseball cap worn on the head"), o("beanie", "Beanie", "a beanie worn on the head"), o("bag", "Bag", "a crossbody bag"),
  ] },
] as const satisfies readonly Field[];

export type FieldId = (typeof fields)[number]["id"];
/** Option ids picked per field. Single-pick fields hold exactly one id. */
export type Selection = Record<FieldId, string[]>;

export const defaultSelection: Selection = {
  kind: ["true-to-life"], gender: ["woman"], age: ["late-20s"], skin: ["medium-tan"], face: ["oval"], eyes: ["dark-brown"],
  hairStyle: ["long-wavy"], hairColor: ["dark-brown"], facialHair: ["none"], build: ["athletic"], height: ["average"],
  proportions: [], features: ["freckles"], makeup: ["soft"], style: ["streetwear"], decade: ["today"], accessories: [],
};

export function findField(id: FieldId): Field {
  return fields.find((field) => field.id === id)!;
}

// Objects and food came back as a person with a texture: a banana skin on a
// human body, hair over a mug's rim. Each one spells out its silhouette, so
// the model draws the shape itself, in every panel.
// name: what to call it; shape: the whole body; back: the back view.

/** The silhouette words for an object or food character, if it is one. */
export function objectShape(selection: Selection) {
  const kind = objects[selection.kind[0]];
  if (!kind) return undefined;
  const special = kind.hairBy?.[selection.hairStyle[0]];
  return { ...pickVariant(kind.variants, selection), hair: special ?? kind.hair, shaped: Boolean(special), hairNoun: special ? kind.hairNoun : undefined, wig: Boolean(kind.wig) };
}

/** The real animal a creature is, picked by its body tiles (a muscular shark is a great white). */
export function creatureSpecies(selection: Selection) {
  const creature = creatures[selection.kind[0]];
  if (!creature) return undefined;
  const species = pickVariant(creature.variants, selection);
  const fur = foxFur[selection.age?.[0] ?? ""] ?? foxFur["30s"];
  return { ...creature, species: { ...species, look: species.look.replace("{fur}", fur) } };
}

/** What the picked type became, e.g. "great white shark" or "travel mug", for Create to show. */
export function variantLabel(selection: Selection) {
  return creatureSpecies(selection)?.species.name ?? objectShape(selection)?.name;
}

function kindGroup(selection: Selection) {
  return findField("kind").options.find((option) => option.id === selection.kind[0])?.group;
}

/** Anything that isn't a human: creatures, robots, objects and food. Human-only fields are skipped. */
export function isCreature(selection: Selection) {
  return kindGroup(selection) !== "Human";
}

export function isSelection(value: unknown): value is Selection {
  if (!value || typeof value !== "object") return false;
  const picked = value as Record<string, unknown>;
  return fields.every((field: Field) => {
    const ids = picked[field.id];
    if (!Array.isArray(ids) || new Set(ids).size !== ids.length) return false;
    if (field.max ? ids.length > field.max : ids.length !== 1) return false;
    return ids.every((id) => field.options.some((option) => option.id === id));
  });
}

/** A custom skin, fur or feather color from the color picker, e.g. "#7fd1c7". */
export function isColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

/** The picked hairstyle as a wig ("a honey blonde wig stacked into…"), or nothing when bald. */
function wigOf(selection: Selection) {
  if (selection.hairStyle[0] === "bald") return "";
  const [hairColor] = words(selection, "hairColor");
  const template = findField("hairStyle").options.find((o) => o.id === selection.hairStyle[0])?.prompt ?? "";
  return template.includes("{color} hair")
    ? `a ${template.replace(/^(an?|the) /i, "").replace("{color} hair", "{color} wig").replace("{color}", hairColor)}`
    : `a wig styled as ${template.replace("{color}", hairColor)}`;
}

// Tall hairdos and hats fought (Oct 30 test: the beanie vanished into the pagoda,
// the snood into the mullet), so they can't be picked together. The tile just
// picked wins: a hat resets the hair to the default, a tall hairdo drops the hat.
export const tallHair = new Set(["afro", "mohawk", "space-buns", "comet-ponytail", "ribbon-loops", "lantern-bun", "wave-crest", "pagoda"]);
const hats = new Set(["cap", "beanie"]);

/** Drops picks hidden for the picked type: a trans or non-binary fox becomes male or female, a moth loses its braces. */
// Body tiles that fight across fields (owner, Oct 30): plus-size with a narrow
// waist, tall with short legs. The tile just picked wins; otherwise the
// proportion goes.
const bodyClashes: { field: "build" | "height"; ids: string[]; proportion: string }[] = [
  { field: "build", ids: ["plus-size"], proportion: "narrow-waist" },
  { field: "height", ids: ["tall", "very-tall"], proportion: "short-legs" },
];
export function fitKind(selection: Selection, random = Math.random, changed?: string): Selection {
  const gender = selection.gender[0];
  const genderFix: Record<string, string> = { "trans-woman": "woman", "trans-man": "man", "non-binary": random() < .5 ? "woman" : "man" };
  const next = { ...selection };
  if (hiddenOption(selection, "gender", gender)) next.gender = [genderFix[gender]];
  next.features = selection.features.filter((id) => !hiddenOption(selection, "features", id));
  next.proportions = selection.proportions.filter((id) => !hiddenOption(selection, "proportions", id));
  for (const clash of bodyClashes) {
    if (!next[clash.field].some((id) => clash.ids.includes(id)) || !next.proportions.includes(clash.proportion)) continue;
    if (changed === "proportions") next[clash.field] = ["average"];
    else next.proportions = next.proportions.filter((id) => id !== clash.proportion);
  }
  if (tallHair.has(next.hairStyle[0]) && (next.accessories ?? []).some((id) => hats.has(id))) {
    if (changed === "accessories") next.hairStyle = defaultSelection.hairStyle;
    else next.accessories = next.accessories.filter((id) => !hats.has(id));
  }
  return next;
}

export function randomSelection(random = Math.random): Selection {
  const pick = <T,>(list: readonly T[]) => list[Math.floor(random() * list.length)];
  return fitKind(Object.fromEntries(fields.map((field: Field) => {
    if (!field.max) return [field.id, [pick(field.id === "kind" ? field.options.filter((o) => !parkedKinds.has(o.id)) : field.options).id]];
    const shuffled = [...field.options].sort(() => random() - .5);
    return [field.id, cleanPicks(field, shuffled.slice(0, Math.floor(random() * (field.max + 1))).map((option) => option.id))];
  })) as Selection, random);
}

// Each era as materials and cuts applied to what was picked, plus the era's
// version of each headwear and eyewear pick. Listing era items ("cloche hats
// and newsboy caps") added a cap nobody picked (Oct 27), so items only change
// when they were picked, and nothing is added.
type Era = { make: string; hair: string; cap: string; beanie: string; glasses: string; sunglasses: string };
const eras: Record<string, Era> = {
  "1920s": { make: "wool tweed, pinstripes, high-waisted trousers with suspenders, drop waists and long beaded hems", hair: "finger waves or slicked-back side parts", cap: "a 1920s newsboy cap", beanie: "a 1920s felt cloche hat", glasses: "round wire-rim glasses", sunglasses: "small round tinted 1920s sunglasses" },
  "1940s": { make: "broad padded shoulders, double-breasted cuts, pinstripes, high-waisted pleated trousers, knee-length A-line skirts, wool and rayon", hair: "victory rolls or glossy side parts", cap: "a 1940s fedora", beanie: "a 1940s knit snood", glasses: "thick round 1940s frames", sunglasses: "1940s aviator sunglasses" },
  "1950s": { make: "full circle skirts, fitted cardigans, letterman jackets, cuffed denim, crisp white cotton, pastels and gingham", hair: "pin curls or a rockabilly quiff", cap: "a 1950s short-brim baseball cap", beanie: "a 1950s knit bobble hat", glasses: "browline or cat-eye frames", sunglasses: "1950s cat-eye sunglasses" },
  "1960s": { make: "mod shift cuts, slim tailoring with skinny ties, bold geometric op-art prints, mini lengths and go-go boots", hair: "a beehive or a mop-top", cap: "a 1960s mod newsboy cap", beanie: "a 1960s knit beret", glasses: "thick square 1960s frames", sunglasses: "white mod sunglasses" },
  "1970s": { make: "wide collars, flared high-waisted cuts, earth tones, corduroy, suede and polyester, and platform soles", hair: "feathered hair and big sideburns", cap: "a 1970s trucker cap", beanie: "a 1970s crochet beanie", glasses: "oversized 1970s tinted frames", sunglasses: "oversized 1970s aviators" },
  "1980s": { make: "neon colors, big shoulder pads, acid-wash denim, shiny nylon and high-top sneakers", hair: "big teased, permed hair", cap: "a 1980s snapback", beanie: "a 1980s slouchy knit hat", glasses: "big 1980s frames", sunglasses: "1980s wayfarer sunglasses" },
  "1990s": { make: "grunge flannel, baggy denim, slip-dress cuts, oversized fits and chunky soles", hair: "curtain-parted hair", cap: "a backwards 1990s baseball cap", beanie: "a 1990s grunge beanie", glasses: "small oval 1990s frames", sunglasses: "tiny oval 1990s sunglasses" },
  "2000s": { make: "Y2K low-rise cuts, velour, layered tank tops, rhinestones, baby pink and baby blue", hair: "frosted tips or chunky highlights", cap: "a 2000s trucker hat", beanie: "a 2000s slouchy beanie", glasses: "rimless 2000s glasses", sunglasses: "wraparound 2000s sunglasses" },
  "2010s": { make: "skinny cuts, hipster flannel, athleisure fabrics and statement sneakers", hair: "an undercut or a top knot", cap: "a 2010s flat-brim snapback", beanie: "a 2010s slouchy hipster beanie", glasses: "thick black hipster frames", sunglasses: "2010s mirrored aviators" },
};

function eraOf(selection: Selection) {
  const id = selection.decade?.[0];
  return id && eras[id] ? { name: id, ...eras[id] } : undefined;
}

/** The era sentence, or nothing for Today: it changes what was picked, never adds to it. */
function decadeLine(selection: Selection) {
  const era = eraOf(selection);
  if (!era) return "";
  return `, styled in the ${era.name}: its cuts, fabrics, colors and silhouettes are unmistakably ${era.name}${selection.hairStyle[0] === "bald" || objectShape(selection) ? "" : `, and the picked hairstyle is done the ${era.name} way (${era.hair})`}; nothing is added that wasn't picked, so the character clearly looks like someone from the ${era.name}`;
}


// Headphones, as the era had them (no wireless ones before the 2010s).
const eraHeadphones: Record<string, string> = {
  "1920s": "vintage 1920s bakelite earphones joined by a thin metal headband",
  "1940s": "vintage 1940s wired radio headphones with a metal headband",
  "1950s": "vintage 1950s wired headphones with a metal headband",
  "1960s": "1960s wired hi-fi headphones with padded cups",
  "1970s": "1970s wired padded over-ear headphones",
  "1980s": "1980s wired foam-pad Walkman-style headphones",
  "1990s": "1990s wired headphones",
  "2000s": "2000s wired over-ear headphones",
  "2010s": "2010s over-ear headphones",
};

/** The accessories, each swapped for its era version (a cap becomes a 1920s newsboy cap). */
// Jewelry came back as the same gold chains, hoops and rings on every sheet
// (strawberry, Oct 30), so it follows the picked style; Streetwear keeps the chains.
const styleJewelry: Record<string, string> = {
  athleisure: "a thin gold chain necklace and small stud earrings",
  basics: "one delicate silver pendant necklace and small silver studs",
  y2k: "chunky colorful beaded bracelets, a plastic charm necklace and bright mismatched rings",
  tailoring: "a slim gold wristwatch and a single signet ring",
  boho: "layered turquoise and wooden bead necklaces and stacked bangles",
  techwear: "a black metal chain choker and matte black rings",
  goth: "a black velvet choker with a silver pendant and heavy silver rings with dark stones",
  preppy: "a single string of pearls and a classic gold watch",
  runway: "one sculptural oversized metal statement necklace",
  western: "a turquoise bolo tie and a silver concho bracelet",
  stage: "rhinestone-studded necklaces and big sparkling chandelier earrings",
};

// Animals, robots and objects need garment names: on a style mood alone, Qwen left
// a chameleon bare in every seed, and named pieces dressed it at once (Oct 30). For
// variety (the owner: no two people should get the same character), each style has
// several outfits and the run's seed picks one, so a re-roll changes the clothes.
const outfitPools: Record<string, string[]> = {
  streetwear: ["a graphic hoodie, baggy cargo trousers and chunky sneakers", "an oversized varsity jacket over a printed tee, wide jeans and high-top sneakers", "a puffer vest over a long-sleeve tee, track trousers and skate shoes", "a boxy coach jacket, loose carpenter trousers and retro basketball sneakers"],
  athleisure: ["a zip-up track jacket over a sports top, joggers and running shoes", "a cropped quarter-zip pullover, leggings and trail runners", "a windbreaker over a tank top, fitted training trousers and court sneakers", "a fleece half-zip, tapered sweatpants and slip-on trainers"],
  basics: ["a plain crew-neck sweater, straight trousers and simple leather shoes", "a white button-up shirt, relaxed chinos and canvas sneakers", "a fine-knit cardigan over a plain tee, wide-leg trousers and loafers", "a simple overshirt, straight dark jeans and minimalist boots"],
  y2k: ["a bright patterned shirt, a colorful jacket, bold colored trousers and colorful sneakers", "a color-block windbreaker, printed trousers and chunky platform sneakers", "a fuzzy bright cardigan over a graphic top, flared trousers and glossy boots", "a neon bomber jacket, checkered trousers and two-tone sneakers"],
  tailoring: ["a fitted blazer over a shirt, tailored trousers and polished leather shoes", "a double-breasted suit jacket, pleated trousers and brogues", "a long tailored overcoat over a fine knit, slim trousers and Chelsea boots", "a waistcoat over a crisp shirt, sharply creased trousers and loafers"],
  boho: ["{a loose embroidered blouse|a loose embroidered shirt}, {a long flowing patterned skirt|wide patterned trousers} and leather sandals", "a fringed suede vest over a peasant top, flared patterned trousers and ankle boots", "a crochet cardigan, a flowing printed tunic, loose linen trousers and woven sandals", "a patchwork jacket, a gauzy shirt, wide embroidered trousers and moccasins"],
  techwear: ["a black technical jacket with straps, black cargo trousers and black tactical boots", "a hooded shell parka, utility harness, tapered cargo trousers and trail boots", "a matte waterproof anorak, articulated trousers with zip pockets and high-top sneakers", "a modular vest over a mock-neck top, strapped jogger trousers and combat boots"],
  goth: ["{a black lace dress|a black velvet coat}, black boots and silver jewelry", "a long black leather coat, a ruffled black shirt, black trousers and platform boots", "a black corset-laced jacket, black tattered trousers and buckled boots", "a black velvet blazer, a lace cravat, black skinny trousers and pointed boots"],
  preppy: ["a cable-knit sweater over a collared shirt, pleated chinos and loafers", "a navy blazer with a crest, a striped shirt, khaki trousers and boat shoes", "a sweater vest over an oxford shirt, tailored shorts and saddle shoes", "a quilted jacket, a polo shirt, corduroy trousers and penny loafers"],
  runway: ["a sculptural oversized coat, wide structured trousers and statement boots", "an asymmetric draped jacket, exaggerated balloon trousers and sculpted heels", "a padded architectural top, pleated wide-leg trousers and chunky platform shoes", "a deconstructed patchwork coat, layered skirt-trousers and futuristic boots"],
  stage: ["a sequined stage jacket, shiny flared trousers and glittering platform boots", "a velvet ringmaster coat with gold braid, striped trousers and polished boots", "a rhinestone-studded high-collared jacket, matching flared trousers and white platform boots", "a satin tailcoat with a ruffled shirt, metallic trousers and patent shoes"],
  western: ["a plaid flannel shirt, a fringed suede jacket, blue jeans with a big belt buckle and cowboy boots", "an embroidered western shirt, a denim vest, bootcut jeans and tooled cowboy boots", "a suede ranch jacket, a pearl-snap shirt, dark jeans and pointed boots", "a denim jacket over a gingham shirt, chaps over jeans and dusty cowboy boots"],
};
// "Colors that stand out" still gave a chameleon green, scale-textured clothes (Oct 30),
// so the fabric color is named too, from the seed.
const fabricColors = ["deep burgundy", "mustard yellow", "royal blue", "jet black", "cream white", "burnt orange", "plum purple"];
/** The fabric color for a seeded outfit. */
function fabricColor(seed = 0) {
  return fabricColors[Math.floor(Math.abs(seed) / 4) % fabricColors.length];
}
/** One outfit from the style's pool, picked by the seed: the same seed gives the same clothes. */
function pooledOutfit(selection: Selection, seed = 0) {
  const pool = outfitPools[selection.style?.[0] ?? ""] ?? outfitPools.streetwear;
  return pool[Math.abs(Math.floor(seed)) % pool.length].replace(/\{([^|}]*)\|([^}]*)\}/g, (_, a: string, b: string) => feminine.has(selection.gender[0]) ? a : b);
}

function eraAccessories(selection: Selection) {
  const era = eraOf(selection);
  const field = findField("accessories");
  return cleanPicks(field, selection.accessories ?? []).map((id) => {
    const words = field.options.find((o) => o.id === id)?.prompt ?? "";
    // Not tied to one spot: on the head over the ears, or round the neck when a hat takes the head.
    if (id === "headphones") {
      const hat = (selection.accessories ?? []).some((a) => a === "cap" || a === "beanie");
      // Long coiled cords dangled to the floor (fox, Oct 29): one short cord into a pocket.
      const wired = era && era.name !== "2010s";
      return `${era ? eraHeadphones[era.name] : words} ${hat ? "worn around the neck" : "worn over the ears on the head"}${wired ? ", with one short, neat cord running down into a pocket" : ""}`;
    }
    if (id === "jewelry") return styleJewelry[selection.style?.[0] ?? ""] ?? words;
    // Western had no cowboy hat (owner, Oct 30): its cap or beanie becomes one, in any decade.
    if ((id === "cap" || id === "beanie") && selection.style?.[0] === "western") return "a cowboy hat worn on the head";
    if (!era) return words;
    if (id === "cap") return `${era.cap} worn on the head`;
    if (id === "beanie") return `${era.beanie} worn on the head`;
    if (id === "glasses") return `${era.glasses} worn on the face over the eyes`;
    if (id === "sunglasses") return `${era.sunglasses} worn on the face over the eyes`;
    return words;
  }).filter(Boolean);
}

/**
 * Brings an older saved look up to date: fills controls added later (decade)
 * and maps removed options (Disco era became Streetwear in the 1970s), so
 * "Use these settings" and Redo keep working on old sheets.
 */
export function upgradeSelection(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const old = value as Record<string, unknown>;
  const next: Record<string, unknown> = { ...defaultSelection, ...Object.fromEntries(Object.entries(old).filter(([, v]) => v !== undefined)) };
  if (Array.isArray(old.style) && old.style[0] === "disco") {
    next.style = ["streetwear"];
    if (!Array.isArray(old.decade)) next.decade = ["1970s"];
  }
  return next;
}

/** The picks with conflicts removed: of two options that can't go together, the first one picked stays. */
export function cleanPicks(field: Field, picks: readonly string[]) {
  const kept: string[] = [];
  for (const pick of picks) {
    if (field.exclusive?.some((group) => group.includes(pick) && kept.some((k) => group.includes(k)))) continue;
    kept.push(pick);
  }
  return kept;
}

/** Picking a tile in a multi-pick field: drops anything it can't go with. */
export function withPick(field: Field, picks: readonly string[], id: string) {
  const group = field.exclusive?.find((g) => g.includes(id));
  return [...picks.filter((p) => !group?.includes(p)), id];
}

// "{a|b}" in an outfit: the first for women, the second for everyone else.
const feminine = new Set(["woman", "trans-woman"]);

function words(selection: Selection, id: FieldId) {
  const field = findField(id);
  const womens = feminine.has(selection.gender?.[0] ?? "");
  return cleanPicks(field, selection[id] ?? []).map((pick) => field.options.find((option) => option.id === pick)?.prompt ?? "")
    .map((text) => text.replace(/\{([^|}]*)\|([^}]*)\}/g, (_, a: string, b: string) => womens ? a : b))
    .filter(Boolean);
}

function list(items: string[]) {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

const capitalize = (text: string) => text.replace(/^(\w)/, (c) => c.toUpperCase());

// Build words alone ("huge bodybuilder build") read as a man's body, so the
// body says whose it is: a female bodybuilder's physique stays a woman's.
const bodyOf: Record<string, string> = {
  woman: "a woman's body", "trans-woman": "a woman's body", man: "a man's body", "trans-man": "a man's body", "non-binary": "an androgynous body",
};

/**
 * The proportion words, made to add up (the owner's note, Oct 28): a tall
 * character with short legs needs a very long torso, a petite one with long
 * legs a short torso; otherwise the model drops one of the picks.
 */
function proportionWords(selection: Selection) {
  const list = words(selection, "proportions");
  const tall = selection.height.some((h) => h === "tall" || h === "very-tall");
  const petite = selection.height.includes("petite");
  if (tall && selection.proportions.includes("short-legs")) list.push("a very long torso that makes up most of the height, so it is tall even though its legs are short");
  if (petite && selection.proportions.includes("long-legs")) list.push("a very short torso");
  return list;
}

/** Head shape words; a Tiny head is dropped when Big head is picked, since they can't both be true. */
function headShapeWords(selection: Selection) {
  return selection.proportions.includes("big-head") ? words(selection, "face").filter((w) => !/small head/.test(w)) : words(selection, "face");
}

// Height and proportions said inside the front panel, where the model looks;
// in the body sentence alone, a big head and tall stature didn't come through.
const panelHeight: Record<string, string> = { petite: "a petite, short figure", tall: "a tall figure", "very-tall": "a very tall, towering figure" };

function panelBody(selection: Selection) {
  // The proportion words up to their comparison: "a huge head", "very long legs", "a noticeably long, slender neck".
  const shown = [
    ...selection.height.map((h) => panelHeight[h]).filter(Boolean),
    ...proportionWords(selection).map((w) => w.split(/, (?=clearly|much|about|far|like)/)[0]),
  ];
  // Caption style from Midjourney's describe (the owner's research, Oct 29):
  // "a full body shot reveals his overall exaggerated proportions, including…".
  return shown.length ? `, revealing the overall exaggerated proportions, including ${list(shown)}` : "";
}


/** The picked height and proportions as short visible phrases: "a tall figure", "very long legs…", "a huge head". */
function shapeWords(selection: Selection) {
  return [
    ...selection.height.map((h) => panelHeight[h]).filter(Boolean),
    ...proportionWords(selection).map((w) => w.split(/, (?=clearly|much|about|far|like|the hips)/)[0]),
  ];
}

function bodyDescription(selection: Selection) {
  const [height] = words(selection, "height");
  const [build] = words(selection, "build");
  const proportions = proportionWords(selection);
  // Robots say their gender in the metal (robotGender): "a woman's body" gave a human body.
  const whose = kindGroup(selection) === "Robot" ? "" : bodyOf[selection.gender[0]];
  return capitalize(`${build}${whose ? `, clearly ${whose}` : ""}, ${height}${proportions.length ? `, with ${list(proportions)}` : ""}`);
}

// A real face photo (with consent). The style photo was dropped: Wardrobe does outfits from images.
// A real person's photo (with consent): their face, or their face and body
// (whole-person photos, Oct 27). With the body, the
// photo decides build, height and proportions; the tiles restyle the rest.
export type References = { face?: boolean; body?: boolean };

// Most outfit words lean male unless the fit is said ("black techwear" gave a
// trans woman a man's look), and a gender word alone is easy to outweigh.
const outfitFit: Record<string, string> = {
  woman: "in a women's cut and fit", "trans-woman": "in a women's cut and fit",
  man: "in a men's cut and fit", "trans-man": "in a men's cut and fit", "non-binary": "in a relaxed unisex fit",
};

const humanGender: Record<string, string> = {
  woman: "She clearly presents as a woman, with a feminine face, figure and styling",
  "trans-woman": "She is a trans woman and clearly presents as a woman, with a feminine face, figure and styling",
  man: "He clearly presents as a man, with a masculine face, figure and styling",
  "trans-man": "He is a trans man and clearly presents as a man, with a masculine face, figure and styling",
  "non-binary": "They present androgynously, with a face, figure and styling that are neither clearly masculine nor feminine",
};

// Objects only said "its manner is a woman's" at the end, which can't be drawn:
// a woman strawberry came out without any female cue (Oct 26).
// Gender said in the panels too: on Unhinged the one gender sentence was
// outweighed by the horror words and the strawberry didn't read as female (Oct 27).
const objectPanelGender: Record<string, { front: string; face: string }> = {
  woman: { front: ", posing like a woman with one hand on her hip", face: ", with her long curled eyelashes and lipstick clearly visible" },
  "trans-woman": { front: ", posing like a woman with one hand on her hip", face: ", with her long curled eyelashes and lipstick clearly visible" },
  man: { front: ", posing like a man with his feet apart", face: ", with his bushy eyebrows clearly visible" },
  "trans-man": { front: ", posing like a man with his feet apart", face: ", with his bushy eyebrows clearly visible" },
};

// Light cues set into the object: "full glossy lips with lipstick" made a
// human woman's face on the strawberry (Oct 26).
const objectGender: Record<string, (name: string) => string> = {
  woman: (name) => `She clearly reads as female: long curled eyelashes and a touch of lipstick on the mouth set into the ${name}, and a feminine pose`,
  "trans-woman": (name) => `She clearly reads as a woman: long curled eyelashes and a touch of lipstick on the mouth set into the ${name}, and a feminine pose`,
  man: (name) => `He clearly reads as male: bushy eyebrows above the eyes set into the ${name}, and a masculine, square-shouldered pose`,
  "trans-man": (name) => `He clearly reads as a man: bushy eyebrows above the eyes set into the ${name}, and a masculine, square-shouldered pose`,
  "non-binary": () => "They read as androgynous: features and a pose that are neither clearly masculine nor feminine",
};

// "Bushy eyebrows" drew two brows over the avocado's unibrow (Oct 30): with a
// brow pick, the male cue names that brow instead.
function objectGenderLine(selection: Selection, name: string) {
  const line = objectGender[selection.gender[0]]?.(name) ?? "";
  return selection.features.some((id) => browIds.includes(id)) ? line.replace(`bushy eyebrows above the eyes set into the ${name}, and `, "a gruff expression and ") : line;
}
function objectFaceCue(selection: Selection) {
  const cue = objectPanelGender[selection.gender[0]] ?? { front: "", face: "" };
  const brow = selection.features.includes("unibrow") ? "single unbroken unibrow" : "eyebrows";
  return selection.features.some((id) => browIds.includes(id)) ? { ...cue, face: cue.face.replace("bushy eyebrows", brow) } : cue;
}

// Robots read "a woman's body" and "freckles across the cheeks" as a human
// woman: FLUX 3 Klein drew a human face on a tin robot (Oct 27). So the face
// plate is named, gender is a shape in the metal, and face marks are painted on.
const robotPlate: Record<string, string> = {
  robot: "a smooth glossy enamel face plate with brushed-chrome edges",
  "retro-bot": "a flat painted tin face plate with rivets around its edge",
};
const robotGender: Record<string, string> = {
  woman: "She reads as female through her shape: a narrow-waisted chassis with curved hip panels, and long painted eyelashes around the glowing eyes",
  "trans-woman": "She reads as a woman through her shape: a narrow-waisted chassis with curved hip panels, and long painted eyelashes around the glowing eyes",
  man: "He reads as male through his shape: a broad, square chassis and heavy painted eyebrows above the glowing eyes",
  "trans-man": "He reads as a man through his shape: a broad, square chassis and heavy painted eyebrows above the glowing eyes",
  "non-binary": "They read as androgynous: a chassis that is neither clearly masculine nor feminine",
};

const creatureGender: Record<string, string> = {
  woman: "She clearly reads as female: a feminine figure and posture, a narrower waist, softer features around the eyes and long eyelashes",
  man: "He clearly reads as male: a masculine figure and posture, a broader chest and heavier brow",
  "trans-woman": "She clearly reads as a woman: a feminine figure and posture, softer features around the eyes and long eyelashes",
  "trans-man": "He clearly reads as a man: a masculine figure and posture, a broader chest and heavier brow",
  "non-binary": "They read as androgynous: a figure and posture that are neither clearly masculine nor feminine",
};

function describe(selection: Selection, references: References, color?: string, detail = "", weird: Weirdness = 0) {
  const spec = creatureSpecies(selection);
  const creature = isCreature(selection);
  const who = `${words(selection, "gender")[0]} ${words(selection, "age")[0]}`;
  // A named real animal standing upright, not "a hybrid with a human body":
  // that gave a human woman with a few shark marks.
  // A custom color replaces the animal's own coloring, said where the animal
  // is described: "russet fur, a white chest" otherwise won (fox, Oct 26).
  const animalLook = spec && color
    ? `${spec.species.look.split(" with ")[0]} whose ${coat[selection.kind[0]] ?? "fur"} ${/s$/.test(coat[selection.kind[0]] ?? "") ? "are" : "is"} entirely ${colorName(color)} all over, instead of its natural colors`
    : spec?.species.look;
  const kindWords = spec
    ? `an upright ${spec.species.name} creature with the personality of a ${who}: ${animalLook}, standing and moving like a person, ${weird >= 2 ? "like an uncanny creature in a surreal live-action horror-comedy, photographed for real" : "like a realistic creature in a big-budget live-action film"}`
    : words(selection, "kind")[0].replace("{who}", who).replace(weird >= 2 ? "a friendly " : "\u0000", "a ");
  const [hairColor] = words(selection, "hairColor");
  const picked = words(selection, "hairStyle")[0].replace("{color}", hairColor);
  // On creatures the hair hung from behind the head (opossum tests, Oct 23),
  // even when told where it grows. The owner suggested calling it a wig: a wig
  // has an obvious place, sitting on the crown with its front edge on the forehead.
  // Built from the style's own words so the color stays attached: cutting
  // " hair" out of "red hair sculpted into…" gave "a red sculpted into… wig",
  // and the fox's wig came out its own silver (Oct 26).
  const hairWig = spec ? wigOf(selection) : "";
  // Its own sentence, like accessories: in a list it got lost. The color is
  // said again on its own, since the animal's fur color pulls the wig toward it.
  const wig = hairWig
    ? `In every panel it wears ${hairWig} on top of the ${spec!.species.name}'s head, ${/ears/.test(spec!.head) ? "sitting on the crown between the ears like a cap" : "sitting on the crown like a cap"}, its front edge low on the forehead just above the eyes${/ears/.test(spec!.head) ? ", the ears poking out through it" : ""}; the wig is clearly ${hairColor}, a different color from the ${coat[selection.kind[0]] ?? "fur"}`
    : "";
  const robot = kindGroup(selection) === "Robot";
  // Robots: the hairstyle is part of the shell, so it doesn't turn into a human wig.
  const hair = wig ? "" : robot && selection.hairStyle[0] !== "bald" ? `${picked} molded from glossy painted plastic as part of the head shell` : picked;
  // Facial hair never said its color. People and robots: the hair color.
  // Robots: fixed to the chin, or it read as another braid of the hair (Oct 26).
  // Animals: its own sentence, like the wig, or it was dropped (fox, Oct 26).
  const beards = words(selection, "facialHair").filter((fh) => !(spec && fh === "light stubble"));
  const facialHair = spec ? [] : beards.map((fh) => robot
    // A mustache "fixed to the chin and jaw" (retro bot, Oct 30): mustaches sit above the mouth slot.
    ? `${fh}, ${hairColor}, molded from glossy painted plastic and fixed to the face ${/mustache/.test(fh) ? "just above the mouth slot" : "along the chin and jaw"}`
    : `${fh} in ${hairColor}`);
  const beard = spec && beards.length
    ? `In every panel it also wears ${beards.map((fh) => fh.replace(/^(an?) /, `${/^[aeiou]/i.test(hairColor) ? "an" : "a"} ${hairColor} `)).join(" and ")}, ${beards.every((fh) => /mustache/.test(fh))
      // A mustache on an owl sat where a human mouth would be (Oct 29): say where it goes.
      ? /beak/.test(spec.head) ? `attached across the top of the ${spec.species.name}'s beak, just below the eyes, like a costume piece` : `attached just above the ${spec.species.name}'s mouth${/nose/.test(spec.head) ? ", below the nose" : ""}, like a costume piece`
      : `attached to the ${spec.species.name}'s chin${/beak/.test(spec.head) ? ", under the beak," : ""} like a costume piece`} and clearly visible over the ${coat[selection.kind[0]] ?? "fur"}`
    : "";
  // Said in words, for what the character is made of; animals say it above.
  const skin = !color ? (creature ? "" : words(selection, "skin")[0])
    : spec ? ""
    : robot ? `body panels and casing painted ${colorName(color)}`
    : creature ? `a ${colorName(color)} color all over`
    : `${colorName(color)} skin all over, like full body paint`;
  // The picked eye color, placed where this animal's eyes are (a hammerhead's
  // are at the ends of the hammer), so it doesn't fight the animal's own eyes.
  // Robots: the picked color lights their LED eyes; human eye words gave them human eyes.
  const eyeWords = words(selection, "eyes")[0] ?? "";
  const eyes = spec ? `exactly two ${eyeWords.startsWith("one ") ? `eyes, ${eyeWords}` : eyeWords}, in the places where a ${spec.species.name} has its eyes, and no other eyes anywhere${glassesOn(selection) ? ", both behind the lenses of the glasses" : ""}`
    : robot ? robotEyes(words(selection, "eyes")[0])
    : words(selection, "eyes")[0];
  const look = references.face
    ? [hair, ...facialHair].filter(Boolean)
    : [skin, ...(creature ? [] : headShapeWords(selection)), eyes, hair, ...facialHair].filter(Boolean);
  const person = references.face
    ? creature
      ? `the person in the first reference image reimagined as ${kindWords}, keeping their recognizable expression`
      : references.body
        ? "the person in the first reference image, keeping their exact face, features, skin tone, body shape, height and proportions, restyled with the hair, outfit and details below"
        : "the person in the first reference image, keeping their exact face, features and skin tone"
    : kindWords;
  // Animals have their own ears and no human brows or cheeks to dimple.
  const featureIds = cleanPicks(findField("features"), selection.features);
  const brows = featureIds.filter((id) => browIds.includes(id));
  const features = words(selection, "features")
    .map((f, i) => featureIds[i] === brows[0] ? browPhrase(brows, Boolean(spec)) : spec && creatureFeatures[featureIds[i]] ? creatureFeatures[featureIds[i]].replace("{coat}", coat[selection.kind[0]] ?? "fur") : f)
    .filter((_, i) => !(spec && (creatureSkip.has(featureIds[i]) || noFaceFor[selection.kind[0]]?.has(featureIds[i]))) && !(browIds.includes(featureIds[i]) && featureIds[i] !== brows[0]))
    .map((f, i) => robot && !references.face && humanFaceFeatures.has(featureIds[i]) ? `${f}, painted onto the metal face plate` : f);
  // The first owl test came back as a human face wearing an owl mask.
  const group = kindGroup(selection);
  // "The personality of a woman" can't be drawn; a visible cue can.
  const genderCue = spec ? creatureGender[selection.gender[0]] : "";
  const head = spec
    ? `${capitalize(glassesOn(selection) ? spec.head.replace(/(?<!under the )\b(?:(?:small|huge|large|round|forward-facing|shiny|black|cone-shaped|turret),? )*eyes\b/, "two eyes, both hidden behind the lenses of the glasses") : spec.head)}, not a mask or costume, with no human nose, lips, chin or skin. ${capitalize(spec.skin.replace("covers the whole body", "covers the whole body under the clothes"))}. It has ${spec.extras}${genderCue ? `. ${genderCue}` : ""}`
    : group === "Creature"
    ? "The whole head is the animal's own head, not a mask or costume: no human nose, lips, chin or skin on the face"
    : group === "Robot" && !references.face
    ? `Its face is ${robotPlate[selection.kind[0]] ?? "a metal face plate"}, with glowing eyes and a simple mechanical slot mouth, not human skin, lips or a human nose. Its neck, hands, arms and legs are metal too, with visible joints: a whole machine, not a person in a costume. ${robotGender[selection.gender[0]] ?? ""}`.trim()
    : group === "Human" ? "" : "The whole body is the thing itself with a face on it, not a person in a costume";
  // The first moth sheet drew the vest over the wing roots, and every later
  // outfit copied it. Body parts that grow from the back must come out
  // through the clothes.
  // For named animals only their extras count (a luna moth's "trailing tails" are its wings).
  const parts = backParts(selection, spec ? spec.extras : kindWords, detail);
  const verb = parts === "tail" || parts === "dorsal fin" ? "grows" : "grow";
  // Said as what to see, not what to avoid: open models read "never covered"
  // as "no clothes".
  const anatomy = parts ? `The ${parts} ${verb} out of the body and ${verb === "grows" ? "comes" : "come"} out through openings in the clothing, attached on top of the fabric` : "";
  return { person, look, features, creature, head, anatomy, parts, spec, wig, beard };
}

const backPartWords = ["wings", "tail", "dorsal fin"];


/** What each animal's body is covered in, for a custom color. */
const coat: Record<string, string> = { owl: "feathers", axolotl: "skin", shark: "skin", chameleon: "scales", moth: "fuzzy fur" };

/** "green eyes" → "glowing green LED eyes"; "one brown eye and one blue eye" → each glowing. */
function robotEyes(eyes: string) {
  return / eyes$/.test(eyes) ? `glowing ${eyes.replace(/ eyes$/, "")} LED eyes` : `LED eyes glowing ${eyes.replace(/ eye\b/g, "")}`;
}

// With glasses on, the animal's own eye words ("small round eyes") drew a second
// pair beside the lenses (axolotl, Oct 29), so its eyes are said to be behind them.
function glassesOn(selection: Selection) {
  return (selection.accessories ?? []).some((a) => a === "glasses" || a === "sunglasses");
}

/** Tiles that don't apply to the picked animal, hidden in Create (it has its own ears and nose). */
// Types parked until they work: the sneaker kept coming back as a human face in a
// leather hood, even with "head in the shape of a shoe" (Oct 30). Old looks still load.
const parkedKinds = new Set(["sneaker"]);

export function hiddenOption(selection: Selection, field: string, id: string) {
  if (field === "kind") return parkedKinds.has(id);
  const kind = selection.kind[0];
  // Animals, robots, objects and food read as male or female (owner, Oct 30).
  if (field === "gender") return kindGroup(selection) !== "Human" && (id === "trans-man" || id === "trans-woman" || id === "non-binary");
  // Objects and moths (which have their own) don't get the wing tiles.
  if (field === "proportions" && /wings$/.test(id)) return Boolean(objectShape(selection)) || kind === "moth";
  if (objectShape(selection)) return field === "features" && objectHidden.has(id);
  if (!creatures[kind]) return false;
  return field === "features" && (creatureSkip.has(id) || Boolean(noFaceFor[kind]?.has(id)));
}
// A moth has no mouth or ears: braces turned its head into a human face (Oct 30).
const noFaceFor: Record<string, Set<string>> = {
  moth: new Set(["gold-grill", "braces", "gap-teeth", "ear-piercings", "jowls"]),
  chameleon: new Set(["ear-piercings"]),
};
// Human-face picks said for an animal's own face: "a small tattoo under one eye"
// and "gold glitter freckles" were dropped on fur and scales (Oct 30).
const creatureFeatures: Record<string, string> = {
  // One small tattoo under an eye hid behind sunglasses and barely showed (Oct 30): below both eyes and on the forehead.
  "face-tattoo": "dark tattoo designs dyed into the {coat} just below both eyes and in the middle of the forehead",
  freckles: "dark freckle-like spots dotted across the cheeks",
  "glitter-freckles": "sparkling gold glitter dots stuck across the cheeks",
  "beauty-mark": "one dark beauty-mark spot on the cheek",
  "gold-grill": "a shiny gold grill over its front teeth, clearly visible because its mouth is slightly open",
  braces: "colorful braces on its own teeth, clearly visible because its mouth is slightly open",
  "gap-teeth": "a wide gap between its two front teeth, clearly visible because its mouth is slightly open",
  "big-forehead": "a huge, tall, bulging domed top of the head above the eyes",
  lashes: "long, thick, dramatic false eyelashes stuck on above both eyes",
};
const creatureSkip = new Set(["pointed-ears", "dimples", "pointy-nose", "big-ears"]);
// Brow picks make ONE brow: the unibrow first, then bleached, then the slit
// ("a bleached unibrow with a shaved slit"), instead of three brows that fight.
// Animals wear them as hair above the eyes (axolotl lost them, Oct 29).
const browIds = ["unibrow", "bleached-brows", "brow-slit"];
function browPhrase(ids: string[], creature: boolean) {
  const uni = ids.includes("unibrow"), bleached = ids.includes("bleached-brows"), slit = ids.includes("brow-slit");
  const brow = uni
    ? `one thick ${bleached ? "pale bleached " : "dark "}band of hair running straight across the forehead from one side to the other just above both eyes, unbroken in the middle${slit ? ", cut clean through on the left by a short diagonal shaved line that splits it" : ""}`
    : `${bleached ? "bleached, almost white eyebrows" : "eyebrows"}${slit ? ", the left one cut clean through by a short diagonal shaved line that splits it into two pieces" : ""}`;
  return creature ? `${brow}, made of hair fixed above the eyes like a costume piece` : brow;
}

/** Wings, tail or fin a saved look has, so later outfits keep them on top of the clothes. */
export function lookParts(look: Look | undefined) {
  if (!look) return "";
  const spec = creatureSpecies(look.selection);
  return backParts(look.selection, spec ? spec.extras : words(look.selection, "kind")[0] ?? "", look.detail);
}

function backParts(selection: Selection, kindWords: string, detail: string) {
  const text = [kindWords, ...words(selection, "features"), ...words(selection, "proportions"), detail].join(" ").toLowerCase();
  return list(backPartWords.filter((part) => new RegExp(`\\b${part.replace(/s$/, "")}s?\\b`).test(text)));
}

// The back view kept the front's hands and feet (toes and palms toward the
// camera), worst on the weirder characters (Oct 23, Oct 26). Saying only the
// hands wasn't enough, so the whole body is turned: heels, knees, elbows,
// knuckles, and which side each arm ends up on. Shared with Wardrobe.
export const backPose = "the whole body turned completely around, exactly as if the camera walked behind it: the heels of both shoes face the camera and the toes point away, the backs of the knees and the elbows face the camera, the backs of the hands and the knuckles face the camera with the palms toward the body, and its left arm and leg are now on the right side of the picture";

/** Everything that decides a character sheet, saved so it can be restored later. */
export type Look = { selection: Selection; color?: string; detail: string; weird?: Weirdness };

// The weirdness switch on Create: 0 leaves the tiles as they are; higher
// levels push every picked feature further, said once near the top of the prompt.
// Renamed Oct 27: the levels make what's picked bolder, for people especially.
export const weirdness = ["Off", "Bold", "Extreme", "Unhinged"] as const;
export type Weirdness = 0 | 1 | 2 | 3;
export function isWeirdness(value: unknown): value is Weirdness {
  return value === 0 || value === 1 || value === 2 || value === 3;
}
// People: the generic lines (and then named monster parts) turned everyone
// into spidery nightmares (Oct 27). The owner wants what was picked made
// bolder instead: an extreme bob, extremely tall, a huge chin. So people get
// their own picks back, pushed further per level, and stay human.
// Then a fixed list per level ("an oversized grin full of teeth", "theatrical face
// paint", "tiny waist and huge shoulders") gave every Unhinged person the same grin
// and fought the picks (bare skin, slim build; Oct 30). Now people work like the
// creatures: their own head, eyes and features and what they picked are pushed,
// said as a version of themselves, and the expression and makeup are left alone.
// No body shape or outfit colors either: "a gangly body" and "clashing colors" beat a
// Bodybuilder pick and a gray Tailoring suit (Oct 30); the picks carry the body.
const humanLevels: Record<1 | 2 | 3, { lead: string; head: string; eyes: string; features: string; body: string; hair: string; rest: string; push: string }> = {
  1: {
    lead: "a bold, striking version of themselves", head: "a head a little too big for the body", eyes: "eyes a little larger and more intense",
    features: "their own nose, ears, brows and lips a little bolder", body: "", hair: "the hair fuller and more dramatic",
    rest: "the outfit and accessories a little bigger, in their own colors", push: "made a little bolder than real",
  },
  2: {
    lead: "a caricature of themselves", head: "a head far too big for the body", eyes: "eyes twice their real size",
    features: "their own nose, ears, chin and jaw stretched and oversized", body: "", hair: "the hair twice its volume",
    rest: "the outfit's shapes hugely exaggerated, in its own colors, and every accessory oversized", push: "pushed to an extreme: larger, taller, longer and bigger than any real person",
  },
  3: {
    lead: "a surreal, uncanny version of themselves", head: "a huge swollen head three times too big for the body", eyes: "enormous eyes of slightly different sizes",
    features: "their own nose, ears, chin and jaw grotesquely oversized and twisted", body: "", hair: "the hair absurdly huge and gravity-defying",
    rest: "the outfit's shapes absurd and gigantic, in its own colors, and every accessory gigantic", push: "pushed to an unhinged, surreal extreme, wildly out of proportion",
  },
};

/** People: a version of themselves, then the picks themselves pushed; anatomy stays human. With a photo, the likeness is kept. */
function humanWeirdLine(selection: Selection, weird: Weirdness, photo?: { face?: boolean; body?: boolean }) {
  if (!weird) return "";
  const level = humanLevels[weird];
  const height = words(selection, "height").filter((h) => h !== "average height");
  const picks = [
    words(selection, "hairStyle")[0]?.replace("{color} ", "").replace("{color}", ""),
    ...words(selection, "facialHair"),
    words(selection, "build")[0],
    ...height.map((h) => h.split(",")[0]),
    ...proportionWords(selection).map((w) => w.split(/, (?=clearly|much|about|far|like)/)[0]),
    ...headShapeWords(selection),
    ...words(selection, "features"),
  ].filter(Boolean).map((pick) => (pick as string).replace(/^(an?|the) /, ""));
  const parts = [...(photo?.face ? [] : [level.head, level.eyes, level.features]), ...(photo?.body ? [] : [level.body]), level.hair, level.rest].filter(Boolean);
  const anatomy = weird === 3
    ? "; they are still a real human with normal anatomy (two eyes, one nose, one mouth, two arms, two legs), not a monster"
    : "; they are still a real, believable person";
  // "A man dressed as a caricature character… large prosthetic ears, prominent buck
  // teeth" (Midjourney describe, Oct 29): the extremes read as makeup on a real person.
  const caricature = weird >= 2 ? ". They look like a real person dressed as a caricature character, the exaggerated features made with realistic prosthetics, hair pieces and makeup" : "";
  return `They are ${level.lead}: ${list(parts)}, the same in both panels${picks.length ? `. Their ${list(picks)} are each ${level.push}` : ""}${anatomy}${caricature}`;
}
// Said in the first sentence too, like the creatures: mid-prompt it was drowned out (Oct 29).
// The skin tone goes with it: an Unhinged woman with very deep skin came out light (Oct 30).
const humanOpener: Record<Weirdness, string> = {
  0: "",
  1: ", a bold, exaggerated version of a real person with a head a little too big for the body,",
  2: ", a real person as a wildly exaggerated caricature with a head far too big for the body and eyes twice their real size,",
  3: ", a real person as a surreal, uncanny caricature with a huge swollen head three times too big for the body,",
};
const panelHuman: Record<Weirdness, { front: string; face: string }> = {
  0: { front: "", face: "a relaxed, friendly expression" },
  1: { front: ", the head a little too big for the body, plain to see", face: "a confident, striking expression" },
  2: { front: ", a caricature with a head far too big for the body and eyes twice their real size, plain to see", face: "a bold, exaggerated expression" },
  3: { front: ", a surreal caricature with a huge swollen head three times too big for the body, plain to see", face: "an unhinged, manic expression" },
};
export function weirdLine(weird: Weirdness = 0) {
  return weird ? `They are ${humanLevels[weird].lead}` : "";
}

// Objects: the human-face words above made the close-up a human face in a
// beanie (toaster test, Oct 22), so objects warp their own shape and keep the
// face set into their surface, the same in every panel.
const objectWeirdWords: Record<Weirdness, string> = {
  0: "",
  1: "is a little off: slightly swollen and lopsided, with a face a little too big for it",
  2: "is a caricature of itself: bulging, stretched and far out of proportion, with an oversized face",
  3: "is a grotesque, surreal nightmare version of itself: bloated, sagging and twisted out of any real proportion, with an enormous face",
};
export function objectWeirdLine(name: string, weird: Weirdness = 0) {
  return weird ? `The ${name} ${objectWeirdWords[weird]}, but the eyes and mouth stay set into the ${name}'s own surface and are exactly the same face in every panel` : "";
}

// The houseplant came out nearly the same at every level (Oct 26): the body,
// face and limb sentences said "real shape and proportions", "slightly
// uncanny" and "thin arms", which outweighed one weirdness sentence. So those
// sentences change with the level themselves.
const objectBody: Record<Weirdness, string> = {
  0: "shape, proportions, color and texture",
  1: "color and texture, with its shape pushed a little: slightly swollen and lopsided",
  2: "color and texture, but its shape is a caricature: swollen, bulging and stretched far out of true proportion",
  3: "color and texture, but its shape is grotesquely warped: bloated, bulging, sagging and twisted far out of any real proportion",
};
const objectFace: Record<Weirdness, string> = {
  0: "realistic wet glossy eyes with {iris} irises and visible eyelids, and a realistic mouth with lips and teeth{extras}, slightly uncanny",
  1: "realistic wet glossy eyes a little too big, with {iris} irises and visible eyelids, and a realistic mouth a little too wide, with lips and teeth{extras}, unsettling",
  2: "bulging wet eyes twice too big, with {iris} irises and heavy eyelids, and a stretched grin full of crowded human teeth{extras}, creepy",
  3: "enormous bulging bloodshot wet eyes of different sizes, with {iris} irises, and a huge gaping mouth stretched across the whole front, crammed with far too many human teeth and a wet tongue{extras}, deeply uncanny",
};
const objectLimbs: Record<Weirdness, { limbs: string; hands: string }> = {
  0: { limbs: "thin arms and exactly two thin legs", hands: "realistic hands and feet" },
  1: { limbs: "thin arms and exactly two thin legs, a little too long", hands: "realistic hands and feet" },
  2: { limbs: "long, spindly arms and exactly two long, spindly legs, too long for its body", hands: "knobbly, long-fingered hands and big feet" },
  3: { limbs: "gangly, spidery arms and exactly two gangly, spidery legs, far too long for its body, with knobbly elbows and knees", hands: "long, bony-fingered hands and oversized feet" },
};
// "Exactly two thin arms and exactly two thin legs" outweighed Plus-size
// (avocado, Oct 30): on Normal and Bold the limbs and body follow the Build.
const objectBuild: Record<string, { limbs: string; body: string }> = {
  slim: { limbs: "thin", body: "slim and narrow" },
  athletic: { limbs: "slim, toned", body: "trim and fit, lean rather than muscular" },
  curvy: { limbs: "soft, shapely", body: "curvy, with a full rounded middle" },
  muscular: { limbs: "thick, muscular", body: "strong and solid, with bulging muscular arms and legs made of its own material" },
  bodybuilder: { limbs: "huge, bulging muscular", body: "massively strong, with huge bulging muscular arms and legs made of its own material" },
  "plus-size": { limbs: "thick, chunky", body: "heavy-set and plus-size: much wider and rounder than a normal one, with a full, heavy bottom" },
};

// Age didn't read on a 60s+ strawberry (Oct 30): age shows on the material.
const objectAge: Record<string, { food: string; thing: string }> = {
  "early-20s": { food: "fresh, firm and glossy, at its very freshest", thing: "brand new, shiny and spotless" },
  "late-20s": { food: "fresh, firm and glossy", thing: "new and shiny, with barely a mark" },
  "30s": { food: "ripe and fresh, with a couple of tiny marks", thing: "lightly used, with a few small scuffs" },
  "40s": { food: "fully ripe and a little less glossy, with a few small bruises and soft spots", thing: "well used, with scuffs, small scratches and slightly faded color" },
  "50s": { food: "overripe and visibly aging, duller, with bruised patches, fine wrinkles and darker spots", thing: "old and worn, with faded color, chipped edges, scratches and dents" },
  "60s": { food: "clearly old, wrinkled, softened and sagging, with bruises, dark age spots and a dull, faded surface", thing: "clearly old and battered, heavily faded, chipped, dented and scratched all over, with patches of wear" },
};

// Facial hair on objects got lost inside the face list (strawberry's braided
// beard, Oct 30) or came out too heavy (avocado's pencil mustache): each gets
// its own sentence that says where it hangs and how thin it is.
const objectFacialHair: Record<string, string> = {
  stubble: "light stubble: tiny {color} dots across its surface around the mouth",
  "full-beard": "a full {color} beard growing out of its surface below the mouth and down the front of the {name}",
  goatee: "a small pointed {color} goatee growing out of its surface just below the mouth",
  mustache: "a {color} mustache growing out of its surface just above the mouth",
  pencil: "a pencil-thin {color} mustache like a 1940s movie star's: a narrow line of short hair trimmed tight along the edge of the upper lip, one fine line no thicker than a pencil stroke, with a small gap in the middle",
  handlebar: "a {color} handlebar mustache just above the mouth, its ends waxed and curling upward",
  "braided-beard": "a long {color} braided beard growing out of its surface just below the mouth, plaited into one thick braid that hangs down the front of the {name} past its middle",
};

const objectPanel: Record<Weirdness, { front: string; face: string; mood: string }> = {
  0: { front: "", face: "", mood: "eerie, funny and believable" },
  1: { front: ", its slightly off proportions plain to see", face: "", mood: "eerie, funny and believable" },
  2: { front: ", its bulging caricature proportions and oversized face plain to see", face: ", showing the bulging eyes and stretched grin", mood: "creepy, absurd and believable" },
  3: { front: ", its grotesque warped proportions, spidery limbs and enormous face plain to see", face: ", showing the enormous mismatched eyes and the gaping mouth crammed with teeth", mood: "deeply disturbing, absurd and believable, like a nightmare caught on camera" },
};

// Robots got only the general line, which named no robot parts.
const robotWeirdWords: Record<Weirdness, string> = {
  0: "",
  1: "a head a little too big, LED eyes a little too large, and a few dents and scuffs",
  2: "a caricature: an oversized head on a spindly chassis, huge mismatched glowing eyes, a jagged grille mouth like crowded teeth, dented panels and loose wires",
  3: "a surreal, uncanny nightmare machine: a huge lopsided head three times too big on a skeletal, gangly frame, enormous mismatched flickering eyes, a gaping jaw of jagged metal teeth, exposed tangled wires and pistons, and rusted, dented panels in clashing colors",
};
export function robotWeirdLine(weird: Weirdness = 0) {
  return weird ? `This robot is ${robotWeirdWords[weird]}, the same in every panel` : "";
}

// Creatures: "every picked feature is exaggerated" barely changed an opossum
// (Oct 26), next to "a realistic creature in a big-budget film" and a friendly
// close-up. So the animal's own parts are named, and each panel says it too.
// Creatures (axolotl, Oct 29): the old lines dictated a toothy grin and
// "fur in wild clumps", so every level got the same grin and a smooth axolotl grew
// fur. Now each level pushes the parts the animal already has, plus what it
// wears, and leaves the expression and its skin to the animal.
const creatureWeirdWords: Record<Weirdness, string> = {
  0: "",
  1: "a bold, striking version of itself: a head clearly too big for the body, eyes noticeably larger and more intense, its own ears, gills, horns or beak bigger and more dramatic, and the wig, outfit and accessories bigger, in their own colors",
  2: "a caricature: a head far too big for the body, eyes twice their real size, its own ears, gills, horns, snout or beak stretched and oversized, the wig twice its volume, the outfit's shapes hugely exaggerated in its own colors, and every accessory oversized",
  3: "a surreal, uncanny nightmare version: a huge swollen head three times too big for a gangly, hunched body, enormous bulging eyes of different sizes, its own ears, gills, horns, snout or beak grotesquely oversized and twisted, long spidery limbs with knobbly joints, the wig absurdly huge and gravity-defying, the outfit's shapes absurd and gigantic in its own colors, and every accessory gigantic",
};
/** The weirdness sentence for people, named animals and robots. */
function kindWeirdLine(selection: Selection, spec: { species: { name: string } } | undefined, weird: Weirdness, photo?: { face?: boolean; body?: boolean }) {
  if (spec) return [creatureWeirdLine(spec.species.name, weird), creaturePicksPushed(selection, weird)].filter(Boolean).join(". ");
  // A picked big head already says how big; "a head a little too big" fought it (Oct 28).
  const line = kindGroup(selection) === "Robot" ? robotWeirdLine(weird) : humanWeirdLine(selection, weird, photo);
  return selection.proportions.includes("big-head") ? line.replace(/ is a head a little too big(?: for the body)?, /, " has ") : line;
}
// The owner's scale (Oct 30): Bold changes a little; Extreme makes each pick
// bigger (larger glasses, taller hair, longer neck, more muscle); Unhinged makes
// the proportions wild and surreal. So the picked body tiles, wig and accessories
// are named and pushed per level.
const pushWords: Record<Weirdness, string> = {
  0: "",
  1: "each made a little bolder than real",
  2: "each pushed to an extreme: larger, taller, longer and bigger than any real animal",
  3: "each pushed to an unhinged, surreal extreme, wildly out of proportion",
};
function creaturePicksPushed(selection: Selection, weird: Weirdness) {
  if (!weird) return "";
  const label = (id: FieldId, pick: string) => findField(id).options.find((o) => o.id === pick)?.label.toLowerCase();
  const picks = [
    ...selection.build.filter((b) => b !== "average").map((b) => `${label("build", b)} build`),
    ...selection.height.filter((h) => h !== "average").map((h) => `${label("height", h)} height`),
    ...selection.proportions.map((p) => label("proportions", p)),
    selection.hairStyle[0] !== "bald" ? "wig" : "",
    ...(selection.accessories ?? []).map((a) => label("accessories", a)),
  ].filter(Boolean) as string[];
  return picks.length ? `Its ${list(picks)} are ${pushWords[weird]}` : "";
}
export function creatureWeirdLine(name: string, weird: Weirdness = 0) {
  return weird ? `This ${name} is ${creatureWeirdWords[weird]}, the same in every panel` : "";
}
// The weirdness level said in the very first sentence for animals: in the middle
// of a ~650-word prompt it was drowned out and the three levels looked the same (Oct 29).
const creatureOpener: Record<Weirdness, string> = {
  0: "",
  1: ", a bold, exaggerated caricature with a head clearly too big for its body,",
  2: ", a wildly exaggerated caricature with a head far too big for its body and eyes twice their real size,",
  3: ", an unhinged, surreal nightmare caricature with a huge swollen head three times too big for its gangly, hunched body and long spidery limbs,",
};
const panelWeird: Record<Weirdness, { front: string; face: string }> = {
  0: { front: "", face: "a relaxed, friendly expression" },
  1: { front: ", its head clearly too big for the body, plain to see", face: "a striking, mischievous expression" },
  2: { front: ", a caricature with a head far too big for the body and eyes twice their real size, plain to see", face: "a wild, exaggerated expression" },
  3: { front: ", a nightmare caricature with a huge swollen head three times too big for its gangly, hunched body and long spidery limbs, plain to see", face: "an unhinged, manic expression" },
};

// What the character looks like, without clothes or setting. Saved with the
// character and added to photo shoot prompts, so the model still knows who
// the person is when the sheet alone isn't enough.
export function identityDescription(selection: Selection, color?: string, references: References = {}, weird: Weirdness = 0) {
  if (objectShape(selection)) return [objectIdentity(selection, color, weird, references.face), objectWeirdLine(objectShape(selection)!.name, weird)].filter(Boolean).join(". ");
  const { person, look, features, head, anatomy, wig, beard, spec } = describe(selection, references, color, "", weird);
  return [
    `${capitalize(references.face ? "the person from the character sheet" : person)}, with ${list(look)}`,
    head,
    wig,
    beard,
    anatomy,
    bodyDescription(selection),
    features.length ? `Distinctive features: ${list(features)}` : "",
    kindWeirdLine(selection, spec, weird, references),
  ].filter(Boolean).join(". ");
}

// One run makes a two-panel character sheet: a face close-up and a full-body front view.
// The sheet is the character's reference for every later photo. With a face
// reference, the model keeps that face and the controls only steer styling.
export function characterPrompt(selection: Selection, detail = "", references: References = {}, color?: string, weird: Weirdness = 0, model?: string, seed = 0) {
  // With a face photo, objects still use their own prompt and the photo shapes
  // the face set into them: through the people prompt a "strawberry woman"
  // came back as a woman with a strawberry on her shirt (Oct 26).
  if (objectShape(selection)) return objectPrompt(selection, detail, color, weird, references.face, seed);
  if (model === "flux-3-klein") return fluxPrompt(selection, detail, references, color, weird);
  const { person, look, features, creature, head, anatomy, parts, spec, wig, beard } = describe(selection, references, color, detail, weird);
  const accessories = eraAccessories(selection);
  const outfit = `Wearing ${words(selection, "style")[0]}, ${outfitFit[selection.gender[0]]}${decadeLine(selection)}`;
  const cut = parts ? `, cut with slits at the back for the ${parts}` : "";

  // Models follow the panel layout closely and mostly ignore a late rule, so
  // the back view itself says where the wings attach.
  const headwear = cleanPicks(findField("accessories"), selection.accessories).filter((id) => id === "cap" || id === "beanie").map((id) => id === "cap" && selection.style?.[0] !== "western" ? "the cap" : "the hat");
  // "wings" and "wings and tail" take "spread"; a lone "tail" takes "curls".
  const plural = (parts: string) => /s\b| and /.test(parts);
  // Two panels like the owner's reference sheets (Oct 27): a big face close-up
  // and a full-body front view. The back panel caused most of the trouble
  // (hands turned round, faces peeking from the edge, wigs), so it's gone;
  // wings and tails are shown from the front instead.
  // "The tail and dorsal fin… spreading out beside the body" put fins on the shark's legs (Oct 30).
  const showParts = parts === "tail and dorsal fin" ? ", the dorsal fin rising from the upper back and the tail curling out behind the legs, both clearly visible"
    : parts ? `, the ${parts} clearly visible from the front, ${plural(parts) ? "spreading out beside the body" : "curling out beside the legs"}` : "";
  const stylized = selection.kind[0] === "stylized";
  // Creatures came back bare or in half an outfit, without shoes (fox, axolotl, Oct 29):
  // the outfit sentence sits at the very end, so the full-length shot says it too.
  // A style mood alone ("bold saturated colors…") still left the fox bare (Oct 29),
  // so animals got named garments; then every fox wore the same hoodie, so now the
  // garments come from a pool per style, picked by the seed (see outfitPools), in a
  // color that stands out from the coat: Qwen drew a chameleon's shirt in its own scales.
  const dressed = spec ? `, fully dressed in ${words(selection, "style")[0]}; it wears ${pooledOutfit(selection, seed)}, mostly in ${fabricColor(seed)}, smooth woven fabric with no ${coat[selection.kind[0]] ?? "fur"} texture, clearly different from its ${coat[selection.kind[0]] ?? "fur"}, made to fit its body, so the clothes cover the chest, belly, arms and legs and only the head, hands and tail show its ${coat[selection.kind[0]] ?? "fur"}; the shoes fully enclose its feet, with no paws, toes or claws showing outside them` : "";
  // An Unhinged man on MOSS came out barefoot (Oct 30): the style is a mood, so the
  // long caricature text pushed the shoes out. The full-length shot names them.
  const humanShoes = kindGroup(selection) === "Human" && weird ? ", fully dressed in the complete outfit down to the shoes on both feet" : "";
  // A runway robot came back as a bare chassis in heels (Oct 30): robots are dressed in the style too,
  // in fabric and color, or the clothes came out as chrome plates matching the body.
  const robotDressed = !spec && kindGroup(selection) === "Robot" && !references.face
    ? `, fully dressed in ${words(selection, "style")[0]}; it wears ${pooledOutfit(selection, seed)}, mostly in ${fabricColor(seed)}, real woven fabric, clearly different from its metal, made to fit its metal body, so the clothes cover the chest, hips and legs`
    : "";
  // With a face photo the head keeps its likeness, so the panel doesn't swell it.
  const pw = kindGroup(selection) === "Human" ? (references.face ? { ...panelHuman[weird], front: "" } : panelHuman[weird]) : panelWeird[weird];
  // Robots are named from the first sentence and their close-up is the face
  // plate: "that same character's face… hairline to chin" read as a human face.
  const robot = kindGroup(selection) === "Robot" && !references.face;
  const who = robot ? "robot" : "character";
  const hat = hatOf(selection);
  // Photography terms (the owner's idea, Oct 28): models know "extreme close-up
  // portrait", "tight headshot" and "full-length shot" from photo captions.
  // The close-up names the clothes at its bottom edge, like the describe captions
  // ("open collar cream dress shirt, and brown velvet suit jacket"): both panels then wear the same top.
  // The outfit is now a mood, not a list of pieces, so the close-up names "the same outfit".
  const neckline = ", the neckline of the same outfit just visible at the bottom edge";
  // Accessories were said once, near the end, and "layered jewelry" was dropped by
  // Qwen and MOSS (Oct 29); now each panel names what it shows.
  const accessoryIds = cleanPicks(findField("accessories"), selection.accessories ?? []);
  const worn = accessories.map((a) => a.replace(/ worn (on|over) .*$/, ""));
  const faceWorn = worn.filter((_, i) => ["glasses", "sunglasses", "jewelry", "headphones"].includes(accessoryIds[i]));
  // A gold grill got dropped behind closed lips (Oct 30): teeth picks part the lips.
  const teeth = kindGroup(selection) === "Human" ? selection.features.filter((id) => ["gold-grill", "braces", "gap-teeth"].includes(id)).map((id) => ({ "gold-grill": "gold grill", braces: "braces", "gap-teeth": "gap between the front teeth" } as Record<string, string>)[id]) : [];
  const onFace = (faceWorn.length ? `, with the same ${list(faceWorn.map((a) => a.replace(/^(an?|the) /, "")))} clearly visible` : "") + (teeth.length ? `, the lips parted so the ${list(teeth)} clearly ${teeth.length > 1 || teeth[0] === "braces" ? "show" : "shows"}` : "");
  const closeUp = hat
    ? `framed from the top of ${hat} to the chin, the same ${hat.replace(/^an? /, "")} worn exactly as in the full-length shot, the face filling the frame${onFace}${neckline}`
    : robot
    ? `framed from the top of its head shell to its metal chin, the face plate and glowing eyes filling the frame${onFace}`
    : `framed from the forehead to the chin, the face filling the frame${onFace}${neckline}`;
  return [
    `${stylized ? "A 3D animated-movie" : "A photorealistic"} character sheet of one fully clothed ${robot ? "robot " : ""}character${spec ? creatureOpener[weird] : kindGroup(selection) === "Human" && !references.face && weird ? humanOpener[weird].replace("a real person", `a real person with ${words(selection, "skin")[0]}`) : ""} in two side-by-side panels of equal size on a plain light-grey studio background. Right panel: a full-length shot ${stylized ? "of the animated character " : ""}with a 35mm lens at eye level, front view from head to feet, standing relaxed and facing the camera, toes and palms toward the camera${references.face && references.body ? ", with the same body as the person in the first reference image" : panelBody(selection)}${showParts}${dressed}${robotDressed}${humanShoes}${pw.front}${worn.length ? `, clearly wearing ${list(worn)}` : ""}. Left panel: an extreme close-up portrait of the same ${who}, a tight headshot with an 85mm portrait lens, ${closeUp}, looking straight into the lens with ${pw.face}`,
    // Both panels as one photo session: the close-ups of creatures and robots
    // drifted from their full-body view (Oct 27).
    stylized ? "Both panels are two shots of the same character from one photo shoot, rendered in the same 3D animated-movie style with the same big eyes and simplified shapes, the same hair, accessories, outfit and colors; in the full-length shot the character is fully dressed in the complete outfit described below, covering the torso, arms and legs from collar to shoes, never in underwear or a bare midriff" : "Both panels are two shots of the same character from one photo shoot: the identical face, head, hair, accessories, outfit, colors and lighting",
    // A photo is a likeness source only: its background, clothes, light, grain and
    // filters came through as an over-baked, gritty sheet (Oct 29).
    references.face ? `The first reference image is only a likeness guide for ${references.body ? "the person's face and body" : "the person's face"}: copy ${references.body ? "their face, skin tone and body shape" : "their face shape, eyes, nose, mouth and skin tone"}, and ignore its background, clothing, pose, framing, lighting, grain, color grading and any photo filters, because the sheet is a new, clean, sharp studio photo` : "",
    // "An east asian man with exaggerated, surreal proportions" up front, as in the describe captions.
    `${references.face ? capitalize(person) : `The character is an original, fictional character: ${person}`}${selection.proportions.length && !(references.face && references.body) ? ", with exaggerated, surreal proportions" : ""}`,
    // Animals: the weirdness comes after the real head ("small round eyes"), or that line undid it (axolotl, Oct 29).
    spec ? "" : kindWeirdLine(selection, spec, weird, references),
    head,
    spec ? kindWeirdLine(selection, spec, weird, references) : "",
    capitalize(`with ${list(look)}`),
    creature ? "" : humanGender[selection.gender[0]],
    references.face && references.body ? "" : bodyDescription(selection),
    features.length ? `Distinctive features: ${list(features)}` : "",
    creature ? "" : capitalize(words(selection, "makeup")[0]),
    // Accessories get their own sentence: tacked onto the outfit they were dropped.
    wig,
    beard,
    accessories.length ? `In every panel ${creature ? "it wears" : "they wear"} ${list(accessories)}, clearly visible${spec ? `, made oversized and shaped to fit the ${spec.species.name}'s head` : ""}${headwear.length && selection.hairStyle[0] !== "bald" ? `, with the ${wig ? "wig" : "hair"} still clearly showing below and around ${headwear[0]}` : ""}` : "",
    `${outfit}${cut}`,
    anatomy,
    parts && selection.hairStyle[0] !== "bald" ? `The ${wig ? "wig sits" : "hair grows"} only on the top of the head and falls to the sides, leaving the ${parts} uncovered` : "",
    detail.trim(),
    stylized ? "Soft even studio light, clean 3D animated-film rendering, no text or labels" : references.face ? "Soft even daylight, clean sharp photo with natural skin tones, no filters, no text or labels" : "Soft even daylight, realistic texture, no text or labels",
  ].filter(Boolean).join(". ");
}

/**
 * The picked hat as worn (a cap in the 1940s is a fedora), or "". The close-up
 * cropped "from just above the hairline", which cut the hat off: a chameleon's
 * full body wore a fedora and her close-up a bare bouffant (Oct 28).
 */
function hatOf(selection: Selection) {
  const ids = cleanPicks(findField("accessories"), selection.accessories ?? []);
  const i = ids.findIndex((id) => id === "cap" || id === "beanie");
  return i < 0 ? "" : eraAccessories(selection)[i].replace(/ worn on the head$/, "");
}

/**
 * The short sheet prompt for FLUX 3 (Klein and cloud). Both kept average legs
 * and heads from the full prompt, even with the body shape put first, while
 * Qwen and MOSS followed it (robot tests, Oct 28). So FLUX gets the same picks
 * in about a third of the words: layout, then who it is with the body shape
 * built into that sentence, then looks, outfit, and nothing repeated.
 */
export function fluxPrompt(selection: Selection, detail = "", references: References = {}, color?: string, weird: Weirdness = 0) {
  const { person, look, features, creature, head, anatomy, spec, wig, beard } = describe(selection, references, color, detail, weird);
  const stylized = selection.kind[0] === "stylized";
  const robot = kindGroup(selection) === "Robot" && !references.face;
  const who = robot ? "robot" : "character";
  const shape = references.face && references.body ? [] : shapeWords(selection);
  const era = eraOf(selection);
  const accessories = eraAccessories(selection);
  // With a face photo the head keeps its likeness, so the panel doesn't swell it.
  const pw = kindGroup(selection) === "Human" ? (references.face ? { ...panelHuman[weird], front: "" } : panelHuman[weird]) : panelWeird[weird];
  return [
    `${stylized ? "3D animated-movie" : "Photorealistic"} character sheet: two side-by-side panels on a plain light-grey background, the same ${who} in both`,
    `Right panel: a full-length shot of the whole ${who}, head to toe, front view${shape.length ? `, with ${list(shape)}, exaggerated and obvious` : ""}`,
    `Left panel: an extreme close-up portrait, a tight headshot of the same ${who}${hatOf(selection) ? ` still wearing ${hatOf(selection)}` : ""}, the face filling the frame, with ${pw.face}`,
    capitalize(person),
    head,
    capitalize(`with ${list(look)}`),
    creature ? "" : humanGender[selection.gender[0]],
    features.length ? capitalize(list(features)) : "",
    wig,
    beard,
    accessories.length ? `Wearing ${list(accessories)}` : "",
    `Outfit: ${words(selection, "style")[0]}, ${outfitFit[selection.gender[0]]}${era ? `, unmistakably ${era.name} in its cuts, fabrics and colors` : ""}`,
    anatomy,
    kindWeirdLine(selection, spec, weird, references),
    detail.trim(),
    stylized ? "Clean 3D animated-film rendering, soft light, no text" : "Soft even light, realistic texture, no text",
  ].filter(Boolean).join(". ");
}

// Objects and food get their own prompt. The person-shaped one kept leaking
// through: a banana came back as a man with a banana-yellow neck, a red bob,
// a nose ring and a full outfit. So: the shape goes first, the face is a
// simple mascot face (no human nose or skin), limbs are small cartoon limbs,
// hair is a tuft, human face features are left out, and the outfit is cut
// down to one cropped top piece so the shape stays visible.
const humanFaceFeatures = new Set(["unibrow", "freckles", "beauty-mark", "dimples", "face-tattoo", "nose-ring", "ear-piercings", "brow-slit", "bleached-brows", "brow-scar", "pointed-ears", "lashes", "pointy-nose", "big-ears", "jowls"]);

// Each hair style as a plain shape, for objects whose "hair" isn't hair.
const objectHairShapes: Record<string, string> = {
  "long-straight": "hanging straight down to the middle", "long-wavy": "hanging down in long waves", curls: "twisted into tight springy coils",
  afro: "fanned out into a big round puff", braids: "plaited into long braids", locs: "rolled into long thick ropes", bob: "cut level at the bottom all around",
  pixie: "cut short and tousled, flicking forward at the front", "wolf-cut": "in shaggy uneven layers", mullet: "short at the front and long at the back",
  bowl: "in a rounded cap with a straight fringe", buzz: "cut into a very short even fuzz", mohawk: "standing up in one tall ridge down the middle",
  ponytail: "gathered high and falling back in a tail", pigtails: "gathered into two bunches at the sides", "space-buns": "twisted into two round knots on top",
  "comet-ponytail": "swept up and back in one long arc", "ribbon-loops": "folded into two loops like a tied ribbon", "lantern-bun": "gathered into one big round banded knot",
  "wave-crest": "curled into one big wave crest", pagoda: "stacked into three knots of shrinking size", crescent: "curved into a crescent across the front",
};

function objectParts(selection: Selection, color?: string, weird: Weirdness = 0, likeness = false) {
  const shape = objectShape(selection)!;
  const eyeColor = words(selection, "eyes")[0].replace(/ eyes?$/, "");
  const [hairColor] = words(selection, "hairColor");
  const features = selection.features.filter((id) => !humanFaceFeatures.has(id) && !objectHidden.has(id));
  const mouthExtras = features.map((id) => findField("features").options.find((o) => o.id === id)!.prompt);
  const build = weird < 2 ? objectBuild[selection.build[0]] : undefined;
  const age = objectAge[selection.age?.[0] ?? ""];
  const beard = objectFacialHair[selection.facialHair[0]];
  return {
    shape,
    body: `${capitalize(shape.shape)}. It keeps the real ${shape.name}'s ${objectBody[weird]}${color ? `, tinted ${colorName(color)}` : ""}, and it is not a person: no human head, neck, torso or skin${build ? `. Its body is ${build.body}` : ""}${age ? `. Its age shows on its surface: ${kindGroup(selection) === "Food" ? age.food : age.thing}` : ""}`,
    beard: beard ? `In every panel it has ${beard.replace("{color}", hairColor).replace("{name}", shape.name)}, clearly visible` : "",
    // "Mascot" and "cartoon eyes" made a cute 3D-animation banana; this asks
    // for the uncanny, photographed look of viral AI food characters.
    face: `Its face is set directly into the real ${shape.name}'s surface${likeness ? `, modeled on the face of the person in the first reference image: their eye shape, eyebrows, smile and expression, clearly recognizable as them, but made of the ${shape.name}'s own surface` : ""}: ${objectFace[weird].replace("{iris}", likeness ? "the same eye color as the person in the reference" : eyeColor).replace("{extras}", mouthExtras.length ? `, with ${list(mouthExtras)}` : "")}; between the eyes and the mouth there is only the ${shape.name}'s own surface, with no nose, and no human ears or skin anywhere`,
    limbs: `Exactly two ${build ? objectLimbs[weird].limbs.replace(/\bthin\b/g, build.limbs) : objectLimbs[weird].limbs} grow out of the ${shape.name}, made of the same ${shape.name} material and texture, with ${objectLimbs[weird].hands}; no other limbs or stubs, and no human hips${build && /muscular/.test(build.limbs) ? " or thighs" : ", thighs or muscles"}`,
    // Haircut names ("pixie cut") and hair colors ("cherry red") made a red
    // wig, so the shape is said in plain words and the color as paint.
    // Short form, named inside each panel so the back view keeps it too.
    topping: selection.hairStyle[0] === "bald" ? "" : shape.wig ? `the ${hairColor} wig on top` : `the ${hairColor}-colored ${shape.hairNoun ?? shape.hair.split(/ (?:piled|curling|popping|sprouting|puffed|sticking|on top|standing|dripping|flowing|sweeping|just|cut|hanging)/)[0].replace(/^(its|an?) /, "")} on top`,
    hair: selection.hairStyle[0] === "bald" ? "" : shape.wig
      ? `In every panel it wears ${wigOf(selection)}, worn on top of the ${shape.name} like a cap, the front edge just above the eyes, the hairstyle's full shape clearly visible; the wig is clearly ${hairColor}, a different color from the ${shape.name}`
      : `On top it has ${shape.hair}${shape.shaped ? "" : `, ${objectHairShapes[selection.hairStyle[0]] ?? "arranged in a tousled tuft"}`}, the ${shape.shaped ? shape.hairNoun ?? "bread" : shape.hair.split(" ")[0] === "two" ? "slices" : "material"} painted ${hairColor} on the outside; it is the real ${shape.name} material, not hair, not a wig and not fur, and it is there in every panel without hiding the ${shape.name}'s shape`,
  };
}

// Height was never said for objects (travel mug, Oct 30): the legs carry it.
const objectLegs: Record<string, string> = {
  petite: "very short stubby legs grow out of its bottom, a small, short figure",
  // "Long legs" alone didn't show on a tall avocado (Oct 30): measured against the body.
  tall: "long legs, as long as its body is tall, grow straight out of its bottom, so the legs make up half of a tall, long-bodied figure, clearly taller than average",
  "very-tall": "very long legs, longer than its body is tall, grow straight out of its bottom, so the legs make up most of a very tall, stretched, towering figure, head and shoulders taller than average",
};

// Face picks on an object (toaster, Oct 30): never said, so all were dropped.
// Each is now said on the object's own surface; ones that need a nose, ears,
// a forehead or a chin are hidden for objects in Create.
const objectFeatureWords: Record<string, string> = {
  freckles: "freckle-like dots painted across the {name}'s surface around the eyes",
  "glitter-freckles": "sparkling gold glitter dots stuck across the {name}'s surface around the eyes",
  "beauty-mark": "one dark beauty mark beside the mouth",
  "face-tattoo": "dark tattoo designs printed on the {name}'s surface just below both eyes and above them",
  "face-gems": "tiny gems stuck along the {name}'s surface beside the eyes",
  lashes: "long, thick, dramatic false eyelashes",
  dimples: "deep dimples at the corners of the mouth",
  "gold-grill": "a shiny gold grill over its front teeth",
  braces: "colorful braces on its teeth",
  "gap-teeth": "a wide gap between its two front teeth",
};
const objectHidden = new Set(["nose-ring", "pointy-nose", "ear-piercings", "big-ears", "pointed-ears", "jowls", "big-forehead", "brow-scar"]);
function objectFeatures(selection: Selection, name: string) {
  // Only the face picks objectParts leaves out (it already says grills, braces, gems and glitter by the mouth).
  const ids = cleanPicks(findField("features"), selection.features).filter((id) => !objectHidden.has(id) && humanFaceFeatures.has(id));
  const brows = ids.filter((id) => browIds.includes(id));
  const parts = [
    ...(brows.length ? [`${browPhrase(brows, false)}, painted onto the ${name}'s surface`] : []),
    ...ids.filter((id) => objectFeatureWords[id]).map((id) => objectFeatureWords[id].replace("{name}", name)),
  ];
  return parts.length ? `Its face also has ${list(parts)}, clearly visible in both panels` : "";
}

function objectPrompt(selection: Selection, detail: string, color?: string, weird: Weirdness = 0, likeness = false, seed = 0) {
  const { shape, body, face, limbs, hair, topping, beard } = objectParts(selection, color, weird, likeness);
  const panel = objectPanel[weird];
  const top = topping ? `, with ${topping}` : "";
  const who = `${words(selection, "gender")[0]} ${words(selection, "age")[0]}`;
  const accessories = eraAccessories(selection);
  const style = words(selection, "style")[0];
  // The whole outfit (it used to be only the top and shoes: no trousers, Oct 27),
  // fitted so the object still shows. "Oversized" pieces covered the body and
  // shrank the strawberry to a head (Oct 26), so those words go.
  // The tiles are moods now, but a mood alone left the avocado undressed (Oct 29), so
  // objects got named pieces; for variety (Oct 30) they come from the seeded pool.
  const pieces = pooledOutfit(selection, seed);
  const outfit = (style.includes(":") ? `${pieces}: ${style.split(":").slice(1).join(":").trim()}` : style).trim()
    .replace(/\b(an?) (?:oversized|baggy|loose|chunky|flowing) (\w)/g, (_, _a: string, c: string) => `${/[aeiou]/i.test(c) ? "an" : "a"} ${c}`);
  const cue = objectFaceCue(selection);
  // The beanie blended into the strawberry's crown and a snood hid the avocado's
  // mullet (Oct 30): the hat sits on top, small, in a different color and texture.
  // The snood came out the wig's own grey (Oct 30): the hat gets a named contrasting color.
  const [hairColor] = words(selection, "hairColor");
  const hatColor = /grey|gray|silver|white|platinum|blonde/.test(hairColor) ? "deep burgundy" : /red|pink|auburn|ginger|copper/.test(hairColor) ? "navy blue" : "mustard yellow";
  const toppingName = topping.replace(/ on top$/, "");
  const hatLine = topping && cleanPicks(findField("accessories"), selection.accessories).some((id) => id === "cap" || id === "beanie")
    ? `; the hat sits on top of ${toppingName}, made of ${hatColor} fabric, with ${toppingName} showing below it` : "";
  // The hat vanished when only the accessory sentence named it (Oct 30): both panels name it.
  const hat = hatOf(selection);
  const wearsHat = hat ? `, wearing ${hat} in ${hatColor} on its top` : "";
  // The full-length avocado had no top and its mustache came out thick (Oct 30):
  // the outfit pieces and the facial hair are named in the panels too.
  const dressedIn = pieces ? `, dressed in ${pieces} with the top covering its upper half` : "";
  const facialHairId = selection.facialHair[0];
  const closeBeard = objectFacialHair[facialHairId] ? `, with its ${findField("facialHair").options.find((o) => o.id === facialHairId)!.label.toLowerCase().replace(/^handlebar$/, "handlebar mustache")} clearly visible${facialHairId === "pencil" ? " as one fine thin line" : ""}` : "";
  return [
    // Each panel spelled out with what is and isn't in frame. Two panels like
    // the people sheets (Oct 27): the back view kept turning sideways.
    // "Anthropomorphic" (the owner's idea, Oct 27): a strawberry that stands and
    // poses like a person, instead of a stiff object on grown stick legs.
    `A hyper-realistic studio photograph laid out as two side-by-side panels of equal size of the same anthropomorphic ${shape.name} character, a giant ${shape.name} that stands, poses and gestures like a person, on a plain light-grey background`,
    // The close-up drifted from the full body (Oct 27): first it was its own shot
    // ("from the eyes to the mouth"), then "down to its chest" made a medium shot
    // in a different pose. Now the full body comes first, and the left panel is a
    // tight close-up of that same face.
    `Right panel: a full-length shot of the front of the whole ${shape.name}, head to feet, facing the camera in a relaxed, confident pose like a person, toes pointing toward the camera${cue.front}, the ${shape.name} itself forming the whole head and torso, most of the character's height, down to where the ${objectLegs[selection.height[0]] ?? "short legs grow straight out of its bottom"}${top}${wearsHat}${dressedIn}${panel.front}`,
    // "Head-and-shoulders" and "fills most of the panel" still came out as a
    // mid-shot (Oct 27), so the crop is said edge to edge, like the references.
    `Left panel: an extreme close-up portrait of the same ${shape.name}, a tight headshot with an 85mm portrait lens: the eyes and mouth set into the ${shape.name}'s own surface fill the frame, with only flat, smooth ${shape.name} surface between the eyes and the mouth and smooth ${shape.name} sides, like a face pressed into it, with the ${topping ? topping.replace(/^the /, "").replace(/ on top$/, "") : "top of the " + shape.name} and the same accessories${hat ? `, including ${hat},` : ""} just showing at the panel's top edge, and the neckline of the same top just visible at the bottom edge${closeBeard}${panel.face}${cue.face}`,
    "Both panels are two shots of the same character from one photo shoot: the identical face, shape, colors, accessories and outfit",
    body,
    objectWeirdLine(shape.name, weird),
    face,
    objectGenderLine(selection, shape.name),
    limbs,
    hair,
    beard,
    objectFeatures(selection, shape.name),
    // Accessories get their own sentence next to the face: tacked onto the
    // outfit ("…plus sunglasses") they were dropped.
    accessories.length ? `In every panel it wears ${list(accessories)}, clearly visible${hatLine}` : "",
    // "Cropped short" and then "a narrow band" each turned the tee into a plain
    // white band (Oct 26–27), so it says how a person wears a cropped tee.
    `It wears ${outfit}, ${outfitFit[selection.gender[0]]}, fitted to its ${shape.name} body: the top is cropped short and sits just below its face, its neckline showing at the bottom of the close-up, any jacket worn open, one sleeve on each arm, so the face and most of the ${shape.name}'s shape stay visible, and the bottoms and shoes are worn on its legs and feet below the ${shape.name}${decadeLine(selection)}`,
    `It poses and expresses itself like a ${who}, with a lively, expressive face`,
    detail.trim(),
    `It looks like a real anthropomorphic ${shape.name} photographed for a strange viral video: ${panel.mood}, with real textures and soft studio light, not a cartoon, not a 3D animation, not a toy or plush, no text or labels`,
  ].filter(Boolean).join(". ");
}

function objectIdentity(selection: Selection, color?: string, weird: Weirdness = 0, likeness = false) {
  const { body, face, limbs, hair, beard } = objectParts(selection, color, weird, likeness);
  return [body, face, objectGenderLine(selection, objectShape(selection)!.name), limbs, hair, beard].filter(Boolean).join(". ");
}
