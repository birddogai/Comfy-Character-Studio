import { NextResponse } from "next/server";
import { editPrompt, editSize } from "../../../lib/edit";
import { runImage } from "../../../lib/engine";
import { dataUrlList, toDataUrl } from "../../../lib/model-output";
import { isFolder } from "../../../lib/folders";
import { saveOutput } from "../../../lib/outputs";
import { badRequest, failure, modelAndSeed, note, readJson } from "../../../lib/router";

export const runtime = "nodejs";
export const maxDuration = 300;

const whole = (value: unknown, max: number) => Number.isInteger(value) && (value as number) >= 8 && (value as number) <= max;

// The browser sends a crop around the marked area; the result comes back at
// about one megapixel in the crop's shape and is pasted back by the browser.
export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const [image] = dataUrlList([body.image], 1) ?? badRequest("Send the area to edit.");
    const size = body.size as { width?: unknown; height?: unknown } | undefined;
    if (!size || !whole(size.width, 8192) || !whole(size.height, 8192)) badRequest("Send the area's size.");
    const instruction = note(body.instruction, 400);
    if (!instruction.trim()) badRequest("Say what the area should become.");
    const { model, seed } = modelAndSeed(body, "edit");

    const prompt = editPrompt(model, instruction);
    const result = await runImage({ task: "edit", model, prompt, references: [image], ...editSize(size as { width: number; height: number }), seed, sameSize: true }, request.signal);
    await saveOutput("edit", result, { model: result.model, seed: result.seed, prompt }, isFolder(body.folder) ? body.folder : undefined);
    return NextResponse.json({ image: toDataUrl(result.bytes, result.contentType), prompt, model: result.model, seed: result.seed, requestId: result.requestId });
  } catch (error) {
    return failure(error);
  }
}
