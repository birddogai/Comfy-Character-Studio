"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { cropAround } from "../lib/edit";
import { postJson, type ImageResult } from "./client-api";
import { Pending } from "./pending";
import { ModelSeed, useGen, takeSeed, type Gen } from "./model-seed";

export type EditResult = { image: string; prompt: string; model: Gen["model"]; seed?: number; instruction: string };

type Box = { x: number; y: number; width: number; height: number };
type Mode = "box" | "paint";

// Click an image, box or paint over what to change, and say what it becomes.
// A close crop around the mark goes to the model (small areas like a mouth
// get enough pixels to change), and only the marked part is pasted back:
// everything outside it stays exactly as it was.
export function EditModal({ image, title, folder, onClose, onSave }: { image: string; title: string; /** The character's outputs folder, so the edit is saved there. */ folder?: string; onClose: () => void; onSave: (result: EditResult) => Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const mask = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>();
  const [mode, setMode] = useState<Mode>("box");
  const [brush, setBrush] = useState(40);
  const [box, setBox] = useState<Box>();
  const [painted, setPainted] = useState<Box>();
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [instruction, setInstruction] = useState("");
  const [gen, setGen] = useGen("edit");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<EditResult>();
  const [showBefore, setShowBefore] = useState(false);
  const [message, setMessage] = useState("Draw a box (or switch to Paint) over the part to change.");

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
    const img = new Image();
    img.onload = () => {
      setSize({ width: img.naturalWidth, height: img.naturalHeight });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      mask.current = canvas;
    };
    img.src = image;
  }, [image]);

  const region = mode === "box" ? box : painted;

  // Redraw the purple overlay: the box outline, or the painted strokes.
  useEffect(() => {
    const canvas = overlay.current;
    if (!canvas || !size) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (mode === "paint" && mask.current) {
      ctx.globalAlpha = .45;
      ctx.drawImage(mask.current, 0, 0);
      ctx.globalAlpha = 1;
    } else if (box) {
      ctx.fillStyle = "rgba(194,165,255,.25)";
      ctx.strokeStyle = "#c2a5ff";
      ctx.lineWidth = Math.max(2, size.width / 400);
      ctx.fillRect(box.x, box.y, box.width, box.height);
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    }
  });

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = size!.width / rect.width;
    return { x: Math.round((event.clientX - rect.left) * scale), y: Math.round((event.clientY - rect.top) * (size!.height / rect.height)), scale };
  }

  function paintAt(x: number, y: number, radius: number) {
    const ctx = mask.current!.getContext("2d")!;
    ctx.fillStyle = "#c2a5ff";
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    setPainted((prev) => {
      const left = Math.max(0, x - radius), top = Math.max(0, y - radius);
      const right = Math.min(size!.width, x + radius), bottom = Math.min(size!.height, y + radius);
      if (!prev) return { x: left, y: top, width: right - left, height: bottom - top };
      const x0 = Math.min(prev.x, left), y0 = Math.min(prev.y, top);
      return { x: x0, y: y0, width: Math.max(prev.x + prev.width, right) - x0, height: Math.max(prev.y + prev.height, bottom) - y0 };
    });
  }

  function down(event: PointerEvent<HTMLCanvasElement>) {
    if (!size || busy || result) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const { x, y, scale } = point(event);
    drag.current = { x, y };
    if (mode === "paint") paintAt(x, y, brush * scale / 2);
    else setBox({ x, y, width: 0, height: 0 });
  }

  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (!drag.current || !size) return;
    const { x, y, scale } = point(event);
    if (mode === "paint") return paintAt(x, y, brush * scale / 2);
    const start = drag.current;
    const cx = Math.min(Math.max(x, 0), size.width), cy = Math.min(Math.max(y, 0), size.height);
    setBox({ x: Math.min(start.x, cx), y: Math.min(start.y, cy), width: Math.abs(cx - start.x), height: Math.abs(cy - start.y) });
  }

  function clear() {
    setBox(undefined); setPainted(undefined); setResult(undefined);
    mask.current?.getContext("2d")!.clearRect(0, 0, mask.current.width, mask.current.height);
  }

  async function run() {
    if (!size || !region || region.width < 8 || region.height < 8) return setMessage("Mark a bigger area first.");
    if (!instruction.trim()) return setMessage("Say what the marked area should become.");
    const [seed, nextGen] = takeSeed(gen);
    setBusy(true); setMessage("Editing… this takes about half a minute.");
    try {
      const crop = cropAround(region, size);
      const response = await postJson<ImageResult & { model: Gen["model"]; seed?: number }>("/api/edit", { image: await cut(image, crop), size: { width: crop.width, height: crop.height }, instruction, model: gen.model, seed, ...(folder ? { folder } : {}) });
      const merged = await pasteBack(image, response.image, size, crop, mode === "box" ? box! : mask.current!);
      setResult({ image: merged, prompt: response.prompt, model: response.model, seed: response.seed, instruction });
      setGen(nextGen);
      setMessage("Done. Keep it, or change the words or seed and try again.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "The edit failed.");
    } finally { setBusy(false); }
  }

  async function keep() {
    if (!result) return;
    setBusy(true);
    try { await onSave(result); onClose(); } finally { setBusy(false); }
  }

  const shown = result && !showBefore ? result.image : image;
  return (
    <dialog ref={dialog} className="details edit" onClose={onClose}>
      <div className="details-image">
        <div className="edit-stage">
          <img src={shown} alt={title} />
          {busy && <div className="edit-busy"><Pending ratio={`${size?.width ?? 1}:${size?.height ?? 1}`} label="Editing…" fill /></div>}
          {size && !result && (
            <canvas ref={overlay} width={size.width} height={size.height} className={`edit-canvas ${mode}`}
              onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} />
          )}
        </div>
      </div>
      <div className="details-info">
        <div className="details-head">
          <h2>Edit · {title}</h2>
          <button type="button" className="link" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="segmented" role="radiogroup" aria-label="How to mark the area">
          {(["box", "paint"] as const).map((m) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? "active" : ""} disabled={busy || Boolean(result)} onClick={() => setMode(m)}>{m === "box" ? "Box" : "Paint"}</button>
          ))}
        </div>
        {mode === "paint" && (
          <label className="field">Brush size
            <input type="range" min={10} max={120} value={brush} onChange={(event) => setBrush(Number(event.target.value))} />
          </label>
        )}
        <label className="field">What should it become?
          <textarea value={instruction} maxLength={400} disabled={busy} onChange={(event) => setInstruction(event.target.value)} placeholder="Heart-shaped pink sunglasses… / wings come out through the jacket…" />
        </label>
        <ModelSeed task="edit" value={gen} onChange={setGen} disabled={busy} />
        <p className="status" role="status">{message}</p>
        <div className="details-actions">
          {result ? (
            <>
              <button type="button" disabled={busy} onClick={() => void keep()}>Keep this edit</button>
              <button type="button" className="ghost" disabled={busy} onClick={() => setResult(undefined)}>Try again</button>
            </>
          ) : (
            <button type="button" disabled={busy || !region || !instruction.trim()} onClick={() => void run()}>{busy ? "Editing…" : "Edit this area →"}</button>
          )}
        </div>
        <div className="details-more">
          {result && <button type="button" className="link" onMouseDown={() => setShowBefore(true)} onMouseUp={() => setShowBefore(false)} onMouseLeave={() => setShowBefore(false)}>Hold to see before</button>}
          <button type="button" className="link" disabled={busy} onClick={clear}>Clear marks</button>
        </div>
      </div>
    </dialog>
  );
}

function load(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read the edited image."));
    img.src = src;
  });
}

// The crop to send, as a PNG data URL.
async function cut(src: string, crop: Box) {
  const img = await load(src);
  const canvas = document.createElement("canvas");
  canvas.width = crop.width; canvas.height = crop.height;
  canvas.getContext("2d")!.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  return canvas.toDataURL("image/png");
}

// Original everywhere, the edited crop only inside the marked area, with a soft edge.
async function pasteBack(original: string, edited: string, size: { width: number; height: number }, crop: Box, area: Box | HTMLCanvasElement) {
  const [before, after] = await Promise.all([load(original), load(edited)]);
  const feather = Math.max(4, Math.round(size.width / 150));
  const out = document.createElement("canvas");
  out.width = size.width; out.height = size.height;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(before, 0, 0);

  const layer = document.createElement("canvas");
  layer.width = size.width; layer.height = size.height;
  const lctx = layer.getContext("2d")!;
  lctx.filter = `blur(${feather}px)`;
  if (area instanceof HTMLCanvasElement) lctx.drawImage(area, 0, 0);
  else { lctx.fillStyle = "#000"; lctx.fillRect(area.x, area.y, area.width, area.height); }
  lctx.filter = "none";
  lctx.globalCompositeOperation = "source-in";
  // The model returns the crop at its own size; scale it back over the crop.
  lctx.drawImage(after, crop.x, crop.y, crop.width, crop.height);
  ctx.drawImage(layer, 0, 0);
  return out.toDataURL("image/png");
}
