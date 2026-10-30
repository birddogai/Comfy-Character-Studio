import { NextResponse } from "next/server";
import { runImage } from "../../../lib/engine";
import { base64Image, toDataUrl } from "../../../lib/model-output";
import { fitKind, identityDescription, type Selection, characterPrompt, isColor, isSelection, isWeirdness, upgradeSelection } from "../../../lib/character";
import { sizes } from "../../../lib/models";
import { saveOutput } from "../../../lib/outputs";
import { badRequest, characterText, failure, modelAndSeed, note, readJson } from "../../../lib/router";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    body.selection = upgradeSelection(body.selection);
    if (!isSelection(body.selection)) badRequest("Choose a supported option for every control.");
    // Older looks can hold picks that clash (plus-size with a narrow waist) or a trans fox.
    const selection = fitKind(body.selection as Selection);
    if (body.color !== undefined && !isColor(body.color)) badRequest("Pick the custom color again.");
    const color = body.color as string | undefined;
    const detail = note(body.detail);
    const weird = body.weird === undefined ? 0 : isWeirdness(body.weird) ? body.weird : badRequest("Pick a weirdness level.");
    const { model, seed } = modelAndSeed(body, "sheet");
    if (body.face !== undefined) {
      if (!base64Image(body.face)) badRequest("Upload the photo as a PNG, JPEG or WebP image under 15 MB.");
      if (body.consent !== true) badRequest("Confirm that this is you or that you have the person's permission.");
    }
    const face = body.face as string | undefined;

    const references = { face: Boolean(face), body: Boolean(face) && body.likeness === "body" };
    const customPrompt = note(body.customPrompt, 20000, "the custom prompt").trim();
    const prompt = customPrompt || characterPrompt(selection, detail, references, color, weird, model, seed);
    const description = customPrompt ? characterText(body.savedDescription) : identityDescription(selection, color, references, weird);
    const images = face ? [face] : [];
    // Two panels side by side: a face close-up and a full-body front view.
    const result = await runImage({ task: "sheet", model, prompt, references: images, ...sizes.sheet, seed }, request.signal);
    const file = await saveOutput("sheet", result, { model: result.model, seed: result.seed, prompt, customPrompt: customPrompt || undefined, description, selection: selection, color, detail, weird });
    return NextResponse.json({
      image: toDataUrl(result.bytes, result.contentType),
      prompt,
      description,
      ...(file ? { file } : {}),
      model: result.model,
      seed: result.seed,
      requestId: result.requestId,
    });
  } catch (error) {
    return failure(error);
  }
}
