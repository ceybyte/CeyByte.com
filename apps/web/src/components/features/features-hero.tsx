import { useTranslations } from "next-intl";
import { Figure } from "@/components/brand/figure";
import { Reveal } from "@/components/motion/reveal";

export function FeaturesHero() {
  const t = useTranslations("featuresPage");

  return (
    <section className="border-hairline bg-surface/30 relative overflow-hidden border-b py-16 sm:py-24">
      {/* Background decoration figure */}
      <div className="pointer-events-none absolute -top-12 -right-12 w-80 opacity-15 sm:w-96">
        <Figure name="hub" intensity={0.4} />
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-3xl">
            <span className="text-azure-text font-mono text-xs font-semibold tracking-wider uppercase">
              {t("hero.badge")}
            </span>
            <h1 className="text-display text-text mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              {t("hero.title")}
            </h1>
            <p className="text-muted mt-4 text-base leading-relaxed sm:text-lg">{t("hero.lead")}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
