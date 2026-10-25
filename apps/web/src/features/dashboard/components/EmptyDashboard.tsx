"use client";

import { useState } from "react";
import Link from "next/link";
import { Store, Download, Phone, Loader2 } from "lucide-react";
import { claimListingFallback } from "../api";
import { toast } from "sonner";

interface EmptyDashboardProps {
  locale: string;
  onClaimSuccess: () => void;
  copy: {
    emptyTitle: string;
    emptyBody: string;
  };
}

export function EmptyDashboard({ locale, onClaimSuccess, copy }: EmptyDashboardProps) {
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await claimListingFallback({ phone: phone.trim() });
      if (res.claimed) {
        toast.success("Listing successfully claimed!");
        setShowClaimModal(false);
        onClaimSuccess();
      } else {
        setErrorMsg("No unredeemed shop found with that phone number.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to claim listing";
      setErrorMsg(msg === "NOT_FOUND" ? "No unredeemed shop found with that phone number." : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="bg-muted/60 border-border text-muted-foreground mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border">
        <Store className="h-7 w-7 text-cyan-400" />
      </div>

      <h2 className="text-foreground mb-2 text-xl font-bold tracking-tight">{copy.emptyTitle}</h2>
      <p className="text-muted-foreground mb-8 text-sm leading-relaxed">{copy.emptyBody}</p>

      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href={`/${locale}/download`}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border flex w-full items-center justify-center gap-2 rounded border px-5 py-2.5 text-sm font-medium transition sm:w-auto"
        >
          <Download className="h-4 w-4" />
          <span>Download CB POS</span>
        </Link>

        <button
          type="button"
          onClick={() => setShowClaimModal(true)}
          className="bg-muted/60 hover:bg-muted text-foreground border-border flex w-full cursor-pointer items-center justify-center gap-2 rounded border px-5 py-2.5 text-sm font-medium transition sm:w-auto"
        >
          <Phone className="text-muted-foreground h-4 w-4" />
          <span>Claim with phone number</span>
        </button>
      </div>

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="bg-card border-border w-full max-w-md rounded-lg border p-6 text-left shadow-2xl">
            <h3 className="text-foreground mb-1 text-base font-bold">Claim your shop listing</h3>
            <p className="text-muted-foreground mb-4 text-xs">
              Enter the phone number you used when downloading CB POS to link your shop to this account.
            </p>

            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="claim-phone-input"
                  className="text-muted-foreground mb-1 block font-mono text-xs tracking-wider uppercase"
                >
                  Registered phone number
                </label>
                <input
                  id="claim-phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="077 123 4567"
                  required
                  className="bg-background border-border text-foreground w-full rounded border px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {errorMsg && (
                <p className="text-destructive bg-destructive/10 border-destructive/20 rounded border p-2 text-xs">
                  {errorMsg}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="border-border text-muted-foreground hover:text-foreground cursor-pointer rounded border px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !phone.trim()}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border flex cursor-pointer items-center gap-2 rounded border px-4 py-2 text-xs font-medium disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Claim listing</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
