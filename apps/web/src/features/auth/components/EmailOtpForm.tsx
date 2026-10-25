"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EmailOtpFormProps {
  mode: "signin" | "signup";
  locale: string;
  redirectTo?: string;
  labels: {
    emailLabel: string;
    sendOtp: string;
    otpSent: string;
    otpLabel: string;
    submit: string;
    resend: string;
    invalidCode: string;
    banned: string;
  };
}

export function EmailOtpForm({ mode, locale, redirectTo, labels }: EmailOtpFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: "sign-in",
      });

      if (res.error) {
        if (res.error.message?.includes("banned") || res.error.status === 403) {
          setErrorMsg(labels.banned);
        } else {
          setErrorMsg(res.error.message || labels.invalidCode);
        }
      } else {
        setStep("otp");
        setResendCooldown(60);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    } catch {
      setErrorMsg(labels.invalidCode);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const sanitized = val.replace(/\D/g, "");
    if (!sanitized) {
      const updated = [...otp];
      updated[index] = "";
      setOtp(updated);
      return;
    }

    if (sanitized.length > 1) {
      // Pasted multi-character code
      const chars = sanitized.slice(0, 6).split("");
      const updated = [...otp];
      for (let i = 0; i < 6; i++) {
        if (chars[i]) updated[i] = chars[i]!;
      }
      setOtp(updated);
      const nextIdx = Math.min(chars.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    const updated = [...otp];
    updated[index] = sanitized;
    setOtp(updated);

    if (index < 5 && sanitized) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await authClient.signIn.emailOtp({
        email: email.trim(),
        otp: fullOtp,
      });

      if (res.error) {
        if (res.error.message?.includes("banned") || res.error.status === 403) {
          setErrorMsg(labels.banned);
        } else {
          setErrorMsg(labels.invalidCode);
        }
      } else {
        toast.success("Signed in successfully");
        const destination = redirectTo || `/${locale}/dashboard`;
        router.push(destination);
      }
    } catch {
      setErrorMsg(labels.invalidCode);
    } finally {
      setLoading(false);
    }
  };

  if (step === "email") {
    return (
      <form onSubmit={handleSendOtp} className="space-y-4">
        <div>
          <label htmlFor="email-input" className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5 font-mono">
            {labels.emailLabel}
          </label>
          <input
            id="email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner@example.com"
            required
            autoComplete="email"
            className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
          />
        </div>

        {errorMsg && (
          <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2 rounded">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full py-2.5 px-4 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border rounded text-sm font-medium transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {labels.sendOtp}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyOtp} className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          {labels.otpSent.replace("{email}", email)}
        </p>
        <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2 font-mono">
          {labels.otpLabel}
        </label>
        <div className="flex gap-2 justify-between">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-13 text-center text-lg font-mono font-bold bg-background border border-border rounded text-foreground focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
            />
          ))}
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2 rounded">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || otp.join("").length < 6}
        className="w-full py-2.5 px-4 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border rounded text-sm font-medium transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {labels.submit}
      </button>

      <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setErrorMsg(null);
          }}
          className="hover:underline cursor-pointer"
        >
          Edit email
        </button>
        <button
          type="button"
          disabled={resendCooldown > 0 || loading}
          onClick={() => handleSendOtp()}
          className="hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : labels.resend}
        </button>
      </div>
    </form>
  );
}
