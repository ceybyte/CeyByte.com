"use client";

import { useInView, useMotionValueEvent, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { spring } from "./tokens";

// Counts from 0 to `value` once the element is in view; shows the final value at once under reduced motion.
export function useCountUp<T extends HTMLElement>(value: number) {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const motionValue = useSpring(0, spring.number);
  const [display, setDisplay] = useState(reduce ? value : 0);

  useMotionValueEvent(motionValue, "change", (v) => setDisplay(Math.round(v)));

  useEffect(() => {
    if (reduce) setDisplay(value);
    else if (inView) motionValue.set(value);
  }, [inView, reduce, value, motionValue]);

  return { ref, display };
}
