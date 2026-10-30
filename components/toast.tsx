"use client";
import { useEffect, useState } from "react";
export function notifySuccess(message: string) { window.dispatchEvent(new CustomEvent("studio-toast", { detail: message })); }
export function ToastHost() {
  const [message, setMessage] = useState("");
  const [paused, setPaused] = useState(false);
  useEffect(() => { const receive = (event: Event) => setMessage((event as CustomEvent<string>).detail); window.addEventListener("studio-toast", receive); return () => window.removeEventListener("studio-toast", receive); }, []);
  useEffect(() => { if (!message || paused) return; const timer = setTimeout(() => setMessage(""), 6000); return () => clearTimeout(timer); }, [message, paused]);
  return <div className="toast-region" role="status" aria-live="polite">{message && <div className="studio-toast" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}><span aria-hidden="true">✓</span><p>{message}</p><button type="button" className="ghost" aria-label="Dismiss notification" onClick={() => setMessage("")}>×</button></div>}</div>;
}
