/// <reference types="bun-types" />
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { Resvg } from "@resvg/resvg-js";

type DistrictItem = {
  id: string;
  name: { en: string; si: string; ta: string };
  centroid: [number, number]; // [lat, lng]
  bbox: [number, number, number, number];
};

type DistrictsData = {
  districts: DistrictItem[];
};

export function generateMapTeaserSvg(districts: DistrictItem[], width = 600, height = 450): string {
  // Projection bounds for Sri Lanka
  const minLat = 5.75;
  const maxLat = 9.95;
  const minLng = 79.45;
  const maxLng = 82.05;

  const padX = 75;
  const padY = 45;
  const drawWidth = width - padX * 2;
  const drawHeight = height - padY * 2;

  function project(lat: number, lng: number): { x: number; y: number } {
    const x = padX + ((lng - minLng) / (maxLng - minLng)) * drawWidth;
    const y = padY + ((maxLat - lat) / (maxLat - minLat)) * drawHeight;
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  }

  // Pre-calculate node positions
  const nodes = districts.map((d) => {
    const [lat, lng] = d.centroid;
    const pt = project(lat, lng);
    return {
      id: d.id,
      name: d.name.en,
      lat,
      lng,
      x: pt.x,
      y: pt.y,
    };
  });

  // Calculate nearest-neighbor network lines
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      // Connect nodes that are geographical neighbors (within ~65 pixels on this scale)
      if (dist < 68) {
        lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
      }
    }
  }

  // Generate SVG markup
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#00F5FF" stop-opacity="0.8" />
      <stop offset="50%" stop-color="#00F5FF" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#00F5FF" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="centerRadar" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#00F5FF" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#090a0f" stop-opacity="0" />
    </radialGradient>
    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#161b26" stroke-width="0.75" />
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="#090a0f" />
  <rect width="${width}" height="${height}" fill="url(#grid)" />
  <circle cx="${width / 2}" cy="${height / 2}" r="180" fill="url(#centerRadar)" />

  <!-- Corner Crosshairs -->
  <g stroke="#334155" stroke-width="1.2">
    <!-- Top-left -->
    <path d="M 16 24 L 28 24 M 22 18 L 22 30" />
    <!-- Top-right -->
    <path d="M ${width - 28} 24 L ${width - 16} 24 M ${width - 22} 18 L ${width - 22} 30" />
    <!-- Bottom-left -->
    <path d="M 16 ${height - 24} L 28 ${height - 24} M 22 ${height - 30} L 22 ${height - 18}" />
    <!-- Bottom-right -->
    <path d="M ${width - 28} ${height - 24} L ${width - 16} ${height - 24} M ${width - 22} ${height - 30} L ${width - 22} ${height - 18}" />
  </g>

  <!-- Telemetry Header -->
  <text x="36" y="32" fill="#64748b" font-family="monospace" font-size="10" font-weight="600" letter-spacing="1.5">LIVE TELEMETRY · 25 DISTRICTS</text>
  <text x="${width - 36}" y="32" text-anchor="end" fill="#00F5FF" font-family="monospace" font-size="10" font-weight="600" letter-spacing="1">CBPOS // ISLAND-WIDE</text>

  <!-- Network Interconnections -->
  <g stroke="#1e293b" stroke-width="1" stroke-dasharray="3 3">
    ${lines.map((l) => `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" />`).join("\n    ")}
  </g>

  <!-- Active District Nodes -->
  <g id="districtNodes">
    ${nodes
      .map(
        (n) => `
    <!-- ${n.name} -->
    <circle cx="${n.x}" cy="${n.y}" r="14" fill="url(#nodeGlow)" />
    <circle cx="${n.x}" cy="${n.y}" r="5" fill="#00F5FF" fill-opacity="0.3" stroke="#00F5FF" stroke-width="0.75" />
    <circle cx="${n.x}" cy="${n.y}" r="2" fill="#ffffff" />`,
      )
      .join("\n")}
  </g>

  <!-- Pulse Reticle around Colombo (6.9271° N, 79.8612° E) -->
  <g stroke="#39FF14" fill="none" opacity="0.8">
    <circle cx="186" cy="336" r="12" stroke-width="0.75" stroke-dasharray="2 2" />
    <circle cx="186" cy="336" r="2" fill="#39FF14" />
  </g>

  <!-- Bottom Coordinate Indicator -->
  <text x="36" y="${height - 20}" fill="#475569" font-family="monospace" font-size="9" letter-spacing="0.5">BOUNDS: 5.8°N - 10.0°N / 79.5°E - 82.0°E</text>
  <text x="${width - 36}" y="${height - 20}" text-anchor="end" fill="#475569" font-family="monospace" font-size="9" letter-spacing="0.5">OFFLINE-FIRST RETAIL MESH</text>
</svg>`;
}

export function generateMapTeaserPng(): Buffer {
  const root = resolve(__dirname, "..");
  const districtsPath = join(root, "apps/web/public/data/lk-districts.json");
  const raw = readFileSync(districtsPath, "utf-8");
  const data: DistrictsData = JSON.parse(raw);

  const svg = generateMapTeaserSvg(data.districts);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 600 },
  });
  const pngData = resvg.render();
  return pngData.asPng();
}

// CLI entry point
if (import.meta.main) {
  const root = resolve(__dirname, "..");
  const outDir = join(root, "apps/web/public");
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const outFile = join(outDir, "map-teaser.png");
  const png = generateMapTeaserPng();
  writeFileSync(outFile, png);
  console.log(`[map-teaser] generated ${outFile} (${png.length} bytes)`);
}
