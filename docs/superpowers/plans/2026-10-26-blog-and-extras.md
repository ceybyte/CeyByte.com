# Phase 13: Blog & Extras Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Phase 13 Blog system (Screen S10) and Admin Blog Authoring portal (`/admin/blog`), Markdown directive extensions (`::video`, `:kbd`, `::screenshot`), per-locale RSS feeds, three foundational launch posts, and a Payment Gateway ADR.

**Architecture:** Markdown articles stored in D1's `blog_posts` table with media in R2 (`cbpos-public/media/blog/...`). Extracted at build time into `apps/web/.content/blog.json` via Bun for static Next.js pre-rendering (SSG), ensuring zero Worker database costs and instant edge response. The staff admin portal (`/admin/blog`) provides split-pane live preview editing, scheduling, and automated rebuild dispatching.

**Tech Stack:** Next.js (App Router, SSG), Hono, Cloudflare Workers & D1, Cloudflare R2, unified / remark / hast, Tailwind CSS, TypeScript, Bun, Playwright.

**Spec:** [`docs/superpowers/specs/2026-10-26-blog-and-extras-design.md`](file:///Users/akash/Documents/CeyByte.com/docs/superpowers/specs/2026-10-26-blog-and-extras-design.md)

## Global Constraints

- **Banned Marketing Claims & Buzzwords:** Never claim "100% offline", "cloud backup", or "IRD compliant/certified". Never use filler buzzwords: `seamless`, `revolutionize`, `unlock`, `effortless`, `game-changer`, `cutting-edge`.
- **Single Green Button Rule:** On marketing and public pages, `#39FF14` is reserved exclusively for the primary Windows download action. Blog tags, links, and accent rules use Azure/Cyan (`#00E5FF`, `text-cyan-400`).
- **Trilingual Parity:** Strict parity across `en`, `si`, and `ta` for all new UI strings, verified via `bun scripts/i18n-check.ts --strict`.
- **Zero Runtime Public DB Cost:** Public blog routes (`/{locale}/blog`, `/{locale}/blog/{slug}`) must read statically pre-rendered content from `.content/blog.json`; D1 is only queried during admin authoring or site rebuilds.
- **Accessible Video Embeds:** The `::video` directive strictly requires a valid caption track (`.vtt`) to pass accessibility validation.

## Review Focus

1. **Missing Translation Fallback:** When a user visits `/{locale}/blog/{slug}` for a post that only exists in English, the page renders the English article under an informative "Also in English" banner without language-mixing or hydration mismatches.
2. **Tag Filtering Edge Case:** Clicking a tag with no matching posts displays a localized empty state without crashing or breaking the layout.
3. **Invalid/Malformed Directives:** Unclosed directives or video directives missing captions degrade gracefully to plain accessible fallbacks rather than throwing unhandled exceptions in the markdown pipeline.
4. **Schedule Date Enforcement:** Posts scheduled for the future (`status = 'scheduled'` and `published_at > now`) must never be leaked into public `.content/blog.json` until the scheduled time arrives.
5. **Media Presigning Security:** Admin media presigning must restrict file types to JPEG, PNG, WebP $\le$ 5 MB and MP4 $\le$ 50 MB, preventing arbitrary file uploads to the public CDN bucket.

---

### Task 1: Directives & AST Pipeline Enhancements (`packages/shared`)
**Files:**
- Modify: `packages/shared/src/markdown/directives.ts`
- Modify: `packages/shared/src/markdown/types.ts`
- Test: `packages/shared/src/markdown/markdown.test.ts`

**Interfaces:**
- Consumes: `unified`, `unist-util-visit`, `mdast-util-directive`.
- Produces: AST transformation for `::video{src alt captions}`, `:kbd[key]`, and `::screenshot{src alt}`.

- [ ] **Step 1: Write failing unit test in `packages/shared/src/markdown/markdown.test.ts`**
```ts
test("renders video directive with mandatory captions", async () => {
  const md = '::video{src="/media/test.mp4" alt="Demo" captions="/media/test.vtt"}';
  const html = await markdownToHtml(md);
  expect(html).toContain('<video');
  expect(html).toContain('src="/media/test.mp4"');
  expect(html).toContain('<track kind="captions" src="/media/test.vtt"');
});

test("renders kbd text directive", async () => {
  const md = "Press :kbd[F3] to search";
  const html = await markdownToHtml(md);
  expect(html).toContain('<kbd class="kbd-key">F3</kbd>');
});
```

- [ ] **Step 2: Run test to verify failure**
Run: `bun run --filter @cbpos/shared test`
Expected: FAIL ("video/kbd directive not recognized")

- [ ] **Step 3: Implement directives in `packages/shared/src/markdown/directives.ts`**
Add visitors for `video`, `kbd`, and `screenshot` directive names converting to semantic HTML AST nodes.

- [ ] **Step 4: Run test to verify it passes**
Run: `bun run --filter @cbpos/shared test`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add packages/shared/src/markdown/
git commit -m "feat(shared): add video with captions, kbd, and screenshot markdown directives"
```

---

### Task 2: Blog Admin API Routes & R2 Media Presigning (`apps/api`)
**Files:**
- Create: `apps/api/src/routes/admin-blog.ts`
- Modify: `apps/api/src/routes/admin.ts`
- Modify: `apps/api/src/routes/uploads.ts`
- Test: `apps/api/test/admin-blog.test.ts`

**Interfaces:**
- Consumes: Admin session, D1 `blog_posts` table, R2 `cbpos-public` bucket.
- Produces: `GET/POST /api/admin/blog/posts`, `GET/PUT /api/admin/blog/posts/:id`, `POST /api/admin/blog/posts/:id/publish`, `POST /api/admin/media/presign`.

- [ ] **Step 1: Write failing test in `apps/api/test/admin-blog.test.ts`**
```ts
describe("Admin Blog Management", () => {
  it("CRUD blog posts with slug uniqueness and reading time calculation", async () => {
    const cookie = await getAdminCookie();
    const createRes = await call("/admin/blog/posts", {
      method: "POST",
      cookie,
      body: JSON.stringify({
        title: "Test Launch",
        slug: "test-launch",
        locale: "en",
        translationKey: "test-launch",
        excerpt: "An exciting update",
        bodyMd: "# Test\n\nWord count body for reading time calculation.",
        tags: ["releases"],
        status: "draft",
      }),
    });
    expect(createRes.status).toBe(201);
  });
});
```

- [ ] **Step 2: Run test to verify failure**
Run: `bun run --filter @cbpos/api test test/admin-blog.test.ts`
Expected: FAIL (404 route not found)

- [ ] **Step 3: Implement `apps/api/src/routes/admin-blog.ts` and mount in `admin.ts`**
Add CRUD endpoints, calculate reading time (words / locale-wpm), enforce slug uniqueness per locale, audit in `admin_audit_log`, and add `POST /api/admin/media/presign` for R2 uploads.

- [ ] **Step 4: Run test to verify it passes**
Run: `bun run --filter @cbpos/api test test/admin-blog.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add apps/api/src/routes/ apps/api/test/
git commit -m "feat(api): add admin blog post CRUD and media presigning endpoints"
```

---

### Task 3: Build Content Extractor & Scheduled Blog Cron (`scripts` & `apps/api`)
**Files:**
- Modify: `scripts/build-content.ts`
- Modify: `apps/api/src/scheduled.ts`
- Test: `apps/api/test/blog-cron.test.ts`

**Interfaces:**
- Consumes: D1 `blog_posts` rows, Cloudflare KV.
- Produces: Enhanced `apps/web/.content/blog.json` with HAST AST and cover metadata; automated scheduled post transitions.

- [ ] **Step 1: Write failing test in `apps/api/test/blog-cron.test.ts`**
```ts
test("scheduled posts due for publication are marked published and trigger rebuild", async () => {
  const past = new Date(Date.now() - 3600 * 1000).toISOString();
  await env.DB.prepare(
    "INSERT INTO blog_posts (id, translation_key, locale, slug, title, excerpt, body_md, status, published_at, created_at, updated_at) VALUES ('b1', 'tk1', 'en', 'sched', 'Sched', 'Ex', 'Body', 'scheduled', ?, ?, ?)",
  ).bind(past, past, past).run();

  const res = await checkScheduledPosts(env, db);
  expect(res.publishedCount).toBe(1);
});
```

- [ ] **Step 2: Run test to verify failure**
Run: `bun run --filter @cbpos/api test test/blog-cron.test.ts`
Expected: FAIL ("checkScheduledPosts not defined")

- [ ] **Step 3: Implement scheduled post activation in `apps/api/src/scheduled.ts` and update `scripts/build-content.ts`**
Update `build-content.ts` to process Markdown AST, TOC, and metadata for blog posts. Add cron job hook in `scheduled.ts`.

- [ ] **Step 4: Run test to verify it passes**
Run: `bun run --filter @cbpos/api test test/blog-cron.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add scripts/build-content.ts apps/api/src/scheduled.ts apps/api/test/
git commit -m "feat(build): enrich blog content extraction and add scheduled publication cron"
```

---

### Task 4: Trilingual Localizations for Blog (`messages`)
**Files:**
- Modify: `messages/en.json`
- Modify: `messages/si.json`
- Modify: `messages/ta.json`

**Interfaces:**
- Consumes: S10 Screen Blueprint copy specifications.
- Produces: Strictly validated `blog.*` and `admin.blog.*` dictionaries in EN, SI, and TA.

- [ ] **Step 1: Add blog dictionaries to `messages/en.json`, `messages/si.json`, and `messages/ta.json`**
Add:
- `blog.title`: "Blog" / "බ්ලොග් අඩවිය" / "வலைப்பதிவு"
- `blog.lead`: "Release notes in plain language, tax changes explained, and stories from shops using CB POS."
- `blog.tags.all`, `blog.tags.releases`, `blog.tags.tax`, `blog.tags.stories`, `blog.tags.hardware`
- `blog.readingTime`, `blog.alsoInEnglish`, `blog.related`, `blog.rss`, `blog.empty`
- `admin.blog.*` strings for authoring.

- [ ] **Step 2: Run strict i18n validator**
Run: `bun scripts/i18n-check.ts --strict`
Expected: PASS (100% key parity across all 3 locales)

- [ ] **Step 3: Run banned claims check**
Run: `bun run check:claims`
Expected: PASS (0 banned claims or buzzwords)

- [ ] **Step 4: Commit**
```bash
git add messages/
git commit -m "feat(i18n): add trilingual localization for blog reader and admin authoring"
```

---

### Task 5: Frontend Public Blog Pages & Components (`apps/web`)
**Files:**
- Create: `apps/web/src/features/blog/types.ts`
- Create: `apps/web/src/features/blog/source.ts`
- Create: `apps/web/src/features/blog/components/FeaturedPostCard.tsx`
- Create: `apps/web/src/features/blog/components/PostCard.tsx`
- Create: `apps/web/src/features/blog/components/TagFilterBar.tsx`
- Create: `apps/web/src/features/blog/components/AlsoInEnglishBanner.tsx`
- Create: `apps/web/src/features/blog/components/RelatedPosts.tsx`
- Create: `apps/web/src/features/blog/components/BlogView.tsx`
- Create: `apps/web/src/app/[locale]/blog/page.tsx`
- Create: `apps/web/src/app/[locale]/blog/[slug]/page.tsx`
- Create: `apps/web/src/app/[locale]/blog/rss.xml/route.ts`
- Test: `apps/web/src/features/blog/__tests__/blog.test.tsx`

**Interfaces:**
- Consumes: `.content/blog.json`, `useTranslations("blog")`, Next.js routing.
- Produces: Public S10 Blog Index, Article View, and XML RSS feed.

- [ ] **Step 1: Write failing unit test in `apps/web/src/features/blog/__tests__/blog.test.tsx`**
```tsx
test("TagFilterBar renders all categories with cyan accent on active filter", () => {
  render(<TagFilterBar activeTag="all" onSelectTag={() => {}} />);
  expect(screen.getByText("All")).toHaveClass("border-cyan-400");
});

test("PostCard renders reading time and title with semantic link", () => {
  render(<PostCard post={mockPost} />);
  expect(screen.getByText("5 min read")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify failure**
Run: `bun test src/features/blog/__tests__/blog.test.tsx` (in `apps/web`)
Expected: FAIL

- [ ] **Step 3: Implement blog components, pages, and RSS route handler**
Assemble S10 according to Option A layout:
- `TagFilterBar`: Horizontal pill strip with cyan active styling.
- `FeaturedPostCard`: Full-width hero card with cover image and mono reading meta.
- `PostCard`: 3-column responsive grid card.
- `AlsoInEnglishBanner`: Graceful fallback notice for untranslated posts.
- `rss.xml`: Standard RSS 2.0 XML generator.

- [ ] **Step 4: Run test to verify it passes**
Run: `bun test src/features/blog/__tests__/blog.test.tsx` (in `apps/web`)
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add apps/web/src/features/blog/ apps/web/src/app/
git commit -m "feat(web): implement S10 blog index, article viewer, and RSS 2.0 feed"
```

---

### Task 6: Admin Blog Authoring Portal (`apps/web`)
**Files:**
- Create: `apps/web/src/features/admin/components/blog-list.tsx`
- Create: `apps/web/src/features/admin/components/blog-editor.tsx`
- Create: `apps/web/src/app/admin/blog/page.tsx`
- Create: `apps/web/src/app/admin/blog/[id]/page.tsx`
- Modify: `apps/web/src/features/admin/api.ts`
- Test: `apps/web/src/features/admin/__tests__/admin-blog.test.tsx`

**Interfaces:**
- Consumes: Admin session, `/api/admin/blog/*`, `/api/admin/media/presign`.
- Produces: Admin blog management dashboard and split-pane markdown authoring editor.

- [ ] **Step 1: Write failing test in `apps/web/src/features/admin/__tests__/admin-blog.test.tsx`**
```tsx
test("renders blog management table with status pills", () => {
  render(<BlogList initialPosts={mockPosts} />);
  expect(screen.getByText("Published")).toBeInTheDocument();
  expect(screen.getByText("Draft")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify failure**
Run: `bun test src/features/admin/__tests__/admin-blog.test.tsx` (in `apps/web`)
Expected: FAIL

- [ ] **Step 3: Implement API methods in `admin/api.ts` and authoring components**
Build `blog-list.tsx` and `blog-editor.tsx` with live split preview, R2 cover upload, slug generation, and publish actions.

- [ ] **Step 4: Run test to verify it passes**
Run: `bun test src/features/admin/__tests__/admin-blog.test.tsx` (in `apps/web`)
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add apps/web/src/features/admin/ apps/web/src/app/admin/
git commit -m "feat(web): add admin blog authoring portal with live split preview editor"
```

---

### Task 7: Launch Editorial Posts & Payment Gateway Feasibility ADR (`content` & `docs`)
**Files:**
- Modify: `apps/web/.content/fixtures.json`
- Modify: `scripts/seed.ts`
- Create: `docs/adr/0002-payment-gateway-feasibility.md`

**Interfaces:**
- Consumes: PRD facts [C1], [C2], [G1], [H], [A8].
- Produces: Three high-quality launch articles and architectural decision record for payment gateways.

- [ ] **Step 1: Write three launch articles in `fixtures.json` and `scripts/seed.ts`**
1. *"Why CB POS is Free Forever"*: Mission, donation sustainability, 100% offline data ownership.
2. *"How CB POS Works Out VAT and SSCL from MRP"*: Backward dual-tax math, IRD tax disclaimer, rounding formulas.
3. *"Shop Story: Perera Grocery"*: Real retail case study with 500 daily slips, ESC/POS printing, and scale barcodes.

- [ ] **Step 2: Author `docs/adr/0002-payment-gateway-feasibility.md`**
Evaluate card payment gateways and LankaQR: fee structures (2.5% - 3.5%), non-profit eligibility in Sri Lanka, security considerations, webhook signature verification.

- [ ] **Step 3: Build content and verify static output**
Run: `bun run build:content`
Expected: `apps/web/.content/blog.json` contains 3+ valid posts.

- [ ] **Step 4: Commit**
```bash
git add apps/web/.content/ scripts/seed.ts docs/adr/
git commit -m "feat(content): add launch blog posts and payment gateway feasibility ADR"
```

---

### Task 8: End-to-End Acceptance Tests & Full Verification Suite (`e2e`)
**Files:**
- Create: `e2e/07-blog.spec.ts`

**Interfaces:**
- Consumes: Playwright, preview server (`http://localhost:8787`).
- Produces: Full E2E verification of AC-10.1 through AC-10.5.

- [ ] **Step 1: Implement `e2e/07-blog.spec.ts`**
Test:
1. S10 blog index renders, tag filtering works without reload (**AC-10.1**).
2. Article renders with custom directives (`:::callout`, `::video`, `:kbd`) and dual-tax math (**AC-10.2**).
3. Missing translation renders English fallback with "Also in English" banner (**AC-10.3**).
4. Admin blog authoring, draft creation, and R2 media upload (**AC-10.4**).
5. RSS feed at `/{locale}/blog/rss.xml` returns valid RSS 2.0 XML (**AC-10.5**).

- [ ] **Step 2: Run Playwright test**
Run: `PW_CHANNEL=chrome bunx playwright test e2e/07-blog.spec.ts`
Expected: 8/8 passed (desktop & mobile).

- [ ] **Step 3: Run full verification suite**
Run:
- `bun run typecheck`
- `bun run lint`
- `bun run test`
- `bun scripts/i18n-check.ts --strict`
- `bun run check:claims`

- [ ] **Step 4: Commit**
```bash
git add e2e/07-blog.spec.ts
git commit -m "test(e2e): add end-to-end acceptance tests for blog and admin authoring"
```

- [ ] **Step 5: Update `docs/07-IMPLEMENTATION_PLAN.md` marking Phase 13 complete**
```bash
git add docs/07-IMPLEMENTATION_PLAN.md
git commit -m "docs: mark Phase 13 (Blog & extras) complete"
```
