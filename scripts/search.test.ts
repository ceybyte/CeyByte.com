import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { search } from "@orama/orama";
import { restore } from "@orama/plugin-data-persistence";
import { buildSearchIndices } from "./build-search";

const SEARCH_DIR = resolve(__dirname, "../apps/web/public/search");

describe("Search Index Pipeline", () => {
  it("builds indices for en, si, ta and generates manifest.json", async () => {
    const manifest = await buildSearchIndices();
    expect(manifest.builtAt).toBeDefined();
    expect(manifest.indices.en.documents).toBeGreaterThan(0);
    expect(manifest.indices.si.documents).toBeGreaterThan(0);
    expect(manifest.indices.ta.documents).toBeGreaterThan(0);

    expect(existsSync(join(SEARCH_DIR, "en.json"))).toBe(true);
    expect(existsSync(join(SEARCH_DIR, "si.json"))).toBe(true);
    expect(existsSync(join(SEARCH_DIR, "ta.json"))).toBe(true);
    expect(existsSync(join(SEARCH_DIR, "manifest.json"))).toBe(true);
  });

  it("restores English index and searches with typo tolerance", async () => {
    const jsonStr = readFileSync(join(SEARCH_DIR, "en.json"), "utf-8");
    const db = await restore("json", jsonStr);

    // Exact term search
    const exact = await search(db, { term: "install" });
    expect(exact.hits.length).toBeGreaterThan(0);
    expect(exact.hits[0].document.title).toContain("Install");

    // Typo search (instal -> install)
    const typo = await search(db, { term: "instal", tolerance: 1 });
    expect(typo.hits.length).toBeGreaterThan(0);
    expect(typo.hits[0].document.title).toContain("Install");
  });

  it("restores Sinhala index and finds Sinhala terms", async () => {
    const jsonStr = readFileSync(join(SEARCH_DIR, "si.json"), "utf-8");
    const db = await restore("json", jsonStr);

    const res = await search(db, { term: "ස්ථාපනය" });
    expect(res.hits.length).toBeGreaterThan(0);
    expect(res.hits[0].document.title).toContain("ස්ථාපනය");
  });

  it("restores Tamil index and finds Tamil terms", async () => {
    const jsonStr = readFileSync(join(SEARCH_DIR, "ta.json"), "utf-8");
    const db = await restore("json", jsonStr);

    const res = await search(db, { term: "நிறுவுதல்" });
    expect(res.hits.length).toBeGreaterThan(0);
    expect(res.hits[0].document.title).toContain("நிறுவுதல்");
  });
});
