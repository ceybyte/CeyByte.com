# UI Polish, Map Collapsible Sidebar, Header Unification & Version Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 
1. Make the atmospheric azure radial glow above the footer visible in light theme.
2. Update the footer: replace verbose mission with `"Digitizing Sri Lanka, Byte by Byte."`, remove `"Merchant portal login"` and `"GitHub"`, add `"Facebook"` (`https://facebook.com/CeylonByte`), and remove the `"build dev"` / `"build {sha}"` text.
3. Make the map page sidebar ("Districts with CB POS shops") collapsible on desktop so users can view the full-width map when needed.
4. Unify page headers across `/features`, `/releases`, `/donate`, and `/feedback` with the full-width hero banner pattern and corner wireframe figures.
5. Centralize the canonical latest app version (`1.3.0`) across all locations, eliminating hardcoded `v1.4.2` discrepancies.

**Architecture:**
- **Theme Engine:** Boost light mode `--glow-azure` token to `rgba(1, 108, 199, 0.18)` and adjust radial gradient in `FinalBannerSection` so the azure ambient glow renders crisp on both light and dark backgrounds.
- **Site Footer:** Clean 2-row layout without build SHA; links updated with Facebook and synchronized across `en.json`, `si.json`, and `ta.json`.
- **Map Shell:** Add `isDesktopSidebarOpen` state with an accessible floating toggle button (`ChevronLeft` / `ChevronRight` or `PanelLeftClose` / `PanelLeft`) and smooth transition, expanding the map to 100% width when collapsed.
- **Header Unification:** Standardize `/releases`, `/donate`, and `/feedback` headers to adopt the full-width `border-b border-hairline bg-surface/30` hero pattern with wireframe figures and badge/h1/lead typographic hierarchy.
- **Version SSOT:** Export `LATEST_APP_VERSION = "1.3.0"` in `apps/web/src/lib/constants.ts` and dynamically derive version dropdown options in `FeedbackSubmitForm.tsx`.

---

## Tasks

### Task 1: Light Theme Gradient & Footer Modernization
- [x] Update `apps/web/src/app/globals.css` light theme `--glow-azure` to `rgba(1, 108, 199, 0.18)`
- [x] Update `apps/web/src/components/home/final-banner-section.tsx` radial gradient opacity and color stops for high visibility on light surfaces
- [x] Update `messages/en.json`, `messages/si.json`, `messages/ta.json` with new slogan `"Digitizing Sri Lanka, Byte by Byte."` and Facebook link
- [x] Update `apps/web/src/components/marketing/site-footer.tsx` (remove Merchant Portal & GitHub, add Facebook, remove build SHA)
- [x] Update `apps/web/src/components/marketing/__tests__/site-footer.test.tsx` and `e2e/smoke.spec.ts`

### Task 2: Map Page Collapsible Sidebar on Desktop
- [x] In `apps/web/src/components/map/map-shell.tsx`, add `isDesktopSidebarOpen` state (default `true`)
- [x] Add desktop floating collapse/expand toggle button with tooltip and accessible label
- [x] Add smooth CSS transition for desktop `<aside>` width/visibility, expanding map to full width when collapsed
- [x] Verify map resize handler and canvas dimensions adapt when sidebar collapses

### Task 3: Page Header Unification (Releases, Donate, Feedback)
- [x] Update `apps/web/src/app/[locale]/releases/page.tsx`: replace boxed monolith card with full-width hero header containing `Figure name="branches"`
- [x] Update `apps/web/src/features/donations/components/DonationView.tsx`: adopt full-width hero banner with `DonationFigure`
- [x] Update `apps/web/src/features/feedback/components/FeedbackBoard.tsx`: add full-width hero banner with badge, H1, lead text, and action buttons

### Task 4: Centralized Canonical Latest Version & Feedback Form Sync
- [x] Export `LATEST_APP_VERSION = "1.3.0"` in `apps/web/src/lib/constants.ts`
- [x] Update `apps/web/src/features/feedback/components/FeedbackSubmitForm.tsx` to use `LATEST_APP_VERSION` for default state and option list (`v1.3.0 (Latest)`, `v1.2.5`, `v1.2.2`, `unknown`)
- [x] Update any tests asserting feedback form defaults

### Task 5: Verification & Validation
- [x] Run `bun run lint && bun run format`
- [x] Run `bun run i18n:check`
- [x] Run `bun run typecheck`
- [x] Run `bun run test`
- [x] Inspect visual changes via browser or unit snapshot/render checks
