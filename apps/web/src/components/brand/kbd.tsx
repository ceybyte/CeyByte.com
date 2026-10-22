import { cn } from "@/lib/utils";

type KbdProps = React.ComponentProps<"kbd"> & {
  /** Visually pressed, e.g. when the matching key is held in a keyboard demo. */
  pressed?: boolean;
};

// 03-DESIGN §7.2. Keycaps stay dark in both themes; the inset bottom edge is the only inset shadow allowed.
export function Kbd({ className, pressed = false, ...props }: KbdProps) {
  return (
    <kbd
      data-pressed={pressed || undefined}
      className={cn(
        "bg-kbd border-hairline inline-flex min-h-6 min-w-6 items-center justify-center rounded-sm border px-1.5",
        "font-mono text-xs font-medium text-white shadow-[inset_0_-2px_0_#000]",
        "transition-[transform,box-shadow,border-color] duration-[var(--dur-press)] ease-out",
        "data-pressed:border-azure-text data-pressed:translate-y-px data-pressed:shadow-none",
        className,
      )}
      {...props}
    />
  );
}
