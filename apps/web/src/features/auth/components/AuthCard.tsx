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
    <div className="bg-card border-border relative mx-auto w-full max-w-[420px] rounded-lg border p-6 shadow-2xl backdrop-blur-sm sm:p-8">
      {/* Corner crosshairs */}
      <Crosshair className="-top-[4.5px] -left-[4.5px]" />
      <Crosshair className="-top-[4.5px] -right-[4.5px]" />
      <Crosshair className="-bottom-[4.5px] -left-[4.5px]" />
      <Crosshair className="-right-[4.5px] -bottom-[4.5px]" />

      {/* Header with Logo */}
      <div className="mb-6 flex flex-col items-center text-center">
        <Link href={`/${locale}`} className="mb-3 inline-block">
          <LogoSlash className="h-6 w-auto" />
        </Link>
        <h1 className="text-foreground text-xl font-bold tracking-tight">
          {mode === "signin" ? copy.signinTitle : copy.signupTitle}
        </h1>

        {hasClaimContext ? (
          <div className="mt-2.5 rounded border border-cyan-800/60 bg-cyan-950/40 p-2.5 text-left">
            <p className="font-sans text-xs leading-relaxed text-cyan-200">{copy.claimContext}</p>
          </div>
        ) : (
          <p className="text-muted-foreground mt-1.5 text-xs">
            {mode === "signin"
              ? "Sign in to manage your CB POS listing"
              : "Create an account to manage your CB POS listing"}
          </p>
        )}
      </div>

      {/* Social OAuth: Google */}
      <div className="mb-5">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="bg-secondary/80 hover:bg-secondary text-secondary-foreground border-border flex w-full cursor-pointer items-center justify-center gap-3 rounded border px-4 py-2.5 text-sm font-medium transition disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
            </svg>
          )}
          <span>{copy.google}</span>
        </button>
      </div>

      {/* Or Divider */}
      <div className="relative mb-5 flex items-center justify-center">
        <div className="border-border w-full border-t" />
        <span className="bg-card text-muted-foreground relative px-3 font-mono text-xs tracking-widest uppercase">
          {copy.or}
        </span>
        <div className="border-border w-full border-t" />
      </div>

      {/* Email OTP Form */}
      <EmailOtpForm
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
      <div className="border-border/60 mt-6 border-t pt-4 text-center">
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="text-muted-foreground hover:text-foreground cursor-pointer text-xs underline transition"
        >
          {mode === "signin" ? copy.switchToSignup : copy.switchToSignin}
        </button>
      </div>
    </div>
  );
}
