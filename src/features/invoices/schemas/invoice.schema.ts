import { z } from "zod";

export const lineItemSchema = z.object({
  nameRaw: z.string(),
  nameVi: z.string(),
  quantityRaw: z.string(),
  unitPriceRaw: z.string(),
  amountRaw: z.string(),
});

export const rawInvoiceSchema = z.object({
  sellerName: z.string().nullable(),
  sellerTaxCode: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  issueDateRaw: z.string().nullable(),
  currency: z.enum(["VND", "USD", "OTHER"]),
  documentLocale: z.enum(["vi", "en", "unknown"]),
  items: z.array(lineItemSchema),
  subtotalRaw: z.string().nullable(),
  vatRaw: z.string().nullable(),
  totalRaw: z.string().nullable(),
  fieldsNeedingReview: z.array(z.string()),
});

export type LineItem = z.infer<typeof lineItemSchema>;
export type RawInvoice = z.infer<typeof rawInvoiceSchema>;
