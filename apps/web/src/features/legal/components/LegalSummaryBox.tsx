import { ShieldCheck } from "lucide-react";

interface LegalSummaryBoxProps {
  summary: string;
}

export function LegalSummaryBox({ summary }: LegalSummaryBoxProps) {
  return (
    <aside
      aria-label="Document Summary"
      className="mb-8 rounded-md border border-hairline bg-surface-card p-4 sm:p-5 text-sm"
    >
      <div className="flex items-center gap-2 mb-2 font-mono text-xs font-medium uppercase tracking-wider text-azure">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        <span>Plain-Language Summary</span>
      </div>
      <p className="text-text-muted leading-relaxed">
        {summary}
      </p>
    </aside>
  );
}
