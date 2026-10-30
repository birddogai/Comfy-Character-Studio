import assert from "node:assert/strict";
import test from "node:test";
import { InsufficientCredits, InvalidWorkflow, JobFailed, QueueFull, Unauthorized } from "@comfyorg/sdk";
import { errorLine, explainError, MissingKeyError } from "../lib/errors.ts";

const cloud = { local: false };
const local = { local: true, baseUrl: "http://127.0.0.1:8189" };

test("a failed job says which step failed and why, and names a known Comfy Cloud bug", () => {
  // The real failure from Oct 27.
  const job = new JobFailed("job ef0bc6bb ended failed", { error: { code: "execution.node", message: "module 'os' has no attribute 'memfd_create'\n", node_id: "sample", class_type: "KSampler" } });
  const e = explainError(job, cloud);
  assert.ok(e.what.includes("Comfy Cloud hit an internal error in Qwen Image's memory cache"));
  assert.ok(e.todo.includes("FLUX 3 Klein"));
  assert.equal(e.detail, `KSampler (step "sample") failed: module 'os' has no attribute 'memfd_create': job ef0bc6bb ended failed`);
  const other = explainError(new JobFailed("job x ended failed", { error: { code: "execution.node", message: "something odd", node_id: "decode", class_type: "VAEDecode" } }), cloud);
  assert.ok(other.what.includes("started the job but it failed in the VAEDecode step"));
  const oom = explainError(new JobFailed("job y ended failed", { error: { code: "x", message: "CUDA out of memory. Tried to allocate 2 GiB" } }), local);
  assert.ok(oom.what.includes("on your machine ran out of memory"));
  const missing = explainError(new JobFailed("job z ended failed", { error: { code: "x", message: "Value not in list: unet_name: 'qwen_image_2.1_int8_convrot.safetensors'" } }), local);
  assert.ok(missing.what.includes("isn't installed on your ComfyUI at http://127.0.0.1:8189") && missing.todo.includes("README"));
});

test("account and setup problems say what to do in plain words", () => {
  assert.ok(explainError(new MissingKeyError("no key"), cloud).todo.includes("COMFY_API_KEY"));
  assert.ok(explainError(new Unauthorized("401", { code: "unauthorized", httpStatus: 401 }), cloud).what.includes("refused the API key"));
  const credits = explainError(new InsufficientCredits("402", { code: "insufficient_credits", httpStatus: 402 }), cloud);
  assert.ok(credits.what.includes("out of credits") && credits.status === 402);
  assert.ok(explainError(new QueueFull("busy", { retryAfter: 30 }), cloud).todo.includes("about 30 seconds"));
  assert.ok(explainError(new InvalidWorkflow("bad graph", { code: "invalid_workflow", details: { node: "x" } }), local).todo.includes("Update ComfyUI"));
  const offline = explainError(new TypeError("fetch failed"), local);
  assert.ok(offline.what.includes("couldn't reach your ComfyUI") && offline.todo.includes("comfy-api-proxy"));
  assert.ok(explainError(new Error("weird"), cloud).what === "The image request failed.");
});

test("the browser gets one line with what happened, what to do and the details", () => {
  const line = errorLine({ what: "A.", todo: "B.", detail: "C", status: 502 });
  assert.equal(line, "A. B. (Details: C)");
});
