/**
 * WhatsApp deep-link helpers with advisor + product attribution.
 * Phone numbers must be in international form without "+" (e.g. 60123456789).
 */

export interface EnquiryMessageInput {
  advisorName?: string;
  product?: string;
  sourceUrl?: string;
  customerName?: string;
  extra?: string;
}

export function buildEnquiryMessage(input: EnquiryMessageInput): string {
  const advisor = input.advisorName?.trim();
  const product = input.product?.trim();

  const lines: string[] = [];
  if (product) {
    lines.push(
      advisor
        ? `Hi ${advisor}, I'm interested in ${product}. I found your profile on MovonHub. Can you share more information?`
        : `Hi, I'm interested in ${product}. I found this on MovonHub. Can you share more information?`,
    );
  } else {
    lines.push(
      advisor
        ? `Hi ${advisor}, I'd like to know more about MOVON products. I found your profile on MovonHub.`
        : `Hi, I'd like to know more about MOVON products. I found this on MovonHub.`,
    );
  }

  if (input.customerName?.trim()) lines.push(`My name is ${input.customerName.trim()}.`);
  if (input.extra?.trim()) lines.push(input.extra.trim());
  if (input.sourceUrl?.trim()) lines.push(`(Sent from: ${input.sourceUrl.trim()})`);

  return lines.join("\n");
}

export function buildWhatsAppUrl(phone: string, message?: string): string {
  const clean = (phone || "").replace(/[^0-9]/g, "");
  const base = `https://wa.me/${clean}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function buildShareUrl(url: string, text?: string): string {
  const base = `https://wa.me/?text=${encodeURIComponent(text ? `${text} ${url}` : url)}`;
  return base;
}
