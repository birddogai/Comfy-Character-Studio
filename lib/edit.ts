import { refName, type ModelId } from "./models.ts";

/** "Edit image": off everywhere for the launch, until it works well (owner, Oct 30). */
export const editOn = false;

// Edit: the user boxes or paints an area and says what it should become. The
// app sends a close crop around that area (so the change is big enough for the
// model to make), then pastes back only the marked part.
export function editPrompt(model: ModelId, instruction: string) {
  return `Edit ${refName(model, 0)}: ${instruction.trim().replace(/\.$/, "")}. Make this change clearly visible. Keep everything else exactly the same: the same character, framing, lighting, colors and style.`;
}

/**
 * The crop to send for a marked area: the area plus as much again around it
 * for context, at least a quarter of the image's shorter side, kept inside it.
 */
export function cropAround(area: { x: number; y: number; width: number; height: number }, size: { width: number; height: number }) {
  const min = Math.round(Math.min(size.width, size.height) / 4);
  const width = Math.min(size.width, Math.max(min, area.width * 2));
  const height = Math.min(size.height, Math.max(min, area.height * 2));
  const x = Math.min(Math.max(0, Math.round(area.x + area.width / 2 - width / 2)), size.width - width);
  const y = Math.min(Math.max(0, Math.round(area.y + area.height / 2 - height / 2)), size.height - height);
  return { x, y, width: Math.round(width), height: Math.round(height) };
}

/** The size to ask the model for: the crop's shape at about one megapixel. */
export function editSize(crop: { width: number; height: number }) {
  const scale = Math.sqrt(1024 * 1024 / (crop.width * crop.height));
  return { width: Math.round(crop.width * scale), height: Math.round(crop.height * scale) };
}
