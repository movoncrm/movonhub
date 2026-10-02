import { describe, expect, it } from "vitest";
import { buildEnquiryMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

describe("buildEnquiryMessage", () => {
  it("includes advisor, product and attribution", () => {
    const message = buildEnquiryMessage({
      advisorName: "Nik",
      product: "MOVON DuoMate+",
      sourceUrl: "https://movonhub.com.my/sa/nik",
    });
    expect(message).toContain("Hi Nik");
    expect(message).toContain("MOVON DuoMate+");
    expect(message).toContain("MovonHub");
    expect(message).toContain("https://movonhub.com.my/sa/nik");
  });

  it("handles a general enquiry with no product", () => {
    const message = buildEnquiryMessage({ advisorName: "Nik" });
    expect(message).toContain("Hi Nik");
    expect(message).not.toContain("undefined");
  });
});

describe("buildWhatsAppUrl", () => {
  it("encodes the message", () => {
    const url = buildWhatsAppUrl("60123456789", "Hi there & welcome");
    expect(url.startsWith("https://wa.me/60123456789?text=")).toBe(true);
    expect(url).toContain(encodeURIComponent("Hi there & welcome"));
  });

  it("strips non-digits from the phone number", () => {
    expect(buildWhatsAppUrl("+60 12-345 6789")).toBe("https://wa.me/60123456789");
  });
});
