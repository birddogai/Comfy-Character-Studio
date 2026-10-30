// Search, filter, sort and pages for a grid of results. Plain data in, plain
// data out, so it's tested without a browser.
export type GalleryItem = {
  id: string;
  /** A saved character's name; unsaved sheets have none. */
  name?: string;
  saved: boolean;
  /** The character type id, e.g. "banana". */
  kind?: string;
  model?: string;
  /** Extra words to search: the type label, the prompt… */
  text: string;
  createdAt: number;
};

export type GalleryView = {
  query: string;
  show: "all" | "saved" | "unsaved";
  kind: string;
  model: string;
  sort: "newest" | "oldest" | "name";
  page: number;
};

export const pageSize = 30;
export const defaultView: GalleryView = { query: "", show: "all", kind: "all", model: "all", sort: "newest", page: 1 };

export function viewGallery<T extends GalleryItem>(items: T[], view: GalleryView) {
  const words = view.query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = items.filter((item) => {
    if (view.show === "saved" && !item.saved) return false;
    if (view.show === "unsaved" && item.saved) return false;
    if (view.kind !== "all" && item.kind !== view.kind) return false;
    if (view.model !== "all" && item.model !== view.model) return false;
    const haystack = `${item.name ?? ""} ${item.text}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
  const sorted = [...matches].sort((a, b) =>
    view.sort === "oldest" ? a.createdAt - b.createdAt
      : view.sort === "name" ? byName(a, b) || b.createdAt - a.createdAt
        : b.createdAt - a.createdAt);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(Math.max(1, view.page), pages);
  return { items: sorted.slice((page - 1) * pageSize, page * pageSize), total: sorted.length, page, pages };
}

// Named characters A–Z first, unnamed sheets after them.
function byName(a: GalleryItem, b: GalleryItem) {
  if (!a.name || !b.name) return Number(!a.name) - Number(!b.name);
  return a.name.localeCompare(b.name, undefined, { numeric: true });
}

const groupNames: Record<string, string> = { Human: "People", Creature: "Creatures", Robot: "Robots", Object: "Objects", Food: "Food" };

/**
 * The character types in use, for the gallery's type filter: in the tiles'
 * groups (People, Creatures…), A–Z inside each. A flat list in the order
 * sheets were made was hard to search (Oct 27).
 */
export function typeGroups(options: readonly { id: string; label: string; group?: string }[], used: readonly string[]) {
  const groups = new Map<string, { id: string; label: string }[]>();
  for (const option of options) groups.set(groupNames[option.group ?? ""] ?? "Other", []);
  for (const id of new Set(used)) {
    const option = options.find((o) => o.id === id);
    const group = option ? groupNames[option.group ?? ""] ?? "Other" : "Other";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push({ id, label: option?.label ?? id });
  }
  return [...groups].filter(([, list]) => list.length).map(([group, list]) => [group, list.sort((a, b) => a.label.localeCompare(b.label))] as const);
}
