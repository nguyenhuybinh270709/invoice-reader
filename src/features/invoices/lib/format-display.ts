import type { NormalizedInvoice } from "./normalize-invoice";

type Currency = NormalizedInvoice["currency"];

const EMPTY_VALUE = "—";

const VND_FORMATTER = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});
const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const PLAIN_FORMATTER = new Intl.NumberFormat("vi-VN");

export function formatMoney(value: number | null, currency: Currency): string {
  if (value === null) return EMPTY_VALUE;
  if (currency === "VND") return VND_FORMATTER.format(value);
  if (currency === "USD") return USD_FORMATTER.format(value);
  return PLAIN_FORMATTER.format(value);
}

export function formatNumber(value: number | null): string {
  return value === null ? EMPTY_VALUE : PLAIN_FORMATTER.format(value);
}

export function formatIsoDate(iso: string | null): string {
  if (iso === null) return EMPTY_VALUE;
  const [year = "", month = "", day = ""] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function formatText(value: string | null): string {
  return value === null || value === "" ? EMPTY_VALUE : value;
}
