"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type ThemeToggleProps = { toLight: string; toDark: string };

// The page colours switch instantly; only the icon rotates (03-DESIGN §9.2).
export function ThemeToggle({ toLight, toDark }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dark = !mounted || resolvedTheme !== "light";
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={dark ? toLight : toDark}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <span
        key={dark ? "sun" : "moon"}
        className="motion-safe:animate-in motion-safe:spin-in-90 motion-safe:fade-in-0 duration-200 ease-out"
      >
        {dark ? <Sun strokeWidth={1.5} /> : <Moon strokeWidth={1.5} />}
      </span>
    </Button>
  );
}
