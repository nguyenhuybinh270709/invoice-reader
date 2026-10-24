import { describe, expect, it } from "vitest";
import { detectNumberLocale, parseAmount, sumOrNull } from "./parse-amount";

describe("parseAmount", () => {
  it("đọc số kiểu Việt với dấu chấm phân cách hàng nghìn", () => {
    expect(parseAmount("1.234", "vi")).toBe(1234);
    expect(parseAmount("1.234.000", "vi")).toBe(1234000);
  });

  it("đọc số kiểu Việt với dấu phẩy thập phân", () => {
    expect(parseAmount("1.234,50", "vi")).toBe(1234.5);
    expect(parseAmount("0,5", "vi")).toBe(0.5);
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

  it("đọc số không có dấu phân cách", () => {
    expect(parseAmount("1234567", "vi")).toBe(1234567);
    expect(parseAmount("1234567", "en")).toBe(1234567);
  });

  it("từ chối nhóm hàng nghìn không đủ 3 chữ số", () => {
    expect(parseAmount("10.50", "vi")).toBeNull();
    expect(parseAmount("1,23", "en")).toBeNull();
    expect(parseAmount("1.2345.678", "vi")).toBeNull();
  });

  it("từ chối số có nhiều dấu thập phân", () => {
    expect(parseAmount("1,2,3", "vi")).toBeNull();
    expect(parseAmount("1.2.3", "en")).toBeNull();
  });

  it("trả về null khi không có chữ số", () => {
    expect(parseAmount("abc", "vi")).toBeNull();
    expect(parseAmount("", "en")).toBeNull();
  });
});

describe("sumOrNull", () => {
  it("cộng tất cả giá trị", () => {
    expect(sumOrNull([1, 2, 3])).toBe(6);
  });

  it("trả về null khi có giá trị null", () => {
    expect(sumOrNull([1, null, 3])).toBeNull();
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
