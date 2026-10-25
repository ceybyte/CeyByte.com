# Merchant Auth & Dashboard Entry Points Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide clear, omnipresent entry points for merchants to sign in and access their dashboard across Desktop Header, Mobile Drawer, and Site Footer, dynamically toggling based on Better Auth session state.

**Architecture:**
- Use `authClient.useSession()` in `@/components/marketing/site-header.tsx` and `@/components/marketing/mobile-nav.tsx` to detect user authentication state.
- In Desktop Header right-cluster: render a ghost "Sign in" button (`/${locale}/login`) when unauthenticated, and an outline "Dashboard" button (`/${locale}/dashboard` with `LayoutDashboard` icon) when authenticated.
- In Mobile Drawer: render "Sign in" when unauthenticated, and "Dashboard" + "Sign out" in the drawer actions when authenticated.
- In Site Footer: add "Merchant portal" under the Community links column.
- Strict trilingual localization across `en`, `si`, `ta`. Single green button rule strictly enforced (header buttons use `variant="ghost"` or `variant="outline"`).

**Tech Stack:** Next.js, Better Auth React client (`@/lib/auth-client`), `next-intl`, Lucide Icons, Tailwind CSS / Vanilla CSS tokens.

---

## Global Constraints
- Single green button rule: Only the Download CTA (`#39FF14`) can be primary; Sign in and Dashboard must use `ghost` or `outline` variants.
- Strict trilingual parity: every new key must exist in `en.json`, `si.json`, and `ta.json`, verified with `bun scripts/i18n-check.ts --strict`.
- Zero prerender breakages: static generation (`output: "export"`) must pass without errors.
- WCAG AA accessibility: all interactive buttons and links must have descriptive labels, `role`, and keyboard focus styles.

---

## Review Focus
1. **Unauthenticated visitor on desktop**: Sees "Sign in" in header before download button; clicking routes to `/${locale}/login`.
2. **Authenticated merchant on desktop**: Sees "Dashboard" pill button with icon in header; clicking routes to `/${locale}/dashboard`.
3. **Mobile visitor**: Drawer navigation contains "Sign in" when logged out, and "Dashboard" + "Sign out" when logged in.
4. **Site Footer**: "Merchant portal" link appears in Community column across all locales.
5. **No hydration mismatch / flicker**: `authClient.useSession()` hook handles initial loading state gracefully with skeleton or transparent placeholder.

---

## Task Decomposition

### Task 1: Trilingual Translations for Navigation & Footer Entry Points
**Files:**
- Modify: `messages/en.json`
- Modify: `messages/si.json`
- Modify: `messages/ta.json`

- [ ] **Step 1: Add translation keys**
  - `nav.signIn`: "Sign in" / "ඇතුල් වන්න" / "உள்நுழைக"
  - `nav.dashboard`: "Dashboard" / "පුවරුව" / "டாஷ்போர்டு"
  - `nav.signOut`: "Sign out" / "ඉවත් වන්න" / "வெளியேறு"
  - `footer.links.merchantPortal`: "Merchant portal" / "වෙළඳ පුවරුව" / "வணிகர் தளம்"
- [ ] **Step 2: Verify strict i18n parity**
  - Run: `bun scripts/i18n-check.ts --strict`
  - Expected: Exit 0 with all keys matching across 3 locales.
- [ ] **Step 3: Commit**
  - `git commit -m "feat(i18n): add translations for merchant sign in and dashboard entry points"`

---

### Task 2: Header Dynamic Auth / Dashboard Button (`SiteHeader`)
**Files:**
- Modify: `apps/web/src/components/marketing/site-header.tsx`
- Test: `apps/web/src/components/marketing/__tests__/site-header.test.tsx`

**Interfaces:**
- Consumes: `authClient.useSession()` from `@/lib/auth-client`, `useTranslations("nav")`
- Produces: Header action button dynamically rendering "Sign in" or "Dashboard"

- [ ] **Step 1: Write unit tests in `site-header.test.tsx`**
  - Test 1: Renders "Sign in" link with href `/${locale}/login` when session is null.
  - Test 2: Renders "Dashboard" link with href `/${locale}/dashboard` when session is active.
- [ ] **Step 2: Run test to verify it fails**
  - Run: `bun test apps/web/src/components/marketing/__tests__/site-header.test.tsx`
- [ ] **Step 3: Implement dynamic button in `SiteHeader`**
  - Place between ThemeToggle and Download CTA.
  - If `sessionPending`: render a reserved-width placeholder or nothing to avoid layout shift.
  - If `session`: render `<Button variant="outline" size="sm" asChild><Link href="/dashboard"><LayoutDashboard className="size-4" />{t("dashboard")}</Link></Button>`.
  - If `!session`: render `<Button variant="ghost" size="sm" asChild><Link href="/login">{t("signIn")}</Link></Button>`.
- [ ] **Step 4: Run test to verify it passes**
  - Run: `bun test apps/web/src/components/marketing/__tests__/site-header.test.tsx`
- [ ] **Step 5: Commit**
  - `git commit -m "feat(web): add session-aware sign in and dashboard button to site header"`

---

### Task 3: Mobile Navigation Drawer & Footer Links (`MobileNav` & `SiteFooter`)
**Files:**
- Modify: `apps/web/src/components/marketing/mobile-nav.tsx`
- Modify: `apps/web/src/components/marketing/site-footer.tsx`
- Test: `apps/web/src/components/marketing/__tests__/mobile-nav.test.tsx`

- [ ] **Step 1: Write test for MobileNav and SiteFooter**
  - Verify MobileNav displays "Sign in" or "Dashboard" + "Sign out" depending on session.
  - Verify SiteFooter includes "Merchant portal" link pointing to `/dashboard`.
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Update `MobileNav`**
  - Add session check: if logged in, render "Dashboard" and "Sign out" button; if logged out, render "Sign in" button/link.
- [ ] **Step 4: Update `SiteFooter`**
  - Under `col.community`, add `<FooterLink href="/dashboard"><span>{fl("merchantPortal")}</span></FooterLink>`.
- [ ] **Step 5: Run tests and verify pass**
  - Run: `bun test apps/web/src/components/marketing`
- [ ] **Step 6: Commit**
  - `git commit -m "feat(web): add merchant portal links to mobile nav drawer and site footer"`

---

### Task 4: End-to-End Smoke Verification & Full Suite Pass
**Files:**
- Modify: `e2e/smoke.spec.ts`

- [ ] **Step 1: Add E2E assertion in `smoke.spec.ts`**
  - Verify that navigating to `/en/` displays the "Sign in" header button.
  - Verify clicking "Sign in" opens `/en/login`.
- [ ] **Step 2: Run Playwright smoke & dashboard suites**
  - Run: `PW_CHANNEL=chrome bunx playwright test e2e/smoke.spec.ts --project=desktop`
  - Run: `PW_CHANNEL=chrome bunx playwright test e2e/06-dashboard.spec.ts --project=desktop`
- [ ] **Step 3: Run full verification sweep**
  - `bun run typecheck`
  - `bun run lint`
  - `bun run test`
  - `bun scripts/i18n-check.ts --strict`
- [ ] **Step 4: Commit**
  - `git commit -m "test(e2e): verify header sign in and merchant entry points"`
