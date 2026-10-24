"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,application/pdf";

export function InvoiceUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileName(file ? file.name : null);
  }

  return (
    <Card className="flex flex-col items-center gap-4 border-2 border-dashed border-slate-300 py-12 text-center">
      <div>
        <p className="text-base font-semibold text-gray-900">Tải lên hóa đơn</p>
        <p className="mt-1 text-sm text-slate-500">
          Hỗ trợ ảnh JPG, PNG, WEBP và file PDF
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleChange}
        className="hidden"
      />

      <Button type="button" onClick={() => inputRef.current?.click()}>
        Chọn file
      </Button>

      {fileName ? (
        <p className="text-sm text-slate-600">Đã chọn: {fileName}</p>
      ) : null}
    </Card>
  );
}
