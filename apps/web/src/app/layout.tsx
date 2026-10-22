import type { Metadata } from "next";
import "./globals.css";

// Phase 0 shell. Fonts, theme, locale routing and the header/footer arrive in Phases 1 and 3.
export const metadata: Metadata = {
  title: "CB POS",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
