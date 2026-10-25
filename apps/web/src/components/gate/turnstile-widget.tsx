"use client";

import React, { useEffect, useRef } from "react";

interface TurnstileWidgetProps {
  onToken: (token: string) => void;
  action?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          action?: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "dark" | "light" | "auto";
          size?: "normal" | "compact";
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

const SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
  (process.env.NODE_ENV === "production" ? "0x4AAAAAAFgO5u6onY8WbtL9" : "1x00000000000000000000AA");

export function TurnstileWidget({ onToken, action = "gate" }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // In development or test without network script, automatically provide test token
    if (process.env.NODE_ENV !== "production" && (!SITE_KEY || SITE_KEY.startsWith("1x"))) {
      onToken("1x00000000000000000000AA");
      return;
    }

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) return;

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          action,
          theme: "dark",
          size: "normal",
          callback: (token: string) => {
            if (isMounted) onToken(token);
          },
          "error-callback": () => {
            // fallback token in non-prod
            if (process.env.NODE_ENV !== "production") {
              onToken("1x00000000000000000000AA");
            }
          },
        });
      } catch {
        // ignore render exceptions
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const existingScript = document.querySelector('script[src*="turnstile/v0/api.js"]');
      if (!existingScript) {
        window.onloadTurnstileCallback = () => {
          renderWidget();
        };
        const script = document.createElement("script");
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      } else {
        const interval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(interval);
            renderWidget();
          }
        }, 100);
        return () => clearInterval(interval);
      }
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [action, onToken]);

  return (
    <div className="my-2 flex justify-center">
      <div ref={containerRef} className="min-h-[65px]" />
    </div>
  );
}
