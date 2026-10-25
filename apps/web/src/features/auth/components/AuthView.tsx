"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AuthCard } from "./AuthCard";

export function AuthView({ locale }: { locale: string }) {
  const searchParams = useSearchParams();
  const claimParam = searchParams.get("claim");
  const hasClaimContext = claimParam === "1" || claimParam === "true";
  const redirectParam = searchParams.get("redirect") ?? undefined;
  const t = useTranslations("auth");

  return (
    <AuthCard
      locale={locale}
      hasClaimContext={hasClaimContext}
      redirectTo={redirectParam}
      copy={{
        signinTitle: t("title.signin"),
        signupTitle: t("title.signup"),
        claimContext: t("claim.context"),
        google: t("google"),
        or: t("or"),
        emailLabel: t("email.label"),
        sendOtp: t("otp.send"),
        otpSent: t("otp.sent"),
        otpLabel: t("otp.label"),
        submit: t("submit"),
        switchToSignup: t("switch.toSignup"),
        switchToSignin: t("switch.toSignin"),
        invalidCode: t("error.invalid"),
        resend: t("otp.resend"),
        banned: t("error.banned"),
      }}
    />
  );
}
