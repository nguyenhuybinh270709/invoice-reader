export type NumberLocale = "vi" | "en";

const SEPARATORS: Record<NumberLocale, { thousand: string; decimal: string }> =
  {
    vi: { thousand: ".", decimal: "," },
    en: { thousand: ",", decimal: "." },
  };

export function parseAmount(raw: string, locale: NumberLocale): number | null {
  const cleaned = raw.replace(/[^\d.,-]/g, "");
  if (!/\d/.test(cleaned)) return null;
  const { thousand, decimal } = SEPARATORS[locale];
  const normalized = cleaned.split(thousand).join("").replace(decimal, ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function sumOrNull(values: readonly (number | null)[]): number | null {
  let total = 0;
  for (const value of values) {
    if (value === null) return null;
    total += value;
  }
  return total;
}

export function detectNumberLocale(
  lineAmountRaws: readonly string[],
  totalRaw: string,
  tolerance = 1,
): NumberLocale | null {
  const candidates: NumberLocale[] = ["vi", "en"];
  const matches = candidates.filter((locale) => {
    const lines = sumOrNull(
      lineAmountRaws.map((raw) => parseAmount(raw, locale)),
    );
    const total = parseAmount(totalRaw, locale);
    return (
      lines !== null && total !== null && Math.abs(lines - total) <= tolerance
    );
  });
  const [only] = matches;
  return matches.length === 1 && only !== undefined ? only : null;
}
