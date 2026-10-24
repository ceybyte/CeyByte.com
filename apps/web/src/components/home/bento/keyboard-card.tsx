"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Keyboard as KeyboardIcon, Terminal } from "lucide-react";
import { Kbd } from "@/components/brand/kbd";
import { cn } from "@/lib/utils";

type KeyAction = {
  key: string;
  label: string;
  output: string;
};

const KEY_ACTIONS: KeyAction[] = [
  { key: "F3", label: "Find item", output: "> Finding item: 'Keeri Samba 5kg' [FOUND]" },
  { key: "Enter", label: "Add to cart", output: "> Added to cart: Keeri Samba 5kg (Rs. 1,300.00)" },
  { key: "F5", label: "Take pay", output: "> Payment menu: [Cash] [Card] [Credit]" },
  { key: "F6", label: "Hold bill", output: "> Bill #0142 held on register" },
  { key: "F12", label: "Exact cash", output: "> Exact cash Rs. 1,300.00 paid · Drawer kicked · Receipt printed ✓" },
  { key: "Esc", label: "Clear", output: "> Action cleared / ready for next sale" },
];

export function KeyboardCard({ className }: { className?: string }) {
  const t = useTranslations("home.bento.keyboard");
  const [activeKey, setActiveKey] = useState<string>("F3");
  const [consoleLog, setConsoleLog] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const triggerKey = (action: KeyAction) => {
    setActiveKey(action.key);
    setConsoleLog((prev) => [...prev.slice(-3), action.output]);
  };

  // Keyboard event listener when interactive container is focused
  useEffect(() => {
    if (!isFocused) return;

    const handler = (e: KeyboardEvent) => {
      const match = KEY_ACTIONS.find(
        (a) => a.key.toLowerCase() === e.key.toLowerCase() || (a.key === "Enter" && e.key === "Enter") || (a.key === "Esc" && e.key === "Escape")
      );
      if (match) {
        e.preventDefault();
        triggerKey(match);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFocused]);

  return (
    <div
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={cn(
        "relative rounded-lg border border-hairline bg-surface p-6 sm:p-8 flex flex-col justify-between overflow-hidden outline-none focus-visible:ring-1 focus-visible:ring-azure/50 transition-colors group",
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="size-10 rounded-md bg-azure/10 border border-azure/20 flex items-center justify-center text-azure">
            <KeyboardIcon className="size-5" />
          </div>
          <span className="font-mono text-[11px] text-muted">ZERO MOUSE DEPENDENCY [B1]</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-text mb-3">
          {t("title")}
        </h3>

        <p className="text-muted text-sm sm:text-base leading-relaxed mb-6">
          {t("body")}
        </p>
      </div>

      {/* Interactive Keycaps Demo */}
      <div className="mt-4 pt-4 border-t border-hairline bg-surface-elevated/40 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-6 sm:p-8 rounded-b-lg space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono text-muted/80">{t("demo")}</p>
          {isFocused && (
            <span className="text-[10px] font-mono text-azure bg-azure/10 px-2 py-0.5 rounded border border-azure/20 animate-pulse">
              KEYBOARD LISTENING
            </span>
          )}
        </div>

        {/* Keycaps Row */}
        <div className="flex flex-wrap gap-2">
          {KEY_ACTIONS.map((action) => {
            const isSelected = activeKey === action.key;
            return (
              <button
                key={action.key}
                type="button"
                onClick={() => triggerKey(action)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition-all text-xs font-mono select-none cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_rgba(57,255,20,0.4)] scale-105"
                    : "bg-[#18181B] text-text border-hairline hover:border-azure/40 hover:bg-[#202024]"
                )}
              >
                <Kbd className={cn("px-1 py-0.2", isSelected ? "bg-black/20 text-primary-foreground border-transparent" : "")}>
                  {action.key}
                </Kbd>
                <span className="hidden sm:inline text-[11px] opacity-90">{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mini Console Output */}
        <div className="rounded bg-[#090a0f] border border-hairline p-3 font-mono text-xs text-azure min-h-[72px] flex flex-col justify-end space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-muted/60 pb-1 border-b border-hairline/40">
            <Terminal className="size-3" />
            <span>TILL ACTION LOG</span>
          </div>
          {consoleLog.length === 0 ? (
            <span className="text-muted/60 text-[11px] italic">&gt; Click a keycap or focus and press F3 / Enter / F5...</span>
          ) : (
            consoleLog.map((line, i) => (
              <p key={i} className="truncate text-azure-text">
                {line}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
