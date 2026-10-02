import { describe, expect, it } from "vitest";
import { advisorRegisterSchema, usernameSchema } from "@/lib/validation";

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
  const base = { name: "Nik Zubaidi", phone: "0123456789", slug: "nik-z", password: "secret1" };

  it("normalises the phone number", () => {
    const result = advisorRegisterSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe("60123456789");
  });

  it("rejects an invalid phone number", () => {
    expect(advisorRegisterSchema.safeParse({ ...base, phone: "123" }).success).toBe(false);
  });

  it("requires a password of at least 6 characters", () => {
    expect(advisorRegisterSchema.safeParse({ ...base, password: "123" }).success).toBe(false);
  });
});
