"use client";

import React, { useState } from "react";
import { X, Eye, ShieldAlert, Check, Loader2, MapPin, Store, Phone } from "lucide-react";
import { AdminMerchant, revealMerchantContact, updateMerchant } from "../api";
import { toast } from "sonner";

interface MerchantDrawerProps {
  merchant: AdminMerchant | null;
  onClose: () => void;
  onUpdate: (updated: AdminMerchant) => void;
}

export function MerchantDrawer({ merchant, onClose, onUpdate }: MerchantDrawerProps) {
  const [revealedContacts, setRevealedContacts] = useState<{
    phone?: string;
    whatsapp?: string | null;
    telegram?: string | null;
  } | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState<"listed" | "hidden" | "rejected">(
    merchant?.status ?? "listed",
  );
  const [isSupporter, setIsSupporter] = useState(merchant?.isSupporter ?? false);
  const [isPublicOnMap, setIsPublicOnMap] = useState(merchant?.isPublicOnMap ?? false);

  if (!merchant) return null;

  async function handleReveal() {
    if (!merchant) return;
    setRevealing(true);
    try {
      const data = await revealMerchantContact(merchant.id);
      setRevealedContacts({
        phone: data.phone,
        whatsapp: data.whatsapp,
        telegram: data.telegram,
      });
      toast.success("Contact revealed. Action logged to audit trail.");
    } catch (err: any) {
      toast.error(err.message || "Failed to reveal contact");
    } finally {
      setRevealing(false);
    }
  }

  async function handleSave() {
    if (!merchant) return;
    setSaving(true);
    try {
      const updated = await updateMerchant(merchant.id, {
        status,
        isSupporter,
        isPublicOnMap,
      });
      toast.success("Merchant updated successfully");
      onUpdate(updated);
    } catch (err: any) {
      toast.error(err.message || "Failed to update merchant");
    } finally {
      setSaving(false);
    }
  }

  const phoneDisplay = revealedContacts?.phone ?? merchant.phone ?? "—";
  const whatsappDisplay = revealedContacts ? revealedContacts.whatsapp ?? "—" : merchant.whatsapp ?? "—";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Merchant details"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-hairline bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-hairline pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-azure" />
              <h2 className="text-base font-bold text-text-primary">{merchant.shopName}</h2>
            </div>
            <p className="mt-1 font-mono text-xs text-text-muted">ID: {merchant.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-text-muted transition-colors hover:text-text-primary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5 overflow-y-auto py-4">
          {/* Location info */}
          <div className="rounded-md border border-hairline bg-canvas p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
              <MapPin className="h-3.5 w-3.5 text-azure" />
              <span>Location</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-text-muted">District:</span>
                <span className="ml-1 font-medium capitalize text-text-primary">{merchant.district}</span>
              </div>
              <div>
                <span className="text-text-muted">City:</span>
                <span className="ml-1 font-medium text-text-primary">{merchant.city}</span>
              </div>
              <div className="col-span-2 text-[11px] font-mono text-text-muted">
                Coordinates: {merchant.lat.toFixed(4)}, {merchant.lng.toFixed(4)}
              </div>
            </div>
          </div>

          {/* Contact (Audited reveal) */}
          <div className="rounded-md border border-hairline bg-canvas p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                <Phone className="h-3.5 w-3.5 text-azure" />
                <span>Contact Details</span>
              </div>
              {!revealedContacts && (
                <button
                  type="button"
                  onClick={handleReveal}
                  disabled={revealing}
                  className="inline-flex items-center gap-1 rounded border border-hairline bg-surface-elevated px-2 py-1 text-[11px] font-medium text-azure hover:bg-surface"
                >
                  {revealing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                  <span>Reveal contact (logged)</span>
                </button>
              )}
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div>
                <span className="text-text-muted">Owner Name:</span>
                <span className="ml-2 font-medium text-text-primary">{merchant.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-text-muted">Phone:</span>
                  <span className="ml-2 font-mono text-text-primary">{phoneDisplay}</span>
                </div>
                {revealedContacts && (
                  <span className="rounded bg-azure/10 px-1.5 py-0.5 text-[10px] text-azure">Revealed</span>
                )}
              </div>
              {merchant.whatsapp && (
                <div>
                  <span className="text-text-muted">WhatsApp:</span>
                  <span className="ml-2 font-mono text-text-primary">{whatsappDisplay}</span>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4 rounded-md border border-hairline bg-canvas p-3">
            <h3 className="text-xs font-semibold text-text-primary">Status & Listing</h3>

            {/* Status select */}
            <div>
              <label htmlFor="merchant-status-select" className="block text-xs text-text-muted">
                Status
              </label>
              <select
                id="merchant-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="mt-1 w-full rounded border border-hairline bg-surface p-2 text-xs text-text-primary focus:border-azure focus:outline-none"
              >
                <option value="listed">Listed (Active)</option>
                <option value="hidden">Hidden</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Supporter toggle */}
            <div className="flex items-center justify-between border-t border-hairline pt-3">
              <div>
                <span className="block text-xs font-medium text-text-primary">Supporter Badge</span>
                <span className="text-[11px] text-text-muted">Marks shop as verified backer</span>
              </div>
              <input
                type="checkbox"
                checked={isSupporter}
                onChange={(e) => setIsSupporter(e.target.checked)}
                className="h-4 w-4 rounded accent-azure"
              />
            </div>

            {/* Public on map toggle */}
            <div className="flex items-center justify-between border-t border-hairline pt-3">
              <div>
                <span className="block text-xs font-medium text-text-primary">Public on Map</span>
                <span className="text-[11px] text-text-muted">Shows pin on /map directory</span>
              </div>
              <input
                type="checkbox"
                checked={isPublicOnMap}
                onChange={(e) => setIsPublicOnMap(e.target.checked)}
                className="h-4 w-4 rounded accent-azure"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-hairline pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-hairline bg-surface-elevated px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded border border-azure/40 bg-azure/10 px-3 py-1.5 text-xs font-medium text-azure hover:bg-azure/20"
          >
            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
            <span>Save changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
