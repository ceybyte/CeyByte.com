import { z } from "zod";
import { BUSINESS_CATEGORIES, DISTRICTS, LOCALES, LOCATION_SOURCES, SRI_LANKA_BOUNDS } from "../enums";
import { normalizePhone } from "../phone";

// Step 1: Your shop details (docs/01-PRD.md §F-03, docs/06-SCREEN_BLUEPRINTS_AND_COPY.md §S02)
export const Step1ShopSchema = z.object({
  fullName: z.string().trim().min(2, { message: "errors.required" }).max(80, { message: "errors.too_long" }),
  shopName: z.string().trim().min(2, { message: "errors.required" }).max(100, { message: "errors.too_long" }),
  category: z.enum(BUSINESS_CATEGORIES, {
    message: "errors.required",
  }),
  phone: z
    .string()
    .trim()
    .refine((val) => normalizePhone(val, ["mobile", "landline"]) !== null, {
      message: "errors.INVALID_PHONE",
    })
    .transform((val) => normalizePhone(val, ["mobile", "landline"]) as string),
  whatsapp: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        return normalizePhone(val, ["mobile"]) !== null;
      },
      { message: "errors.INVALID_PHONE" },
    )
    .transform((val) => {
      if (!val || val.trim() === "") return null;
      return normalizePhone(val, ["mobile"]);
    }),
});

export type Step1ShopInput = z.input<typeof Step1ShopSchema>;
export type Step1ShopData = z.infer<typeof Step1ShopSchema>;

// Step 2: Location and consent
export const Step2LocationSchema = z.object({
  district: z.enum(DISTRICTS, {
    message: "errors.required",
  }),
  city: z.string().trim().min(1, { message: "errors.required" }).max(100, { message: "errors.too_long" }),
  lat: z
    .number()
    .min(SRI_LANKA_BOUNDS.minLat, { message: "errors.LOCATION_OUTSIDE_SRI_LANKA" })
    .max(SRI_LANKA_BOUNDS.maxLat, { message: "errors.LOCATION_OUTSIDE_SRI_LANKA" }),
  lng: z
    .number()
    .min(SRI_LANKA_BOUNDS.minLng, { message: "errors.LOCATION_OUTSIDE_SRI_LANKA" })
    .max(SRI_LANKA_BOUNDS.maxLng, { message: "errors.LOCATION_OUTSIDE_SRI_LANKA" }),
  locationSource: z.enum(LOCATION_SOURCES).default("pin"),
  isPublicOnMap: z.boolean().default(false),
  termsAccepted: z.literal(true, {
    message: "errors.required",
  }),
  termsVersion: z.string().default("2026-10-01"),
  preferredLocale: z.enum(LOCALES).default("en"),
  turnstileToken: z.string().optional(),
});

export type Step2LocationInput = z.input<typeof Step2LocationSchema>;
export type Step2LocationData = z.infer<typeof Step2LocationSchema>;

// Composite DownloadGateSchema submitted to POST /api/downloads
export const DownloadGateSchema = Step1ShopSchema.merge(Step2LocationSchema);

export type DownloadGateInput = z.input<typeof DownloadGateSchema>;
export type DownloadGateData = z.infer<typeof DownloadGateSchema>;
