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
        <h2 className="text-text flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Heart className="text-gold fill-gold/20 size-6" />
          {copy.title}
        </h2>
        <span className="text-muted text-xs font-semibold">
          {supporters.length} {supporters.length === 1 ? "supporter" : "supporters"}
        </span>
      </div>

      {supporters.length === 0 ? (
        <div className="border-hairline bg-surface/40 flex flex-col items-center justify-center rounded-[--radius-md] border border-dashed p-12 text-center">
          <Heart className="text-muted/40 size-10" />
          <p className="text-muted mt-3 text-sm">{copy.empty}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {supporters.map((s) => {
            const name = s.displayName?.trim() || copy.anonymous;
            const formattedAmount =
              s.amountCents !== null ? `Rs. ${(s.amountCents / 100).toLocaleString("en-US")}` : null;

            return (
              <div
                key={s.id}
                className="border-hairline bg-surface flex flex-col justify-between rounded-[--radius-md] border p-4.5 transition-transform hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-text line-clamp-1 font-semibold">{name}</span>
                    {s.isMerchantSupporter && (
                      <span className="border-gold/40 bg-gold/15 text-gold inline-flex items-center gap-1 rounded-[--radius-sm] border px-2 py-0.5 text-[11px] font-bold">
                        <Award className="size-3" />
                        {copy.goldSupporter}
                      </span>
                    )}
                  </div>

                  {formattedAmount && (
                    <div className="text-azure mt-1 font-mono text-xs font-bold">{formattedAmount}</div>
                  )}

                  {s.publicMessage && (
                    <div className="text-muted mt-2.5 flex items-start gap-1.5 text-xs">
                      <MessageSquare className="text-muted/60 mt-0.5 size-3.5 shrink-0" />
                      <p className="text-text/80 line-clamp-3 leading-relaxed italic">
                        &ldquo;{s.publicMessage}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-hairline/40 text-muted mt-3 flex items-center justify-end border-t pt-2 text-[11px]">
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
