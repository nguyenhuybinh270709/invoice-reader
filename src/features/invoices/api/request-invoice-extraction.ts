import type { NormalizedInvoice } from "../lib/normalize-invoice";
import {
  extractErrorSchema,
  extractSuccessSchema,
} from "../schemas/extract-response.schema";

export type ExtractionRequestResult =
  | { ok: true; invoice: NormalizedInvoice }
  | { ok: false; message: string };

const NETWORK_ERROR_MESSAGE =
  "Không kết nối được tới máy chủ. Vui lòng thử lại.";
const UNKNOWN_ERROR_MESSAGE =
  "Có lỗi xảy ra khi đọc hóa đơn. Vui lòng thử lại.";

export async function requestInvoiceExtraction(
  file: File,
): Promise<ExtractionRequestResult> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch("/api/invoices/extract", {
      method: "POST",
      body: formData,
    });
  } catch {
    return { ok: false, message: NETWORK_ERROR_MESSAGE };
  }

  const body: unknown = await response.json().catch(() => null);

  if (response.ok) {
    const parsed = extractSuccessSchema.safeParse(body);
    return parsed.success
      ? { ok: true, invoice: parsed.data.invoice }
      : { ok: false, message: UNKNOWN_ERROR_MESSAGE };
  }

  const parsedError = extractErrorSchema.safeParse(body);
  return {
    ok: false,
    message: parsedError.success
      ? parsedError.data.error
      : UNKNOWN_ERROR_MESSAGE,
  };
}
