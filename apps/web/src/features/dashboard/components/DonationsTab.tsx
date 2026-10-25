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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {copy.donationsTitle}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Track bank transfer verifications and your Gold Supporter badge status.
          </p>
        </div>

        <Link
          href={`/${locale}/donate`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border rounded text-xs font-medium transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Support CB POS</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span className="text-xs">Loading donations...</span>
        </div>
      ) : donations.length === 0 ? (
        <div className="p-12 bg-card border border-border rounded-lg text-center">
          <HeartHandshake className="w-8 h-8 text-muted-foreground/60 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No donations yet</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-5">
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
        <div className="bg-card border border-border rounded-lg divide-y divide-border overflow-hidden">
          {donations.map((d) => (
            <div key={d.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/30 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {d.referenceCode}
                  </span>
                  <span className={`text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded border ${getStatusBadge(d.status)}`}>
                    {d.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm font-mono font-bold text-cyan-400">
                  {formatLkr(d.amountCents)}
                </p>
                {d.rejectionReason && (
                  <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2 rounded mt-1.5">
                    Reason: {d.rejectionReason}
                  </p>
                )}
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-1 text-xs text-muted-foreground">
                <span className="text-[11px] font-mono">
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
