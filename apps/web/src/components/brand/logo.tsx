import { cn } from "@/lib/utils";
import { LogoSlash } from "./logo-slash";

const SIZES = { sm: "text-base", md: "text-xl", lg: "text-[2rem]" } as const;

type LogoProps = { size?: keyof typeof SIZES; className?: string };

// `[CB POS]` wordmark (03-DESIGN §7.1). The azure slash stands where the space is; screen readers get "CB POS".
export function Logo({ size = "md", className }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="CB POS"
      className={cn(
        "inline-flex items-center font-mono leading-none font-bold tracking-normal",
        SIZES[size],
        className,
      )}
    >
      <span aria-hidden className="text-muted">
        [
      </span>
      <span aria-hidden className="text-text">
        CB
      </span>
      <LogoSlash className="motion-safe:animate-pulse-dot mx-[0.12em] h-[0.62em] w-auto" />
      <span aria-hidden className="text-text">
        POS
      </span>
      <span aria-hidden className="text-muted">
        ]
      </span>
    </span>
  );
}
