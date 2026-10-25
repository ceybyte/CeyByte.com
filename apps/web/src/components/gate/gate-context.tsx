"use client";

import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { Step1ShopData } from "@cbpos/shared/schemas/download-gate";

export type GateStep = 1 | 2 | "done";

export interface GateReleaseData {
  version: string;
  exe_name: string;
  exe_size: number;
  exe_sha256: string;
  notes_md?: string;
}

export interface GateDownloadResult {
  downloadUrl: string;
  claimToken: string;
  release: GateReleaseData | null;
}

interface GateContextValue {
  isOpen: boolean;
  step: GateStep;
  openGate: (step?: GateStep) => void;
  closeGate: () => void;
  setStep: (step: GateStep) => void;
  step1Draft: Partial<Step1ShopData> | null;
  setStep1Draft: (draft: Partial<Step1ShopData> | null) => void;
  downloadResult: GateDownloadResult | null;
  setDownloadResult: (res: GateDownloadResult | null) => void;
}

const GateContext = createContext<GateContextValue | null>(null);

const STORAGE_KEY = "cb_gate_draft_s1";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1] ?? "") : null;
}

function SearchParamsSync({ onDownloadParam }: { onDownloadParam: () => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("download") === "1") {
      onDownloadParam();
    }
  }, [searchParams, onDownloadParam]);
  return null;
}

export function GateProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<GateStep>(1);
  const [step1Draft, setStep1DraftState] = useState<Partial<Step1ShopData> | null>(null);
  const [downloadResult, setDownloadResult] = useState<GateDownloadResult | null>(null);

  // Restore Step 1 draft from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        setStep1DraftState(JSON.parse(saved));
      }
    } catch {
      // ignore storage access errors
    }
  }, []);

  const setStep1Draft = useCallback((draft: Partial<Step1ShopData> | null) => {
    setStep1DraftState(draft);
    try {
      if (draft) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const openGate = useCallback((targetStep?: GateStep) => {
    // If user has returning visitor cookie cb_gate_done=1, jump straight to What Next unless explicitly requested
    const hasDoneCookie = readCookie("cb_gate_done") === "1";
    if (targetStep) {
      setStep(targetStep);
    } else if (hasDoneCookie) {
      setStep("done");
    } else {
      setStep(1);
    }
    setIsOpen(true);
  }, []);

  const closeGate = useCallback(() => {
    setIsOpen(false);
    // Remove ?download=1 query param if present
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("download")) {
        url.searchParams.delete("download");
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    }
  }, []);

  // Pause Lenis smooth scroll while gate modal is open
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isOpen) {
      window.dispatchEvent(new Event("lenis:stop"));
    } else {
      window.dispatchEvent(new Event("lenis:start"));
    }
    return () => {
      window.dispatchEvent(new Event("lenis:start"));
    };
  }, [isOpen]);

  return (
    <GateContext.Provider
      value={{
        isOpen,
        step,
        openGate,
        closeGate,
        setStep,
        step1Draft,
        setStep1Draft,
        downloadResult,
        setDownloadResult,
      }}
    >
      <React.Suspense fallback={null}>
        <SearchParamsSync onDownloadParam={openGate} />
      </React.Suspense>
      {children}
    </GateContext.Provider>
  );
}

export function useGate() {
  const ctx = useContext(GateContext);
  if (!ctx) {
    throw new Error("useGate must be used within a GateProvider");
  }
  return ctx;
}
