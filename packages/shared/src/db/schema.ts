// Source of truth: docs/05-SCHEMA.md §4. Change both together.
import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
  primaryKey,
  check,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";
import {
  ROLES,
  LOCALES,
  DISTRICTS,
  BUSINESS_CATEGORIES,
  MERCHANT_STATUSES,
  LOCATION_SOURCES,
  MERCHANT_LOG_EVENTS,
  RELEASE_CHANNELS,
  RELEASE_SOURCES,
  CONTENT_STATUSES,
  BLOG_STATUSES,
  TICKET_TYPES,
  TICKET_STATUSES,
  TICKET_SEVERITIES,
  DONATION_METHODS,
  DONATION_STATUSES,
  AUDIT_LEVELS,
} from "../enums";

/* ---------- column helpers ---------- */
const pk = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());
const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date());
const ts = (name: string) => integer(name, { mode: "timestamp_ms" });
const bool = (name: string) => integer(name, { mode: "boolean" });

/* =====================================================================
 * AUTH (Better Auth core + admin plugin). Field keys must match Better
 * Auth's expected names; column names are snake_case.
 * Configure: drizzleAdapter(db, { provider: "sqlite", usePlural: true, schema })
 * ===================================================================== */

export const users = sqliteTable(
  "users",
  {
    id: pk(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: bool("email_verified").notNull().default(false),
    image: text("image"),
    // admin plugin
    role: text("role", { enum: ROLES }).notNull().default("merchant"),
    banned: bool("banned").notNull().default(false),
    banReason: text("ban_reason"),
    banExpires: ts("ban_expires"),
    // additionalFields
    locale: text("locale", { enum: LOCALES }).notNull().default("en"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: pk(),
    token: text("token").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: ts("expires_at").notNull(),
    ipAddress: text("ip_address"), // Better Auth field. We store the ip_hash value here, never the raw IP
    userAgent: text("user_agent"),
    impersonatedBy: text("impersonated_by"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("sessions_token_uq").on(t.token), index("sessions_user_idx").on(t.userId)],
);

export const accounts = sqliteTable(
  "accounts",
  {
    id: pk(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(), // "credential" | "google"
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: ts("access_token_expires_at"),
    refreshTokenExpiresAt: ts("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"), // unused on branch `free` (passwordless, 02-TRD D5)
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("accounts_provider_uq").on(t.providerId, t.accountId),
    index("accounts_user_idx").on(t.userId),
  ],
);

export const verifications = sqliteTable(
  "verifications",
  {
    id: pk(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: ts("expires_at").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

/* =====================================================================
 * MERCHANTS (download gate + map directory)
 * ===================================================================== */

export const merchants = sqliteTable(
  "merchants",
  {
    id: pk(),
    publicId: text("public_id").notNull(), // "m_" + 6 base58 chars; used in public JSON + URLs
    ownerUserId: text("owner_user_id").references(() => users.id, { onDelete: "set null" }),

    // PRIVATE contact & identity: never in public projections (§7)
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(), // E.164 +94XXXXXXXXX
    whatsapp: text("whatsapp"), // E.164 +947XXXXXXXX
    telegram: text("telegram"), // @handle (dashboard only, optional)

    // Public listing fields
    shopName: text("shop_name").notNull(),
    category: text("category", { enum: BUSINESS_CATEGORIES }).notNull(),
    district: text("district", { enum: DISTRICTS }).notNull(),
    city: text("city").notNull(),
    lat: real("lat").notNull(), // stored at 6 dp; public output rounded to 4 dp
    lng: real("lng").notNull(),
    locationSource: text("location_source", { enum: LOCATION_SOURCES }).notNull(),

    isPublicOnMap: bool("is_public_on_map").notNull().default(false),
    status: text("status", { enum: MERCHANT_STATUSES }).notNull().default("listed"),

    isSupporter: bool("is_supporter").notNull().default(false),
    supporterSince: ts("supporter_since"),

    // Consent & claim
    termsVersion: text("terms_version").notNull(), // e.g. "2026-10-01"
    termsAcceptedAt: ts("terms_accepted_at").notNull(),
    claimTokenHash: text("claim_token_hash"), // sha256(token); token only in cookie
    claimRedeemedAt: ts("claim_redeemed_at"),

    preferredLocale: text("preferred_locale", { enum: LOCALES }).notNull().default("en"),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: ts("deleted_at"),
  },
  (t) => [
    uniqueIndex("merchants_public_id_uq").on(t.publicId),
    uniqueIndex("merchants_phone_active_uq")
      .on(t.phone)
      .where(sql`${t.deletedAt} IS NULL`),
    index("merchants_owner_idx").on(t.ownerUserId),
    index("merchants_map_idx").on(t.status, t.isPublicOnMap, t.deletedAt),
    index("merchants_district_idx").on(t.district),
    check("merchants_lat_lk", sql`${t.lat} BETWEEN 5.8 AND 10.0`),
    check("merchants_lng_lk", sql`${t.lng} BETWEEN 79.5 AND 82.0`),
  ],
);

export const merchantLogs = sqliteTable(
  "merchant_logs",
  {
    id: pk(),
    merchantId: text("merchant_id").references(() => merchants.id, { onDelete: "cascade" }),
    releaseId: text("release_id").references(() => releases.id, { onDelete: "set null" }),
    event: text("event", { enum: MERCHANT_LOG_EVENTS }).notNull(),
    meta: text("meta", { mode: "json" }).$type<Record<string, string | number | boolean | null>>(),
    ipHash: text("ip_hash"), // sha256(ip + daily salt), never the raw IP
    country: text("country"), // request.cf.country (ISO-2)
    uaFamily: text("ua_family"), // "chrome-android", "edge-windows"; never the full UA
    createdAt: createdAt(),
  },
  (t) => [
    index("merchant_logs_merchant_idx").on(t.merchantId, t.createdAt),
    index("merchant_logs_event_idx").on(t.event, t.createdAt),
  ],
);

/* =====================================================================
 * RELEASES (synced from ceybyte/cbpos-releases latest.json + GitHub
 * Releases API). latest.json has exactly six keys [A6]: version,
 * release_date (YYYY-MM-DD), download_url, changelog (empty today),
 * min_version (unused by the app), sha256. Size and publish time come
 * from the GitHub API until UR-08 adds them to the manifest.
 * ===================================================================== */

export const releases = sqliteTable(
  "releases",
  {
    id: pk(),
    version: text("version").notNull(), // "1.3.0" (tag v*.*.*)
    channel: text("channel", { enum: RELEASE_CHANNELS }).notNull().default("stable"),
    title: text("title").notNull(),
    notesMd: text("notes_md").notNull().default(""),
    notesHast: text("notes_hast", { mode: "json" }).$type<unknown>(),
    minOs: text("min_os").notNull().default("Windows 10 or later"), // installer MinVersion=10.0 [A2]
    releaseDate: text("release_date").notNull(), // manifest release_date, YYYY-MM-DD
    publishedAt: ts("published_at").notNull(), // GitHub release published_at
    minVersion: text("min_version"), // manifest min_version (informational)
    changelogRaw: text("changelog_raw"), // manifest changelog (empty until UR-09)

    exeName: text("exe_name").notNull(), // "CBPOSSetup-1.3.0.exe" [A3]
    exeUrl: text("exe_url").notNull(),
    exeSize: integer("exe_size").notNull(), // GitHub asset size (bytes)
    exeSha256: text("exe_sha256").notNull(),
    // No portable .zip build exists [A3]. Add columns via migration if one ships.

    isLatest: bool("is_latest").notNull().default(false),
    isYanked: bool("is_yanked").notNull().default(false),
    source: text("source", { enum: RELEASE_SOURCES }).notNull().default("github_sync"),
    githubReleaseId: integer("github_release_id"),
    syncedAt: ts("synced_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("releases_version_channel_uq").on(t.version, t.channel),
    uniqueIndex("releases_latest_per_channel_uq")
      .on(t.channel)
      .where(sql`${t.isLatest} = 1`),
    index("releases_published_idx").on(t.publishedAt),
    check("releases_exe_sha", sql`length(${t.exeSha256}) = 64`),
  ],
);

/* =====================================================================
 * DOCS (Fumadocs UI, content in D1)
 * Categories are locale-independent (titles per locale in columns, as the
 * set is small and fixed at 3 locales). Articles are one row per locale,
 * grouped by translation_key. Slugs are shared across locales so that
 * /en/docs/x/y ↔ /si/docs/x/y.
 * ===================================================================== */

export const docsCategories = sqliteTable(
  "docs_categories",
  {
    id: pk(),
    slug: text("slug").notNull(), // "getting-started"
    parentId: text("parent_id").references((): AnySQLiteColumn => docsCategories.id, {
      onDelete: "set null",
    }),
    titleEn: text("title_en").notNull(),
    titleSi: text("title_si").notNull(),
    titleTa: text("title_ta").notNull(),
    descriptionEn: text("description_en").notNull().default(""),
    descriptionSi: text("description_si").notNull().default(""),
    descriptionTa: text("description_ta").notNull().default(""),
    icon: text("icon").notNull().default("BookOpen"), // Lucide icon name (whitelisted in UI)
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("docs_categories_slug_uq").on(t.slug),
    index("docs_categories_sort_idx").on(t.parentId, t.sortOrder),
  ],
);

export type TocItem = { depth: 2 | 3; id: string; text: string; level?: 2 | 3 };

export const docsArticles = sqliteTable(
  "docs_articles",
  {
    id: pk(),
    translationKey: text("translation_key").notNull(), // stable group id shared by en/si/ta rows
    locale: text("locale", { enum: LOCALES }).notNull(),
    categoryId: text("category_id")
      .notNull()
      .references(() => docsCategories.id, { onDelete: "restrict" }),
    slug: text("slug").notNull(), // "install"; shared across locales in the group
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    bodyMd: text("body_md").notNull(),
    bodyHast: text("body_hast", { mode: "json" }).$type<unknown>(), // NULL on branch `free` (rendered at build)
    tocJson: text("toc_json", { mode: "json" }).$type<TocItem[]>(),
    searchText: text("search_text"), // plain text for the Orama index
    status: text("status", { enum: CONTENT_STATUSES }).notNull().default("draft"),
    sortOrder: integer("sort_order").notNull().default(0),
    appVersionMin: text("app_version_min"), // "1.4.0"
    authorId: text("author_id").references(() => users.id, { onDelete: "set null" }),
    publishedAt: ts("published_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("docs_articles_path_uq").on(t.locale, t.categoryId, t.slug),
    uniqueIndex("docs_articles_translation_uq").on(t.translationKey, t.locale),
    index("docs_articles_listing_idx").on(t.locale, t.status, t.categoryId, t.sortOrder),
  ],
);

/* =====================================================================
 * FEEDBACK TRACKER
 * ===================================================================== */

export const feedbackTickets = sqliteTable(
  "feedback_tickets",
  {
    id: pk(),
    publicNumber: integer("public_number").notNull(), // displayed as CB-0142
    draftId: text("draft_id"), // client draft uuid used for pre-uploads
    type: text("type", { enum: TICKET_TYPES }).notNull(),
    title: text("title").notNull(),
    bodyMd: text("body_md").notNull(),
    appVersion: text("app_version"), // "1.4.2" | "unknown"
    windowsVersion: text("windows_version"),
    severity: text("severity", { enum: TICKET_SEVERITIES }),
    status: text("status", { enum: TICKET_STATUSES }).notNull().default("open"),
    isPublic: bool("is_public").notNull().default(true), // false for question, listing_report, spam
    voteCount: integer("vote_count").notNull().default(0),

    // PRIVATE
    crashLogKey: text("crash_log_key"),
    screenshotKey: text("screenshot_key"),
    contactPrivate: text("contact_private"),

    // PUBLIC after admin approval
    screenshotPublicKey: text("screenshot_public_key"),

    reporterUserId: text("reporter_user_id").references(() => users.id, { onDelete: "set null" }),
    reportedMerchantId: text("reported_merchant_id").references(() => merchants.id, { onDelete: "set null" }),
    duplicateOfId: text("duplicate_of_id").references((): AnySQLiteColumn => feedbackTickets.id, {
      onDelete: "set null",
    }),
    resolvedInReleaseId: text("resolved_in_release_id").references(() => releases.id, {
      onDelete: "set null",
    }),

    adminResponseMd: text("admin_response_md"),
    adminRespondedAt: ts("admin_responded_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("feedback_public_number_uq").on(t.publicNumber),
    uniqueIndex("feedback_draft_uq").on(t.draftId),
    index("feedback_board_idx").on(t.isPublic, t.type, t.status, t.voteCount),
    index("feedback_reporter_idx").on(t.reporterUserId),
    check("feedback_title_len", sql`length(${t.title}) BETWEEN 8 AND 120`),
  ],
);

export const feedbackVotes = sqliteTable(
  "feedback_votes",
  {
    ticketId: text("ticket_id")
      .notNull()
      .references(() => feedbackTickets.id, { onDelete: "cascade" }),
    voterKey: text("voter_key").notNull(), // "u:{userId}" or "a:{sha256(ipHash+uaFamily+pepper)}"
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.ticketId, t.voterKey] })],
);

/* =====================================================================
 * DONATIONS
 * ===================================================================== */

export const donations = sqliteTable(
  "donations",
  {
    id: pk(),
    referenceCode: text("reference_code").notNull(), // "CB-DN-7K3Q9P"
    method: text("method", { enum: DONATION_METHODS }).notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("LKR"),

    displayName: text("display_name"), // null when anonymous
    isAnonymous: bool("is_anonymous").notNull().default(false),
    publicMessage: text("public_message"), // ≤ 140 chars, shown only if messageApproved
    messageApproved: bool("message_approved").notNull().default(false),
    showAmountPublicly: bool("show_amount_publicly").notNull().default(false),

    // PRIVATE
    contactPrivate: text("contact_private"),
    submitSecretHash: text("submit_secret_hash").notNull(), // sha256 of secret in cb_dn_{ref} cookie
    slipKey: text("slip_key"),
    slipMime: text("slip_mime"),
    slipSize: integer("slip_size"),
    txnReference: text("txn_reference"), // optional bank transaction reference typed by donor

    merchantId: text("merchant_id").references(() => merchants.id, { onDelete: "set null" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),

    status: text("status", { enum: DONATION_STATUSES }).notNull().default("awaiting_payment"),
    reviewedBy: text("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: ts("reviewed_at"),
    rejectionReason: text("rejection_reason"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("donations_reference_uq").on(t.referenceCode),
    index("donations_queue_idx").on(t.status, t.createdAt),
    index("donations_merchant_idx").on(t.merchantId, t.status),
    check("donations_amount_min", sql`${t.amountCents} >= 10000`), // Rs. 100.00
  ],
);

/* =====================================================================
 * BLOG
 * ===================================================================== */

export const blogPosts = sqliteTable(
  "blog_posts",
  {
    id: pk(),
    translationKey: text("translation_key").notNull(),
    locale: text("locale", { enum: LOCALES }).notNull(),
    slug: text("slug").notNull(), // shared across locales in the group
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    bodyMd: text("body_md").notNull(),
    bodyHast: text("body_hast", { mode: "json" }).$type<unknown>(),
    tocJson: text("toc_json", { mode: "json" }).$type<TocItem[]>(),
    coverImageKey: text("cover_image_key"), // R2 blog/{postId}/...
    coverAlt: text("cover_alt"),
    ogImageKey: text("og_image_key"),
    tags: text("tags", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    status: text("status", { enum: BLOG_STATUSES }).notNull().default("draft"),
    readingMinutes: integer("reading_minutes").notNull().default(1),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    authorId: text("author_id").references(() => users.id, { onDelete: "set null" }),
    publishedAt: ts("published_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("blog_posts_path_uq").on(t.locale, t.slug),
    uniqueIndex("blog_posts_translation_uq").on(t.translationKey, t.locale),
    index("blog_posts_listing_idx").on(t.locale, t.status, t.publishedAt),
  ],
);

/* =====================================================================
 * ADMIN AUDIT LOG (supporting table, required by F-08)
 * ===================================================================== */

export const adminAuditLog = sqliteTable(
  "admin_audit_log",
  {
    id: pk(),
    actorUserId: text("actor_user_id").references(() => users.id, { onDelete: "set null" }), // null = system/cron
    level: text("level", { enum: AUDIT_LEVELS }).notNull().default("info"),
    action: text("action").notNull(), // "donation.approve", "merchant.status", "release_sync_invalid"
    entityType: text("entity_type").notNull(), // "donation" | "merchant" | "ticket" | "doc" | "post" | "release" | "user"
    entityId: text("entity_id"),
    diff: text("diff", { mode: "json" }).$type<{ before?: unknown; after?: unknown; note?: string }>(),
    createdAt: createdAt(),
  },
  (t) => [index("audit_entity_idx").on(t.entityType, t.entityId), index("audit_created_idx").on(t.createdAt)],
);
