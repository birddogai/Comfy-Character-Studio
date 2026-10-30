"use client";

import { useEffect, useState } from "react";

type Status = { mode: "cloud" | "local"; ready: boolean; hasKey?: boolean; baseUrl?: string; reachable?: boolean };

// Shown only when the app can't make images yet, with the exact next step.
export function SetupBanner() {
  const [status, setStatus] = useState<Status>();
  useEffect(() => {
    fetch("/api/status").then((r) => r.json() as Promise<Status>).then(setStatus).catch(() => undefined);
  }, []);
  if (!status || status.ready) return null;
  return (
    <section className="setup-banner" role="alert">
      {status.mode === "cloud" ? (
        <>
          <strong>One step before you can make images: add a Comfy API key.</strong>
          <ol>
            <li>Sign in at <a href="https://platform.comfy.org/profile/api-keys" target="_blank" rel="noreferrer">platform.comfy.org</a> and create an API key.</li>
            <li>Open the <code>.env.local</code> file in this project (copy <code>.env.example</code> if it isn&apos;t there) and paste it after <code>COMFY_API_KEY=</code>.</li>
            <li>Stop the app (Ctrl+C in the terminal) and start it again with <code>npm run dev</code>.</li>
          </ol>
          <p className="hint">Running your own ComfyUI instead? Set <code>COMFY_BASE_URL</code> in <code>.env.local</code> (see the README).</p>
        </>
      ) : (
        <>
          <strong>Can&apos;t reach your ComfyUI at {status.baseUrl}.</strong>
          <ol>
            <li>Start ComfyUI, then start <a href="https://github.com/Comfy-Org/comfy-api-proxy" target="_blank" rel="noreferrer">comfy-api-proxy</a> in front of it.</li>
            <li>Check that <code>COMFY_BASE_URL</code> in <code>.env.local</code> is the proxy&apos;s address, then restart <code>npm run dev</code>.</li>
          </ol>
        </>
      )}
    </section>
  );
}
