"use client";

import type { Character } from "../lib/library";

// A row of saved characters to pick from, shown as their sheets.
export function CharacterPicker({ characters, value, onChange }: { characters: Character[]; value?: string; onChange: (id: string) => void }) {
  return (
    <div className="strip" role="radiogroup" aria-label="Character">
      {characters.map((c) => (
        <button key={c.id} type="button" role="radio" aria-checked={c.id === value} className={`strip-item wide labeled${c.id === value ? " active" : ""}`} onClick={() => onChange(c.id)}>
          <img src={c.references[0]} alt="" />
          <span>{c.name}</span>
        </button>
      ))}
    </div>
  );
}
