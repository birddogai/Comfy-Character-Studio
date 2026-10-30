// Writes the studio's ComfyUI workflows to workflows/*.json: `npm run workflows`.
import { mkdir, writeFile } from "node:fs/promises";
import { workflowFiles, workflowJson } from "../lib/workflow-exports.ts";

const dir = new URL("../workflows/", import.meta.url);
await mkdir(dir, { recursive: true });
for (const w of workflowFiles) await writeFile(new URL(w.file, dir), workflowJson(w));
console.log(`Wrote ${workflowFiles.length} workflows to workflows/`);
