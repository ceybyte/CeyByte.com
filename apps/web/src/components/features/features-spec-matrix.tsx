import { Check, X, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/reveal";

export function FeaturesSpecMatrix() {
  const t = useTranslations("featuresPage.matrix");

  const rows = [
    {
      feature: t("rows.cost.feature"),
      cbpos: t("rows.cost.cbpos"),
      typical: t("rows.cost.typical"),
      enterprise: t("rows.cost.enterprise"),
      highlight: true,
    },
    {
      feature: t("rows.offline.feature"),
      cbpos: t("rows.offline.cbpos"),
      typical: t("rows.offline.typical"),
      enterprise: t("rows.offline.enterprise"),
    },
    {
      feature: t("rows.keyboard.feature"),
      cbpos: t("rows.keyboard.cbpos"),
      typical: t("rows.keyboard.typical"),
      enterprise: t("rows.keyboard.enterprise"),
    },
    {
      feature: t("rows.tax.feature"),
      cbpos: t("rows.tax.cbpos"),
      typical: t("rows.tax.typical"),
      enterprise: t("rows.tax.enterprise"),
    },
    {
      feature: t("rows.hardware.feature"),
      cbpos: t("rows.hardware.cbpos"),
      typical: t("rows.hardware.typical"),
      enterprise: t("rows.hardware.enterprise"),
    },
    {
      feature: t("rows.languages.feature"),
      cbpos: t("rows.languages.cbpos"),
      typical: t("rows.languages.typical"),
      enterprise: t("rows.languages.enterprise"),
    },
    {
      feature: t("rows.data.feature"),
      cbpos: t("rows.data.cbpos"),
      typical: t("rows.data.typical"),
      enterprise: t("rows.data.enterprise"),
    },
  ];

  return (
    <section className="border-hairline bg-surface/20 border-t py-16 sm:py-20">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-azure-text font-mono text-xs font-semibold tracking-wider uppercase">
              {t("badge")}
            </span>
            <h2 className="text-display text-text mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {t("title")}
            </h2>
            <p className="text-muted mt-3 text-sm leading-relaxed sm:text-base">{t("lead")}</p>
          </div>

          <div className="border-hairline bg-surface/50 mt-10 overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-hairline bg-surface-elevated/60 border-b">
                  <th className="text-muted p-4 font-mono font-medium tracking-wider uppercase sm:p-5">
                    {t("colFeature")}
                  </th>
                  <th className="border-azure/30 bg-azure/10 text-azure-text p-4 font-mono font-semibold tracking-wider uppercase sm:p-5">
                    {t("colCbpos")}
                  </th>
                  <th className="text-muted p-4 font-mono font-medium tracking-wider uppercase sm:p-5">
                    {t("colTypical")}
                  </th>
                  <th className="text-muted p-4 font-mono font-medium tracking-wider uppercase sm:p-5">
                    {t("colEnterprise")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-hairline divide-y">
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-elevated/30 transition-colors">
                    <td className="text-text p-4 font-medium sm:p-5">{row.feature}</td>
                    <td className="border-azure/20 bg-azure/5 text-text p-4 font-medium sm:p-5">
                      <div className="flex items-center gap-2">
                        <Check className="text-primary size-4 shrink-0" />
                        <span>{row.cbpos}</span>
                      </div>
                    </td>
                    <td className="text-muted p-4 sm:p-5">
                      <div className="flex items-center gap-2">
                        <X className="text-error/80 size-4 shrink-0" />
                        <span>{row.typical}</span>
                      </div>
                    </td>
                    <td className="text-muted p-4 sm:p-5">
                      <div className="flex items-center gap-2">
                        <Minus className="text-warning size-4 shrink-0" />
                        <span>{row.enterprise}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
