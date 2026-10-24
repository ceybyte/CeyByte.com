"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Crosshair } from "@/components/brand/crosshair";
import { Reveal } from "@/components/motion/reveal";

export function FinalBannerSection() {
  const t = useTranslations("home.final");
  const locale = useLocale();

  return (
    <section className="relative border-b border-hairline bg-surface py-20 sm:py-28 overflow-hidden">
      {/* Structural Crosshairs at all 4 corners */}
      <Crosshair className="top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="top-0 right-0 translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
      <Crosshair className="bottom-0 right-0 translate-x-1/2 translate-y-1/2" />

      {/* Subtle Radial Azure Glow Backdrop */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-25">
        <div className="size-[500px] rounded-full bg-azure blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
        <Reveal>
          <span className="font-mono text-xs font-semibold tracking-wider uppercase text-primary mb-4 inline-block">
            INSTALL IN MINUTES · BILL FOR YEARS
          </span>

          <h2 className="text-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-text leading-tight mb-6">
            {t("title")}
          </h2>

          <p className="text-muted text-base sm:text-lg lg:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
            {t("body")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              variant="primary"
              size="xl"
              className="w-full sm:w-auto shadow-[0_0_24px_rgba(57,255,20,0.3)] hover:shadow-[0_0_36px_rgba(57,255,20,0.5)] transition-shadow duration-300"
            >
              <Link href={`/${locale}/download`}>
                <Download className="size-5 mr-1" />
                <span>{t("cta")}</span>
              </Link>
            </Button>

            <Button asChild variant="ghost" size="lg">
              <Link href={`/${locale}/docs/getting-started/install`} className="inline-flex items-center gap-2 group text-text hover:text-azure-text">
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
