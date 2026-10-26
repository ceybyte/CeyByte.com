# Phase 12 — Donations & Supporter Badges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Donations system (F-11, Screen S09), allowing community supporters and shop owners to contribute via bank transfer with automated reference generation, secure slip uploads verified by magic bytes, an admin queue for review with sandboxed previews, dynamic admin donation settings (bank account details and optional QR code image), public supporters wall with live monthly transparency metrics, and automated Gold Supporter map pin rewards (`AC-08.2`).

**Architecture:**
1. **Public API (`apps/api/src/routes/donations.ts`):**
   - `GET /api/donations/summary`: Public cached endpoint (600s TTL) returning aggregate monthly total in LKR, unique supporter count, public supporters array (display names or anonymous, month, gold badge flag, amount if opted-in, approved message), and active payment options (bank accounts + optional QR image URLs).
   - `POST /api/donations`: Rate-limited (`RL_FORMS`), Turnstile verified. Validates donor intent (amount ≥ Rs. 100), creates an `awaiting_payment` record in D1, issues an `httpOnly`, `SameSite=Lax`, 14-day `cb_dn_{ref}` cookie with a cryptographic secret, and returns the reference code (`CB-DN-XXXXXX`) and active bank details.
   - `POST /api/donations/:ref/submit`: Validates `cb_dn_{ref}` cookie matching `submit_secret_hash`. Performs server-side R2 `verifyUpload` on the uploaded slip (checking ≤ 5 MB and magic bytes for JPEG, PNG, PDF), updates donation to `pending_review`.
   - `GET /api/donations/:ref/status`: Validated against `cb_dn_{ref}` cookie or owner session, returns status and bank details for resumption.
2. **Admin Queue & Settings (`apps/api/src/routes/admin.ts`):**
   - `GET /api/admin/donations`: Lists donations with status filtering (`pending_review`, `approved`, `rejected`), oldest first.
   - `GET /api/admin/donations/:id/slip-url`: Issues a 120-second presigned GET URL for private slip preview in `cbpos-uploads`.
   - `POST /api/admin/donations/:id/approve`: Reconciles donation, approves public message if selected, runs `recomputeSupporter(db, merchantId)`, calls `bumpGeoVersion(c.env.CACHE_KV, db)`, and purges the geo-cache so gold pins appear on the map in < 60s.
   - `POST /api/admin/donations/:id/reject`: Records rejection with reason.
   - `GET /api/admin/donations/settings`: Returns configured bank transfer payment options.
   - `PUT /api/admin/donations/settings`: Validates and saves payment options (Bank Name, Branch Name, Account Name, Account No, optional QR image key, active toggles) to Cloudflare KV `settings:donation_payment_options` with audit logging in `admin_audit_log`.
3. **Automated Maintenance Cron (`apps/api/src/scheduled.ts`):**
   - Daily cron cleans up abandoned donations in `awaiting_payment` status older than 14 days by marking them `cancelled`.
   - Purges R2 slip objects for rejected donations older than 90 days.
4. **Frontend S09 Donate Screen (`apps/web/src/app/[locale]/donate/`):**
   - Two-step interactive donation card using **Gold** (`#FFD700`, `variant="gold"`) accent buttons:
     - Step 1: Amount chips (`Rs. 500`, `Rs. 1,000`, `Rs. 2,500`, `Rs. 5,000`, `Other` ≥ Rs. 100), name input with private toggle, 140-char message input, shop linking toggle (auto-linked if logged in, or phone input if guest), Turnstile widget.
     - Step 2: Unique reference code with 1-click copy, dynamic bank details cards with copy buttons, interactive LankaQR / bank QR scan expander (if configured by admin), drag & drop slip upload (JPG/PNG/PDF ≤ 5 MB), optional bank transaction reference input, and confirmation button.
     - Step 3: Pending state with 48-hour expectation notice and resume link support (`?ref=CB-DN-...`).
   - Below Hero: Live transparency strip ("Rs. {total} from {count} supporters"), "Where your donation goes" breakdown, Supporters Wall card grid with Gold Supporter badges, and statutory legal disclaimers.
5. **Admin Donations Portal (`apps/web/src/features/admin/`):**
   - Dedicated "Donations" tab in `/admin` with sub-navigation for "Pending Queue", "All Donations", and "Payment Settings".
   - Sandboxed slip viewer (`<iframe sandbox>` for PDFs, `<img>` for images) with statement matching checklist.
   - Payment options manager to configure bank accounts and upload QR code image assets.

**Tech Stack:** Hono Worker, Cloudflare D1 (SQLite), Cloudflare KV, Cloudflare R2 (presigned uploads & magic-byte verification), Next.js 15 (App Router), Tailwind CSS v4, Lucide React, Vitest, Bun test, Playwright.

**Spec:**
- [docs/superpowers/specs/2026-10-26-donations-design.md](file:///Users/akash/Documents/CeyByte.com/docs/superpowers/specs/2026-10-26-donations-design.md)
- [docs/01-PRD.md](file:///Users/akash/Documents/CeyByte.com/docs/01-PRD.md) §F-11, §AC-11.1–AC-11.3, §AC-08.2
- [docs/02-TRD.md](file:///Users/akash/Documents/CeyByte.com/docs/02-TRD.md) §9, §12.2, §13.2
- [docs/04-APP_FLOW.md](file:///Users/akash/Documents/CeyByte.com/docs/04-APP_FLOW.md) §Flow 5 (lines 287–345)
- [docs/05-SCHEMA.md](file:///Users/akash/Documents/CeyByte.com/docs/05-SCHEMA.md) §5.6 (`donations` table)
- [docs/06-SCREEN_BLUEPRINTS_AND_COPY.md](file:///Users/akash/Documents/CeyByte.com/docs/06-SCREEN_BLUEPRINTS_AND_COPY.md) §S09
- [docs/07-IMPLEMENTATION_PLAN.md](file:///Users/akash/Documents/CeyByte.com/docs/07-IMPLEMENTATION_PLAN.md) §Phase 12 (Sprint 11)

---

## Global Constraints

- **Single Green Button Rule:** At most one `#39FF14` button per viewport. All donation page action buttons use **Gold** (`#FFD700`, `variant="gold"`) or secondary surface styles. Green is strictly reserved for the CB POS download CTA.
- **Magic Byte Verification (`AC-11.3`):** Server-side verification reads the first 8 bytes of every uploaded slip. Files whose bytes do not match JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), or PDF (`25 50 44 46`) are deleted from R2 and rejected with `FILE_TYPE_NOT_ALLOWED`.
- **Upload Size Enforcement (`AC-11.1`):** Files > 5 MB are rejected client-side before upload, and server-side on `head` check (with immediate R2 deletion) with `FILE_TOO_LARGE`.
- **Pre-Approval Isolation (`AC-11.2`):** A donation remains `pending_review` until an admin acts. Nothing public (supporters wall, gold pin, monthly aggregate total) changes before admin approval.
- **Rapid Supporter Activation (`AC-08.2`):** Approving a donation linked to a merchant sets `merchants.is_supporter = true`, records `supporter_since`, and calls `bumpGeoVersion()`, causing the gold pin to appear on the public map within 60 seconds.
- **Trilingual Parity (`AC-01.4`):** All `donate.*` and `admin.donations.*` copy strings exist identically across `messages/en.json`, `messages/si.json`, and `messages/ta.json`.

---

## Review Focus

1. **Upload Spoofing Resistance (`AC-11.3`):** An executable file renamed with a `.pdf` or `.png` extension must be detected on server verification, deleted from R2, and rejected with `FILE_TYPE_NOT_ALLOWED`.
2. **Oversized Slip Handling (`AC-11.1`):** An uploaded slip exceeding 5 MB must be caught during server confirmation, deleted from R2, and rejected with `FILE_TOO_LARGE`.
3. **Unapproved Isolation (`AC-11.2`):** Donations in `awaiting_payment` or `pending_review` must not increment monthly totals or appear on the public supporters wall.
4. **Phone Privacy Preservation:** Submitting a phone number to link a shop must never reveal in the HTTP response whether the phone matched an existing merchant.
5. **Dynamic Settings Fallback:** If no custom bank accounts are configured in KV, the API must seamlessly serve the environment variables (`DONATION_*`).

---

## Task Decomposition

### Task 1: Schemas, Types, and Admin Payment Settings (`packages/shared` & `apps/api`)
**Files:**
- Create: `packages/shared/src/schemas/donations.ts`
- Modify: `packages/shared/src/schemas/index.ts`
- Modify: `packages/shared/src/index.ts`
- Modify: `apps/api/src/routes/admin.ts`
- Test: `apps/api/test/donation-settings.test.ts`

**Interfaces:**
- Consumes: `zod`, `CACHE_KV` from `c.env`, `adminAuditLog`.
- Produces:
  - `DonationCreateSchema`: `{ amountCents: number, displayName?: string, isAnonymous?: boolean, publicMessage?: string, showAmountPublicly?: boolean, contactPrivate?: string, linkMerchantPhone?: string, turnstileToken: string }`
  - `DonationSubmitSchema`: `{ slipKey: string, txnReference?: string }`
  - `DonationPaymentOptionsSchema`: array of `{ id: string, accountName: string, accountNumber: string, bankName: string, branchName: string, qrImageKey?: string | null, isEnabled: boolean, notes?: string | null }`
  - `GET /api/admin/donations/settings`
  - `PUT /api/admin/donations/settings`

- [x] **Step 1: Write failing test in `apps/api/test/donation-settings.test.ts` for donation settings CRUD and KV fallback**
- [x] **Step 2: Run test to verify failure**
- [x] **Step 3: Define donation schemas in `packages/shared/src/schemas/donations.ts` and export**
- [x] **Step 4: Implement `/admin/donations/settings` GET and PUT routes in `apps/api/src/routes/admin.ts`**
- [x] **Step 5: Run test to verify it passes**
- [x] **Step 6: Commit `feat(api): add donation schemas and admin donation payment settings endpoints`**

---

### Task 2: Public Donation Lifecycle Endpoints (`apps/api`)
**Files:**
- Create: `apps/api/src/routes/donations.ts`
- Modify: `apps/api/src/index.ts`
- Test: `apps/api/test/donations.test.ts`

**Interfaces:**
- Consumes: `DonationCreateSchema`, `DonationSubmitSchema`, `donations`, `merchants`, `users`, `verifyUpload` from `apps/api/src/lib/r2.ts`, `rateLimit("RL_FORMS")`, `turnstile("donation")`.
- Produces:
  - `GET /api/donations/summary`
  - `POST /api/donations`
  - `POST /api/donations/:ref/submit`
  - `GET /api/donations/:ref/status`

- [x] **Step 1: Write failing tests in `apps/api/test/donations.test.ts` for donation creation, reference generation, cookie signing, slip submission, and status resumption**
- [x] **Step 2: Run test to verify failure**
- [x] **Step 3: Implement `donationsRoutes` in `apps/api/src/routes/donations.ts`**
- [x] **Step 4: Mount `donationsRoutes` in `apps/api/src/index.ts`**
- [x] **Step 5: Run test to verify all pass**
- [x] **Step 6: Commit `feat(api): implement public donation creation, slip submit, and summary routes`**

---

### Task 3: Admin Donation Queue, Review Actions, and Supporter Activation (`apps/api`)
**Files:**
- Modify: `apps/api/src/routes/admin.ts`
- Test: `apps/api/test/admin-donations.test.ts`

**Interfaces:**
- Consumes: Admin session, `donations`, `merchants`, `adminAuditLog`, `presignGet`, `bumpGeoVersion`.
- Produces:
  - `GET /api/admin/donations`
  - `GET /api/admin/donations/:id/slip-url`
  - `POST /api/admin/donations/:id/approve`
  - `POST /api/admin/donations/:id/reject`
  - Helper `recomputeSupporter(db, merchantId)`

- [x] **Step 1: Write failing tests in `apps/api/test/admin-donations.test.ts` for queue listing, presigned slip viewing, approval activating gold pin, and rejection with reason**
- [x] **Step 2: Run test to verify failure**
- [x] **Step 3: Implement queue listing, slip-url presigning, approval with `recomputeSupporter` and `bumpGeoVersion`, and rejection in `apps/api/src/routes/admin.ts`**
- [x] **Step 4: Run test to verify all pass**
- [x] **Step 5: Commit `feat(api): implement admin donation queue, review actions, and gold supporter activation`**

---

### Task 4: Automated Scheduled Cron Cleanup (`apps/api`)
**Files:**
- Modify: `apps/api/src/scheduled.ts`
- Test: `apps/api/test/donations-cron.test.ts`

**Interfaces:**
- Consumes: `c.env.UPLOADS`, `donations` table.
- Produces: Daily cron task cancelling `awaiting_payment` donations > 14 days old and deleting rejected slips > 90 days old.

- [x] **Step 1: Write failing test in `apps/api/test/donations-cron.test.ts` for abandoned donation cancellation and old slip purging**
- [x] **Step 2: Run test to verify failure**
- [x] **Step 3: Implement donation cleanup logic in `apps/api/src/scheduled.ts`**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit `feat(api): add cron cleanup for abandoned donations and expired slips`**

---

### Task 5: Trilingual Localizations (`messages`)
**Files:**
- Modify: `messages/en.json`
- Modify: `messages/si.json`
- Modify: `messages/ta.json`

**Interfaces:**
- Produces: Identical keys for `donate.*` and `admin.donations.*` across English, Sinhala, and Tamil.

- [x] **Step 1: Add English translations for `donate` and `admin.donations` in `messages/en.json`**
- [x] **Step 2: Add Sinhala translations in `messages/si.json`**
- [x] **Step 3: Add Tamil translations in `messages/ta.json`**
- [x] **Step 4: Run `bun scripts/i18n-check.ts --strict` and verify 100% key parity**
- [x] **Step 5: Commit `feat(i18n): add trilingual translations for donations flow and admin settings`**

---

### Task 6: Frontend Public Donation Page & Components (`apps/web`)
**Files:**
- Create: `apps/web/src/features/donations/components/DonationCard.tsx`
- Create: `apps/web/src/features/donations/components/BankDetailsCard.tsx`
- Create: `apps/web/src/features/donations/components/SupportersWall.tsx`
- Create: `apps/web/src/features/donations/components/TransparencyStrip.tsx`
- Create: `apps/web/src/features/donations/components/SlipDropzone.tsx`
- Create: `apps/web/src/features/donations/api.ts`
- Create: `apps/web/src/features/donations/types.ts`
- Create: `apps/web/src/app/[locale]/donate/page.tsx`
- Test: `apps/web/src/features/donations/__tests__/donations.test.tsx`

**Interfaces:**
- Consumes: `donate.*` translations, Turnstile widget, `GET /api/donations/summary`, `POST /api/donations`, `POST /api/donations/:ref/submit`, `POST /api/uploads/presign`.
- Produces: Interactive S09 Donate page with two-step donation card, Gold `#FFD700` styling, copy buttons, QR code expander, supporters wall, and resume capability.

- [x] **Step 1: Write failing unit test in `apps/web/src/features/donations/__tests__/donations.test.tsx`**
- [x] **Step 2: Run test to verify failure**
- [x] **Step 3: Implement client API client in `apps/web/src/features/donations/api.ts`**
- [x] **Step 4: Build donation card, bank details card, dropzone, transparency strip, and supporters wall components**
- [x] **Step 5: Assemble `apps/web/src/app/[locale]/donate/page.tsx` with SSG metadata and client hydration**
- [x] **Step 6: Run test to verify it passes**
- [x] **Step 7: Commit `feat(web): implement S09 donation page, bank details card, and supporters wall`**

---

### Task 7: Admin Donations Queue & Payment Settings UI (`apps/web`)
**Files:**
- Create: `apps/web/src/features/admin/components/donations-queue.tsx`
- Create: `apps/web/src/features/admin/components/donation-settings.tsx`
- Create: `apps/web/src/features/admin/components/slip-preview-modal.tsx`
- Create: `apps/web/src/app/[locale]/admin/donations/page.tsx`
- Modify: `apps/web/src/features/admin/api.ts`
- Test: `apps/web/src/features/admin/__tests__/admin-donations.test.tsx`

**Interfaces:**
- Consumes: Admin session, `GET/POST /api/admin/donations/*`, `GET/PUT /api/admin/donations/settings`.
- Produces: Tabbed admin view for reviewing pending donation slips with sandboxed preview and managing bank accounts + QR upload.

- [x] **Step 1: Write failing unit test in `apps/web/src/features/admin/__tests__/admin-donations.test.tsx`**
- [x] **Step 2: Run test to verify failure**
- [x] **Step 3: Add API methods to `apps/web/src/features/admin/api.ts`**
- [x] **Step 4: Build `donations-queue.tsx`, `slip-preview-modal.tsx`, and `donation-settings.tsx`**
- [x] **Step 5: Create `apps/web/src/app/[locale]/admin/donations/page.tsx`**
- [x] **Step 6: Run test to verify it passes**
- [x] **Step 7: Commit `feat(web): add admin donations queue and payment settings portal`**

---

### Task 8: End-to-End Acceptance Tests & Full Verification Suite (`e2e`)
**Files:**
- Create: `e2e/05-donation.spec.ts`

**Interfaces:**
- Consumes: Playwright, running web preview + API worker, seeded test database.
- Produces: Full E2E test verifying AC-11.1–AC-11.3 and AC-08.2.

- [x] **Step 1: Implement `e2e/05-donation.spec.ts` testing donor submission, file rejection, magic bytes, admin approval, and gold map pin activation**
- [x] **Step 2: Run Playwright test: `PW_CHANNEL=chrome bunx playwright test e2e/05-donation.spec.ts`**
- [x] **Step 3: Run full verification: `bun run typecheck`, `bun run lint`, `bun run test`, `bun scripts/i18n-check.ts --strict`**
- [x] **Step 4: Commit `test(e2e): add end-to-end acceptance tests for donations and gold supporter activation`**
- [x] **Step 5: Update `docs/07-IMPLEMENTATION_PLAN.md` ticking Phase 12 items**
