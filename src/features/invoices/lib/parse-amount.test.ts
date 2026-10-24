import { describe, expect, it } from "vitest";
import { detectNumberLocale, parseAmount } from "./parse-amount";

describe("parseAmount", () => {
  it("đọc số kiểu Việt với dấu chấm phân cách hàng nghìn", () => {
    expect(parseAmount("1.234", "vi")).toBe(1234);
    expect(parseAmount("1.234.000", "vi")).toBe(1234000);
  });

  it("đọc số kiểu Việt với dấu phẩy thập phân", () => {
    expect(parseAmount("1.234,50", "vi")).toBe(1234.5);
  });

  it("đọc số kiểu Anh với dấu phẩy phân cách hàng nghìn", () => {
    expect(parseAmount("1,234", "en")).toBe(1234);
    expect(parseAmount("1,234.50", "en")).toBe(1234.5);
  });

  it("bỏ ký hiệu tiền tệ và khoảng trắng", () => {
    expect(parseAmount("1.234.000 đ", "vi")).toBe(1234000);
    expect(parseAmount("$1,234.50", "en")).toBe(1234.5);
  });

  it("giữ dấu âm", () => {
    expect(parseAmount("-5.000", "vi")).toBe(-5000);
  });

  it("trả về null khi không có chữ số", () => {
    expect(parseAmount("abc", "vi")).toBeNull();
    expect(parseAmount("", "en")).toBeNull();
  });
});

describe("detectNumberLocale", () => {
  it("nhận ra locale Việt khi tổng các dòng khớp tổng cộng", () => {
    expect(detectNumberLocale(["500.000", "734.000"], "1.234.000")).toBe("vi");
  });

  it("nhận ra locale Anh khi tổng các dòng khớp tổng cộng", () => {
    expect(detectNumberLocale(["500.00", "734.50"], "1,234.50")).toBe("en");
  });

  it("trả về null khi cả hai locale đều khớp", () => {
    expect(detectNumberLocale(["1.000"], "1.000")).toBeNull();
  });

  it("trả về null khi không locale nào khớp", () => {
    expect(detectNumberLocale(["100"], "999")).toBeNull();
  });
});
