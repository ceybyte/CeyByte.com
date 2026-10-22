"use client";

import { motion, useReducedMotion } from "motion/react";
import { dur, ease } from "./tokens";

// Section reveal: once, 20% in view. Full transform strings keep it hardware-accelerated (03-DESIGN §9.1).
export function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(16px)" }}
      whileInView={{ opacity: 1, transform: "translateY(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduce ? 0.01 : dur.reveal, ease: ease.out, delay }}
    >
      {children}
    </motion.div>
  );
}
