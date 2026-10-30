# Character Studio

An open-source AI character studio that runs on **open-weight models** as ComfyUI workflows, through the [Comfy SDK](https://github.com/Comfy-Org/comfy-typescript-sdk): on Comfy Cloud, or free on your own ComfyUI. Design an original character (person, animal, dog or cat with wings, robot, object or food), dress them in any outfit (even from a shop screenshot), and put them in storyboards for a video model.

**Watch the 2-minute walkthrough:** [`media/walkthrough.mp4`](media/walkthrough.mp4)

Every recipe (the prompts behind each control) is plain text in `lib/`, and every workflow is a plain graph in `lib/workflows.ts`, so anyone can read, fork and improve it.

| Step | What you do | Default model |
| --- | --- | --- |
| **Characters** | Home: one page per character with their sheet, outfits and storyboards. | |
| **1 · Create** | Pick tiles (drawn icons, 4 per row) and generate a character sheet: a big face close-up and a full-body front view. Optional: start from your own face (with consent), a decade, and a weirdness level. | Qwen Image 2.1 (or FLUX 3 Klein, MOSS-Image) |
| **2 · Wardrobe** | Drop product images or shop screenshots (several at once: top + pants), tag each piece, or use a preset or your own words. Makes an outfit sheet of the same character. | Qwen Image 2.1 (or FLUX 3 Klein, MOSS-Image) |
| **3 · Storyboard** | One storyboard image for a video model: pick the cast (up to 4, each in their main sheet or an outfit, with an optional role; type @ in the description to add someone), say what happens, pick a length, a film look (modern, social/UGC, classic eras, genre such as grindhouse, giallo or folk horror), a place and an optional product. The app plans the frames for free; change them if you like, then one run makes every frame as a grid of photographic stills. | Qwen Image 2.1 (or FLUX 3 Klein, MOSS-Image) |

Every step has a **model picker** (Qwen Image 2.1, FLUX 3 Klein, or MOSS-Image for sheets and outfits; all open weights, no closed APIs) and a **seed**: keep it, pick a new one, or redo any result with the same or a new seed.

## ComfyUI workflows

Every workflow the studio runs is in [`workflows/`](workflows/) as a ComfyUI file you can open and run yourself: character sheets (Qwen Image 2.1, FLUX 3 Klein, MOSS-Image), outfits, storyboard frames, area edits (not in the app yet), placing a character in a photo, and the storyboard shot planner. See [`workflows/README.md`](workflows/README.md) for the model files.

## Install with an AI coding agent

Open this folder (or an empty one) in Claude Code, Codex, Cursor or any coding agent and paste:

> Set up Character Studio from https://github.com/birddogai/Comfy-Character-Studio by following its SETUP.md. Ask me for my Comfy API key (or my local ComfyUI address) when you need it; don't print it back.

The agent clones the repo, installs it, writes `.env.local`, runs the tests and starts the app. [`SETUP.md`](SETUP.md) has the exact steps it follows, so you can check them first.

## Run locally (by hand)

1. Install [Node.js 22.6 or newer](https://nodejs.org/).
2. Clone and configure the app:

   ```sh
   git clone https://github.com/birddogai/Comfy-Character-Studio.git
   cd Comfy-Character-Studio
   cp .env.example .env.local
   ```

3. Choose where the models run, in `.env.local`:
   - **Comfy Cloud:** put a [Comfy API key](https://platform.comfy.org/profile/api-keys) in `COMFY_API_KEY`. Open models bill GPU time (a few seconds per image).
   - **Your own ComfyUI (free):** run ComfyUI with the models below behind [comfy-api-proxy](https://github.com/Comfy-Org/comfy-api-proxy) and set `COMFY_BASE_URL` to the proxy, e.g. `http://127.0.0.1:8189`. No key needed.
4. Install and start:

   ```sh
   npm ci
   npm run dev
   ```

5. Open <http://localhost:3000>.

Keep `COMFY_API_KEY` in `.env.local` (or your environment); only the server routes read it. Do not prefix it with `NEXT_PUBLIC_` or commit the file.

### Models for your own ComfyUI

Use a current ComfyUI (0.43.0 or later for MOSS-Image edits). The file names match the official ComfyUI templates ("Qwen Image 2.1", "FLUX 3 Image Klein", "MOSS-Image: Text to Image" and "MOSS-Image: Image Edit LoRA"). MOSS-Image is optional; the app only needs it if you pick it.

| Folder | Qwen Image 2.1 | FLUX 3 Klein | MOSS-Image |
| --- | --- | --- | --- |
| `models/diffusion_models` | `qwen_image_2.1_int8_convrot.safetensors` | `flux3-image-klein-int8-convrot.safetensors` | `moss_image_sft_int8_convrot.safetensors` |
| `models/text_encoders` | `qwen3vl_8b_int8_convrot.safetensors` | `qwen3vl_4b_int8_convrot.safetensors` | `qwen3.5_9b_w4a8_gptq.safetensors` |
| `models/vae` | `qwen_image_2.1_vae_bf16.safetensors` | `flux2-vae.safetensors` | `flux2-vae_small.safetensors` |
| `models/loras` | | | `moss_image_edit_lora_rank_64_bf16.safetensors` |

## How it works

```
browser (IndexedDB: characters, outfits, storyboards)
   │  JSON: tile picks / pieces / shot + model + seed + images as data URLs
   ▼
app/api/{character,wardrobe,plan,scene}/route.ts
   │  validate → build prompt from lib/ → lib/engine.ts
   ▼
open model: ComfyUI workflow from lib/workflows.ts → Comfy SDK → Comfy Cloud or your ComfyUI
   ▼
image as data URL → browser (and a copy in outputs/)
```

- **Consistency:** a saved character is a character sheet (face close-up + full body) plus a written description. Wardrobe and Scenes send the sheet (or an outfit sheet) as a reference image.
- **Exact redo:** open models take a seed; the same seed and settings give the same picture again.
- **Nothing paid for is lost:** every result is kept in your browser (IndexedDB) and also written to the `outputs/` folder with a `.json` of its prompt, model and seed. Unsaved sheets go in date folders (`outputs/2026-10-26/`); once you save a character, their sheet moves to `outputs/characters/<Name>-<code>/` and their outfits and storyboards are written there too (renaming a character renames the folder). Set `OUTPUT_DIR` to save elsewhere or `SAVE_OUTPUTS=false` to turn the files off.
- **Cancel safety:** closing the tab cancels a running job.

## Change the look or language

The visual design (colors, type, spacing, components) is a token-based design system. To rebrand the studio or translate its interface, read [`docs/design-system.md`](docs/design-system.md) and [`docs/rebranding-and-localization.md`](docs/rebranding-and-localization.md) first; UI labels live in `lib/messages.ts`. [`docs/ui-validation.md`](docs/ui-validation.md) explains the layout and accessibility check (`scripts/ui-check.cjs`).

## Make a change

| To add… | Edit |
| --- | --- |
| A creation trait or option | `fields` in `lib/character.ts`: `{ id, label, prompt }` (the UI renders every tile automatically) |
| A place, framing, camera angle, expression or look | `lib/scene.ts` |
| An outfit preset or piece type | `presets` / `pieces` in `lib/wardrobe.ts` |
| A model or a workflow | `lib/models.ts` and `lib/workflows.ts` |
| A tile icon | `components/option-icon.tsx` (48×48 line drawings) |

Run `npm test` after a change. The tests check that every option reaches the prompt, that validation rejects unknown values, and that every workflow graph is complete.

## Responsible use

- Characters are fictional by default. Uploading a real face requires a consent checkbox, and the server refuses face uploads without it.
- Wardrobe reminds people to only promote products they're allowed to promote, and uses only the clothes from product images, never the shop model's face.
- Don't use this to impersonate real people or to pass AI content off as real. Label AI characters as AI where platforms require it.

## If a run fails

The app tells you what went wrong in plain words under the button you pressed, with what to do and a "Details" part to share if you ask for help. The terminal running `npm run dev` prints the same, plus Comfy's full error. When the app opens, a banner shows if it isn't set up yet (no API key, or your own ComfyUI isn't answering).

| You see | What to do |
| --- | --- |
| "The app has no Comfy API key" | Create a key at [platform.comfy.org](https://platform.comfy.org/profile/api-keys), put it in `.env.local` as `COMFY_API_KEY=…`, restart `npm run dev`. |
| "Comfy refused the API key" | Paste the whole key again (no spaces or quotes) and restart. Check it wasn't deleted. |
| "Out of credits" | Add credits on the account that owns the key, or run your own ComfyUI. |
| "Isn't allowed to run this yet" | Running models on Comfy Cloud needs an active subscription on that account. |
| "Comfy Cloud is busy" | Wait the time shown and try again. |
| "Started the job but it failed in the … step" | Usually on Comfy's side: try again in a minute or switch model. Share the details if it keeps happening. |
| "A model file the app needs isn't installed" | Own ComfyUI: download the files in the table above with the exact names, restart ComfyUI. |
| "Couldn't reach your ComfyUI" | Start ComfyUI and comfy-api-proxy, and check `COMFY_BASE_URL` is the proxy's address. |
| "Rejected the app's workflow" | Update ComfyUI. On Comfy Cloud, try the other model and report it. |

Images must be at least 256×256 pixels; the uploader resizes large photos for you.

## Credits

Open models: Qwen Image 2.1 (Qwen team), FLUX 3 Image Klein (Black Forest Labs) and MOSS-Image (OpenMOSS, Apache 2.0), each under its own license. Structure based on [Comfy-Org/comfy-cinematic-studio](https://github.com/Comfy-Org/comfy-cinematic-studio) (MIT).

## Walkthrough video

Voice by birddogai (Voicebox). Music: "Arcade Groove" by birddogai, made with Suno and used under its commercial license.

## License

MIT. See [`LICENSE`](LICENSE).
