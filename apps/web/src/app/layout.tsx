import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { fontVariables } from "./fonts";
import "./globals.css";

// Locale routing, header and footer arrive in Phase 3.
export const metadata: Metadata = {
  title: "CB POS",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
