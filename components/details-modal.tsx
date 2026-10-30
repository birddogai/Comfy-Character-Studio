"use client";

import { CopyText, PromptDisclosure } from "./copy-text";
import { useEffect, useRef, useState, useId, type ReactNode } from "react";
import type { ChipGroup } from "../lib/details";

type Props = {
  image: string;
  title: string;
  groups: ChipGroup[];
  meta: { label: string; value: string }[];
  prompt?: string;
  description?: string;
  actions?: ReactNode;
  /** Smaller, less-used actions shown as links under the buttons. */
  more?: ReactNode;
  onClose: () => void;
  /** Arrow paddles and ← → keys to step through the list the pop-up was opened from. */
  onPrev?: () => void;
  onNext?: () => void;
  /** e.g. "3 of 12", shown next to the title. */
  position?: string;
  /** For an unsaved character sheet: name it and save it right here. */
  onSave?: (name: string) => Promise<void>;
};

const zoomSteps = [1, 1.5, 2, 3, 4];

/** The paddles for item `index` of `items`: no arrow past either end. */
export function steps<T>(items: readonly T[], index: number, go: (item: T) => void) {
  if (index < 0 || items.length < 2) return {};
  return {
    onPrev: index > 0 ? () => go(items[index - 1]) : undefined,
    onNext: index < items.length - 1 ? () => go(items[index + 1]) : undefined,
    position: `${index + 1} of ${items.length}`,
  };
}

// The large image on the left; the picks as chips, where and when it was made,
// and the full prompt on the right.
export function DetailsModal({ image, title, groups, meta, prompt, description, actions, more, onClose, onPrev, onNext, position, onSave }: Props) {
  const titleId=useId();
  // Zoom lives on the image itself (− Fit +, drag to move, double-click to
  // zoom in): the old "100%" button in the header was easy to miss.
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const inspector=useRef<HTMLDivElement>(null);
  useEffect(() => { setZoom(1); setPan({ x: 0, y: 0 }); setName(""); inspector.current?.scrollTo(0,0); }, [image]);
  const zoomTo = (next: number) => { setZoom(next); if (next === 1) setPan({ x: 0, y: 0 }); };
  const step = (dir: 1 | -1) => zoomTo(zoomSteps[Math.min(zoomSteps.length - 1, Math.max(0, zoomSteps.findIndex((z) => z >= zoom) + dir))]);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!onSave || !name.trim() || saving) return;
    setSaving(true);
    try { await onSave(name.trim()); } finally { setSaving(false); }
  }
  const dialog = useRef<HTMLDialogElement>(null);

  // No close() on cleanup: it fires onClose, and React's development mode
  // runs this effect twice, which shut the pop-up straight after opening.
  useEffect(() => {
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
    return () => { requestAnimationFrame(() => { if (!dialog.current?.open && trigger?.isConnected) trigger.focus({ preventScroll: true }); }); };
  }, []);

  // ← → step through the list, except while typing in a field.
  useEffect(() => {
    function key(event: KeyboardEvent) {
      const typing = event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
      if (typing) return;
      if (event.key === "ArrowLeft" && onPrev) { event.preventDefault(); onPrev(); }
      if (event.key === "ArrowRight" && onNext) { event.preventDefault(); onNext(); }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onPrev, onNext]);

  return (
    <dialog ref={dialog} className="details" aria-labelledby={titleId} onClose={onClose} onClick={(event) => { if (event.target === dialog.current) onClose(); }}>
      {/* The paddles sit outside the card, since the whole card changes (owner's note, Oct 27). */}
      {onPrev || onNext ? (onPrev ? <button type="button" className="paddle" onClick={onPrev} aria-label="Previous">‹</button> : <span className="paddle-space" />) : null}
      <div className="details-card viewer-card"><header className="viewer-header"><h2 id={titleId}>{title}</h2>{position && <span>{position}</span>}<button type="button" className="ghost small-button" onClick={onClose} aria-label="Close">✕</button></header>
      <div className={zoom > 1 ? "details-image zoomed" : "details-image"} tabIndex={0} aria-label="Image preview"
        onDoubleClick={() => zoomTo(zoom > 1 ? 1 : 2)}
        onPointerDown={(event) => { if (zoom === 1) return; event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, px: pan.x, py: pan.y }; }}
        onPointerMove={(event) => { const d = drag.current; if (d) setPan({ x: d.px + event.clientX - d.x, y: d.py + event.clientY - d.y }); }}
        onPointerUp={() => { drag.current = null; }}>
        <img src={image} alt={title} draggable={false} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }} />
        <div className="zoom-controls" onPointerDown={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()}>
          <button type="button" onClick={() => step(-1)} disabled={zoom === 1} aria-label="Zoom out">−</button>
          <button type="button" onClick={() => zoomTo(1)} disabled={zoom === 1} aria-label="Fit to view">{zoom === 1 ? "Fit" : `${Math.round(zoom * 100)}%`}</button>
          <button type="button" onClick={() => step(1)} disabled={zoom === zoomSteps.at(-1)} aria-label="Zoom in">+</button>
        </div>
      </div>
      <div className="details-info" ref={inspector}>
        {prompt && <PromptDisclosure text={prompt} />}
        <details open><summary>Details</summary>
        {!groups.length ? <p className="hint">No saved settings.</p>
          : groups.some((g) => g.section) ? (
            // Sections of chips, each folding away (Character, Hair, Body, Style, Extras).
            [...new Set(groups.map((g) => g.section ?? "Other"))].map((section) => (
              <details key={section} className="chip-section" open={section === "Character"}>
                <summary>{section}</summary>
                <div className="chips">
                  {groups.filter((g) => (g.section ?? "Other") === section).flatMap((g) => g.values.map((value) => (
                    <span key={`${g.label}-${value}`} className={value.length > 48 || ["Direction", "Outfit"].includes(section) ? "detail-prose" : "chip static"} title={g.label}>{value}</span>
                  )))}
                </div>
              </details>
            ))
          ) : groups.map((group) => (
            <details key={group.label} className="detail-group" open={!/^Frame/.test(group.label)}><summary>{group.label}</summary><div className="chips">{group.values.map((value) => <span key={value} className={value.length > 48 || ["What happens", "Where", "Product", "Edit"].includes(group.label) ? "detail-prose" : "chip static"}>{value}</span>)}</div></details>
          ))}
        </details><details><summary>Generation details</summary><dl className="meta">
          {meta.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}
        </dl>
        {description && <details><summary>Saved description</summary><CopyText text={description} label="Copy description" /></details>}
        </details>

      </div>
      {(actions || more || onSave) && <footer className="viewer-actions">
        {onSave && <form className="viewer-save" onSubmit={(event) => void save(event)}><input value={name} maxLength={40} onChange={(event) => setName(event.target.value)} placeholder="Name this character" aria-label="Character name" /><button type="submit" disabled={!name.trim() || saving}>{saving ? "Saving…" : "Save character"}</button></form>}
        {actions}{more && <details className="viewer-more"><summary>More actions</summary><div className="viewer-menu">{more}</div></details>}</footer>}
      </div>
      {onPrev || onNext ? (onNext ? <button type="button" className="paddle" onClick={onNext} aria-label="Next">›</button> : <span className="paddle-space" />) : null}
    </dialog>
  );
}
