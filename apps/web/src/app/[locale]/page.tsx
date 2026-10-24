import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { setRequestLocale } from "next-intl/server";
import { BentoGrid } from "@/components/home/bento-grid";
import { FaqSection } from "@/components/home/faq-section";
import { FinalBannerSection } from "@/components/home/final-banner-section";
import { HeroSection } from "@/components/home/hero-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { ProblemSection } from "@/components/home/problem-section";
import { TelemetryStrip } from "@/components/home/telemetry-strip";
import { JsonLd, softwareSchema } from "@/lib/json-ld";

type Props = {
  params: Promise<{ locale: string }>;
};

interface ReleaseItem {
  version?: string;
  exe_size?: number;
  is_latest?: number | boolean;
}

function getLatestRelease(): { version: string; sizeMb: number } {
  try {
    const p = join(process.cwd(), ".content/releases.json");
    if (existsSync(p)) {
      const releases = JSON.parse(readFileSync(p, "utf-8")) as ReleaseItem[];
      const latest = releases.find((r) => r.is_latest) || releases[0];
      if (latest) {
        const sizeMb = latest.exe_size ? Math.round(latest.exe_size / (1024 * 1024)) : 64;
        const version = latest.version && latest.version !== "0.0.0-dev" ? latest.version : "1.3.0";
        return { version, sizeMb };
      }
    }
  } catch {
    // Fallback on missing or invalid file
  }
  return { version: "1.3.0", sizeMb: 64 };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const release = getLatestRelease();

  return (
    <>
      {/* Schema.org SoftwareApplication rich snippet */}
      <JsonLd schema={softwareSchema()} />

      {/* S01 Section 1: Hero */}
      <HeroSection version={release.version} sizeMb={release.sizeMb} />

      {/* S01 Section 2: Social proof & telemetry strip */}
      <TelemetryStrip />

      {/* S01 Section 3: Problem statement */}
      <ProblemSection />

      {/* S01 Section 4: Solution bento grid (6 interactive cards) */}
      <BentoGrid />

      {/* S01 Section 5: How it works (3 numbered steps) */}
      <HowItWorksSection sizeMb={release.sizeMb} />

      {/* S01 Section 6: FAQs (5-item accordion + FAQPage JSON-LD) */}
      <FaqSection />

      {/* S01 Section 7: Final conversion banner */}
      <FinalBannerSection />
    </>
  );
}
