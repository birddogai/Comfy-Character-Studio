import { mkdir, readdir, readFile, rename, rmdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { isFolder } from "./folders.ts";

// Every paid result is also written to disk, so it survives a cleared browser,
// a different address (localhost vs 127.0.0.1) or a crashed tab:
//   outputs/2026-10-19/14-32-05-sheet-<request id>.jpg  (+ .json with the prompt and picks)
// Results for a saved character go in its own folder instead (lib/folders.ts):
//   outputs/characters/Nax-3f2a/2026-10-19_14-32-05-outfit-<request id>.jpg
// OUTPUT_DIR moves the folder; SAVE_OUTPUTS=false turns it off (e.g. on a host
// with a read-only disk). A failed write never fails the run itself.
const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "video/mp4": "mp4" };

export function outputName(kind: string, requestId: string, contentType: string | null, now = new Date()) {
  const type = contentType?.split(";")[0].trim() ?? "";
  const ext = extensions[type] ?? (type.startsWith("video/") ? "mp4" : "jpg");
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const id = requestId.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 12) || "run";
  return { folder: day, file: `${time}-${kind}-${id}`, ext };
}

export function outputDir() {
  // The comment stops the bundler from scanning the whole project for this path.
  return process.env.OUTPUT_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), "outputs");
}

/**
 * Writes the image and its .json. With a character folder the file goes
 * there (its name starts with the date); otherwise into today's folder.
 * Returns the image's place inside the outputs folder, or nothing if not saved.
 */
export async function saveOutput(kind: string, result: { bytes: Uint8Array; contentType: string | null; requestId: string }, details: Record<string, unknown>, characterFolder?: string): Promise<string | undefined> {
  if (process.env.SAVE_OUTPUTS === "false") return;
  try {
    const named = outputName(kind, result.requestId, result.contentType);
    const folder = characterFolder && isFolder(characterFolder) ? characterFolder : named.folder;
    const file = folder === named.folder ? named.file : `${named.folder}_${named.file}`;
    const { ext } = named;
    // The comment stops the bundler from scanning the whole project for this path.
    const dir = path.join(/* turbopackIgnore: true */ outputDir(), folder);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(/* turbopackIgnore: true */ dir, `${file}.${ext}`), result.bytes);
    await writeFile(path.join(/* turbopackIgnore: true */ dir, `${file}.json`), JSON.stringify({ kind, requestId: result.requestId, createdAt: new Date().toISOString(), ...details }, null, 2));
    return `${folder}/${file}.${ext}`;
  } catch (error) {
    console.warn(`Could not save the ${kind} to the outputs folder:`, error);
  }
}

/** A saved file's place inside the outputs folder: "2026-10-22/10-05-33-sheet-abc.png" or "characters/Nax-3f2a/2026-10-22_10-05-33-sheet-abc.png". */
export const outputPath = /^(\d{4}-\d{2}-\d{2}|characters\/[\w -]{1,60})\/[\w-]+\.(png|jpg|webp)$/;

export type SavedOutput = { path: string; details: Record<string, unknown> };

/** Every saved result of one kind (e.g. "sheet"), with its .json details, newest first. */
export async function listOutputs(kind: string): Promise<SavedOutput[]> {
  const root = outputDir();
  const found: SavedOutput[] = [];
  let days: string[] = [];
  try { days = (await readdir(root)).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)); } catch { return []; }
  // Character folders are read the same way as date folders.
  try { days.push(...(await readdir(path.join(/* turbopackIgnore: true */ root, "characters"))).map((d) => `characters/${d}`).filter(isFolder)); } catch { /* none yet */ }
  for (const day of days) {
    const files = await readdir(path.join(/* turbopackIgnore: true */ root, day));
    for (const file of files.filter((f) => f.endsWith(".json") && f.includes(`-${kind}-`))) {
      const base = file.slice(0, -5);
      const image = files.find((f) => f.startsWith(`${base}.`) && /\.(png|jpg|webp)$/.test(f));
      if (!image) continue;
      try {
        const details = JSON.parse(await readFile(path.join(/* turbopackIgnore: true */ root, day, file), "utf8")) as Record<string, unknown>;
        if (details.kind === kind) found.push({ path: `${day}/${image}`, details });
      } catch { /* a broken .json is skipped, not fatal */ }
    }
  }
  return found.sort((a, b) => String(b.details.createdAt).localeCompare(String(a.details.createdAt)));
}

/** One saved image, only from inside the outputs folder. */
export async function readOutput(file: string) {
  if (!outputPath.test(file) || file.includes("..")) return undefined;
  const ext = file.split(".").pop()!;
  const bytes = await readFile(path.join(/* turbopackIgnore: true */ outputDir(), file));
  return { bytes, contentType: ext === "jpg" ? "image/jpeg" : `image/${ext}` };
}

/** Moves one saved image and its .json into a character folder; returns its new place. */
export async function moveOutput(file: string, folder: string) {
  if (!outputPath.test(file) || file.includes("..") || !isFolder(folder)) throw new Error("Not a saved output or character folder.");
  const root = outputDir();
  const [from, name] = [file.slice(0, file.lastIndexOf("/")), file.slice(file.lastIndexOf("/") + 1)];
  if (from === folder) return file;
  const base = name.slice(0, name.lastIndexOf("."));
  // Date folders don't put the date in the file name, so add it when moving.
  const target = /^\d{4}-\d{2}-\d{2}$/.test(from) ? `${from}_${base}` : base;
  await mkdir(path.join(/* turbopackIgnore: true */ root, folder), { recursive: true });
  for (const ext of [name.slice(name.lastIndexOf(".") + 1), "json"]) {
    try { await rename(path.join(/* turbopackIgnore: true */ root, from, `${base}.${ext}`), path.join(/* turbopackIgnore: true */ root, folder, `${target}.${ext}`)); }
    catch (error) { if (ext !== "json") throw error; }
  }
  return `${folder}/${target}.${name.slice(name.lastIndexOf(".") + 1)}`;
}

/** Renames a character's folder (after the character is renamed), merging into the new one if it exists. */
export async function renameFolder(from: string, to: string) {
  if (!isFolder(from) || !isFolder(to) || from === to) return;
  const root = outputDir();
  let files: string[] = [];
  try { files = await readdir(path.join(/* turbopackIgnore: true */ root, from)); } catch { return; }
  await mkdir(path.join(/* turbopackIgnore: true */ root, to), { recursive: true });
  for (const file of files) await rename(path.join(/* turbopackIgnore: true */ root, from, file), path.join(/* turbopackIgnore: true */ root, to, file));
  await rmdir(path.join(/* turbopackIgnore: true */ root, from)).catch(() => undefined);
}

/**
 * For characters saved before character folders existed: finds their sheet in
 * the date folders by its prompt and moves it into their folder. Outfits and
 * scenes made back then have no character in their .json, so they stay put.
 */
export async function tidySheets(characters: { folder: string; prompt: string }[]) {
  const sheets = (await listOutputs("sheet")).filter((s) => /^\d{4}-\d{2}-\d{2}\//.test(s.path));
  let moved = 0;
  for (const { folder, prompt } of characters) {
    if (!prompt || !isFolder(folder)) continue;
    for (const sheet of sheets.filter((s) => s.details.prompt === prompt)) { await moveOutput(sheet.path, folder); moved++; }
  }
  return moved;
}
