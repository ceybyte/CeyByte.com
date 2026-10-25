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

      {/* Subtle Radial Azure Glow Backdrop */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-25">
        <div className="bg-azure size-[500px] rounded-full blur-[120px]" />
      </div>

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
