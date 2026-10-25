import { ShieldCheck } from "lucide-react";

interface LegalSummaryBoxProps {
  summary: string;
}

export function LegalSummaryBox({ summary }: LegalSummaryBoxProps) {
  return (
    <aside
      aria-label="Document Summary"
      className="border-hairline bg-surface-card mb-8 rounded-md border p-4 text-sm sm:p-5"
    >
      <div className="text-azure mb-2 flex items-center gap-2 font-mono text-xs font-medium tracking-wider uppercase">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        <span>Plain-Language Summary</span>
      </div>
      <p className="text-text-muted leading-relaxed">{summary}</p>
    </aside>
  );
}
