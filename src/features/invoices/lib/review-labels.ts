import type { ReviewFlag } from "./normalize-invoice";

export const REVIEW_FLAG_LABELS: Record<ReviewFlag, string> = {
  no_items: "Không đọc được dòng hàng nào",
  total_missing: "Thiếu tổng cộng",
  amount_unreadable: "Có số tiền không đọc được",
  number_locale_uncertain:
    "Chưa chắc cách phân cách số (dấu chấm hay dấu phẩy)",
  totals_mismatch: "Tổng tiền không khớp với các dòng hàng",
  totals_unverifiable: "Không đủ số liệu để đối chiếu tổng tiền",
  issue_date_missing: "Thiếu ngày lập hóa đơn",
  issue_date_invalid: "Ngày lập hóa đơn không hợp lệ",
  issue_date_ambiguous:
    "Ngày lập có thể hiểu theo hai cách (ngày/tháng hoặc tháng/ngày)",
  issue_date_in_future: "Ngày lập nằm trong tương lai",
};

const FIELD_LABELS: Record<string, string> = {
  sellerName: "Tên người bán",
  sellerTaxCode: "Mã số thuế",
  invoiceNumber: "Số hóa đơn",
  issueDateRaw: "Ngày lập",
  currency: "Loại tiền",
  items: "Dòng hàng",
  subtotalRaw: "Tạm tính",
  vatRaw: "Thuế VAT",
  totalRaw: "Tổng cộng",
};

export function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}
