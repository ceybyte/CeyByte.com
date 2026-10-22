import { cn } from "@/lib/utils";

// Architectural grid: 1px lines every --grid-cell, fading out radially (03-DESIGN §5.3).
export function GridCanvas({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "mask-radial-fade pointer-events-none absolute inset-0",
        "[background-image:linear-gradient(to_right,var(--hairline-grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--hairline-grid)_1px,transparent_1px)]",
        "[background-size:var(--grid-cell)_var(--grid-cell)]",
        className,
      )}
    />
  );
}
