import { NextResponse } from "next/server";
import { isWeirdness } from "../../../lib/character";
import { runImage } from "../../../lib/engine";
import { base64Image, dataUrlList, toDataUrl } from "../../../lib/model-output";
import { sizes } from "../../../lib/models";
import { isFolder } from "../../../lib/folders";
import { saveOutput } from "../../../lib/outputs";
import { badRequest, characterText, failure, modelAndSeed, note, readJson } from "../../../lib/router";
import { isPiece, wardrobePrompt, type WardrobeItem } from "../../../lib/wardrobe";

export const runtime = "nodejs";
export const maxDuration = 300;

// Up to six pieces; the character sheet plus their images stay under the
// models' reference limits.
function readItems(value: unknown): WardrobeItem[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 6) badRequest("Add one to six outfit pieces.");
  return value.map((raw) => {
    const item = raw as Record<string, unknown>;
    if (!isPiece(item.piece)) badRequest("Pick what each piece is (top, bottom, full outfit…).");
    if (item.image !== undefined && !base64Image(item.image)) badRequest("Use PNG, JPEG or WebP images under 15 MB.");
    const words = note(item.words, 300);
    if (!item.image && !words) badRequest("Each piece needs an image or a description.");
    return { piece: item.piece, ...(item.image ? { image: item.image as string } : {}), ...(words ? { words } : {}) };
  });
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const [sheet] = dataUrlList(body.references, 1) ?? badRequest("Pick a saved character.");
    const items = typeof body.customPrompt === "string" && body.customPrompt.trim() && Array.isArray(body.items) && !body.items.length ? [] : readItems(body.items);
    const { model, seed } = modelAndSeed(body, "edit");
    const parts = typeof body.parts === "string" && /^[a-z ,]{0,40}$/.test(body.parts) ? body.parts : undefined;
    const weird = body.weird === undefined ? 0 : isWeirdness(body.weird) ? body.weird : badRequest("Pick a weirdness level.");
    const customPrompt = note(body.customPrompt, 20000, "the custom prompt").trim();
    const prompt = customPrompt || wardrobePrompt(model, items, { character: characterText(body.character), parts, note: note(body.note), weird });
    const references = [sheet, ...items.flatMap((item) => item.image ? [item.image] : [])];
    const result = await runImage({ task: "edit", model, prompt, references, ...sizes.sheet, seed, sameSize: true }, request.signal);
    await saveOutput("outfit", result, { model: result.model, seed: result.seed, prompt, customPrompt: customPrompt || undefined, pieces: items.map((i) => i.piece), note: body.note }, isFolder(body.folder) ? body.folder : undefined);
    return NextResponse.json({ image: toDataUrl(result.bytes, result.contentType), prompt, model: result.model, seed: result.seed, requestId: result.requestId });
  } catch (error) {
    return failure(error);
  }
}
