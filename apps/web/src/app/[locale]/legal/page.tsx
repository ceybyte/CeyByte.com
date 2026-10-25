import { redirect } from "next/navigation";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "si" }, { locale: "ta" }];
}

interface LegalIndexProps {
  params: Promise<{ locale: string }>;
}

export default async function LegalIndexPage({ params }: LegalIndexProps) {
  const { locale } = await params;
  redirect(`/${locale}/legal/terms`);
}
