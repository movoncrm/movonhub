import { afterAll, describe, expect, it } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { registerAdvisor } from "@/lib/services/advisors";
import { getStore } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";

const slug = `testadvisor${Date.now()}`;
const dbPath = path.join(process.cwd(), "src", "data", "db.json");

describe("registerAdvisor", () => {
  it("creates an advisor with a hashed password", async () => {
    const result = await registerAdvisor({
      name: "Test Advisor",
      phone: "0123456789",
      slug,
      password: "secret1",
      bio: "Hello",
    });
    expect(result.ok).toBe(true);
    expect(result.data?.slug).toBe(slug);
    expect(result.data?.phone).toBe("60123456789");
    expect(result.data?.passwordHash).not.toContain("secret1");
    expect(verifyPassword("secret1", result.data!.passwordHash)).toBe(true);
  });

  it("rejects a duplicate username", async () => {
    const result = await registerAdvisor({
      name: "Duplicate",
      phone: "0123456789",
      slug,
      password: "secret1",
    });
    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.slug).toBeTruthy();
  });

  it("rejects reserved usernames and invalid phones", async () => {
    const reserved = await registerAdvisor({ name: "X", phone: "0123456789", slug: "admin", password: "secret1" });
    expect(reserved.ok).toBe(false);
    const badPhone = await registerAdvisor({ name: "X", phone: "123", slug: "validslug", password: "secret1" });
    expect(badPhone.ok).toBe(false);
  });

  it("persists the advisor so it can be fetched by slug", async () => {
    const found = await getStore().getAdvisorBySlug(slug);
    expect(found?.name).toBe("Test Advisor");
  });
});

afterAll(async () => {
  const db = JSON.parse(await fs.readFile(dbPath, "utf8"));
  db.advisors = db.advisors.filter((a: { slug: string }) => a.slug !== slug);
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2), "utf8");
});
