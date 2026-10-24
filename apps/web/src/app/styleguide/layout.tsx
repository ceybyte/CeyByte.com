import type { Metadata } from "next";
import { MotionProvider } from "@/components/motion/motion-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { fontVariables } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: "CB POS Styleguide",
};

export default function StyleguideLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <MotionProvider>{children}</MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
