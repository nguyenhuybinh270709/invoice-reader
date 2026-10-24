import type { RawInvoice } from "../schemas/invoice.schema";
import { parseAmount, sumOrNull, type NumberLocale } from "./parse-amount";
import { parseDate, type DateOrder } from "./parse-date";

export type ReviewFlag =
  | "no_items"
  | "total_missing"
  | "amount_unreadable"
  | "number_locale_uncertain"
  | "totals_mismatch"
  | "totals_unverifiable"
  | "issue_date_missing"
  | "issue_date_invalid"
  | "issue_date_ambiguous"
  | "issue_date_in_future";

export type NormalizedLineItem = {
  nameRaw: string;
  nameVi: string;
  quantity: number | null;
  unitPrice: number | null;
  amount: number | null;
};

export type NormalizedInvoice = {
  sellerName: string | null;
  sellerTaxCode: string | null;
  invoiceNumber: string | null;
  issueDate: string | null;
  currency: RawInvoice["currency"];
  numberLocale: NumberLocale;
  items: NormalizedLineItem[];
  subtotal: number | null;
  vat: number | null;
  total: number | null;
  reviewFlags: ReviewFlag[];
  modelFlaggedFields: string[];
  status: "auto_approved" | "needs_review";
};

export type NormalizeOptions = {
  today: string;
};

type Consistency = {
  checked: number;
  failed: number;
};

type LocaleResolution = {
  locale: NumberLocale;
  consistency: Consistency;
  uncertain: boolean;
};

const LOCALES: readonly NumberLocale[] = ["vi", "en"];

function parseOptionalAmount(
  raw: string | null,
  locale: NumberLocale,
): number | null {
  return raw === null ? null : parseAmount(raw, locale);
}

function toleranceFor(currency: RawInvoice["currency"]): number {
  return currency === "VND" ? 1 : 0.02;
}

function checkConsistency(raw: RawInvoice, locale: NumberLocale): Consistency {
  const tolerance = toleranceFor(raw.currency);
  const itemsSum =
    raw.items.length === 0
      ? null
      : sumOrNull(raw.items.map((item) => parseAmount(item.amountRaw, locale)));
  const subtotal = parseOptionalAmount(raw.subtotalRaw, locale);
  const vat = parseOptionalAmount(raw.vatRaw, locale);
  const total = parseOptionalAmount(raw.totalRaw, locale);

  const result: Consistency = { checked: 0, failed: 0 };

  function compare(left: number | null, right: number | null): void {
    if (left === null || right === null) return;
    result.checked += 1;
    if (Math.abs(left - right) > tolerance) result.failed += 1;
  }

  if (subtotal !== null) {
    compare(itemsSum, subtotal);
    compare(vat === null ? null : subtotal + vat, total);
  } else if (vat === null) {
    compare(itemsSum, total);
  } else {
    compare(itemsSum === null ? null : itemsSum + vat, total);
  }

  return result;
}

function hintLocale(raw: RawInvoice): NumberLocale {
  if (raw.currency === "VND") return "vi";
  if (raw.currency === "USD") return "en";
  if (raw.documentLocale === "en") return "en";
  return "vi";
}

function resolveNumberLocale(raw: RawInvoice): LocaleResolution {
  const results = LOCALES.map((locale) => ({
    locale,
    ...checkConsistency(raw, locale),
  }));
  const passing = results.filter(
    (result) => result.checked > 0 && result.failed === 0,
  );
  const [only] = passing;

  if (passing.length === 1 && only) {
    return {
      locale: only.locale,
      consistency: { checked: only.checked, failed: only.failed },
      uncertain: false,
    };
  }

  const locale = hintLocale(raw);
  const consistency = checkConsistency(raw, locale);
  return {
    locale,
    consistency,
    uncertain: passing.length > 1 || consistency.checked === 0,
  };
}

function preferredDateOrder(raw: RawInvoice): DateOrder {
  if (raw.currency === "VND") return "dmy";
  if (raw.currency === "USD" || raw.documentLocale === "en") return "mdy";
  return "dmy";
}

type NormalizedDate = {
  iso: string | null;
  flags: ReviewFlag[];
};

function normalizeDate(raw: RawInvoice, today: string): NormalizedDate {
  if (raw.issueDateRaw === null) {
    return { iso: null, flags: ["issue_date_missing"] };
  }

  const parsed = parseDate(raw.issueDateRaw, preferredDateOrder(raw));
  if (!parsed) {
    return { iso: null, flags: ["issue_date_invalid"] };
  }

  const flags: ReviewFlag[] = [];
  if (parsed.ambiguous) flags.push("issue_date_ambiguous");
  if (parsed.iso > today) flags.push("issue_date_in_future");
  return { iso: parsed.iso, flags };
}

type NormalizedItems = {
  items: NormalizedLineItem[];
  hasUnreadableAmount: boolean;
};

function normalizeItems(
  raw: RawInvoice,
  locale: NumberLocale,
): NormalizedItems {
  const items = raw.items.map((item) => ({
    nameRaw: item.nameRaw,
    nameVi: item.nameVi,
    quantity: parseAmount(item.quantityRaw, locale),
    unitPrice: parseAmount(item.unitPriceRaw, locale),
    amount: parseAmount(item.amountRaw, locale),
  }));

  return {
    items,
    hasUnreadableAmount: items.some((item) => item.amount === null),
  };
}

export function normalizeInvoice(
  raw: RawInvoice,
  { today }: NormalizeOptions,
): NormalizedInvoice {
  const resolution = resolveNumberLocale(raw);
  const { locale, consistency } = resolution;
  const { items, hasUnreadableAmount } = normalizeItems(raw, locale);
  const date = normalizeDate(raw, today);
  const subtotal = parseOptionalAmount(raw.subtotalRaw, locale);
  const vat = parseOptionalAmount(raw.vatRaw, locale);
  const total = parseOptionalAmount(raw.totalRaw, locale);

  const flags: ReviewFlag[] = [...date.flags];
  if (items.length === 0) flags.push("no_items");
  if (hasUnreadableAmount) flags.push("amount_unreadable");
  if (raw.totalRaw === null) {
    flags.push("total_missing");
  } else if (total === null) {
    flags.push("amount_unreadable");
  }
  if (resolution.uncertain) flags.push("number_locale_uncertain");
  if (consistency.checked === 0) flags.push("totals_unverifiable");
  if (consistency.failed > 0) flags.push("totals_mismatch");

  const reviewFlags = Array.from(new Set<ReviewFlag>(flags));

  return {
    sellerName: raw.sellerName,
    sellerTaxCode: raw.sellerTaxCode,
    invoiceNumber: raw.invoiceNumber,
    issueDate: date.iso,
    currency: raw.currency,
    numberLocale: locale,
    items,
    subtotal,
    vat,
    total,
    reviewFlags,
    modelFlaggedFields: raw.fieldsNeedingReview,
    status:
      reviewFlags.length === 0 && raw.fieldsNeedingReview.length === 0
        ? "auto_approved"
        : "needs_review",
  };
}

export function todayInVietnam(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());
}
