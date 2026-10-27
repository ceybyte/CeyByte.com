# Mobile Responsiveness, Navigation & Content Styling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix mobile responsive issues, eliminate the `[CB POS]` tag from the navbar and elevate its height, route "Explore Features" to `/features`, fix unstyled docs/blog content with a dedicated `.prose-ceybyte` stylesheet, redesign the footer to be sleek and minimal, match `/donate` with `/releases` styling, and unify corner radii across the platform.

**Architecture:** 
- Nav: Master-brand Ceylon Byte logo with expanded vertical height (76px desktop / 68px mobile), generous breathing room, and modern pill micro-interactions.
- Content Engine: Tailwind v4 custom `.prose-ceybyte` CSS layer in `globals.css` with structured step cards (`.step-card`, `.step-badge`, `.step-title`), callouts, and readable typography for documentation and blog posts.
- Footer: Lightweight 2-row editorial layout focusing on the Ceylon Byte open platform mission, removing redundant language/theme toggles and verbose tax disclaimers.
- Mobile Viewport: Flexible button text scaling and container constraints preventing horizontal clipping on 360px–390px screens.
- Design System: Balanced corner radii (`--radius-card: 14px`, `--radius-btn: 8px`, `--radius-badge: 6px`) eliminating harsh flat edges.

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS v4, TypeScript, Unified/Remark/Rehype Markdown pipeline, Lucide Icons.

**Spec:** `docs/03-DESIGN.md`, `docs/01-PRD.md`, and active design critique decisions.

---

## Global Constraints

- Master Brand: Ceylon Byte is the company/platform; CB POS is the free retail application.
- Single Green Button: Neon green (`#39FF14`) is strictly reserved for the primary software download CTA per viewport.
- Gold Tokens: Reserved for community funding on `/donate`.
- Trilingual Parity: 100% strict synchronization across `messages/en.json`, `messages/si.json`, and `messages/ta.json`.
- Zero Banned Claims: Prohibit "100% offline", "guaranteed compliance", or marketing buzzwords.

---

## Review Focus

1. *Mobile Viewport Clipping*: Primary download button on `/releases` must not overflow or truncate text on a 360px mobile screen.
2. *Docs Article Hierarchy*: Technical steps (`:::step`), code blocks, and keyboard shortcuts must render with distinct visual containers, high contrast, and readable line heights.
3. *Hero CTA Navigation*: Clicking "Explore Features →" must navigate directly to the localized `/{locale}/features` page.
4. *Footer Redundancy*: Theme toggles, language switchers, and redundant legal paragraphs must not appear in the footer.
5. *Visual Cohesion*: Bento grid cards, donate cards, and release cards must share harmonious corner radii (`rounded-xl` / 14px).

---

### Task 1: Navigation Bar Modernization & Master Branding

**Files:**
- Modify: `apps/web/src/components/brand/logo.tsx`
- Modify: `apps/web/src/components/marketing/site-header.tsx`
- Modify: `apps/web/src/app/globals.css`
- Test: `apps/web/src/components/marketing/__tests__/site-header.test.tsx`

**Interfaces:**
- Consumes: Next-Intl routing, authClient session.
- Produces: Header bar with expanded height and clean Ceylon Byte master logo.

- [ ] **Step 1: Write/update unit test for SiteHeader without CB POS tag and updated height**
  Assert `Logo` is rendered without product badge and header class includes height `h-[76px]` or `h-[--header-h]`.
- [ ] **Step 2: Update `apps/web/src/app/globals.css`**
  Set `--header-h: 76px` on desktop and update mobile media queries to `68px`.
- [ ] **Step 3: Update `apps/web/src/components/marketing/site-header.tsx`**
  Set `<Logo size="md" showProductBadge={false} />` to omit the `[CB POS]` tag from the primary navigation bar.
- [ ] **Step 4: Add hover micro-interactions**
  Add subtle bottom border highlight transition or pill hover effect to nav links.
- [ ] **Step 5: Run tests and verify**
  Run `bun test src/components/marketing/__tests__/site-header.test.tsx` in `apps/web`.

---

### Task 2: Hero CTA Routing & Mobile Download Button Overflow Fix

**Files:**
- Modify: `apps/web/src/components/home/hero-section.tsx`
- Modify: `apps/web/src/components/releases/latest-release-card.tsx`
- Test: `apps/web/src/components/home/__tests__/home.test.ts`

**Interfaces:**
- Consumes: Next-Intl `Link` component.
- Produces: Correct routing to `/features` and responsive button layout on mobile.

- [ ] **Step 1: Update Hero CTA in `apps/web/src/components/home/hero-section.tsx`**
  Replace `<a href="#features">` with `<Link href="/features">` using Next-Intl `Link`.
- [ ] **Step 2: Fix mobile button text wrapping in `latest-release-card.tsx`**
  Adjust the CTA button styling to use responsive font size (`text-sm sm:text-base`) and whitespace handling (`whitespace-normal sm:whitespace-nowrap`) so "Download the installer (.EXE) — 50 MB" never truncates on mobile screens.
- [ ] **Step 3: Run web tests**
  Run `bun test src/components/home` in `apps/web`.

---

### Task 3: Middle Strip Telemetry Redesign (Style 2: Floating Glass Capsule HUD)

**Files:**
- Modify: `apps/web/src/components/home/telemetry-strip.tsx`
- Test: `apps/web/src/components/home/__tests__/home.test.ts`

**Interfaces:**
- Consumes: Real-time and platform metrics tokens.
- Produces: Floating glass capsule HUD with 16px/20px rounded corners, responsive grid, status pulse, and map link.

- [ ] **Step 1: Update container to Floating Glass Capsule HUD**
  Style as `bg-surface/90 backdrop-blur-md border border-hairline rounded-2xl p-5 shadow-2xl`.
- [ ] **Step 2: Format metric items in responsive 5-column grid**
  - Cashiering latency: `0 ms` (Zero cloud dependencies)
  - Lifetime license: `Rs. 0` (No monthly rentals)
  - Provincial reach: `25/25` (All districts supported)
  - Revenue tax: `18% + 2.5%` (Automatic VAT / SSCL)
  - Live Directory action: `● LIVE DIRECTORY` button linking to `/map`.
- [ ] **Step 3: Run web home tests**
  Run `bun test src/components/home` in `apps/web`.

---

### Task 4: Dedicated Prose & Markdown Directive Stylesheet (`.prose-ceybyte`)

**Files:**
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/features/docs/components/markdown-renderer.tsx`
- Modify: `apps/web/src/app/[locale]/blog/[slug]/page.tsx`
- Test: `apps/web/src/features/docs/components/article.test.tsx`

**Interfaces:**
- Consumes: HTML output from `@cbpos/shared/markdown`.
- Produces: Polished typography and step containers for docs and blogs.

- [ ] **Step 1: Add `.prose-ceybyte` CSS classes to `apps/web/src/app/globals.css`**
  Add explicit CSS rules for:
  - `h1`, `h2`, `h3`, `h4`: Font weight 700, tracking tight, bottom border for h2, azure tint for h3.
  - `p`: Font size 0.95rem, line height 1.75, margin bottom 1rem, color `text-text-primary`.
  - `.step-card`: Background `--surface`, border hairline, border-left 3px solid `--azure`, border radius `--radius-lg`, padding 1.25rem, margin 1.25rem 0.
  - `.step-badge`: Background `rgba(3, 147, 221, 0.15)`, text `--azure-text`, font mono, font bold, padding 2px 8px, border radius 4px.
  - `.callout`: Border-left 4px, background tint, padding 1rem, border radius `--radius-md`.
  - `kbd`: Background `--kbd-bg`, border `--kbd-border`, padding 2px 6px, font mono text-xs.
- [ ] **Step 2: Update `markdown-renderer.tsx`**
  Apply `className="prose-ceybyte max-w-none"` to `<article>`.
- [ ] **Step 3: Update `apps/web/src/app/[locale]/blog/[slug]/page.tsx`**
  Apply `className="prose-ceybyte max-w-none"` to blog article body.
- [ ] **Step 4: Run doc tests**
  Run `bun test src/features/docs` in `apps/web`.

---

### Task 5: Minimalist Master-Brand Footer Redesign

**Files:**
- Modify: `apps/web/src/components/marketing/site-footer.tsx`
- Modify: `messages/en.json`, `messages/si.json`, `messages/ta.json`
- Test: `apps/web/src/components/marketing/__tests__/site-header.test.tsx`

**Interfaces:**
- Consumes: Footer localization strings.
- Produces: Clean, uncluttered 2-row footer layout.

- [ ] **Step 1: Update localization strings in `messages/{en,si,ta}.json`**
  Update `footer.mission` to platform mission:
  - English: `"Open retail technology & software engineered in Sri Lanka by Ceylon Byte."`
  - Sinhala & Tamil equivalents with 100% strict parity.
- [ ] **Step 2: Remove redundant controls from `site-footer.tsx`**
  - Remove `LanguageSwitcher` and `ThemeToggle` from footer bottom bar.
  - Remove `legalLine` paragraph containing the long IRD warranty disclaimer.
- [ ] **Step 3: Restructure footer layout into clean 2-row architecture**
  Row 1: Ceylon Byte logo + platform mission | Essential navigation links (`Features`, `Docs`, `Releases`, `Community`, `Terms`, `Privacy`).
  Row 2: Copyright notice, Git build SHA, `"ENGINEERED IN SRI LANKA"` badge.
- [ ] **Step 4: Run i18n and marketing tests**
  Run `bun scripts/i18n-check.ts --strict` and `bun test src/components/marketing`.

---

### Task 6: Donate Page Overhaul (Style 1 Dual-Panel Monolith + Releases Parity)

**Files:**
- Modify: `apps/web/src/features/donations/components/DonationView.tsx`
- Modify: `apps/web/src/features/donations/components/DonationCard.tsx`
- Modify: `apps/web/src/features/donations/components/BankDetailsCard.tsx`
- Create: `apps/web/src/features/donations/components/DonationFigure.tsx` (isometric hardware hairline element)
- Test: `apps/web/src/features/donations/__tests__/donations.test.tsx`

**Interfaces:**
- Consumes: `createDonation`, `presignAndUploadSlip`, `submitDonationSlip`, `fetchDonationSummary` from `apps/web/src/features/donations/api.ts` (matching backend `apps/api/src/routes/donations.ts` & `uploads.ts`).
- Produces: Releases-matched dual-panel monolith with zero yellow gradient lines, integrated isometric hairline hardware element, and seamless backend API wiring.

- [ ] **Step 1: Create `DonationFigure.tsx` component**
  Precision SVG isometric hardware element matching reference image (isometric rounded slab, 8 hardware knobs along top rail, curved dual hairline bus traces, elevated hovering nodes with drop lines, and pulsing active azure node `#0eaae9`).
- [ ] **Step 2: Redesign `DonationView.tsx` header card**
  - Implement `/releases`-matched card container with `border border-hairline bg-surface rounded-2xl p-6 sm:p-10 relative overflow-hidden`.
  - Remove top badge "CEYBYTE COMMUNITY FUNDING" and strictly omit any yellow/gold gradient line on top.
  - Position `DonationFigure` in background right half with smooth hover opacity.
  - Content on left: title, lead, and 3 trust indicators.
- [ ] **Step 3: Update `DonationCard.tsx` and `BankDetailsCard.tsx` layout & backend wiring**
  - Dual-panel layout (Left: donation amount selector [Rs 500, 1000, 2500, Custom], donor name, anonymous checkbox, public note, link shop phone; Right: official Commercial Bank credentials, copy buttons with feedback, slip upload dropzone, gold CTA button).
  - Strictly NO yellow gradient hairline line on card top.
  - Verify complete backend wiring:
    - `POST /api/donations` creates reference code with `cb_dn_<ref>` cookie.
    - `POST /api/uploads/presign` fetches pre-signed R2 PUT URL.
    - File upload directly to R2 bucket.
    - `POST /api/donations/:ref/submit` commits slip storage key.
    - Zero data leaks: no sensitive fields leaked in client console/state, slip upload error handling, clean reset after submission.
- [ ] **Step 4: Run donations tests**
  Run `bun test src/features/donations` in `apps/web`.

---

### Task 7: Global Design System Corner Radius Calibration

**Files:**
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/components/home/bento-grid.tsx`
- Modify: `docs/03-DESIGN.md`

**Interfaces:**
- Consumes: CSS variables in `@theme`.
- Produces: Unified, cohesive corner radii across all cards and buttons.

- [ ] **Step 1: Calibrate radius tokens in `globals.css`**
  - `--radius-sm: 4px` (tags, badges, kbd keys)
  - `--radius-md: 8px` (buttons, inputs)
  - `--radius-lg: 12px` (inner cards)
  - `--radius-xl: 16px` (main feature cards, bento tiles, release cards)
- [ ] **Step 2: Update `bento-grid.tsx` and cards to use consistent rounded-xl**
- [ ] **Step 3: Verify styleguide and visual consistency**

---

### Task 8: Full Verification & Quality Gates

**Files:**
- All modified files across monorepo

- [ ] **Step 1: Run Prettier formatting**
  `bun run format`
- [ ] **Step 2: Run linter**
  `bun run lint` (0 errors, 0 warnings)
- [ ] **Step 3: Run TypeScript compiler**
  `bun run typecheck` (0 errors across 4 workspaces)
- [ ] **Step 4: Run Banned Claims check**
  `bun run check:claims` (0 violations)
- [ ] **Step 5: Run Trilingual Parity check**
  `bun scripts/i18n-check.ts --strict` (100% strict match)
- [ ] **Step 6: Run full test suites**
  `bun test` in `apps/web`, `packages/shared`, `apps/api`


