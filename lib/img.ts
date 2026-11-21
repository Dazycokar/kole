/** Ask Unsplash for a sensible width; leave every other link alone. */
export function sized(src: string, w: number): string {
  if (!src.startsWith("https://images.unsplash.com/")) return src;
  try {
    const u = new URL(src);
    u.searchParams.set("w", String(w));
    u.searchParams.set("q", "75");
    u.searchParams.set("auto", "format");
    u.searchParams.set("fit", "crop");
    return u.toString();
  } catch {
    return src;
  }
}
