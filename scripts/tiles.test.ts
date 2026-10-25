import { describe, expect, it } from "bun:test";
import {
  DEFAULT_MAXZOOM,
  DEFAULT_OUTPUT,
  SRI_LANKA_BBOX,
  formatExtractCommand,
  parseTilesArgs,
  runTilesExtract,
  validateTileParams,
} from "./tiles";

describe("scripts/tiles", () => {
  it("parses default options correctly", () => {
    const opts = parseTilesArgs([]);
    expect(opts.bbox).toEqual(SRI_LANKA_BBOX);
    expect(opts.maxzoom).toBe(DEFAULT_MAXZOOM);
    expect(opts.outputPath).toBe(DEFAULT_OUTPUT);
    expect(opts.dryRun).toBe(false);
  });

  it("parses custom CLI arguments correctly", () => {
    const opts = parseTilesArgs([
      "--dry-run",
      "--source",
      "https://example.com/tiles.pmtiles",
      "--output",
      "custom.pmtiles",
      "--maxzoom",
      "12",
      "--bbox",
      "80.0,6.0,81.0,7.0",
    ]);
    expect(opts.dryRun).toBe(true);
    expect(opts.sourceUrl).toBe("https://example.com/tiles.pmtiles");
    expect(opts.outputPath).toBe("custom.pmtiles");
    expect(opts.maxzoom).toBe(12);
    expect(opts.bbox).toEqual([80.0, 6.0, 81.0, 7.0]);
  });

  it("validates bounds and zoom", () => {
    expect(
      validateTileParams({
        sourceUrl: "test",
        outputPath: "test",
        bbox: [79.5, 5.8, 82.0, 10.0],
        maxzoom: 15,
        dryRun: false,
      }).valid,
    ).toBe(true);

    expect(
      validateTileParams({
        sourceUrl: "test",
        outputPath: "test",
        bbox: [82.0, 5.8, 79.5, 10.0], // inverted min/max
        maxzoom: 15,
        dryRun: false,
      }).valid,
    ).toBe(false);

    expect(
      validateTileParams({
        sourceUrl: "test",
        outputPath: "test",
        bbox: [79.5, 5.8, 82.0, 10.0],
        maxzoom: 20, // out of range
        dryRun: false,
      }).valid,
    ).toBe(false);
  });

  it("formats extract command accurately", () => {
    const cmd = formatExtractCommand({
      sourceUrl: "https://build.protomaps.com/latest.pmtiles",
      outputPath: "sri-lanka.pmtiles",
      bbox: [79.5, 5.8, 82.0, 10.0],
      maxzoom: 15,
      dryRun: false,
    });
    expect(cmd).toBe(
      "pmtiles extract https://build.protomaps.com/latest.pmtiles sri-lanka.pmtiles --bbox=79.5,5.8,82,10 --maxzoom=15",
    );
  });

  it("runs dry-run without errors", async () => {
    const code = await runTilesExtract(["--dry-run"]);
    expect(code).toBe(0);
  });
});
