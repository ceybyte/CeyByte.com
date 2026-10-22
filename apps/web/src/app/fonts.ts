import { Geist, Inter, JetBrains_Mono, Noto_Sans_Sinhala, Noto_Sans_Tamil } from "next/font/google";

// 03-DESIGN §4.1. Script fonts aren't preloaded here; Phase 3 preloads only the active locale's script.
export const geist = Geist({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-geist",
  display: "swap",
});
export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
export const notoSinhala = Noto_Sans_Sinhala({
  subsets: ["sinhala"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sinhala",
  display: "swap",
  preload: false,
});
export const notoTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-tamil",
  display: "swap",
  preload: false,
});

export const fontVariables = [geist, inter, jetbrainsMono, notoSinhala, notoTamil]
  .map((font) => font.variable)
  .join(" ");
