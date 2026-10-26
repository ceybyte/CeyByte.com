"use client";

import React, { useState } from "react";
import {
  Check,
  Copy,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Search,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SlipPreviewModal } from "./slip-preview-modal";
import {
  approveDonation,
  fetchDonationSlipUrl,
  rejectDonation,
  type AdminDonation,
} from "../api";

export interface DonationsQueueProps {
  initialDonations: AdminDonation[];
  total: number;
  onRefresh?: () => void;
}

const REJECT_REASONS = [
  "Amount doesn't match",
  "Slip unreadable",
  "Duplicate",
  "Not found in statement",
  "Other",
] as const;

export function DonationsQueue({
  initialDonations,
  total,
  onRefresh,
}: DonationsQueueProps) {
  const [donations, setDonations] = useState<AdminDonation[]>(initialDonations);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Slip preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSlipUrl, setPreviewSlipUrl] = useState<string | null>(null);
  const [previewContentType, setPreviewContentType] = useState<string | null>(null);
  const [previewRef, setPreviewRef] = useState<string>("");
  const [loadingSlip, setLoadingSlip] = useState(false);

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingDonation, setRejectingDonation] = useState<AdminDonation | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>(REJECT_REASONS[0] || "Amount doesn't match");
  const [customReason, setCustomReason] = useState<string>("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Approve action state
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleCopy = async (val: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(val);
      }
      setCopiedRef(val);
      setTimeout(() => setCopiedRef(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleOpenSlip = async (donation: AdminDonation) => {
    setPreviewRef(donation.referenceCode);
    setLoadingSlip(true);
    setPreviewOpen(true);
    try {
      const data = await fetchDonationSlipUrl(donation.id);
      setPreviewSlipUrl(data.url);
      setPreviewContentType(data.contentType);
    } catch {
      setPreviewSlipUrl(null);
    } finally {
      setLoadingSlip(false);
    }
  };

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await approveDonation(id);
      setDonations((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "approved" as const } : d)),
      );
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to approve donation.");
    } finally {
      setApprovingId(null);
    }
  };

  const openRejectDialog = (donation: AdminDonation) => {
    setRejectingDonation(donation);
    setSelectedReason(REJECT_REASONS[0] || "Amount doesn't match");
    setCustomReason("");
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingDonation) return;
    const finalReason =
      selectedReason === "Other"
        ? customReason.trim() || "Rejected by administrator"
        : selectedReason;

    setIsRejecting(true);
    try {
      await rejectDonation(rejectingDonation.id, finalReason);
      setDonations((prev) =>
        prev.map((d) =>
          d.id === rejectingDonation.id
            ? { ...d, status: "rejected" as const, rejectionReason: finalReason }
            : d,
        ),
      );
      setRejectDialogOpen(false);
      setRejectingDonation(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to reject donation.");
    } finally {
      setIsRejecting(false);
    }
  };

  const filtered = donations.filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchRef = d.referenceCode.toLowerCase().includes(q);
      const matchName = d.displayName?.toLowerCase().includes(q);
      const matchShop = d.merchantShopName?.toLowerCase().includes(q);
      const matchTxn = d.txnReference?.toLowerCase().includes(q);
      return matchRef || matchName || matchShop || matchTxn;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text">
            Donations Queue
          </h2>
          <p className="mt-1 text-xs text-muted">
            Review transfer slips and activate Gold Supporter status.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-hairline bg-surface p-1">
          {[
            { id: "all", label: "All Donations" },
            { id: "pending", label: "Pending Review" },
            { id: "approved", label: "Approved" },
            { id: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${
                statusFilter === tab.id
                  ? "bg-surface-elevated text-azure shadow-xs"
                  : "text-muted hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 size-4 text-muted" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ref, donor, shop, txn..."
          className="pl-9 text-xs"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-hairline bg-surface-elevated/50 font-semibold text-muted">
              <th className="p-3">Reference</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Donor / Shop</th>
              <th className="p-3">Txn Reference</th>
              <th className="p-3">Date</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted">
                  No donations in this queue.
                </td>
              </tr>
            ) : (
              filtered.map((d) => {
                const dateStr = new Date(d.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const formattedAmount = `Rs. ${(d.amountCents / 100).toLocaleString()}`;

                return (
                  <tr
                    key={d.id}
                    className="transition-colors hover:bg-surface-elevated/30"
                  >
                    {/* Reference */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-text">
                        <span>{d.referenceCode}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(d.referenceCode)}
                          className="size-5 text-muted hover:text-text"
                          title="Copy reference"
                        >
                          {copiedRef === d.referenceCode ? (
                            <Check className="size-3 text-azure" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </Button>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="p-3 font-mono font-bold text-azure">
                      {formattedAmount}
                    </td>

                    {/* Donor / Shop */}
                    <td className="p-3">
                      <div>
                        <div className="font-semibold text-text">
                          {d.isAnonymous
                            ? "Anonymous"
                            : d.displayName || "Supporter"}
                        </div>
                        {d.merchantShopName && (
                          <div className="mt-0.5 flex items-center gap-1 font-medium text-gold text-[11px]">
                            <Building2 className="size-3" />
                            <span>{d.merchantShopName}</span>
                          </div>
                        )}
                        {d.publicMessage && (
                          <div className="mt-1 flex items-start gap-1 text-[11px] text-muted italic line-clamp-1">
                            <MessageSquare className="size-3 shrink-0 mt-0.5" />
                            <span>{d.publicMessage}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Txn Reference */}
                    <td className="p-3 font-mono text-muted">
                      {d.txnReference || "—"}
                    </td>

                    {/* Date */}
                    <td className="p-3 text-muted">{dateStr}</td>

                    {/* Status */}
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold uppercase ${
                          d.status === "approved"
                            ? "border border-azure/30 bg-azure/10 text-azure"
                            : d.status === "rejected"
                              ? "border border-error/30 bg-error/10 text-error"
                              : "border border-gold/40 bg-gold/10 text-gold"
                        }`}
                      >
                        {d.status === "approved" && <CheckCircle2 className="size-3" />}
                        {d.status === "rejected" && <XCircle className="size-3" />}
                        {d.status === "pending" && <Clock className="size-3" />}
                        {d.status === "pending" ? "Pending Review" : d.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {d.slipKey && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenSlip(d)}
                            className="gap-1 text-[11px]"
                          >
                            <Eye className="size-3.5" />
                            View Slip
                          </Button>
                        )}

                        {d.status === "pending" && (
                          <>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleApprove(d.id)}
                              loading={approvingId === d.id}
                              className="gap-1 border-gold/40 text-gold hover:bg-gold/10 text-[11px]"
                            >
                              <Check className="size-3.5" />
                              Approve
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openRejectDialog(d)}
                              className="text-[11px] text-muted hover:text-error"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Slip Preview Modal */}
      <SlipPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        slipUrl={previewSlipUrl}
        contentType={previewContentType}
        referenceCode={previewRef}
      />

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-error">
              <AlertTriangle className="size-5" />
              Reject Donation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted">
              Select the reason why donation{" "}
              <strong className="text-text">
                {rejectingDonation?.referenceCode}
              </strong>{" "}
              is being rejected.
            </p>

            <div className="space-y-2">
              {REJECT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className="flex cursor-pointer items-center gap-2 rounded border border-hairline p-2 text-xs hover:bg-surface-elevated"
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="accent-azure"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {selectedReason === "Other" && (
              <Input
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Explain why this slip cannot be accepted..."
                className="text-xs"
              />
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              loading={isRejecting}
              onClick={handleConfirmReject}
            >
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
