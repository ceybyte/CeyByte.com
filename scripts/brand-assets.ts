// Builds web brand assets from docs/brand/source (03-DESIGN §7). Re-run when the logo changes:
//   bun scripts/brand-assets.ts
import sharp from "sharp";

const SRC = "docs/brand/source";
const CANVAS = "#1e1e1e"; // --canvas (dark)

async function trimmed(file: string) {
  return sharp(`${SRC}/${file}`).trim().png().toBuffer();
}

// App icon: white mark centred on a dark tile, mark at 64% of the tile width.
async function icon(size: number, out: string) {
  const mark = await sharp(await trimmed("cb-mark-white-1000.png"))
    .resize({ width: Math.round(size * 0.64) })
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: CANVAS } })
    .composite([{ input: mark, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toFile(out);
}

// Footer marks: trimmed, 96px tall (3× a 32px display size), WebP.
async function mark(file: string, out: string) {
  await sharp(await trimmed(file))
    .resize({ height: 96 })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(out);
}

async function logoCover(file: string, out: string) {
  await sharp(await trimmed(file))
    .resize({ height: 72 })
    .webp({ quality: 95, alphaQuality: 100 })
    .toFile(out);
}

await icon(512, "apps/web/src/app/icon.png");
await icon(180, "apps/web/src/app/apple-icon.png");
await mark("cb-mark-white-1000.png", "apps/web/public/brand/cb-mark-white.webp");
await mark("cb-mark-black-1000.png", "apps/web/public/brand/cb-mark-black.webp");
await logoCover("ceylon-bytes-cover-white-1000x200.png", "apps/web/public/brand/ceybyte-logo-white.webp");
await logoCover("ceylon-bytes-cover-black-1000x200.png", "apps/web/public/brand/ceybyte-logo-black.webp");
console.warn("brand assets written");
