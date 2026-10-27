/**
 * Canonical Latest CB POS Application Version.
 * Single source of truth across web marketing, download gates, and feedback forms.
 */
export const LATEST_APP_VERSION = "1.3.0";

export const APP_VERSION_OPTIONS = [
  { value: LATEST_APP_VERSION, label: `v${LATEST_APP_VERSION} (Latest)` },
  { value: "1.2.5", label: "v1.2.5" },
  { value: "1.2.2", label: "v1.2.2" },
  { value: "unknown", label: "I'm not sure" },
] as const;
