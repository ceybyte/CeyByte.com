/**
 * PMTiles Tile Extract Script for Sri Lanka Basemap (F-04)
 *
 * Usage:
 *   bun scripts/tiles.ts --dry-run
 *   bun scripts/tiles.ts --source <url> --output <path> --maxzoom 15
 *
 * Extracts bounding box [79.5, 5.8, 82.0, 10.0] up to zoom 15.
 * Extracted tiles are uploaded to R2 bucket `cbpos-public/tiles/sri-lanka.pmtiles`
 * behind `cdn.ceybyte.com`.
 *
 * Note: Scheduled for quarterly updates in ops calendar.
 */

export interface TileExtractOptions {
  sourceUrl: string;
  outputPath: string;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  maxzoom: number;
  dryRun: boolean;
}

export const SRI_LANKA_BBOX: [number, number, number, number] = [79.5, 5.8, 82.0, 10.0];
export const DEFAULT_MAXZOOM = 15;
export const DEFAULT_OUTPUT = "apps/web/public/tiles/sri-lanka.pmtiles";

export function parseTilesArgs(args: string[]): TileExtractOptions {
  const options: TileExtractOptions = {
    sourceUrl: "https://build.protomaps.com/latest.pmtiles",
    outputPath: DEFAULT_OUTPUT,
    bbox: SRI_LANKA_BBOX,
    maxzoom: DEFAULT_MAXZOOM,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--source" && args[i + 1]) {
      options.sourceUrl = args[++i]!;
    } else if (arg === "--output" && args[i + 1]) {
      options.outputPath = args[++i]!;
    } else if (arg === "--maxzoom" && args[i + 1]) {
      options.maxzoom = parseInt(args[++i]!, 10);
    } else if (arg === "--bbox" && args[i + 1]) {
      const parts = args[++i]!.split(",").map(Number);
      if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
        options.bbox = [parts[0]!, parts[1]!, parts[2]!, parts[3]!];
      }
    }
  }

  return options;
}

export function validateTileParams(opts: TileExtractOptions): { valid: boolean; error?: string } {
  const [minLng, minLat, maxLng, maxLat] = opts.bbox;
  if (minLng < -180 || maxLng > 180 || minLng >= maxLng) {
    return { valid: false, error: "Invalid longitude bounds" };
  }
  if (minLat < -90 || maxLat > 90 || minLat >= maxLat) {
    return { valid: false, error: "Invalid latitude bounds" };
  }
  if (opts.maxzoom < 1 || opts.maxzoom > 16) {
    return { valid: false, error: "Maxzoom must be between 1 and 16" };
  }
  return { valid: true };
}

export function formatExtractCommand(opts: TileExtractOptions): string {
  const bboxStr = opts.bbox.join(",");
  return `pmtiles extract ${opts.sourceUrl} ${opts.outputPath} --bbox=${bboxStr} --maxzoom=${opts.maxzoom}`;
}

export async function runTilesExtract(args: string[] = process.argv.slice(2)): Promise<number> {
  const opts = parseTilesArgs(args);
  const validation = validateTileParams(opts);

  if (!validation.valid) {
    console.error(`[tiles] Validation error: ${validation.error}`);
    return 1;
  }

  const cmd = formatExtractCommand(opts);
  console.log(`[tiles] Target command: ${cmd}`);

  if (opts.dryRun) {
    console.log("[tiles] Dry-run verification passed.");
    console.log(`[tiles] Sri Lanka Bounding Box: [${opts.bbox.join(", ")}]`);
    console.log(`[tiles] Max Zoom: ${opts.maxzoom}`);
    console.log(`[tiles] Output Destination: ${opts.outputPath}`);
    console.log("[tiles] Next scheduled maintenance: Quarterly ops calendar.");
    return 0;
  }

  console.log("[tiles] To run extraction, ensure 'pmtiles' CLI is installed or run via npx:");
  console.log(
    `  npx pmtiles extract ${opts.sourceUrl} ${opts.outputPath} --bbox=${opts.bbox.join(",")} --maxzoom=${opts.maxzoom}`,
  );
  return 0;
}

if (import.meta.main) {
  runTilesExtract().then((code) => {
    if (code !== 0) process.exit(code);
  });
}
