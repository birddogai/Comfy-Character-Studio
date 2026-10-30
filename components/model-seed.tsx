"use client";

import { useEffect, useState } from "react";

import { CopyText } from "./copy-text";
import { findModel, isModel, modelsFor, newSeed, type ModelId, type Task } from "../lib/models";

/** The model to use and the seed for the next run. */
export type Gen = { model: ModelId; seed: number; keepSeed: boolean };

export function startGen(task: Task, model?: ModelId): Gen {
  return { model: findModel(model, task).id, seed: newSeed(), keepSeed: false };
}

/**
 * The model and seed state for a panel. The page is built on the server and
 * again in the browser; a random seed picked during that build differed between
 * the two and React reported a hydration mismatch (Oct 27). So the first render
 * shows a fixed placeholder and the random seed is picked once the page is live.
 */
export function useGen(task: Task, model?: ModelId) {
  const [gen, setGen] = useState<Gen>(() => ({ model: findModel(model, task).id, seed: 0, keepSeed: false }));
  useEffect(() => { setGen((g) => g.seed === 0 ? { ...g, seed: newSeed() } : g); }, []);
  return [gen, setGen] as const;
}

/** The seed to send now, and the state to keep for the run after. */
export function takeSeed(gen: Gen): [number, Gen] {
  return [gen.seed, gen.keepSeed ? gen : { ...gen, seed: newSeed() }];
}

// One row used by every step: which model, and the seed. Same seed + same
// settings gives the same picture again (open models only). Folded into one
// line by default (UX pass, Oct 27); the prompt to be sent can sit inside too.
export function ModelSeed({ task, value, onChange, disabled, prompt }: { task: Task; value: Gen; onChange: (gen: Gen) => void; disabled?: boolean; prompt?: string }) {
  const model = findModel(value.model, task);
  const options = modelsFor(task);
  return (
    <details className={`model-seed${disabled ? " is-disabled" : ""}`}>
      <summary>
        <span>{model.label}</span>
        <small>{disabled ? "Locked during generation" : "Settings"}</small>
      </summary>
      {options.length > 1 && (
        <label className="field">Model
          <select value={model.id} disabled={disabled} onChange={(event) => onChange({ ...value, model: event.target.value as ModelId })}>
            {options.map((option) => <option key={option.id} value={option.id}>{option.label}{option.open ? "" : " · not open"}</option>)}
          </select>
        </label>
      )}
      <p className="hint">{options.length > 1 ? model.note : `${model.label}. ${model.note}`}</p>
      {model.seeded ? (
        <div className="seed-row">
          <label className="field seed">Seed
            <input type="number" min={0} step={1} value={value.seed} disabled={disabled} onChange={(event) => onChange({ ...value, seed: Math.max(0, Math.floor(Number(event.target.value) || 0)) })} />
          </label>
          <button type="button" className="ghost seed-refresh" disabled={disabled} onClick={() => onChange({ ...value, seed: newSeed() })} title="Pick a new random seed" aria-label="Pick a new random seed">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14-4.5L4 9m0-5v5h5M4 13a8 8 0 0 0 14 4.5L20 15m0 5v-5h-5" /></svg>
          </button>
        </div>
      ) : null}
      {model.seeded && <label className="check seed-keep"><input type="checkbox" checked={value.keepSeed} disabled={disabled} onChange={(event) => onChange({ ...value, keepSeed: event.target.checked })} /> Keep this seed for the next run</label>}
      {prompt && (
        <details className="prompt-inline">
          <summary>See the prompt</summary>
          <CopyText text={prompt} />
        </details>
      )}
    </details>
  );
}

export function modelLabel(id: string | undefined, task: Task) {
  // Older images made with the removed FLUX 3 cloud API keep their name.
  return id && isModel(id, task) ? findModel(id, task).label : "FLUX 3 (cloud API)";
}
