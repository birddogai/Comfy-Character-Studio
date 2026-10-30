// Saved characters get their own folder in the outputs folder, so their sheet,
// outfits, scenes and edits sit together instead of in date folders:
//   outputs/characters/Nax-3f2a/2026-10-26_14-32-05-outfit-abc.png
// The short code from the character's id keeps two characters with the same
// name apart. Shared by the browser and the server, so no file access here.

/** The folder for a saved character, relative to the outputs folder. */
export function characterFolder(name: string, id: string) {
  const safe = name.normalize("NFKD").replace(/[^\w -]/g, "").replace(/\s+/g, " ").trim().slice(0, 40) || "Character";
  const code = id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4) || "0000";
  return `characters/${safe}-${code}`;
}

/** A character folder as the browser may send it: one level under characters/, no dots or slashes in the name. */
export const folderPattern = /^characters\/[\w -]{1,60}$/;

export function isFolder(value: unknown): value is string {
  return typeof value === "string" && folderPattern.test(value) && !value.includes("..");
}
