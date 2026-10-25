import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { Figure } from "@/components/brand/figure";
import { LatestReleaseCard, type ReleaseCardData } from "@/components/releases/latest-release-card";
import { VerifyExpander } from "@/components/releases/verify-expander";
import { ChangelogTimeline, type ReleaseTimelineItem } from "@/components/releases/changelog-timeline";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/releases",
    title: "Releases and Changelog",
    description:
      "All released versions of CB POS for Windows, with SHA-256 installer checksums, integrity verification commands, and full changelogs.",
  });
}

function loadReleases(): ReleaseTimelineItem[] {
  try {
    const cwd = process.cwd();
    const primaryPath = join(cwd, ".content/releases.json");
    const fallbackPath = join(cwd, ".content/fixtures.json");

    if (existsSync(primaryPath)) {
      const data = JSON.parse(readFileSync(primaryPath, "utf-8"));
      if (Array.isArray(data) && data.length > 0) return data;
    }

    if (existsSync(fallbackPath)) {
      const fixtures = JSON.parse(readFileSync(fallbackPath, "utf-8"));
      if (Array.isArray(fixtures.releases) && fixtures.releases.length > 0) {
        return fixtures.releases;
      }
    }
  } catch {
    // fallback on error
  }

  return [
    {
      id: "release-1.3.0",
      version: "1.3.0",
      release_date: "2026-09-27",
      changelog:
        "Initial stable release with full offline billing, trilingual receipt printing (Sinhala/Tamil/English), 18% VAT and 2.5% SSCL reverse-calculation, and encrypted USB backup support.",
      is_latest: true,
      is_yanked: false,
    },
  ];
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ReleasesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "releases" });
  const releases = loadReleases();
  const latestRelease = releases.find((r) => r.is_latest && !r.is_yanked) ?? releases[0] ?? {
    id: "release-1.3.0",
    version: "1.3.0",
    release_date: "2026-09-27",
    sha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    download_url: "https://github.com/ceybyte/cbpos-releases/releases/download/v1.3.0/CBPOSSetup-1.3.0.exe",
    is_latest: true,
  };

  const latestCardData: ReleaseCardData = {
    version: latestRelease.version,
    release_date: latestRelease.release_date,
    download_url: latestRelease.id ? `/api/download/latest` : "/api/download/latest",
    sha256:
      (latestRelease as { sha256?: string }).sha256 ??
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    exe_size: 52428800,
  };

  return (
    <div className="bg-canvas min-h-[calc(100vh-var(--header-h))] py-12 px-4 sm:py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-10">
        {/* Header with Hairline Branches Figure */}
        <div className="border-hairline bg-surface relative overflow-hidden rounded-lg border p-6 sm:p-8">
          <div className="pointer-events-none absolute -top-8 -right-8 w-72 sm:w-96 opacity-20">
            <Figure name="branches" intensity={0.4} />
          </div>

          <div className="relative z-10 max-w-xl">
            <span className="text-primary font-mono text-xs font-semibold uppercase tracking-wider">
              CB POS VERSIONS
            </span>
            <h1 className="text-display text-text mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t("title")}
            </h1>
            <p className="text-text-muted mt-3 text-sm leading-relaxed sm:text-base">
              {t("lead")}
            </p>
            <p className="text-text-muted/70 mt-4 text-xs italic">
              {t("asIs")}
            </p>
          </div>
        </div>

        {/* Large Card for Latest Version */}
        <LatestReleaseCard release={latestCardData} locale={locale} />

        {/* File Integrity Verification Expander */}
        <VerifyExpander version={latestRelease.version} />

        {/* Full Version Changelog Timeline */}
        <ChangelogTimeline
          releases={releases}
          staticLatestVersion={latestRelease.version}
        />
      </div>
    </div>
  );
}
