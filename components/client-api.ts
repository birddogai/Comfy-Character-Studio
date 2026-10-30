export type ImageResult = { image: string; prompt: string; requestId: string };

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await errorText(response));
  return await response.json() as T;
}

async function errorText(response: Response) {
  try {
    const body = await response.json() as { error?: string };
    return body.error || `Request failed (${response.status}).`;
  } catch {
    return `Request failed (${response.status}).`;
  }
}

// Shrinks an uploaded photo to a JPEG data URL no larger than 1536px, which is
// plenty for a face reference and keeps requests small.
export function fileToDataUrl(file: File, maxSide = 1536, minSide = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      if (Math.min(canvas.width, canvas.height) < minSide) reject(new Error(`Use an image at least ${minSide} pixels on each side.`));
      else resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("That file is not an image this browser can read.")); };
    img.src = url;
  });
}

// Puts an image on the clipboard so it can be pasted into another app.
// Browsers only accept PNG there, so the image is redrawn as PNG first.
export async function copyImage(dataUrl: string) {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  canvas.getContext("2d")!.drawImage(image, 0, 0);
  const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not copy the image.")), "image/png"));
  await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
}

/** Keeps the outputs folder in step with the library (see app/api/outputs). Never fails the caller. */
export async function updateOutputs<T = Record<string, unknown>>(body: Record<string, unknown>): Promise<T | undefined> {
  try { return await postJson<T>("/api/outputs", body); } catch (error) { console.warn("Could not update the outputs folder:", error); return undefined; }
}
