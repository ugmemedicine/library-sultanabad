export function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildKeywords(values: Array<string | undefined>) {
  const words = values
    .filter(Boolean)
    .flatMap((value) => normalizeText(value ?? "").split(/[^a-z0-9]+/i))
    .filter(Boolean);
  return Array.from(new Set(words));
}

export function normalizeIsbn(isbn?: string) {
  return isbn?.replace(/[^0-9X]/gi, "").toUpperCase() ?? "";
}
