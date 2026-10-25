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
    <div className="max-w-xl mx-auto py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-full bg-muted/60 border border-border mx-auto flex items-center justify-center mb-5 text-muted-foreground">
        <Store className="w-7 h-7 text-cyan-400" />
      </div>

      <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">
        {copy.emptyTitle}
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-8">
        {copy.emptyBody}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href={`/${locale}/download`}
          className="w-full sm:w-auto px-5 py-2.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border rounded text-sm font-medium transition flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Download CB POS</span>
        </Link>

        <button
          type="button"
          onClick={() => setShowClaimModal(true)}
          className="w-full sm:w-auto px-5 py-2.5 bg-muted/60 hover:bg-muted text-foreground border border-border rounded text-sm font-medium transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Phone className="w-4 h-4 text-muted-foreground" />
          <span>Claim with phone number</span>
        </button>
      </div>

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 text-left shadow-2xl">
            <h3 className="text-base font-bold text-foreground mb-1">
              Claim your shop listing
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Enter the phone number you used when downloading CB POS to link your shop to this account.
            </p>

            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div>
                <label htmlFor="claim-phone-input" className="block text-xs uppercase font-mono tracking-wider text-muted-foreground mb-1">
                  Registered phone number
                </label>
                <input
                  id="claim-phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="077 123 4567"
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:border-cyan-400"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2 rounded">
                  {errorMsg}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="px-4 py-2 border border-border rounded text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !phone.trim()}
                  className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border rounded text-xs font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
