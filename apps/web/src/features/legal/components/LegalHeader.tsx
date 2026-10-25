interface LegalHeaderProps {
  title: string;
  updatedDate: string;
  version: string;
}

export function LegalHeader({ title, updatedDate, version }: LegalHeaderProps) {
  return (
    <header className="mb-6 pb-4 border-b border-hairline">
      <h1 className="text-2xl sm:text-3xl font-semibold text-text tracking-tight mb-2">
        {title}
      </h1>
      <p className="font-mono text-xs text-text-muted">
        Last updated {updatedDate} · Version {version}
      </p>
    </header>
  );
}
