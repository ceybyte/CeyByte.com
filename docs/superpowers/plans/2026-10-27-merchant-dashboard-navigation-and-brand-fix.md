# Merchant Dashboard Navigation & Brand Elevation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the skewed CB POS logo slash from the merchant dashboard sidebar in favor of an elevated Merchant Portal badge, and fix the architectural routing bug where users without a linked shop were blocked from viewing My Tickets, My Donations, and Settings.

**Architecture:** 
- In `DashboardShell.tsx`, stop intercepting rendering at the layout level when `listing === null`. Provide `listing: MerchantListing | null` in `DashboardContext` and always render `{children}` so that user-scoped tabs (tickets, donations, settings) are accessible.
- Move `EmptyDashboard` rendering specifically into shop-dependent views (`OverviewView.tsx` and `ListingView.tsx`).
- In `DashboardNav.tsx`, remove `<LogoSlash />` and implement an elevated "Merchant Portal" pill badge with store glyph and subtle status indicator.
- In `SettingsTab.tsx` and API `DELETE /api/me/account`, allow accounts without a linked merchant to manage language preferences and delete their account.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Better Auth, Hono (Cloudflare Workers).

**Spec:** `docs/01-PRD.md §F-09`, `docs/03-DESIGN.md`, `docs/07-IMPLEMENTATION_PLAN.md`.

---

## Global Constraints

- Master Brand: Ceylon Byte is the company/platform; CB POS is the free retail application.
- Sidebar Brand: No skewed logo slashes in the sidebar header; keep clean merchant portal pill badge.
- Zero Claims Violations: All copy must adhere to `00-CBPOS_FACTS.md`.
- Strict Type Safety: 0 TypeScript errors across all 4 workspaces.
- Strict i18n Parity: All 3 locales (en, si, ta) must retain 100% key synchronization.

---

## Review Focus

1. Unlinked merchant clicking "My tickets" sees their feedback tickets and "Report a problem" button, not the shop claim CTA.
2. Unlinked merchant clicking "My donations" sees their donation history and "Support CB POS" button, not the shop claim CTA.
3. Unlinked merchant clicking "Settings" sees their account email, can change interface language, and can delete their account.
4. Unlinked merchant clicking "Overview" or "My listing" sees `EmptyDashboard` with the download/claim CTA.
5. Linked merchant sees their full shop details in Overview, Listing, Tickets, Donations, and Settings without regression.

---

### Task 1: Sidebar Header Brand Elevation (`DashboardNav.tsx`)

**Files:**
- Modify: `apps/web/src/features/dashboard/components/DashboardNav.tsx`
- Test: `apps/web/src/features/dashboard/dashboard.test.tsx`

**Interfaces:**
- Consumes: `locale: string`
- Produces: Clean sidebar header without `LogoSlash`, rendering a refined Merchant Portal pill badge.

- [ ] **Step 1: Write test in `dashboard.test.tsx` asserting `LogoSlash` is absent and Merchant Portal badge is present**

```tsx
test("renders DashboardNav without LogoSlash and with Merchant Portal badge", () => {
  const html = renderToString(<DashboardNav locale="en" />);
  expect(html).not.toContain("logo-slash");
  expect(html).toContain("Merchant Portal");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun --cwd apps/web test src/features/dashboard/dashboard.test.tsx`
Expected: FAIL (contains LogoSlash / doesn't contain "Merchant Portal")

- [ ] **Step 3: Update `DashboardNav.tsx`**

Remove `<LogoSlash />` and `<Link href="...">` containing it from the sidebar top header.
Replace with an elevated Merchant Portal badge:
```tsx
<div className="border-border flex items-center justify-between border-b p-4">
  <div className="border-hairline bg-surface-elevated/60 flex items-center gap-2 rounded-full border px-3 py-1 shadow-xs">
    <Store className="text-azure size-3.5" aria-hidden="true" />
    <span className="text-text font-mono text-[11px] font-bold tracking-wider uppercase">
      Merchant Portal
    </span>
  </div>
  <span className="size-1.5 rounded-full bg-emerald-500" aria-label="Active session" />
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun --cwd apps/web test src/features/dashboard/dashboard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/dashboard/components/DashboardNav.tsx apps/web/src/features/dashboard/dashboard.test.tsx
git commit -m "feat(dashboard): replace logo slash with elevated merchant portal badge in sidebar"
```

---

### Task 2: Dashboard Layout & Sub-Page De-blocking (`DashboardShell.tsx`, `OverviewView.tsx`, `ListingView.tsx`)

**Files:**
- Modify: `apps/web/src/features/dashboard/components/DashboardShell.tsx`
- Modify: `apps/web/src/features/dashboard/components/OverviewView.tsx`
- Modify: `apps/web/src/features/dashboard/components/ListingView.tsx`
- Modify: `apps/web/src/app/[locale]/dashboard/listing/page.tsx`
- Test: `apps/web/src/features/dashboard/dashboard.test.tsx`

**Interfaces:**
- Consumes: `DashboardContextValue` with `listing: MerchantListing | null` and `emptyCopy: { emptyTitle: string; emptyBody: string; }`
- Produces: `{children}` always rendered by `DashboardShell`; `EmptyDashboard` scoped specifically to `OverviewView` and `ListingView` when `listing === null`.

- [ ] **Step 1: Write test verifying `DashboardShell` renders children when listing is null**

```tsx
test("DashboardShell renders children even when listing is null", () => {
  // Mock listing as null and verify child content is rendered into DOM
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun --cwd apps/web test src/features/dashboard/dashboard.test.tsx`
Expected: FAIL (renders EmptyDashboard instead of child)

- [ ] **Step 3: Update `DashboardShell.tsx`, `OverviewView.tsx`, `ListingView.tsx`**

1. In `DashboardShell.tsx`:
   - Update `DashboardContextValue`:
     ```ts
     export interface DashboardContextValue {
       listing: MerchantListing | null;
       latestRelease: LatestRelease | null;
       emptyCopy: { emptyTitle: string; emptyBody: string };
       onListingUpdated: (updated: MerchantListing) => void;
       refreshListing: () => Promise<void>;
     }
     ```
   - In render: Always render `<DashboardContext.Provider value={{ listing, latestRelease, emptyCopy: copy, onListingUpdated, refreshListing }}>{children}</DashboardContext.Provider>` inside `<main>`. Do not block `{children}` with `!listing`.
2. In `OverviewView.tsx`:
   - If `!listing`, render `<EmptyDashboard locale={locale} onClaimSuccess={refreshListing} copy={emptyCopy} />`.
   - Otherwise, render `<OverviewTab />`.
3. In `ListingView.tsx`:
   - If `!listing`, render `<EmptyDashboard locale={locale} onClaimSuccess={refreshListing} copy={emptyCopy} />`.
   - Otherwise, render `<ListingTab />`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun --cwd apps/web test src/features/dashboard/dashboard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/dashboard/components/DashboardShell.tsx apps/web/src/features/dashboard/components/OverviewView.tsx apps/web/src/features/dashboard/components/ListingView.tsx apps/web/src/app/[locale]/dashboard/listing/page.tsx apps/web/src/features/dashboard/dashboard.test.tsx
git commit -m "fix(dashboard): decouple tab routing from shop listing so all tabs remain accessible"
```

---

### Task 3: Unlinked Merchant Handling in Settings & Backend Deletion (`SettingsTab.tsx`, `apps/api/src/routes/me.ts`)

**Files:**
- Modify: `apps/web/src/features/dashboard/components/SettingsTab.tsx`
- Modify: `apps/web/src/features/dashboard/components/SettingsView.tsx`
- Modify: `apps/api/src/routes/me.ts`
- Test: `apps/web/src/features/dashboard/listing-settings.test.tsx`
- Test: `apps/api/test/me.test.ts`

**Interfaces:**
- Consumes: `SettingsTab` accepts `listing: MerchantListing | null`
- Produces: Seamless account settings and account deletion whether a user has a linked shop or not.

- [ ] **Step 1: Write test for SettingsTab with `listing={null}`**

```tsx
test("renders SettingsTab when listing is null with user email and working options", () => {
  const html = renderToString(
    <SettingsTab locale="en" listing={null} copy={mockSettingsCopy} />
  );
  expect(html).toContain("Settings");
  expect(html).toContain("Language");
  expect(html).toContain("Delete my listing and account");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun --cwd apps/web test src/features/dashboard/listing-settings.test.tsx`
Expected: FAIL (type error / null dereference)

- [ ] **Step 3: Implement graceful null listing handling in `SettingsTab.tsx` and `routes/me.ts`**

1. In `SettingsTab.tsx`:
   - Change prop to `listing: MerchantListing | null`.
   - In profile email: `session?.user?.email ?? listing?.phone ?? "Merchant User"`.
   - In delete modal: `expectedShopName={listing?.shopName ?? session?.user?.email ?? "DELETE"}`.
2. In `apps/api/src/routes/me.ts` `DELETE /api/me/account`:
   - If `!merchant`: check `confirmShopName === session.user.email || confirmShopName === "DELETE"`.
   - Revoke sessions, delete user row, and return `{ ok: true }`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun --cwd apps/web test src/features/dashboard/listing-settings.test.tsx`
Run: `bun --cwd apps/api test test/me.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/dashboard/components/SettingsTab.tsx apps/web/src/features/dashboard/components/SettingsView.tsx apps/api/src/routes/me.ts apps/web/src/features/dashboard/listing-settings.test.tsx apps/api/test/me.test.ts
git commit -m "fix(dashboard): support unlinked merchant settings and account deletion"
```

---

### Task 4: End-to-End Verification & Quality Gates

**Files:**
- Verify: Full workspace tests, lint, format, typecheck, claims check, i18n parity.
- Visual: Browser inspection of `/en/dashboard`, `/en/dashboard/tickets`, `/en/dashboard/donations`, `/en/dashboard/settings`.

- [ ] **Step 1: Run format and lint**

Run: `bun run format && bun run lint`
Expected: 0 errors, 0 warnings

- [ ] **Step 2: Run typecheck across all 4 workspaces**

Run: `bun run typecheck`
Expected: 0 errors across `@cbpos/web`, `@cbpos/api`, `@cbpos/shared`, `@cbpos/www-redirect`

- [ ] **Step 3: Run banned claims check**

Run: `bun run check:claims`
Expected: 0 violations

- [ ] **Step 4: Run strict i18n parity check**

Run: `bun scripts/i18n-check.ts --strict`
Expected: 100% strict parity across 704 keys

- [ ] **Step 5: Run full test suite**

Run: `bun run test`
Expected: 100% pass across all workspaces

- [ ] **Step 6: Visual verification in browser**

Verify with browser subagent that:
1. The sidebar header no longer shows the skewed logo slash, but an elegant "MERCHANT PORTAL" badge.
2. Navigating to `/dashboard/tickets` renders "My tickets" and "Report a problem".
3. Navigating to `/dashboard/donations` renders "My donations" and "Support CB POS".
4. Navigating to `/dashboard/settings` renders account settings, language switches, and delete account.
5. Navigating to `/dashboard` (Overview) and `/dashboard/listing` shows the claim/download prompt for unlinked users.
