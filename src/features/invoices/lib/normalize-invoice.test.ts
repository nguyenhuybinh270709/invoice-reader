import { describe, expect, it } from "vitest";
import type { RawInvoice } from "../schemas/invoice.schema";
import { normalizeInvoice } from "./normalize-invoice";

const TODAY = "2026-10-24";

function makeRaw(overrides: Partial<RawInvoice> = {}): RawInvoice {
  return {
    sellerName: "Quán Cơm Hòa Bình",
    sellerTaxCode: "0312345678",
    invoiceNumber: "0001234",
    issueDateRaw: "25/06/2026",
    currency: "VND",
    documentLocale: "vi",
    items: [
      {
        nameRaw: "BANH MI THIT NGUOI",
        nameVi: "Bánh mì thịt nguội",
        quantityRaw: "2",
        unitPriceRaw: "250.000",
        amountRaw: "500.000",
      },
      {
        nameRaw: "COM GA XOI MO",
        nameVi: "Cơm gà xối mỡ",
        quantityRaw: "1",
        unitPriceRaw: "734.000",
        amountRaw: "734.000",
      },
    ],
    subtotalRaw: "1.234.000",
    vatRaw: "123.400",
    totalRaw: "1.357.400",
    fieldsNeedingReview: [],
    ...overrides,
  };
}

describe("normalizeInvoice", () => {
  it("chuẩn hóa hóa đơn tiếng Việt hợp lệ và tự động duyệt", () => {
    const result = normalizeInvoice(makeRaw(), { today: TODAY });

    expect(result.numberLocale).toBe("vi");
    expect(result.issueDate).toBe("2026-06-25");
    expect(result.subtotal).toBe(1234000);
    expect(result.vat).toBe(123400);
    expect(result.total).toBe(1357400);
    expect(result.items[0]?.quantity).toBe(2);
    expect(result.items[0]?.amount).toBe(500000);
    expect(result.reviewFlags).toEqual([]);
    expect(result.status).toBe("auto_approved");
  });

  it("giữ nguyên tên gốc và tên đã thêm dấu", () => {
    const result = normalizeInvoice(makeRaw(), { today: TODAY });

    expect(result.items[0]?.nameRaw).toBe("BANH MI THIT NGUOI");
    expect(result.items[0]?.nameVi).toBe("Bánh mì thịt nguội");
  });

  it("chuẩn hóa hóa đơn tiếng Anh theo locale Anh và thứ tự tháng trước ngày", () => {
    const result = normalizeInvoice(
      makeRaw({
        currency: "USD",
        documentLocale: "en",
        issueDateRaw: "06/25/2026",
        items: [
          {
            nameRaw: "Coffee",
            nameVi: "Coffee",
            quantityRaw: "1",
            unitPriceRaw: "10.50",
            amountRaw: "10.50",
          },
          {
            nameRaw: "Sandwich",
            nameVi: "Sandwich",
            quantityRaw: "1",
            unitPriceRaw: "20.25",
            amountRaw: "20.25",
          },
        ],
        subtotalRaw: null,
        vatRaw: null,
        totalRaw: "30.75",
      }),
      { today: TODAY },
    );

    expect(result.numberLocale).toBe("en");
    expect(result.issueDate).toBe("2026-06-25");
    expect(result.total).toBe(30.75);
    expect(result.status).toBe("auto_approved");
  });

  it("hiểu 3/6/2026 là ngày 3 tháng 6 với hóa đơn VND và gắn cờ mơ hồ", () => {
    const result = normalizeInvoice(makeRaw({ issueDateRaw: "3/6/2026" }), {
      today: TODAY,
    });

    expect(result.issueDate).toBe("2026-06-03");
    expect(result.reviewFlags).toContain("issue_date_ambiguous");
    expect(result.status).toBe("needs_review");
  });

  it("hiểu 3/6/2026 là ngày 6 tháng 3 với hóa đơn USD và gắn cờ mơ hồ", () => {
    const result = normalizeInvoice(
      makeRaw({
        currency: "USD",
        documentLocale: "en",
        issueDateRaw: "3/6/2026",
        subtotalRaw: null,
        vatRaw: null,
        totalRaw: "1,234.00",
        items: [
          {
            nameRaw: "Service",
            nameVi: "Service",
            quantityRaw: "1",
            unitPriceRaw: "1,234.00",
            amountRaw: "1,234.00",
          },
        ],
      }),
      { today: TODAY },
    );

    expect(result.issueDate).toBe("2026-03-06");
    expect(result.reviewFlags).toContain("issue_date_ambiguous");
  });

  it("gắn cờ khi ngày nằm trong tương lai", () => {
    const result = normalizeInvoice(makeRaw({ issueDateRaw: "25/12/2026" }), {
      today: TODAY,
    });

    expect(result.reviewFlags).toContain("issue_date_in_future");
    expect(result.status).toBe("needs_review");
  });

  it("gắn cờ khi ngày không hợp lệ hoặc thiếu", () => {
    const invalid = normalizeInvoice(makeRaw({ issueDateRaw: "31/04/2026" }), {
      today: TODAY,
    });
    const missing = normalizeInvoice(makeRaw({ issueDateRaw: null }), {
      today: TODAY,
    });

    expect(invalid.issueDate).toBeNull();
    expect(invalid.reviewFlags).toContain("issue_date_invalid");
    expect(missing.reviewFlags).toContain("issue_date_missing");
  });

  it("gắn cờ khi tổng cộng không khớp các dòng hàng", () => {
    const result = normalizeInvoice(makeRaw({ totalRaw: "1.400.000" }), {
      today: TODAY,
    });

    expect(result.reviewFlags).toContain("totals_mismatch");
    expect(result.reviewFlags).not.toContain("number_locale_uncertain");
    expect(result.status).toBe("needs_review");
  });

  it("gắn cờ khi không có số liệu tổng để đối chiếu", () => {
    const result = normalizeInvoice(
      makeRaw({ subtotalRaw: null, vatRaw: null, totalRaw: null }),
      { today: TODAY },
    );

    expect(result.reviewFlags).toContain("total_missing");
    expect(result.reviewFlags).toContain("totals_unverifiable");
    expect(result.reviewFlags).toContain("number_locale_uncertain");
    expect(result.status).toBe("needs_review");
  });

  it("gắn cờ khi hóa đơn không có dòng hàng", () => {
    const result = normalizeInvoice(makeRaw({ items: [] }), { today: TODAY });

    expect(result.reviewFlags).toContain("no_items");
    expect(result.status).toBe("needs_review");
  });

  it("chuyển tiếp các trường mô hình đánh dấu cần review", () => {
    const result = normalizeInvoice(
      makeRaw({ fieldsNeedingReview: ["sellerName"] }),
      {
        today: TODAY,
      },
    );

    expect(result.modelFlaggedFields).toEqual(["sellerName"]);
    expect(result.reviewFlags).toEqual([]);
    expect(result.status).toBe("needs_review");
  });
});
