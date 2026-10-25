"use client";

import React, { useState } from "react";
import { X, Eye, Loader2, MapPin, Store, Phone } from "lucide-react";
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

  const [status, setStatus] = useState<"listed" | "hidden" | "rejected">(merchant?.status ?? "listed");
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reveal contact";
      toast.error(msg);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update merchant";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const phoneDisplay = revealedContacts?.phone ?? merchant.phone ?? "—";
  const whatsappDisplay = revealedContacts ? (revealedContacts.whatsapp ?? "—") : (merchant.whatsapp ?? "—");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Merchant details"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="border-hairline bg-surface flex h-full w-full max-w-md flex-col border-l p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-hairline flex items-start justify-between border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Store className="text-azure h-4 w-4" />
              <h2 className="text-text-primary text-base font-bold">{merchant.shopName}</h2>
            </div>
            <p className="text-text-muted mt-1 font-mono text-xs">ID: {merchant.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary rounded p-1 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5 overflow-y-auto py-4">
          {/* Location info */}
          <div className="border-hairline bg-canvas rounded-md border p-3">
            <div className="text-text-primary flex items-center gap-1.5 text-xs font-semibold">
              <MapPin className="text-azure h-3.5 w-3.5" />
              <span>Location</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-text-muted">District:</span>
                <span className="text-text-primary ml-1 font-medium capitalize">{merchant.district}</span>
              </div>
              <div>
                <span className="text-text-muted">City:</span>
                <span className="text-text-primary ml-1 font-medium">{merchant.city}</span>
              </div>
              <div className="text-text-muted col-span-2 font-mono text-[11px]">
                Coordinates: {merchant.lat.toFixed(4)}, {merchant.lng.toFixed(4)}
              </div>
            </div>
          </div>

          {/* Contact (Audited reveal) */}
          <div className="border-hairline bg-canvas rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div className="text-text-primary flex items-center gap-1.5 text-xs font-semibold">
                <Phone className="text-azure h-3.5 w-3.5" />
                <span>Contact Details</span>
              </div>
              {!revealedContacts && (
                <button
                  type="button"
                  onClick={handleReveal}
                  disabled={revealing}
                  className="border-hairline bg-surface-elevated text-azure hover:bg-surface inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-medium"
                >
                  {revealing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                  <span>Reveal contact (logged)</span>
                </button>
              )}
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div>
                <span className="text-text-muted">Owner Name:</span>
                <span className="text-text-primary ml-2 font-medium">{merchant.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-text-muted">Phone:</span>
                  <span className="text-text-primary ml-2 font-mono">{phoneDisplay}</span>
                </div>
                {revealedContacts && (
                  <span className="bg-azure/10 text-azure rounded px-1.5 py-0.5 text-[10px]">Revealed</span>
                )}
              </div>
              {merchant.whatsapp && (
                <div>
                  <span className="text-text-muted">WhatsApp:</span>
                  <span className="text-text-primary ml-2 font-mono">{whatsappDisplay}</span>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="border-hairline bg-canvas space-y-4 rounded-md border p-3">
            <h3 className="text-text-primary text-xs font-semibold">Status & Listing</h3>

            {/* Status select */}
            <div>
              <label htmlFor="merchant-status-select" className="text-text-muted block text-xs">
                Status
              </label>
              <select
                id="merchant-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as "listed" | "hidden" | "rejected")}
                className="border-hairline bg-surface text-text-primary focus:border-azure mt-1 w-full rounded border p-2 text-xs focus:outline-none"
              >
                <option value="listed">Listed (Active)</option>
                <option value="hidden">Hidden</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Supporter toggle */}
            <div className="border-hairline flex items-center justify-between border-t pt-3">
              <div>
                <span className="text-text-primary block text-xs font-medium">Supporter Badge</span>
                <span className="text-text-muted text-[11px]">Marks shop as verified backer</span>
              </div>
              <input
                type="checkbox"
                checked={isSupporter}
                onChange={(e) => setIsSupporter(e.target.checked)}
                className="accent-azure h-4 w-4 rounded"
              />
            </div>

            {/* Public on map toggle */}
            <div className="border-hairline flex items-center justify-between border-t pt-3">
              <div>
                <span className="text-text-primary block text-xs font-medium">Public on Map</span>
                <span className="text-text-muted text-[11px]">Shows pin on /map directory</span>
              </div>
              <input
                type="checkbox"
                checked={isPublicOnMap}
                onChange={(e) => setIsPublicOnMap(e.target.checked)}
                className="accent-azure h-4 w-4 rounded"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-hairline flex items-center justify-end gap-2 border-t pt-4">
          <button
            type="button"
            onClick={onClose}
            className="border-hairline bg-surface-elevated text-text-muted hover:text-text-primary rounded border px-3 py-1.5 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="border-azure/40 bg-azure/10 text-azure hover:bg-azure/20 inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium"
          >
            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
            <span>Save changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
