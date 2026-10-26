"use client";

import React, { useEffect, useState } from "react";
import { HeartHandshake, Settings, Inbox, Loader2 } from "lucide-react";
import { DonationsQueue } from "./donations-queue";
import { DonationSettings } from "./donation-settings";
import {
  fetchAdminDonations,
  fetchDonationPaymentSettings,
  type AdminDonation,
} from "../api";
import type { DonationPaymentOptionItem } from "@cbpos/shared";

export function AdminDonationsPortal() {
  const [activeTab, setActiveTab] = useState<"queue" | "settings">("queue");
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [settings, setSettings] = useState<DonationPaymentOptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [donationsRes, settingsRes] = await Promise.all([
        fetchAdminDonations(),
        fetchDonationPaymentSettings(),
      ]);
      setDonations(donationsRes.items || []);
      setSettings(settingsRes || []);
    } catch (err: any) {
      setError(err.message || "Failed to load donations portal data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingCount = donations.filter((d) => d.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
            <HeartHandshake className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text">
              Donations & Payment Management
            </h1>
            <p className="text-xs text-muted">
              Review transfer slips, approve Gold Supporter badges, and manage bank accounts.
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 rounded-lg border border-hairline bg-surface p-1">
          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "queue"
                ? "bg-surface-elevated text-azure shadow-xs"
                : "text-muted hover:text-text"
            }`}
          >
            <Inbox className="size-3.5" />
            Queue
            {pendingCount > 0 && (
              <span className="rounded-full bg-gold/20 px-1.5 py-0.2 font-mono text-[10px] font-bold text-gold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "settings"
                ? "bg-surface-elevated text-azure shadow-xs"
                : "text-muted hover:text-text"
            }`}
          >
            <Settings className="size-3.5" />
            Payment Settings
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-azure" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-error/40 bg-error/10 p-6 text-center text-xs text-error">
          <p>{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="mt-3 text-xs underline hover:no-underline font-semibold"
          >
            Try reloading
          </button>
        </div>
      ) : activeTab === "queue" ? (
        <DonationsQueue
          initialDonations={donations}
          total={donations.length}
          onRefresh={loadData}
        />
      ) : (
        <DonationSettings
          initialSettings={settings}
          onSaved={(newSettings) => setSettings(newSettings)}
        />
      )}
    </div>
  );
}
