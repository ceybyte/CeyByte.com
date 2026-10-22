import localFont from "next/font/local";

// 03-DESIGN §4.1. Self-hosted variable fonts from npm (geist, @fontsource-variable/*): builds never call
// Google Fonts, so a fonts.googleapis hiccup can't fail a deploy and visitors never hit a third party.
// Paths are relative to this file and resolve to the hoisted root node_modules (bunfig.toml).
// Script fonts aren't preloaded here; Phase 3 preloads only the active locale's script.

export const geist = localFont({
  src: "../../../../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2",
  weight: "100 900",
  variable: "--font-geist",
  display: "swap",
});

export const inter = localFont({
  src: "../../../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

export const jetbrainsMono = localFont({
  src: "../../../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  weight: "100 800",
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const notoSinhala = localFont({
  src: "../../../../node_modules/@fontsource-variable/noto-sans-sinhala/files/noto-sans-sinhala-sinhala-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-noto-sinhala",
  display: "swap",
  preload: false,
});

export const notoTamil = localFont({
  src: "../../../../node_modules/@fontsource-variable/noto-sans-tamil/files/noto-sans-tamil-tamil-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-noto-tamil",
  display: "swap",
  preload: false,
});

export const fontVariables = [geist, inter, jetbrainsMono, notoSinhala, notoTamil]
  .map((font) => font.variable)
  .join(" ");
