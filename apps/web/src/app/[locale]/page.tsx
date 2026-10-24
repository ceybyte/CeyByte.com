import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-[--content-max] px-[--gutter] py-12">
      <h1 className="text-3xl font-bold tracking-tight">CB&nbsp;POS</h1>
      <p className="text-muted mt-4">Free point-of-sale for Sri Lankan shops.</p>
    </div>
  );
}
