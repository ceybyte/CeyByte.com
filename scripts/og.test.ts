import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { renderOgCard, generateAllOgImages } from "./generate-og";

const PUBLIC_DIR = resolve(__dirname, "../apps/web/public");

describe("OG Image Generator", () => {
  it("renders a valid PNG card with PNG header bytes", async () => {
    const pngBuf = await renderOgCard({
      title: "How to install CB POS on Windows",
      category: "Getting Started",
      summary: "Step-by-step guide to download and set up CB POS.",
      locale: "en",
      type: "doc",
    });

    expect(pngBuf).toBeDefined();
    expect(pngBuf.length).toBeGreaterThan(10000);

    // Verify PNG magic bytes: 0x89 0x50 0x4E 0x47 (\x89PNG)
    expect(pngBuf[0]).toBe(0x89);
    expect(pngBuf[1]).toBe(0x50);
    expect(pngBuf[2]).toBe(0x4e);
    expect(pngBuf[3]).toBe(0x47);
  });

  it("renders Sinhala and Tamil cards without font errors", async () => {
    const siBuf = await renderOgCard({
      title: "CB POS ස්ථාපනය කිරීම",
      category: "ආරම්භ කිරීම",
      summary: "වින්ඩෝස් 10 හි ස්ථාපනය කරන ආකාරය.",
      locale: "si",
      type: "doc",
    });
    expect(siBuf[0]).toBe(0x89);

    const taBuf = await renderOgCard({
      title: "CB POS நிறுவுதல்",
      category: "தொடங்குதல்",
      summary: "விண்டோஸ் 10 இல் நிறுவுவது எப்படி.",
      locale: "ta",
      type: "doc",
    });
    expect(taBuf[0]).toBe(0x89);
  });

  it("generates og-default.png and locale files in public dir", async () => {
    const count = await generateAllOgImages();
    expect(count).toBeGreaterThan(0);

    const defaultOg = join(PUBLIC_DIR, "og-default.png");
    expect(existsSync(defaultOg)).toBe(true);

    const defaultBytes = readFileSync(defaultOg);
    expect(defaultBytes[0]).toBe(0x89);
    expect(defaultBytes[1]).toBe(0x50);
  }, 30000);
});
