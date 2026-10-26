# Phase 12 — Donations & Supporter Badges Design Document

**Date:** 2026-10-26  
**Status:** Ready for Review  
**Author:** Antigravity  
**Domain:** Financial Sustain, Bank Transfer Verification, Gold Supporter Badges, Public Transparency  
**Target Milestone:** M2 Community (Sprint 11)  

---

## 1. Intent & The Why

CB POS is 100% free, offline-first software with no subscriptions, no paywalls, and no advertisements. It relies entirely on voluntary community contributions to fund essential real-world operational costs:
1. Microsoft Authenticode Code-Signing certificate (eliminating Windows SmartScreen warnings).
2. Hardware test benches (ESC/POS thermal printers, barcode scanners, RS-232 weighing scales).
3. Professional trilingual translation reviews (Sinhala, Tamil).
4. Edge infrastructure and off-peak backups beyond free tiers.

To build sustainable community support without recurring payment gateway overhead, Phase 12 introduces **Bank Slip Donations**:
- Direct bank transfer (CEFT, SLIPS, online banking, mobile apps, or cash branch deposits) into Ceylon Byte's Sri Lankan bank account.
- Zero payment gateway transaction fees in v1.
- Immediate donor feedback with a unique reference code (`CB-DN-XXXXXX`) and copyable account details.
- Secure R2-based slip upload with strict file type, size, and magic-bytes verification.
- Admin verification queue to reconcile bank statements with uploaded slips.
- Gold Supporter Badges and map pins rewarded to contributing shop listings within 60 seconds of approval.
- Full public transparency with a real-time aggregate monthly total and a public Supporters Wall.

---

## 2. Goals, Non-Goals & Anti-Goals

### 2.1 Goals
- **F-11 / S09 Donor Flow:** A clean, responsive, trilingual two-step donation experience at `/{locale}/donate` with a gold accent aesthetic (`#FFD700`).
- **Cryptographic Security & Verification:**
  - Presigned upload to private bucket `cbpos-uploads` with post-upload verification (size ≤ 5 MB, MIME check, and magic-byte signature check for JPG, PNG, PDF).
  - Secure state resumption via `httpOnly`, `SameSite=Lax`, 14-day `cb_dn_{ref}` cookie matching SHA-256 `submit_secret_hash`.
- **Shop Linking & Gold Pin Reward (`AC-08.2`):**
  - Seamless automatic linking if the donor is signed into their merchant account.
  - Private phone-number matching if donating unauthenticated, preserving merchant privacy without disclosing whether a number matched in client responses.
  - On approval, `merchants.is_supporter` is set to `true`, `supporter_since` is established, and `bumpGeoVersion` purges the public map cache.
- **Supporters Wall & Live Transparency:**
  - Aggregate monthly total: `"Rs. {total} from {count} supporters, updated daily."`
  - Public supporters wall rendering contributor display names (or "Anonymous supporter"), contribution month, optional approved messages (≤ 140 chars), and gold badges.
- **Admin Review Queue (`/admin`):**
  - Streamlined queue for pending slips with 120-second presigned GET preview URLs in sandboxed viewers.
  - One-click approval and rejection with canned reasons.
- **Automated Lifecycle Maintenance:**
  - Cron cleanup cancelling abandoned donations older than 14 days and purging rejected slips older than 90 days.

### 2.2 Non-Goals
- **Payment Gateways in v1:** No payment gateways (Stripe, PayHere, LankaQR dynamic QR) in this phase. The architecture leaves `donations.method` as an extensible enum for future ADRs.
- **Automatic Bank Statement Scraping:** Reconciliations are performed by human administrators via the admin dashboard.
- **Tax Deductions:** Donations are voluntary gifts, not tax-exempt charities under Sri Lankan tax law.

### 2.3 Anti-Goals
- **No Green Buttons on the Donation Page:** Violating the Single Green Button rule by styling donation buttons in `#39FF14` is strictly forbidden. The donation page uses **Gold** (`#FFD700`, `variant="gold"`) and secondary surface buttons.
- **No Paywalls or Feature Gating:** Donating provides no software feature unlocks or tier advantages in CB POS desktop.
- **No Silent Asset Accumulation:** Invalid uploads or rejected files must not linger indefinitely in R2 storage.

---

## 3. User Journey & Architectural Decisions

### 3.1 Decision 1: Two-Step Progressive Flow (`S09`)
- **Step 1 (Formulation):**
  - Amount selection via chips: `Rs. 500`, `Rs. 1,000`, `Rs. 2,500`, `Rs. 5,000`, and `Custom` (minimum `Rs. 100.00`).
  - Display name input with a *"Keep my name private"* toggle (sets `isAnonymous: true`).
  - Public message input (max 140 chars with visual counter).
  - *"Show my amount on the wall"* toggle (defaults to false).
  - *"Link to my shop on the map"* toggle:
    - If authenticated merchant: displays shop badge preview automatically.
    - If guest: reveals a phone number input for matching.
  - Contact information input (email or phone, marked strictly private).
  - Cloudflare Turnstile verification.
  - Action button: Gold **"Show the bank details"** button.
- **Step 2 (Payment & Slip Upload):**
  - Submitting Step 1 calls `POST /api/donations`, generating the reference code (`CB-DN-7K3Q9P`), issuing the `cb_dn_{ref}` cookie, and returning the bank details.
  - Displays large mono reference code with a 1-click copy button and reminder to include it in the transfer remarks.
  - Bank details card: Account Name, Account Number (mono), Bank Name, Branch, each with an individual copy button.
  - Slip upload dropzone accepting JPG, PNG, PDF up to 5 MB with progress indicator.
  - Optional *"Bank transaction reference"* text input.
  - Action button: Gold **"Send for confirmation"** button.
- **Step 3 (Pending Confirmation):**
  - Displays *"Thank you. We'll confirm within 48 hours."*
  - Reassures the user that their listing's gold pin will activate automatically upon verification.
  - Provides a resume bookmark link in case the user navigates away.

### 3.2 Decision 2: Dual Shop Linking & Privacy Preservation
- Donors who are signed in automatically have their claimed merchant row linked (`merchantId = merchant.id`).
- Guest donors can supply their shop's registered phone number.
- Server normalizes the phone via `normalizePhone(phone, ["mobile", "landline"])` and looks up active merchants.
- **Security Rule:** The API response never leaks whether a phone matched a merchant, preventing phone enumeration attacks.

### 3.3 Decision 3: Public Supporters Wall & Transparency
- `GET /api/donations/summary` calculates:
  - `monthlyTotalCents`: Sum of all approved donations created within the current calendar month (in UTC).
  - `supporterCount`: Count of unique approved donors in the current month.
  - `supporters`: Array of approved donors (display name or "Anonymous supporter", month in format `Oct 2026`, gold badge boolean, amount if `showAmountPublicly === true`, and approved message if `messageApproved === true`).
- Cached for 600 seconds via Cloudflare Cache API with tag-based or event-based purge on approval.
- "Where funds go" strip details the four core pillars (Code-Signing, Test Hardware, Translations, Infrastructure).

### 3.4 Decision 4: Admin Verification & Queue (`/admin`)
- Accessible under the `/admin` portal as a dedicated "Donations" tab.
- Queue filters: `Pending Review` (default), `Approved`, `Rejected`.
- Detail viewer:
  - Fetches temporary 120-second presigned GET URL from `GET /api/admin/donations/:id/slip-url`.
  - Sandboxed preview (`<iframe sandbox>` for PDFs, `<img>` for PNG/JPEG).
  - Shows bank transaction reference, amount in LKR, and linked merchant details.
  - Approve action: updates donation to `approved`, approves message if checked, runs `recomputeSupporter()`, triggers `bumpGeoVersion()`, and writes audit log.
  - Reject action: prompts for a reason (e.g. "Slip unreadable", "Amount mismatch", "Duplicate submission"), updates status to `rejected`, and logs event.

### 3.5 Decision 5: Admin Donation Settings & Dynamic Payment Options
- Dedicated **"Settings / Payment Options"** view within `/admin/donations`.
- Administrators can configure one or more bank transfer payment options:
  - **Account Name** (e.g., "Ceylon Byte (Pvt) Ltd")
  - **Account Number** (e.g., "100234567890")
  - **Bank Name** (e.g., "Commercial Bank of Ceylon")
  - **Branch Name** (e.g., "Kollupitiya Branch")
  - **QR Code Image (Optional):** Uploadable bank QR or LankaQR image (PNG/JPG ≤ 2 MB) stored in R2 and served publicly, allowing donors using Sri Lankan banking apps (Q+, Flash, FriMi, iPay) to scan and pay instantly.
  - **Instructions / Notes (Optional):** Custom transfer instructions (e.g., "Include your reference in remarks").
  - **Active Toggle:** Enable or disable specific accounts without deleting them.
- **Persistence & Fallback:** Stored in Cloudflare KV key `settings:donation_payment_options` with audit logging in `admin_audit_log`. If no custom accounts are configured, seamlessly falls back to environment variables (`DONATION_ACCOUNT_NAME`, `DONATION_ACCOUNT_NUMBER`, `DONATION_BANK_NAME`, `DONATION_BANK_BRANCH`).
- **Donor Experience (S09):** In Step 2, donors view active payment option cards with individual 1-click copy buttons. If a QR code is attached, an interactive "Scan QR to Pay" expander displays the high-resolution QR image with a zoom/save option.

---

## 4. API & Data Contract

### 4.1 Schema Alignment (`packages/shared/src/db/schema.ts`)
The `donations` table is already defined in SQLite D1:
- `id`: PK (`dn_...`)
- `referenceCode`: Unique string (`CB-DN-XXXXXX`)
- `method`: Enum (`"bank_transfer"`)
- `amountCents`: Integer (≥ 10,000)
- `currency`: Default `"LKR"`
- `displayName`: Text or null
- `isAnonymous`: Boolean
- `publicMessage`: Text ≤ 140 chars
- `messageApproved`: Boolean
- `showAmountPublicly`: Boolean
- `contactPrivate`: Text
- `submitSecretHash`: SHA-256 hash of cookie secret
- `slipKey`, `slipMime`, `slipSize`, `txnReference`: R2 metadata
- `merchantId`, `userId`: Foreign keys
- `status`: Enum (`"awaiting_payment"`, `"pending_review"`, `"approved"`, `"rejected"`, `"cancelled"`, `"refunded"`)
- `reviewedBy`, `reviewedAt`, `rejectionReason`, `createdAt`, `updatedAt`

### 4.2 Endpoint Specifications
1. `GET /api/donations/summary` -> public, cached 600s. Returns monthly total, supporter count, supporters list, and active payment options (bank accounts + QR image URLs).
2. `POST /api/donations` -> Turnstile verified, rate-limited (`RL_FORMS`), creates `awaiting_payment` record and sets `cb_dn_{ref}` cookie. Returns reference code and active bank details.
3. `POST /api/donations/:ref/submit` -> validated against `cb_dn_{ref}` cookie, runs R2 `verifyUpload`, sets `status = "pending_review"`.
4. `GET /api/donations/:ref/status` -> validated against `cb_dn_{ref}` cookie or user session, returns status and bank details for resumption.
5. `GET /api/admin/donations` -> admin auth, lists queue with pagination.
6. `GET /api/admin/donations/:id/slip-url` -> admin auth, returns 120s presigned GET URL.
7. `POST /api/admin/donations/:id/approve` -> admin auth, sets `approved`, recomputes supporter status, invalidates geo cache.
8. `POST /api/admin/donations/:id/reject` -> admin auth, sets `rejected` with reason.
9. `GET /api/admin/donations/settings` -> admin auth, returns current payment options and fallback configuration.
10. `PUT /api/admin/donations/settings` -> admin auth, validates and updates active payment options in KV, creates audit log entry.

---

## 5. What's Left for the Builder
- Implementing `apps/api/src/routes/donations.ts` and mounting in `apps/api/src/index.ts`.
- Extending `apps/api/src/routes/admin.ts` with donation queue handlers, `recomputeSupporter` helper, and settings routes.
- Building frontend page `apps/web/src/app/[locale]/donate/page.tsx` and components under `apps/web/src/features/donations/`.
- Building Admin Donations Queue and Payment Options Settings tab under `apps/web/src/features/admin/`.
- Adding trilingual localization keys in `messages/{en,si,ta}.json` under `donate.*`.
- Creating end-to-end acceptance tests in `e2e/05-donation.spec.ts`.
- Registering the cron cleanup tasks in `apps/api/src/scheduled.ts`.
