import { describe, expect, it } from "vitest";
import { isExpired, isUpcoming, normaliseMyPhone, slugify, truncate } from "@/lib/utils";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Nik Muhammad Zubaidi!")).toBe("nik-muhammad-zubaidi");
  });
  it("trims leading/trailing hyphens", () => {
    expect(slugify("  --Hello World--  ")).toBe("hello-world");
  });
});

describe("normaliseMyPhone", () => {
  it("accepts 60-prefixed numbers", () => {
    expect(normaliseMyPhone("60123456789")).toBe("60123456789");
  });
  it("converts local 0-prefixed numbers", () => {
    expect(normaliseMyPhone("0123456789")).toBe("60123456789");
  });
  it("strips spaces and symbols", () => {
    expect(normaliseMyPhone("+60 12-345 6789")).toBe("60123456789");
  });
  it("rejects invalid input", () => {
    expect(normaliseMyPhone("123")).toBeNull();
    expect(normaliseMyPhone("abc")).toBeNull();
  });
});

describe("date helpers", () => {
  const at = new Date("2026-06-01T00:00:00Z");
  it("detects expired promotions", () => {
    expect(isExpired("2026-05-01", at)).toBe(true);
    expect(isExpired("2026-07-01", at)).toBe(false);
    expect(isExpired(undefined, at)).toBe(false);
  });
  it("detects upcoming promotions", () => {
    expect(isUpcoming("2026-07-01", at)).toBe(true);
    expect(isUpcoming("2026-05-01", at)).toBe(false);
  });
});

describe("truncate", () => {
  it("leaves short text untouched", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });
  it("truncates long text with an ellipsis", () => {
    expect(truncate("a".repeat(20), 10)).toHaveLength(10);
  });
});
