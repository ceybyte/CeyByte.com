"use client";

import { MotionConfig } from "motion/react";

// Every Motion animation honours prefers-reduced-motion (03-DESIGN §9.7).
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
