import type { Weirdness } from "./character.ts";
import { refName, type ModelId } from "./models.ts";

// Wardrobe: the same character sheet in a new outfit. Pieces come from
// dropped-in images (a shop screenshot, a product photo, a photo of someone
// wearing it), a preset, or the user's own words.
export const pieces = [
  { id: "top", label: "Top", words: "top" },
  { id: "bottom", label: "Bottom", words: "trousers, skirt or shorts" },
  { id: "full", label: "Full outfit or costume", words: "whole outfit" },
  { id: "pajamas", label: "Pajama set", words: "matching pajama set, top and bottom" },
  { id: "outerwear", label: "Jacket or coat", words: "jacket or coat" },
  { id: "shoes", label: "Shoes", words: "shoes" },
  { id: "accessory", label: "Accessory", words: "accessory" },
] as const;

export type PieceId = (typeof pieces)[number]["id"];
export type WardrobeItem = { piece: PieceId; image?: string; words?: string };

// Concrete outfit descriptions: open models follow garments, colors and
// materials much better than a one-word style.
export const presets = [
  { id: "hoodie", label: "Cozy hoodie", words: "an oversized heather-grey fleece hoodie, loose black cargo trousers and white chunky sneakers" },
  { id: "suit", label: "Sharp suit", words: "a tailored charcoal two-piece suit, a crisp white shirt, a slim black tie and polished black oxford shoes" },
  { id: "athleisure", label: "Gym set", words: "a matching sage-green ribbed sports top and leggings set with white running shoes" },
  { id: "evening", label: "Evening look", words: "a floor-length black satin evening outfit with subtle silver details and black heeled shoes" },
  { id: "summer", label: "Summer linen", words: "a loose cream linen shirt, light beige linen trousers and tan leather sandals" },
  { id: "pajamas", label: "Pajamas", words: "a soft pastel-blue cotton pajama set with white piping and fluffy white slippers" },
  { id: "raincoat", label: "Rain day", words: "a glossy yellow hooded raincoat, dark jeans and black rubber rain boots" },
  { id: "knight", label: "Knight costume", words: "a full medieval knight costume: polished silver plate armor over a deep red tunic, with a red cape" },
] as const;

export function isPiece(value: unknown): value is PieceId {
  return pieces.some((piece) => piece.id === value);
}

function piece(id: PieceId) {
  return pieces.find((p) => p.id === id)!;
}

/** What a one-piece swap must leave alone, said out loud. */
function keep(changed: PieceId[]) {
  const all: [PieceId | "head", string][] = [["head", "any hat, glasses, sunglasses and jewelry"], ["top", "the top"], ["outerwear", "any jacket"], ["bottom", "the trousers, skirt or shorts"], ["shoes", "the shoes"], ["accessory", "the bag and other accessories"]];
  const kept = all.filter(([id]) => !changed.includes(id as PieceId) && !(id === "head" && changed.includes("accessory"))).map(([, words]) => words);
  return kept.join(", ");
}

/** Where a swapped piece shows, and whether the close-up shows it too. */
const placement: Record<PieceId, { where: string; face: boolean }> = {
  top: { where: "on the upper body", face: true }, bottom: { where: "on the legs", face: false }, full: { where: "", face: true },
  pajamas: { where: "", face: true }, outerwear: { where: "over the top", face: true }, shoes: { where: "on both feet", face: false }, accessory: { where: "", face: true },
};

// Weirdness for outfits (the owner's idea, Oct 27): the clothes go over the
// top, the character underneath stays exactly the same.
const outfitWeird: Record<Weirdness, string> = {
  0: "",
  1: "The outfit is a little over the top: slightly oversized proportions, bolder colors and one odd extra detail",
  2: "The outfit is a wild caricature of itself: hugely exaggerated shoulders, collars and cuffs, clashing patterns and absurd accessories",
  3: "The outfit is unhinged and surreal: absurdly oversized pieces, impossible layers, loud clashing patterns, strange materials like fur, vinyl and tinsel mixed together and bizarre extra details, still clearly built from the same pieces",
};

// Qwen follows one short, direct sentence: the owner's "add the grey sweater from
// <image 2> to both the close up and full body shot of the character in <image 1>"
// worked where the long sheet prompt didn't (Oct 30).
function qwenWardrobe(items: WardrobeItem[], options: { parts?: string; note?: string; weird?: Weirdness }) {
  let next = 2;
  const pieces = items.map((item) => item.image ? `the ${piece(item.piece).words} from <image${next++}>` : item.words?.trim() ?? piece(item.piece).words);
  const replacesAll = items.some((item) => item.piece === "full" || item.piece === "pajamas");
  return [
    replacesAll
      ? `Replace the whole outfit of the character in <image1> with ${list(pieces)}, in both the close-up and the full-body shot`
      : `Add ${list(pieces)} to both the close-up and the full-body shot of the character in <image1>`,
    outfitWeird[options.weird ?? 0],
    options.parts ? `The ${options.parts} stay on top of the new clothing` : "",
    options.note?.trim() ?? "",
  ].filter(Boolean).join(". ") + ".";
}
const list = (xs: string[]) => xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}` : xs[0];

/** Image 0 is the character sheet; item images follow in order. */
export function wardrobePrompt(model: ModelId, items: WardrobeItem[], options: { character?: string; parts?: string; note?: string; weird?: Weirdness } = {}) {
  if (model === "qwen-2.1") return qwenWardrobe(items, options);
  const sheet = refName(model, 0);
  let next = 1;
  const wearing = items.map((item) => {
    const what = piece(item.piece).words;
    if (item.image) {
      const ref = refName(model, next++);
      return `the exact ${what} shown in ${ref}, matching its color, print, logo, fabric, length and fit`;
    }
    return item.words?.trim() ?? what;
  });
  const replacesAll = items.some((item) => item.piece === "full" || item.piece === "pajamas");
  const images = items.some((item) => item.image);
  // A one-piece swap leads with the change: said after the long character
  // description, FLUX 3 Klein kept the owl's old shoes (Oct 29).
  const swap = replacesAll ? "" : `Edit ${sheet}: change only the ${[...new Set(items.map((i) => piece(i.piece).words))].join(" and ")}. ${items.map((item, i) => `Replace the character's ${piece(item.piece).words} with ${wearing[i]}${placement[item.piece].where ? `, worn ${placement[item.piece].where}` : ""}`).join(". ")}, clearly visible in the full-length panel${items.some((i) => placement[i.piece].face) ? " and the close-up" : ""}. Everything else stays exactly as in ${sheet}`;
  return [
    swap,
    // Sheets are two panels now (Oct 27). Explaining an optional back view made
    // FLUX 3 Klein turn the full body around (knight costume, Oct 28), so the
    // two panels are named in photography terms and nothing else is offered.
    `A photorealistic character sheet in exactly two side-by-side panels with the same layout, framing, lighting and plain light-grey background as ${sheet}. Left panel: the same extreme close-up portrait, a tight headshot cropped just as in ${sheet}. Right panel: the same full-length shot from the front, head to feet, the character facing the camera in the same pose as in ${sheet}. Both panels show the new outfit`,
    // One-piece swaps trust the picture only: the saved description said "a buzz-cut
    // wig" while the sheet showed a beanie, and Qwen took the beanie off (Oct 29).
    `The character is exactly the one in ${sheet}: the same face, head, hair, body shape, colors and distinctive features${options.character && replacesAll ? ` (${options.character.trim()})` : ""}`,
    replacesAll ? "" : `Keep every other piece exactly as in ${sheet}, with nothing added or taken away: ${keep(items.map((i) => i.piece))}`,
    replacesAll ? `The character is fully clothed and now wears ${wearing.join(", and ")}` : "",
    outfitWeird[options.weird ?? 0],
    replacesAll ? "This replaces the whole previous outfit" : `The rest of the outfit stays exactly the same, and the character now wears ${wearing.join(", and ")}`,
    images ? "Take only the clothing from the product images: ignore any person or mannequin wearing it, hangers, tags, prices, text, buttons and backgrounds" : "",
    options.parts ? `The ${options.parts} come out through slits in the new clothing and sit on top of it, clearly visible` : "",
    options.note?.trim() ?? "",
  ].filter(Boolean).join(". ") + ".";
}
