"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeartHandshake, Plus, Loader2 } from "lucide-react";
import type { DashboardDonation } from "../types";
import { fetchMyDonations } from "../api";

interface DonationsTabProps {
  locale: string;
  copy: {
    donationsTitle: string;
  };
}

export function DonationsTab({ locale, copy }: DonationsTabProps) {
  const [donations, setDonations] = useState<DashboardDonation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyDonations()
      .then((d) => setDonations(d))
      .catch(() => setDonations([]))
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "awaiting_payment":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "rejected":
      case "cancelled":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const formatLkr = (cents: number) => {
    const rupees = cents / 100;
    return new Intl.NumberFormat(locale === "en" ? "en-LK" : locale, {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }).format(rupees);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-foreground text-xl font-bold tracking-tight">{copy.donationsTitle}</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Track bank transfer verifications and your Gold Supporter badge status.
          </p>
        </div>

        <Link
          href={`/${locale}/donate`}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border inline-flex shrink-0 items-center gap-2 rounded border px-4 py-2 text-xs font-medium transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Support CB POS</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-muted-foreground flex items-center justify-center gap-2 p-12 text-center">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
          <span className="text-xs">Loading donations...</span>
        </div>
      ) : donations.length === 0 ? (
        <div className="bg-card border-border rounded-lg border p-12 text-center">
          <HeartHandshake className="text-muted-foreground/60 mx-auto mb-3 h-8 w-8" />
          <p className="text-foreground mb-1 text-sm font-medium">No donations yet</p>
          <p className="text-muted-foreground mx-auto mb-5 max-w-sm text-xs">
            Support free software for Sri Lankan businesses with a bank transfer deposit.
          </p>
          <Link
            href={`/${locale}/donate`}
            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline"
          >
            <span>Make your first donation</span>
          </Link>
        </div>
      ) : (
        <div className="bg-card border-border divide-border divide-y overflow-hidden rounded-lg border">
          {donations.map((d) => (
            <div
              key={d.id}
              className="hover:bg-secondary/30 flex flex-col justify-between gap-3 p-4 transition sm:flex-row sm:items-center"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-mono text-xs font-semibold">{d.referenceCode}</span>
                  <span
                    className={`rounded border px-1.5 py-0.5 font-mono text-[10px] tracking-wider uppercase ${getStatusBadge(d.status)}`}
                  >
                    {d.status.replace("_", " ")}
                  </span>
                </div>
                <p className="font-mono text-sm font-bold text-cyan-400">{formatLkr(d.amountCents)}</p>
                {d.rejectionReason && (
                  <p className="text-destructive bg-destructive/10 border-destructive/20 mt-1.5 rounded border p-2 text-xs">
                    Reason: {d.rejectionReason}
                  </p>
                )}
              </div>

              <div className="text-muted-foreground flex shrink-0 items-center justify-between gap-1 text-xs sm:flex-col sm:items-end">
                <span className="font-mono text-[11px]">
                  {new Date(d.createdAt).toLocaleDateString(locale === "en" ? "en-US" : locale)}
                </span>
                <span className="text-[11px] capitalize">Method: {d.method}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
