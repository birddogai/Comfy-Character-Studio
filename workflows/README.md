# ComfyUI workflows

These are the workflows Character Studio runs, as ComfyUI API-format files. The app builds them in code (`lib/workflows.ts`) and fills in the prompt, images, size and seed for each run; these copies have an example prompt so you can open and run them in ComfyUI yourself.

## Use one

1. Open ComfyUI (desktop, or a current portable/manual install).
2. Drag a `.json` file onto the canvas, or use **Workflow → Open**.
3. If a workflow has **Load Image** nodes, put your images in ComfyUI's `input` folder and pick them there (the file names below are just examples).
4. Replace the example prompt in the **Prompt** node (for the Edit and Place workflows, the **Layout prompt** node; set the box in **Edit box**).
5. Queue it.

| File | What it makes | Images to load |
| --- | --- | --- |
| [`character-sheet-qwen-image-2.1.json`](character-sheet-qwen-image-2.1.json) | **Character sheet · Qwen Image 2.1**. Create (default): a new character sheet from words. | none |
| [`character-sheet-flux-3-klein.json`](character-sheet-flux-3-klein.json) | **Character sheet · FLUX 3 Klein**. Create, with FLUX 3 Klein picked. | none |
| [`character-sheet-moss-image.json`](character-sheet-moss-image.json) | **Character sheet · MOSS-Image**. Create, with MOSS-Image picked. | none |
| [`outfit-flux-3-klein.json`](outfit-flux-3-klein.json) | **Outfit sheet · FLUX 3 Klein**. Wardrobe, with FLUX 3 Klein picked: the same character sheet wearing the clothing in the second image. | character_sheet.png, clothing.png |
| [`outfit-qwen-image-2.1.json`](outfit-qwen-image-2.1.json) | **Outfit sheet · Qwen Image 2.1**. Wardrobe (default). | character_sheet.png, clothing.png |
| [`outfit-moss-image.json`](outfit-moss-image.json) | **Outfit sheet · MOSS-Image**. Wardrobe, with MOSS-Image picked. | character_sheet.png, clothing.png |
| [`storyboard-flux-3-klein.json`](storyboard-flux-3-klein.json) | **Storyboard frames · FLUX 3 Klein**. Storyboard: one image of frames starring the character from the sheet. | character_sheet.png |
| [`edit-area-flux-3-klein.json`](edit-area-flux-3-klein.json) | **Edit an area · FLUX 3 Klein**. Edit: change only the boxed area (x, y, width, height in the Edit box node). | image_to_edit.png |
| [`place-character-flux-3-klein.json`](place-character-flux-3-klein.json) | **Place a character in a photo · FLUX 3 Klein**. Storyboard and scenes: put the character from the second image into the boxed area of a location photo. | location.png, character_sheet.png |
| [`storyboard-planner-qwen-text.json`](storyboard-planner-qwen-text.json) | **Storyboard shot planner · Qwen3.5 text**. Storyboard: writes the shot list from your brief before the frames are drawn. | none |

## Model files

All open weights. File names match Comfy Cloud and the official ComfyUI templates (search the template browser for "Qwen Image 2.1", "FLUX 3 Image Klein" and "MOSS-Image" to download them).

| Model | `models/diffusion_models` | `models/text_encoders` | `models/vae` | `models/loras` |
| --- | --- | --- | --- | --- |
| Qwen Image 2.1 | `qwen_image_2.1_int8_convrot.safetensors` | `qwen3vl_8b_int8_convrot.safetensors` | `qwen_image_2.1_vae_bf16.safetensors` | |
| FLUX 3 Klein | `flux3-image-klein-int8-convrot.safetensors` | `qwen3vl_4b_int8_convrot.safetensors` | `flux2-vae.safetensors` | |
| MOSS-Image | `moss_image_sft_int8_convrot.safetensors` | `qwen3.5_9b_w4a8_gptq.safetensors` | `flux2-vae_small.safetensors` | `moss_image_edit_lora_rank_64_bf16.safetensors` (edits) |

The storyboard shot planner only needs the MOSS-Image text encoder (`qwen3.5_9b_w4a8_gptq.safetensors`).

## Keep them in sync

After changing `lib/workflows.ts` or `lib/workflow-exports.ts`, run `npm run workflows`. `npm test` fails if a file here no longer matches the code.
