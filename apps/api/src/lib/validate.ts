import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod";
import { ApiError } from "./errors";

// zod at the boundary (CLAUDE.md §5.3). Issues become `fields`: path → i18n key. A schema sets the key with
// its message (`z.string().min(2, "errors.tooShort")`); anything else maps to `errors.invalid`.
export const validate = <T extends ZodType, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T,
) =>
  zValidator(target, schema, (result) => {
    if (result.success) return;
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "_";
      fields[path] ??= issue.message.startsWith("errors.") ? issue.message : "errors.invalid";
    }
    throw new ApiError("VALIDATION_FAILED", { fields });
  });
