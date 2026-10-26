import React from "react";
import { ShieldCheck, Printer, Languages, Server, BarChart3 } from "lucide-react";

export interface TransparencyStripProps {
  monthlyTotalCents: number;
  totalSupportersCount: number;
  copy: {
    title: string;
    body: string;
    fundsTitle: string;
    fundsCert: string;
    fundsHardware: string;
    fundsI18n: string;
    fundsInfra: string;
  };
}

export function TransparencyStrip({
  monthlyTotalCents,
  totalSupportersCount,
  copy,
}: TransparencyStripProps) {
  const formattedTotal = (monthlyTotalCents / 100).toLocaleString("en-US");
  const formattedCount = totalSupportersCount.toLocaleString("en-US");

  // Format body template e.g. "Rs. {total} from {count} supporters, updated live."
  const bodyText = copy.body
    .replace("{total}", formattedTotal)
    .replace("{count}", formattedCount);

  const pillars = [
    {
      icon: ShieldCheck,
      text: copy.fundsCert,
    },
    {
      icon: Printer,
      text: copy.fundsHardware,
    },
    {
      icon: Languages,
      text: copy.fundsI18n,
    },
    {
      icon: Server,
      text: copy.fundsInfra,
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Monthly summary banner */}
      <div className="flex flex-col gap-4 rounded-lg border border-gold/30 bg-gold/5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-gold/15 text-gold">
            <BarChart3 className="size-6" />
          </div>
          <div>
            <h3 className="font-bold text-text">{copy.title}</h3>
            <p className="text-sm font-medium text-muted">{bodyText}</p>
          </div>
        </div>
        <div className="text-right sm:border-l sm:border-hairline sm:pl-6">
          <div className="font-mono text-2xl font-black text-text">
            Rs. {formattedTotal}
          </div>
          <div className="text-xs text-muted">
            {formattedCount} {totalSupportersCount === 1 ? "supporter" : "supporters"}
          </div>
        </div>
      </div>

      {/* 4 Funding Pillars */}
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
          {copy.fundsTitle}
        </h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-hairline bg-surface p-3.5 shadow-xs"
              >
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded border border-hairline bg-surface-elevated text-azure">
                  <Icon className="size-4" />
                </div>
                <p className="text-xs leading-relaxed text-text/90 font-medium">
                  {pillar.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
