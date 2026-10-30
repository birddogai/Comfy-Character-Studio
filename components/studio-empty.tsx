"use client";

import type { ReactNode } from "react";
import type { Sheet } from "../lib/library";

type Area = "characters" | "create" | "wardrobe" | "scenes";
type Drawing = "face" | "body" | "card" | "clothing" | "dressed" | "place" | "story" | "board";

// One wording across the empty pages: "character sheet" (the two-panel
// image), "outfit", "storyboard"; each page's preview shows its own three steps.
const content: Record<Area, { eyebrow: string; title: string; description: string; steps: string[]; cells: { label: string; drawing: Drawing }[]; flow: string }> = {
  characters: {
    eyebrow: "Characters", title: "Your characters",
    description: "Save a character sheet to start your collection. Each character keeps their outfits and storyboards together in one place.",
    steps: ["Create a character sheet", "Name and save it", "Add outfits and storyboards"],
    cells: [{ label: "Character sheet", drawing: "face" }, { label: "Outfits", drawing: "dressed" }, { label: "Storyboards", drawing: "board" }],
    flow: "Character → outfits → storyboards",
  },
  create: {
    eyebrow: "Create", title: "Create a character sheet",
    description: "Pick their look on the left, or shuffle for a starting point. Create the sheet, then name the character to save it.",
    steps: ["Choose their look", "Create the sheet", "Name and save"],
    cells: [{ label: "Face close-up", drawing: "face" }, { label: "Full-body view", drawing: "body" }, { label: "Saved character", drawing: "card" }],
    flow: "Look → character sheet → saved character",
  },
  wardrobe: {
    eyebrow: "Wardrobe", title: "Dress your character",
    description: "Use clothing photos, a preset or your own words. Each outfit is saved with the character, ready for storyboards.",
    steps: ["Choose a character", "Add clothing", "Create the outfit"],
    cells: [{ label: "Clothing photos", drawing: "clothing" }, { label: "Your character", drawing: "body" }, { label: "Outfit sheet", drawing: "dressed" }],
    flow: "Clothing → character → outfit sheet",
  },
  scenes: {
    eyebrow: "Storyboard", title: "Make a storyboard",
    description: "Choose your cast and say what happens. You get one storyboard image of frames, ready to hand to a video model.",
    steps: ["Choose your cast", "Say what happens", "Create the storyboard"],
    cells: [{ label: "Cast", drawing: "dressed" }, { label: "Describe what happens", drawing: "story" }, { label: "Storyboard", drawing: "board" }],
    flow: "Cast → what happens → frames",
  },
};

const guide = (d: string) => <path className="guide" d={d} />;
const face = <svg viewBox="0 0 160 180" fill="none"><path d="M44 69c0-58 72-58 72 0v22c0 49-72 49-72 0ZM61 126v17l-32 20m70-37v17l32 20M53 76h17m20 0h17M80 82l-5 20h10m-17 12q12 5 24 0"/>{guide("M80 8v164M22 76h116M22 126h116")}</svg>;
const bodyPath = "M62 35c0-25 36-25 36 0v13c0 24-36 24-36 0Zm7 29v14L42 92l-12 62m61-90v14l27 14 12 62M50 91l4 40-4 35m60-75-4 40 4 35M54 131h52M80 134v32M50 166l-3 85h26l7-85 7 85h26l-3-85M47 251l-7 6h33m14-6v6h33l-7-6M68 42h5m14 0h5m-18 13h12";
const body = <svg viewBox="0 0 160 180" fill="none"><g transform="translate(28 0) scale(.65)"><path d={bodyPath}/>{guide("M80 6v168M22 35h116M22 78h116M22 131h116")}</g></svg>;
const drawings: Record<Drawing, ReactNode> = {
  face,
  body,
  // A saved character: the two-panel sheet as a small card with a name line.
  card: <svg viewBox="0 0 160 180" fill="none"><rect x="18" y="40" width="124" height="96" rx="6"/><path d="M80 40v96"/><path d="M36 76c0-22 28-22 28 0v8c0 19-28 19-28 0Zm6 3h6m6 0h6m-12 12q6 3 12 0"/><g transform="translate(88 46) scale(.32)"><path d={bodyPath}/></g><path d="M30 152h60m-60 12h36"/></svg>,
  // Clothing on a hanger, like a product photo.
  clothing: <svg viewBox="0 0 160 180" fill="none"><path d="M80 22a9 9 0 1 1 9 9c-5 0-9 3-9 8v5m0 0-56 28h112Z"/><path d="m52 72-28 20 13 29 16-10-6 62h66l-6-62 16 10 13-29-28-20-24 11Z"/><path d="M106 150h12v14h-12z"/></svg>,
  // The character wearing the outfit: a figure with a jacket drawn over it.
  dressed: <svg viewBox="0 0 160 180" fill="none"><g transform="translate(28 0) scale(.65)"><path d={bodyPath}/><path d="m69 64-27 14-12 50 22 3 4-36 2 40h44l2-40 4 36 22-3-12-50-27-14-11 18Z"/><path d="M80 82v50"/></g></svg>,
  // A place: a framed landscape.
  place: <svg viewBox="0 0 200 150" fill="none"><path d="M12 35V12h23m130 0h23v23M12 115v23h23m130 0h23v-23M16 104l44-37 42 24 33-47 49 60"/><circle cx="145" cy="35" r="10"/></svg>,
  // The brief: a few written lines with a pencil.
  story: <svg viewBox="0 0 200 150" fill="none"><rect x="30" y="18" width="120" height="114" rx="6"/><path d="M48 44h84M48 62h84M48 80h60M48 98h40"/><path d="m128 122 44-44 10 10-44 44-14 4Z"/><path d="m164 86 10 10"/></svg>,
  // The storyboard: one image of numbered frames.
  board: <svg viewBox="0 0 200 150" fill="none"><rect x="14" y="16" width="52" height="34"/><rect x="74" y="16" width="52" height="34"/><rect x="134" y="16" width="52" height="34"/><rect x="14" y="76" width="52" height="34"/><rect x="74" y="76" width="52" height="34"/><rect x="134" y="76" width="52" height="34"/><path d="m22 44 12-12 10 8 8-6 8 10M82 44l14-16 12 12 10-6M146 44a10 10 0 0 1 20 0m-8-18v4M22 104l16-14 20 14M84 104l10-10 8 6 16-16M144 104h32M14 58h20M74 58h20M134 58h20M14 118h20M74 118h20M134 118h20"/></svg>,
};

// Schematic previews describe the workspace; they are not model-generated examples.
export function StudioEmpty({ area, drafts = [], onCreate, onOpenDraft, children }: { area: Area; drafts?: Sheet[]; onCreate?: () => void; onOpenDraft?: (id: string) => void; children?: ReactNode }) {
  const copy = content[area];
  // Character sheets made but not saved yet: shown as small pictures (max 4);
  // a click opens that sheet, where it can be named and saved.
  const shown = area === "create" ? [] : drafts.slice(0, 4);
  const use = area === "wardrobe" ? "dress them" : area === "scenes" ? "cast them in a storyboard" : "see them here";
  return <section className={`studio-empty studio-empty-${area}`}>
    <div className="empty-intro"><span className="section-label">{copy.eyebrow}</span><h2>{copy.title}</h2><p>{copy.description}</p>
      {onCreate && (shown.length
        ? <div className="empty-start">
            <button type="button" className="ghost" onClick={onCreate}>Create another character <span aria-hidden="true">→</span></button>
            <div className="draft-strip">
              <strong>Not saved yet <small>{drafts.length}</small></strong>
              <div className="draft-tiles">
                {shown.map((sheet) => <button type="button" className="draft-tile" key={sheet.id} onClick={() => onOpenDraft?.(sheet.id)} aria-label="Open this character sheet to name and save it" title="Open to name and save">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sheet.image} alt="" />
                </button>)}
                {drafts.length > shown.length && <button type="button" className="draft-more" onClick={onCreate}>See all {drafts.length}</button>}
              </div>
              <span className="draft-note">Open one and name it to save. Saved characters are the ones you can {use}.</span>
            </div>
          </div>
        : <div className="empty-start"><button type="button" onClick={onCreate}>Create a character <span aria-hidden="true">→</span></button><span>Start by creating and saving a character sheet.</span></div>)}
    </div>
    <div className="specimen" aria-label={`${copy.title}: how it works`}>
      <div className="specimen-top"><span>STUDIO / {copy.eyebrow.toUpperCase()}</span><span>PREVIEW</span></div>
      <div className="specimen-grid">
        {copy.cells.map((cell, index) => <div className={`specimen-cell specimen-cell-${index}`} key={cell.label}>
          <div className="specimen-drawing" aria-hidden="true">{drawings[cell.drawing]}</div>
          <div className="specimen-caption"><span>0{index + 1}</span><strong>{cell.label}</strong></div>
        </div>)}
      </div>
      <div className="specimen-bottom"><span>{copy.flow}</span><span>Your images appear here</span></div>
    </div>
    <ol className="empty-workflow">{copy.steps.map((step, index) => <li key={step}><span>0{index + 1}</span>{step}</li>)}</ol>
    {children}
  </section>;
}
