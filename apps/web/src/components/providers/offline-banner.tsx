"use client";

// Offline banner — shown when navigator.onLine is false.
// 04-APP_FLOW §0: "You're offline. CB POS works offline — this website doesn't."
// Forms keep their state and disable submit (handled per-form).
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const t = useTranslations("site");
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-warning/10 border-warning/30 text-warning-text flex items-center gap-2 border-b px-[--gutter] py-2 text-sm"
    >
      <WifiOff strokeWidth={1.5} className="size-4 shrink-0" />
      <span>{t("offline")}</span>
    </div>
  );
}
