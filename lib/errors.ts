// Turns whatever went wrong into what a person can act on: what happened,
// what to do, and the technical detail to quote if they ask for help.
// "job … ended failed" alone sent us to Comfy's logs to find a Comfy Cloud
// bug (Oct 27); the SDK already carries the reason, so it is read here.

import { Forbidden, InsufficientCredits, InvalidWorkflow, JobFailed, MissingAsset, MissingCredentials, QueueFull, Unauthorized } from "@comfyorg/sdk";

/** No key and no own ComfyUI configured: raised before any request goes out. */
export class MissingKeyError extends Error {}

export type Explained = {
  /** One plain sentence: what happened. */
  what: string;
  /** What to do about it. */
  todo: string;
  /** The technical detail (failing step and message, job or request id), for a bug report. */
  detail?: string;
  /** HTTP status for the browser. */
  status: number;
};

type Where = { local: boolean; baseUrl?: string };

/** Where runs go: your own ComfyUI (through comfy-api-proxy) or Comfy Cloud. */
export function where(): Where {
  const baseUrl = process.env.COMFY_BASE_URL?.trim();
  return { local: Boolean(baseUrl), baseUrl };
}

const comfy = (w: Where) => w.local ? `your ComfyUI at ${w.baseUrl}` : "Comfy Cloud";

function field(error: unknown, key: string): unknown {
  return error && typeof error === "object" ? (error as Record<string, unknown>)[key] : undefined;
}

/** The failing step and message of a job, if Comfy sent them. */
function jobDetail(error: unknown) {
  const job = field(error, "error") as { message?: string; class_type?: string | null; node_id?: string | null; code?: string } | null | undefined;
  if (!job || typeof job !== "object") return undefined;
  const step = job.class_type ? `${job.class_type}${job.node_id ? ` (step "${job.node_id}")` : ""}` : job.node_id ? `step "${job.node_id}"` : "";
  return { step, message: (job.message ?? "").trim(), code: job.code };
}

export function explainError(error: unknown, w: Where = where()): Explained {
  const name = error instanceof Error ? error.name || error.constructor.name : "";
  const kind = (error as { constructor?: { name?: string } })?.constructor?.name ?? name;
  const message = error instanceof Error ? error.message : String(error ?? "");
  const code = String(field(error, "code") ?? "");
  const requestId = field(error, "requestId");
  const retryAfter = field(error, "retryAfter");
  const ref = typeof requestId === "string" && requestId ? ` Request ID: ${requestId}.` : "";
  // Matched by class where the SDK exports one (names can be shortened in a
  // production build), and by the error code the server sent otherwise.
  const classes: Record<string, unknown> = { MissingCredentials, Unauthorized, InsufficientCredits, Forbidden, QueueFull, InvalidWorkflow, MissingAsset, JobFailed };
  const is = (...names: string[]) => names.some((n) => {
    const cls = classes[n];
    return (typeof cls === "function" && error instanceof (cls as new (...args: never[]) => unknown)) || code === n || kind === n || name === n;
  });

  if (error instanceof MissingKeyError || is("MissingCredentials")) {
    return {
      what: "The app has no Comfy API key, so it can't make images yet.",
      todo: "Get a key at platform.comfy.org (Profile → API keys), put it in the .env.local file as COMFY_API_KEY=…, then stop and restart npm run dev. Running your own ComfyUI instead? Set COMFY_BASE_URL there (see the README).",
      status: 503,
    };
  }
  if (is("Unauthorized", "unauthorized")) {
    return {
      what: `${w.local ? "Your ComfyUI proxy" : "Comfy"} refused the API key.`,
      todo: "Check that COMFY_API_KEY in .env.local is the whole key with no spaces or quotes, that it hasn't been deleted at platform.comfy.org, then restart npm run dev.",
      detail: `${message}.${ref}`, status: 502,
    };
  }
  if (is("InsufficientCredits", "insufficient_credits")) {
    return {
      what: "The Comfy account behind your API key is out of credits.",
      todo: "Add credits at platform.comfy.org, then try again. Or run the models on your own ComfyUI for free (see the README).",
      detail: `${message}.${ref}`, status: 402,
    };
  }
  if (is("Forbidden", "forbidden", "NotEnabled")) {
    return {
      what: "Your Comfy account isn't allowed to run this yet.",
      todo: "Running models on Comfy Cloud needs an active subscription on the account that owns the key. Check your plan at comfy.org, or use your own ComfyUI.",
      detail: `${message}.${ref}`, status: 502,
    };
  }
  if (is("QueueFull", "queue_full", "RateLimited", "ConcurrencyLimitExceeded")) {
    const wait = typeof retryAfter === "number" ? ` about ${Math.ceil(retryAfter)} seconds` : " a minute";
    return { what: `${comfy(w)} is busy right now.`, todo: `Wait${wait} and try again.`, detail: `${message}.${ref}`, status: 503 };
  }
  if (is("InvalidWorkflow", "invalid_workflow", "WorkflowFormatUi")) {
    const details = field(error, "details");
    return {
      what: `${comfy(w)} rejected the app's workflow before running it.`,
      todo: w.local
        ? "Update ComfyUI to the latest version and check that the model files from the README table are installed with the same names."
        : "Comfy may have changed a node the app uses. Try the other model in the picker, and report it with the detail below.",
      detail: `${message}${details ? ` ${JSON.stringify(details).slice(0, 600)}` : ""}.${ref}`, status: 502,
    };
  }
  if (is("MissingAsset", "missing_asset", "HashMismatch", "BlobNotFound")) {
    return { what: "An image couldn't be uploaded to Comfy.", todo: "Try again; if it keeps failing, re-add the image (PNG, JPEG or WebP).", detail: `${message}.${ref}`, status: 502 };
  }
  if (is("ContentPolicyViolation")) {
    return { what: "The model's safety filter refused this request.", todo: "Change the words or the image and try again.", detail: `${message}.${ref}`, status: 422 };
  }

  if (is("JobFailed")) {
    const job = jobDetail(error);
    const technical = [job?.step && `${job.step} failed`, job?.message, message].filter(Boolean).join(": ");
    const text = `${job?.message ?? ""} ${message}`.toLowerCase();
    if (/memfd_create/.test(text)) {
      return {
        what: "Comfy Cloud hit an internal error in Qwen Image's memory cache (their bug, not your settings).",
        todo: "Switch the model to FLUX 3 Klein for now, or try again later. Updating the app may already include a workaround.",
        detail: technical, status: 502,
      };
    }
    if (/out of memory|cuda.*memory|allocat/.test(text)) {
      return {
        what: `The graphics card ${w.local ? "on your machine" : "on Comfy Cloud"} ran out of memory.`,
        todo: w.local ? "Close other apps using the GPU, try FLUX 3 Klein (smaller), or use Comfy Cloud." : "Try again, or switch to FLUX 3 Klein, which needs less memory.",
        detail: technical, status: 502,
      };
    }
    if (/value not in list|not found|no such file|does not exist/.test(text) && /safetensors|ckpt|model/.test(text)) {
      return {
        what: `A model file the app needs isn't installed on ${comfy(w)}.`,
        todo: w.local ? "Download the model files listed in the README into ComfyUI's models folders, keeping the exact file names, then restart ComfyUI." : "Comfy may have renamed a model; try the other model in the picker and report it.",
        detail: technical, status: 502,
      };
    }
    return {
      what: `${comfy(w)} started the job but it failed${job?.step ? ` in the ${job.step.split(" ")[0]} step` : ""}.`,
      todo: "Try again in a minute, or switch to the other model. If it keeps happening, it's likely on Comfy's side: share the detail below when you ask for help.",
      detail: technical, status: 502,
    };
  }

  if (error instanceof Error && (error.name === "AbortError" || /aborted|timed? ?out|deadline/i.test(message))) {
    return { what: "The run took too long and was stopped.", todo: "Try again. The first run after a while can be slow while a GPU starts up.", detail: message, status: 504 };
  }
  if (/fetch failed|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ECONNRESET|network|socket/i.test(`${message} ${String(field(error, "cause") ?? "")}`)) {
    return {
      what: `The app couldn't reach ${comfy(w)}.`,
      todo: w.local
        ? `Make sure ComfyUI and comfy-api-proxy are running and that COMFY_BASE_URL (${w.baseUrl}) is the proxy's address.`
        : "Check your internet connection and try again.",
      detail: message, status: 502,
    };
  }
  return { what: "The image request failed.", todo: "Try again. If it keeps failing, share the detail below when you ask for help.", detail: `${message}${ref}`, status: 502 };
}

/** The one line the browser shows under the button. */
export function errorLine(e: Explained) {
  return `${e.what} ${e.todo}${e.detail ? ` (Details: ${e.detail})` : ""}`;
}
