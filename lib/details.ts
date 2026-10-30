// What the details pop-up shows: the picks behind an image, grouped by
// category as chips, in the same words as the tiles.
import { fields, isCreature, weirdness, type Field, type Look } from "./character.ts";
import { shoot, type Shot } from "./shoot.ts";

/** Optional section: the pop-up folds sections into collapsible rows of chips (owner's idea, Oct 27). */
export type ChipGroup = { label: string; values: string[]; section?: string };

const sectionOf: Record<string, string> = {
  kind: "Character", gender: "Character", age: "Character", skin: "Character", face: "Character", eyes: "Character", features: "Character", makeup: "Character",
  hairStyle: "Hair", hairColor: "Hair", facialHair: "Hair",
  build: "Body", height: "Body", proportions: "Body",
  style: "Style", decade: "Style", accessories: "Style",
};

export function lookChips(look: Look): ChipGroup[] {
  const creature = isCreature(look.selection);
  const groups = (fields as readonly Field[])
    .filter((field) => !(creature && field.humanOnly) && !(field.id === "skin" && (look.color || creature)))
    .map((field): ChipGroup => ({
      label: field.label,
      section: sectionOf[field.id] ?? "Extras",
      values: (look.selection[field.id as keyof Look["selection"]] ?? [])
        .filter((id) => !(field.id === "decade" && id === "today") && !(field.id === "facialHair" && id === "none"))
        .map((id) => field.options.find((option) => option.id === id)?.label ?? id)
        // A bare color reads as hair in the Hair row; say it for eyes.
        .map((value) => field.id === "eyes" ? `${value} eyes` : value),
    }))
    .filter((group) => group.values.length);
  if (look.color) groups.splice(1, 0, { label: "Custom color", section: "Character", values: [look.color] });
  if (look.weird) groups.push({ label: "Weirdness", section: "Extras", values: [weirdness[look.weird]] });
  if (look.detail.trim()) groups.push({ label: "Signature detail", section: "Extras", values: [look.detail.trim()] });
  return groups;
}

const shotLabels: Record<keyof Shot, string> = { scene: "Scene", outfit: "Outfit", pose: "Pose", expression: "Expression", camera: "Camera", ratio: "Format" };

export function shotChips(shot: Shot, note = ""): ChipGroup[] {
  const groups: ChipGroup[] = (Object.keys(shoot) as (keyof Shot)[])
    .filter((key) => shot[key] && !(key === "expression" && shot[key] === "Natural, as in the pose"))
    .map((key) => ({ label: shotLabels[key], values: [shot[key]] }));
  if (note.trim()) groups.push({ label: "Extra direction", values: [note.trim()] });
  return groups;
}

export function formatDate(time: number) {
  return new Date(time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
