"use client";

import { weirdness, type Weirdness } from "../lib/character";

// Off · Odd · Weird · Unhinged, used by Create, Wardrobe and Scenes.
export function WeirdnessPicker({ value, onChange, hint }: { value: Weirdness; onChange: (level: Weirdness) => void; hint: string }) {
  return (
    <div className="field">Weirdness <small className="hint">{hint}</small>
      <div className="segmented" role="radiogroup" aria-label="Weirdness">
        {weirdness.map((label, level) => (
          <button key={label} type="button" role="radio" aria-checked={value === level} className={value === level ? "active" : ""} onClick={() => onChange(level as Weirdness)}>{label}</button>
        ))}
      </div>
    </div>
  );
}

// Compact version for Create's sticky bar: four stops on one line.
export function WeirdnessSlider({ value, onChange, disabled }: { value: Weirdness; onChange: (level: Weirdness) => void; disabled?: boolean }) {
  return (
    <label className="weird-slider" title="Exaggerates every feature you picked">
      <span>Weirdness</span>
      <input type="range" min={0} max={weirdness.length - 1} step={1} value={value} disabled={disabled} aria-valuetext={weirdness[value]} onChange={(event) => onChange(Number(event.target.value) as Weirdness)} />
      <strong>{weirdness[value]}</strong>
    </label>
  );
}
