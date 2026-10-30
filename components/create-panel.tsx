"use client";
import { createPortal } from "react-dom";
import { notifySuccess } from "./toast";
import { confirmAction } from "./confirmation";

import { editOn } from "../lib/edit";
import { newSeed } from "../lib/models";
import { CustomPrompt } from "./custom-prompt";
import { DeleteButton } from "./delete-button";

import { StudioEmpty } from "./studio-empty";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { formatDate, lookChips } from "../lib/details";
import { defaultSelection, fields, fitKind, hiddenOption, identityDescription, characterPrompt, isCreature, objectShape, variantLabel, randomSelection, upgradeSelection, withPick, type Field, type FieldId, type Look, type Selection, type Weirdness } from "../lib/character";
import { WeirdnessSlider } from "./weirdness-picker";
import { characterFolder } from "../lib/folders";
import { library, newId, type Character, type Sheet } from "../lib/library";
import { previewSrc } from "../lib/previews";
import { postJson, updateOutputs, type ImageResult } from "./client-api";
import { CopyImageLink } from "./copy-image-link";
import { DetailsModal, steps as paddles } from "./details-modal";
import { EditModal } from "./edit-modal";
import { ModelSeed, modelLabel, useGen, takeSeed, type Gen } from "./model-seed";
import { OptionIcon } from "./option-icon";
import { Pending } from "./pending";
import { defaultView, typeGroups, viewGallery, type GalleryView } from "../lib/gallery";
import { models } from "../lib/models";
import { alreadyKept, fromSaved, type SavedSheet } from "../lib/restore";


function summary(field: Field, picks: string[]) {
  if (!picks.length) return "None";
  return picks.map((id) => field.options.find((option) => option.id === id)?.label).join(", ");
}

// Step headings over the option groups, at the first group of each step.
const steps: Record<string, string> = { kind: "Type", skin: "Face & hair", build: "Body", features: "Style" };

type Props = {
  restoreTarget?: HTMLElement | null;
  /** Tiles to load, e.g. after "Edit look" on a saved character; a new key loads them again. */
  draft?: { look: Look; key: number; customPrompt?: string };
  /** A sheet to open in the viewer (from a draft on another tab); a new key opens it again. */
  openSheet?: { id: string; key: number };
  characters: Character[];
  /** Reload characters after a save, rename or delete. */
  onChanged: () => Promise<void>;
  onOpenShoot: (characterId: string) => void;
};

/** One card in the grid: a saved character, or a kept sheet not saved yet. */
type Card = { id: string; image: string; createdAt: number; sheet?: Sheet; character?: Character };


export function CreatePanel({ restoreTarget, draft, openSheet, characters, onChanged, onOpenShoot }: Props) {
  const initial = draft?.look;
  const [picked, setPicked] = useState<Selection>(initial ? fitKind(upgradeSelection(initial.selection) as Selection) : defaultSelection);
  const [color, setColor] = useState<string | undefined>(initial?.color);
  const [detail, setDetail] = useState(initial?.detail ?? "");
  const [weird, setWeird] = useState<Weirdness>(initial?.weird ?? 0);
  const [kindGroup, setKindGroup] = useState<string>();
  const [openField, setOpenField] = useState<string | undefined>("kind");
  // Opening a group closes the open one above it, which shifts everything up.
  // Keep the clicked heading where it was on screen.
  const anchor = useRef<{ el: HTMLElement; top: number }>(undefined);
  useLayoutEffect(() => {
    const a = anchor.current; anchor.current = undefined;
    if (!a) return;
    const delta = a.el.getBoundingClientRect().top - a.top;
    if (!delta) return;
    const box = a.el.closest<HTMLElement>(".controls-scroll");
    if (box && box.scrollHeight > box.clientHeight) box.scrollTop += delta; else window.scrollBy(0, delta);
  }, [openField]);
  const [viewing, setViewing] = useState<Card>();
  const [drawing, setDrawing] = useState(false);
  const [recent, setRecent] = useState<Sheet[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState("Pick the look, then generate a character sheet.");
  const [customPrompt, setCustomPrompt] = useState("");
  const [gen, setGen] = useGen("sheet");
  const [editing, setEditing] = useState<Card>();
  const [view, setView] = useState<GalleryView>(defaultView);
  // Select mode: tick several cards, then delete them in one go.
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const changeView = (change: Partial<GalleryView>) => setView((v) => ({ ...v, page: 1, ...change }));
  const creature = isCreature(picked);
  // Objects and food grow "hair" from their own material (whipped cream, peel…).
  const objectHair = objectShape(picked)?.hair.split(/ (?:piled|curling|popping|sprouting)/)[0];
  // "Start from a real person" was removed Oct 29 (results were over-processed); the route and prompt still accept a face photo.
  const references = { face: false, body: false };
  const prompt = useMemo(() => characterPrompt(picked, detail, references, color, weird, gen.model, gen.seed ?? 0), [picked, detail, references.face, references.body, color, weird, gen.model, gen.seed]);

  // Kept sheets come back after a reload, so nothing paid for disappears.
  useEffect(() => { void library.sheets().then(setRecent); }, []);
  // The panel stays mounted across tabs, so "Edit look" loads its tiles here
  // instead of rebuilding the panel (which would drop a run in progress).
  useEffect(() => {
    if (!draft) return;
    setCustomPrompt(draft.customPrompt ?? "");
    setPicked(fitKind(upgradeSelection(draft.look.selection) as Selection)); setColor(draft.look.color); setDetail(draft.look.detail); setWeird(draft.look.weird ?? 0);
    setMessage("Tiles loaded from that character. Change anything, then generate.");
  }, [draft]);

  // Saved characters plus sheets not saved yet, newest first. A sheet that
  // became a character shows as that character (matched by id or image).
  const cards = useMemo<Card[]>(() => {
    const isSaved = (sheet: Sheet) => characters.some((c) => c.id === sheet.savedAs?.id || c.references[0] === sheet.image);
    return [
      ...characters.map((c) => ({ id: c.id, image: c.references[0], createdAt: c.createdAt, character: c, sheet: recent.find((s) => s.savedAs?.id === c.id || s.image === c.references[0]) })),
      ...recent.filter((s) => !isSaved(s)).map((s) => ({ id: s.id, image: s.image, createdAt: s.createdAt, sheet: s })),
    ].sort((a, b) => b.createdAt - a.createdAt);
  }, [characters, recent]);

  // Search, filters, sort and pages over every sheet; nothing is dropped.
  const kindField = fields[0];
  const gallery = useMemo(() => viewGallery(cards.map((card) => {
    const made = card.character ?? card.sheet;
    const look = card.character?.look ?? card.sheet?.look;
    const kindId = look?.selection.kind[0];
    const kindLabel = kindField.options.find((o) => o.id === kindId)?.label ?? "";
    return { ...card, name: card.character?.name, saved: Boolean(card.character), kind: kindId, model: made?.model, text: `${kindLabel} ${made?.prompt ?? ""}` };
  }), view), [cards, view, kindField]);
  const kindsUsed = useMemo(() => [...new Set(cards.map((c) => (c.character?.look ?? c.sheet?.look)?.selection.kind[0]).filter(Boolean))] as string[], [cards]);
  const kindGroups = useMemo(() => typeGroups(kindField.options, kindsUsed), [kindField, kindsUsed]);

  // Brings back sheets from the outputs folder that are no longer in the grid
  // (e.g. lost to the old 12-sheet limit or a cleared browser).
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState("");
  async function restore() {
    if (restoring) return;
    setRestoring(true); setRestoreMessage("Looking in the outputs folder…");
    try {
      const response = await fetch("/api/outputs");
      if (!response.ok) throw new Error("Could not read the outputs folder. Try again.");
      const { sheets } = await response.json() as { sheets: SavedSheet[] };
      const kept = [...recent, ...characters.map((c) => ({ prompt: c.prompt, createdAt: c.createdAt }))];
      const missing = sheets.map(fromSaved).filter((r) => !alreadyKept(r, kept));
      let done = 0;
      for (const r of missing) {
        const file = await fetch(`/api/outputs?file=${encodeURIComponent(r.file)}`);
        if (!file.ok) continue;
        const { image } = await file.json() as { image: string };
        await library.keepSheet({ id: newId(), image, prompt: r.prompt, customPrompt: r.customPrompt, description: r.description, look: r.look, model: r.model, seed: r.seed, file: r.file, createdAt: r.createdAt });
        done++;
      }
      setRecent(await library.sheets());
      await onChanged();
      setRestoreMessage(done ? `Brought back ${done} sheet${done === 1 ? "" : "s"} from the outputs folder.` : sheets.length ? "Every sheet in the outputs folder is already here." : "No saved sheets found in the outputs folder.");
    } catch (cause) { setRestoreMessage(cause instanceof Error ? cause.message : "Could not restore sheets."); } finally { setRestoring(false); }
  }

  function fail(cause: unknown) {
    setError(true);
    setMessage(cause instanceof Error ? cause.message : "Something went wrong.");
  }

  function toggle(field: Field, id: string) {
    const current = picked[field.id as FieldId];
    let next = [id];
    if (field.max) {
      // Tiles that can't go together (cap and beanie, long and short legs) swap instead of stacking.
      const swapped = withPick(field, current, id);
      if (current.includes(id)) next = current.filter((pick) => pick !== id);
      else if (swapped.length <= field.max) {
        next = swapped;
        const dropped = current.filter((pick) => !swapped.includes(pick));
        if (dropped.length) setMessage(`${field.options.find((o) => o.id === id)?.label} replaces ${dropped.map((d) => field.options.find((o) => o.id === d)?.label).join(", ")}: they can't go together.`);
      }
      else return setMessage(`${field.label}: pick up to ${field.max}. Tap a picked tile to remove it.`);
    }
    // Switching to an animal, robot or object drops picks it can't have (trans, braces on a moth).
    const fitted = fitKind({ ...picked, [field.id]: next } as Selection, Math.random, field.id);
    const undone = (["build", "height", "proportions"] as const).filter((id) => id !== field.id && fitted[id].join() !== picked[id].join());
    if (undone.length) setMessage(`${field.options.find((o) => o.id === id)?.label} doesn't go with what was picked in ${undone.map((u) => fields.find((f) => f.id === u)?.label).join(" and ")}, so that changed.`);
    setPicked(fitted);
  }

  // Redo passes the saved look, model and seed; a normal run uses the tiles.
  async function generate(redo?: { look: Look; model?: Gen["model"]; seed?: number; prompt?: string; description?: string }) {
    if (busy) return;
    const look: Look = redo?.look ?? { selection: picked, color, detail, weird };
    const model = redo?.model ?? gen.model;
    const override = redo ? redo.prompt ?? "" : customPrompt.trim();
    const [nextSeed, nextGen] = takeSeed(gen);
    const seed = redo ? redo.seed ?? nextSeed : nextSeed;
    if (!redo || redo.seed === undefined) setGen(nextGen);
    setBusy(true); setDrawing(true); setError(false); setMessage(`Generating a character sheet with ${modelLabel(model, "sheet")}…`);
    try {
      const result = await postJson<ImageResult & { description: string; model: Gen["model"]; seed?: number; file?: string }>("/api/character", { selection: look.selection, color: look.color, detail: look.detail, weird: look.weird ?? 0, model, seed, ...(override ? { customPrompt: override } : {}), ...(redo?.description ? { savedDescription: redo.description } : {}) });
      const next: Sheet = { customPrompt: override || undefined, id: newId(), image: result.image, prompt: result.prompt, description: result.description, look, model: result.model, seed: result.seed, ...(result.file ? { file: result.file } : {}), createdAt: Date.now() };
      // Kept right away, so a reload or restart never loses a paid result.
      await library.keepSheet(next);
      setRecent(await library.sheets());
      setMessage("New sheet added on the right. Give it a name to save it as a character, or change tiles and generate another.");
    } catch (cause) { fail(cause); } finally { setBusy(false); setDrawing(false); }
  }

  async function save(sheet: Sheet, name: string) {
    const id = newId();
    await library.saveCharacter({ id, name, references: [sheet.image], description: sheet.description, look: sheet.look, prompt: sheet.prompt, customPrompt: sheet.customPrompt, model: sheet.model, seed: sheet.seed, createdAt: sheet.createdAt });
    // The sheet's file moves into the new character's own outputs folder.
    const moved = sheet.file ? await updateOutputs<{ file?: string }>({ move: { file: sheet.file, folder: characterFolder(name, id) } }) : undefined;
    await library.keepSheet({ ...sheet, savedAs: { id, name }, ...(moved?.file ? { file: moved.file } : {}) });
    setRecent(await library.sheets());
    await onChanged();
    setError(false);
    setMessage(`${name} is saved. Dress them in Wardrobe or cast them in a storyboard.`);
    return id;
  }

  const openedKey = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!openSheet || openedKey.current === openSheet.key) return;
    const card = cards.find((c) => c.sheet?.id === openSheet.id);
    if (card) { openedKey.current = openSheet.key; setViewing(card); }
  }, [openSheet, cards]);

  // Saved from the viewer: keep showing the same picture, now as the character.
  const [reopen, setReopen] = useState<string>();
  useEffect(() => {
    if (!reopen) return;
    const card = cards.find((c) => c.character?.id === reopen);
    if (card) { setViewing(card); setReopen(undefined); }
  }, [cards, reopen]);

  async function rename(character: Character, name: string) {
    await library.saveCharacter({ ...character, name });
    await updateOutputs({ rename: { from: characterFolder(character.name, character.id), to: characterFolder(name, character.id) } });
    // Kept sheets remember where their file is; point them at the renamed folder.
    for (const sheet of recent.filter((s) => s.savedAs?.id === character.id && s.file?.startsWith(`${characterFolder(character.name, character.id)}/`))) {
      await library.keepSheet({ ...sheet, savedAs: { id: character.id, name }, file: sheet.file!.replace(characterFolder(character.name, character.id), characterFolder(name, character.id)) });
    }
    setRecent(await library.sheets());
    await onChanged();
  }

  async function remove(card: Card) {
    if (card.character) {
      if (!await confirmAction(`Delete ${card.character.name}? Their photos stay in the library, and the file in your outputs folder stays too.`, () => library.removeCharacter(card.character!))) return;
    } else if (card.sheet) {
      if (!await confirmAction("Delete this unsaved sheet? The file in your outputs folder stays.", () => library.deleteSheet(card.sheet!.id))) return;
    }
    notifySuccess("Deleted from your library");
    setViewing(undefined);
    setRecent(await library.sheets());
    await onChanged();
  }

  function toggleCard(id: string) {
    setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  function stopSelecting() { setSelecting(false); setSelected(new Set()); }

  async function removeSelected() {
    const picked = cards.filter((card) => selected.has(card.id));
    if (!picked.length) return;
    const saved = picked.filter((card) => card.character).length;
    const unsaved = picked.length - saved;
    const parts = [saved ? `${saved} saved character${saved === 1 ? "" : "s"}` : "", unsaved ? `${unsaved} unsaved sheet${unsaved === 1 ? "" : "s"}` : ""].filter(Boolean).join(" and ");
    if (!await confirmAction(`Delete ${parts}? ${saved ? "Their photos stay in the library. " : ""}The files in your outputs folder stay too.`, async () => {
    for (const card of picked) {
      if (card.character) await library.removeCharacter(card.character);
      else if (card.sheet) await library.deleteSheet(card.sheet.id);
    }
    })) return;
    stopSelecting();
    setRecent(await library.sheets());
    await onChanged();
    setMessage(`Deleted ${parts}.`);
    notifySuccess(`Deleted ${parts}.`);
  }

  return (
    <>
      {restoreTarget && createPortal(<div className="footer-restore"><button type="button" className="link" disabled={restoring} onClick={() => void restore()}>{restoring ? "Restoring…" : "Restore from outputs folder"}</button><p role="status">{restoreMessage}</p></div>, restoreTarget)}
      <section className="workspace">
        <div className="controls"><div className="controls-scroll">
          <div className="builder-heading"><span className="eyebrow">Character builder</span><h2>Create a character</h2><p className="hint">Choose their appearance. You can adjust these settings for each sheet.</p></div>
          {variantLabel(picked) && <p className="hint">Build, height and a big head pick the real kind: now a <strong>{variantLabel(picked)}</strong>.</p>}
          {fields.map((field: Field) => {
            // Face shape and makeup don't apply to creatures, so they're hidden.
            if (creature && field.humanOnly) return null;
            const step = steps[field.id];
            const groups = [...new Set(field.options.map((option) => option.group))];
            const isSkin = field.id === "skin";
            return (
              <div key={field.id} className="picker-wrap">
              {step && <p className="step-head">{step}</p>}
              {/* One group open at a time: with all open the column ran ~8,000px. */}
              <details className="picker" open={openField === field.id}>
                <summary onClick={(event) => { event.preventDefault(); anchor.current = { el: event.currentTarget, top: event.currentTarget.getBoundingClientRect().top }; setOpenField(openField === field.id ? undefined : field.id); }}>
                  <span>{isSkin && creature ? "Skin, fur or feathers" : objectHair && field.id === "hairStyle" ? `Hair shape · made of ${objectHair}` : objectHair && field.id === "hairColor" ? "Hair tint" : field.label}{field.max ? ` · up to ${field.max}` : ""}</span>
                  <small>{isSkin && color ? "Custom color" : isSkin && creature ? "Natural" : field.id === "kind" && variantLabel(picked) ? `${summary(field, picked.kind)} · ${variantLabel(picked)}` : summary(field, picked[field.id as FieldId])}</small>
                </summary>
                {field.id === "kind" && <div className="category-filters" aria-label="Character categories">{groups.map((group) => <button type="button" key={group} aria-pressed={(kindGroup ?? field.options.find((o) => picked.kind.includes(o.id))?.group ?? groups[0]) === group} onClick={() => setKindGroup(group)}>{group}</button>)}</div>}
                {isSkin ? (
                  // Skin: realistic tones for people, natural colors for
                  // creatures, and a custom color for either.
                  <div className="tiles">
                    {creature ? (
                      <button type="button" aria-pressed={!color} className={!color ? "tile active" : "tile"} onClick={() => setColor(undefined)}>
                        <OptionIcon field="skin" id="natural" /><span>Natural</span>
                      </button>
                    ) : field.options.map((option) => {
                      const active = !color && picked.skin.includes(option.id);
                      return (
                        <button key={option.id} type="button" aria-pressed={active} className={active ? "tile active" : "tile"} onClick={async () => { setColor(undefined); toggle(field, option.id); }}>
                          <OptionIcon field="skin" id={option.id} /><span>{option.label}</span>
                        </button>
                      );
                    })}
                    <label className={color ? "tile active" : "tile"}>
                      <input type="color" className="tile-color" value={color ?? "#7fd1c7"} aria-label="Custom color" onChange={(event) => setColor(event.target.value)} onClick={async () => { if (!color) setColor("#7fd1c7"); }} />
                      <span>Custom color</span>
                    </label>
                  </div>
                ) : groups.filter((group) => field.id !== "kind" || group === (kindGroup ?? field.options.find((o) => picked.kind.includes(o.id))?.group ?? groups[0])).map((group) => (
                  <div key={group ?? "all"}>
                    {group && <p className="tile-group">{group}</p>}
                    <div className="tiles">
                      {field.options.filter((option) => option.group === group && !hiddenOption(picked, field.id, option.id)).map((option) => {
                        const src = previewSrc(field.id, option.id);
                        const active = picked[field.id as FieldId].includes(option.id);
                        return (
                          <button key={option.id} type="button" aria-pressed={active} className={active ? "tile active" : "tile"} onClick={() => toggle(field, option.id)}>
                            {src ? <img src={src} alt="" /> : <OptionIcon field={field.id} id={option.id} />}
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {field.id === "style" && <p className="hint">For an outfit from a photo or shop screenshot, save the character and use Wardrobe.</p>}
              </details>
              </div>
            );
          })}
          <details className="settings-section"><summary>Extras{detail ? " · customized" : ""}</summary><div className="settings-stack">
          <label className="field">Signature detail (optional)
            <textarea value={detail} maxLength={400} onChange={(event) => setDetail(event.target.value)} placeholder="Always wears a vintage gold locket…" />
          </label>
          </div></details>
          {/* FLUX kept average legs and heads through three prompt rewrites (robot tests, Oct 28). */}
          {gen.model === "flux-3-klein" && (picked.proportions.length > 0 || !picked.height.includes("average")) && !objectShape(picked) && (
            <p className="hint">FLUX tends to draw average proportions. For long legs, a big head or an unusual height, Qwen Image 2.1 or MOSS-Image follow the Body tiles better.</p>
          )}
          <ModelSeed task="sheet" value={gen} onChange={setGen} disabled={busy} prompt={customPrompt.trim() || prompt} />
          <CustomPrompt value={customPrompt} onChange={setCustomPrompt} generated={prompt} disabled={busy} />
          </div><div className="action-bar"><div className="generate-actions"><button type="button" className="ghost shuffle-button" aria-label="Shuffle character details" title="Surprise me · shuffle character details" disabled={busy} onClick={async () => { setPicked(randomSelection()); setColor(undefined); }}><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h3c4 0 8 12 12 12h3m-4-4 4 4-4 4M3 18h3c1.6 0 3.2-2 4.8-4.5M14 9c1.4-1.8 2.7-3 4-3h3m-4-4 4 4-4 4" /></svg></button>
            <button type="button" disabled={busy} onClick={() => void generate()}>{busy ? "Generating…" : "Create character sheet"}</button></div>
            <WeirdnessSlider value={weird} onChange={setWeird} disabled={busy} />
            <p className={`status${error ? " error" : ""}`} role="status">{message}</p>
          </div>
        </div>
        <div className="output library">
          {cards.length > 0 && <h2 className="section-title">Character sheets</h2>}
          {cards.length > 0 && (
            <div className="gallery-tools">
              <input type="search" value={view.query} placeholder="Search names, types, prompts…" aria-label="Search" onChange={(event) => changeView({ query: event.target.value })} />
              <select value={view.show} aria-label="Show" onChange={(event) => changeView({ show: event.target.value as GalleryView["show"] })}>
                <option value="all">All sheets</option><option value="saved">Saved characters</option><option value="unsaved">Draft sheets</option>
              </select>
              <details className="gallery-filters"><summary>Filters{view.kind !== "all" || view.model !== "all" ? " · active" : ""}</summary><div className="settings-stack"><select value={view.kind} aria-label="Character type" onChange={(event) => changeView({ kind: event.target.value })}>
                <option value="all">Any type</option>
                {/* Grouped like the tiles (People, Creatures…), A–Z inside each group (owner's note, Oct 27). */}
                {kindGroups.map(([group, options]) => (
                  <optgroup key={group} label={group}>{options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</optgroup>
                ))}
              </select>
              <select value={view.model} aria-label="Model" onChange={(event) => changeView({ model: event.target.value })}>
                <option value="all">Any model</option>
                {models.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
              <button className="link" type="button" onClick={() => changeView({ kind: "all", model: "all" })}>Clear filters</button></div></details>
              <select value={view.sort} aria-label="Sort" onChange={(event) => changeView({ sort: event.target.value as GalleryView["sort"] })}>
                <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option>
              </select>
            </div>
          )}
          {/* Count on the left, the two secondary actions on the right, apart from the filters. */}
          {cards.length > 0 && !selecting && (
            <div className="gallery-actions">
              <span className="hint">{gallery.total === cards.length ? `${cards.length} sheet${cards.length === 1 ? "" : "s"}` : `${gallery.total} of ${cards.length} sheets`}</span>
              <span className="gallery-actions-right">
                <button type="button" className="ghost small-button" onClick={() => setSelecting(true)}>Select</button>
              </span>
            </div>
          )}
          {selecting && (
            <div className="select-bar" role="toolbar" aria-label="Selection">
              <strong>{selected.size} selected</strong>
              <button type="button" className="link" onClick={() => setSelected(new Set(gallery.items.map((card) => card.id)))}>Select all on this page</button>
              {selected.size > 0 && <button type="button" className="link" onClick={() => setSelected(new Set())}>Clear</button>}
              <button type="button" className="danger-button small-button" disabled={!selected.size} onClick={() => void removeSelected()}>Delete selected</button>
              <button type="button" className="ghost small-button" onClick={stopSelecting}>Done</button>
            </div>
          )}
          <div className="cards">
            {drawing && gallery.page === 1 ? <Pending ratio="4:3" label="Drawing the character sheet…" fill /> : null}
            {gallery.items.map((card) => (
              <SheetCard
                key={card.id}
                card={card}
                selecting={selecting}
                selected={selected.has(card.id)}
                onOpen={() => selecting ? toggleCard(card.id) : setViewing(card)}
                onSave={async (name) => { if (card.sheet) await save(card.sheet, name); }}
                onRename={(name) => card.character && rename(card.character, name)}
                onShoot={() => card.character && onOpenShoot(card.character.id)}
                onDelete={() => void remove(card)}
              />
            ))}
          </div>
          {gallery.pages > 1 && (
            <div className="pager">
              <button type="button" className="ghost small-button" disabled={gallery.page <= 1} onClick={() => setView((v) => ({ ...v, page: gallery.page - 1 }))}>← Previous</button>
              <span className="hint">Page {gallery.page} of {gallery.pages}</span>
              <button type="button" className="ghost small-button" disabled={gallery.page >= gallery.pages} onClick={() => setView((v) => ({ ...v, page: gallery.page + 1 }))}>Next →</button>
            </div>
          )}
          {cards.length > 0 && gallery.total === 0 ? <p className="empty-note">Nothing matches. <button type="button" className="link" onClick={() => setView(defaultView)}>Clear filters</button></p> : null}
          {!cards.length && !drawing && <StudioEmpty area="create" />}
        </div>
      </section>
      {viewing && (() => {
        const look = viewing.character?.look ?? viewing.sheet?.look;
        return (
          <DetailsModal
            image={viewing.image}
            {...paddles(gallery.items, gallery.items.findIndex((c) => c.id === viewing.id), setViewing)}
            title={viewing.character?.name ?? "Unsaved sheet"}
            onSave={!viewing.character && viewing.sheet ? async (name) => setReopen(await save(viewing.sheet!, name)) : undefined}
            groups={look ? lookChips(look) : []}
            meta={(() => {
              const made = viewing.character ?? viewing.sheet;
              return [{ label: "Model", value: modelLabel(made?.model, "sheet") }, ...(made?.seed !== undefined ? [{ label: "Seed", value: String(made.seed) }] : []), { label: "Created", value: formatDate(viewing.createdAt) }];
            })()}
            prompt={viewing.character?.prompt ?? viewing.sheet?.prompt}
            description={viewing.character?.description ?? viewing.sheet?.description}
            onClose={() => setViewing(undefined)}
            more={<>
              {look && (viewing.character ?? viewing.sheet)?.seed !== undefined && <button type="button" className="link" disabled={busy} onClick={async () => { const made = viewing.character ?? viewing.sheet; setViewing(undefined); void generate({ look, model: made?.model, seed: made?.seed, prompt: made?.prompt, description: made?.description }); }} title="Generate immediately using the saved seed">Repeat with same seed</button>}
              {look && <button type="button" className="link" disabled={busy} onClick={async () => { const made = viewing.character ?? viewing.sheet; setViewing(undefined); void generate({ look, model: made?.model, seed: newSeed(), prompt: made?.prompt, description: made?.description }); }} title="Generate immediately with a new seed">Generate variation</button>}
              <CopyImageLink image={viewing.image} />
              <DeleteButton onClick={() => void remove(viewing)} />
            </>}
            actions={<>
              {look && <button type="button" className={viewing.character ? undefined : "ghost"} onClick={async () => { const made = viewing.character ?? viewing.sheet; setCustomPrompt(made?.customPrompt ?? ""); setPicked(fitKind(upgradeSelection(look.selection) as Selection)); setColor(look.color); setDetail(look.detail); setWeird(look.weird ?? 0); if (made?.model) setGen({ ...gen, model: made.model, seed: made.seed ?? gen.seed }); setViewing(undefined); setMessage("Settings loaded. Adjust them, then generate."); }} title="Load settings without generating">Adjust settings</button>}
              {editOn && <button type="button" className="ghost" onClick={async () => { setEditing(viewing); setViewing(undefined); }}>Edit image</button>}
              <a className="button ghost" href={viewing.image} download={`${viewing.character?.name ?? "character-sheet"}.jpg`}>Download</a>
            </>}
          />
        );
      })()}
      {editing && (
        <EditModal
          image={editing.image}
          title={editing.character?.name ?? "Character sheet"}
          folder={editing.character ? characterFolder(editing.character.name, editing.character.id) : undefined}
          onClose={() => setEditing(undefined)}
          onSave={async (edit) => {
            // An edited sheet comes back as a new unsaved sheet with the same look.
            const base = editing.sheet ?? editing.character;
            await library.keepSheet({ id: newId(), image: edit.image, prompt: edit.prompt, description: base?.description ?? "", look: base?.look ?? { selection: picked, color, detail, weird }, model: edit.model, seed: edit.seed, createdAt: Date.now() });
            setRecent(await library.sheets());
            setMessage("Edited sheet added. Give it a name to save it as a character.");
          }}
        />
      )}
    </>
  );
}

type CardProps = {
  card: Card;
  /** In select mode a click ticks the card instead of opening it. */
  selecting: boolean;
  selected: boolean;
  onOpen: () => void;
  onSave: (name: string) => Promise<void> | undefined;
  onRename: (name: string) => Promise<void> | undefined;
  onShoot: () => void;
  onDelete: () => void;
};

// A sheet card: unsaved ones ask for a name; saved ones can be renamed and
// taken to a photo shoot.
function SheetCard({ card, selecting, selected, onOpen, onSave, onRename, onShoot, onDelete }: CardProps) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [working, setWorking] = useState(false);
  const [saveError, setSaveError] = useState("");
  const nameAction = useRef<HTMLButtonElement>(null);
  function finishNaming() { setEditing(false); requestAnimationFrame(() => nameAction.current?.focus()); }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = name.trim();
    if (!value || working) return;
    setWorking(true); setSaveError("");
    try { await (card.character ? onRename(value) : onSave(value)); finishNaming(); setName(""); }
    catch (cause) { setSaveError(cause instanceof Error ? cause.message : "Could not save. Try again."); }
    finally { setWorking(false); }
  }

  const naming = editing;
  return (
    <article className={`sheet-card${card.character ? "" : " unsaved"}${selected ? " selected" : ""}`}>
      <button type="button" className="result-button" onClick={onOpen} aria-label={selecting ? (selected ? "Unselect" : "Select") : "Open details"} aria-pressed={selecting ? selected : undefined}>
        {selecting && <span className={`select-check${selected ? " on" : ""}`} aria-hidden="true">{selected ? "✓" : ""}</span>}
        <img src={card.image} alt={card.character ? `${card.character.name} character sheet` : "Unsaved character sheet"} />
      </button>
      {naming ? (
        <form className="card-name" onSubmit={(event) => void submit(event)}>
          <input value={name} maxLength={40} autoFocus={editing} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape" && !working) finishNaming(); }} placeholder={card.character ? card.character.name : "Character name"} aria-label="Character name" />
          <button type="submit" disabled={!name.trim() || working}>{card.character ? "Rename" : "Save character"}</button>
          {editing && <button type="button" className="link" disabled={working} onClick={finishNaming}>Cancel</button>}
        </form>
      ) : (
        <div className="card-title">
          <strong>{card.character?.name ?? "Draft"}</strong>
          <button type="button" className="link" ref={nameAction} onClick={async () => { setSaveError(""); setEditing(true); setName(card.character?.name ?? name); }}>{card.character ? "Rename" : "Save character"}</button>
        </div>
      )}
      {saveError && <p className="status error" role="alert">{saveError}</p>}
      <div className="card-actions">
        {card.character ? (
          <>
            <button type="button" className="ghost small-button" onClick={onShoot}>Storyboard →</button>
          </>
        ) : <span className="hint">{formatDate(card.createdAt)}</span>}
        <DeleteButton onClick={onDelete} />
      </div>
    </article>
  );
}
