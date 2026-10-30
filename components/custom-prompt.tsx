"use client";
import { confirmAction } from "./confirmation";

import { CopyButton } from "./copy-text";

export function CustomPrompt({ value, onChange, generated, disabled }: { value: string; onChange: (value: string) => void; generated: string; disabled?: boolean }) {
  const active = Boolean(value.trim());
  return <details className={`settings-section custom-prompt${active ? " has-override" : ""}`}>
    <summary>Custom prompt (optional){active ? " · active" : ""}</summary>
    <div className="settings-stack">
      <p className="hint">Replaces the generated prompt. References and image dimensions still apply.</p>
      <textarea aria-label="Custom prompt" value={value} maxLength={20000} rows={7} disabled={disabled} onChange={(event) => onChange(event.target.value)} placeholder="Paste your prompt…" />
      <div className="prompt-tools">
        <button type="button" className="ghost small-button" disabled={disabled || !generated} onClick={async () => { if (!active || await confirmAction("Replace your custom prompt with the generated prompt?")) onChange(generated); }}>Start from generated prompt</button>
        {active && <><CopyButton text={value} label="Copy custom prompt" /><button type="button" className="link" disabled={disabled} onClick={async () => { if (await confirmAction("Clear your custom prompt and return to generated text?")) onChange(""); }}>Reset</button></>}
      </div>
    </div>
  </details>;
}
