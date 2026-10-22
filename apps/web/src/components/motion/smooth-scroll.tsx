"use client";

import { useEffect } from "react";

// Lenis smoothing synced to GSAP's ticker (03-DESIGN §9.4). Only on fine pointers without reduced motion;
// loaded lazily so neither library is in the initial bundle. Dialogs and sheets mark themselves with
// `data-lenis-prevent` and pause it through the "lenis:stop"/"lenis:start" window events.
export function SmoothScroll() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      const stop = () => lenis.stop();
      const start = () => lenis.start();
      window.addEventListener("lenis:stop", stop);
      window.addEventListener("lenis:start", start);
      cleanup = () => {
        window.removeEventListener("lenis:stop", stop);
        window.removeEventListener("lenis:start", start);
        gsap.ticker.remove(tick);
        lenis.destroy();
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return null;
}
