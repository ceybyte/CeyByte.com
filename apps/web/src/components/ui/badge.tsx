import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils";

// 03-DESIGN §8.5. min-height + py so Sinhala/Tamil labels never clip; colour is never the only signal.
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium whitespace-nowrap [&>svg]:size-3 [&>svg]:shrink-0 [:lang(si)_&]:py-1 [:lang(ta)_&]:py-1",
  {
    variants: {
      variant: {
        neutral: "border-hairline bg-surface text-text",
        supporter: "border-gold/40 bg-gold/10 text-gold-text",
        version: "border-hairline font-mono text-muted",
        locale: "border-hairline px-1.5 font-mono text-[0.6875rem] text-muted",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

const STATUS_DOT = {
  open: "bg-azure",
  triaged: "bg-muted",
  planned: "bg-warning",
  in_progress: "bg-azure",
  shipped: "bg-success",
  closed: "bg-muted",
  duplicate: "bg-muted",
  wont_fix: "bg-muted",
} as const;

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    /** Ticket status: renders a 6px dot before the (translated) label. */
    status?: keyof typeof STATUS_DOT;
  };

function Badge({ className, variant, status, children, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props}>
      {variant === "supporter" && <Award aria-hidden strokeWidth={1.5} />}
      {status && <span aria-hidden className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
