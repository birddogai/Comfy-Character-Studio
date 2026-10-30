# Character Studio: notes for AI coding agents

Open-source AI character studio. Open-weight image models (Qwen Image 2.1, FLUX 3 Klein, MOSS-Image) run as ComfyUI workflows on Comfy Cloud or your own ComfyUI through the Comfy SDK. No closed APIs.

- Setting the app up for someone: follow `SETUP.md`.
- Next.js app. Structure: `app/api/*/route.ts` (server routes), `components/` (UI), `lib/` (prompts, options, workflows), `test/`.
- Recipes and options are plain data in `lib/`. Keep prompt building there so `test/` can cover it without network calls.
- Run `npm test` (node tests + `tsc`) and `npm run build` before committing. `npm run workflows` after changing `lib/workflows.ts`.
- Real generations cost Comfy credits: ask before running one. Never commit `.env.local` or print the API key.

## Branding, design system and languages

Before changing site branding, design tokens or UI language, read `docs/design-system.md` and `docs/rebranding-and-localization.md`. Keep user content, model prompts and stored identifiers separate from translated display labels. UI checks: `docs/ui-validation.md`.

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.
