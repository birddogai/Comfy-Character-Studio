"use client";
import { useEffect, useRef, useState } from "react";
type Request = { message: string; action?: () => Promise<void>; resolve: (answer: boolean) => void };
const eventName = "studio-confirm";
export function confirmAction(message: string, action?: () => Promise<void>): Promise<boolean> {
  return new Promise(resolve => window.dispatchEvent(new CustomEvent<Request>(eventName, { detail: { message, action, resolve } })));
}
export function ConfirmationHost() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const running = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const active = useRef<Request | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const [request, setRequest] = useState<Request | null>(null);
  async function finish(answer: boolean) {
    if (running.current) return;
    if (answer && active.current?.action) {
      running.current = true; setBusy(true); setError("");
      try { await active.current.action(); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "Could not complete this action. Try again."); return; }
      finally { running.current = false; setBusy(false); }
    }
    const pending = active.current; active.current = null;
    dialog.current?.close(); setRequest(null); pending?.resolve(answer);
    trigger.current?.focus();
  }
  useEffect(() => {
    const receive = (event: Event) => {
      const next = (event as CustomEvent<Request>).detail;
      if (active.current) { next.resolve(false); return; }
      trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      active.current = next; setError(""); setRequest(next);
    };
    window.addEventListener(eventName, receive);
    return () => { window.removeEventListener(eventName, receive); active.current?.resolve(false); active.current = null; };
  }, []);
  useEffect(() => { if (request) { dialog.current?.showModal(); cancel.current?.focus(); } }, [request]);
  const destructive = /^Delete/i.test(request?.message ?? "");
  return <dialog ref={dialog} className="confirm-dialog" aria-labelledby="confirm-title" aria-describedby="confirm-message" onCancel={event => { event.preventDefault(); finish(false); }}>
    <h2 id="confirm-title">{destructive ? "Confirm deletion" : "Confirm change"}</h2>
    <p id="confirm-message">{request?.message}</p>
    {error && <p role="alert" className="status error">{error}</p>}
    <div className="confirm-actions"><button ref={cancel} disabled={busy} type="button" className="ghost" onClick={() => finish(false)}>Cancel</button><button disabled={busy} type="button" className={destructive ? "confirm-delete" : ""} onClick={() => finish(true)}>{busy ? "Working…" : destructive ? "Delete" : "Continue"}</button></div>
  </dialog>;
}
