"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// 03-DESIGN §3: dark by default, light opt-in, no system following.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem={false}
      themes={["dark", "light"]}
      storageKey="cb_theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
