import { cn } from "@/lib/utils";

// 9×9 `+` registration mark placed on grid-line crossings (03-DESIGN §5.3). Max 4 per section.
export function Crosshair({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 9 9"
      aria-hidden
      className={cn("text-hairline pointer-events-none absolute size-[9px]", className)}
    >
      <path d="M4.5 0v9M0 4.5h9" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
