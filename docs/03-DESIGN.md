# 03 — Design System Specification

| | |
|---|---|
| Version | 1.0 |
| Date | 2026-10-21 |
| Status | Approved for build |
| Implements | `CLAUDE.md §6`, PRD F-01/F-02 |
| Source files | `src/app/globals.css`, `src/components/ui/*`, `src/components/brand/*`, `src/components/motion/*` |

---

## 1. Design principles

1. **Industrial, not decorative.** The site should feel like the inside of a well-built machine: hairline grids, crosshair registration marks, monospace numbers. Every visual element signals precision.
2. **Proof over promise.** Real CB-POS screens, real hashes, real map pins, real counts. If something can't be shown truthfully, it isn't shown.
3. **The download button is the only loud thing.** `#39FF14` is reserved for the primary action, used once per viewport.
4. **Three scripts, one rhythm.** Sinhala and Tamil are first-class. The layout absorbs taller line-heights and longer words without breaking.
5. **Keyboard-first like the product.** Visible focus everywhere, `<kbd>` hints on interactive elements, shortcuts (`⌘K`, `/`, `Esc`).
6. **Motion explains state.** Animation shows what changed (step advanced, offline toggled, tax computed), never only that something exists.

---

## 2. Colour system — the 60-30-10 rule

| Share | Role | Dark (default) | Light |
|---|---|---|---|
| **60%** | Canvas (page background) | `#1E1E1E` | `#F8F9FA` |
| **30%** | Surface (cards, header, inputs) | `#252526` | `#FFFFFF` |
| | Surface elevated (hover, popovers, menus) | `#2D2D30` | `#F1F3F5` |
| | Surface legal (legal pages, disclaimers, footer) | `#18181B` | `#F1F1F3` |
| | Hairline strong (component borders) | `#3E3E42` | `#D0D3D8` |
| | Hairline grid (architectural lines, dividers) | `#333337` | `#E4E6EA` |
| | Text primary | `#FFFFFF` | `#121212` |
| | Text muted | `#AAAAAA` | `#5F6368` |
| **10%** | Primary action fill (Download) | `#39FF14` + text `#121212` bold | `#39FF14` + text `#121212` bold |
| | Electric cyan (focus, links, glow) | `#00BCEB` | fill `#00BCEB` / **text** `#006E8C` |
| | Cyan ambient glow | `rgba(0,188,235,0.15)` | `rgba(0,188,235,0.10)` |
| | Supporter gold | `#FFD700` | fill `#FFD700` / text `#8A6D00` |
| | Warning | `#FFDC00` | fill `#FFDC00` / text `#8A6D00` |
| | Error | `#FF4136` | `#C8211A` |
| | Success (text/icons, non-CTA) | `#39FF14` | `#1E7A0E` |
| — | Keycap (`<kbd>`) background | `#141414` | `#141414` (keycaps stay dark in both themes) |
| — | Mockup backdrop | `#18181B` | `#18181B` (product shots are always on dark) |

### 2.1 Contrast (WCAG 2.2) — verified pairs

| Foreground on background | Ratio | Use |
|---|---|---|
| `#FFFFFF` on `#1E1E1E` | 16.7 : 1 | Body |
| `#AAAAAA` on `#1E1E1E` | 7.2 : 1 | Muted body |
| `#AAAAAA` on `#2D2D30` | 5.9 : 1 | Muted on hover surfaces |
| `#00BCEB` on `#1E1E1E` | 7.4 : 1 | Links (dark) |
| `#FF4136` on `#1E1E1E` | 4.8 : 1 | Error text (dark) |
| `#121212` on `#39FF14` | ≈ 14 : 1 | Primary button |
| `#121212` on `#F8F9FA` | 18 : 1 | Body (light) |
| `#5F6368` on `#F8F9FA` | 5.7 : 1 | Muted (light) |
| `#006E8C` on `#F8F9FA` | 5.5 : 1 | Links (light) |
| `#C8211A` on `#F8F9FA` | 5.4 : 1 | Error (light) |
| `#1E7A0E` on `#F8F9FA` | 5.2 : 1 | Success (light) |

**Forbidden pairs:** `#39FF14`, `#FFDC00`, `#FFD700` or `#00BCEB` as **text** on light backgrounds (all < 3 : 1). In light mode they are fills only, always paired with `#121212` text.

### 2.2 Accent budget per viewport
- `#39FF14`: at most **one** element (the primary CTA). The sticky header CTA hides while the hero CTA is in view (IntersectionObserver).
- `#00BCEB`: focus rings, links, one ambient glow, map pins, small data highlights.
- `#FFD700`: only supporter pins, supporter badges and the donate page's primary button.

---

## 3. Tokens — `src/app/globals.css` (Tailwind v4, CSS-first)

```css
@import "tailwindcss";
@import "tw-animate-css";

/* Dark is the default theme. Light is opt-in via <html data-theme="light">. */
@custom-variant light (&:where([data-theme="light"], [data-theme="light"] *));
@custom-variant dark (&:where(:root:not([data-theme="light"]), :root:not([data-theme="light"]) *));

:root {
  color-scheme: dark;

  /* 60 — canvas */
  --canvas: #1e1e1e;

  /* 30 — structure */
  --surface: #252526;
  --surface-elevated: #2d2d30;
  --surface-legal: #18181b;
  --hairline: #3e3e42;
  --hairline-grid: #333337;
  --text: #ffffff;
  --text-muted: #aaaaaa;
  --text-inverse: #121212;

  /* 10 — accents */
  --primary: #39ff14;
  --primary-hover: #5cff3d;
  --primary-press: #2fd611;
  --primary-foreground: #121212;
  --cyan: #00bceb;
  --cyan-text: #00bceb;
  --glow-cyan: rgba(0, 188, 235, 0.15);
  --gold: #ffd700;
  --gold-text: #ffd700;
  --warning: #ffdc00;
  --warning-text: #ffdc00;
  --error: #ff4136;
  --success: #39ff14;

  /* fixed */
  --kbd-bg: #141414;
  --kbd-border: #3e3e42;
  --mockup-backdrop: #18181b;

  /* radii */
  --radius-none: 0px;
  --radius-sm: 4px;
  --radius-md: 6px;

  /* motion */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-in: cubic-bezier(0.55, 0, 1, 0.45);
  --dur-press: 120ms;
  --dur-hover: 180ms;
  --dur-enter: 240ms;
  --dur-modal: 320ms;
  --dur-reveal: 600ms;

  /* layout */
  --gutter: 16px;
  --content-max: 1280px;
  --header-h: 64px;
  --grid-cell: 64px;
}

@media (min-width: 768px) { :root { --gutter: 24px; } }
@media (min-width: 1280px) { :root { --gutter: 32px; } }

[data-theme="light"] {
  color-scheme: light;
  --canvas: #f8f9fa;
  --surface: #ffffff;
  --surface-elevated: #f1f3f5;
  --surface-legal: #f1f1f3;
  --hairline: #d0d3d8;
  --hairline-grid: #e4e6ea;
  --text: #121212;
  --text-muted: #5f6368;
  --cyan-text: #006e8c;
  --glow-cyan: rgba(0, 188, 235, 0.10);
  --gold-text: #8a6d00;
  --warning-text: #8a6d00;
  --error: #c8211a;
  --success: #1e7a0e;
}

@theme inline {
  /* colours → bg-canvas, text-muted, border-hairline, etc. */
  --color-canvas: var(--canvas);
  --color-surface: var(--surface);
  --color-surface-elevated: var(--surface-elevated);
  --color-surface-legal: var(--surface-legal);
  --color-hairline: var(--hairline);
  --color-hairline-grid: var(--hairline-grid);
  --color-text: var(--text);
  --color-muted: var(--text-muted);
  --color-inverse: var(--text-inverse);
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-primary-press: var(--primary-press);
  --color-primary-foreground: var(--primary-foreground);
  --color-cyan: var(--cyan);
  --color-cyan-text: var(--cyan-text);
  --color-gold: var(--gold);
  --color-gold-text: var(--gold-text);
  --color-warning: var(--warning);
  --color-warning-text: var(--warning-text);
  --color-error: var(--error);
  --color-success: var(--success);
  --color-kbd: var(--kbd-bg);

  /* shadcn compatibility aliases */
  --color-background: var(--canvas);
  --color-foreground: var(--text);
  --color-card: var(--surface);
  --color-card-foreground: var(--text);
  --color-popover: var(--surface-elevated);
  --color-popover-foreground: var(--text);
  --color-secondary: var(--surface-elevated);
  --color-secondary-foreground: var(--text);
  --color-muted-foreground: var(--text-muted);
  --color-accent: var(--surface-elevated);
  --color-accent-foreground: var(--text);
  --color-destructive: var(--error);
  --color-border: var(--hairline);
  --color-input: var(--hairline);
  --color-ring: var(--cyan);

  /* type */
  --font-display: var(--font-geist), var(--font-noto-sinhala), var(--font-noto-tamil), ui-sans-serif, system-ui, sans-serif;
  --font-sans: var(--font-inter), var(--font-noto-sinhala), var(--font-noto-tamil), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, "Cascadia Mono", Consolas, monospace;

  /* radii (only these exist) */
  --radius-none: 0px;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-full: 9999px;

  /* motion */
  --ease-out: var(--ease-out);
  --ease-in-out: var(--ease-in-out);
  --animate-pulse-dot: pulse-dot 2s var(--ease-in-out) infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 188, 235, 0.55); }
  50%      { opacity: 0.85; transform: scale(0.92); box-shadow: 0 0 0 6px rgba(0, 188, 235, 0); }
}

@layer base {
  html { background: var(--canvas); color: var(--text); }
  body { @apply font-sans antialiased bg-canvas text-text; text-rendering: optimizeLegibility; }
  :focus-visible { outline: 2px solid var(--cyan); outline-offset: 2px; border-radius: var(--radius-sm); }
  ::selection { background: var(--cyan); color: var(--text-inverse); }
  .num, kbd, code, pre { font-variant-numeric: tabular-nums slashed-zero; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Theme switching:** `next-themes` with `attribute="data-theme"`, `defaultTheme="dark"`, `enableSystem={false}`, `themes={["dark","light"]}`, storage key `cb_theme`. An inline script prevents a flash of the wrong theme. The toggle lives in the header (icon button, `Sun`/`Moon`) and the footer.

**Lint:** `eslint-plugin-tailwindcss` + a custom rule `no-raw-color` reject `#hex`, `rgb(`, `hsl(`, `oklch(` and arbitrary colour classes (`bg-[…]`) outside `globals.css`.

---

## 4. Typography

### 4.1 Families (`src/app/[locale]/layout.tsx`)

```ts
import { Geist, Inter, JetBrains_Mono, Noto_Sans_Sinhala, Noto_Sans_Tamil } from "next/font/google";

const geist = Geist({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-geist", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-jetbrains-mono", display: "swap" });
const sinhala = Noto_Sans_Sinhala({ subsets: ["sinhala"], weight: ["400", "500", "600", "700"], variable: "--font-noto-sinhala", display: "swap", preload: false });
const tamil = Noto_Sans_Tamil({ subsets: ["tamil"], weight: ["400", "500", "600", "700"], variable: "--font-noto-tamil", display: "swap", preload: false });
// Preload only the active locale's script font: set preload: locale === "si" for sinhala, etc.
```

| Role | Family | Weights |
|---|---|---|
| Display / headlines | **Geist** (fallback choice: Space Grotesk; pick one, never both) | 800 (ExtraBold), 700 |
| Body / UI | **Inter** | 400, 500, 600 |
| Sinhala | **Noto Sans Sinhala** | 400–700 |
| Tamil | **Noto Sans Tamil** | 400–700 |
| Numbers, prices, tax maths, hashes, versions, `<kbd>` | **JetBrains Mono** | 400, 500, 700 |

### 4.2 Type scale (Latin)

| Token | Size | Line-height | Weight | Tracking | Family | Use |
|---|---|---|---|---|---|---|
| `text-display` | `clamp(2.75rem, 1.6rem + 5vw, 5.5rem)` | 1.0 | 800 | -0.025em | display | Hero H1 |
| `text-h1` | `clamp(2.25rem, 1.5rem + 3vw, 3.75rem)` | 1.05 | 800 | -0.025em | display | Page titles |
| `text-h2` | `clamp(1.75rem, 1.3rem + 2vw, 2.75rem)` | 1.1 | 800 | -0.025em | display | Section titles |
| `text-h3` | `1.5rem` | 1.2 | 700 | -0.015em | display | Card titles |
| `text-h4` | `1.25rem` | 1.3 | 700 | -0.01em | display | Sub-heads |
| `text-lead` | `1.25rem` | 1.55 | 400 | 0 | sans | Hero subhead |
| `text-body-lg` | `1.125rem` | 1.6 | 400 | 0 | sans | Long-form docs/blog |
| `text-body` | `1rem` | 1.6 | 400 | 0 | sans | Default |
| `text-sm` | `0.875rem` | 1.5 | 400/500 | 0 | sans | UI, labels |
| `text-xs` | `0.75rem` | 1.4 | 500 | 0 | sans | Helper text |
| `text-eyebrow` | `0.75rem` | 1.2 | 500 | 0.12em, UPPERCASE | mono | Section labels `01 / PROBLEM` |
| `text-stat` | `clamp(2rem, 1.4rem + 2.5vw, 3.5rem)` | 1.0 | 700 | -0.02em | mono | Telemetry numbers |
| `text-price` | inherit | inherit | 500 | 0 | mono | `Rs. 1,250.00` |
| `text-hash` | `0.8125rem` | 1.5 | 400 | 0 | mono, `break-all` | SHA-256 |

Defined as Tailwind v4 utilities in `globals.css`:

```css
@utility text-display { font-family: var(--font-display); font-size: clamp(2.75rem, 1.6rem + 5vw, 5.5rem); line-height: 1; font-weight: 800; letter-spacing: -0.025em; text-wrap: balance; }
@utility text-h1      { font-family: var(--font-display); font-size: clamp(2.25rem, 1.5rem + 3vw, 3.75rem); line-height: 1.05; font-weight: 800; letter-spacing: -0.025em; text-wrap: balance; }
@utility text-h2      { font-family: var(--font-display); font-size: clamp(1.75rem, 1.3rem + 2vw, 2.75rem); line-height: 1.1; font-weight: 800; letter-spacing: -0.025em; text-wrap: balance; }
@utility text-h3      { font-family: var(--font-display); font-size: 1.5rem; line-height: 1.2; font-weight: 700; letter-spacing: -0.015em; }
@utility text-h4      { font-family: var(--font-display); font-size: 1.25rem; line-height: 1.3; font-weight: 700; letter-spacing: -0.01em; }
@utility text-lead    { font-size: 1.25rem; line-height: 1.55; }
@utility text-eyebrow { font-family: var(--font-mono); font-size: 0.75rem; line-height: 1.2; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; }
@utility text-stat    { font-family: var(--font-mono); font-size: clamp(2rem, 1.4rem + 2.5vw, 3.5rem); line-height: 1; font-weight: 700; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
@utility text-hash    { font-family: var(--font-mono); font-size: 0.8125rem; line-height: 1.5; word-break: break-all; }
```

### 4.3 Sinhala & Tamil script rules (mandatory, global)

Sinhala and Tamil vowel signs (e.g. Sinhala `ු ූ ෘ ෲ ි ී`, Tamil `ீ ு ூ`) extend above and below the Latin x-height band. Tight Latin line-heights clip them inside buttons, inputs and accordions.

Rules, applied once in `globals.css` and never per component:

```css
:lang(si), :lang(ta) {
  --lh-scale: 1.15;              /* +15% line-height */
  letter-spacing: 0 !important;  /* negative tracking breaks conjuncts and ligatures */
  text-transform: none !important;
}
:lang(si) { font-family: var(--font-noto-sinhala), var(--font-inter), sans-serif; }
:lang(ta) { font-family: var(--font-noto-tamil), var(--font-inter), sans-serif; }

/* Headlines: Geist has no Indic glyphs → Noto, one weight step lighter */
:lang(si) :is(.text-display, .text-h1, .text-h2),
:lang(ta) :is(.text-display, .text-h1, .text-h2) { font-weight: 700; line-height: calc(1.1 * var(--lh-scale)); }
:lang(si) :is(.text-h3, .text-h4, b, strong, th),
:lang(ta) :is(.text-h3, .text-h4, b, strong, th) { font-weight: 600; line-height: calc(1.25 * var(--lh-scale)); }
:lang(si) :is(p, li, label, input, textarea, select, button, td, .text-body, .text-body-lg, .text-sm),
:lang(ta) :is(p, li, label, input, textarea, select, button, td, .text-body, .text-body-lg, .text-sm) { line-height: calc(1.6 * var(--lh-scale)); }

/* Tamil words run long: scale display sizes down so headlines wrap in 2–3 lines */
:lang(ta) .text-display { font-size: clamp(2.25rem, 1.4rem + 3.8vw, 4.5rem); }
:lang(ta) .text-h1      { font-size: clamp(1.9rem, 1.3rem + 2.4vw, 3.1rem); }
:lang(ta) :is(h1, h2, h3, .card-title) { overflow-wrap: anywhere; hyphens: none; }

/* Eyebrows, numbers, prices, kbd and hashes stay Latin mono in every locale */
:lang(si) :is(.text-eyebrow, .text-stat, .text-hash, .num, kbd, code),
:lang(ta) :is(.text-eyebrow, .text-stat, .text-hash, .num, kbd, code) { font-family: var(--font-mono); line-height: normal; }
```

**Weight-step rule:** headings step down 800→700 and 700→600; emphasis steps 600→500. **Body text stays at 400 (floor).** Noto Sans Sinhala/Tamil at 300 loses stroke contrast on the low-DPI Windows monitors and budget Android phones our users have. This is a deliberate exception to "one step lighter".

**Component implications**
- Buttons, inputs and selects use `min-height` with vertical padding, never a fixed `height` with `line-height: 1`. Height: md 40px → `min-h-10 py-2`.
- Accordion triggers, tabs and badges: `py-2` minimum. Badges in `si`/`ta` get `py-1` instead of `py-0.5`.
- Never truncate Sinhala/Tamil headings with `line-clamp-1`. Use `line-clamp-2` minimum for card titles.
- `font-synthesis: none` globally, so the browser never fakes bold Indic glyphs.
- Keep CB-POS glossary terms (`CB-POS`, `VAT`, `SSCL`, `MRP`, `.EXE`) in Latin within `si`/`ta` sentences. Wrap them in `<span lang="en">` so they get Latin metrics.

---

## 5. Layout, spacing & the architectural grid

### 5.1 Spacing
4px base. The allowed Tailwind steps are `0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32` (2px–128px). Section vertical padding: `py-20` mobile → `py-32` desktop.

### 5.2 Grid
- Container: `max-w-[var(--content-max)] mx-auto px-[var(--gutter)]`.
- 12 columns, `gap-6` (desktop) / 4 columns `gap-4` (mobile).
- Breakpoints (Tailwind v4 defaults): `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`. The design is checked at 360, 390, 768, 1024, 1280 and 1440.

### 5.3 Architectural grid canvas (`<GridCanvas />`)
- A full-bleed background behind sections: 1px `--hairline-grid` lines every `--grid-cell` (64px), drawn with CSS `background-image: linear-gradient(...)`, masked with a radial fade (`mask-image: radial-gradient(ellipse at center, #000 40%, transparent 85%)`).
- **Crosshairs (`<Crosshair />`):** 9×9 px `+` glyphs (1px strokes, `--hairline`) placed at section corners and card-grid intersections, absolutely positioned at the line crossings. Max 4 per section.
- **Section rules:** each section starts with a full-width 1px top border (`--hairline-grid`) and an eyebrow label at the left edge: `01 / PROBLEM` (mono).
- **Ambient glow:** one `radial-gradient(600px circle at var(--x) var(--y), var(--glow-cyan), transparent 70%)` per page, behind the hero mockup. On the final banner it follows the pointer (desktop only).

### 5.4 Radius & elevation
- Radius: `0` (sections, grid tiles, bento outer frame), `4px` (buttons, inputs, kbd, badges), `6px` (cards, dialogs, sheets top corners, map popups), `full` (status dots, pills, avatar).
- **No drop shadows.** Depth comes from surface steps (`surface` → `surface-elevated`) and hairlines.
- Exceptions:
  - focus ring
  - mockup rim glow: `box-shadow: 0 0 0 1px rgba(0,188,235,.35), 0 30px 120px -40px rgba(0,188,235,.45)`
  - dialog backdrop: `rgba(0,0,0,.6)` + `backdrop-filter: blur(2px)` (the only blur allowed)

---

## 6. Iconography & imagery

### 6.1 Icons
Lucide React, `strokeWidth={1.5}`, sizes 16 (inline), 20 (buttons), 24 (cards). Colour inherits `currentColor`. Feature mapping:

| Concept | Icon |
|---|---|
| Download | `Download` |
| Keyboard cashiering | `Keyboard` |
| Offline SQLite | `WifiOff`, `Database` |
| Dual-tax engine | `Percent`, `Calculator` |
| Hardware hub | `Printer`, `ScanBarcode`, `Scale`, `Usb` |
| Trilingual receipts | `Languages`, `ReceiptText` |
| Weighing & backups | `Scale`, `ArchiveRestore`, `ShieldCheck` |
| Cloud Sync (optional) | `RefreshCw`, `Server` |
| Map | `MapPin`, `Map` |
| Supporter | `Award` (gold) |
| Docs | `BookOpen`, `Search` |
| Feedback | `Bug`, `Lightbulb`, `MessageSquare` |
| Legal | `Scale`, `FileText` |
| Location detect | `LocateFixed` |
| Hash / verify | `Fingerprint`, `Copy`, `Check` |

### 6.2 Product photography & mockups
- **Backdrop:** `#18181B` studio black, seamless, no horizon line.
- **Content:** real CB-POS screens (billing screen with Sri Lankan items such as "Samba Rice 5kg", "Anchor Milk Powder 400g", "Sunlight Soap"; Rs. prices; VAT/SSCL lines; Sinhala and Tamil receipts).
- **Treatment:** borderless screens floating at a slight isometric angle (rotateX 8°, rotateY −12° for the hero), cyan rim glow, no device frames, no browser chrome, no reflections, no gradient overlays.
- **Hardware shots:** a real 80mm thermal printer, barcode scanner and digital scale, photographed on the same backdrop with a single cyan rim light. If no real photos exist, use a Hairline wireframe illustration (§10) instead. Never stock photos.
- **Formats:** AVIF + WebP fallback, pre-sized at build (`640/960/1280/1920`). Hero poster ≤ 120 KB.
- **Alt text:** describes the actual screen ("CB-POS billing screen showing 1.250 kg Samba rice, VAT Rs. 45.76"), translated per locale.

---

## 7. Brand elements

### 7.1 Logo — `<Logo />` (`src/components/brand/logo.tsx`)
- Wordmark: `[CB-POS]` in JetBrains Mono 700, brackets in `--text-muted`, letters in `--text`.
- Status dot: 8×8 px `--cyan` circle, top-right of the closing bracket (offset −2px), `animate-pulse-dot`. The pulse stops under reduced motion.
- Sizes: `sm` (16px text, header mobile), `md` (20px, header), `lg` (32px, footer).
- Clear space: one bracket width on all sides. Never recolour the dot green or gold.
- Accessible name: `aria-label="CB-POS home"`. The dot is `aria-hidden`.

### 7.2 Keycap — `<Kbd />`
- `font-mono text-xs font-medium`, `bg-kbd text-white`, `border border-[--kbd-border]`, `rounded-sm`, `px-1.5 min-h-6`, bottom inset `box-shadow: inset 0 -2px 0 #000` (the single allowed inset, giving a keycap feel).
- Active state (key pressed, or matching keyboard input in the bento demo): `translateY(1px)`, inset shadow removed, cyan 1px border.
- Combos: `<Kbd>Ctrl</Kbd>+<Kbd>K</Kbd>`. `⌘` is shown on macOS (detected via `navigator.userAgentData?.platform`), `Ctrl` elsewhere.

### 7.3 Hash block — `<HashBlock />`
- Label (`SHA-256 · CB-POS-Setup-1.4.2.exe`) as an eyebrow, the hash in `text-hash`, a copy button (`Copy` → `Check` for 1.5 s; announced via `aria-live="polite"`: "Hash copied").
- Surface: `surface` with a hairline border, `rounded-sm`, `p-3`.

---

## 8. Component blueprints

Each component's file, variants, states, and the rules it has to follow. shadcn components are generated with `pnpm dlx shadcn@latest add <name>` and then adapted to these tokens.

### 8.1 Button — `components/ui/button.tsx`

| Variant | Fill | Text | Border | Hover | Press |
|---|---|---|---|---|---|
| `primary` | `--primary` | `--primary-foreground`, **700** | none | `--primary-hover` | `--primary-press`, `scale(.97)` |
| `secondary` | `--surface` | `--text` | `--hairline` | `surface-elevated`, border `--cyan` at 40% | `scale(.98)` |
| `ghost` | transparent | `--text` | none | `surface-elevated` | `scale(.98)` |
| `link` | transparent | `--cyan-text` | none | underline (offset 4px) | — |
| `destructive` | transparent | `--error` | `--error` | fill `--error`, text white | `scale(.98)` |
| `gold` (donate page primary only) | `--gold` | `#121212` | none | brightness 1.05 | `scale(.97)` |

Sizes: `sm` (min-h 32, px-3, text-sm), `md` (min-h 40, px-4), `lg` (min-h 48, px-6, text-base), `xl` (min-h 56, px-8, text-lg, hero only). Mobile tap targets are ≥ 44px.

Props: `asChild`, `loading` (spinner replaces the leading icon, keeps width, `aria-busy`), `kbd` (optional shortcut hint rendered as `<Kbd>` at the trailing edge, hidden < md).

The primary Download button pattern: `[⬇ Download CB-POS — Free]` with a subtext line under it (outside the button): `Windows 10/11 · 64-bit · v1.4.2 · 80.3 MB` in `text-xs text-muted font-mono`.

### 8.2 Form controls
- **Input/Textarea/Select:** `bg-surface border-hairline rounded-sm min-h-10 px-3 py-2`. Focus: `border-cyan` + focus ring. Invalid: `border-error` + an error message below (`text-xs text-error`, with an `AlertCircle` 14px icon), linked via `aria-describedby`.
- **Label:** above the field, `text-sm font-medium`. Required fields get no asterisk; optional fields get a "(optional)" suffix in muted.
- **PhoneInput (`+94`):** a fixed, non-editable prefix segment `+94` (mono, `surface-elevated`, left-rounded) plus a 9-digit input (`inputMode="numeric"`, `autoComplete="tel-national"`). Paste of `07X…`, `+947X…` or `947X…` is normalised. Live format: `77 123 4567`.
- **Select (district/city):** Radix Select. District is a long list (25), so use type-ahead. City uses a combobox (cmdk) with a free-text fallback ("Use '{typed}'").
- **Checkbox:** 18px, `rounded-sm`, checked fill `--cyan` with a `#121212` check. The label is clickable and wraps.
- **Dropzone (`<FileDrop />`):** a dashed `--hairline` 1px border, `rounded-md`, `min-h-36`. States: idle (icon + "Drop slip here or browse" + "JPG, PNG or PDF · max 5 MB"), drag-over (border `--cyan`, glow), uploading (progress bar 2px `--cyan` + percentage in mono), done (file chip + "Replace"), error (border `--error` + message). Keyboard: Enter/Space opens the picker.

### 8.3 Card & BentoCard
- **Card:** `bg-surface border border-hairline rounded-md p-6`. Hover (if interactive): `bg-surface-elevated`, border `--hairline` → `rgba(0,188,235,.4)`, 180 ms.
- **BentoCard:** inside a bento frame with shared 1px gridlines (cards sit edge-to-edge, separated by hairlines, with `rounded-none` inner corners and a `rounded-md` outer frame). Slots: eyebrow (`02 / OFFLINE`), title (`text-h3`), one-line description (muted), interactive demo area (`min-h-48`), optional `<Kbd>` hints. Grid: desktop 3×2 with Keyboard and Dual-Tax spanning 2 columns (layout in `06 §3.4`). Mobile: single column.

### 8.4 StatTile (telemetry strip)
- Number in `text-stat` (mono), label in `text-eyebrow` muted, divided by vertical hairlines. Desktop: 4 tiles in a row plus a map teaser. Mobile: a 2×2 grid, then the teaser.
- Count-up on first view (§9.2). Under reduced motion, the final value shows immediately.

### 8.5 Badge
| Variant | Style |
|---|---|
| `supporter` | `bg-gold/10 text-gold-text border border-gold/40` + `Award` 12px icon, label "Gold Supporter" |
| `status-*` (tickets) | Neutral surface + 6px coloured dot: open `--cyan`, triaged `--text-muted`, planned `--warning`, in_progress `--cyan`, shipped `--success`, closed/wont_fix `--text-muted`, duplicate `--text-muted` |
| `version` | mono `v1.4+`, hairline border |
| `locale` | mono `EN` / `SI` / `TA`, for fallback search results |

### 8.6 Callout (docs/legal)
`border-l-2` with a variant colour, `bg-surface`, `p-4`, icon + title + body. Variants: `tip` (cyan), `warn` (warning), `danger` (error), `tax` (warning + fixed copy + disclaimer link).

### 8.7 Accordion (FAQ)
Radix Accordion, `type="single" collapsible`. Trigger: `text-h4` (si/ta: line-height scaled), `py-5`, with a `Plus` icon that rotates 45° to an ×. Items are separated by hairlines. Content animates with `grid-template-rows: 0fr → 1fr` (220 ms ease-out) so there's no height measurement. FAQ structured data (`FAQPage`) is emitted from the same data.

### 8.8 DownloadModal (responsive dialog/drawer)
- `≥ md`: Radix Dialog. `max-w-[560px]`, `bg-surface border-hairline rounded-md`, header with a step indicator (`1 / 2` mono plus a 2-segment progress bar in cyan), close `X` (Esc).
- `< md`: Vaul `Drawer` with `snapPoints={[0.92]}`, a drag handle (36×4 px `--hairline`, rounded-full), `data-lenis-prevent` on the scroll body, and inputs that scroll into view above the keyboard (`scrollIntoView({ block: "center" })` on focus).
- Body slots: `StepYourShop`, `StepLocation`, `WhatNext`. The modal container keeps a stable `layoutId="download-modal"`, so the morph into What Next animates size (§9.3).
- Footer: secondary "Back" (step 2), primary "Continue" (step 1) / "Download CB-POS" (step 2). The primary is disabled until the form is valid, with the reason shown in a muted helper line, not as a tooltip.
- Mini-map (step 2): a 100% × 200px MapLibre instance (lazy) with a single draggable cyan pin, bounds locked. A "Detect my location" button sits above it (`LocateFixed` icon, secondary). If WebGL is unavailable, the map is hidden and the fields still work.

### 8.9 Map elements
- **Pin (standard):** a 10px circle `--cyan` with a 2px `--canvas` stroke and a halo (`circle-blur` 0.6, radius 18, opacity 0.25).
- **Pin (supporter):** a 12px circle `--gold`, with a gold halo.
- **Cluster:** a circle with a radius stepped by count (18 / 24 / 32 px at <10 / <100 / ≥100), `--surface-elevated` fill, 1px `--cyan` stroke, count label in JetBrains Mono 12px `--text`. If `supporters > 0`, the stroke becomes 2px `--gold`.
- **Popup:** `bg-surface border-hairline rounded-md p-4 w-64`. Content order: shop name (`text-h4`), category · city (muted), "CB-POS user since Aug 2026" (mono xs), Supporter badge, "Get directions →" link.
- **Map chrome:** zoom controls restyled (`surface`, hairline, 32px), attribution kept and legible (`text-xs muted`), and a compass hidden (no rotation: `dragRotate: false`, `pitchWithRotate: false`).

### 8.10 Header & footer
- **Header:** sticky, `h-[--header-h]`, `bg-canvas/80` + `backdrop-blur-sm` once the page has scrolled past 8px (otherwise transparent), with a bottom hairline. Left: Logo. Centre (lg+): Product, Map, Docs, Releases, Donate. Right: language switcher (`EN · සිං · தமி` compact; full names in the menu), theme toggle, Download (primary sm, hidden while the hero CTA is visible). Mobile: a hamburger opens a Vaul sheet from the top.
- **Footer (architectural):** `bg-surface-legal`, a 4-column hairline grid with crosshairs at the intersections:
  1. Logo + one-line mission + version/status line ("Latest: v1.4.2 · stable")
  2. Product: Download, Releases, Docs, Shortcuts
  3. Community: Map, Feedback, Donate, WhatsApp, Blog
  4. Legal: Terms, Privacy, Tax disclaimer, Data safety, Cookies

  The bottom bar holds "© 2026 Ceybyte · Made in Sri Lanka", the language switcher, the theme toggle, and the mono build hash.

### 8.11 Toasts
`sonner` via the shadcn `Sonner` component. Bottom-right on desktop, top on mobile. `surface-elevated` + hairline, `rounded-md`, max 1 visible. Only for confirmations after actions (copied, saved, vote counted). Never for errors that need a fix; those stay inline.

### 8.12 Data table (admin)
Plain shadcn `Table`: sticky header, row height 44px, zebra off, hover `surface-elevated`, selected row with a cyan left border 2px. Numbers right-aligned in mono. Keyboard row focus (`j/k`), rendered as `aria-rowindex`.

### 8.13 Skeletons & empty states
- **Skeleton:** `bg-surface-elevated` blocks with a 1.2 s opacity pulse (0.5↔1), never a shimmer gradient.
- **Empty states:** a Hairline line illustration (small), a one-line statement, and one action. Example: "No tickets match these filters." + "Clear filters".

---

## 9. Motion system

### 9.1 Tokens (`src/components/motion/tokens.ts`)

```ts
export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  in: [0.55, 0, 1, 0.45],
} as const;

export const dur = { press: 0.12, hover: 0.18, enter: 0.24, modal: 0.32, reveal: 0.6 } as const;

export const spring = {
  snappy: { type: "spring", stiffness: 520, damping: 36, mass: 0.8 }, // buttons, toggles, kbd
  modal:  { type: "spring", stiffness: 380, damping: 34 },            // dialog/drawer, layout morphs
  gentle: { type: "spring", stiffness: 170, damping: 26 },            // cards, pins
  number: { type: "spring", stiffness: 90,  damping: 20 },            // count-up tickers
} as const;
```

Rules (following the `emilkowalski/skills` guidance in `CLAUDE.md §7`):
- Enter with `ease.out`, exit faster than enter (×0.75), and never use `ease-in` for anything the user waits on.
- Only `transform`, `opacity`, `clip-path` and `filter: blur()` (≤ 4px, entrances only).
- Interruptible: use springs for anything the user can reverse mid-way (hover, toggles, the drawer).
- Stagger ≤ 40 ms per child, max 6 children staggered. The rest appear together.
- Nothing animates on every scroll frame except the defined GSAP scrubs (§9.4).

### 9.2 Motion (Framer Motion) specs

| Element | Trigger | Animation |
|---|---|---|
| Section reveal | 20% in view, once | `opacity 0→1`, `y 16→0`, `dur.reveal`, `ease.out`; children stagger 40 ms |
| Primary button | hover / press | hover: `y −1`, `spring.snappy`. Press: `scale .97`, `dur.press` |
| Bento card | hover/focus-within | Border colour to cyan 40% (CSS 180 ms). Demo area starts its interaction. No card lift |
| Kbd | matching key down | `y 1`, border cyan, `spring.snappy`. Release returns |
| Telemetry numbers | in view, once | `useSpring(spring.number)` from 0 to the value, displayed with `Intl.NumberFormat`. Done in ≤ 900 ms |
| Offline toggle (bento) | click/Space | Wi-Fi icon swaps with a `scale .8→1` crossfade. The bill list keeps adding items (a new item every 700 ms, `layout` animation) to prove billing continues. Switching back on shows a small `RefreshCw` → `Check` "Synced" chip (cyan, 600 ms) for the optional Cloud Sync |
| Dual-tax calculator | input change | Base/VAT values crossfade digits (each digit `y ±6`, 140 ms), mono |
| Receipt language tabs | tab change | Receipt paper `clipPath: inset(0 0 100% 0) → inset(0)` 320 ms, like a printer feed |
| Weighing scale | in view | Readout ticks `0.000 → 1.250 kg` over 800 ms with 3 overshoots settling (`spring.gentle`) |
| FAQ accordion | open/close | CSS grid-rows 220 ms + Plus icon rotate 45° (`spring.snappy`) |
| Download gate step change | Continue/Back | Direction-aware: next = `x 24→0, opacity 0→1`; back = `x −24→0`. `AnimatePresence mode="popLayout"`, 240 ms |
| Gate → What Next | submit success | Container `layout` (`spring.modal`) resizes. Content crossfades. A Rive `success_check` plays once |
| Dialog open | open | Overlay opacity 0→1 (180 ms). Panel `scale .96→1, opacity, y 8→0` (`spring.modal`). Close is 75% duration |
| Vaul drawer | — | Use Vaul's built-in physics. Don't override |
| Map pin (new from live update) | data diff | `scale 0→1` via MapLibre `circle-radius` transition 300 ms |
| Toast | in/out | Sonner defaults with our durations |
| Theme toggle | click | Icon rotate 90° + crossfade. The page colours switch instantly (no full-page colour transition) |

Shared pattern (`src/components/motion/reveal.tsx`):

```tsx
"use client";
import { motion, useReducedMotion } from "motion/react";
import { dur, ease } from "./tokens";

export function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduce ? 0.01 : dur.reveal, ease: ease.out, delay }}
    >
      {children}
    </motion.div>
  );
}
```

`<MotionConfig reducedMotion="user">` wraps the app.

### 9.3 Layout morph (DownloadModal)
- The dialog panel is a `motion.div` with `layout` and `layoutId="download-modal"`. Step content sits in an inner `AnimatePresence`.
- On success, the inner content switches to `<WhatNext />`. The panel animates its height and width with `spring.modal`. Text inside uses `layout="position"` to avoid stretching.

### 9.4 GSAP + Lenis (scroll layer)

Loaded only on the homepage and only on `(hover: hover) and (pointer: fine)` devices without reduced motion (`src/components/motion/smooth-scroll.tsx`, dynamic import).

```ts
const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```

- Anchor links use `lenis.scrollTo(target, { offset: -64, duration: 1.0 })`.
- Elements with `data-lenis-prevent` (dialog bodies, Vaul sheets, map, docs sidebar, code blocks) keep native scroll.
- Lenis is paused while the DownloadModal or any sheet is open (`lenis.stop()` on open, `lenis.start()` on close).

| Section | ScrollTrigger | Effect |
|---|---|---|
| Hero | `trigger: hero, start: top top, end: bottom top, scrub: 0.6` | Mockup `y: 0 → −60`, `rotateX: 8 → 2` (it settles flat as you scroll). Grid canvas `y: 0 → 30` (slower than content, for depth) |
| Section eyebrows | `start: top 80%`, once | The hairline next to the eyebrow draws `scaleX 0 → 1` (origin left), 600 ms |
| Problem | `start: top 70%, end: bottom 60%, scrub: true` | Three problem cards: a red `--error` 1px "fault line" draws across each card in turn (clip-path) |
| How It Works | `start: top 60%, end: bottom 70%, scrub: 0.5` | A vertical (mobile) / horizontal (desktop) progress hairline fills cyan through steps 1→3. Each step's number goes from muted to `--text` as it's reached |
| Final banner | — | Pointer-follow glow (Motion `useMotionValue`, not GSAP) on desktop |

No pinning longer than 1 viewport, and no scroll snapping.

### 9.5 Rive

Runtime: `@rive-app/react-canvas` with self-hosted WASM (`/rive/rive.wasm`), loaded after `requestIdleCallback` and in-view. Each `.riv` file ≤ 150 KB. Every Rive asset has a static poster (AVIF) shown until it loads and under reduced motion.

| File | Artboard | State machine | Inputs | Behaviour |
|---|---|---|---|---|
| `hero-pos.riv` | `Terminal` | `HeroSM` | `hover: boolean`, `scan: trigger`, `lang: number (0 en, 1 si, 2 ta)` | An isometric CB-POS terminal. Idle: the cursor blinks on the billing screen. `scan` adds an item line and the total ticks up. `hover` brightens the rim light. `lang` changes the receipt language |
| `bento-offline.riv` | `Offline` | `OfflineSM` | `online: boolean` | A Wi-Fi glyph and router LED. With `online=false`, the LED goes red and the bill keeps printing |
| `bento-receipt.riv` | `Receipt` | `ReceiptSM` | `lang: number` | Thermal printer feeding the receipt in EN/SI/TA (the text is baked from real CB-POS receipts) |
| `success-check.riv` | `Check` | `CheckSM` | `play: trigger` | 600 ms check draw for "Download started" |

The client wires `hero-pos` `lang` to the current locale. `scan` fires every 4 s while the hero is in view, and pauses when the tab is hidden.

### 9.6 Hairline isometric figures

**Package:** `@lucasmarkes/hairline`, for pointer-reactive isometric wireframes. **Phase 1 gate:** verify the package exists on npm, check its licence, bundle size and maintenance, and record the result in ADR-0007. If it fails the check, use the fallback below. The usage spec is the same either way.

**Usage**

| Place | Figure | Pointer reaction |
|---|---|---|
| Hero background (behind the mockup, right side) | Isometric wireframe of a POS counter: terminal, printer, scale, cash drawer | Tilt ±6° following the pointer (spring.gentle), lines `--hairline-grid`; nodes at intersections glow cyan within 120px of the pointer |
| How It Works steps | 3 small figures: installer box, wizard window, plugged printer | Tilt ±4° on card hover/focus |
| Empty states, 404 | A single object wireframe (open drawer / unplugged cable) | None |

**Fallback implementation:** inline SVG paths drawn in an isometric projection (30°). A `motion.svg` with `rotateX/rotateY` driven by `useMotionValue` from `pointermove` (throttled with rAF). Strokes `vector-effect: non-scaling-stroke` at 1px. Under reduced motion the figure is static. On touch devices it reacts to `deviceorientation` only if permission is already granted (never prompt).

### 9.7 Reduced motion matrix

| Feature | Full motion | `prefers-reduced-motion: reduce` |
|---|---|---|
| Lenis | on (fine pointer) | off |
| GSAP scrubs/parallax | on | off. Final states are rendered |
| Section reveals | y + opacity | opacity only, 0.01 s |
| Rive | autoplay in view | poster image. Plays on explicit click only |
| Hairline pointer tilt | on | off |
| Number tickers | count-up | final value |
| Logo pulse dot | pulse | static dot |
| Modal / drawer | springs | opacity only, 120 ms |
| Map flyTo | animated | `jumpTo` |

---

## 10. Accessibility checklist (design-level)

- Focus: a 2px cyan outline with 2px offset on every interactive element, never removed. On primary green buttons, the ring goes `--text` (white in dark, `#121212` in light) so it's visible against green.
- Tap targets ≥ 44×44 on touch. Inline links are excluded but get `py-1`.
- Each page has a skip link ("Skip to content", "Skip to map results" on `/map`).
- Colour is never the only signal: status dots carry text labels, and supporter pins have an icon and a badge in popups and lists.
- Forms: errors are announced via `aria-live="assertive"` on submit with a summary at the top of the step that links to the fields.
- Language: `lang` on `<html>`, plus `lang="en"` on glossary spans inside `si`/`ta` text.
- Motion: §9.7.
- Contrast: §2.1.

---

## 11. Voice in the UI

Bold, direct, engineering-confident, zero fluff. Short sentences. Numbers before adjectives.

| Avoid | Use |
|---|---|
| "Experience seamless, next-gen billing!" | "Bills in 0 ms. Even when the internet is down." |
| "Submit" | "Download CB-POS" / "Send ticket" / "Upload slip" |
| "Oops! Something went wrong 😢" | "Couldn't send. Check your connection and try again." |
| "IRD-certified tax engine" | "Calculates 18% VAT and 2.5% SSCL from your MRP." |
| "Join thousands of happy merchants" | "{n} shops in {d}/25 districts." (live numbers) |

Full copy is in `06-SCREEN_BLUEPRINTS_AND_COPY.md`.
