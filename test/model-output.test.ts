import assert from "node:assert/strict";
import test from "node:test";
import { base64Image, imageList, toDataUrl } from "../lib/model-output.ts";

test("strips data URLs to their base64 part", () => {
  assert.equal(base64Image("data:image/png;base64,iVBORw0KGgo="), "iVBORw0KGgo=");
  assert.equal(base64Image("data:image/svg+xml;base64,PHN2Zz4="), undefined);
  assert.equal(base64Image("https://example.com/a.png"), undefined);
  assert.equal(base64Image(42), undefined);
});

test("image lists must be non-empty, capped and all valid", () => {
  const ok = "data:image/jpeg;base64,/9j/4AAQ";
  assert.deepEqual(imageList([ok, ok], 4), ["/9j/4AAQ", "/9j/4AAQ"]);
  assert.equal(imageList([], 4), undefined);
  assert.equal(imageList([ok, ok, ok, ok, ok], 4), undefined);
  assert.equal(imageList([ok, "nope"], 4), undefined);
});

test("downloaded bytes become a data URL with a safe image type", () => {
  assert.equal(toDataUrl(new Uint8Array([1, 2, 3]), "image/png; charset=binary"), "data:image/png;base64,AQID");
  assert.equal(toDataUrl(new Uint8Array([1, 2, 3]), "text/html"), "data:image/jpeg;base64,AQID");
});

test("saved files get a dated folder, a readable name and the right extension", async () => {
  const { outputName } = await import("../lib/outputs.ts");
  const when = new Date(2026, 9, 19, 14, 3, 5);
  assert.deepEqual(outputName("sheet", "abc-123/../x", "image/jpeg", when), { folder: "2026-10-19", file: "14-03-05-sheet-abc-123x", ext: "jpg" });
  assert.equal(outputName("video", "id", "video/mp4; codecs=avc1", when).ext, "mp4");
  assert.equal(outputName("photo", "", null, when).file, "14-03-05-photo-run");
});

test("a result and its details are written to the outputs folder", async () => {
  const { mkdtemp, readdir, readFile } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const path = await import("node:path");
  const { saveOutput } = await import("../lib/outputs.ts");
  const dir = await mkdtemp(path.join(tmpdir(), "outputs-"));
  process.env.OUTPUT_DIR = dir;
  await saveOutput("photo", { bytes: new Uint8Array([1, 2, 3]), contentType: "image/png", requestId: "req1" }, { prompt: "hello" });
  delete process.env.OUTPUT_DIR;
  const [day] = await readdir(dir);
  const files = (await readdir(path.join(dir, day))).sort();
  assert.equal(files.length, 2);
  assert.ok(files[0].endsWith("-photo-req1.json") && files[1].endsWith("-photo-req1.png"));
  assert.equal(JSON.parse(await readFile(path.join(dir, day, files[0]), "utf8")).prompt, "hello");
});

test("saved characters get their own outputs folder: save into it, move a sheet in, rename it, tidy old sheets", async () => {
  const { mkdtemp, readdir } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const path = await import("node:path");
  const { characterFolder, isFolder } = await import("../lib/folders.ts");
  const { saveOutput, moveOutput, renameFolder, tidySheets, listOutputs, readOutput } = await import("../lib/outputs.ts");
  assert.equal(characterFolder("Nax", "3f2a9c-…"), "characters/Nax-3f2a");
  assert.equal(characterFolder("../../etc/passwd", "ab"), "characters/etcpasswd-ab");
  assert.equal(characterFolder("Möth  2!", "x1y2z3"), "characters/Moth 2-x1y2");
  assert.equal(isFolder("characters/../secrets"), false);
  assert.equal(isFolder("2026-10-22"), false);

  const dir = await mkdtemp(path.join(tmpdir(), "outputs-"));
  process.env.OUTPUT_DIR = dir;
  try {
    const result = { bytes: new Uint8Array([1, 2, 3]), contentType: "image/png" };
    const sheet = await saveOutput("sheet", { ...result, requestId: "s1" }, { prompt: "an axolotl" });
    assert.ok(sheet && /^\d{4}-\d{2}-\d{2}\/[\d-]+-sheet-s1\.png$/.test(sheet));
    const folder = characterFolder("Nax", "3f2a");
    const moved = await moveOutput(sheet, folder);
    assert.ok(moved.startsWith("characters/Nax-3f2a/") && /\/\d{4}-\d{2}-\d{2}_[\d-]+-sheet-s1\.png$/.test(moved));
    assert.ok(await readOutput(moved));
    const outfit = await saveOutput("outfit", { ...result, requestId: "o1" }, { prompt: "a suit" }, folder);
    assert.ok(outfit?.startsWith("characters/Nax-3f2a/") && outfit.includes("-outfit-o1.png"));
    assert.equal((await readdir(path.join(dir, folder))).length, 4);
    // A sheet in a character folder still shows up for "Bring back".
    assert.ok((await listOutputs("sheet")).some((s) => s.path === moved));

    await renameFolder(folder, characterFolder("Naxxy", "3f2a"));
    assert.equal((await readdir(path.join(dir, "characters"))).join(), "Naxxy-3f2a");

    const old = await saveOutput("sheet", { ...result, requestId: "s2" }, { prompt: "an opossum" });
    assert.equal(await tidySheets([{ folder: characterFolder("Possum", "9z9z"), prompt: "an opossum" }]), 1);
    assert.ok(!(await listOutputs("sheet")).some((s) => s.path === old));
    await assert.rejects(moveOutput("../x.png", folder));
  } finally {
    delete process.env.OUTPUT_DIR;
  }
});
