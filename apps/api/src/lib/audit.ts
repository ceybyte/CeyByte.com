import { adminAuditLog } from "@cbpos/shared/db/schema";
import type { Db } from "./db";

// 05-SCHEMA §5.8. Returns the insert so callers put it in the same db.batch as the change it records.
// Contact values are replaced, not dropped, so the log still shows that a field changed.

const CONTACT_KEY = /^(phone|whatsapp|telegram|full_?name|fullName|contact_?private|contactPrivate)$/i;

export function redactContact(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => redactContact(v, depth + 1));
  if (value instanceof Date) return value.toISOString();
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [
      k,
      CONTACT_KEY.test(k) ? "[redacted]" : redactContact(v, depth + 1),
    ]),
  );
}

export type AuditEntry = {
  actorUserId: string | null;
  action: string;
  entityType: "donation" | "merchant" | "ticket" | "doc" | "post" | "release" | "user";
  entityId?: string | null;
  level?: "info" | "warn";
  diff?: { before?: unknown; after?: unknown; note?: string };
};

export function auditInsert(db: Db, entry: AuditEntry) {
  return db.insert(adminAuditLog).values({
    actorUserId: entry.actorUserId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    level: entry.level ?? "info",
    diff: entry.diff
      ? {
          before: redactContact(entry.diff.before),
          after: redactContact(entry.diff.after),
          note: entry.diff.note,
        }
      : null,
  });
}
