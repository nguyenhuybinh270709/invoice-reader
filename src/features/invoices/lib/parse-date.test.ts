import { describe, expect, it } from "vitest";
import { parseDate } from "./parse-date";

describe("parseDate", () => {
  it("chắc chắn là ngày/tháng khi số đầu lớn hơn 12", () => {
    expect(parseDate("25/6/2026", "mdy")).toEqual({
      iso: "2026-06-25",
      ambiguous: false,
    });
  });

  it("chắc chắn là tháng/ngày khi số thứ hai lớn hơn 12", () => {
    expect(parseDate("6/25/2026", "dmy")).toEqual({
      iso: "2026-06-25",
      ambiguous: false,
    });
  });

  it("3/6/2026 theo thứ tự ngày/tháng là ngày 3 tháng 6 và bị đánh dấu mơ hồ", () => {
    expect(parseDate("3/6/2026", "dmy")).toEqual({
      iso: "2026-06-03",
      ambiguous: true,
    });
  });

  it("3/6/2026 theo thứ tự tháng/ngày là ngày 6 tháng 3 và bị đánh dấu mơ hồ", () => {
    expect(parseDate("3/6/2026", "mdy")).toEqual({
      iso: "2026-03-06",
      ambiguous: true,
    });
  });

  it("không mơ hồ khi ngày và tháng bằng nhau", () => {
    expect(parseDate("5/5/2026", "dmy")).toEqual({
      iso: "2026-05-05",
      ambiguous: false,
    });
  });

  it("đọc dạng chữ tiếng Việt và luôn hiểu là ngày trước tháng", () => {
    expect(parseDate("Ngày 03 tháng 06 năm 2026", "mdy")).toEqual({
      iso: "2026-06-03",
      ambiguous: false,
    });
  });

  it("đổi năm hai chữ số thành năm 20xx", () => {
    expect(parseDate("03-06-26", "dmy")).toEqual({
      iso: "2026-06-03",
      ambiguous: true,
    });
  });

  it("chấp nhận ngày nhuận hợp lệ", () => {
    expect(parseDate("29/02/2024", "dmy")).toEqual({
      iso: "2024-02-29",
      ambiguous: false,
    });
  });

  it("từ chối ngày không tồn tại", () => {
    expect(parseDate("31/04/2026", "dmy")).toBeNull();
    expect(parseDate("29/02/2026", "dmy")).toBeNull();
  });

  it("trả về null khi không tìm thấy ngày", () => {
    expect(parseDate("không có ngày", "dmy")).toBeNull();
  });
});
