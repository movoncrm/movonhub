export function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Normalise a Malaysian phone number into 60XXXXXXXXX form. Returns null if invalid. */
export function normaliseMyPhone(input: string): string | null {
  if (!input) return null;
  let digits = input.replace(/[^0-9]/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = "60" + digits.slice(1);
  if (digits.startsWith("1") && digits.length >= 9 && digits.length <= 11) {
    digits = "60" + digits;
  }
  // Malaysian mobile: 60 1X-XXXXXXX (9-10 digits after 60) but allow landlines too.
  if (!/^60\d{8,11}$/.test(digits)) return null;
  return digits;
}

export function formatMyPhone(phone: string): string {
  const d = phone.replace(/[^0-9]/g, "");
  if (d.startsWith("60") && d.length >= 11) {
    return `+${d.slice(0, 2)} ${d.slice(2, 4)}-${d.slice(4, 7)} ${d.slice(7)}`;
  }
  return phone;
}

export function formatRM(amount?: number | null): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  return `RM ${amount.toLocaleString("en-MY", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(iso?: string, locale = "ms"): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(locale.startsWith("en") ? "en-MY" : "ms-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function isExpired(endDate?: string, at: Date = new Date()): boolean {
  if (!endDate) return false;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return false;
  return end.getTime() < at.getTime();
}

export function isUpcoming(startDate?: string, at: Date = new Date()): boolean {
  if (!startDate) return false;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return false;
  return start.getTime() > at.getTime();
}

export function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

/**
 * Serialise an object for embedding inside a <script type="application/ld+json">
 * tag. Escapes characters that could otherwise terminate the script element and
 * inject markup. JSON.stringify alone does not escape "<".
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
