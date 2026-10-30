"use client";
import { notifySuccess } from "./toast";
import { confirmAction } from "./confirmation";

import { editOn } from "../lib/edit";
import { DeleteButton } from "./delete-button";

import { updateOutputs } from "./client-api";
import { StudioEmpty } from "./studio-empty";

import { useRef, useState } from "react";
import { formatDate, lookChips, shotChips } from "../lib/details";
import { sceneChips } from "../lib/scene";
import type { Look } from "../lib/character";
import { characterFolder } from "../lib/folders";
import { library, newId, type Character, type Photo, type Sheet } from "../lib/library";
import { CopyImageLink } from "./copy-image-link";
import { DetailsModal, steps } from "./details-modal";
import { EditModal } from "./edit-modal";
import { modelLabel } from "./model-seed";

type Props = {
  characters: Character[];
  photos: Photo[];
  characterId?: string;
  onPickCharacter: (id: string | undefined) => void;
  onChanged: () => Promise<void>;
  onCreate: () => void;
  /** Sheets made but not saved yet, and a way to open one in Create. */
  drafts: Sheet[];
  onOpenDraft: (sheetId: string) => void;
  onWardrobe: (id: string) => void;
  onShoot: (id: string, outfitId?: string) => void;
  onEditLook: (look: Look, customPrompt?: string) => void;
};

const sections = [
  { kind: "outfit", title: "Outfits", empty: "No outfits yet. Dress them in Wardrobe." },
  { kind: "photo", title: "Scenes", empty: "Single scenes from before the Storyboard page show up here." },
  { kind: "storyboard", title: "Storyboards", empty: "No storyboards yet. Make one in Storyboard." },
  { kind: "edit", title: "Edits", empty: "Edits you keep show up here." },
] as const;

// Home: every character, and one page per character with everything made
// from them, grouped by kind, so nothing gets lost in one long list.
export function CharactersPanel({ characters, photos, characterId, onPickCharacter, onChanged, onCreate, drafts, onOpenDraft, onWardrobe, onShoot, onEditLook }: Props) {
  const [query, setQuery] = useState("");
  const [assetQuery, setAssetQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [assetSort, setAssetSort] = useState("newest");
  const [filter, setFilter] = useState("all");
  const scroll = useRef(0);
  const belongs = (p: Photo, id: string) => p.characterId === id || p.scene?.cast.some((m) => m.characterId === id);
  const visible = characters.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())).sort((a,b) => sort === "name" ? a.name.localeCompare(b.name) : b.createdAt-a.createdAt);
  async function renameCharacter(c: Character) {
    const name = window.prompt("Character name", c.name)?.trim().slice(0,40);
    if (!name || name === c.name) return;
    await library.saveCharacter({ ...c, name });
    await updateOutputs({ rename: { from: characterFolder(c.name,c.id), to: characterFolder(name,c.id) } });
    for (const sheet of await library.sheets()) if (sheet.savedAs?.id === c.id) await library.keepSheet({ ...sheet, savedAs: { id:c.id,name }, file:sheet.file?.replace(characterFolder(c.name,c.id),characterFolder(name,c.id)) });
    await onChanged();
  }
  const [viewing, setViewing] = useState<Photo | "sheet">();
  const [editing, setEditing] = useState<{ image: string; parent?: Photo }>();
  // Select mode on the home grid: tick several characters, then delete them.
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const character = characters.find((c) => c.id === characterId);

  async function removeSelected() {
    const picked = characters.filter((c) => selected.has(c.id));
    if (!picked.length) return;
    if (!await confirmAction(`Delete ${picked.length === 1 ? picked[0].name : `${picked.length} characters`}? Their photos stay in the library, and the files in your outputs folder stay too.`, async () => {
      for (const c of picked) await library.removeCharacter(c);
    })) return;
    notifySuccess("Characters deleted");
    setSelecting(false); setSelected(new Set());
    await onChanged();
  }

  if (!characters.length) {
    return (
      <StudioEmpty area="characters" drafts={drafts} onCreate={onCreate} onOpenDraft={onOpenDraft} />
    );
  }

  if (!character) {
    return (
      <section className="home character-library"><div className="library-toolbar"><h2>Characters <small>{characters.length}</small></h2><input type="search" aria-label="Search characters" placeholder="Search characters" value={query} onChange={(e) => setQuery(e.target.value)}/><select aria-label="Sort characters" value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">Newest first</option><option value="name">Name A–Z</option></select><button type="button" onClick={onCreate}>+ New character</button></div>
        <div className="select-bar" role="toolbar" aria-label="Selection">
          {selecting ? (
            <>
              <strong>{selected.size} selected</strong>
              <button type="button" className="link" onClick={() => setSelected(new Set(visible.map((c) => c.id)))}>Select matching</button>
              {selected.size > 0 && <button type="button" className="link" onClick={() => setSelected(new Set())}>Clear</button>}
              <button type="button" className="danger-button small-button" disabled={!selected.size} onClick={() => void removeSelected()}>Delete selected</button>
              <button type="button" className="ghost small-button" onClick={async () => { setSelecting(false); setSelected(new Set()); }}>Done</button>
            </>
          ) : (
            <>
              <span className="hint">{characters.length} character{characters.length === 1 ? "" : "s"}</span>
              <button type="button" className="ghost small-button select-right" onClick={() => setSelecting(true)}>Select</button>
            </>
          )}
        </div>
        <div className="cards">
          {visible.map((c) => {
            const items = photos.filter((p) => belongs(p,c.id));
            const count = sections.map((section) => { const n=items.filter((p) => (p.kind ?? "photo")===section.kind).length; return n ? `${n} ${section.title.toLowerCase()}` : ""; }).filter(Boolean).join(" · ") || "Main sheet";
            const on = selected.has(c.id);
            return (
              <article key={c.id} className="library-card"><button type="button" className={`sheet-card home-card${on ? " selected" : ""}`} aria-pressed={selecting ? on : undefined} onClick={() => selecting ? setSelected((current) => { const next = new Set(current); if (next.has(c.id)) next.delete(c.id); else next.add(c.id); return next; }) : (() => { scroll.current=window.scrollY; setFilter("all"); setAssetQuery(""); onPickCharacter(c.id); window.scrollTo(0,0); })()}>
                {selecting && <span className={`select-check${on ? " on" : ""}`} aria-hidden="true">{on ? "✓" : ""}</span>}
                <img src={c.references[0]} alt="" />
                <span className="card-title"><strong>{c.name}</strong><small>{count}</small></span>
              </button>{!selecting && <details className="card-menu"><summary aria-label={`Actions for ${c.name}`}>⋯</summary><button type="button" onClick={() => void renameCharacter(c)}>Rename</button><button type="button" onClick={async () => { setSelecting(true); setSelected(new Set([c.id])); }}>Select</button></details>}</article>
            );
          })}
          {!visible.length && <p className="hint">No matching characters.</p>}
        </div>
      </section>
    );
  }

  // Scenes with several characters show on every cast member's page.
  const mine = photos.filter((p) => belongs(p, character.id));
  async function remove(photo: Photo) {
    if (!await confirmAction("Delete this image? This can't be undone.", () => library.deletePhoto(photo.id))) return;
    notifySuccess("Image deleted");
    setViewing(undefined);
    await onChanged();
  }

  const shown = viewing === "sheet" ? undefined : viewing;
  // The arrows follow the page's order: outfits, scenes, storyboards, edits.
  const ordered = mine.filter((p) => (filter === "all" || (p.kind ?? "photo") === filter) && (p.title ?? p.instruction ?? p.kind ?? "photo").toLowerCase().includes(assetQuery.toLowerCase())).sort((a,b) => assetSort === "name" ? (a.title ?? "").localeCompare(b.title ?? "") : b.createdAt-a.createdAt);
  return (
    <>
      <section className="character-page">
        <div className="page-head">
          <button type="button" className="link" onClick={async () => { onPickCharacter(undefined); requestAnimationFrame(() => window.scrollTo(0,scroll.current)); }}>← All characters</button>
          <h2>{character.name}</h2>
          <div className="page-actions">
            <button type="button" onClick={() => onWardrobe(character.id)}>+ Outfit</button>
            <button type="button" className="ghost" onClick={() => onShoot(character.id)}>+ Storyboard</button>
          </div>
        </div>
        <div className="character-overview"><button type="button" className="result-button main-sheet" onClick={() => setViewing("sheet")}>
          <img src={character.references[0]} alt={`${character.name} character sheet`} />
        </button><div className="character-overview-info"><span className="section-label">Main sheet</span><h2>{character.name}</h2><div className="overview-actions"><a className="button" href={character.references[0]} download={`${character.name}-sheet.png`}>Download sheet</a>{editOn && <button type="button" className="ghost" onClick={() => setEditing({image:character.references[0]})}>Edit image</button>}<button type="button" className="link" onClick={() => void renameCharacter(character)}>Rename</button></div></div></div>
        <div className="library-toolbar asset-toolbar"><div className="asset-filters"><button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All {mine.length}</button>{sections.filter((section) => mine.some((p) => (p.kind ?? "photo") === section.kind)).map((section) => <button type="button" key={section.kind} aria-pressed={filter === section.kind} onClick={() => setFilter(section.kind)}>{section.title} {mine.filter((p) => (p.kind ?? "photo") === section.kind).length}</button>)}</div><input type="search" aria-label="Search assets" placeholder="Search assets" value={assetQuery} onChange={(e) => setAssetQuery(e.target.value)}/><select aria-label="Sort assets" value={assetSort} onChange={(e) => setAssetSort(e.target.value)}><option value="newest">Newest first</option><option value="name">Name A–Z</option></select></div>
        <div className="asset-grid">{ordered.map((item) => <article className="asset-card" key={item.id}><button type="button" className="asset-open" onClick={() => setViewing(item)}><img src={item.image} alt=""/><strong>{item.title ?? item.instruction ?? (item.kind === "storyboard" ? "Storyboard" : item.kind === "outfit" ? "Outfit" : "Image")}</strong><small>{item.kind ?? "photo"} · {formatDate(item.createdAt)}</small></button><details className="card-menu"><summary aria-label={`Actions for ${item.title ?? "image"}`}>⋯</summary><a href={item.image} download={`${character.name}-${item.kind ?? "image"}.png`}>Download</a><button type="button" onClick={async () => { const title=window.prompt("Image title",item.title ?? "")?.trim(); if(title){ await library.savePhoto({...item,title:title.slice(0,100)}); await onChanged(); } }}>Rename</button><DeleteButton onClick={() => void remove(item)} /></details></article>)}</div>
        {!ordered.length && <p className="hint">{mine.length ? "No matching images." : "Create an outfit or storyboard to add to this character."}</p>}
      </section>
      {viewing === "sheet" && (
        <DetailsModal
          image={character.references[0]}
          title={character.name}
          groups={character.look ? lookChips(character.look) : []}
          meta={[{ label: "Model", value: modelLabel(character.model, "sheet") }, ...(character.seed !== undefined ? [{ label: "Seed", value: String(character.seed) }] : []), { label: "Created", value: formatDate(character.createdAt) }]}
          prompt={character.prompt}
          description={character.description}
          onClose={() => setViewing(undefined)}
          actions={<>
            {editOn && <button type="button" onClick={async () => { setEditing({ image: character.references[0] }); setViewing(undefined); }}>Edit image</button>}
            {character.look && <button type="button" className="ghost" onClick={async () => { setViewing(undefined); onEditLook(character.look!, character.customPrompt); }} title="Load settings without generating">Adjust settings</button>}
            <a className="button ghost" href={character.references[0]} download={`${character.name}-character-sheet.png`}>Download</a>
          </>}
          more={<CopyImageLink image={character.references[0]} />}
        />
      )}
      {shown && (
        <DetailsModal
          image={shown.image}
          {...steps(ordered, ordered.findIndex((p) => p.id === shown.id), setViewing)}
          title={`${character.name} · ${shown.title ?? (shown.kind === "edit" ? "edit" : "photo")}`}
          groups={shown.scene ? sceneChips(shown.scene, shown.scene.cast.map((m) => characters.find((c) => c.id === m.characterId)?.name ?? "Deleted")) : shown.shot ? shotChips(shown.shot, shown.note) : shown.instruction ? [{ label: "Edit", values: [shown.instruction] }] : []}
          meta={[{ label: "Model", value: modelLabel(shown.model, "edit") }, ...(shown.seed !== undefined ? [{ label: "Seed", value: String(shown.seed) }] : []), { label: "Created", value: formatDate(shown.createdAt) }]}
          prompt={shown.prompt}
          onClose={() => setViewing(undefined)}
          actions={<>
            {shown.kind === "outfit" && <button type="button" onClick={() => onShoot(character.id, shown.id)}>Use in storyboard</button>}
            {shown.kind === "edit" && !shown.shot && <button type="button" className="ghost" onClick={async () => {
              if (!await confirmAction(`Use this as ${character.name}'s main sheet? The old sheet is kept under Edits.`)) return;
              await library.savePhoto({ id: newId(), characterId: character.id, kind: "edit", image: character.references[0], prompt: character.prompt ?? "", model: character.model, seed: character.seed, instruction: "Previous main sheet", createdAt: Date.now() });
              await library.saveCharacter({ ...character, references: [shown.image, ...character.references.slice(1)] });
              setViewing(undefined);
              await onChanged();
            }}>Make main sheet</button>}
            {editOn && <button type="button" className={shown.kind === "outfit" ? "ghost" : ""} onClick={async () => { setEditing({ image: shown.image, parent: shown }); setViewing(undefined); }}>Edit image</button>}
            <a className="button ghost" href={shown.image} download={`${character.name}-${shown.kind ?? "photo"}.png`}>Download</a>
          </>}
          more={<>
            <CopyImageLink image={shown.image} />
            <DeleteButton onClick={() => void remove(shown)} />
          </>}
        />
      )}
      {editing && (
        <EditModal
          image={editing.image}
          title={character.name}
          folder={characterFolder(character.name, character.id)}
          onClose={() => setEditing(undefined)}
          onSave={async (edit) => {
            // Edited outfits stay wearable; everything else is filed under Edits.
            const parent = editing.parent;
            const kind = parent?.kind === "outfit" ? "outfit" : "edit";
            await library.savePhoto({
              ...(parent ?? {}), id: newId(), characterId: character.id, kind, image: edit.image, prompt: edit.prompt,
              model: edit.model, seed: edit.seed, parentId: parent?.id, instruction: edit.instruction,
              title: kind === "outfit" ? `${parent?.title ?? "Outfit"} · edited` : undefined, createdAt: Date.now(),
            });
            await onChanged();
          }}
        />
      )}
    </>
  );
}
