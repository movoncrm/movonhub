import { describe, expect, it } from "vitest";
import { dictionaries, getDictionary, interpolate, translate } from "@/i18n";
import { defaultLocale } from "@/i18n/config";

function keys(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    keys(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("i18n", () => {
  it("defaults to English", () => {
    expect(defaultLocale).toBe("en");
    expect(getDictionary(defaultLocale).nav.products).toBe("Products");
  });

  it("has parity between ms and en keys", () => {
    const ms = keys(dictionaries.ms).sort();
    const en = keys(dictionaries.en).sort();
    expect(en).toEqual(ms);
  });

  it("avoids the word 'anda' in Malay copy", () => {
    const flat = keys(dictionaries.ms)
      .map((key) => translate(dictionaries.ms, key))
      .join(" ")
      .toLowerCase();
    expect(flat).not.toMatch(/\banda\b/);
  });

  it("resolves nested keys and interpolates variables", () => {
    expect(translate(dictionaries.en, "nav.products")).toBe("Products");
    expect(translate(dictionaries.ms, "success.subtitle", { name: "Nik" })).toContain("Nik");
  });

  it("returns the key when a translation is missing", () => {
    expect(translate(dictionaries.ms, "does.not.exist")).toBe("does.not.exist");
  });

  it("interpolates placeholders safely", () => {
    expect(interpolate("Hi {name}!")).toBe("Hi {name}!");
    expect(interpolate("Hi {name}!", { name: "Nik" })).toBe("Hi Nik!");
  });
});
