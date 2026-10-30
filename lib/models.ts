// The image models the studio can use, per task. Open models run as ComfyUI
// workflows (lib/workflows.ts) on Comfy Cloud or your own ComfyUI. All open
// weights: the FLUX 3 cloud API option was removed (Open Weights Only, Oct 30).
//   sheet: invent a character from words (the first character sheet)
//   edit:  change an existing image using references (outfits, photos, scenes)
//   box:   change one area of an image
//   board: a whole storyboard from the cast's sheets (an edit run; MOSS left out,
//          its edit LoRA redraws one photo and ignored the cast, Oct 29)
export type Task = "sheet" | "edit" | "box" | "board";

export type ModelId = "qwen-2.1" | "flux-3-klein" | "moss-image";

export type Model = {
  id: ModelId;
  label: string;
  /** Short note shown under the picker. */
  note: string;
  open: boolean;
  tasks: readonly Task[];
  /** Whether the same seed gives the same picture again. */
  seeded: boolean;
  /** Rough credits per image, for the button labels. Open models bill GPU time. */
  credits: number;
};

export const models: readonly Model[] = [
  { id: "qwen-2.1", label: "Qwen Image 2.1", note: "Open weights. Best at inventing creatures and odd characters.", open: true, tasks: ["sheet", "edit", "board"], seeded: true, credits: 4 },
  { id: "flux-3-klein", label: "FLUX 3 Klein", note: "Open weights. Fast; best at keeping a character while changing outfits and details.", open: true, tasks: ["sheet", "edit", "box", "board"], seeded: true, credits: 2 },
  // MOSS-Image (OpenMOSS, Apache 2.0, added Oct 27): a 5B model that follows long captions closely.
  // Edits through its edit LoRA since Oct 28 (Wardrobe, Scenes, Edit, photo starts).
  { id: "moss-image", label: "MOSS-Image", note: "Open weights. New; follows long, detailed descriptions and body shapes closely. Works best with up to four reference images.", open: true, tasks: ["sheet", "edit"], seeded: true, credits: 3 },
];

export const defaults: Record<Task, ModelId> = { sheet: "qwen-2.1", edit: "flux-3-klein", box: "flux-3-klein", board: "qwen-2.1" };

export function modelsFor(task: Task) {
  return models.filter((model) => model.tasks.includes(task));
}

export function findModel(id: unknown, task: Task): Model {
  return modelsFor(task).find((model) => model.id === id) ?? modelsFor(task).find((model) => model.id === defaults[task])!;
}

export function isModel(id: unknown, task: Task): id is ModelId {
  return modelsFor(task).some((model) => model.id === id);
}

/** A fresh random seed, made in the browser so it can be shown and saved. */
export function newSeed() {
  return Math.floor(Math.random() * 2 ** 32);
}

/** About one megapixel in each shape, in multiples of 16. */
export const sizes: Record<string, { width: number; height: number }> = {
  "16:9": { width: 1344, height: 768 },
  "9:16": { width: 768, height: 1344 },
  "4:5": { width: 896, height: 1120 },
  "1:1": { width: 1024, height: 1024 },
  // Character sheets: two panels side by side (face close-up, full body), about 2 MP.
  // 4:3, so each panel is a 2:3 portrait: at 16:9 the panels were nearly square and
  // tall figures and long legs got squeezed (Qwen, Klein and MOSS test, Oct 30).
  sheet: { width: 1664, height: 1248 },
};

/** How a prompt names reference image i for each model. */
export function refName(model: ModelId, i: number) {
  if (model === "flux-3-klein") return `<ref_image_${i}>`;
  // Qwen's own edit prompt guide names images <image1>, <image2> (Oct 30).
  if (model === "qwen-2.1") return `<image${i + 1}>`;
  return `image ${i + 1}`;
}
