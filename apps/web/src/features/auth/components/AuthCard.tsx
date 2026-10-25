"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { EmailOtpForm } from "./EmailOtpForm";
import { Crosshair } from "@/components/brand/crosshair";
import { LogoSlash } from "@/components/brand/logo-slash";
import { Loader2 } from "lucide-react";

interface AuthCardProps {
  locale: string;
  hasClaimContext: boolean;
  redirectTo?: string;
  copy: {
    signinTitle: string;
    signupTitle: string;
    claimContext: string;
    google: string;
    or: string;
    emailLabel: string;
    sendOtp: string;
    otpSent: string;
    otpLabel: string;
    submit: string;
    switchToSignup: string;
    switchToSignin: string;
    invalidCode: string;
    resend: string;
    banned: string;
  };
}

export function AuthCard({ locale, hasClaimContext, redirectTo, copy }: AuthCardProps) {
  const [mode, setMode] = useState<"signin" | "signup">(hasClaimContext ? "signup" : "signin");
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: redirectTo || `/${locale}/dashboard`,
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-[420px] mx-auto bg-card border border-border rounded-lg p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
      {/* Corner crosshairs */}
      <Crosshair className="-top-[4.5px] -left-[4.5px]" />
      <Crosshair className="-top-[4.5px] -right-[4.5px]" />
      <Crosshair className="-bottom-[4.5px] -left-[4.5px]" />
      <Crosshair className="-bottom-[4.5px] -right-[4.5px]" />

      {/* Header with Logo */}
      <div className="flex flex-col items-center text-center mb-6">
        <Link href={`/${locale}`} className="inline-block mb-3">
          <LogoSlash className="h-6 w-auto" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {mode === "signin" ? copy.signinTitle : copy.signupTitle}
        </h1>

        {hasClaimContext ? (
          <div className="mt-2.5 p-2.5 rounded bg-cyan-950/40 border border-cyan-800/60 text-left">
            <p className="text-xs text-cyan-200 leading-relaxed font-sans">
              {copy.claimContext}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-1.5">
            {mode === "signin" ? "Sign in to manage your CB POS listing" : "Create an account to manage your CB POS listing"}
          </p>
        )}
      </div>

      {/* Social OAuth: Google */}
      <div className="mb-5">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full py-2.5 px-4 bg-secondary/80 hover:bg-secondary text-secondary-foreground border border-border rounded text-sm font-medium transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
            </svg>
          )}
          <span>{copy.google}</span>
        </button>
      </div>

      {/* Or Divider */}
      <div className="relative flex items-center justify-center mb-5">
        <div className="border-t border-border w-full" />
        <span className="bg-card px-3 text-xs text-muted-foreground uppercase font-mono tracking-widest relative">
          {copy.or}
        </span>
        <div className="border-t border-border w-full" />
      </div>

      {/* Email OTP Form */}
      <EmailOtpForm
        mode={mode}
        locale={locale}
        redirectTo={redirectTo}
        labels={{
          emailLabel: copy.emailLabel,
          sendOtp: copy.sendOtp,
          otpSent: copy.otpSent,
          otpLabel: copy.otpLabel,
          submit: copy.submit,
          resend: copy.resend,
          invalidCode: copy.invalidCode,
          banned: copy.banned,
        }}
      />

      {/* Footer Switcher */}
      <div className="mt-6 text-center border-t border-border/60 pt-4">
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="text-xs text-muted-foreground hover:text-foreground transition underline cursor-pointer"
        >
          {mode === "signin" ? copy.switchToSignup : copy.switchToSignin}
        </button>
      </div>
    </div>
  );
}
