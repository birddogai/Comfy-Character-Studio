import { NextResponse } from "next/server";
import { runText } from "../../../lib/engine";
import { noHumanMouth, plannerPrompt, plannerSystem, readShots } from "../../../lib/director";
import { dataUrlList } from "../../../lib/model-output";
import { badRequest, characterText, failure, note, readJson } from "../../../lib/router";
import { isFormat, isLook, maxCast, maxShots, planShots } from "../../../lib/scene";
import { isSeed } from "../../../lib/workflows";

export const runtime = "nodejs";
export const maxDuration = 300;

// Qwen writes the storyboard's shots from the brief (one cheap text run). If its
// reply can't be read, the free template plan is returned instead, marked so.
export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const brief = note(body.brief, 1200, "the description");
    if (!brief.trim()) badRequest("Say what happens first.");
    const count = Number(body.count);
    if (!Number.isInteger(count) || count < 1 || count > maxShots) badRequest(`Pick 1 to ${maxShots} shots.`);
    const format = isFormat(body.format) ? body.format : "story";
    const cast = Array.isArray(body.cast) ? body.cast.slice(0, maxCast).map((c) => { const m = c as Record<string, unknown>; return { name: note(m?.name, 60), role: note(m?.role, 40), description: characterText(m?.description), outfit: note(m?.outfit, 1000, "the selected outfit") }; }) : [];
    const seed = isSeed(body.seed) ? body.seed : Math.floor(Math.random() * 2 ** 32);
    const product = note(body.product, 120);
    const [productPhoto] = body.productImage === undefined ? [] : dataUrlList([body.productImage], 1) ?? badRequest("Use a PNG, JPEG or WebP product photo.");
    const reply = await runText({
      system: plannerSystem(count),
      prompt: plannerPrompt({ brief, count, format, cast, look: isLook(body.look) ? body.look : "film", place: note(body.place, 300), product, productPhoto: Boolean(productPhoto), seconds: Number(body.seconds) || undefined, weird: Number(body.weird) || 0 }),
      seed, ...(productPhoto ? { image: productPhoto } : {}),
    }, request.signal);
    const read = readShots(reply, count);
    // Creatures (their description says "no human…") never grin or smile.
    const creatures = cast.some((c) => /no human/i.test(c.description ?? ""));
    const shots = read && creatures ? read.map((s) => ({ ...s, action: noHumanMouth(s.action) })) : read;
    if (shots) return NextResponse.json({ shots, source: "qwen" });
    console.error(`Shot planner reply could not be read, using the template plan:\n${reply.slice(0, 1500)}`);
    return NextResponse.json({ shots: planShots(brief, count, format, cast[0]?.name || "the character", product), source: "template" });
  } catch (error) {
    return failure(error);
  }
}
