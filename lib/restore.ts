import { defaultSelection, isColor, isSelection, type Look } from "./character.ts";
import { isModel, type ModelId } from "./models.ts";

// Turns a sheet's saved .json (outputs folder) back into what the Create grid
// keeps, and spots sheets that are already there.
export type SavedSheet = { path: string; details: Record<string, unknown> };
export type Restored = { customPrompt?: string; file: string; prompt: string; description: string; look: Look; model?: ModelId; seed?: number; createdAt: number };

export function fromSaved({ path, details }: SavedSheet): Restored {
  // Sheets from the removed FLUX 3 cloud API restore with the default model.
  const model = isModel(details.model, "sheet") ? details.model : undefined;
  const createdAt = Date.parse(String(details.createdAt));
  return {
    file: path,
    customPrompt: typeof details.customPrompt === "string" ? details.customPrompt : undefined,
    prompt: typeof details.prompt === "string" ? details.prompt : "",
    description: typeof details.description === "string" ? details.description : "",
    // Sheets saved before a control existed still restore, with the default for it.
    look: {
      selection: isSelection(details.selection) ? details.selection : { ...defaultSelection, ...(details.selection as object ?? {}) },
      color: isColor(details.color) ? details.color : undefined,
      detail: typeof details.detail === "string" ? details.detail : "",
    },
    model,
    seed: typeof details.seed === "number" ? details.seed : undefined,
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
  };
}

/** Already in the grid: restored from this file before, or the same prompt made within a few minutes. */
export function alreadyKept(restored: Restored, kept: { file?: string; prompt?: string; createdAt: number }[]) {
  return kept.some((k) => k.file === restored.file || (k.prompt === restored.prompt && Math.abs(k.createdAt - restored.createdAt) < 3 * 60_000));
}
