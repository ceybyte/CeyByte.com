interface LegalHeaderProps {
  title: string;
  updatedDate: string;
  version: string;
}

export function LegalHeader({ title, updatedDate, version }: LegalHeaderProps) {
  return (
    <header className="border-hairline mb-6 border-b pb-4">
      <h1 className="text-text mb-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="text-text-muted font-mono text-xs">
        Last updated {updatedDate} · Version {version}
      </p>
    </header>
  );
}
