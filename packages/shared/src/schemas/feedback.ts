import { z } from "zod";
import { TICKET_TYPES, TICKET_STATUSES, TICKET_SEVERITIES } from "../enums";

export const FeedbackSubmitSchema = z.object({
  type: z.enum(TICKET_TYPES).default("bug"),
  title: z
    .string()
    .min(8, "Title must be at least 8 characters")
    .max(120, "Title cannot exceed 120 characters")
    .trim(),
  bodyMd: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description cannot exceed 5000 characters")
    .trim(),
  appVersion: z.string().max(50).optional().nullable(),
  windowsVersion: z.string().max(50).optional().nullable(),
  severity: z.enum(TICKET_SEVERITIES).optional().nullable(),
  contactPrivate: z.string().max(120).optional().nullable(),
  draftId: z.string().min(1).max(64).optional().nullable(),
  crashLogKey: z.string().max(256).optional().nullable(),
  screenshotKey: z.string().max(256).optional().nullable(),
  reportedMerchantId: z.string().min(1).max(64).optional().nullable(),
  turnstileToken: z.string().optional(),
});

export type FeedbackSubmitInput = z.infer<typeof FeedbackSubmitSchema>;

export const FeedbackQuerySchema = z.object({
  type: z
    .enum([...TICKET_TYPES, "all"])
    .optional()
    .default("all"),
  status: z
    .enum([...TICKET_STATUSES, "all"])
    .optional()
    .default("all"),
  sort: z.enum(["votes", "newest"]).optional().default("votes"),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(50).optional().default(20),
  search: z.string().max(100).optional(),
});

export type FeedbackQueryInput = z.infer<typeof FeedbackQuerySchema>;

export const FeedbackVoteSchema = z.object({
  turnstileToken: z.string().optional(),
});

export type FeedbackVoteInput = z.infer<typeof FeedbackVoteSchema>;

export const FeedbackAdminUpdateSchema = z.object({
  status: z.enum(TICKET_STATUSES).optional(),
  severity: z.enum(TICKET_SEVERITIES).optional().nullable(),
  adminResponseMd: z.string().max(5000).optional().nullable(),
  duplicateOfId: z.string().min(1).max(64).optional().nullable(),
  resolvedInReleaseId: z.string().min(1).max(64).optional().nullable(),
  isPublic: z.boolean().optional(),
  approveScreenshot: z.boolean().optional(),
});

export type FeedbackAdminUpdateInput = z.infer<typeof FeedbackAdminUpdateSchema>;

/**
 * Formats an integer ticket number to standard display representation, e.g. 1 -> "CB-0001", 142 -> "CB-0142".
 */
export function formatTicketNumber(publicNumber: number): string {
  const safeNum = Math.max(0, Math.floor(publicNumber));
  return `CB-${String(safeNum).padStart(4, "0")}`;
}

/**
 * Parses a ticket number from formats like "CB-0142", "cb-0142", "142", or returns null if invalid.
 */
export function parseTicketNumber(formatted: string): number | null {
  if (!formatted || typeof formatted !== "string") return null;
  const match = formatted.trim().match(/^(?:cb-)?(\d+)$/i);
  if (!match || !match[1]) return null;
  const num = parseInt(match[1], 10);
  return Number.isNaN(num) || num <= 0 ? null : num;
}
