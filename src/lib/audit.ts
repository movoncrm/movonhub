import { getStore } from "@/lib/db";
import type { SessionUser } from "@/lib/types";

export interface AuditActor {
  id: string;
  role: string;
}

export type AuditMetadata = Record<string, string | number | boolean | null | undefined>;

/**
 * Append a record to the sensitive-operation audit trail.
 *
 * Never pass passwords, hashes, tokens, session secrets or service role keys in
 * `metadata`. Audit failures must never break the primary operation.
 */
export async function logAudit(
  actor: AuditActor | SessionUser | null,
  action: string,
  target?: { type?: string; id?: string },
  metadata?: AuditMetadata,
): Promise<void> {
  try {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(metadata ?? {})) {
      if (value !== undefined) clean[key] = value;
    }
    await getStore().createAuditLog({
      actorId: actor?.id ?? "anonymous",
      actorRole: actor?.role ?? "anonymous",
      action,
      targetType: target?.type,
      targetId: target?.id,
      metadata: clean,
    });
  } catch (error) {
    console.error("[audit] failed to record", action, error instanceof Error ? error.message : error);
  }
}
