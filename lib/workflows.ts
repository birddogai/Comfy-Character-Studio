// ComfyUI workflows for the open models, as plain API-format graphs.
// Each builder returns the graph, the LoadImage nodes the caller fills with
// images (in order), and the node whose output is the result. The same graphs
// run on Comfy Cloud or on your own ComfyUI (see lib/engine.ts), and were
// tested on Comfy Cloud on Oct 22, 2026.

import type { ModelId, Task } from "./models.ts";

type Node = { class_type: string; inputs: Record<string, unknown>; _meta?: { title: string } };
export type Graph = Record<string, Node>;
export type Built = { graph: Graph; images: string[]; output: string };

export type Box = { x: number; y: number; width: number; height: number };

const node = (title: string, class_type: string, inputs: Record<string, unknown>): Node => ({ class_type, inputs, _meta: { title } });

// Model files as named on Comfy Cloud and in the official ComfyUI templates.
export const files = {
  qwen: { unet: "qwen_image_2.1_int8_convrot.safetensors", clip: "qwen3vl_8b_int8_convrot.safetensors", vae: "qwen_image_2.1_vae_bf16.safetensors" },
  klein: { unet: "flux3-image-klein-int8-convrot.safetensors", clip: "qwen3vl_4b_int8_convrot.safetensors", vae: "flux2-vae.safetensors" },
  moss: { unet: "moss_image_sft_int8_convrot.safetensors", clip: "qwen3.5_9b_w4a8_gptq.safetensors", vae: "flux2-vae_small.safetensors", editLora: "moss_image_edit_lora_rank_64_bf16.safetensors" },
};

// Qwen's cache on "auto" spills into RAM, and on Comfy Cloud that path failed
// with "module 'os' has no attribute 'memfd_create'" (Oct 27). "gpu" keeps it
// in video memory, which the cloud GPUs have plenty of.
const cacheDevice = "gpu";

/** ComfyUI seeds are whole numbers; this keeps them in a range every sampler accepts. */
export const maxSeed = 2 ** 48;
export function isSeed(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) < maxSeed;
}

// Sizes must be multiples of 16 for both models.
export function snap(value: number) {
  return Math.max(256, Math.round(value / 16) * 16);
}

/** Qwen Image 2.1 from text: the first character sheet (best at inventing creatures in tests). */
export function qwenText({ prompt, width, height, seed }: { prompt: string; width: number; height: number; seed: number }): Built {
  const { unet, clip, vae } = files.qwen;
  return {
    images: [],
    output: "save",
    graph: {
      unet: node("Qwen Image 2.1", "UNETLoader", { unet_name: unet, weight_dtype: "default" }),
      cache: node("Qwen cache", "QwenImage21Cache", { model: ["unet", 0], device: cacheDevice, dtype: "default" }),
      clip: node("Text encoder", "CLIPLoader", { clip_name: clip, type: "qwen_image", device: "default" }),
      vae: node("VAE", "VAELoader", { vae_name: vae }),
      text: node("Prompt", "TextEncodeQwenImage21", { clip: ["clip", 0], prompt, negative_prompt: "", resolution: 1024 }),
      latent: node("Size", "EmptyLatentImage", { width: snap(width), height: snap(height), batch_size: 1 }),
      sample: node("Sampler", "KSampler", { model: ["cache", 0], positive: ["text", 0], negative: ["text", 1], latent_image: ["latent", 0], seed, steps: 25, cfg: 1, sampler_name: "euler", scheduler: "simple", denoise: 1 }),
      decode: node("Decode", "VAEDecode", { samples: ["sample", 0], vae: ["vae", 0] }),
      save: node("Save", "SaveImage", { images: ["decode", 0], filename_prefix: "studio" }),
    },
  };
}

/** Qwen Image 2.1 edit: up to 10 reference images; without a size the result takes the first reference's size. */
export function qwenEdit({ prompt, references, seed, width, height }: { prompt: string; references: number; seed: number; width?: number; height?: number }): Built {
  const { unet, clip, vae } = files.qwen;
  const images = Array.from({ length: references }, (_, i) => `ref${i}`);
  const graph: Graph = {
    unet: node("Qwen Image 2.1", "UNETLoader", { unet_name: unet, weight_dtype: "default" }),
    cache: node("Qwen cache", "QwenImage21Cache", { model: ["unet", 0], device: cacheDevice, dtype: "default" }),
    clip: node("Text encoder", "CLIPLoader", { clip_name: clip, type: "qwen_image", device: "default" }),
    vae: node("VAE", "VAELoader", { vae_name: vae }),
    text: node("Prompt and references", "TextEncodeQwenImage21", {
            clip: ["clip", 0], vae: ["vae", 0], prompt, negative_prompt: "", resolution: 0,
      ...Object.fromEntries(images.map((id, i) => [`images.image_${i + 1}`, [id, 0]])),
    }),
    sample: node("Sampler", "KSampler", { model: ["cache", 0], positive: ["text", 0], negative: ["text", 1], latent_image: ["text", 2], seed, steps: 25, cfg: 1, sampler_name: "euler", scheduler: "simple", denoise: 1 }),
    decode: node("Decode", "VAEDecode", { samples: ["sample", 0], vae: ["vae", 0] }),
    save: node("Save", "SaveImage", { images: ["decode", 0], filename_prefix: "studio" }),
  };
  for (const id of images) graph[id] = node(`Reference ${id.slice(3)}`, "LoadImage", { image: "" });
  if (width && height) {
    graph.latent = node("Size", "EmptyLatentImage", { width: snap(width), height: snap(height), batch_size: 1 });
    graph.sample.inputs.latent_image = ["latent", 0];
  }
  return { graph, images, output: "save" };
}

// FLUX 3 Klein shares one loader block between its builders.
function kleinBase(prompt: unknown): Graph {
  const { unet, clip, vae } = files.klein;
  return {
    unet: node("FLUX 3 Klein", "UNETLoader", { unet_name: unet, weight_dtype: "default" }),
    clip: node("Text encoder", "CLIPLoader", { clip_name: clip, type: "flux3", device: "default" }),
    vae: node("VAE", "VAELoader", { vae_name: vae }),
    text: node("Prompt", "CLIPTextEncode", { clip: ["clip", 0], text: prompt }),
    negative: node("Negative", "ConditioningZeroOut", { conditioning: ["text", 0] }),
    decode: node("Decode", "VAEDecode", { samples: ["sample", 0], vae: ["vae", 0] }),
    save: node("Save", "SaveImage", { images: ["decode", 0], filename_prefix: "studio" }),
  };
}

const kleinSampler = (seed: number, positive: unknown, negative: unknown, latent: unknown) =>
  node("Sampler", "KSampler", { model: ["unet", 0], positive, negative, latent_image: latent, seed, steps: 16, cfg: 1, sampler_name: "euler", scheduler: "simple", denoise: 1 });

/** FLUX 3 Klein from text only. */
export function kleinText({ prompt, width, height, seed }: { prompt: string; width: number; height: number; seed: number }): Built {
  const graph = kleinBase(prompt);
  graph.latent = node("Size", "EmptyFlux2LatentImage", { width: snap(width), height: snap(height), batch_size: 1 });
  graph.sample = kleinSampler(seed, ["text", 0], ["negative", 0], ["latent", 0]);
  return { graph, images: [], output: "save" };
}

/**
 * FLUX 3 Klein edit with references, named <ref_image_0>, <ref_image_1>… in
 * the prompt. Without a size the result takes the first reference's shape.
 */
export function kleinEdit({ prompt, references, seed, width, height }: { prompt: string; references: number; seed: number; width?: number; height?: number }): Built {
  const graph = kleinBase(prompt);
  const images = Array.from({ length: references }, (_, i) => `ref${i}`);
  for (const id of images) graph[id] = node(`Reference ${id.slice(3)}`, "LoadImage", { image: "" });
  graph.refs = node("References", "ReferenceMultiLatent", {
    positive: ["text", 0], negative: ["negative", 0], vae: ["vae", 0], resolution: "resize", "resolution.megapixels": 1.8,
    ...Object.fromEntries(images.map((id, i) => [`images.image${i}`, [id, 0]])),
  });
  let latent: unknown = ["refs", 2];
  if (width && height) {
    graph.latent = node("Size", "EmptyFlux2LatentImage", { width: snap(width), height: snap(height), batch_size: 1 });
    latent = ["latent", 0];
  }
  graph.sample = kleinSampler(seed, ["refs", 0], ["refs", 1], latent);
  return { graph, images, output: "save" };
}

/**
 * FLUX 3 Klein box edit: one box on the image, called <obj_1> in the prompt.
 * Extra references (e.g. a character to place there) follow as
 * <ref_image_1>…. The whole image is redrawn, so for small fixes the app
 * pastes back only the boxed area.
 */
export function kleinBoxEdit({ prompt, box, width, height, seed, extra = 0 }: { prompt: string; box: Box; width: number; height: number; seed: number; extra?: number }): Built {
  const graph = kleinBase(["layout", 0]);
  const images = Array.from({ length: extra + 1 }, (_, i) => `ref${i}`);
  graph.ref0 = node("Image to edit", "LoadImage", { image: "" });
  for (const id of images.slice(1)) graph[id] = node(`Reference ${id.slice(3)}`, "LoadImage", { image: "" });
  graph.boxes = node("Edit box", "CreateBoundingBoxes", {
    background: ["ref0", 0], width, height,
    // Widget lists are wrapped so ComfyUI doesn't read them as node links.
    editor_state: { __value__: [{ ...box, metadata: { type: "obj", text: "", desc: "area to change", palette: [] } }] },
    last_incoming: { __value__: [] },
  });
  graph.layout = node("Layout prompt", "Flux3LayoutPrompt", { element: ["boxes", 2], prompt });
  graph.refs = node("References", "ReferenceMultiLatent", {
    positive: ["text", 0], negative: ["negative", 0], vae: ["vae", 0], resolution: "resize", "resolution.megapixels": 1.8,
    ...Object.fromEntries(images.map((id, i) => [`images.image${i}`, [id, 0]])),
  });
  graph.sample = kleinSampler(seed, ["refs", 0], ["refs", 1], ["refs", 2]);
  return { graph, images, output: "save" };
}

/**
 * MOSS-Image (SFT) from text, following Comfy's "MOSS-Image: Text to Image"
 * template (Oct 2026) with its prompt enhancer off: our prompts are already
 * full captions, and the enhancer would rewrite the panel layout.
 */
export function mossText({ prompt, width, height, seed }: { prompt: string; width: number; height: number; seed: number }): Built {
  const { unet, clip, vae } = files.moss;
  return {
    images: [],
    output: "save",
    graph: {
      unet: node("MOSS-Image", "UNETLoader", { unet_name: unet, weight_dtype: "default" }),
      clip: node("Text encoder", "CLIPLoader", { clip_name: clip, type: "moss_image", device: "default" }),
      vae: node("VAE", "VAELoader", { vae_name: vae }),
      text: node("Prompt", "CLIPTextEncode", { clip: ["clip", 0], text: prompt }),
      negative: node("Negative", "CLIPTextEncode", { clip: ["clip", 0], text: "nsfw, worst quality, bad anatomy, watermark, jpeg artifact" }),
      latent: node("Size", "EmptyFlux2LatentImage", { width: snap(width), height: snap(height), batch_size: 1 }),
      sample: node("Sampler", "KSampler", { model: ["unet", 0], positive: ["text", 0], negative: ["negative", 0], latent_image: ["latent", 0], seed, steps: 25, cfg: 2.5, sampler_name: "er_sde", scheduler: "simple", denoise: 1 }),
      decode: node("Decode", "VAEDecode", { samples: ["sample", 0], vae: ["vae", 0] }),
      save: node("Save", "SaveImage", { images: ["decode", 0], filename_prefix: "studio" }),
    },
  };
}

/**
 * MOSS-Image edit, following Comfy's "MOSS-Image: Image Edit LoRA" template
 * (on Comfy Cloud from Oct 28): the SFT model with the edit LoRA, each
 * reference scaled to the result's size (1 MP by default) and given to both prompts, skip-layer guidance on
 * layer 22, 30 steps at cfg 4. Without a size the result takes the first
 * reference's (scaled) shape. The template suggests up to four references.
 */
export function mossEdit({ prompt, references, seed, width, height }: { prompt: string; references: number; seed: number; width?: number; height?: number }): Built {
  const { unet, clip, vae, editLora } = files.moss;
  const images = Array.from({ length: references }, (_, i) => `ref${i}`);
  // The template keeps the references and the result the same size; with a
  // set size (a 1.9 MP sheet in Wardrobe) the references are scaled to match.
  const megapixels = width && height ? Math.min(2, Math.round((snap(width) * snap(height)) / 1e4) / 100) : 1;
  const graph: Graph = {
    unet: node("MOSS-Image", "UNETLoader", { unet_name: unet, weight_dtype: "default" }),
    lora: node("Edit LoRA", "LoraLoaderModelOnly", { model: ["unet", 0], lora_name: editLora, strength_model: 1 }),
    guidance: node("Skip layer guidance", "SkipLayerGuidanceDiTSimple", { model: ["lora", 0], double_layers: "", single_layers: "22", start_percent: 0, end_percent: 1 }),
    clip: node("Text encoder", "CLIPLoader", { clip_name: clip, type: "moss_image", device: "default" }),
    vae: node("VAE", "VAELoader", { vae_name: vae }),
  };
  for (const id of images) {
    graph[id] = node(`Reference ${id.slice(3)}`, "LoadImage", { image: "" });
    graph[`${id}s`] = node(`Reference ${id.slice(3)} scaled`, "ImageScaleToTotalPixels", { image: [id, 0], upscale_method: "lanczos", megapixels, resolution_steps: 16 });
  }
  const refs = Object.fromEntries(images.map((id, i) => [`images.image_${i}`, [`${id}s`, 0]]));
  const encode = (title: string, text: string) => node(title, "TextEncodeMOSSImageEdit", { clip: ["clip", 0], prompt: text, edit_format: "Moss-Image-Edit", image_strength: 1, vae: ["vae", 0], ...refs });
  graph.text = encode("Prompt", prompt);
  graph.negative = encode("Negative", "nsfw, worst quality, bad anatomy, watermark, jpeg artifact");
  if (width && height) {
    graph.latent = node("Size", "EmptyFlux2LatentImage", { width: snap(width), height: snap(height), batch_size: 1 });
  } else {
    graph.size = node("First reference size", "GetImageSize", { image: ["ref0s", 0] });
    graph.latent = node("Size", "EmptyFlux2LatentImage", { width: ["size", 0], height: ["size", 1], batch_size: 1 });
  }
  graph.sample = node("Sampler", "KSampler", { model: ["guidance", 0], positive: ["text", 0], negative: ["negative", 0], latent_image: ["latent", 0], seed, steps: 30, cfg: 4, sampler_name: "euler", scheduler: "normal", denoise: 1 });
  graph.decode = node("Decode", "VAEDecode", { samples: ["sample", 0], vae: ["vae", 0] });
  graph.save = node("Save", "SaveImage", { images: ["decode", 0], filename_prefix: "studio" });
  return { graph, images, output: "save" };
}

/**
 * Text only: Qwen3.5 9B writes text (the storyboard's shots) with TextGenerate,
 * the node MOSS-Image's template uses for its prompt enhancer. SaveText hands
 * the reply back as a text output.
 */
export function textWorkflow({ system, prompt, seed, maxLength = 1500, image = false }: { system: string; prompt: string; seed: number; maxLength?: number; image?: boolean }): Built {
  // An optional picture Qwen looks at (the product), at about half a megapixel.
  const seeing: Graph = image ? {
    ref0: node("Picture", "LoadImage", { image: "" }),
    small: node("Picture at 0.5 MP", "ImageScaleToTotalPixels", { image: ["ref0", 0], upscale_method: "lanczos", megapixels: 0.5, resolution_steps: 16 }),
  } : {};
  return {
    images: image ? ["ref0"] : [],
    output: "save",
    graph: {
      ...seeing,
      clip: node("Text model", "CLIPLoader", { clip_name: files.moss.clip, type: "moss_image", device: "default" }),
      write: node("Write", "TextGenerate", {
        clip: ["clip", 0], prompt, system_prompt: system, max_length: maxLength,
        sampling_mode: "on", "sampling_mode.temperature": 0.8, "sampling_mode.top_k": 64, "sampling_mode.top_p": 0.95, "sampling_mode.min_p": 0.05,
        "sampling_mode.repetition_penalty": 1.05, "sampling_mode.seed": seed, thinking: false, use_default_template: true,
        ...(image ? { image: ["small", 0] } : {}),
      }),
      save: node("Save", "SaveText", { text: ["write", 0], filename_prefix: "studio-plan", format: "txt" }),
    },
  };
}

/** Picks the graph for a model and task. Exported for tests. */
export function buildWorkflow(model: ModelId, job: { task: Task; prompt: string; references?: unknown[]; width: number; height: number; seed: number; box?: Box; sameSize?: boolean }): Built {
  const references = job.references?.length ?? 0;
  const { prompt, width, height, seed } = job;
  if (job.task === "box") {
    if (!job.box) throw new Error("A box edit needs a box.");
    return kleinBoxEdit({ prompt, box: job.box, width, height, seed, extra: Math.max(0, references - 1) });
  }
  if (job.task === "sheet" && references === 0) {
    if (model === "moss-image") return mossText({ prompt, width, height, seed });
    return model === "qwen-2.1" ? qwenText({ prompt, width, height, seed }) : kleinText({ prompt, width, height, seed });
  }
  if (model === "moss-image") return mossEdit({ prompt, references, seed, width, height });
  // Comfy's Qwen 2.1 edit template takes its canvas from the text encoder (sized to
  // the first image); our own empty canvas gave an over-sharpened HDR look and a
  // textured background, and the new clothes were ignored (Wardrobe test, Oct 30).
  return model === "qwen-2.1"
    ? qwenEdit(job.sameSize ? { prompt, references, seed } : { prompt, references, seed, width, height })
    : kleinEdit({ prompt, references, seed, width, height });
}
