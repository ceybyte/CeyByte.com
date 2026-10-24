"use client";

// AnalyticsProvider — initialises PostHog only after the user accepts analytics.
// Proxied through /ingest/* on the Worker so posthog.com is never a CSP domain (02-TRD §3).
// maskAllInputs: true; data-ph-no-capture on contact fields/dashboards (CLAUDE.md §9).
import { useEffect } from "react";
import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const POSTHOG_HOST = "/ingest"; // proxied by the Worker

function initPosthog() {
  if (!POSTHOG_KEY || posthog.__loaded) return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: "https://eu.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    session_recording: {
      maskAllInputs: true,
    },
    mask_all_text: false,
    autocapture: false, // we fire typed events only (04 §7)
    persistence: "localStorage",
  });
}

// Typed capture helper — import from this module, not posthog-js directly.
// Properties must never contain phone, email, full name, WhatsApp, Telegram or IP (04 §0).
type AnalyticsEvent =
  | { name: "cta_download_clicked"; props: { source: string } }
  | { name: "download_gate_opened"; props: { source: string } }
  | { name: "download_gate_step1_completed"; props: { category: string } }
  | { name: "gate_location_detected"; props: { result: "ok" | "denied" | "outside" | "timeout" } }
  | { name: "download_gate_submitted"; props: { district: string; category: string; public: boolean } }
  | { name: "what_next_viewed"; props?: undefined }
  | { name: "hash_copied"; props: { asset: string } }
  | { name: "whatsapp_community_clicked"; props: { location: string } }
  | { name: "claim_listing_clicked"; props?: undefined }
  | { name: "map_loaded"; props: { ms: number; features: number } }
  | { name: "map_pin_opened"; props: { supporter: boolean } }
  | { name: "map_filtered"; props: { district?: string; category?: string; supportersOnly: boolean } }
  | { name: "map_searched"; props: { resultCount: number } }
  | { name: "map_add_shop_clicked"; props: { signedIn: boolean } }
  | { name: "doc_viewed"; props: { slug: string; locale: string; fallback: boolean } }
  | { name: "docs_search_opened"; props?: undefined }
  | { name: "docs_searched"; props: { qLength: number; results: number } }
  | { name: "docs_search_result_clicked"; props: { rank: number } }
  | { name: "doc_feedback"; props: { slug: string; helpful: boolean } }
  | { name: "shortcuts_printed"; props?: undefined }
  | { name: "ticket_form_opened"; props: { source: string } }
  | { name: "ticket_similar_shown"; props: { count: number } }
  | { name: "ticket_duplicate_avoided"; props?: undefined }
  | { name: "ticket_attachment_uploaded"; props: { kind: string } }
  | { name: "ticket_submitted"; props: { type: string; severity: string; hasAttachment: boolean } }
  | { name: "ticket_voted"; props: { direction: "up" | "down" } }
  | { name: "donate_viewed"; props?: undefined }
  | { name: "donate_amount_selected"; props: { amountBand: string } }
  | { name: "donation_created"; props: { method: string } }
  | { name: "donation_slip_uploaded"; props?: undefined }
  | { name: "donation_submitted"; props?: undefined }
  | { name: "auth_viewed"; props: { claim: boolean } }
  | { name: "auth_completed"; props: { method: string } }
  | { name: "listing_updated"; props: { fields: string[] } }
  | { name: "listing_visibility_changed"; props: { public: boolean } }
  | { name: "account_deleted"; props?: undefined }
  | { name: "theme_changed"; props: { theme: string } }
  | { name: "locale_changed"; props: { from: string; to: string } };

export function capture<E extends AnalyticsEvent>(name: E["name"], props?: E["props"]) {
  if (typeof window === "undefined") return;
  if (!posthog.__loaded) return;
  posthog.capture(name, props ?? {});
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Init if consent was given in a previous session.
    const existing = document.cookie.match(/cbpos_consent=([01])/)?.[1];
    if (existing === "1") initPosthog();

    // Also listen for in-session acceptance from ConsentBar.
    function onConsent() {
      initPosthog();
    }
    window.addEventListener("cbpos:consent", onConsent);
    return () => window.removeEventListener("cbpos:consent", onConsent);
  }, []);

  return <>{children}</>;
}
