"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requestInvoiceExtraction } from "../api/request-invoice-extraction";
import type { NormalizedInvoice } from "../lib/normalize-invoice";
import {
  ACCEPTED_MIME_TYPES,
  isAcceptedMimeType,
  MAX_FILE_BYTES,
} from "../lib/upload-rules";
import { InvoiceResult } from "./invoice-result";

type UploadState =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "success"; invoice: NormalizedInvoice }
  | { status: "error"; message: string };

const ACCEPT_ATTRIBUTE = ACCEPTED_MIME_TYPES.join(",");

function validateFile(file: File): string | null {
  if (!isAcceptedMimeType(file.type)) {
    return "Chỉ hỗ trợ ảnh JPG, PNG, WEBP và file PDF.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "File vượt quá 10MB. Vui lòng chọn file nhỏ hơn.";
  }
  return null;
}

export function InvoiceUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>({ status: "idle" });

  const processing = state.status === "processing";

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!selected) return;

    const validationError = validateFile(selected);
    if (validationError) {
      setFile(null);
      setState({ status: "error", message: validationError });
      return;
    }

    setFile(selected);
    setState({ status: "idle" });
  }

  async function handleExtract() {
    if (!file) return;

    setState({ status: "processing" });
    const result = await requestInvoiceExtraction(file);

    setState(
      result.ok
        ? { status: "success", invoice: result.invoice }
        : { status: "error", message: result.message },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col items-center gap-4 border-2 border-dashed border-slate-300 py-12 text-center">
        <div>
          <p className="text-base font-semibold">Tải lên hóa đơn</p>
          <p className="mt-1 text-sm text-slate-500">
            Hỗ trợ ảnh JPG, PNG, WEBP và file PDF, tối đa 10MB
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={processing}
            onClick={() => inputRef.current?.click()}
          >
            {file ? "Chọn file khác" : "Chọn file"}
          </Button>
          <Button
            type="button"
            disabled={!file || processing}
            onClick={handleExtract}
          >
            {processing ? "Đang đọc hóa đơn..." : "Đọc hóa đơn"}
          </Button>
        </div>

        {file ? (
          <p className="text-sm text-slate-600">Đã chọn: {file.name}</p>
        ) : null}
      </Card>

      {state.status === "processing" ? (
        <Card
          className="flex items-center gap-3 text-sm text-slate-600"
          role="status"
        >
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          Đang đọc hóa đơn, quá trình này có thể mất vài giây...
        </Card>
      ) : null}

      {state.status === "error" ? (
        <Card
          className="bg-red-50 text-sm text-red-800 ring-red-200"
          role="alert"
        >
          {state.message}
        </Card>
      ) : null}

      {state.status === "success" ? (
        <InvoiceResult invoice={state.invoice} />
      ) : null}
    </div>
  );
}
