"use client";

import { useDashboard } from "./DashboardShell";
import { SettingsTab } from "./SettingsTab";
import type { ComponentProps } from "react";

type Copy = ComponentProps<typeof SettingsTab>["copy"];

export function SettingsView({ locale, copy }: { locale: string; copy: Copy }) {
  const { listing } = useDashboard();
  return <SettingsTab locale={locale} listing={listing} copy={copy} />;
}
