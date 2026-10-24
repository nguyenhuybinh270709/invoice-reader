import { NextResponse } from "next/server";
import {
  normalizeInvoice,
  todayInVietnam,
} from "@/features/invoices/lib/normalize-invoice";
import { MAX_FILE_BYTES } from "@/features/invoices/lib/upload-rules";
import {
  extractInvoice,
  type ExtractFailureReason,
} from "@/features/invoices/server/extract-invoice";

type FailureResponse = {
  status: number;
  message: string;
};

const FAILURE_RESPONSES: Record<ExtractFailureReason, FailureResponse> = {
  unsupported_type: {
    status: 415,
    message: "Định dạng file không được hỗ trợ",
  },
  rate_limited: {
    status: 429,
    message:
      "Đã hết lượt đọc hóa đơn [miễn phí] trong lúc này. Vui lòng thử lại sau ít phút.",
  },
  provider_error: {
    status: 502,
    message: "Dịch vụ đọc hóa đơn đang gặp sự cố. Vui lòng thử lại.",
  },
  no_output: { status: 422, message: "Không đọc được hóa đơn" },
  invalid_output: { status: 422, message: "Dữ liệu trích xuất không hợp lệ" },
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu file" }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File vượt quá 10MB" }, { status: 413 });
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const result = await extractInvoice({ mediaType: file.type, base64 });

  if (!result.ok) {
    const failure = FAILURE_RESPONSES[result.reason];
    return NextResponse.json(
      { error: failure.message },
      { status: failure.status },
    );
  }

  const invoice = normalizeInvoice(result.invoice, { today: todayInVietnam() });
  return NextResponse.json({ invoice });
}
