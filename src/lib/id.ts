import { randomUUID } from "crypto";

/** Server-only helpers. Do not import from client components. */

export function newId(): string {
  return randomUUID();
}

export function nowISO(): string {
  return new Date().toISOString();
}
