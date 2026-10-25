import { z } from "zod";

// Source of truth: docs/02-TRD.md §7.1 and docs/01-PRD.md §F-06.
export const Manifest = z
  .object({
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    release_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    download_url: z
      .string()
      .url()
      .startsWith("https://github.com/ceybyte/cbpos-releases/releases/download/")
      .regex(/\/CBPOSSetup-\d+\.\d+\.\d+\.exe$/),
    changelog: z.string().default(""),
    min_version: z.string().optional(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    size: z.number().int().positive().optional(), // UR-08
    published_at: z.string().datetime().optional(), // UR-08
    notes_url: z.string().url().optional(), // UR-08
  })
  .passthrough();

export type ManifestType = z.infer<typeof Manifest>;
