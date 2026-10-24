export type DateOrder = "dmy" | "mdy";

export type ParsedDate = {
  iso: string;
  ambiguous: boolean;
};

function isValidDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function parseDate(
  raw: string,
  preferred: DateOrder,
): ParsedDate | null {
  const textual = raw.match(
    /ng[àa]y\s+(\d{1,2})\s+th[áa]ng\s+(\d{1,2})\s+n[ăa]m\s+(\d{4})/i,
  );
  const numeric = raw.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);

  let first: number;
  let second: number;
  let year: number;
  let forcedDmy = false;

  if (textual) {
    first = Number(textual[1]);
    second = Number(textual[2]);
    year = Number(textual[3]);
    forcedDmy = true;
  } else if (numeric) {
    first = Number(numeric[1]);
    second = Number(numeric[2]);
    year = Number(numeric[3]);
    if (year < 100) year += 2000;
  } else {
    return null;
  }

  let day: number;
  let month: number;
  let ambiguous = false;

  if (forcedDmy) {
    day = first;
    month = second;
  } else if (first > 12 && second <= 12) {
    day = first;
    month = second;
  } else if (second > 12 && first <= 12) {
    day = second;
    month = first;
  } else if (first <= 12 && second <= 12) {
    ambiguous = first !== second;
    day = preferred === "dmy" ? first : second;
    month = preferred === "dmy" ? second : first;
  } else {
    return null;
  }

  if (!isValidDate(year, month, day)) return null;

  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { iso, ambiguous };
}
