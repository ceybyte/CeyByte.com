import { z } from "zod";
import { normalizePhone } from "../phone";

export const DonationCreateSchema = z.object({
  amountCents: z
    .number()
    .int()
    .min(10000, { message: "errors.DONATION_AMOUNT_TOO_LOW" }), // min Rs. 100.00
  displayName: z
    .string()
    .trim()
    .max(80, { message: "errors.too_long" })
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  isAnonymous: z.boolean().default(false),
  publicMessage: z
    .string()
    .trim()
    .max(140, { message: "errors.too_long" })
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  showAmountPublicly: z.boolean().default(false),
  contactPrivate: z
    .string()
    .trim()
    .max(120, { message: "errors.too_long" })
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  linkMerchantPhone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        return normalizePhone(val, ["mobile", "landline"]) !== null;
      },
      { message: "errors.INVALID_PHONE" },
    )
    .transform((val) => {
      if (!val || val.trim() === "") return null;
      return normalizePhone(val, ["mobile", "landline"]);
    }),
  turnstileToken: z.string().min(1, { message: "errors.required" }),
});

export type DonationCreateInput = z.input<typeof DonationCreateSchema>;
export type DonationCreateData = z.infer<typeof DonationCreateSchema>;

export const DonationSubmitSchema = z.object({
  slipKey: z.string().trim().min(1, { message: "errors.required" }),
  txnReference: z
    .string()
    .trim()
    .max(64, { message: "errors.too_long" })
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export type DonationSubmitInput = z.input<typeof DonationSubmitSchema>;
export type DonationSubmitData = z.infer<typeof DonationSubmitSchema>;

export const DonationPaymentOptionItemSchema = z.object({
  id: z.string().trim().min(1),
  accountName: z.string().trim().min(1, { message: "errors.required" }),
  accountNumber: z.string().trim().min(1, { message: "errors.required" }),
  bankName: z.string().trim().min(1, { message: "errors.required" }),
  branchName: z.string().trim().min(1, { message: "errors.required" }),
  qrImageKey: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  isEnabled: z.boolean().default(true),
  notes: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export type DonationPaymentOptionItem = z.infer<typeof DonationPaymentOptionItemSchema>;

export const DonationPaymentOptionsSchema = z.array(DonationPaymentOptionItemSchema);

export type DonationPaymentOptions = z.infer<typeof DonationPaymentOptionsSchema>;
