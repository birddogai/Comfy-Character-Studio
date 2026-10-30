"use client";
import { castReference } from "../lib/cast-reference";
import { notifySuccess } from "./toast";
import { confirmAction } from "./confirmation";
import { useLanguage } from "./language";

import { newSeed } from "../lib/models";
import { CustomPrompt } from "./custom-prompt";
import { DeleteButton } from "./delete-button";

import { StudioEmpty } from "./studio-empty";

import { useEffect, useRef, useState } from "react";
import { formatDate, shotChips } from "../lib/details";
import { characterFolder } from "../lib/folders";
import { library, newId, type Character, type Photo, type Sheet } from "../lib/library";
import { angles, durations, formats, framings, looks, maxCast, maxShots, placeGroups, planShots, pace, ratios, shotCounts, sceneChips, storyboardPrompt, timing, type FormatId, type SceneSettings, type Shot } from "../lib/scene";
import { CopyImageLink } from "./copy-image-link";
import { DetailsModal, steps } from "./details-modal";
import { editOn } from "../lib/edit";
import { EditModal } from "./edit-modal";
import { fileToDataUrl, postJson, type ImageResult } from "./client-api";
import { ModelSeed, modelLabel, useGen, takeSeed, type Gen } from "./model-seed";
import { Pending } from "./pending";
import { WeirdnessPicker } from "./weirdness-picker";
import type { Weirdness } from "../lib/character";

type Props = {
  characters: Character[];
  photos: Photo[];
  /** Who to start with (and in which outfit), e.g. from "Shoot in this outfit"; a new key applies it. */
  start?: { characterId: string; outfitId?: string; key: number };
  onChanged: () => Promise<void>;
  onCreate: () => void;
  /** Sheets made but not saved yet, and a way to open one in Create. */
  drafts: Sheet[];
  onOpenDraft: (sheetId: string) => void;
};

type Row = Shot & { key: string };
type Member = SceneSettings["cast"][number];
type Result = ImageResult & { model: Gen["model"]; seed?: number };

const row = (shot: Shot): Row => ({ ...shot, key: newId() });
const lookGroups = [...new Set(looks.map((l) => l.group))];
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Step 3: Storyboard (was Scenes, Oct 29). A short brief (who, where, what
// happens, how long, which film look) becomes ONE storyboard image: every frame
// in a grid, made in a single run. The frames are worked out from the brief;
// the shot list is an advanced option, not a step (the owner's note, Oct 29).
// It's the third reference for video models, after the character and outfit sheets.
export function ScenesPanel({ characters, photos, start, onChanged, onCreate, drafts, onOpenDraft }: Props) {
  const { t } = useLanguage();
  const [format, setFormat] = useState<FormatId>("story");
  const [cast, setCast] = useState<Member[]>([]);
  useEffect(() => { if (start) setCast([{ characterId: start.characterId, outfitId: start.outfitId }]); }, [start]);
  useEffect(() => { if (!start && characters[0]) setCast((current) => current.length ? current : [{ characterId: characters[0].id }]); }, [characters, start]);
  const [brief, setBrief] = useState("");
  const [seconds, setSeconds] = useState<number>(8);
  const [frames, setFrames] = useState<number>(4);
  const [where, setWhere] = useState<SceneSettings["where"]>("brief");
  const [scene, setScene] = useState<string>(formats[0].place);
  const [location, setLocation] = useState("");
  const [place, setPlace] = useState<string>();
  const [product, setProduct] = useState("");
  const [productImage, setProductImage] = useState<string>();
  const [look, setLook] = useState<SceneSettings["look"]>("film");
  const [ratio, setRatio] = useState<SceneSettings["ratio"]>("16:9");
  const [plan, setPlan] = useState<Row[]>([]);
  /** Once the shot list is changed by hand it's used as is; until then it follows the brief. */
  const [edited, setEdited] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  // Qwen writes the shots from the brief (Oct 29); kept until the brief or picks change.
  const [creative, setCreative] = useState(true);
  const [ideas, setIdeas] = useState<{ key: string; shots: Shot[]; source: string }>();
  const [weird, setWeird] = useState<Weirdness>(0);
  const [customPrompt, setCustomPrompt] = useState("");
  const [gen, setGen] = useGen("board", "qwen-2.1");
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState<string>();
  const [message, setMessage] = useState("Pick the cast and say what happens.");
  const [error, setError] = useState(false);
  const [mention, setMention] = useState<{ query: string; at: number }>();
  const [editing, setEditing] = useState<Photo>();
  const [viewing, setViewing] = useState<string>();
  const [boardQuery, setBoardQuery] = useState("");
  const [boardCast, setBoardCast] = useState("all");
  const briefBox = useRef<HTMLTextAreaElement>(null);

  if (!characters.length) return <StudioEmpty area="scenes" drafts={drafts} onCreate={onCreate} onOpenDraft={onOpenDraft} />;

  const fmt = formats.find((f) => f.id === format)!;
  const nameOf = (id: string) => characters.find((c) => c.id === id)?.name ?? "Deleted";
  const outfitsOf = (id: string) => photos.filter((p) => p.characterId === id && p.kind === "outfit");
  const resolveMember = (m: Member) => castReference(m, characters, photos);
  const sheetOf = (m: Member) => resolveMember(m).image;
  const wordsOf = (m: Member) => { const { image: _, ...words } = resolveMember(m); return words; };
  const folderOf = (id: string) => { const c = characters.find((x) => x.id === id); return c ? characterFolder(c.name, c.id) : undefined; };
  const members = cast.filter((m) => characters.some((c) => c.id === m.characterId));
  const lead = members[0] ? nameOf(members[0].characterId) : "the character";
  const boards = photos.filter((p) => p.scene || p.kind === "storyboard").sort((a, b) => b.createdAt - a.createdAt);
  const visibleBoards = boards.filter((p) => (boardCast === "all" || p.characterId === boardCast || p.scene?.cast.some((m) => m.characterId === boardCast)) && `${p.title ?? ""} ${p.scene?.brief ?? ""} ${(p.scene?.cast ?? []).map((m) => nameOf(m.characterId)).join(" ")}`.toLowerCase().includes(boardQuery.toLowerCase()));
  const result = photos.find((p) => p.id === current);
  const shown = photos.find((p) => p.id === viewing);
  const settings = (): SceneSettings => ({
    customPrompt: customPrompt.trim() || undefined, cast: members, where, scene, location, ...(where === "photo" && place ? { place } : {}), look, ratio, shots: edited ? plan.map(({ key: _, ...shot }) => shot) : planShots(brief, frames, format, lead, product), weird,
    format, brief, seconds, ...(product.trim() ? { product } : {}), ...(productImage ? { productImage } : {}),
  });

  function pickFormat(id: FormatId) {
    setFormat(id);
  }

  function addMember(id: string) {
    setCast((list) => list.some((m) => m.characterId === id) || list.length >= maxCast ? list : [...list, { characterId: id }]);
  }

  /** Swaps one cast member for another; their @mentions and frame actions follow. */
  function swap(oldId: string, newId: string) {
    if (oldId === newId) return;
    const from = nameOf(oldId), to = nameOf(newId);
    setCast((list) => list.some((m) => m.characterId === newId) ? list : list.map((m) => m.characterId === oldId ? { characterId: newId, role: m.role } : m));
    const words = new RegExp(`(@?)\\b${escape(from)}\\b`, "g");
    setBrief((text) => text.replace(words, `$1${to}`));
    setPlan((rows) => rows.map((r) => ({ ...r, action: r.action.replace(words, `$1${to}`) })));
  }

  function remove(id: string) {
    setCast((list) => list.filter((m) => m.characterId !== id));
  }

  // "@" in the brief suggests characters; picking one names them and adds them to the cast.
  function typeBrief(text: string, caret: number) {
    setBrief(text);
    const match = /@([^\s@]*)$/.exec(text.slice(0, caret));
    setMention(match ? { query: match[1].toLowerCase(), at: caret - match[0].length } : undefined);
  }
  function pickMention(c: Character) {
    if (!mention) return;
    const end = mention.at + 1 + mention.query.length;
    const text = `${brief.slice(0, mention.at)}@${c.name} ${brief.slice(end)}`;
    setBrief(text); setMention(undefined); addMember(c.id);
    requestAnimationFrame(() => { const box = briefBox.current; if (box) { box.focus(); const at = mention.at + c.name.length + 2; box.setSelectionRange(at, at); } });
  }
  const suggestions = mention ? characters.filter((c) => c.name.toLowerCase().startsWith(mention.query)).slice(0, 6) : [];

  const openAdvanced = () => setAdvanced((v) => !v);

  /** The shots Qwen writes for the current brief (reused until something changes), or the template plan. */
  async function fetchIdeas(force = false): Promise<Shot[]> {
    if (members.some(m => !sheetOf(m))) throw new Error("Choose a valid character and outfit reference first.");
    if (!creative) return planShots(brief, frames, format, lead, product);
    if (!force && ideas?.key === ideaKey) return ideas.shots;
    setMessage("Qwen is writing the shots…");
    try {
      const reply = await postJson<{ shots: Shot[]; source: string }>("/api/plan", {
        brief, count: frames, format, look, seconds, weird, product, ...(productImage ? { productImage } : {}),
        place: where === "brief" ? "Use the location described in the brief" : where === "words" ? location : where === "preset" ? scene : "a place from a reference photo",
        cast: members.map(wordsOf),
      });
      setIdeas({ key: ideaKey, shots: reply.shots, source: reply.source });
      setPlan(reply.shots.map(row));
      return reply.shots;
    } catch (cause) {
      setMessage(`Qwen couldn't write the shots (${cause instanceof Error ? cause.message : "unknown error"}), so the simple plan is used.`);
      return planShots(brief, frames, format, lead, product);
    }
  }

  async function newIdeas() {
    if (busy || !brief.trim()) return;
    setBusy(true); setError(false);
    try { await fetchIdeas(true); setEdited(false); setMessage("New shots written. Change any of them, or make the storyboard."); }
    catch (cause) { setError(true); setMessage(cause instanceof Error ? cause.message : "Could not plan shots."); }
    finally { setBusy(false); }
  }

  async function make(seed?: number, model: Gen["model"] = gen.model, given?: SceneSettings) {
    if (busy) return;
    const draft = given ?? settings();
    const people = draft.cast.filter((m) => characters.some((c) => c.id === m.characterId));
    if (!people.length) { setError(true); return setMessage("Pick at least one character."); }
    if (!draft.brief?.trim() && !draft.customPrompt?.trim() && !edited && !given) { setError(true); return setMessage("Say what happens first, e.g. who does what, where."); }
    if (people.some(m => !sheetOf(m))) { setError(true); return setMessage("A selected character or outfit reference is missing. Choose another before generating."); }
    let s = draft;
    if (!given && !edited && !draft.customPrompt?.trim()) {
      setBusy(true); setError(false);
      try { s = { ...draft, shots: await fetchIdeas() }; } finally { setBusy(false); }
    }
    if (s.shots.some((r) => !r.action.trim())) { setError(true); return setMessage("Every frame needs an action."); }
    if (s.where === "photo" && !s.place) { setError(true); return setMessage("Choose a location photo, or pick a place."); }
    const sheets = people.map(sheetOf);
    if (sheets.some((x) => !x)) { setError(true); return setMessage("A cast member's sheet is missing."); }
    let use = seed;
    if (use === undefined) { const [next, nextGen] = takeSeed(gen); use = next; setGen(nextGen); }
    setBusy(true); setError(false); setCurrent(undefined);
    setMessage(`Making the ${s.shots.length}-frame storyboard with ${modelLabel(model, "board")} (one image)…`);
    try {
      const words = s.where === "words" ? s.location : s.where === "preset" ? s.scene : "";
      const made = await postJson<Result>("/api/scene", {
        references: sheets,
        cast: people.map(wordsOf),
        folder: folderOf(people[0].characterId),
        customPrompt: s.customPrompt, ...(s.where === "brief" ? { brief: s.brief } : {}), shots: s.shots, look: s.look, ratio: s.ratio, weird: s.weird ?? 0, model, seed: use, format: s.format ?? format,
        ...(words.trim() ? { location: words } : {}), ...(s.where === "photo" && s.place ? { place: s.place } : {}),
        ...(s.product?.trim() ? { product: s.product } : {}), ...(s.productImage ? { productImage: s.productImage } : {}),
      });
      const id = newId();
      await library.savePhoto({ id, characterId: people[0].characterId, kind: "storyboard", scene: s, customPrompt: s.customPrompt, title: s.brief?.trim().slice(0, 70) || `${s.shots.length}-frame storyboard`, image: made.image, prompt: made.prompt, model: made.model, seed: made.seed, createdAt: Date.now() });
      await onChanged();
      setCurrent(id);
      setMessage("Storyboard saved. Download it, redo it, or change frames and go again.");
      notifySuccess("Storyboard saved");
    } catch (cause) { setError(true); setMessage(cause instanceof Error ? cause.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  /** "Use these settings": everything behind a saved board comes back. */
  function use(s: SceneSettings) {
    setCast(s.cast.filter((m) => characters.some((c) => c.id === m.characterId)));
    setCustomPrompt(s.customPrompt ?? "");
    if (s.format) setFormat(s.format === "custom" ? "story" : s.format);
    setBrief(s.brief ?? ""); if (s.seconds) setSeconds(s.seconds); setFrames(s.shots.length);
    setWhere(s.where); setScene(s.scene); setLocation(s.location); setPlace(s.place); setLook(s.look); setRatio(s.ratio);
    setProduct(s.product ?? ""); setProductImage(s.productImage);
    setPlan(s.shots.map(row)); setEdited(true); setWeird(s.weird ?? 0);
    setViewing(undefined);
    setMessage("Settings loaded. Change anything, then make it again.");
  }

  async function removeBoard(photo: Photo) {
    if (!await confirmAction("Delete this storyboard? This can't be undone.", () => library.deletePhoto(photo.id))) return;
    notifySuccess("Storyboard deleted");
    if (current === photo.id) setCurrent(undefined);
    setViewing(undefined);
    await onChanged();
  }

  const ideaKey = JSON.stringify([brief, frames, format, members.map(resolveMember), product, productImage, seconds, look, weird, where, scene, location, place]);
  const fresh = creative && ideas?.key === ideaKey;
  const shots = edited ? plan : fresh ? ideas.shots : planShots(brief, frames, format, lead, product);
  // The rows on screen: the hand-made list, or the one worked out from the brief right now.
  const rows: Row[] = edited ? plan : shots.map((shot, i) => ({ ...shot, key: plan[i]?.key ?? String(i) }));
  const editRows = (change: (list: Row[]) => Row[]) => { setEdited(true); setPlan(change(rows)); };
  const set = (key: string, change: Partial<Row>) => editRows((list) => list.map((r) => r.key === key ? { ...r, ...change } : r));
  const castWords = members.map(wordsOf);
  const preview = members.length ? storyboardPrompt(gen.model, shots, {
    cast: castWords, look, ratio, brief: where === "brief" ? brief : undefined, location: where === "words" ? location : where === "preset" ? scene : "", hasPlace: where === "photo" && Boolean(place), product, hasProduct: Boolean(productImage), weird, format,
  }) : "";
  const upload = (setter: (url: string) => void) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) try { setter(await fileToDataUrl(file, 1536, 256)); setError(false); } catch (cause) { setError(true); setMessage(cause instanceof Error ? cause.message : "Could not read that photo."); }
  };

  return (
    <>
      <section className="workspace">
        <div className="controls"><div className="controls-scroll">
          <div className="builder-heading"><h2>{t("New storyboard")}</h2><p className="hint">Choose your cast, describe the action, and create a sequence of images.</p></div>
          <div className="field">Storyboard type
            <div className="segmented" role="radiogroup" aria-label="Storyboard type">
              {formats.filter((f) => f.id !== "custom").map((f) => <button key={f.id} type="button" role="radio" aria-checked={format === f.id} className={format === f.id ? "active" : ""} onClick={() => pickFormat(f.id)}>{t(f.label)}</button>)}
            </div>
            <small className="hint">{fmt.hint}</small><button type="button" className="link recommended-settings" disabled={busy} onClick={async () => { setLook(fmt.look); setRatio(fmt.ratio); }}>Use recommended look &amp; shape ({fmt.ratio})</button>
          </div>

          {/* Photo first, then what it is (the owner's layout note, Oct 29). A div holds the
              layout: <details> doesn't lay out as a grid in every browser, so the button overlapped the hint. */}
          <details className="field product" open={format === "ugc"}>
            <summary>{format === "ugc" ? t("Product reference") : t("Prop or product · optional")}</summary>
            <div className="product-body"><p className="hint">{format === "ugc" ? "Show the item your creator will feature. Add a photo for a closer visual match." : "Add an object that matters to the story, such as a bag, drink or keepsake."}</p>
              {productImage ? (
                <div className="product-row">
                  <img className="thumb" src={productImage} alt="Product" />
                  <div className="product-actions">
                    <label className="button ghost small-button">Change photo
                      <input type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={upload(setProductImage)} />
                    </label>
                    <button type="button" className="link danger" onClick={() => setProductImage(undefined)}>{t("Remove")}</button>
                  </div>
                </div>
              ) : (
                <label className="button ghost small-button product-photo-add">Add a product photo
                  <input type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={upload(setProductImage)} />
                </label>
              )}
              <label className="field">What is it?
                <input value={product} maxLength={120} placeholder="e.g. a lavender canvas sneaker" onChange={(event) => setProduct(event.target.value)} />
              </label>
              <small className="hint">Logos and packaging come out close, not exact: check them before you use the board.</small>
            </div>
          </details>

          <div className="field">Cast <small className="hint">Up to {maxCast}. Type @ in the description to add someone.</small>
            <div className="cast-chips">
              {members.map((m) => {
                const c = characters.find((x) => x.id === m.characterId)!;
                const outfits = outfitsOf(m.characterId);
                return (
                  <div key={m.characterId} className="cast-chip">
                    <img src={sheetOf(m)} alt="" />
                    <div className="cast-chip-fields">
                      <select value={m.characterId} aria-label={`Swap ${c.name}`} onChange={(event) => swap(m.characterId, event.target.value)}>
                        {characters.filter((x) => x.id === m.characterId || !members.some((y) => y.characterId === x.id)).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                      </select>
                      <select value={m.outfitId ?? ""} aria-label={`${c.name} wears`} onChange={(event) => setCast((list) => list.map((y) => y.characterId === m.characterId ? { ...y, outfitId: event.target.value || undefined } : y))}>
                        <option value="">{t("Original outfit")}</option>
                        {outfits.map((o) => <option key={o.id} value={o.id}>{o.title ?? "Outfit"}</option>)}
                      </select>
                    </div>
                    <button type="button" className="link danger" aria-label={`Remove ${c.name}`} onClick={() => remove(m.characterId)}>✕</button>
                  </div>
                );
              })}
              {members.length < maxCast && characters.some((c) => !members.some((m) => m.characterId === c.id)) && (
                <select value="" aria-label="Add a character" onChange={(event) => { if (event.target.value) addMember(event.target.value); }}>
                  <option value="">+ Add a character</option>
                  {characters.filter((c) => !members.some((m) => m.characterId === c.id)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>
          </div>

          <div className="field mention-wrap"><label htmlFor="story-brief">{t("What happens?")}</label>
            <textarea id="story-brief" ref={briefBox} value={brief} maxLength={1200} rows={4}
              placeholder={fmt.example.replace("@Name", `@${lead}`)}
              onChange={(event) => typeBrief(event.target.value, event.target.selectionStart)}
              onKeyDown={(event) => { if (mention && suggestions.length && (event.key === "Enter" || event.key === "Tab")) { event.preventDefault(); pickMention(suggestions[0]); } if (event.key === "Escape") setMention(undefined); }}
              onBlur={() => setTimeout(() => setMention(undefined), 150)} />
            {suggestions.length > 0 && (
              <div className="mention-list" role="listbox" aria-label="Characters">
                {suggestions.map((c) => (
                  <button key={c.id} type="button" role="option" aria-selected={false} onMouseDown={(event) => { event.preventDefault(); pickMention(c); }}>
                    <img src={c.references[0]} alt="" /> {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid-2">
            <label className="field">Planned duration
              <select value={seconds} onChange={(event) => setSeconds(Number(event.target.value))}>
                {durations.map((d) => <option key={d} value={d}>{d} seconds</option>)}
              </select>
            </label>
            <label className="field">Shots
              <select value={edited ? plan.length : frames} disabled={edited} title={edited ? "Set by your shot list (Advanced)" : undefined} onChange={(event) => setFrames(Number(event.target.value))}>
                {shotCounts.map((n) => <option key={n} value={n}>{n} shots · {pace(seconds, n)}</option>)}
                {edited && !shotCounts.includes(plan.length as never) && <option value={plan.length}>{plan.length} shots</option>}
              </select>
            </label>
          </div>
          <div className="field">Frame shape
            <div className="ratio-options" aria-label="Aspect ratio">{ratios.map((r) => { const [w,h] = r.split(":").map(Number); const label = r === "16:9" ? t("Landscape") : r === "9:16" ? t("Portrait") : r === "4:5" ? t("Social") : "Square"; return <button type="button" key={r} aria-pressed={ratio === r} onClick={() => setRatio(r)}><span className="ratio-preview"><span style={{ width: 28 * w / Math.max(w,h), height: 28 * h / Math.max(w,h) }} /></span><strong>{r}</strong><small>{label}</small></button>; })}</div>
          </div>
          <label className="field">Visual style
            <select value={look} onChange={(event) => setLook(event.target.value as SceneSettings["look"])}>
              {lookGroups.map((g) => <optgroup key={g} label={g}>{looks.filter((l) => l.group === g).map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}</optgroup>)}
            </select>
          </label>

          <details className="settings-section"><summary>Location{where === "brief" ? " · optional" : " · added"}</summary><div className="settings-stack">
            <label className="field">Source<select aria-label="Location source" value={where} onChange={(event) => setWhere(event.target.value as SceneSettings["where"])}><option value="brief">From description</option><option value="preset">Preset</option><option value="words">Describe a location</option><option value="photo">Reference photo</option></select></label>
            {where === "preset" && (
              <select value={scene} aria-label="Place" onChange={(event) => setScene(event.target.value)}>
                {placeGroups.map((g) => <optgroup key={g.group} label={g.group}>{g.places.map((p) => <option key={p}>{p}</option>)}</optgroup>)}
              </select>
            )}
            {where === "words" && <textarea value={location} maxLength={300} onChange={(event) => setLocation(event.target.value)} placeholder="A tiny ramen shop in Tokyo at night, steam and neon…" />}
            {where === "photo" && (
              <>
                <label className="button ghost small-button">{place ? t("Change photo") : "Choose a location photo"}
                  <input type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={upload(setPlace)} />
                </label>
                {place && <img className="thumb wide-thumb" src={place} alt="Location" />}
              </>
            )}
          </div></details>

          <details className="field more-options">
            <summary>{t("Advanced settings")}</summary>
            <label className="check"><input type="checkbox" checked={creative} onChange={(event) => setCreative(event.target.checked)} /> Plan shots automatically</label>
            <WeirdnessPicker value={weird} onChange={setWeird} hint="Adds chaos around the cast. The characters stay the same." />
          </details>
          <CustomPrompt value={customPrompt} onChange={setCustomPrompt} generated={preview} disabled={busy} />
          <ModelSeed task="board" value={gen} onChange={setGen} disabled={busy} prompt={customPrompt.trim() || preview} />
          </div><div className="action-bar">
            <button type="button" disabled={busy || !members.length || (!brief.trim() && !customPrompt.trim() && !edited)} onClick={() => void make()}>
              {busy ? t("Generating…") : `${t("Generate storyboard")} · ${shots.length}`}
            </button>
            <p className={`status${error ? " error" : ""}`} role="status">{message}</p>
          </div>
        </div>

        <div className="output storyboard">
          <header className="storyboard-intro"><h2 className="section-title">Storyboards <small>{boards.length}</small></h2><p className="hint">One image with multiple frames. Review the shots below, or generate directly from your description.</p></header>
          {busy && <div className="story-progress"><Pending ratio="8:1" label={message || "Preparing storyboard…"} fill /></div>}
          {!busy && result && (
            <figure className="board-result">
              <button type="button" className="result-button" onClick={() => setViewing(result.id)} aria-label="Open details"><img src={result.image} alt={result.title ?? "Storyboard"} /></button>
              <figcaption className="gallery-actions">
                <a className="button" href={result.image} download={`${nameOf(result.characterId)}-storyboard.png`}>{t("Download storyboard")}</a>
                {editOn && <button type="button" className="ghost" onClick={() => setEditing(result)}>{t("Edit image")}</button>}
                <button type="button" className="link" disabled={busy} onClick={() => void make(result.seed, result.model ?? gen.model, result.scene ? { ...result.scene, customPrompt: result.prompt } : undefined)} title="Generate immediately using the saved seed">{t("Repeat with same seed")}</button>
                <button type="button" className="link" disabled={busy} onClick={() => void make(newSeed(), result.model ?? gen.model, result.scene ? { ...result.scene, customPrompt: result.prompt } : undefined)} title="Generate immediately with a new seed">{t("Generate variation")}</button>
              </figcaption>
            </figure>
          )}

          <div className="plan">
            <div className="plan-head">
              <button type="button" className="link plan-toggle" aria-expanded={advanced} onClick={openAdvanced}>{t("Review shots")}</button>
              {advanced && <small className="hint">{edited ? "Your shot list is used as is." : fresh && ideas?.source === "qwen" ? "Written by Qwen from your description. Change any shot and your list is used instead." : creative ? "A rough draft: Qwen rewrites these when you make the storyboard." : "Worked out from your description. Change any shot and your list is used instead."}</small>}
              {advanced && creative && brief.trim() && <button type="button" className="link" disabled={busy} onClick={() => void newIdeas()}>{fresh ? "Refresh shot plan" : "Generate shot plan"}</button>}
              {advanced && edited && <button type="button" className="link" onClick={async () => { setEdited(false); setPlan(planShots(brief, frames, format, lead, product).map(row)); }}>Reset to my description</button>}
            </div>
            {advanced && (
              <>
                <ol className="plan-rows">
                  {rows.map((r, i, list) => (
                    <li key={r.key} className="plan-row">
                      <span className="plan-num"><strong>{i + 1}</strong><small>{timing(i, list.length, seconds)}</small></span>
                      <div className="plan-fields">
                        <input value={r.action} maxLength={300} aria-label={`Shot ${i + 1} action`} placeholder="What happens in this shot" onChange={(event) => set(r.key, { action: event.target.value })} />
                        <div className="plan-camera">
                          <select value={r.framing} aria-label="Framing" onChange={(event) => set(r.key, { framing: event.target.value as Shot["framing"] })}>{framings.map((f) => <option key={f}>{f}</option>)}</select>
                          <select value={r.angle} aria-label="Camera angle" onChange={(event) => set(r.key, { angle: event.target.value as Shot["angle"] })}>{angles.map((a) => <option key={a}>{a}</option>)}</select>
                        </div>
                      </div>
                      {list.length > 1 && <button type="button" className="link danger" aria-label={`Remove shot ${i + 1}`} onClick={() => editRows((list) => list.filter((x) => x.key !== r.key))}>✕</button>}
                    </li>
                  ))}
                </ol>
                {shots.length < maxShots && <button type="button" className="ghost small-button" onClick={() => editRows((list) => [...list, row({ action: "", framing: "Medium shot", angle: "Eye level", expression: "As the action suggests" })])}>+ Add shot</button>}
              </>
            )}
          </div>

          <section className="saved-boards" aria-label="Saved storyboards">
            <div className="gallery-tools"><input type="search" aria-label="Search storyboards" placeholder="Search storyboards…" value={boardQuery} onChange={(event) => setBoardQuery(event.target.value)} /><select aria-label="Filter by character" value={boardCast} onChange={(event) => setBoardCast(event.target.value)}><option value="all">All characters</option>{characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="board-grid">{visibleBoards.map((p) => <article className="asset-card" key={p.id}><button type="button" className="asset-open" onClick={() => setViewing(p.id)}><img src={p.image} alt="" loading="lazy" /><strong>{p.title ?? "Storyboard"}</strong><small>{p.scene?.shots.length ?? p.panels?.length ?? 1} {(p.scene?.shots.length ?? p.panels?.length ?? 1) === 1 ? "frame" : "frames"} · {formatDate(p.createdAt)}</small></button><div className="board-card-actions"><DeleteButton label="Delete storyboard" onClick={() => void removeBoard(p)} /></div></article>)}</div>
            {!visibleBoards.length && <p className="hint">{boards.length ? "No matching storyboards." : "Your storyboards will appear here."}</p>}
          </section>
        </div>
      </section>
      {shown && (
        <DetailsModal
          image={shown.image}
          {...steps(boards, boards.findIndex((p) => p.id === shown.id), (p) => setViewing(p.id))}
          title={shown.scene ? `${shown.scene.cast.map((m) => nameOf(m.characterId)).join(" & ")} · ${shown.kind === "storyboard" ? "storyboard" : "scene"}` : `${nameOf(shown.characterId)} · photo`}
          groups={[
            ...(shown.scene ? sceneChips(shown.scene, shown.scene.cast.map((m) => {
              const outfit = photos.find((p) => p.id === m.outfitId);
              return `${nameOf(m.characterId)}${outfit ? ` (${outfit.title ?? "outfit"})` : ""}${m.role ? ` · ${m.role}` : ""}`;
            })) : shown.shot ? shotChips(shown.shot, shown.note) : []),
            ...(shown.instruction ? [{ label: "Edit", values: [shown.instruction] }] : []),
          ]}
          meta={[{ label: "Model", value: modelLabel(shown.model, "edit") }, ...(shown.seed !== undefined ? [{ label: "Seed", value: String(shown.seed) }] : []), { label: "Created", value: formatDate(shown.createdAt) }]}
          prompt={shown.prompt}
          onClose={() => setViewing(undefined)}
          actions={<>
            {shown.scene && <button type="button" onClick={async () => { use(shown.scene!); setGen({ ...gen, model: shown.model ?? gen.model, seed: shown.seed ?? gen.seed }); }} title="Load settings without generating">Adjust settings</button>}
            {editOn && <button type="button" className="ghost" onClick={async () => { setEditing(shown); setViewing(undefined); }}>{t("Edit image")}</button>}
            <a className="button ghost" href={shown.image} download={`${nameOf(shown.characterId)}-storyboard.png`}>Download</a>
          </>}
          more={<>
            {shown.scene?.brief !== undefined && shown.seed !== undefined && <button type="button" className="link" disabled={busy} onClick={async () => { setViewing(undefined); void make(shown.seed, shown.model ?? gen.model, { ...shown.scene!, customPrompt: shown.prompt }); }} title="Generate immediately using the saved seed">{t("Repeat with same seed")}</button>}
            {shown.scene?.brief !== undefined && <button type="button" className="link" disabled={busy} onClick={async () => { setViewing(undefined); void make(newSeed(), shown.model ?? gen.model, { ...shown.scene!, customPrompt: shown.prompt }); }} title="Generate immediately with a new seed">{t("Generate variation")}</button>}
            <CopyImageLink image={shown.image} />
            <DeleteButton onClick={() => void removeBoard(shown)} />
          </>}
        />
      )}
      {editing && (
        <EditModal
          image={editing.image}
          folder={folderOf(editing.characterId)}
          title={`${nameOf(editing.characterId)} · storyboard`}
          onClose={() => setEditing(undefined)}
          onSave={async (edit) => {
            const id = newId();
            await library.savePhoto({ ...editing, id, kind: editing.kind === "storyboard" ? "storyboard" : "edit", image: edit.image, prompt: edit.prompt, model: edit.model, seed: edit.seed, parentId: editing.id, instruction: edit.instruction, createdAt: Date.now() });
            await onChanged();
            if (editing.id === current) setCurrent(id);
          }}
        />
      )}
    </>
  );
}
