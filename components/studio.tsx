"use client";
import { useLanguage } from "./language";

import { useCallback, useEffect, useState } from "react";
import type { Look } from "../lib/character";
import { characterFolder } from "../lib/folders";
import { library, type Character, type Photo, type Sheet } from "../lib/library";
import { updateOutputs } from "./client-api";
import { CharactersPanel } from "./characters-panel";
import { CreatePanel } from "./create-panel";
import { ScenesPanel } from "./scenes-panel";
import { SetupBanner } from "./setup-banner";
import { WardrobePanel } from "./wardrobe-panel";

const tabs = [
  { id: "characters", label: "Characters" },
  { id: "create", label: "Create" },
  { id: "wardrobe", label: "Wardrobe" },
  { id: "shoot", label: "Storyboard" },
] as const;

type Tab = (typeof tabs)[number]["id"];

// One-time chores, remembered per browser; storage can be unavailable (private mode).
function remembered(key: string) { try { return localStorage.getItem(key) === "1"; } catch { return true; } }
function remember(key: string) { try { localStorage.setItem(key, "1"); } catch { /* fine */ } }

export function Studio() {
  const { t: translateLabel } = useLanguage();
  const [tab, setTab] = useState<Tab>("create");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [characterId, setCharacterId] = useState<string>();
  // On the Characters tab, the open character page (none = the grid).
  const [pageId, setPageId] = useState<string>();
  // Who Storyboard should start with when opened from a character or outfit.
  const [sceneStart, setSceneStart] = useState<{ characterId: string; outfitId?: string; key: number }>();
  // Tiles to open Create with, set by "Change look" on a saved character.
  const [draft, setDraft] = useState<{ look: Look; key: number; customPrompt?: string }>();

  // Sheets made but not saved yet, newest first, shown on the empty pages.
  const [drafts, setDrafts] = useState<Sheet[]>([]);
  // A draft to open in Create's viewer, where it can be named and saved.
  const [openSheet, setOpenSheet] = useState<{ id: string; key: number }>();

  const refresh = useCallback(async () => {
    const [nextCharacters, nextPhotos, sheets] = await Promise.all([library.characters(), library.photos(), library.sheets()]);
    setCharacters(nextCharacters);
    setPhotos(nextPhotos);
    setDrafts(sheets.filter((s) => !nextCharacters.some((c) => c.id === s.savedAs?.id || c.references[0] === s.image)));
    setCharacterId((id) => id && nextCharacters.some((c) => c.id === id) ? id : nextCharacters[0]?.id);
  }, []);

  useEffect(() => { void refresh().then(() => library.characters()).then((list) => {
    if (list.length) setTab("characters");
    // Characters saved before character folders existed: move their sheets
    // into outputs/characters/<name> once, automatically (was a button, Oct 27).
    if (list.length && !remembered("folders-tidied")) {
      void updateOutputs({ tidy: list.map((c) => ({ folder: characterFolder(c.name, c.id), prompt: c.prompt ?? "" })) }).then((result) => { if (result) remember("folders-tidied"); });
    }
  }); }, [refresh]);
  // Sheets are made in Create without a refresh; look again when the tab changes.
  useEffect(() => { void refresh(); }, [tab, refresh]);
  // Ask the browser not to clear this app's storage when the disk gets full.
  useEffect(() => { void navigator.storage?.persist?.(); }, []);

  const [restoreTarget, setRestoreTarget] = useState<HTMLDivElement | null>(null);

  const pick = (id: string) => setCharacterId(id);
  const openScenes = (id: string, outfitId?: string) => { pick(id); setSceneStart({ characterId: id, outfitId, key: Date.now() }); setTab("shoot"); };
  const openDraft = (id: string) => { setOpenSheet({ id, key: Date.now() }); setTab("create"); };
  const editLook = (look: Look, customPrompt?: string) => { setDraft({ look, customPrompt, key: Date.now() }); setTab("create"); };

  return (
    <main className="shell">
      {/* One slim row: the big title and intro took ~380px on every tab (UX pass, Oct 27). */}
      <header className="topbar">
        <h1 className="brand" aria-label="AI Character Studio"><svg aria-hidden="true" width="36" height="32" viewBox="0 0 36 32" fill="none"><path d="M4 26L15 6L26 26M9 19H21M32 6V26" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg><span aria-hidden="true">CHARACTER / STUDIO</span></h1>
        <nav className="tabs" role="tablist" aria-label={translateLabel("Studio workspaces")}>
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-controls={`panel-${t.id}`} tabIndex={tab === t.id ? 0 : -1} onKeyDown={(event) => {
              const index = tabs.findIndex((item) => item.id === t.id);
              const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
              if (next < 0) return;
              event.preventDefault(); setTab(tabs[next].id);
              document.getElementById(`tab-${tabs[next].id}`)?.focus();
            }} aria-selected={tab === t.id} className={tab === t.id ? "tab active" : "tab"} onClick={() => setTab(t.id)}>{translateLabel(t.label)}</button>
          ))}
        </nav>
      </header>
      <SetupBanner />
      {/* Every tab stays mounted and only the open one shows, so a run started
          on one tab keeps its progress card when you look at another (Oct 26). */}
      <div className="studio-panel" role="tabpanel" id="panel-characters" aria-labelledby="tab-characters" tabIndex={0} hidden={tab !== "characters"}>
        <CharactersPanel
          characters={characters}
          photos={photos}
          characterId={pageId}
          onPickCharacter={setPageId}
          onChanged={refresh}
          onCreate={() => setTab("create")}
          drafts={drafts}
          onOpenDraft={openDraft}
          onWardrobe={(id) => { pick(id); setTab("wardrobe"); }}
          onShoot={openScenes}
          onEditLook={editLook}
        />
      </div>
      <div className="studio-panel" role="tabpanel" id="panel-create" aria-labelledby="tab-create" tabIndex={0} hidden={tab !== "create"}>
        <CreatePanel
          restoreTarget={restoreTarget}
          draft={draft}
          openSheet={openSheet}
          characters={characters}
          onChanged={refresh}
          onOpenShoot={(id) => openScenes(id)}
        />
      </div>
      <div className="studio-panel" role="tabpanel" id="panel-wardrobe" aria-labelledby="tab-wardrobe" tabIndex={0} hidden={tab !== "wardrobe"}>
        <WardrobePanel
          characters={characters}
          photos={photos}
          characterId={characterId}
          onPickCharacter={pick}
          onChanged={refresh}
          onCreate={() => setTab("create")}
          drafts={drafts}
          onOpenDraft={openDraft}
          onShootOutfit={openScenes}
        />
      </div>
      <div className="studio-panel" role="tabpanel" id="panel-shoot" aria-labelledby="tab-shoot" tabIndex={0} hidden={tab !== "shoot"}>
        <ScenesPanel characters={characters} photos={photos} start={sceneStart} onChanged={refresh} onCreate={() => setTab("create")} drafts={drafts} onOpenDraft={openDraft} />
      </div>
      <footer className="site-footer"><div className="footer-tools"><div ref={setRestoreTarget} />
      <details className="storage-note"><summary>Storage & generation costs</summary><p>Characters are stored in this browser. Image files are also saved to the outputs folder unless file saving is disabled. Cloud generation uses your Comfy account’s credits; local generation uses your own hardware.</p></details></div><p className="site-credit">Built by <a href="https://x.com/birddogai" target="_blank" rel="noopener noreferrer">birddogai<span className="sr-only"> on X (opens in a new tab)</span></a></p></footer>
    </main>
  );
}
