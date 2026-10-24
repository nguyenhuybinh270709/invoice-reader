import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import {
  formatIsoDate,
  formatMoney,
  formatNumber,
  formatText,
} from "../lib/format-display";
import type { NormalizedInvoice } from "../lib/normalize-invoice";
import { getFieldLabel, REVIEW_FLAG_LABELS } from "../lib/review-labels";

type InvoiceResultProps = {
  invoice: NormalizedInvoice;
};

type SummaryRow = {
  label: string;
  value: string;
};

function buildSummaryRows(invoice: NormalizedInvoice): SummaryRow[] {
  return [
    { label: "Người bán", value: formatText(invoice.sellerName) },
    { label: "Mã số thuế", value: formatText(invoice.sellerTaxCode) },
    { label: "Số hóa đơn", value: formatText(invoice.invoiceNumber) },
    { label: "Ngày lập", value: formatIsoDate(invoice.issueDate) },
    {
      label: "Tạm tính",
      value: formatMoney(invoice.subtotal, invoice.currency),
    },
    { label: "Thuế VAT", value: formatMoney(invoice.vat, invoice.currency) },
    { label: "Tổng cộng", value: formatMoney(invoice.total, invoice.currency) },
  ];
}

export function InvoiceResult({ invoice }: InvoiceResultProps) {
  const approved = invoice.status === "auto_approved";
  const summaryRows = buildSummaryRows(invoice);
  const hasWarnings =
    invoice.reviewFlags.length > 0 || invoice.modelFlaggedFields.length > 0;

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Kết quả trích xuất</h2>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            approved
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700",
          )}
        >
          {approved ? "Dữ liệu khớp, có thể lưu" : "Cần kiểm tra lại"}
        </span>
      </div>

      {hasWarnings ? (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Những điểm cần bạn kiểm tra:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {invoice.reviewFlags.map((flag) => (
              <li key={flag}>{REVIEW_FLAG_LABELS[flag]}</li>
            ))}
            {invoice.modelFlaggedFields.map((field) => (
              <li key={field}>
                Hệ thống chưa chắc về trường “{getFieldLabel(field)}”
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
        {summaryRows.map((row) => (
          <div
            key={row.label}
            className="flex justify-between gap-4 border-b border-slate-100 pb-2"
          >
            <dt className="text-sm text-slate-500">{row.label}</dt>
            <dd className="text-right text-sm font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="overflow-x-auto">
        <table className="w-full min-w-lg text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 pr-4 font-medium">Tên hàng</th>
              <th className="py-2 pr-4 text-right font-medium">Số lượng</th>
              <th className="py-2 pr-4 text-right font-medium">Đơn giá</th>
              <th className="py-2 text-right font-medium">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr
                key={`${index}-${item.nameRaw}`}
                className="border-b border-slate-100 align-top"
              >
                <td className="py-2 pr-4">
                  <p className="font-medium">{item.nameVi}</p>
                  {item.nameVi !== item.nameRaw ? (
                    <p className="text-xs text-slate-400">
                      Gốc: {item.nameRaw}
                    </p>
                  ) : null}
                </td>
                <td className="py-2 pr-4 text-right">
                  {formatNumber(item.quantity)}
                </td>
                <td className="py-2 pr-4 text-right">
                  {formatMoney(item.unitPrice, invoice.currency)}
                </td>
                <td className="py-2 text-right">
                  {formatMoney(item.amount, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
