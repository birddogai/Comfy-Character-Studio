import { NextResponse } from "next/server";
import { errorLine, explainError, MissingKeyError } from "./errors";
import { findModel, isModel, type Task } from "./models";
import { isSeed } from "./workflows";

export { MissingKeyError };
class BadRequestError extends Error {}

export function badRequest(message: string): never {
  throw new BadRequestError(message);
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object") return body as Record<string, unknown>;
  } catch {}
  return badRequest("Send a JSON request.");
}

export function note(value: unknown, max = 400, what = "the extra note") {
  if (value === undefined || value === "") return "";
  if (typeof value !== "string" || value.length > max) return badRequest(`Keep ${what} under ${max} characters.`);
  return value;
}

/** A saved character description: written by the app, so it can be long (weirdness, many features). */
export const characterText = (value: unknown) => note(value, 4000, "the character's saved description");

export function failure(error: unknown) {
  if (error instanceof BadRequestError) return NextResponse.json({ error: error.message }, { status: 400 });
  const explained = explainError(error);
  // The full story goes to the terminal, Comfy's traceback included.
  const traceback = (error as { error?: { traceback?: string } })?.error?.traceback;
  console.error(`Image request failed: ${explained.what}\n  What to do: ${explained.todo}${explained.detail ? `\n  Details: ${explained.detail}` : ""}${traceback ? `\n  Comfy traceback:\n${traceback}` : ""}`);
  return NextResponse.json({ error: errorLine(explained), what: explained.what, todo: explained.todo, detail: explained.detail }, { status: explained.status });
}

/** The model and seed a request asked for, checked. Seeds are optional; a missing one gets a fresh random seed. */
export function modelAndSeed(body: Record<string, unknown>, task: Task) {
  if (body.model !== undefined && !isModel(body.model, task)) badRequest("Pick a supported model.");
  if (body.seed !== undefined && !isSeed(body.seed)) badRequest("The seed must be a whole number.");
  const model = findModel(body.model, task);
  return { model: model.id, seed: (body.seed as number | undefined) ?? Math.floor(Math.random() * 2 ** 32) };
}
