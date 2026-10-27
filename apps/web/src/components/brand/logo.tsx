import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { height: 18, width: 106, badge: "text-[10px] px-1.5 py-0.5" },
  md: { height: 24, width: 142, badge: "text-xs px-2 py-0.5" },
  lg: { height: 32, width: 189, badge: "text-sm px-2.5 py-0.5" },
} as const;

type LogoProps = {
  size?: keyof typeof SIZES;
  showProductBadge?: boolean;
  className?: string;
};

// CeyByte Master Brand Logo with CB POS product badge.
export function Logo({ size = "md", showProductBadge = true, className }: LogoProps) {
  const config = SIZES[size];

  return (
    <span
      role="img"
      aria-label="CeyByte · CB POS"
      className={cn("inline-flex items-center gap-2 select-none", className)}
    >
      {/* Dark Theme Logo (Default) */}
      <Image
        src="/brand/ceybyte-logo-white.webp"
        alt="CeyByte"
        width={config.width}
        height={config.height}
        priority
        className="light:hidden block h-auto w-auto"
        style={{ height: `${config.height}px`, width: "auto" }}
      />
      {/* Light Theme Logo */}
      <Image
        src="/brand/ceybyte-logo-black.webp"
        alt="CeyByte"
        width={config.width}
        height={config.height}
        priority
        className="light:block hidden h-auto w-auto"
        style={{ height: `${config.height}px`, width: "auto" }}
      />

      {showProductBadge && (
        <span
          className={cn(
            "bg-azure/10 text-azure-text border-azure/20 inline-flex items-center rounded border font-mono font-semibold tracking-tight",
            config.badge,
          )}
        >
          CB&nbsp;POS
        </span>
      )}
    </span>
  );
}
