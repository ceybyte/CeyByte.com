"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EmailOtpFormProps {
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

export function EmailOtpForm({ locale, redirectTo, labels }: EmailOtpFormProps) {
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
          <label
            htmlFor="email-input"
            className="text-muted-foreground mb-1.5 block font-mono text-xs tracking-wider uppercase"
          >
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
            className="bg-background border-border text-foreground w-full rounded border px-3 py-2 text-sm transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
          />
        </div>

        {errorMsg && (
          <p className="text-destructive bg-destructive/10 border-destructive/20 rounded border p-2 text-xs">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border flex w-full cursor-pointer items-center justify-center gap-2 rounded border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {labels.sendOtp}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyOtp} className="space-y-4">
      <div>
        <p className="text-muted-foreground mb-3 text-xs leading-relaxed">
          {labels.otpSent.replace("{email}", email)}
        </p>
        <label className="text-muted-foreground mb-2 block font-mono text-xs tracking-wider uppercase">
          {labels.otpLabel}
        </label>
        <div className="flex justify-between gap-2">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="bg-background border-border text-foreground h-13 w-12 rounded border text-center font-mono text-lg font-bold transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
            />
          ))}
        </div>
      </div>

      {errorMsg && (
        <p className="text-destructive bg-destructive/10 border-destructive/20 rounded border p-2 text-xs">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || otp.join("").length < 6}
        className="bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border flex w-full cursor-pointer items-center justify-center gap-2 rounded border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {labels.submit}
      </button>

      <div className="text-muted-foreground flex items-center justify-between pt-1 text-xs">
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setErrorMsg(null);
          }}
          className="cursor-pointer hover:underline"
        >
          Edit email
        </button>
        <button
          type="button"
          disabled={resendCooldown > 0 || loading}
          onClick={() => handleSendOtp()}
          className="cursor-pointer hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : labels.resend}
        </button>
      </div>
    </form>
  );
}
