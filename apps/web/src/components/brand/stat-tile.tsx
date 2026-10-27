"use client";

import { useCountUp } from "@/components/motion/use-count-up";
import { cn } from "@/lib/utils";

type StatTileProps = {
  /** Live number, or null while loading / when the API can't answer (then the value is hidden, never guessed). */
  value: number | null;
  /** Formats the counted number, e.g. (n) => `${n}/25`. */
  format?: (n: number) => string;
  label: string;
  badge?: string;
  className?: string;
};

// 03-DESIGN §8.4. Static values (like "0 ms") can pass a formatter that ignores n.
export function StatTile({ value, format = String, label, badge, className }: StatTileProps) {
  const { ref, display } = useCountUp<HTMLParagraphElement>(value ?? 0);
  return (
    <div className={cn("@container flex min-w-0 flex-col justify-between gap-2 p-5", className)}>
      <div>
        {badge && (
          <span className="text-muted/70 mb-2 block font-mono text-[10px] font-semibold tracking-wider uppercase">
            {badge}
          </span>
        )}
        {value === null ? (
          <span
            aria-hidden
            className="bg-surface-elevated block h-[clamp(2rem,1.4rem+2.5vw,3.5rem)] w-24 animate-pulse rounded-sm"
          />
        ) : (
          <p ref={ref} className="text-stat text-text text-[clamp(1.5rem,14cqi,3.5rem)] whitespace-nowrap">
            {format(display)}
          </p>
        )}
      </div>
      <p className="text-muted text-xs leading-relaxed sm:text-sm">{label}</p>
    </div>
  );
}
