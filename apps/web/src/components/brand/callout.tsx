import { AlertTriangle, Info, Landmark, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  tip: { icon: Info, tone: "border-azure/40 [&_svg]:text-azure-text" },
  warn: { icon: AlertTriangle, tone: "border-warning/40 [&_svg]:text-warning-text" },
  danger: { icon: OctagonAlert, tone: "border-error/40 [&_svg]:text-error" },
  tax: { icon: Landmark, tone: "border-warning/40 [&_svg]:text-warning-text" },
} as const;

type CalloutProps = {
  variant?: keyof typeof VARIANTS;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

// 1px border on all sides in the variant tone; never a thick side stripe (impeccable craft floor, ADR-0017).
export function Callout({ variant = "tip", title, children, className }: CalloutProps) {
  const { icon: Icon, tone } = VARIANTS[variant];
  return (
    <aside className={cn("bg-surface flex gap-3 rounded-md border p-4", tone, className)}>
      <Icon aria-hidden strokeWidth={1.5} className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 text-sm">
        {title && <p className="text-text mb-1 font-semibold">{title}</p>}
        <div className="text-muted [&_a]:text-azure-text [&_a]:underline">{children}</div>
      </div>
    </aside>
  );
}
