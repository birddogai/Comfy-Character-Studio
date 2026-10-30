"use client";
import { notifySuccess } from "./toast";
import { confirmAction } from "./confirmation";
import { useLanguage } from "./language";

import { editOn } from "../lib/edit";
import { newSeed } from "../lib/models";
import { CustomPrompt } from "./custom-prompt";
import { DeleteButton } from "./delete-button";

import { StudioEmpty } from "./studio-empty";

import { useState, type DragEvent } from "react";
import { formatDate } from "../lib/details";
import { lookParts, type Weirdness } from "../lib/character";
import { characterFolder } from "../lib/folders";
import { library, newId, type Character, type Photo, type Sheet } from "../lib/library";
import { findModel } from "../lib/models";
import { pieces, presets, wardrobePrompt, type PieceId, type WardrobeItem } from "../lib/wardrobe";
import { CharacterPicker } from "./character-picker";
import { fileToDataUrl, postJson, type ImageResult } from "./client-api";
import { CopyImageLink } from "./copy-image-link";
import { DetailsModal, steps } from "./details-modal";
import { EditModal } from "./edit-modal";
import { ModelSeed, modelLabel, useGen, takeSeed, type Gen } from "./model-seed";
import { Pending } from "./pending";
import { WeirdnessPicker } from "./weirdness-picker";

type Props = {
  characters: Character[];
  photos: Photo[];
  characterId?: string;
  onPickCharacter: (id: string) => void;
  onChanged: () => Promise<void>;
  onCreate: () => void;
  /** Sheets made but not saved yet, and a way to open one in Create. */
  drafts: Sheet[];
  onOpenDraft: (sheetId: string) => void;
  /** Open Photo shoot with this outfit sheet as the reference. */
  onShootOutfit: (characterId: string, outfitId: string) => void;
};

type Draft = WardrobeItem & { key: string };

function titleFor(items: WardrobeItem[]) {
  const preset = presets.find((p) => items.length === 1 && p.words === items[0].words);
  if (preset) return preset.label;
  return items.map((item) => pieces.find((p) => p.id === item.piece)!.label).join(" + ");
}

// Step 2: the same character sheet in a new outfit. Drop in shop screenshots
// or product photos (several at once, e.g. a top and pants), pick a preset,
// or describe it. The character, pose and layout stay the same.
export function WardrobePanel({ characters, photos, characterId, onPickCharacter, onChanged, onCreate, drafts, onOpenDraft, onShootOutfit }: Props) {
  const { t } = useLanguage();
  const [method, setMethod] = useState<"upload" | "presets" | "describe">("upload");
  const [items, setItems] = useState<Draft[]>([]);
  const [note, setNote] = useState("");
  const [weird, setWeird] = useState<Weirdness>(0);
  const [customPrompt, setCustomPrompt] = useState("");
  const [gen, setGen] = useGen("edit", "qwen-2.1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState("");
  const [viewing, setViewing] = useState<string>();
  const [editing, setEditing] = useState<Photo>();
  const [over, setOver] = useState(false);
  const character = characters.find((c) => c.id === characterId);
  const outfits = photos.filter((p) => p.characterId === characterId && p.kind === "outfit");
  const parts = lookParts(character?.look);

  if (!characters.length) {
    return (
      <StudioEmpty area="wardrobe" drafts={drafts} onCreate={onCreate} onOpenDraft={onOpenDraft} />
    );
  }

  async function addFiles(files: FileList | File[] | null) {
    if (!files) return;
    const list = [...files].filter((file) => file.type.startsWith("image/")).slice(0, 6 - items.length);
    try {
      const added = await Promise.all(list.map(async (file) => ({ key: newId(), piece: "top" as PieceId, image: await fileToDataUrl(file, 1536, 128) })));
      setItems((current) => [...current, ...added]);
      setError(false);
      setMessage(added.length ? "Now tell each image what it is (top, bottom, full outfit…)." : "Drop PNG, JPEG or WebP images.");
    } catch (cause) { setError(true); setMessage(cause instanceof Error ? cause.message : "Could not read that image."); }
  }

  function drop(event: DragEvent) {
    event.preventDefault(); setOver(false);
    void addFiles(event.dataTransfer.files);
  }

  function update(key: string, change: Partial<Draft>) {
    setItems((current) => current.map((item) => item.key === key ? { ...item, ...change } : item));
  }

  async function dress(useItems: WardrobeItem[] = items, seedOverride?: number, modelOverride?: Gen["model"], source?: Photo) {
    const model = modelOverride ?? gen.model;
    const override = source ? source.prompt : customPrompt.trim();
    if (!character || busy || (!useItems.length && !override)) return;
    if (useItems.some((item) => !item.image && !item.words?.trim())) { setError(true); return setMessage("Describe each piece that has no image."); }
    const [nextSeed, nextGen] = takeSeed(gen);
    const seed = seedOverride ?? nextSeed;
    setBusy(true); setError(false); setMessage(`Dressing ${character.name} with ${findModel(model, "edit").label}…`);
    try {
      const clean = useItems.map(({ piece, image, words }) => ({ piece, ...(image ? { image } : {}), ...(words ? { words } : {}) }));
      const result = await postJson<ImageResult & { model: Gen["model"]; seed?: number }>("/api/wardrobe", {
        references: [character.references[0]], items: clean, note, parts: parts || undefined, character: character.description, model, seed, weird, ...(override ? { customPrompt: override } : {}), folder: characterFolder(character.name, character.id),
      });
      await library.savePhoto({ id: newId(), characterId: character.id, kind: "outfit", title: source?.title ?? (clean.length ? titleFor(clean) : "Custom outfit"), items: clean, image: result.image, prompt: result.prompt, note: source?.note ?? note, customPrompt: override || undefined, model: result.model, seed: result.seed, createdAt: Date.now() });
      if (seedOverride === undefined) setGen(nextGen);
      await onChanged();
      setMessage("New outfit added. Open it to use it in a storyboard, edit it, or redo it.");
      notifySuccess("Outfit saved");
    } catch (cause) { setError(true); setMessage(cause instanceof Error ? cause.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  async function remove(photo: Photo) {
    if (!await confirmAction("Delete this outfit sheet? This can't be undone.", () => library.deletePhoto(photo.id))) return;
    notifySuccess("Outfit deleted");
    setViewing(undefined);
    await onChanged();
  }

  const preview = character ? wardrobePrompt(gen.model, items.length ? items : [{ piece: "full", words: "…" }], { character: character.description, parts, note, weird }) : "";
  const shown = outfits.find((o) => o.id === viewing);

  return (
    <>
      <section className="workspace">
        <div className="controls"><div className="controls-scroll">
          <div className="builder-heading"><h2>{t("New outfit")}</h2><p className="hint">Choose clothing for your character, then use the saved outfit in a storyboard.</p></div>
          <details className="settings-section character-switcher"><summary>{character && <img src={character.references[0]} alt="" />}<span>{character?.name ?? "Choose character"}</span></summary><CharacterPicker characters={characters} value={characterId} onChange={onPickCharacter} /></details>
          <div className="segmented" aria-label="Add clothing">{(["upload", "presets", "describe"] as const).map((choice) => <button type="button" key={choice} aria-pressed={method === choice} className={method === choice ? "active" : ""} onClick={() => setMethod(choice)}>{choice === "upload" ? t("Upload") : choice === "presets" ? t("Presets") : t("Describe")}</button>)}</div>
          {method === "upload" && <>
          <div className={`dropzone${over ? " over" : ""}`} onDragOver={(event) => { event.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={drop}>
            <p><strong>{t("Drop product images here")}</strong></p>
            <p className="hint">Shop screenshots are fine, front and back together or one each. Only the clothes are used.</p>
            <label className="button ghost small-button">Choose images
              <input type="file" hidden multiple accept="image/png,image/jpeg,image/webp" onChange={(event) => { void addFiles(event.target.files); event.target.value = ""; }} />
            </label>
          </div>
          </>}
          {method === "presets" && <div className="chips">{presets.map((preset) => <button key={preset.id} type="button" className="chip" onClick={async () => { if (!items.length || await confirmAction("Replace the selected clothing with this preset?")) setItems([{ key: newId(), piece: "full", words: preset.words }]); }}>{preset.label}</button>)}</div>}
          {method === "describe" && <button type="button" className="ghost" onClick={() => setItems((current) => [...current, { key: newId(), piece: "full", words: "" }])}>+ Describe a piece</button>}
          {items.length > 0 && (
            <ul className="pieces">
              {items.map((item) => (
                <li key={item.key} className="piece">
                  {item.image ? <img src={item.image} alt="" /> : <span className="piece-text" aria-hidden>Aa</span>}
                  <div className="piece-fields">
                    <select value={item.piece} aria-label="What this is" onChange={(event) => update(item.key, { piece: event.target.value as PieceId })}>
                      {pieces.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                    {!item.image && <input value={item.words ?? ""} maxLength={300} placeholder="Describe it: a red puffer jacket…" onChange={(event) => update(item.key, { words: event.target.value })} />}
                  </div>
                  <button type="button" className="link danger" aria-label="Remove" onClick={() => setItems((current) => current.filter((i) => i.key !== item.key))}>✕</button>
                </li>
              ))}
            </ul>
          )}
          <details className="settings-section"><summary>Adjustments{note || weird ? " · customized" : ""}</summary><div className="settings-stack">
          <label className="field">Extra direction (optional)
            <textarea value={note} maxLength={400} onChange={(event) => setNote(event.target.value)} placeholder="Sleeves rolled up, hood down…" />
          </label>
          <WeirdnessPicker value={weird} onChange={setWeird} hint="Takes the outfit over the top. The character stays the same." />
          </div></details>
          <CustomPrompt value={customPrompt} onChange={setCustomPrompt} generated={preview} disabled={busy} />
          <ModelSeed task="edit" value={gen} onChange={setGen} disabled={busy} prompt={customPrompt.trim() || preview} />

          </div><div className="action-bar">
            <button type="button" disabled={busy || !character || (!items.length && !customPrompt.trim()) || items.some((item) => !item.image && !item.words?.trim())} onClick={() => void dress()}>{busy ? t("Generating…") : t("Generate outfit")}</button>
            <p className={`status${error ? " error" : ""}`} role="status">{message || (!character ? "Choose a character to dress." : items.some((item) => !item.image && !item.words?.trim()) ? "Describe each clothing piece before generating." : !items.length ? "Upload clothing, choose a preset, or describe an outfit." : "Your character stays the same; only the outfit changes.")}</p>
          </div>
        </div>
        <div className="output gallery wide">
          <h2 className="section-title gallery-heading">{character?.name ? `${character.name}’s outfits` : "Outfits"} <small>{outfits.length}</small></h2>
          {busy && <Pending ratio="4:3" label="Changing clothes…" fill />}
          {outfits.length ? outfits.map((outfit) => (
            <figure key={outfit.id}>
              <button type="button" className="result-button" onClick={() => setViewing(outfit.id)} aria-label="Open details">
                <img src={outfit.image} alt={outfit.title ?? "Outfit sheet"} />
              </button>
              <figcaption className="card-actions"><div><button type="button" className="link outfit-title" title="Rename outfit" onClick={async () => { const title = window.prompt("Outfit name", outfit.title ?? "")?.trim(); if (title) { await library.savePhoto({ ...outfit, title: title.slice(0, 100) }); await onChanged(); } }}>{outfit.title ?? "Outfit"}</button><small className="asset-date">{formatDate(outfit.createdAt)}</small></div><DeleteButton label="Delete outfit" onClick={() => void remove(outfit)} /></figcaption>
            </figure>
          )) : busy ? null : <p>{character ? `${character.name}'s outfits will appear here.` : "Pick a character."}</p>}
        </div>
      </section>
      {shown && !editing && (
        <DetailsModal
          image={shown.image}
          {...steps(outfits, outfits.findIndex((o) => o.id === shown.id), (o) => setViewing(o.id))}
          title={`${character?.name ?? "Outfit"} · ${shown.title ?? "outfit"}`}
          // Folding sections like the character pop-up (owner's note, Oct 28).
          groups={[
            ...(character ? [{ label: "Character", section: "Character", values: [character.name] }] : []),
            ...(shown.items ?? []).map((i) => ({ label: pieces.find((p) => p.id === i.piece)!.label, section: "Outfit", values: [i.words?.trim() || (i.image ? `${pieces.find((p) => p.id === i.piece)!.label} from a photo` : pieces.find((p) => p.id === i.piece)!.label)] })),
            ...(shown.note ? [{ label: "Extra direction", section: "Direction", values: [shown.note] }] : []),
          ]}
          meta={[{ label: "Model", value: modelLabel(shown.model, "edit") }, ...(shown.seed !== undefined ? [{ label: "Seed", value: String(shown.seed) }] : []), { label: "Created", value: formatDate(shown.createdAt) }]}
          prompt={shown.prompt}
          onClose={() => setViewing(undefined)}
          actions={<>
            <button type="button" onClick={async () => { setViewing(undefined); if (character) onShootOutfit(character.id, shown.id); }}>{t("Use in storyboard")}</button>
            {editOn && <button type="button" className="ghost" onClick={() => setEditing(shown)}>{t("Edit image")}</button>}
            <a className="button ghost" href={shown.image} download={`${character?.name ?? "outfit"}-${shown.title ?? "outfit"}.png`}>Download</a>
          </>}
          more={<>
            {shown.items && <button type="button" className="link" onClick={async () => { setItems(shown.items!.map((i) => ({ ...i, key: newId() }))); setNote(shown.note ?? ""); setCustomPrompt(shown.customPrompt ?? ""); setGen({ ...gen, model: shown.model ?? gen.model, seed: shown.seed ?? gen.seed }); setViewing(undefined); setMessage("Settings loaded. Adjust them, then generate."); }} title="Load settings without generating">Adjust settings</button>}
            {shown.items && <button type="button" className="link" disabled={busy} onClick={async () => { setViewing(undefined); void dress(shown.items!, newSeed(), shown.model, shown); }} title="Generate immediately with a new seed">{t("Generate variation")}</button>}
            {shown.items && shown.seed !== undefined && <button type="button" className="link" disabled={busy} onClick={async () => { setViewing(undefined); void dress(shown.items!, shown.seed, shown.model, shown); }} title="Generate immediately using the saved seed">{t("Repeat with same seed")}</button>}
            <CopyImageLink image={shown.image} />
            <DeleteButton onClick={() => void remove(shown)} />
          </>}
        />
      )}
      {editing && (
        <EditModal
          image={editing.image}
          title={editing.title ?? "Outfit"}
          folder={character ? characterFolder(character.name, character.id) : undefined}
          onClose={() => setEditing(undefined)}
          onSave={async (edit) => {
            await library.savePhoto({ ...editing, id: newId(), image: edit.image, prompt: edit.prompt, model: edit.model, seed: edit.seed, parentId: editing.id, instruction: edit.instruction, title: `${editing.title ?? "Outfit"} · edited`, createdAt: Date.now() });
            await onChanged();
          }}
        />
      )}
    </>
  );
}
