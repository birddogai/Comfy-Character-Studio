import { NextResponse } from "next/server";
import { isWeirdness } from "../../../lib/character";
import { runImage } from "../../../lib/engine";
import { dataUrlList, toDataUrl } from "../../../lib/model-output";
import { isFolder } from "../../../lib/folders";
import { saveOutput } from "../../../lib/outputs";
import { badRequest, characterText, failure, modelAndSeed, note, readJson } from "../../../lib/router";
import { grid, isFormat, isLook, isShot, maxCast, maxShots, ratios, storyboardPrompt } from "../../../lib/scene";

export const runtime = "nodejs";
export const maxDuration = 300;

// A storyboard is one image made in one run (the owner's note, Oct 29): the
// cast's sheets, an optional location photo and product photo, and every frame
// written into one prompt. The grid's size comes from the frame count and shape.
export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const sheets = dataUrlList(body.references, maxCast) ?? badRequest(`Pick one to ${maxCast} characters.`);
    const cast = Array.isArray(body.cast) && body.cast.length === sheets.length
      ? body.cast.map((c) => { const m = c as Record<string, unknown>; return { name: note(m?.name, 60), description: characterText(m?.description), outfit: note(m?.outfit, 1000, "the selected outfit"), role: note(m?.role, 40) }; })
      : badRequest("Send a name for each character.");
    const shots = Array.isArray(body.shots) && body.shots.length >= 1 && body.shots.length <= maxShots && body.shots.every(isShot) ? body.shots : badRequest(`Plan 1 to ${maxShots} frames, each with an action.`);
    if (!isLook(body.look)) badRequest("Pick a look.");
    const ratio = ratios.includes(body.ratio as never) ? body.ratio as string : badRequest("Pick a frame shape.");
    const [place] = body.place === undefined ? [] : dataUrlList([body.place], 1) ?? badRequest("Use a PNG, JPEG or WebP location photo.");
    const [product] = body.productImage === undefined ? [] : dataUrlList([body.productImage], 1) ?? badRequest("Use a PNG, JPEG or WebP product photo.");
    const { model, seed } = modelAndSeed(body, "board");
    const weird = body.weird === undefined ? 0 : isWeirdness(body.weird) ? body.weird : badRequest("Pick a weirdness level.");

    const customPrompt = note(body.customPrompt, 20000, "the custom prompt").trim();
    const prompt = customPrompt || storyboardPrompt(model, shots, { cast, look: body.look, ratio, location: note(body.location, 300), brief: note(body.brief, 1200, "the scene description"), hasPlace: Boolean(place), product: note(body.product, 120), hasProduct: Boolean(product), weird, ...(isFormat(body.format) ? { format: body.format } : {}) });
    const references = [...sheets, ...(place ? [place] : []), ...(product ? [product] : [])];
    const { width, height } = grid(shots.length, ratio);
    const result = await runImage({ task: "edit", model, prompt, references, width, height, seed }, request.signal);
    await saveOutput("scene", result, { model: result.model, seed: result.seed, prompt, customPrompt: customPrompt || undefined, shots, cast }, isFolder(body.folder) ? body.folder : undefined);
    return NextResponse.json({ image: toDataUrl(result.bytes, result.contentType), prompt, model: result.model, seed: result.seed, requestId: result.requestId });
  } catch (error) {
    return failure(error);
  }
}
