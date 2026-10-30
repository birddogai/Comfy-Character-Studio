// One real run per route, in the order the app uses them. USES CREDITS:
// 2 image runs on the default open models (a few credits each).
//
//   npm run dev            (in one terminal, with COMFY_API_KEY set)
//   npm run smoke          (in another)
//
// Each result is saved in outputs/smoke/ (git-ignored) with the prompt and
// Router request ID, so surprises in the response shape can be traced.
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.STUDIO_URL ?? "http://127.0.0.1:3000";
const out = new URL("../outputs/smoke/", import.meta.url);
await mkdir(out, { recursive: true });

async function call(route, body) {
  const started = Date.now();
  const response = await fetch(`${base}/api/${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  const type = response.headers.get("content-type") ?? "";
  if (!response.ok) {
    const error = type.includes("json") ? (await response.json()).error : await response.text();
    throw new Error(`${route} failed (${response.status}, ${seconds}s): ${error}`);
  }
  console.log(`✓ ${route} in ${seconds}s`);
  return { response, type };
}

async function image(route, body) {
  const { response } = await call(route, body);
  const json = await response.json();
  const [, ext, data] = /^data:image\/(\w+);base64,(.*)$/.exec(json.image);
  await writeFile(new URL(`${route}.${ext}`, out), Buffer.from(data, "base64"));
  await writeFile(new URL(`${route}.json`, out), JSON.stringify({ prompt: json.prompt, description: json.description, requestId: json.requestId }, null, 2));
  return json;
}

const { defaultSelection } = await import("../lib/character.ts");
const { defaultShot } = await import("../lib/shoot.ts");

const { image: sheet, description } = await image("character", { selection: defaultSelection });
await image("photoshoot", { references: [sheet], shot: defaultShot, character: description });

console.log(`Both routes worked. Results in ${out.pathname}`);
