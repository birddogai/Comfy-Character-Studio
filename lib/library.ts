import type { Look } from "./character";
import type { ModelId } from "./models";
import type { SceneSettings } from "./scene";
import type { Shot } from "./shoot";
import type { WardrobeItem } from "./wardrobe";

/** Which model made an image and with which seed, so it can be redone exactly. */
export type Made = { customPrompt?: string; model?: ModelId; seed?: number };

// Characters and photos live in the browser's IndexedDB, so the server stays
// stateless and nothing is uploaded anywhere except to the model for a run.
export type Character = {
  id: string;
  name: string;
  /** Data URLs. New characters have one character sheet (face close-up and full-body front; older ones also a back view, or a portrait plus angles). */
  references: string[];
  /** What they look like, in words. Added to photo shoot prompts. */
  description?: string;
  /** The tiles and prompt behind the sheet, for the details pop-up and "Edit look". */
  look?: Look;
  prompt?: string;
  createdAt: number;
} & Made;

/**
 * Everything made from a character after the sheet: photos, outfit sheets
 * and edits. Kept in one store (named "photos" for older saves) and told
 * apart by kind; a character's page groups them.
 */
export type Photo = {
  id: string;
  characterId: string;
  image: string;
  prompt: string;
  /** Scenes and storyboards: the cast, place, look and shots, for the details pop-up and "Use these settings". */
  scene?: SceneSettings;
  /** Photos from the old Photo shoot tab: its picks. */
  shot?: Shot;
  note?: string;
  /** Missing on older saves, which are all photo shoot photos. */
  kind?: "photo" | "outfit" | "edit" | "storyboard";
  /** Storyboards: every panel, so one can be redone; image is the laid-out board. */
  panels?: { image: string; action: string; framing: string; angle: string; expression?: string; prompt: string; seed?: number }[];
  /** Outfit sheets: a short name and the pieces (with their images) for redo. */
  title?: string;
  items?: WardrobeItem[];
  /** Scenes: the user's own location words, a location photo, and where the character was placed. */
  location?: string;
  place?: string;
  box?: { x: number; y: number; width: number; height: number };
  /** Edits: the image it came from and what was asked. */
  parentId?: string;
  instruction?: string;
  createdAt: number;
} & Made;

/** Every generated character sheet, kept as soon as it arrives so a reload never loses a paid result. */
export type Sheet = {
  id: string;
  image: string;
  prompt: string;
  description: string;
  look: Look;
  /** The character this sheet was saved as, so it isn't saved twice. */
  savedAs?: { id: string; name: string };
  /** For sheets brought back from the outputs folder: the file, so it isn't restored twice. */
  file?: string;
  createdAt: number;
} & Made;

/** A product photo, saved so it can be reused (for Wardrobe next). */
export type Product = { id: string; name: string; image: string; createdAt: number };

type StoreName = "characters" | "photos" | "sheets" | "videos" | "products";
const stores: StoreName[] = ["characters", "photos", "sheets", "videos", "products"];

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Version 2 added "sheets", 3 "videos" (no longer used: video was removed), 4 "products". Creating only
    // missing stores keeps everything already saved.
    const request = indexedDB.open("ai-character-studio", 4);
    request.onupgradeneeded = () => {
      for (const store of stores) {
        if (!request.result.objectStoreNames.contains(store)) request.result.createObjectStore(store, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(store: StoreName, mode: IDBTransactionMode, action: (objects: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = action(db.transaction(store, mode).objectStore(store));
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

const newest = <T extends { createdAt: number }>(items: T[]) => items.sort((a, b) => b.createdAt - a.createdAt);

export const library = {
  characters: async () => newest(await run<Character[]>("characters", "readonly", (s) => s.getAll())),
  photos: async () => newest(await run<Photo[]>("photos", "readonly", (s) => s.getAll())),
  saveCharacter: (character: Character) => run<IDBValidKey>("characters", "readwrite", (s) => s.put(character)),
  savePhoto: (photo: Photo) => run<IDBValidKey>("photos", "readwrite", (s) => s.put(photo)),
  deleteCharacter: (id: string) => run<undefined>("characters", "readwrite", (s) => s.delete(id)),
  deletePhoto: (id: string) => run<undefined>("photos", "readwrite", (s) => s.delete(id)),
  sheets: async () => newest(await run<Sheet[]>("sheets", "readonly", (s) => s.getAll())),
  // Every sheet is kept until the user deletes it. (An older version kept
  // only the 12 newest unsaved sheets and quietly removed the rest.)
  keepSheet: (sheet: Sheet) => run<IDBValidKey>("sheets", "readwrite", (s) => s.put(sheet)),
  deleteSheet: (id: string) => run<undefined>("sheets", "readwrite", (s) => s.delete(id)),
  /** Deletes a character and its kept sheet, so it doesn't come back as an unsaved sheet. */
  async removeCharacter(character: Character) {
    await library.deleteCharacter(character.id);
    for (const sheet of await library.sheets()) {
      if (sheet.savedAs?.id === character.id || sheet.image === character.references[0]) await library.deleteSheet(sheet.id);
    }
  },
  products: async () => newest(await run<Product[]>("products", "readonly", (s) => s.getAll())),
  saveProduct: (product: Product) => run<IDBValidKey>("products", "readwrite", (s) => s.put(product)),
  deleteProduct: (id: string) => run<undefined>("products", "readwrite", (s) => s.delete(id)),
};

export const newId = () => crypto.randomUUID();
