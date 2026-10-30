const MAX_BASE64 = 20 * 1024 * 1024;

// The browser sends images as data URLs; this checks one and returns its base64 part.
export function base64Image(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > MAX_BASE64 + 32) return;
  const match = /^data:image\/(?:png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  return match?.[1];
}


export function imageList(value: unknown, max: number): string[] | undefined {
  if (!Array.isArray(value) || value.length < 1 || value.length > max) return;
  const images = value.map(base64Image);
  return images.every((image) => image !== undefined) ? images as string[] : undefined;
}

/** Like imageList, but keeps the whole data URL (for workflows, which need the file type). */
export function dataUrlList(value: unknown, max: number): string[] | undefined {
  return imageList(value, max) ? value as string[] : undefined;
}

export function toDataUrl(bytes: Uint8Array, contentType: string | null) {
  const type = contentType?.split(";")[0].trim();
  return `data:${type?.startsWith("image/") ? type : "image/jpeg"};base64,${Buffer.from(bytes).toString("base64")}`;
}
