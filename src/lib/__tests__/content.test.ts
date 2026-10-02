import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { getResolvedContent, contentKeyDef } from "@/lib/content";
import { getStore } from "@/lib/db";
import { dictionaries, translate } from "@/i18n";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");
let snapshot = "";
const ADVISOR_ID = "adv_demo_nik";

async function clearTestContent() {
  const store = getStore();
  for (const scope of ["site", "sa_global"] as const) {
    for (const key of ["home.headline", "home.eyebrow", "sa.heroHeadline"]) {
      await store.deleteSiteContent({ scope, contentKey: key });
    }
  }
  for (const key of ["sa.heroHeadline", "home.headline"]) {
    await store.deleteSiteContent({ scope: "sa", advisorId: ADVISOR_ID, contentKey: key });
  }
}

beforeAll(async () => {
  snapshot = await fs.readFile(dbPath, "utf8");
  await clearTestContent();
});

afterAll(async () => {
  await fs.writeFile(dbPath, snapshot, "utf8");
});

describe("content resolution", () => {
  it("falls back to the built-in dictionary default when no override exists", async () => {
    const content = await getResolvedContent("en", null);
    expect(content.get("home.headline")).toBe(dictionaries.en.comingSoon.title);
    expect(content.get("home.headline")).toBe("Something Exciting Is Coming.");
  });

  it("uses a published override and ignores drafts", async () => {
    const store = getStore();
    await store.upsertSiteContent({
      scope: "site",
      contentKey: "home.headline",
      locale: "en",
      value: "Draft headline",
      status: "draft",
    });
    let content = await getResolvedContent("en", null);
    expect(content.get("home.headline")).toBe(dictionaries.en.comingSoon.title);

    await store.upsertSiteContent({
      scope: "site",
      contentKey: "home.headline",
      locale: "en",
      value: "Published headline",
      status: "published",
    });
    content = await getResolvedContent("en", null);
    expect(content.get("home.headline")).toBe("Published headline");
    expect(content.isOverridden("home.headline")).toBe(true);
  });

  it("resolves Bahasa Melayu and English independently", async () => {
    const store = getStore();
    await store.upsertSiteContent({
      scope: "site",
      contentKey: "home.headline",
      locale: "ms",
      value: "Tajuk Bahasa Melayu",
      status: "published",
    });
    const en = await getResolvedContent("en", null);
    const ms = await getResolvedContent("ms", null);
    expect(en.get("home.headline")).toBe("Published headline");
    expect(ms.get("home.headline")).toBe("Tajuk Bahasa Melayu");
  });

  it("applies SA global defaults and lets an advisor override win", async () => {
    const store = getStore();
    await store.upsertSiteContent({
      scope: "sa_global",
      contentKey: "sa.heroHeadline",
      locale: "en",
      value: "Global SA hero",
      status: "published",
    });
    let forNik = await getResolvedContent("en", ADVISOR_ID);
    expect(forNik.get("sa.heroHeadline")).toBe("Global SA hero");

    await store.upsertSiteContent({
      scope: "sa",
      advisorId: ADVISOR_ID,
      contentKey: "sa.heroHeadline",
      locale: "en",
      value: "Nik hero",
      status: "published",
    });
    forNik = await getResolvedContent("en", ADVISOR_ID);
    expect(forNik.get("sa.heroHeadline")).toBe("Nik hero");

    // Another advisor without an override still gets the global value.
    const other = await getResolvedContent("en", "someone-else");
    expect(other.get("sa.heroHeadline")).toBe("Global SA hero");
  });

  it("treats markup as plain text (no raw HTML execution path)", async () => {
    const store = getStore();
    const payload = "<script>alert('xss')</script>";
    await store.upsertSiteContent({
      scope: "site",
      contentKey: "home.eyebrow",
      locale: "en",
      value: payload,
      status: "published",
    });
    const content = await getResolvedContent("en", null);
    expect(content.get("home.eyebrow")).toBe(payload);
  });

  it("interpolates placeholders from the override and from the default", async () => {
    const content = await getResolvedContent("en", ADVISOR_ID);
    expect(content.get("sa.heroSubtitle", { name: "Nik" })).toContain("Nik");
  });

  it("never returns an empty string for a known key", async () => {
    const content = await getResolvedContent("en", null);
    for (const key of ["home.eyebrow", "home.headline", "home.seoTitle"]) {
      expect(content.get(key).length).toBeGreaterThan(0);
    }
    expect(contentKeyDef("home.headline")?.scope).toBe("site");
    expect(translate(dictionaries.ms, "does.not.exist")).toBe("does.not.exist");
  });
});
