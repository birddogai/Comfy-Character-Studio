// The color picker gives a hex code like "#1288af", which image models don't
// read (a fox stayed russet, Oct 26). This names the nearest everyday color.
const named: [string, number, number, number][] = [
  ["black", 20, 20, 20], ["charcoal grey", 60, 62, 66], ["grey", 128, 128, 128], ["silver grey", 190, 192, 196], ["white", 248, 248, 248],
  ["cream", 245, 236, 210], ["beige", 220, 200, 165], ["tan", 196, 154, 108], ["brown", 130, 82, 45], ["dark chocolate brown", 70, 40, 25],
  ["rust orange", 183, 80, 30], ["bright orange", 255, 140, 0], ["peach", 255, 196, 160], ["coral", 255, 120, 100], ["bright red", 220, 30, 35],
  ["crimson", 165, 15, 40], ["burgundy", 110, 20, 40], ["pastel pink", 248, 190, 210], ["hot pink", 255, 60, 160], ["magenta", 200, 30, 170],
  ["deep purple", 85, 30, 120], ["violet", 140, 80, 210], ["lavender", 190, 170, 235], ["navy blue", 25, 35, 95], ["royal blue", 40, 80, 210],
  ["sky blue", 110, 180, 240], ["pale baby blue", 185, 215, 245], ["deep teal blue", 15, 120, 160], ["teal", 0, 140, 140], ["turquoise", 50, 210, 200],
  ["pale aqua", 127, 209, 199], ["mint green", 165, 230, 195], ["emerald green", 20, 150, 80], ["forest green", 30, 85, 40], ["lime green", 150, 220, 40], ["olive green", 110, 115, 40],
  ["mustard yellow", 210, 165, 30], ["golden yellow", 245, 195, 40], ["lemon yellow", 250, 235, 80],
];

/** "#1288af" → "deep teal blue". Unreadable input comes back unchanged. */
export function colorName(hex: string) {
  const match = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!match) return hex;
  const [r, g, b] = match.slice(1).map((h) => parseInt(h, 16));
  // "Redmean" distance: close to how different two colors look, without a color library.
  const distance = ([, r2, g2, b2]: (typeof named)[number]) => {
    const mean = (r + r2) / 2;
    return (2 + mean / 256) * (r - r2) ** 2 + 4 * (g - g2) ** 2 + (2 + (255 - mean) / 256) * (b - b2) ** 2;
  };
  return named.reduce((best, next) => distance(next) < distance(best) ? next : best)[0];
}
