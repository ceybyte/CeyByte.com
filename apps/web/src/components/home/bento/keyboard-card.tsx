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
  { key: "F6", label: "Hold bill", output: "> Bill 0142 held on register" },
  {
    key: "F12",
    label: "Exact cash",
    output: "> Exact cash Rs. 1,300.00 paid · Drawer kicked · Receipt printed ✓",
  },
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
        (a) =>
          a.key.toLowerCase() === e.key.toLowerCase() ||
          (a.key === "Enter" && e.key === "Enter") ||
          (a.key === "Esc" && e.key === "Escape"),
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
        "border-hairline bg-surface focus-visible:ring-azure/50 group relative flex flex-col justify-between overflow-hidden rounded-[--radius-md] border p-6 transition-colors outline-none focus-visible:ring-1 sm:p-8",
        className,
      )}
    >
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="bg-azure/10 border-azure/20 text-azure flex size-10 items-center justify-center rounded-[--radius-sm] border">
            <KeyboardIcon className="size-5" />
          </div>
          <span className="text-muted font-mono text-[11px] font-semibold tracking-wider">
            KEYBOARD-FIRST CASHIERING
          </span>
        </div>

        <h3 className="text-text mb-3 text-xl font-bold sm:text-2xl">{t("title")}</h3>

        <p className="text-muted mb-6 text-sm leading-relaxed sm:text-base">{t("body")}</p>
      </div>

      {/* Interactive Keycaps Demo */}
      <div className="border-hairline bg-surface-elevated/40 -mx-6 mt-4 -mb-6 space-y-4 rounded-b-[--radius-md] border-t p-6 pt-4 sm:-mx-8 sm:-mb-8 sm:p-8">
        <div className="flex items-center justify-between">
          <p className="text-muted/80 font-mono text-xs">{t("demo")}</p>
          {isFocused && (
            <span className="text-azure bg-azure/10 border-azure/20 animate-pulse rounded-[--radius-sm] border px-2 py-0.5 font-mono text-[10px]">
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
                  "flex cursor-pointer items-center gap-1.5 rounded-[--radius-sm] border px-2.5 py-1.5 font-mono text-xs transition-all select-none",
                  isSelected
                    ? "bg-azure text-text-inverse border-azure font-bold"
                    : "bg-surface-legal text-text border-hairline hover:border-azure/40 hover:bg-surface-elevated",
                )}
              >
                <Kbd
                  className={cn(
                    "py-0.2 px-1",
                    isSelected ? "text-text-inverse border-transparent bg-black/20" : "",
                  )}
                >
                  {action.key}
                </Kbd>
                <span className="hidden text-[11px] opacity-90 sm:inline">{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mini Console Output */}
        <div className="bg-canvas border-hairline text-azure flex min-h-[72px] flex-col justify-end space-y-1 rounded-[--radius-sm] border p-3 font-mono text-xs">
          <div className="text-muted/60 border-hairline/40 flex items-center gap-1 border-b pb-1 text-[10px]">
            <Terminal className="size-3" />
            <span>TILL ACTION LOG</span>
          </div>
          {consoleLog.length === 0 ? (
            <span className="text-muted/60 text-[11px] italic">
              &gt; Click a keycap or focus and press F3 / Enter / F5...
            </span>
          ) : (
            consoleLog.map((line, i) => (
              <p key={i} className="text-azure-text truncate">
                {line}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
