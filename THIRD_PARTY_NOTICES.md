# Third-party notices

Character Studio's own code is under the MIT license (see [`LICENSE`](LICENSE)). It uses or builds on the work below, each under its own license.

## Code

| Project | Use | License |
| --- | --- | --- |
| [Comfy-Org/comfy-cinematic-studio](https://github.com/Comfy-Org/comfy-cinematic-studio) | The app's structure is based on it | MIT |
| [@comfyorg/sdk](https://github.com/Comfy-Org/comfy-typescript-sdk) | Runs the ComfyUI workflows (Comfy Cloud or your own ComfyUI) | MIT |
| [Next.js](https://github.com/vercel/next.js) | App framework | MIT |
| [React](https://github.com/facebook/react) | Interface | MIT |
| [TypeScript](https://github.com/microsoft/TypeScript) | Development only | Apache-2.0 |

## Font

| Font | License |
| --- | --- |
| [Barlow Condensed](https://github.com/jpt/barlow) (`public/fonts/`) | SIL Open Font License 1.1 (`public/fonts/barlow-condensed-LICENSE.txt`) |

## Models

No model weights are included in this repository. You download them yourself (or run them on Comfy Cloud), and each keeps its own license. Read each model card before use, especially before commercial use.

| Model | Use in the app | License |
| --- | --- | --- |
| Qwen Image 2.1 (Qwen team) | Default for character sheets, outfits and storyboards | [Qwen Research License](https://huggingface.co/Qwen/Qwen-Image-2.1/blob/main/LICENSE): non-commercial (research and evaluation) unless you get a commercial license from Qwen |
| FLUX 3 Klein (Black Forest Labs) | Optional for sheets, outfits and storyboards | FLUX Kommunity License: see [bfl.ai/licensing](https://bfl.ai/licensing) |
| MOSS-Image and its edit LoRA (OpenMOSS) | Optional for sheets and outfits | Apache 2.0: see the [OpenMOSS model cards](https://huggingface.co/OpenMOSS-Team) |
| Qwen3.5 text model (Qwen team) | Optional storyboard shot planner | See its model card on [Hugging Face](https://huggingface.co/Qwen) |

ComfyUI and the Comfy SDK are made by Comfy Org. Character Studio is independent and is not an official Comfy product.
