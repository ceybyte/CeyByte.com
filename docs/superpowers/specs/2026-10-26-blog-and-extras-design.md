# Phase 13 Design: Blog & Extras (Milestone M3)

## 1. Intent & Purpose
Phase 13 establishes the educational, transparency, and search discovery pillar of CB POS through a full-featured Blog engine (Screen S10), an Admin Blog authoring portal (`/admin/blog`), Markdown video directives (`::video`), per-locale RSS feeds, OpenGraph cards, and foundational launch editorial content.

The primary audience includes:
1. **Sri Lankan Small Shop Owners & Cashiers**: Looking for plain-language operational guidance (dual-tax calculation from MRP, thermal printer setups, weighing scale barcode troubleshooting, and real shop case studies).
2. **Developers, Tech Enablers & Community Donors**: Looking for proof of CB POS's commitment to zero subscriptions, 100% offline data security, and open progress updates.
3. **Staff Administrators**: Authoring, scheduling, and publishing trilingual articles with sandboxed preview and automated Cloudflare Pages/Next.js site rebuilds.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **S10 Public Blog Experience (`/{locale}/blog`, `/{locale}/blog/{slug}`)**:
  - Editorial Magazine Hero & 3-Column Grid matching Screen Blueprint S10.
  - Interactive tag pills: `All`, `Releases`, `Tax`, `Shop stories`, `Hardware`.
  - Reading time calculation with locale-aware divisors (English 200 wpm, Sinhala 150 wpm, Tamil 160 wpm).
  - Trilingual parity and graceful fallback: When an article is not yet translated, display the English article with an *"Also available in English"* banner without mixing languages within the body (`FR-01.5`).
  - Related posts drawer at the end of every article.
  - Per-locale RSS feeds at `/{locale}/blog/rss.xml` generated at build time.
  - Per-article OpenGraph images generated during build with title, tags, and date.
- **Admin Authoring & Moderation (`/admin/blog`)**:
  - List view of articles filtered by status (`draft`, `scheduled`, `published`, `archived`) and locale.
  - In-browser split Markdown editor with live HTML preview.
  - Drag-and-drop R2 media presigning and upload (`cbpos-public/media/blog/...` $\le$ 5 MB image, $\le$ 50 MB video).
  - Draft, schedule with future `publishedAt`, and publish workflows with audit logging in `admin_audit_log`.
- **Markdown Directives Expansion**:
  - Support `::video{src alt}` with mandatory WebVTT (`.vtt`) captions for accessibility.
  - Support `:kbd[F3]` inline keyboard badges and `::screenshot{src alt}`.
- **Launch Content Set**:
  1. *"Why CB POS is Free Forever"*: Transparent founding mission, no subscription traps, offline SQLite data safety, and community donation funding model.
  2. *"How CB POS Works Out VAT and SSCL from MRP"*: Comprehensive breakdown of backward tax extraction for tax-inclusive retail pricing, banker's rounding formulas ([C1], [C2]), with the mandatory IRD disclaimer.
  3. *"Shop Story: Perera Grocery"*: Spotlight on a busy Kandy minimart processing 500+ daily slips with thermal printing and barcode scales.
- **Payment Gateway ADR**:
  - `docs/adr/0002-payment-gateway-feasibility.md`: Architectural evaluation of LankaQR and credit card payment gateway feasibility for future donation channels (fee structures, merchant of record legality, security, webhook verification).

### Non-Goals
- Real-time cloud commenting or user comment accounts on blog posts (avoids moderation burden, zero spam surface).
- In-browser WYSIWYG rich text editor replacing raw Markdown (Markdown + remark AST ensures strict compliance with our design tokens and directive whitelists).
- Direct runtime D1 database querying for public blog readers on Workers (all content is pre-rendered at build time into Next.js static output via `build:content`, adhering to the 10 ms CPU budget and zero database costs on public reads).

### Anti-Goals
- Banned marketing claims: Never claim "100% offline", "cloud backup", "IRD compliant/certified", or use prohibited buzzwords (`seamless`, `revolutionize`, `unlock`, `effortless`).
- Mixed-language articles: Never show half-translated paragraphs in Sinhala or Tamil. If a post is untranslated, show the full English article under an informative locale warning banner.

---

## 3. Architecture & Data Flow

```mermaid
graph TD
    Admin[Admin Author at /admin/blog] -->|Save/Publish| D1[D1: blog_posts]
    Admin -->|Presign Media| R2[R2: cbpos-public/media/blog/...]
    Admin -->|Publish Trigger| Rebuild[GitHub Repository Dispatch / Rebuild Script]
    Rebuild -->|build:content| ContentJSON[apps/web/.content/blog.json]
    ContentJSON -->|Next.js SSG build| Out[apps/web/out]
    Out -->|Deploy| Cloudflare[Cloudflare Pages + CDN]
    Reader[Public Reader at /{locale}/blog] -->|Fast Edge Hit| Cloudflare
```

1. **Content Authoring & Persistence**:
   - Posts are authored in `/admin/blog` and stored in D1's `blog_posts` table.
   - Images and videos are uploaded to R2 via `POST /api/admin/media/presign` under `media/blog/{postId}/...`.
2. **Build-Time Compilation (`scripts/build-content.ts`)**:
   - Extracts all published articles (and scheduled articles where `published_at <= now`).
   - Compiles AST HAST, table of contents (`toc_json`), and reading time.
   - Emits static `apps/web/.content/blog.json`.
3. **Static Generation & SEO**:
   - Next.js statically renders `/{locale}/blog` and `/{locale}/blog/[slug]`.
   - Generates XML RSS feed at `/{locale}/blog/rss.xml`.
   - Generates OpenGraph image previews using Sharp / Satori during `build:og`.

---

## 4. UI Design Specifications

### S10 Blog Index (`/{locale}/blog`)
- **Container**: `max-w-6xl mx-auto px-4 py-12`.
- **Header**:
  - `H1`: "Blog" (`text-3xl font-extrabold text-foreground`).
  - Subtitle: "Release notes in plain language, tax changes explained, and stories from shops using CB POS."
- **Tag Filter Bar**:
  - Horizontal scrollable pills: `All`, `Releases`, `Tax`, `Shop stories`, `Hardware`.
  - Active pill: `border border-cyan-400 bg-cyan-400/10 text-cyan-300 font-semibold`.
  - Inactive pill: `bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200`.
- **Featured Card (Hero)**:
  - Spans full width. 16:9 borderless cover image on left, title, excerpt, and mono metadata on right (`FEATURED · 21 OCT 2026 · 5 MIN READ`).
- **Post Grid**:
  - 3-column responsive grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`).
  - Card style: `bg-zinc-900/60 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition`.
- **"Also in English" Section**:
  - Renders when viewing in Sinhala or Tamil if English articles exist that lack translations.
  - Lists post title with a subtle `[EN]` mono badge.

### S10 Blog Article View (`/{locale}/blog/[slug]`)
- **Reading Column**: Centered column constrained to `max-w-prose` (approx 72 characters) for optimal legibility.
- **Typography & Elements**:
  - Large title in `Geist ExtraBold` (`text-3xl md:text-4xl`).
  - Mono metadata strip: `TAG · DATE · READING TIME`.
  - Borderless 16:9 cover image with `rounded-lg`.
  - Body typography using design token `text-body-lg` (1.125rem, line-height 1.6).
  - Code/Numbers: JetBrains Mono for tax examples, terminal commands, and shortcuts.
  - Pull quotes: `border-l-2 border-cyan-400 pl-4 italic text-zinc-300`.
  - Directives:
    - `:::callout{type=tip|warn|danger|disclaimer}` styled with distinct accent borders.
    - `::video{src alt}` renders `<video>` element with `<track kind="captions">`.
    - `:kbd[F3]` keyboard shortcut styling.
- **Article Footer**:
  - "Related posts" 2-column card strip.
  - Social share links (Copy link, Twitter/X, WhatsApp).

### Admin Blog Portal (`/admin/blog`)
- **Article Management Table**:
  - Search by title/slug, filter by status and locale.
  - Quick action: Edit, Preview, Publish, Delete.
- **Article Editor (`/admin/blog/[id]` or `/admin/blog/new`)**:
  - Meta inputs: Title, slug (auto-slugified from title), excerpt, tags (multi-select/pill), locale, translation key, published at date-time picker.
  - Two-pane split editor: Markdown textarea on left with syntax highlighting shortcuts; live rendered HAST preview on right.
  - Image/Video Dropzone: Uses direct R2 upload via `POST /api/admin/media/presign`.

---

## 5. Technical Contracts & Routes

### Backend Routes (`apps/api`)
- `GET /api/admin/blog/posts`: Paginated list of blog posts with status, locale, and tag filtering.
- `GET /api/admin/blog/posts/:id`: Single post details with raw markdown.
- `POST /api/admin/blog/posts`: Create post (validates slug uniqueness per locale).
- `PUT /api/admin/blog/posts/:id`: Update post and recompute reading time.
- `POST /api/admin/blog/posts/:id/publish`: Transition status to `published` and dispatch site rebuild.
- `POST /api/admin/media/presign`: Generate presigned R2 PUT URL for blog media (JPEG, PNG, WebP $\le$ 5 MB; MP4 $\le$ 50 MB).

### Frontend Routes (`apps/web`)
- `/{locale}/blog`: Blog index page with client-side tag filtering.
- `/{locale}/blog/{slug}`: Article page with SSG dynamic params.
- `/{locale}/blog/rss.xml`: Route handler generating valid RSS 2.0 XML feed.
- `/admin/blog`: Admin blog management list.
- `/admin/blog/[id]`: Admin blog editor.

---

## 6. Verification & Acceptance Criteria
1. **AC-10.1 (S10 Blog Navigation & Tag Filtering)**:
   - Blog index renders in `en`, `si`, and `ta`.
   - Clicking tag pills filters the articles immediately without full-page reloads.
2. **AC-10.2 (Article Reading & Directive Rendering)**:
   - Articles render valid HTML with custom directives (`:::callout`, `::video` with captions, `:kbd`).
   - Dual-tax table displays exact math matching PRD requirements with the IRD disclaimer.
3. **AC-10.3 (Locale Fallback & "Also in English")**:
   - Non-translated articles show English fallback under a clear warning banner.
   - S10 Index shows "Also available in English" section in `si` and `ta`.
4. **AC-10.4 (Admin Authoring & R2 Upload)**:
   - Admin can create, edit, and publish posts in `/admin/blog`.
   - Media presigning uploads valid covers to R2 and attaches key to post record.
5. **AC-10.5 (Feeds & SEO)**:
   - `/{locale}/blog/rss.xml` outputs valid XML matching RSS 2.0 specifications.
   - Each post generates `<meta property="og:image">` and JSON-LD `Article` structured data.
