import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { getStore } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import type { Advisor } from "@/lib/types";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");
let snapshot = "";

function baseAdvisor(slug: string, name: string): Omit<Advisor, "id" | "createdAt" | "updatedAt"> {
  return {
    slug,
    name,
    title: "Movon Sales Advisor",
    phone: "60123456789",
    phoneDisplay: "60123456789",
    passwordHash: hashPassword("secret12"),
    active: true,
    featured: false,
    status: "published",
    preferredTheme: "light",
    defaultLocale: "en",
    allowLanguageToggle: true,
    allowThemeToggle: true,
    socials: {},
  };
}

let advisorA: Advisor;
let advisorB: Advisor;

beforeAll(async () => {
  snapshot = await fs.readFile(dbPath, "utf8");
  const store = getStore();
  advisorA = await store.createAdvisor(baseAdvisor(`iso-a-${Date.now()}`, "Isolation A"));
  advisorB = await store.createAdvisor(baseAdvisor(`iso-b-${Date.now()}`, "Isolation B"));
});

afterAll(async () => {
  await fs.writeFile(dbPath, snapshot, "utf8");
});

describe("data isolation", () => {
  it("returns only the requested advisor's enquiries", async () => {
    const store = getStore();
    await store.createEnquiry({
      advisorId: advisorA.id,
      advisorSlug: advisorA.slug,
      channel: "whatsapp",
      status: "new",
    });
    await store.createEnquiry({
      advisorId: advisorB.id,
      advisorSlug: advisorB.slug,
      channel: "whatsapp",
      status: "new",
    });

    const listA = await store.listEnquiries({ advisorId: advisorA.id });
    expect(listA.length).toBe(1);
    expect(listA[0].advisorId).toBe(advisorA.id);

    const listB = await store.listEnquiries({ advisorId: advisorB.id });
    expect(listB.length).toBe(1);
    expect(listB[0].advisorId).toBe(advisorB.id);
  });

  it("only updates the advisor targeted by id", async () => {
    const store = getStore();
    await store.updateAdvisor(advisorA.id, { name: "Isolation A Updated" });
    const reloadedA = await store.getAdvisorById(advisorA.id);
    const reloadedB = await store.getAdvisorById(advisorB.id);
    expect(reloadedA?.name).toBe("Isolation A Updated");
    expect(reloadedB?.name).toBe("Isolation B");
  });

  it("looks advisors up by exact slug only", async () => {
    const store = getStore();
    expect((await store.getAdvisorBySlug(advisorA.slug))?.id).toBe(advisorA.id);
    expect(await store.getAdvisorBySlug(`${advisorA.slug}-missing`)).toBeNull();
  });
});
