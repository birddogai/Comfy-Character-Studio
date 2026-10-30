"use client";

import { useEffect, useState } from "react";

// Text with a copy icon (two overlapping squares) that shows on hover or
// focus, wherever a prompt appears (the owner's note, Oct 29).
export function CopyButton({ text, label = "Copy prompt" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => setCopied(false), [text]);
  async function copy() {
    try { await navigator.clipboard.writeText(text); setCopied(true); setFailed(false); setTimeout(() => setCopied(false), 1500); } catch { setCopied(false); setFailed(true); }
  }
  return (
    <span className="copy-control">
      <button type="button" className="copy-icon" onClick={() => void copy()} aria-label={copied ? "Copied" : label} title={copied ? "Copied" : label}>
        {copied ? (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
        )}
      </button>
      <span className="sr-only" role="status">{copied ? "Copied" : failed ? "Copy failed. Select the text to copy it manually." : ""}</span>
    </span>
  );
}

export function CopyText({ text, className, label }: { text: string; className?: string; label?: string }) {
  return <div className={`copy-text${className ? ` ${className}` : ""}`}><p>{text}</p><CopyButton text={text} label={label} /></div>;
}

export function PromptDisclosure({ text }: { text: string }) {
  return <div className="prompt-disclosure"><details><summary>Prompt</summary><p className="prompt-content">{text}</p></details><CopyButton text={text} /></div>;
}
