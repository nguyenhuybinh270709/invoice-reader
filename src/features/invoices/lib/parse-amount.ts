export type NumberLocale = "vi" | "en";

const SEPARATORS: Record<NumberLocale, { thousand: string; decimal: string }> =
  {
    vi: { thousand: ".", decimal: "," },
    en: { thousand: ",", decimal: "." },
  };

export function parseAmount(raw: string, locale: NumberLocale): number | null {
  const cleaned = raw.replace(/[^\d.,-]/g, "");
  const negative = cleaned.startsWith("-");
  const unsigned = cleaned.replace(/-/g, "");
  if (!/\d/.test(unsigned)) return null;

  const { thousand, decimal } = SEPARATORS[locale];
  const decimalSplit = unsigned.split(decimal);
  if (decimalSplit.length > 2) return null;

  const [integerPart = "", fractionPart = ""] = decimalSplit;
  if (fractionPart.includes(thousand) || !/^\d*$/.test(fractionPart))
    return null;

  const [head = "", ...groups] = integerPart.split(thousand);
  if (groups.some((group) => group.length !== 3)) return null;

  const integerDigits = head + groups.join("");
  if (!/^\d*$/.test(integerDigits)) return null;

  const normalized = `${integerDigits === "" ? "0" : integerDigits}${
    fractionPart === "" ? "" : `.${fractionPart}`
  }`;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;

  return negative ? -value : value;
}

export function sumOrNull(values: readonly (number | null)[]): number | null {
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
  return matches.length === 1 ? (matches[0] ?? null) : null;
}
