// Source of truth: docs/05-SCHEMA.md §2. Change both together.
export const LOCALES = ["en", "si", "ta"] as const;
export type Locale = (typeof LOCALES)[number];

export const ROLES = ["merchant", "admin"] as const;

export const PROVINCES = {
  western: ["colombo", "gampaha", "kalutara"],
  central: ["kandy", "matale", "nuwara-eliya"],
  southern: ["galle", "matara", "hambantota"],
  northern: ["jaffna", "kilinochchi", "mannar", "vavuniya", "mullaitivu"],
  eastern: ["batticaloa", "ampara", "trincomalee"],
  "north-western": ["kurunegala", "puttalam"],
  "north-central": ["anuradhapura", "polonnaruwa"],
  uva: ["badulla", "monaragala"],
  sabaragamuwa: ["ratnapura", "kegalle"],
} as const;

export const DISTRICTS = [
  "ampara",
  "anuradhapura",
  "badulla",
  "batticaloa",
  "colombo",
  "galle",
  "gampaha",
  "hambantota",
  "jaffna",
  "kalutara",
  "kandy",
  "kegalle",
  "kilinochchi",
  "kurunegala",
  "mannar",
  "matale",
  "matara",
  "monaragala",
  "mullaitivu",
  "nuwara-eliya",
  "polonnaruwa",
  "puttalam",
  "ratnapura",
  "trincomalee",
  "vavuniya",
] as const; // exactly 25
export type District = (typeof DISTRICTS)[number];

export const BUSINESS_CATEGORIES = [
  "grocery", // Grocery / kade
  "minimart", // Mini-mart / supermarket
  "pharmacy",
  "hardware",
  "bookshop", // Bookshop & stationery
  "textile", // Textile & fashion
  "electronics", // Mobile & electronics
  "bakery", // Bakery & sweets
  "cosmetics",
  "agro", // Agro, fertilizer & seeds
  "wholesale", // Wholesale & distribution
  "restaurant", // Café / takeaway (retail counter)
  "other",
] as const;
export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

export const MERCHANT_STATUSES = ["listed", "hidden", "rejected"] as const;
export type MerchantStatus = (typeof MERCHANT_STATUSES)[number];

export const LOCATION_SOURCES = ["gps", "pin", "city_centroid"] as const;
export type LocationSource = (typeof LOCATION_SOURCES)[number];

export const MERCHANT_LOG_EVENTS = [
  "download_gate_submitted",
  "installer_download_started",
  "listing_claimed",
  "listing_updated",
  "visibility_changed",
  "status_changed",
  "supporter_granted",
  "supporter_revoked",
  "deleted",
] as const;

export const RELEASE_CHANNELS = ["stable", "beta"] as const;
export const RELEASE_SOURCES = ["github_sync", "manual"] as const;

export const CONTENT_STATUSES = ["draft", "published", "archived"] as const;
export const BLOG_STATUSES = ["draft", "scheduled", "published", "archived"] as const;

export const TICKET_TYPES = ["bug", "feature", "question", "listing_report"] as const;
export const TICKET_STATUSES = [
  "open",
  "triaged",
  "planned",
  "in_progress",
  "shipped",
  "closed",
  "duplicate",
  "wont_fix",
] as const;
export const TICKET_SEVERITIES = ["crash", "blocks_billing", "wrong_output", "cosmetic"] as const;

// v1 is bank transfer only. A future gateway adds a value here (+ migration) via ADR.
export const DONATION_METHODS = ["bank_transfer"] as const;
export const DONATION_STATUSES = [
  "awaiting_payment",
  "pending_review",
  "approved",
  "rejected",
  "cancelled",
  "refunded",
] as const;
export type DonationStatus = (typeof DONATION_STATUSES)[number];

export const AUDIT_LEVELS = ["info", "warn"] as const;

/** Geographic bounds used for validation, CHECK constraints and map maxBounds. */
export const SRI_LANKA_BOUNDS = { minLat: 5.8, maxLat: 10.0, minLng: 79.5, maxLng: 82.0 } as const;
