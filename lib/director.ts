// The shot planner: Qwen turns a short storyboard brief into varied, creative
// shots (the owner's call, Oct 29: the fixed templates gave the same shots every
// time). It runs as a text-only ComfyUI workflow (TextGenerate on the Qwen3.5 9B
// encoder that MOSS-Image's own template uses for its prompt enhancer), so it
// stays open weights. The reply is JSON, read here; anything unreadable falls
// back to the free template plan in lib/scene.ts.

import { angles, framings, looks, type CastMember, type FormatId, type Shot } from "./scene.ts";

export type Brief = {
  brief: string;
  count: number;
  format: FormatId;
  cast: CastMember[];
  look: string;
  place?: string;
  product?: string;
  seconds?: number;
  weird?: number;
  /** A product photo goes to Qwen with the text, so it plans around the real item. */
  productPhoto?: boolean;
};

const formatGoal: Record<FormatId, string> = {
  story: "a short cinematic scene with a hook, rising tension, a peak moment and a payoff",
  ugc: "a creator's product video (UGC ad): a scroll-stopping hook, the product revealed, its details, a demonstration of it in use, a reaction, and a closing beat that sells it; the product is the hero, large and in focus in most shots, the creator often only partly in frame",
  custom: "a short scene that follows the brief closely",
};

const weirdGoal = ["Keep everything grounded and realistic: real objects, real physics, nothing magical, glowing, floating or holographic unless the idea asks for it.", "Add one small odd detail somewhere.", "Make it chaotic and absurd: wild, impossible things happen around them.", "Make it unhinged and surreal: impossible physics and bizarre events in every shot."];

export function plannerSystem(count: number) {
  return [
    `You are a film director and storyboard artist. Turn a short idea into exactly ${count} shots of ONE continuous scene that tell it from beginning to end. Each shot is a later moment than the one before; never repeat a moment.`,
    `Invent concrete, visual, surprising details the idea only hints at: what happens, props, gestures, expressions, how the place reacts. Show, don't tell.`,
    `Vary the camera like a real editor: mix wide, medium, close and detail shots and different angles; no two shots in a row with the same framing.`,
    `framing must be one of: ${framings.join(", ")}. Use Two shot or Over the shoulder only when two characters share the shot, and Extreme close-up or Detail insert only for a small detail.`,
    `angle must be one of: ${angles.join(", ")}.`,
    `The framing must show what the action is about: if the action is about feet, shoes or hands, frame those, not the face; one subject per shot.`,
    `If the place lists several locations, move through them in order and say where each shot happens.`,
    `action is one vivid present-tense sentence under 35 words describing only what the camera sees, naming characters by name. Characters look exactly as described: never change a character's species, face or outfit, and creatures keep their own animal face and mouth (no human lips, teeth, smiles or grins: show feelings with eyes, head tilts and body language). No text, captions or logos invented on screen. No new main characters unless the idea asks.`,
    `Reply with only a JSON array of ${count} objects like {"framing": "Wide shot", "angle": "Eye level", "action": "..."}, nothing else.`,
  ].join("\n");
}

export function plannerPrompt(b: Brief) {
  const look = looks.find((l) => l.id === b.look);
  return [
    `Video type: ${formatGoal[b.format]}.`,
    `Shots: ${b.count}${b.seconds ? `, for a ${b.seconds}-second video` : ""}.`,
    `Cast: ${b.cast.map((c) => `${c.name}${c.role ? ` (${c.role})` : ""}${c.description ? `: ${c.description.slice(0, 400)}` : ""}${c.outfit ? `; CURRENT OUTFIT (overrides clothing in the description): ${c.outfit}. Do not invent clothing details; focus actions on movement and interaction` : ""}`).join(" | ")}.`,
    b.place ? `Place: ${b.place}.` : "",
    b.productPhoto ? `Product: ${b.product ? `${b.product}, ` : ""}exactly the item in the attached photo. Use this real product in the shots, as it is; never replace it with another object or invent a different product.` : b.product ? `Product: ${b.product}.` : "",
    look ? `Film look: ${look.label} (${look.words}).` : "",
    weirdGoal[b.weird ?? 0] ?? "",
    `Idea: ${b.brief.replace(/@(\S+)/g, "$1").trim()}`,
  ].filter(Boolean).join("\n");
}

const pick = <T extends string>(list: readonly T[], value: unknown, fallback: T) => {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "";
  // Exact, else the shortest close match ("wide" is a Wide shot, not an Extreme wide shot).
  const close = list.filter((x) => v && (x.toLowerCase().includes(v) || v.includes(x.toLowerCase()))).sort((a, b) => a.length - b.length);
  return list.find((x) => x.toLowerCase() === v) ?? close[0] ?? fallback;
};

/** Creatures' grins and smiles become "beams": Qwen's "grin" gave the owl human teeth (Oct 29). */
export function noHumanMouth(action: string) {
  return action.replace(/\b(?:grin|smil)(s|es|ning|ing|ned|ed|e)?\b/gi, (_, end = "") =>
    /^(s|es)$/.test(end) ? "beams" : /ing$/.test(end) ? "beaming" : /ed$/.test(end) ? "beamed" : "beam");
}

/** The shots from Qwen's reply, or undefined if it can't be read. Framings and angles are matched to the app's lists. */
export function readShots(reply: string, count: number): Shot[] | undefined {
  const text = reply.replace(/<think>[\s\S]*?<\/think>/g, "");
  const start = text.indexOf("["), end = text.lastIndexOf("]");
  if (start < 0 || end <= start) return undefined;
  let list: unknown;
  try { list = JSON.parse(text.slice(start, end + 1)); } catch { return undefined; }
  if (!Array.isArray(list)) return undefined;
  const shots = list.flatMap((item): Shot[] => {
    if (!item || typeof item !== "object") return [];
    const o = item as Record<string, unknown>;
    const action = typeof o.action === "string" ? o.action.trim().replace(/\s+/g, " ").slice(0, 300) : "";
    if (action.length < 3) return [];
    return [{ action, framing: pick(framings, o.framing, "Medium shot"), angle: pick(angles, o.angle, "Eye level"), expression: "As the action suggests" }];
  });
  return shots.length >= Math.min(count, 2) ? shots.slice(0, count) : undefined;
}
