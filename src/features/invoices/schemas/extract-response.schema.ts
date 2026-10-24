import { z } from "zod";
import type { NormalizedInvoice } from "../lib/normalize-invoice";

const reviewFlagSchema = z.enum([
  "no_items",
  "total_missing",
  "amount_unreadable",
  "number_locale_uncertain",
  "totals_mismatch",
  "totals_unverifiable",
  "issue_date_missing",
  "issue_date_invalid",
  "issue_date_ambiguous",
  "issue_date_in_future",
]);

const normalizedLineItemSchema = z.object({
  nameRaw: z.string(),
  nameVi: z.string(),
  quantity: z.number().nullable(),
  unitPrice: z.number().nullable(),
  amount: z.number().nullable(),
});

export const normalizedInvoiceSchema = z.object({
  sellerName: z.string().nullable(),
  sellerTaxCode: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  issueDate: z.string().nullable(),
  currency: z.enum(["VND", "USD", "OTHER"]),
  numberLocale: z.enum(["vi", "en"]),
  items: z.array(normalizedLineItemSchema),
  subtotal: z.number().nullable(),
  vat: z.number().nullable(),
  total: z.number().nullable(),
  reviewFlags: z.array(reviewFlagSchema),
  modelFlaggedFields: z.array(z.string()),
  status: z.enum(["auto_approved", "needs_review"]),
}) satisfies z.ZodType<NormalizedInvoice>;

export const extractSuccessSchema = z.object({
  invoice: normalizedInvoiceSchema,
});

export const extractErrorSchema = z.object({
  error: z.string(),
});
