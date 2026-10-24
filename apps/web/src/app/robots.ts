export const dynamic = "force-static";

import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ceybyte.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Admin console is not publicly crawlable.
        disallow: ["/admin/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
