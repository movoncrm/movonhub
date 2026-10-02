import { describe, expect, it } from "vitest";
import { resolveAdvisorLocale, resolveAdvisorTheme } from "@/lib/saSettings";

describe("resolveAdvisorLocale", () => {
  it("applies the advisor default for a new visitor with no cookie", () => {
    expect(resolveAdvisorLocale({ defaultLocale: "ms", allowLanguageToggle: true })).toBe("ms");
    expect(resolveAdvisorLocale({ defaultLocale: "en", allowLanguageToggle: true })).toBe("en");
  });

  it("lets a stored visitor preference override the default when toggling is allowed", () => {
    expect(resolveAdvisorLocale({ defaultLocale: "en", allowLanguageToggle: true }, "ms")).toBe("ms");
  });

  it("enforces the configured default when the toggle is disabled", () => {
    expect(resolveAdvisorLocale({ defaultLocale: "ms", allowLanguageToggle: false }, "en")).toBe("ms");
  });

  it("falls back to English when no default is configured", () => {
    expect(resolveAdvisorLocale({ allowLanguageToggle: true })).toBe("en");
  });
});

describe("resolveAdvisorTheme", () => {
  it("applies the advisor default for a new visitor", () => {
    expect(resolveAdvisorTheme({ preferredTheme: "dark", allowThemeToggle: true })).toBe("dark");
  });

  it("lets a stored preference override the default when enabled", () => {
    expect(resolveAdvisorTheme({ preferredTheme: "light", allowThemeToggle: true }, "dark")).toBe("dark");
  });

  it("enforces the configured default when the theme toggle is disabled", () => {
    expect(resolveAdvisorTheme({ preferredTheme: "light", allowThemeToggle: false }, "dark")).toBe("light");
  });
});
