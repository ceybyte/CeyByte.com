import { useId } from "react";

// The slash from the Ceylon Byte CB monogram, filled with the azure brand gradient (03-DESIGN §7.1).
export function LogoSlash({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 203 102" aria-hidden className={className} focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: "var(--azure-300)" }} />
          <stop offset="0.38" style={{ stopColor: "var(--azure-400)" }} />
          <stop offset="0.68" style={{ stopColor: "var(--azure-500)" }} />
          <stop offset="1" style={{ stopColor: "var(--azure-600)" }} />
        </linearGradient>
      </defs>
      <path d="M74 4.5Q77 0 82 0H203L138 102H0Z" fill={`url(#${id})`} />
    </svg>
  );
}
