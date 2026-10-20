# 01 — Product Requirements Document (PRD)

| | |
|---|---|
| Product | Ceybyte.com — web platform for CB-POS |
| Version | 1.0 |
| Date | 2026-10-21 |
| Status | Approved for build |
| Owners | Ceybyte (product + engineering) |
| Related | `02-TRD.md`, `03-DESIGN.md`, `04-APP_FLOW.md`, `05-SCHEMA.md`, `06-SCREEN_BLUEPRINTS_AND_COPY.md`, `07-IMPLEMENTATION_PLAN.md` |

---

## 1. Executive summary

**CB-POS** is a free Windows Point of Sale system built for Sri Lankan retail shops. It is offline-first (local SQLite), keyboard-first, and handles the parts that make generic POS software painful here:

- backward 18% VAT from shelf MRP
- 2.5% SSCL on 50% of revenue
- AVCO inventory costing
- 3-decimal weighed goods
- ESC/POS thermal receipts in English, Sinhala and Tamil
- encrypted `.ZIP` local backups

**Ceybyte.com** is how shop owners find, trust, download and get help with CB-POS. It has five jobs:

1. **Convert:** turn a visiting shop owner into an installed user in under 3 minutes, in their own language.
2. **Distribute:** serve the latest signed installer from GitHub Releases, with published SHA-256 hashes.
3. **Support:** host the trilingual docs and a public bug/feature tracker, so support doesn't depend on phone calls.
4. **Prove:** show real adoption on a live Sri Lanka Merchant Map, without exposing shop owners' phone numbers.
5. **Sustain:** collect local donations (LankaQR, bank deposit, PayHere card) and reward supporters with a gold map pin.

**Constraint:** the platform runs at **Rs. 0 / month** on free tiers (Cloudflare Workers, D1, R2, KV, Turnstile; PostHog; Resend; GitHub) until product-market fit.

### 1.1 Problem

Sri Lankan small retailers are stuck choosing between:

- **Cloud POS** that stops billing when the internet drops (frequent outside Colombo) and charges a monthly subscription forever.
- **Pirated or abandoned desktop POS** with no local tax logic, no Sinhala/Tamil receipts and no support.
- **Manual billing** with calculator VAT maths and hand-written weights, which leads to tax mistakes and lost revenue.

### 1.2 Why a web platform

CB-POS is offline software. The website is the only online touchpoint, so it must carry trust (real UI, real hashes, real shops, honest disclaimers), handle onboarding (setup guide, docs) and build community (tracker, map, donations).

---

## 2. Goals, non-goals, success metrics

### 2.1 Goals
- G1. Make downloading CB-POS the obvious, fast, low-risk action for a Sri Lankan shop owner on a phone or PC.
- G2. Build a consented, privacy-safe merchant directory showing CB-POS adoption across all 25 districts.
- G3. Cut repeat support questions with searchable trilingual docs and a public tracker.
- G4. Fund development locally without ads or paywalls.

### 2.2 Non-goals (v1)
- Selling CB-POS, licences or subscriptions. CB-POS is free, permanently.
- Cloud sync, remote dashboards or telemetry from installed POS terminals. The POS stays offline. The website never receives sales data.
- Selling hardware (printers, scanners, scales). Docs may list tested hardware; no affiliate links in v1.
- Native mobile apps.
- A public merchant review or rating system.
- Tax filing, IRD submission, or any claim of IRD certification.

### 2.3 Success metrics

These are targets, measured in PostHog and D1. They are not claims to display publicly.

| Metric | Definition | Target (90 days post-launch) |
|---|---|---|
| Gate completion rate | `download_gate_submitted` ÷ `download_gate_opened` | ≥ 55% |
| Step 1 → Step 2 | `download_gate_step1_completed` ÷ `download_gate_opened` | ≥ 75% |
| Download start rate | `installer_download_started` ÷ `download_gate_submitted` | ≥ 95% |
| District coverage | Distinct districts with ≥1 public listed merchant | 25 / 25 |
| Public map opt-in | Gate submissions with `is_public_on_map = true` | ≥ 40% |
| Docs self-serve | Doc article views ÷ (doc views + new tickets of type `question`) | ≥ 90% |
| Ticket triage time | Median `open` → `triaged` | ≤ 72 h |
| Donation approval time | Median slip `pending_review` → `approved` | ≤ 48 h |
| LCP (p75, mobile, 4G) | Home in `si` locale | ≤ 2.5 s |
| Infra cost | Monthly Cloudflare + SaaS bill | Rs. 0 |

---

## 3. Personas

Personas are written without gendered pronouns on purpose.

### P1 — Sunil, grocery owner (Kurunegala) — *primary*
- 52, runs a busy *kade* with two cashiers. Sinhala-first; reads English slowly.
- Hardware: a second-hand Windows 10 PC, a 58mm USB thermal printer, a cheap barcode scanner. Mobile data only, so the connection drops several times a day.
- Pain: a cloud POS trial froze during the Avurudu rush when the router dropped. Sunil's accountant keeps finding VAT errors from manual back-calculation.
- Needs: Sinhala everywhere, proof it works offline, proof it's really free, someone to ask on WhatsApp.
- Fear: "I'll install something and lose my data" / "this is a virus" / "they'll charge me later".

### P2 — Kavitha, pharmacy and mini-mart manager (Jaffna)
- 34, Tamil-first, comfortable on a smartphone, runs a pharmacy counter plus a small grocery section that sells weighed goods (rice, dhal).
- Pain: 3-decimal weights and expiry tracking; receipts must be in Tamil for customers.
- Needs: Tamil docs with screenshots, weighing-scale setup guides, a way to report bugs without calling Colombo.

### P3 — Ravindu, POS installer and IT freelancer (Colombo / Gampaha)
- 27, English-fluent power user. Sets up shops in exchange for a setup fee.
- Needs: release notes, SHA-256 hashes, silent-install flags, a hardware compatibility list, keyboard-shortcut reference sheets, and a bug tracker where reports get acknowledged.
- Influence: one installer brings 10–50 shops. Very likely to opt shops into the public map.

### P4 — Dilani, supporter (Kandy, or diaspora in Melbourne)
- Wants to fund a local free tool. Pays by LankaQR (local) or card via PayHere (diaspora).
- Needs: fast payment, visible recognition (gold pin if Dilani has a shop listing; a supporters list otherwise), confirmation the money arrived.

### P5 — Ceybyte maintainer (Admin)
- 1–3 people. Reviews donation slips, triages tickets, publishes docs, blog posts and releases, moderates map listings.
- Needs: one admin console, keyboard-driven queues, an audit trail, nothing that takes more than 30 seconds per item.

---

## 4. Feature catalogue

Priority: **P0** = launch blocker, **P1** = launch target, **P2** = post-launch.

| ID | Feature | Priority | Routes |
|---|---|---|---|
| F-01 | Trilingual Engine | P0 | all |
| F-02 | Product Showcase (8-section homepage) | P0 | `/{locale}` |
| F-03 | Frictionless Download Gate | P0 | `#download` modal, `/api/downloads` |
| F-04 | Sri Lanka Merchant Map | P0 | `/{locale}/map`, `/api/merchants/geo` |
| F-05 | Documentation Center | P0 | `/{locale}/docs/...` |
| F-06 | Releases & Changelog | P0 | `/{locale}/releases`, `/api/releases/latest` |
| F-07 | Feedback Tracker | P1 | `/{locale}/feedback/...` |
| F-08 | Admin CMS | P0 | `/admin/...` |
| F-09 | Auth & Merchant Dashboard | P1 | `/{locale}/login`, `/{locale}/dashboard/...` |
| F-10 | Blog | P2 | `/{locale}/blog/...` |
| F-11 | Donations & Supporter Badges | P1 | `/{locale}/donate` |
| F-12 | IRD / PDPA Legal Disclaimers | P0 | `/{locale}/legal/...` + inline |

Requirement IDs use `FR-<feature>.<n>`. Acceptance criteria use `AC-<feature>.<n>`.

---

### F-01 — Trilingual Engine

**Goal:** every public page is fully usable in English, Sinhala and Tamil, with typography that renders Sinhala and Tamil correctly.

**User stories**
- As Sunil, I land on the site in Sinhala and every string I see is Sinhala, including form errors, receipts in mockups and the setup guide.
- As Kavitha, I switch to Tamil on a doc article and stay on the same article.

**Functional requirements**
- FR-01.1 Locales `en`, `si`, `ta`. URL prefix is always present: `/en/...`, `/si/...`, `/ta/...`. `/` redirects to a detected locale.
- FR-01.2 Locale detection order: (1) `NEXT_LOCALE` cookie, (2) `Accept-Language` best match, (3) `en`. Detection runs only on `/`. Explicit URLs are never redirected.
- FR-01.3 The language switcher appears in the header and footer, shows each language's own name (`English`, `සිංහල`, `தமிழ்`), keeps the current path and query, and sets the cookie.
- FR-01.4 The `<html lang>` attribute matches the locale (`en`, `si`, `ta`). Script-specific typography is applied via `:lang()` (see `03-DESIGN.md §4.3`).
- FR-01.5 Each locale has its own content for docs and blog posts, linked by `translation_key`. If a translation is missing, show the English article with a banner in the user's language ("This article is not yet available in Sinhala") plus `hreflang` metadata. Never mix languages inside one article.
- FR-01.6 Numbers, prices and dates: digits are always Western (0–9). Prices use `Rs. 1,250.00`. Dates use the locale's month names via `Intl.DateTimeFormat(locale)`, with the Gregorian calendar.
- FR-01.7 SEO: `hreflang` alternates for all three locales plus `x-default`, a localized `<title>`/description, and a sitemap per locale.
- FR-01.8 Fixed glossary: `CB-POS`, `VAT`, `SSCL`, `MRP`, `AVCO`, `.EXE`, `.ZIP`, `SQLite`, `ESC/POS` stay in Latin script in every locale.
- FR-01.9 CI blocks deploys while any `[[TRANSLATE]]` marker remains in `si` or `ta` message files.

**Acceptance criteria**
- AC-01.1 Visiting `/` with `Accept-Language: si-LK` redirects (307) to `/si`.
- AC-01.2 Switching language on `/en/docs/getting-started/install` goes to `/ta/docs/getting-started/install` (or shows the English fallback with the banner when no Tamil version exists).
- AC-01.3 No Sinhala vowel sign (e.g. `ු`, `ූ`, `ෘ`) or Tamil vowel sign is clipped in buttons, inputs, accordion headers or headings at any breakpoint, verified by Playwright screenshot review.
- AC-01.4 `pnpm i18n:check` reports zero missing keys across the three locales.

---

### F-02 — Product Showcase (8-section homepage)

**Goal:** a shop owner understands what CB-POS does, believes it, and clicks Download within one scroll session.

**Sections** (copy in `06 §3`)
1. **Hero:** end result plus "without the fear", the `#39FF14` Download CTA, and a 3D CB-POS mockup (Rive).
2. **Social proof & telemetry strip:** `0 ms` network lag · `Rs. 0 / mo` · `{n}/25` districts · `18% + 2.5%` VAT/SSCL calculated, plus a live map teaser.
3. **Problem:** cloud POS internet drops, the monthly subscription trap, manual tax and weighing errors.
4. **Solution bento grid:** 6 interactive cards — Keyboard Cashiering, Offline SQLite, Dual-Tax Engine, Hardware Hub, Trilingual Receipts, 3-Decimal Weighing & Backups.
5. **How it works:** Download `.EXE` → 2-minute setup wizard → plug in and bill.
6. **FAQs:** 5-item accordion handling objections.
7. **Final conversion banner.**
8. **Global architectural footer.**

**Functional requirements**
- FR-02.1 Every Download CTA (hero, final banner, sticky header, bento "try it") opens the same Download Gate (F-03) with a `source` property for analytics.
- FR-02.2 The telemetry strip gets `districtsCovered` and `listedShops` from D1 (ISR, revalidated on merchant writes, with a fallback revalidation every 10 minutes). If `districtsCovered < 25`, it shows the real number (`17/25`). It never hardcodes `25/25`.
- FR-02.3 The latest version and installer size come from F-06 (`releases.is_latest`). The CTA subtext reads `Windows 10/11 · 64-bit · v{version} · {size} MB`.
- FR-02.4 Bento cards are interactive on hover and focus, and reachable by keyboard:
  - **Keyboard:** pressing the shown keys (`F2`, `Enter`, `Esc`) highlights the matching `<kbd>`.
  - **Offline:** a Wi-Fi toggle keeps the bill running.
  - **Dual-Tax:** typing an MRP shows base/VAT live.
  - **Hardware:** a device list.
  - **Receipts:** an EN/SI/TA tab switch.
  - **Weighing:** a scale readout ticking to `1.250 kg`.
- FR-02.5 The Dual-Tax card computes the display example as `base = mrp / 1.18`, `vat = mrp − base`, rounded half-up to 2 dp in display. It carries "Example only — see tax disclaimer".
- FR-02.6 Every mockup is a real CB-POS screen capture (or a Rive rebuild from real captures). Fake data must look Sri Lankan (products like "Samba Rice 5kg", Rs. prices).
- FR-02.7 The live map teaser is a static, pre-rendered SVG or PNG of the cluster map with the live count. Clicking it goes to F-04. It does not load MapLibre on the homepage.

**Acceptance criteria**
- AC-02.1 Lighthouse mobile on `/si`: Performance ≥ 90, Accessibility 100, LCP ≤ 2.5 s, CLS ≤ 0.05, and initial JS ≤ 180 KB gz (Rive, GSAP and Lenis lazy-loaded).
- AC-02.2 With `prefers-reduced-motion: reduce`, the page renders every section with no parallax, no smooth scroll and no autoplaying Rive.
- AC-02.3 Every telemetry number on the page matches a D1 query, verified by an E2E test against seeded data.

---

### F-03 — Frictionless Download Gate (`#DownloadModal`)

**Goal:** capture enough consented merchant data to build the map and a support relationship, without making the download feel paywalled. Target: under 60 seconds.

**Container:** a centred dialog on desktop (≥ 768px). On mobile, a Vaul bottom sheet that snaps to 92% height. Open state is reflected in the URL as `?download=1` so it can be shared and Back closes it.

**Step 1 — Your shop**
| Field | Type | Rules |
|---|---|---|
| Full name | text | required, 2–80 chars |
| Shop name | text | required, 2–100 chars |
| Business category | select | required, enum (see `05-SCHEMA.md` `BUSINESS_CATEGORIES`) |
| Phone | tel | required, Sri Lankan number, normalised to E.164 (`+94…`), mobile or landline |
| WhatsApp | tel with fixed `+94` prefix | optional, mobile only (`+947[0-8]XXXXXXX`), "Same as phone" checkbox |

**Step 2 — Your location**
| Field | Type | Rules |
|---|---|---|
| District | select (25) | required |
| City | select filtered by district, with free-text fallback | required |
| Detect My Location | button | Uses the browser Geolocation API. Fills lat/lng and snaps district/city to the nearest entry in `lk-cities.json`. Rejects coordinates outside Sri Lanka's bounds |
| Map pin | draggable mini-map | Starts at the city centroid (or GPS). Dragging updates lat/lng. Constrained to Sri Lanka bounds |
| Show my shop on the public CB-POS map | checkbox | default **unchecked** (PDPA: opt-in) |
| Terms acceptance | checkbox | **required**: "I understand CB-POS is free software provided as-is, that I am responsible for my own tax calculations and IRD filings, and that I am responsible for backing up my local data." Links to the legal pages |
| Turnstile | widget | invisible/managed |

**On submit**
1. The server validates the input, creates a `merchants` row (`status = listed`, or `hidden` if the visibility box is unchecked), writes a `merchant_logs` event `download_gate_submitted`, and returns `{ downloadUrl, claimToken, release }`.
2. The client immediately navigates a hidden `<a download>` / `window.location` to `/api/download/latest?ref={merchantPublicId}`. That logs `installer_download_started` and returns **302** to the GitHub Releases asset, so the browser streams the `.EXE` straight from GitHub.
3. The modal morphs (shared-layout animation) into **"What Next?"**:
   - the download filename and SHA-256 hash, with a copy button
   - a Windows SmartScreen explainer ("More info → Run anyway") while the installer is unsigned
   - 3 setup steps
   - a WhatsApp community link
   - a "Save your listing" CTA (claim link → F-09)
   - a "Download didn't start?" manual link

**Functional requirements**
- FR-03.1 Step 1 data is kept in client state and `sessionStorage` (wrapped in try/catch), so going back or accidentally closing doesn't lose input for the session.
- FR-03.2 Returning visitors: if a `cb_gate` cookie (httpOnly, 180 days) proves a completed submission, Download CTAs skip the form and go straight to the "What Next?" state plus the download.
- FR-03.3 Duplicate handling: if the normalised phone already exists, the server attaches a new `merchant_logs` event to the existing merchant and does **not** create a duplicate. The response is identical either way, so it doesn't reveal whether a number exists.
- FR-03.4 Rate limit: 5 submissions per IP-hash per 10 minutes, plus Turnstile (see TRD §11–12).
- FR-03.5 Without JavaScript, the CTA links to `/{locale}/download`, a full-page version of the same two-step form.
- FR-03.6 Contact fields carry `data-ph-no-capture` and are excluded from analytics.

**Acceptance criteria**
- AC-03.1 A user completes both steps and the browser starts downloading `CB-POS-Setup-{version}.exe` from `github.com/ceybyte/cbpos-releases/releases/download/...` within 1 s of submit.
- AC-03.2 Submitting with GPS coordinates outside lat 5.8–10.0 / lng 79.5–82.0 shows the localized error `LOCATION_OUTSIDE_SRI_LANKA`.
- AC-03.3 `merchants.is_public_on_map` is `false` unless the user ticked the box.
- AC-03.4 The modal is fully operable by keyboard: focus is trapped, `Esc` closes it (with a confirm if dirty), `Enter` advances, and Vaul's drag-to-dismiss on mobile works.
- AC-03.5 The flow works in all three locales, with no clipped text in the 360px-wide bottom sheet.

---

### F-04 — Sri Lanka Merchant Map

**Goal:** show CB-POS's real reach and let people find nearby shops using it, without exposing private contact data.

**Functional requirements**
- FR-04.1 MapLibre GL JS with the CARTO Dark Matter style in dark theme and Positron in light theme. Bounds are locked to Sri Lanka (`maxBounds` lng 79.5–82.0, lat 5.8–10.0). minZoom 6.5, maxZoom 16.
- FR-04.2 Data comes from `GET /api/merchants/geo`: a GeoJSON FeatureCollection of public, listed merchants only, with the properties whitelist from `05-SCHEMA.md §7` (no phone, WhatsApp, Telegram or owner name).
- FR-04.3 Clustering uses MapLibre's GeoJSON source (`cluster: true`, `clusterRadius: 50`, `clusterMaxZoom: 13`), which uses Supercluster internally, with `clusterProperties` that count supporters. Cluster bubbles show the count. A cluster containing a supporter gets a thin gold ring.
- FR-04.4 Pins:
  - standard merchant: `#00BCEB` dot with a cyan halo
  - supporter: `#FFD700` dot with a gold halo and a "Gold Supporter" badge in the popup
- FR-04.5 Popup and sheet: shop name, category, city, district, "CB-POS user since {month year}", and a Supporter badge if applicable. "Get directions" opens `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`. No contact buttons.
- FR-04.6 Side panel (desktop) or bottom sheet (mobile):
  - district filter (25)
  - category filter
  - "Supporters only" toggle
  - search by shop name or city (client-side over the loaded FeatureCollection)
  - a list of results in the current viewport
- FR-04.7 District coverage panel: a 25-cell grid with each district lit when it has ≥1 listed shop. Clicking a cell flies to that district.
- FR-04.8 "Add my shop" CTA: if signed in → dashboard listing editor; otherwise → the Download Gate (every shop on the map is a CB-POS downloader).
- FR-04.9 Public coordinates are rounded to 4 decimal places (~11 m).
- FR-04.10 "Report this listing" link → a prefilled `feedback_tickets` entry of type `listing_report`.

**Acceptance criteria**
- AC-04.1 `/api/merchants/geo` responses never contain the keys `phone`, `whatsapp`, `telegram`, `fullName`, `full_name`, `ownerUserId`, `claimTokenHash` or `ipHash` (contract test).
- AC-04.2 A merchant with `is_public_on_map = false` or `status != 'listed'` never appears.
- AC-04.3 The map is usable by keyboard: a skip link to the results list, list items focusable, `Enter` flies to the pin and opens the popup.
- AC-04.4 After an admin hides a listing, it disappears from the map within 60 s (cache purge, TRD §10).

---

### F-05 — Documentation Center

**Goal:** trilingual, searchable docs that answer setup, hardware, tax-settings and backup questions without human support.

**Information architecture (initial categories)**
1. Getting Started — system requirements, install, SmartScreen, setup wizard, first sale
2. Cashiering — keyboard shortcuts, returns, discounts, holds, split payment
3. Products & Inventory — barcodes, AVCO costing, weighed items (3 dp), stock adjustments
4. Tax — VAT 18% backward calculation, SSCL 2.5% settings, tax reports, disclaimer
5. Hardware — thermal printers (58/80mm, ESC/POS), cash drawers, scanners, scales, tested hardware list
6. Receipts — layouts, Sinhala/Tamil receipt fonts, logo printing
7. Backup & Restore — encrypted `.ZIP` backups, restore, moving to a new PC
8. Troubleshooting — printer not printing, scale not reading, database locked
9. Release Notes → links to F-06

**Functional requirements**
- FR-05.1 Fumadocs UI layout: sidebar tree, TOC, breadcrumb, prev/next, "Edit history", "Was this helpful? Yes/No" (→ PostHog event `doc_feedback`).
- FR-05.2 `⌘K` / `Ctrl+K` and `/` open instant search over the current locale's index. The index is client-side, fetched lazily on first open, results in under 50 ms.
- FR-05.3 Content is stored in D1 (`docs_articles`) as Markdown with a fixed directive whitelist (`:::callout{type=tip|warn|danger}`, `:kbd[F2]`, `::screenshot{src alt}`, `::video{src}`, `:::steps`). It's rendered without runtime eval (TRD §8).
- FR-05.4 Every Tax article automatically includes the tax disclaimer callout.
- FR-05.5 Articles carry `app_version_min`, shown as a badge ("Applies to v1.4+").
- FR-05.6 Screenshots are stored in R2 under `docs/` and served by a public, cache-friendly path through the Worker (`/media/docs/...`).
- FR-05.7 A printable keyboard-shortcut cheat sheet page (A4, print CSS).

**Acceptance criteria**
- AC-05.1 Searching "printer" in `/si/docs` returns Sinhala articles first, then English fallbacks labelled `EN`.
- AC-05.2 Publishing an article in the admin console makes it live (and searchable) within 60 s.
- AC-05.3 Every article page passes axe, has exactly one `<h1>`, and has a sequential heading order.

---

### F-06 — Releases & Changelog

**Goal:** one trusted source for the current installer, its hash and what changed.

**Functional requirements**
- FR-06.1 The source of truth is the `latest.json` manifest in `ceybyte/cbpos-releases` (schema in TRD §7) plus GitHub Release bodies for notes. These are synced into D1 `releases` by the `release-sync` cron Worker (every 30 min) and immediately on the GitHub `release` webhook.
- FR-06.2 The `/{locale}/releases` page shows:
  - the latest stable release card: version, date, size, SHA-256 for `.exe` and `.zip`, download buttons (which go through the gate if the user hasn't completed it), and a "Verify your download" expander with PowerShell `Get-FileHash` and `certutil` commands
  - the full changelog below, newest first, rendered from Markdown
- FR-06.3 Channels: `stable` (default) and `beta` (listed under a toggle, never served by the default CTA).
- FR-06.4 An admin can mark a release `is_yanked`. A yanked release is never served and shows a warning in the changelog.
- FR-06.5 `GET /api/releases/latest` returns the latest stable release as JSON. The CB-POS desktop app may use it for update checks (optional, anonymous, no identifiers).
- FR-06.6 Manifest URLs are accepted only when they match `https://github.com/ceybyte/cbpos-releases/releases/download/`.

**Acceptance criteria**
- AC-06.1 Publishing a GitHub release with a valid `latest.json` makes the new version live on the site within 2 minutes via the webhook (30 minutes worst case via cron).
- AC-06.2 A malformed manifest leaves the current `is_latest` release unchanged and writes an `admin_audit_log` warning.

---

### F-07 — Feedback Tracker

**Goal:** a public bug and feature board so users see their issue is known, and the team triages in one place.

**Functional requirements**
- FR-07.1 Ticket types: `bug`, `feature`, `question`, `listing_report`. Only `bug` and `feature` appear on the public board. `question` gets an auto-reply suggesting docs. `listing_report` is admin-only.
- FR-07.2 The submit form takes:
  - type
  - title (8–120 chars)
  - description (Markdown, 20–5,000 chars)
  - CB-POS version (select from `releases`)
  - Windows version
  - severity (`bug` only: `crash`, `blocks_billing`, `wrong_output`, `cosmetic`)
  - optional crash log upload (`.log`, `.txt`, `.zip` ≤ 5 MB to R2)
  - optional screenshot (`.png`, `.jpg` ≤ 5 MB)
  - optional contact (email or phone; private)
  - Turnstile
- FR-07.3 Before submitting, show the top 3 similar existing tickets (title search) with "Vote instead".
- FR-07.4 Public board: filter by type and status, sort by votes or newest. One vote per voter per ticket (voter = user ID if signed in, otherwise `sha256(ip + ua + salt)`).
- FR-07.5 Statuses: `open → triaged → planned → in_progress → shipped` (linked to a release) or `closed | duplicate | wont_fix`. Ticket numbers display as `CB-0001`.
- FR-07.6 Crash logs and contact details are never public. Screenshots become public only after an admin marks them safe.
- FR-07.7 Admin responses show publicly as "Ceybyte team" comments (single `admin_response` field in v1).

**Acceptance criteria**
- AC-07.1 A guest submits a bug with a crash log. The log is stored in R2 under `crash-logs/{ticketId}/`, and the ticket shows on the public board without the log or contact.
- AC-07.2 Voting twice from the same browser doesn't increase `vote_count`.

---

### F-08 — Admin CMS

**Goal:** one keyboard-driven console for 1–3 maintainers.

**Modules**
| Module | Capabilities |
|---|---|
| Overview | Today's gate submissions, downloads, pending slips, open tickets, districts covered |
| Merchants | Search/filter; view full record (incl. contacts); change status `listed/hidden/rejected`; toggle supporter; export CSV (admin only, audited) |
| Donations | Queue of `pending_review`: slip preview (presigned GET), amount and reference check, Approve / Reject with reason; link donation to merchant |
| Feedback | Triage queue; status changes; mark duplicate; link to release; public response; mark screenshot safe |
| Docs | Category tree editor; article editor (Markdown + live preview using the same renderer); translations side-by-side by `translation_key`; publish/unpublish; re-index search |
| Blog | Post editor; cover upload; schedule `published_at` |
| Releases | View synced releases; force re-sync; yank/unyank; manual entry fallback |
| Users | List users; change role; ban/unban (Better Auth admin plugin) |
| Audit log | Read-only list of every admin mutation |

**Functional requirements**
- FR-08.1 Only users with `role = 'admin'` can reach `/admin/*`. Middleware does a coarse check, and every Server Action re-checks the session and role.
- FR-08.2 Every admin mutation writes `admin_audit_log` (actor, action, entity, before/after JSON diff).
- FR-08.3 Keyboard shortcuts: `j/k` move in queues, `a` approve, `r` reject, `/` search, `g m` go to merchants, `?` shows help.
- FR-08.4 The admin console is English-only (not localized). Content editors manage `si`/`ta` content through the translations view.

**Acceptance criteria**
- AC-08.1 A `merchant` user requesting `/admin` gets a 404 (not 403), to avoid revealing the route.
- AC-08.2 Approving a donation linked to a merchant sets `merchants.is_supporter = true` and the gold pin appears on the map within 60 s.

---

### F-09 — Auth & Merchant Dashboard

**Goal:** let shop owners manage their own map listing and see their tickets and donations.

**Functional requirements**
- FR-09.1 Better Auth with email + password, email OTP (Resend), and Google OAuth. Roles: `merchant` (default) and `admin`.
- FR-09.2 Claiming a listing: the "What Next?" screen sets an httpOnly `cb_claim` cookie (30 days) holding a signed claim token, and shows "Save your listing". After sign-up or sign-in with this cookie present, the merchant row gets `owner_user_id`. The token is single-use, and only its hash is stored.
- FR-09.3 Admins can manually link a user to a merchant (for shops that lost the cookie, verified by phone call).
- FR-09.4 Dashboard pages:
  - **Overview:** listing status, map visibility, supporter badge, latest version available
  - **My Listing:** edit shop name, category, district, city, pin, map visibility
  - **My Tickets**
  - **My Donations:** status of each
  - **Settings:** language, email, password, **Delete my listing and account**
- FR-09.5 Edits to name, location or category re-enter moderation only if the listing was previously `hidden` by an admin. Otherwise they go live immediately and purge the geo cache.
- FR-09.6 Deletion: soft-delete immediately (removed from the map), hard-delete of personal fields after 30 days by the cron Worker.

**Acceptance criteria**
- AC-09.1 A user who completed the gate, then signed up on the same browser, sees their listing in `/dashboard` with no admin action.
- AC-09.2 A merchant can't read or edit another merchant's listing (the server checks `owner_user_id === session.user.id`).

---

### F-10 — Blog

**Goal:** release stories, tax-change explainers, shop success stories. This is the SEO surface for Sinhala and Tamil searches.

**Functional requirements**
- FR-10.1 Posts are per-locale, linked by `translation_key`, stored in D1 as Markdown with the same renderer as docs.
- FR-10.2 Index page with tag filter, post page with reading time, author, date, cover, and related posts (same tag).
- FR-10.3 RSS feed per locale (`/{locale}/blog/rss.xml`) and a generated OG image per post (static template, built at publish time and stored in R2).
- FR-10.4 Scheduled publishing: posts with a future `published_at` stay hidden until then (checked at render and by revalidation).

**Acceptance criteria**
- AC-10.1 A post published in `en` only appears in the `si` index under "Also in English".

---

### F-11 — Donations & Supporter Badges

**Goal:** let local and diaspora supporters fund CB-POS easily, with transparent verification.

**Tiers**
| Tier | Method | Verification |
|---|---|---|
| 1 | **LankaQR**: scan with FriMi, Flash, BOC SmartPay, ComBank Q+, iPay or any LankaQR-enabled app | Donor enters amount + transaction reference; admin reconciles against the account statement |
| 2 | **Direct bank deposit / transfer**: bank details shown with copy buttons | Donor uploads the slip (JPG/PNG/PDF ≤ 5 MB) to R2 via a presigned URL; admin approves |
| 3 | **Card via PayHere**: LKR checkout | Automatic, via the PayHere `notify_url` webhook (MD5 signature verified) |

**LankaQR note:** generating a *dynamic* (amount-encoded) LankaQR needs a merchant acquirer API. v1 shows the acquirer-issued **static** LankaQR and the payer enters the amount in their app. Dynamic QR is a P2 upgrade once an acquirer API is available at no cost. A reference code (`CB-DN-7K3Q9P`) is shown before payment so the donor can put it in the payment remark.

**Functional requirements**
- FR-11.1 Donation form fields:
  - amount: preset chips Rs. 500 / 1,000 / 2,500 / 5,000 / custom, minimum Rs. 100
  - display name, or "Anonymous"
  - optional public message (≤ 140 chars, moderated)
  - optional contact (private)
  - optional "Link to my shop listing": automatic if signed in, otherwise enter the listing phone number, matched privately
  - Turnstile
- FR-11.2 Creating a donation returns a `reference_code`. For bank transfers, the upload dropzone accepts JPG/PNG/PDF ≤ 5 MB, verified server-side after upload (TRD §9).
- FR-11.3 PayHere: the server builds the checkout payload with the `hash` (merchant secret stays server-side). The webhook verifies `md5sig`, is idempotent on `order_id`, and sets status by `status_code` (`2` approved, `0` pending, `-1` cancelled, `-2` failed, `-3` charged back → `refunded`).
- FR-11.4 On approval:
  - the linked merchant gets `is_supporter = true` and `supporter_since`
  - the gold pin and badge appear on the map
  - the donor appears on the public supporters wall (display name or "Anonymous", tier icon, month, with no amount unless the donor opts in)
- FR-11.5 Transparency block: a monthly total of approved donations (aggregate only) and what it funds (code-signing certificate, hardware for testing).
- FR-11.6 Copy states clearly that donations are voluntary, give no software benefits, and are not tax-deductible.

**Acceptance criteria**
- AC-11.1 Uploading an 8 MB PDF is rejected before upload (client) and after upload (server `head` check → object deleted, error `FILE_TOO_LARGE`).
- AC-11.2 Replaying a PayHere webhook with the same `order_id` doesn't create a second donation or change an approved one.
- AC-11.3 A webhook with an invalid `md5sig` returns 400 and changes nothing.

---

### F-12 — IRD / PDPA Legal Disclaimers

**Goal:** protect merchants and Ceybyte with honest, visible, plain-language legal notices.

**Pages** (`/{locale}/legal/...`)
| Slug | Content |
|---|---|
| `terms` | Terms of use for the website and CB-POS software licence summary: free, as-is, no warranty, limitation of liability |
| `privacy` | PDPA-aligned privacy notice: what is collected (gate, tickets, donations, auth), purpose, retention, public map fields, processors (Cloudflare, PostHog, Resend, PayHere, GitHub), rights (access, correction, deletion), contact |
| `tax-disclaimer` | CB-POS calculates VAT 18% (backward from MRP) and SSCL 2.5% per configured rates. It is not certified, approved or endorsed by the IRD. Merchants are responsible for verifying rates, registration thresholds and filings with a qualified accountant. Rates can change by law, so update CB-POS and check settings |
| `data-safety` | CB-POS stores data locally in SQLite on the shop PC. Ceybyte has no access to it and can't recover it. Merchants must take regular encrypted `.ZIP` backups to external media. Lost passwords for encrypted backups can't be recovered |
| `cookies` | Cookies used: locale, gate, claim, auth session, PostHog (with consent banner choices) |

**Functional requirements**
- FR-12.1 Inline disclaimers: the Dual-Tax bento card, all Tax docs, the gate Step 2 acceptance checkbox, the releases page ("as-is"), and the donate page ("voluntary, non-refundable except where required by law").
- FR-12.2 The `terms_version` the user accepted is stored on `merchants`. If the legal text changes materially, the version bumps, and dashboard users must re-accept.
- FR-12.3 The cookie/analytics consent banner: PostHog loads only after consent ("Allow analytics" / "Only essential"). Essential cookies (locale, auth, gate, claim) need no consent.
- FR-12.4 Every legal page shows "Last updated {date}" and a version.
- FR-12.5 Legal text in `si`/`ta` is professionally translated. The English version prevails in case of conflict, and every page says so.

**Acceptance criteria**
- AC-12.1 No page contains the strings "IRD approved", "IRD certified" or "officially compliant" in any locale (CI grep).
- AC-12.2 PostHog makes zero network requests before consent.

---

## 5. Cross-cutting requirements

| Area | Requirement |
|---|---|
| Performance | Mobile LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.05 at p75. Initial JS on `/` ≤ 180 KB gz |
| Accessibility | WCAG 2.2 AA; keyboard parity; visible focus; captions for videos; `alt` on every screenshot in all locales |
| Security | Turnstile + rate limits on public writes; CSP; R2 private by default; secrets only in Wrangler secrets; admin actions audited |
| Privacy | PDPA data minimisation; opt-in public map; hashed IPs; analytics consent; deletion within 30 days |
| Reliability | Downloads keep working if D1 is down (fallback: `/api/download/latest` reads KV `release:latest` then a hardcoded last-known release in the build) |
| SEO | SSG for marketing, docs and blog; per-locale sitemaps; `hreflang`; structured data (`SoftwareApplication` with `offers.price = 0`, `FAQPage`, `BreadcrumbList`, `Article`) |
| Browser support | Last 2 versions of Chrome, Edge, Firefox, Safari; Android Chrome 100+; graceful degradation without WebGL (map shows a district list) |

---

## 6. Dependencies & assumptions

- A1. `ceybyte/cbpos-releases` is a public GitHub repo with a `latest.json` on `main` and GitHub Release assets per version.
- A2. A Ceybyte bank account and an acquirer-issued static LankaQR exist before F-11 ships.
- A3. A PayHere merchant account is approved for donations. If PayHere declines donation use, Tier 3 is hidden behind a feature flag (`FEATURE_PAYHERE=false`) and Tiers 1–2 still ship.
- A4. Native Sinhala and Tamil translators are available for UI strings and legal pages before launch.
- A5. The installer is currently unsigned. A code-signing certificate is the first funding goal. Until then, SmartScreen guidance is mandatory in the "What Next?" step and the FAQ.
- A6. Real CB-POS screenshots in all three receipt languages are available for mockups.

## 7. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Free Workers plan limits (10 ms CPU, 3 MiB bundle) | Pages fail or the deploy is rejected | SSG/ISR for all public pages; bundle gate in CI; escalation trigger to Workers Paid ($5/mo) documented in TRD §14 |
| Fake or spam map listings | Map loses credibility | Turnstile, rate limits, phone dedupe, admin moderation queue, "Report listing" |
| SmartScreen warnings scare users | Lower installs | Explicit "What Next?" guidance with screenshots; publish hashes; code-signing as funding goal #1 |
| CARTO basemap terms or quota | Map tiles blocked | Attribution shown; fallback style URL via env (`MAP_STYLE_DARK`/`_LIGHT`) to OpenFreeMap or self-hosted Protomaps on R2 |
| Tax law changes | Incorrect claims on site | Rates live in one config (`src/lib/tax.ts`) + disclaimer; blog post per change |
| Translator availability | Launch delay | `[[TRANSLATE]]` CI gate; launch `si`/`ta` only when complete (feature flag per locale) |

## 8. Release scope

| Milestone | Includes |
|---|---|
| **M1 — Public launch** | F-01, F-02, F-03, F-04, F-05, F-06, F-08 (Merchants, Docs, Releases, Overview, Audit), F-12 |
| **M2 — Community** | F-07, F-09, F-11, F-08 (Feedback, Donations, Users) |
| **M3 — Content** | F-10, F-08 (Blog), dynamic LankaQR, docs video embeds |

## 9. Open questions

- OQ-1. Should the WhatsApp community link go to one group, or per-language groups (`en`/`si`/`ta`)? Default: one community with per-language groups.
- OQ-2. Should supporters without a shop listing get a public profile? Default: supporters wall entry only.
- OQ-3. Minimum supported Windows: 10 64-bit assumed. Confirm whether Windows 7/8.1 builds exist.
