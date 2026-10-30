# Setting up Character Studio (for AI coding agents)

Follow these steps in order to install and start the app for the person you are helping. They may not be a programmer: explain what you do in plain words, and stop to ask when a step needs a choice from them.

## Rules

- The Comfy API key is a secret. Ask for it, write it only to `.env.local`, and never print it, log it or commit it.
- Generating images costs Comfy credits. Don't run a generation (or `npm run smoke`) unless the person asks.
- Don't change the app's code during setup. If a step fails, report the error and the fix from the table below.

## 1. Check the tools

- Node.js **22.6 or newer**: `node --version`. If missing or older, ask the person to install it from https://nodejs.org/ (the LTS version), then continue.
- Git: `git --version`.

## 2. Get the code

```sh
git clone https://github.com/birddogai/Comfy-Character-Studio.git
cd Comfy-Character-Studio
```

(Skip this if you are already inside the repo.)

## 3. Choose where the models run

Ask the person which they want:

- **Comfy Cloud (easiest):** they need a Comfy account with an API key from https://platform.comfy.org/profile/api-keys and credits on it. Running open models on Comfy Cloud needs an active subscription.
- **Their own ComfyUI (free, needs a strong NVIDIA GPU):** ComfyUI with the model files listed in `README.md` ("Models for your own ComfyUI"), running behind [comfy-api-proxy](https://github.com/Comfy-Org/comfy-api-proxy).

Then create the settings file:

```sh
cp .env.example .env.local
```

- Comfy Cloud: set `COMFY_API_KEY=<their key>` in `.env.local` (no quotes, no spaces).
- Own ComfyUI: set `COMFY_BASE_URL` to the proxy's address, e.g. `COMFY_BASE_URL=http://127.0.0.1:8189`, and leave `COMFY_API_KEY` empty.

## 4. Install and check

```sh
npm ci
npm test
```

`npm test` runs offline (no credits) and should end with every test passing and no TypeScript errors.

## 5. Start the app

```sh
npm run dev
```

Tell the person to open http://localhost:3000. A banner at the top says if the key or ComfyUI connection is wrong. Leave the command running while they use the app; stopping it (Ctrl+C) stops the app.

## 6. First run (their choice)

Suggest: **Create** → pick a few tiles → **Generate** (Qwen Image 2.1 is the default). Results are saved in the browser and in the `outputs/` folder.

## If something fails

| Error | Fix |
| --- | --- |
| `npm ci` or `npm test` warns about the Node version or fails on `--experimental-strip-types` | Node is too old: install Node 22.6+ and retry. |
| "The app has no Comfy API key" | Put the key in `.env.local` as `COMFY_API_KEY=…`, then restart `npm run dev`. |
| "Comfy refused the API key" | The key was mistyped or deleted: paste it again and restart. |
| "Out of credits" / "Isn't allowed to run this yet" | The Comfy account needs credits or a subscription (platform.comfy.org). |
| "Couldn't reach your ComfyUI" | Start ComfyUI and comfy-api-proxy; check `COMFY_BASE_URL`. |
| "A model file the app needs isn't installed" | Download the files in README.md with the exact names into the ComfyUI `models/` folders, restart ComfyUI. |
| Port 3000 in use | Stop the other app, or run `npm run dev -- --port 3001` and open that port. |

## Working on the code afterward

Prompts and options are plain data in `lib/` (see "Make a change" in README.md). Run `npm test` and `npm run build` after any change.
