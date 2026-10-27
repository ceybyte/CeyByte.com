"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Crosshair } from "@/components/brand/crosshair";
import { Reveal } from "@/components/motion/reveal";
import { useGate } from "@/components/gate/gate-context";

export function FinalBannerSection() {
  const t = useTranslations("home.final");
  const locale = useLocale();
  const { openGate } = useGate();

  return (
    <section className="border-hairline bg-surface relative overflow-hidden border-b py-20 sm:py-28">
      {/* Structural Crosshairs at all 4 corners */}
      <Crosshair className="top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="top-0 right-0 translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
      <Crosshair className="right-0 bottom-0 translate-x-1/2 translate-y-1/2" />

      {/* Wide Atmospheric Radial Azure Glow Backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-80 dark:opacity-40"
        style={{
          background: "radial-gradient(ellipse 90% 70% at 50% 50%, var(--glow-azure) 0%, transparent 75%)",
        }}
      />
      {/* Micro-noise Film Grain Texture Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-multiply dark:opacity-[0.035] dark:mix-blend-screen"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 container mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <Reveal>
          <span className="text-primary mb-4 inline-block font-mono text-xs font-semibold tracking-wider uppercase">
            INSTALL IN MINUTES · BILL FOR YEARS
          </span>

          <h2 className="text-display text-text mb-6 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            {t("title")}
          </h2>

          <p className="text-muted mx-auto mb-10 max-w-2xl text-base leading-relaxed sm:text-lg lg:text-xl">
            {t("body")}
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              variant="primary"
              size="xl"
              className="w-full shadow-lg transition-all duration-300 hover:brightness-105 sm:w-auto"
            >
              <a
                href={`/${locale}/download`}
                onClick={(e) => {
                  e.preventDefault();
                  openGate();
                }}
              >
                <Download className="mr-1 size-5" />
                <span>{t("cta")}</span>
              </a>
            </Button>

            <Button asChild variant="ghost" size="lg">
              <Link
                href={`/${locale}/docs/getting-started/install`}
                className="group text-text hover:text-azure-text inline-flex items-center gap-2"
              >
                <span>{t("secondary")}</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
