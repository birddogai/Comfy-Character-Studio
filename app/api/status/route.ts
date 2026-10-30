import { NextResponse } from "next/server";
import { where } from "../../../lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A setup check the page runs when it opens, so a first-time user sees what's
// missing before pressing Generate. Never returns the key itself.
export async function GET() {
  const w = where();
  if (w.local) {
    // Own ComfyUI: is the proxy answering at all?
    let reachable = false;
    try {
      const response = await fetch(w.baseUrl!, { signal: AbortSignal.timeout(2500) });
      reachable = response.status < 500;
    } catch { reachable = false; }
    return NextResponse.json({ mode: "local", ready: reachable, baseUrl: w.baseUrl, reachable });
  }
  const hasKey = Boolean(process.env.COMFY_API_KEY?.trim());
  return NextResponse.json({ mode: "cloud", ready: hasKey, hasKey });
}
