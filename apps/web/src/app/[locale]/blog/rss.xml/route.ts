import { routing } from "@/i18n/routing";
import { getBlogPosts } from "@/features/blog/source";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const posts = getBlogPosts(locale);

  const siteUrl = "https://ceybyte.com";
  const channelTitle =
    locale === "si"
      ? "CeyByte POS බ්ලොග් අඩවිය"
      : locale === "ta"
        ? "CeyByte POS வலைப்பதிவு"
        : "CeyByte POS Blog";

  const channelDesc =
    locale === "si"
      ? "පැහැදිලි බසින් නිකුත් කිරීම් සටහන්, බදු වෙනස්කම් පැහැදිලි කිරීම් සහ CB POS වෙළඳසැල් අත්දැකීම්."
      : locale === "ta"
        ? "எளிய மொழியில் வெளியீட்டுக் குறிப்புகள், வரி மாற்றங்களின் விளக்கம் மற்றும் CB POS கடைகளின் கதைகள்."
        : "Release notes in plain language, tax changes explained, and stories from shops using CB POS.";

  const feedUrl = `${siteUrl}/${locale}/blog/rss.xml`;
  const blogUrl = `${siteUrl}/${locale}/blog`;

  const itemsXml = posts
    .map((post) => {
      const postUrl = `${siteUrl}/${locale}/blog/${post.slug}`;
      const pubDate = post.publishedAt
        ? new Date(post.publishedAt).toUTCString()
        : new Date().toUTCString();

      const categoriesXml = post.tags
        .map((tag) => `<category>${escapeXml(tag)}</category>`)
        .join("\n      ");

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${post.excerpt}]]></description>
      ${categoriesXml}
    </item>`;
    })
    .join("\n");

  const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${blogUrl}</link>
    <description>${escapeXml(channelDesc)}</description>
    <language>${locale}</language>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

  return new Response(rssXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
