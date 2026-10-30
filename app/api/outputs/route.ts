import { NextResponse } from "next/server";
import { toDataUrl } from "../../../lib/model-output";
import { listOutputs, moveOutput, readOutput, renameFolder, tidySheets } from "../../../lib/outputs";
import { isFolder } from "../../../lib/folders";

export const runtime = "nodejs";

// The outputs folder on this computer, read back so lost browser data can be
// restored. GET lists saved character sheets; GET ?file=… returns one image.
export async function GET(request: Request) {
  const file = new URL(request.url).searchParams.get("file");
  if (file) {
    try {
      const saved = await readOutput(file);
      if (!saved) return NextResponse.json({ error: "Not a saved output." }, { status: 400 });
      return NextResponse.json({ image: toDataUrl(saved.bytes, saved.contentType) });
    } catch {
      return NextResponse.json({ error: "That file is gone." }, { status: 404 });
    }
  }
  return NextResponse.json({ sheets: await listOutputs("sheet") });
}

// Keeps character folders in step with the library: move a sheet in when its
// character is saved, rename the folder when the character is renamed, and
// tidy older characters' sheets out of the date folders.
export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    if (process.env.SAVE_OUTPUTS === "false") return NextResponse.json({ ok: true });
    const move = body.move as { file?: unknown; folder?: unknown } | undefined;
    if (move && typeof move.file === "string" && isFolder(move.folder)) return NextResponse.json({ file: await moveOutput(move.file, move.folder) });
    const rename = body.rename as { from?: unknown; to?: unknown } | undefined;
    if (rename && isFolder(rename.from) && isFolder(rename.to)) { await renameFolder(rename.from, rename.to); return NextResponse.json({ ok: true }); }
    if (Array.isArray(body.tidy)) {
      const list = body.tidy.slice(0, 500).map((c) => c as { folder?: unknown; prompt?: unknown })
        .filter((c): c is { folder: string; prompt: string } => isFolder(c.folder) && typeof c.prompt === "string");
      return NextResponse.json({ moved: await tidySheets(list) });
    }
    return NextResponse.json({ error: "Nothing to do." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update the outputs folder." }, { status: 500 });
  }
}
