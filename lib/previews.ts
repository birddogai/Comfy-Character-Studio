// Option tiles show a picture when one exists in public/options/{field}/{id}.webp.
// List each finished picture here as "field/id"; until then the tile shows text.
export const previews = new Set<string>([]);

export function previewSrc(field: string, id: string) {
  return previews.has(`${field}/${id}`) ? `/options/${field}/${id}.webp` : undefined;
}
