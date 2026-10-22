"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";
import type { HairlineProps } from "@lucasmarkes/hairline/react";
import { cn } from "@/lib/utils";

// Hairline figures used by the site (03-DESIGN §9.6). Each one loads lazily on its own.
const FIGURES = {
  keyboard: dynamic(() => import("@lucasmarkes/hairline/react").then((m) => m.Keyboard), { ssr: false }),
  exploded: dynamic(() => import("@lucasmarkes/hairline/react").then((m) => m.Exploded), { ssr: false }),
  padlock: dynamic(() => import("@lucasmarkes/hairline/react").then((m) => m.Padlock), { ssr: false }),
  patch: dynamic(() => import("@lucasmarkes/hairline/react").then((m) => m.Patch), { ssr: false }),
  vault: dynamic(() => import("@lucasmarkes/hairline/react").then((m) => m.Vault), { ssr: false }),
  hub: dynamic(() => import("@lucasmarkes/hairline/react").then((m) => m.Hub), { ssr: false }),
  branches: dynamic(() => import("@lucasmarkes/hairline/react").then((m) => m.Branches), { ssr: false }),
  plug: dynamic(() => import("@lucasmarkes/hairline/react").then((m) => m.Plug), { ssr: false }),
  basket: dynamic(() => import("@lucasmarkes/hairline/react").then((m) => m.Basket), { ssr: false }),
  query: dynamic(() => import("@lucasmarkes/hairline/react").then((m) => m.Query), { ssr: false }),
  router: dynamic(() => import("@lucasmarkes/hairline/react").then((m) => m.Router), { ssr: false }),
} as const;

export type FigureName = keyof typeof FIGURES;

type FigureProps = {
  name: FigureName;
  /** Translated accessible name; omit when the figure is decorative next to text that carries the meaning. */
  label?: string;
  intensity?: number;
  className?: string;
};

export function Figure({ name, label, intensity = 0.4, className }: FigureProps) {
  const reduce = useReducedMotion();
  const Component = FIGURES[name] as React.ComponentType<HairlineProps>;
  return (
    <div className={cn("hairline-scope", className)} aria-hidden={label ? undefined : true}>
      <Component
        intensity={reduce ? 0 : intensity}
        play={false}
        {...(label ? { "aria-label": label } : {})}
      />
    </div>
  );
}
