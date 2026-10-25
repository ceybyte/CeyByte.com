import React from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAllLegalSlugs, getLegalDoc } from "@/features/legal/content";
import { LegalNav } from "@/features/legal/components/LegalNav";
import { LegalHeader } from "@/features/legal/components/LegalHeader";
import { LegalSummaryBox } from "@/features/legal/components/LegalSummaryBox";

interface LegalPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export function generateStaticParams() {
  const locales = ["en", "si", "ta"];
  const slugs = getAllLegalSlugs();
  const params: { locale: string; slug: string }[] = [];

  for (const locale of locales) {
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }

  return params;
}

export async function generateMetadata({ params }: LegalPageProps) {
  const { locale, slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) return {};

  const t = await getTranslations({ locale });
  const title = t(doc.titleKey as Parameters<typeof t>[0]);

  return {
    title: `${title} | CB\u00A0POS`,
    description: `Official ${title} for CB\u00A0POS and Ceylon Byte platform services.`,
  };
}

export default async function LegalSlugPage({ params }: LegalPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const doc = getLegalDoc(slug);
  if (!doc) {
    notFound();
  }

  const t = await getTranslations({ locale });
  const title = t(doc.titleKey as Parameters<typeof t>[0]);
  const summary = t(doc.summaryKey as Parameters<typeof t>[0]);
  const prevailsNotice = t("legal.prevails");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start gap-8 md:flex-row lg:gap-12">
        {/* Sticky vertical navigation sidebar */}
        <aside className="w-full shrink-0 md:sticky md:top-24 md:w-60 lg:w-64">
          <div className="mb-3 px-3">
            <span className="text-text-muted font-mono text-xs tracking-wider uppercase">Legal Center</span>
          </div>
          <LegalNav locale={locale} activeSlug={doc.slug} />
        </aside>

        {/* Document Content Area */}
        <main className="max-w-3xl min-w-0 flex-1">
          <LegalHeader title={title} updatedDate={doc.updatedDate} version={doc.version} />

          <LegalSummaryBox summary={summary} />

          <article className="text-text space-y-8 text-sm leading-relaxed">
            {doc.sections.map((section) => (
              <section key={section.id} id={section.id} className="space-y-3">
                <h2 className="text-text text-base font-semibold tracking-tight">{section.heading}</h2>
                {section.paragraphs.map((p, idx) => (
                  <p key={idx} className="text-text-muted leading-relaxed">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </article>

          {/* Trailing notice: English version prevails */}
          <footer className="border-hairline mt-12 border-t pt-6">
            <p className="text-text-muted/80 font-mono text-xs">{prevailsNotice}</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
