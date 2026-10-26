import React from "react";
import { Award, Heart, MessageSquare } from "lucide-react";
import type { PublicSupporter } from "../types";

export interface SupportersWallProps {
  supporters: PublicSupporter[];
  copy: {
    title: string;
    empty: string;
    anonymous: string;
    goldSupporter: string;
  };
}

export function SupportersWall({ supporters, copy }: SupportersWallProps) {
  return (
    <section className="mt-12 w-full">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-text">
          <Heart className="size-6 text-gold fill-gold/20" />
          {copy.title}
        </h2>
        <span className="text-xs font-semibold text-muted">
          {supporters.length} {supporters.length === 1 ? "supporter" : "supporters"}
        </span>
      </div>

      {supporters.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-hairline bg-surface/40 p-12 text-center">
          <Heart className="size-10 text-muted/40" />
          <p className="mt-3 text-sm text-muted">{copy.empty}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {supporters.map((s) => {
            const name = s.displayName?.trim() || copy.anonymous;
            const formattedAmount =
              s.amountCents !== null
                ? `Rs. ${(s.amountCents / 100).toLocaleString("en-US")}`
                : null;

            return (
              <div
                key={s.id}
                className="flex flex-col justify-between rounded-lg border border-hairline bg-surface p-4.5 shadow-xs transition-transform hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-text line-clamp-1">{name}</span>
                    {s.isMerchantSupporter && (
                      <span className="inline-flex items-center gap-1 rounded border border-gold/40 bg-gold/15 px-2 py-0.5 text-[11px] font-bold text-gold">
                        <Award className="size-3" />
                        {copy.goldSupporter}
                      </span>
                    )}
                  </div>

                  {formattedAmount && (
                    <div className="mt-1 font-mono text-xs font-bold text-azure">
                      {formattedAmount}
                    </div>
                  )}

                  {s.publicMessage && (
                    <div className="mt-2.5 flex items-start gap-1.5 text-xs text-muted">
                      <MessageSquare className="size-3.5 shrink-0 mt-0.5 text-muted/60" />
                      <p className="italic leading-relaxed text-text/80 line-clamp-3">
                        &ldquo;{s.publicMessage}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-end border-t border-hairline/40 pt-2 text-[11px] text-muted">
                  <span>{s.month}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
