import { Comfy } from "@comfyorg/sdk";
import { findModel, type ModelId, type Task } from "./models";
import { MissingKeyError } from "./router";
import { buildWorkflow, textWorkflow, type Box, type Built } from "./workflows";

// Runs one image job on whichever model the user picked.
// Open models: a ComfyUI workflow through the Comfy SDK. It targets Comfy
// Cloud with COMFY_API_KEY, or your own ComfyUI when COMFY_BASE_URL points at
// comfy-api-proxy in front of it (then no key is needed).

export type Job = {
  task: Task;
  model: ModelId | string | undefined;
  prompt: string;
  /** Data URLs, in the order the prompt refers to them. */
  references?: string[];
  width: number;
  height: number;
  seed: number;
  /** For box edits, in pixels of the first reference. */
  box?: Box;
  /** The result is the first reference changed (Wardrobe, Edit): Qwen then sizes it from that image, like Comfy's template. */
  sameSize?: boolean;
};

export type JobResult = { bytes: Uint8Array; contentType: string | null; requestId: string; model: ModelId; seed?: number };

export async function runImage(job: Job, signal?: AbortSignal): Promise<JobResult> {
  const references = job.references ?? [];
  const model = findModel(job.model, job.task);
  const built = buildWorkflow(model.id, job);
  const result = await runWorkflow(built, references, signal);
  return { ...result, model: model.id, seed: job.seed };
}

function client() {
  if (process.env.COMFY_BASE_URL?.trim()) return new Comfy({ clientInfo: "ai-character-studio" });
  const apiKey = process.env.COMFY_API_KEY?.trim();
  if (!apiKey) throw new MissingKeyError("Add COMFY_API_KEY to .env.local (or set COMFY_BASE_URL for your own ComfyUI) and restart the app.");
  return new Comfy({ apiKey, clientInfo: "ai-character-studio" });
}

function dataUrlBytes(dataUrl: string) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Send images as PNG, JPEG or WebP.");
  return { bytes: new Uint8Array(Buffer.from(match[2], "base64")), contentType: match[1] };
}

export async function runWorkflow(built: Built, references: string[], signal?: AbortSignal) {
  if (references.length !== built.images.length) throw new Error(`This workflow takes ${built.images.length} image(s).`);
  const comfy = client();
  // A copy, so the shared builders are never changed by a run.
  const wf = comfy.workflows.fromJson(structuredClone(built.graph));
  built.images.forEach((nodeId, i) => {
    const { bytes, contentType } = dataUrlBytes(references[i]);
    wf.setInput(nodeId, "image", comfy.assets.fromBytes(bytes, { filename: `${nodeId}.${contentType.split("/")[1]}`, contentType }));
  });
  // Ten minutes covers a cold GPU start; closing the tab cancels the job.
  const job = await comfy.run(wf, { signal, timeoutMs: 600_000 });
  const [output] = job.getOutputs(built.output);
  if (!output) throw new Error(`The workflow finished without an image (job ${job.id ?? "unknown"}).`);
  return { bytes: await output.toBytes(), contentType: output.contentType || "image/png", requestId: String(job.id ?? "workflow") };
}

/** Runs a text-only workflow (the shot planner) and returns what the model wrote. */
export async function runText(job: { system: string; prompt: string; seed: number; image?: string }, signal?: AbortSignal) {
  const built = textWorkflow({ ...job, image: Boolean(job.image) });
  const comfy = client();
  const wf = comfy.workflows.fromJson(structuredClone(built.graph));
  if (job.image) {
    const { bytes, contentType } = dataUrlBytes(job.image);
    wf.setInput("ref0", "image", comfy.assets.fromBytes(bytes, { filename: `ref0.${contentType.split("/")[1]}`, contentType }));
  }
  const run = await comfy.run(wf, { signal, timeoutMs: 300_000 });
  const [output] = run.getOutputs(built.output);
  if (!output) throw new Error(`The planner finished without text (job ${run.id ?? "unknown"}).`);
  return new TextDecoder().decode(await output.toBytes());
}
