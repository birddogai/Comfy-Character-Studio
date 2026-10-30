import { kleinBoxEdit, kleinEdit, kleinText, mossEdit, mossText, qwenEdit, qwenText, textWorkflow, type Built } from "./workflows.ts";

// The studio's ComfyUI workflows as files people can open in ComfyUI
// (workflows/*.json, API format). The prompts here are examples to replace;
// the LoadImage nodes name the image each one expects. Regenerate with
// `npm run workflows` after changing lib/workflows.ts (a test checks they match).
const sheetPrompt = "A photorealistic character sheet of one fully clothed character in two side-by-side panels of equal size on a plain light-grey studio background. Right panel: a full-length front view from head to feet. Left panel: an extreme close-up portrait of the same character. Describe the character here.";
const sheet = { width: 1664, height: 1248, seed: 42 };

function withImages(built: Built, names: string[]): Built {
  const graph = structuredClone(built.graph);
  built.images.forEach((id, i) => { graph[id].inputs.image = names[i]; });
  return { ...built, graph };
}

export type WorkflowFile = { file: string; title: string; use: string; images: string[]; built: Built };

export const workflowFiles: WorkflowFile[] = [
  { file: "character-sheet-qwen-image-2.1.json", title: "Character sheet · Qwen Image 2.1", use: "Create (default): a new character sheet from words.", images: [], built: qwenText({ prompt: sheetPrompt, ...sheet }) },
  { file: "character-sheet-flux-3-klein.json", title: "Character sheet · FLUX 3 Klein", use: "Create, with FLUX 3 Klein picked.", images: [], built: kleinText({ prompt: sheetPrompt, ...sheet }) },
  { file: "character-sheet-moss-image.json", title: "Character sheet · MOSS-Image", use: "Create, with MOSS-Image picked.", images: [], built: mossText({ prompt: sheetPrompt, ...sheet }) },
  {
    file: "outfit-flux-3-klein.json", title: "Outfit sheet · FLUX 3 Klein", use: "Wardrobe, with FLUX 3 Klein picked: the same character sheet wearing the clothing in the second image.",
    images: ["character_sheet.png", "clothing.png"],
    built: kleinEdit({ prompt: "The same two-panel character sheet as <ref_image_0>, with the same character, now wearing the exact clothing shown in <ref_image_1>, matching its color, print and fit.", references: 2, ...sheet }),
  },
  {
    file: "outfit-qwen-image-2.1.json", title: "Outfit sheet · Qwen Image 2.1", use: "Wardrobe (default).",
    images: ["character_sheet.png", "clothing.png"],
    built: qwenEdit({ prompt: "The same two-panel character sheet as <image1>, with the same character, now wearing the exact clothing shown in <image2>, matching its color, print and fit.", references: 2, seed: 42 }),
  },
  {
    file: "outfit-moss-image.json", title: "Outfit sheet · MOSS-Image", use: "Wardrobe, with MOSS-Image picked.",
    images: ["character_sheet.png", "clothing.png"],
    built: mossEdit({ prompt: "The same two-panel character sheet as image 1, with the same character, now wearing the exact clothing shown in image 2.", references: 2, ...sheet }),
  },
  {
    file: "storyboard-flux-3-klein.json", title: "Storyboard frames · FLUX 3 Klein", use: "Storyboard: one image of frames starring the character from the sheet.",
    images: ["character_sheet.png"],
    built: kleinEdit({ prompt: "A storyboard of six numbered photographic frames in a 3-over-3 grid starring the character from <ref_image_0>. Describe what happens in each frame here.", references: 1, width: 1824, height: 1024, seed: 42 }),
  },
  {
    file: "edit-area-flux-3-klein.json", title: "Edit an area · FLUX 3 Klein", use: "Edit: change only the boxed area (x, y, width, height in the Edit box node).",
    images: ["image_to_edit.png"],
    built: kleinBoxEdit({ prompt: "In <ref_image_0>, change the area <obj_1>: describe the change here. Keep everything outside that area unchanged.", box: { x: 600, y: 200, width: 300, height: 300 }, ...sheet }),
  },
  {
    file: "place-character-flux-3-klein.json", title: "Place a character in a photo · FLUX 3 Klein", use: "Storyboard and scenes: put the character from the second image into the boxed area of a location photo.",
    images: ["location.png", "character_sheet.png"],
    built: kleinBoxEdit({ prompt: "In <ref_image_0>, place the character from <ref_image_1> in the area <obj_1>, at a natural scale for the scene, matching its light and perspective.", box: { x: 700, y: 300, width: 400, height: 600 }, width: 1824, height: 1024, seed: 42, extra: 1 }),
  },
  {
    file: "storyboard-planner-qwen-text.json", title: "Storyboard shot planner · Qwen3.5 text", use: "Storyboard: writes the shot list from your brief before the frames are drawn.",
    images: [],
    built: textWorkflow({ system: "You plan short storyboards. Reply with one numbered line per frame: what happens, framing and camera.", prompt: "Brief: describe what happens here.", seed: 42 }),
  },
];

/** The file contents: API-format graph with example image names filled in. */
export function workflowJson(w: WorkflowFile) {
  return `${JSON.stringify(withImages(w.built, w.images).graph, null, 2)}\n`;
}
