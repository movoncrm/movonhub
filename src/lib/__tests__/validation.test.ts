import { describe, expect, it } from "vitest";
import {
  advisorRegisterSchema,
  contentScopeSchema,
  advisorSettingsSchema,
  formBoolean,
  isReservedSlug,
  passwordSchema,
  usernameSchema,
} from "@/lib/validation";

describe("usernameSchema", () => {
  it("accepts valid usernames", () => {
    expect(usernameSchema.safeParse("nik").success).toBe(true);
    expect(usernameSchema.safeParse("nik-zubaidi").success).toBe(true);
  });
  it("rejects reserved usernames", () => {
    expect(usernameSchema.safeParse("admin").success).toBe(false);
    expect(usernameSchema.safeParse("dashboard").success).toBe(false);
    expect(usernameSchema.safeParse("api").success).toBe(false);
  });
  it("rejects invalid characters and short names", () => {
    expect(usernameSchema.safeParse("Nik").success).toBe(false);
    expect(usernameSchema.safeParse("ab").success).toBe(false);
    expect(usernameSchema.safeParse("has spaces").success).toBe(false);
    expect(usernameSchema.safeParse("trailing-").success).toBe(false);
  });
});

describe("advisorRegisterSchema", () => {
  const base = { name: "Nik Zubaidi", phone: "0123456789", slug: "nik-z", password: "secret12" };

  it("normalises the phone number", () => {
    const result = advisorRegisterSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe("60123456789");
  });

  it("rejects an invalid phone number", () => {
    expect(advisorRegisterSchema.safeParse({ ...base, phone: "123" }).success).toBe(false);
  });

  it("requires a password of at least 8 characters", () => {
    expect(advisorRegisterSchema.safeParse({ ...base, password: "123" }).success).toBe(false);
    expect(advisorRegisterSchema.safeParse({ ...base, password: "short" }).success).toBe(false);
  });

  it("requires at least one letter and one number", () => {
    expect(advisorRegisterSchema.safeParse({ ...base, password: "onlyletters" }).success).toBe(false);
    expect(advisorRegisterSchema.safeParse({ ...base, password: "12345678" }).success).toBe(false);
    expect(advisorRegisterSchema.safeParse({ ...base, password: "letter1234" }).success).toBe(true);
  });
});

describe("reserved subdomains", () => {
  it("reserves the names required for wildcard routing", () => {
    for (const name of [
      "www",
      "admin",
      "api",
      "app",
      "hub",
      "login",
      "register",
      "dashboard",
      "support",
      "mail",
      "assets",
      "static",
      "disclaimer",
    ]) {
      expect(isReservedSlug(name)).toBe(true);
    }
  });

  it("allows a normal advisor name", () => {
    expect(isReservedSlug("nik")).toBe(false);
  });
});

describe("admin settings and content schemas", () => {
  it("applies safe defaults for advisor page settings", () => {
    const result = advisorSettingsSchema.safeParse({ name: "Nik" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.defaultLocale).toBe("en");
      expect(result.data.preferredTheme).toBe("light");
      expect(result.data.allowLanguageToggle).toBe(true);
      expect(result.data.allowThemeToggle).toBe(true);
      expect(result.data.status).toBe("published");
    }
  });

  it("rejects unknown content scopes", () => {
    expect(contentScopeSchema.safeParse("site").success).toBe(true);
    expect(contentScopeSchema.safeParse("global").success).toBe(false);
  });

  it("parses checkbox form values safely", () => {
    expect(formBoolean("on")).toBe(true);
    expect(formBoolean("true")).toBe(true);
    expect(formBoolean("1")).toBe(true);
    expect(formBoolean(null)).toBe(false);
    expect(formBoolean("off")).toBe(false);
  });

  it("enforces the strengthened password policy", () => {
    expect(passwordSchema.safeParse("short").success).toBe(false);
    expect(passwordSchema.safeParse("password1").success).toBe(true);
  });
});
