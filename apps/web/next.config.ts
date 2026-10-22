import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Production builds are a static export served by Workers Static Assets (02-TRD §1, D1).
// In development, /api/* is proxied to the Worker on :8787 so the browser sees one origin.
const nextConfig: NextConfig = {
  output: isDev ? undefined : "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  ...(isDev && {
    async rewrites() {
      return [
        { source: "/api/:path*", destination: "http://localhost:8787/api/:path*" },
        { source: "/ingest/:path*", destination: "http://localhost:8787/ingest/:path*" },
      ];
    },
  }),
};

export default nextConfig;
