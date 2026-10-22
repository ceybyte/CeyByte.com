import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { Slot } from "radix-ui";
import { Kbd } from "@/components/brand/kbd";
import { cn } from "@/lib/utils";

// 03-DESIGN §8.1. min-height (never fixed height) so Sinhala/Tamil line-heights never clip.
const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-sm font-medium whitespace-nowrap select-none",
    "transition-[transform,background-color,border-color,color] duration-[var(--dur-press)] ease-out",
    "active:scale-[.97] disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  ],
  {
    variants: {
      variant: {
        // The one loud action per viewport (CLAUDE.md §6). Focus ring switches to --text so it shows on green.
        primary:
          "bg-primary font-bold text-primary-foreground hover:bg-primary-hover active:bg-primary-press focus-visible:outline-text",
        secondary:
          "border border-hairline bg-surface text-text hover:border-azure/40 hover:bg-surface-elevated",
        ghost: "text-text hover:bg-surface-elevated",
        link: "h-auto min-h-0 px-0 text-azure-text underline-offset-4 hover:underline active:scale-100",
        destructive: "border border-error text-error hover:bg-error hover:text-white",
        // Donate page primary only (03-DESIGN §2.2).
        gold: "bg-gold font-bold text-inverse hover:brightness-105",
      },
      size: {
        sm: "min-h-8 px-3 py-1 text-sm",
        md: "min-h-10 px-4 py-2 text-sm",
        lg: "min-h-12 px-6 py-2.5 text-base",
        xl: "min-h-14 px-8 py-3 text-lg", // hero only
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Replaces the leading icon with a spinner, keeps the width, sets aria-busy. */
    loading?: boolean;
    /** Keyboard shortcut hint shown at the trailing edge (hidden below md). */
    kbd?: string;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  kbd,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  // Slot accepts exactly one child, so links rendered via asChild get no spinner or keycap.
  if (asChild) {
    return (
      <Slot.Root data-slot="button" data-variant={variant} className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }
  return (
    <button
      data-slot="button"
      data-variant={variant}
      aria-busy={loading || undefined}
      className={classes}
      {...props}
      disabled={props.disabled || loading}
    >
      {loading && (
        // Held back 300 ms so quick actions never flash a spinner (hallmark: spinners that flash).
        <span className="spinner-delayed inline-flex" aria-hidden>
          <Loader2 className="animate-spin" />
        </span>
      )}
      {children}
      {kbd && <Kbd className="ml-1 hidden md:inline-flex">{kbd}</Kbd>}
    </button>
  );
}

export { Button, buttonVariants };
