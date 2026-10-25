import { describe, expect, test, mock } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, replace: () => {}, prefetch: () => {} }),
  usePathname: () => "/en/login",
  useSearchParams: () => new URLSearchParams(),
}));
import { AuthCard } from "./components/AuthCard";
import { EmailOtpForm } from "./components/EmailOtpForm";

const mockCopy = {
  signinTitle: "Sign in",
  signupTitle: "Create your account",
  claimContext: "Create an account to look after your shop's listing on the CB POS map.",
  google: "Continue with Google",
  or: "or",
  emailLabel: "Email",
  sendOtp: "Email me a sign-in code",
  otpSent: "We sent a 6-digit code to {email}. It can take a minute to arrive.",
  otpLabel: "6-digit code",
  submit: "Continue",
  switchToSignup: "New here? Create an account",
  switchToSignin: "Have an account? Sign in",
  invalidCode: "That code is wrong or has expired. Send a new one.",
  resend: "Send a new code",
  banned: "This account is turned off. Please contact us if you think that's a mistake.",
};

describe("S12 Sign in / Sign up (F-09)", () => {
  test("renders sign in card with Google OAuth and email OTP inputs", () => {
    const html = renderToString(<AuthCard locale="en" hasClaimContext={false} copy={mockCopy} />);

    expect(html).toContain("Sign in");
    expect(html).toContain("Continue with Google");
    expect(html).toContain("Email me a sign-in code");
    expect(html).toContain("New here? Create an account");
    expect(html.includes("39FF14")).toBe(false); // No neon green button rule on S12!
  });

  test("renders claim context banner when hasClaimContext is true", () => {
    const html = renderToString(<AuthCard locale="en" hasClaimContext={true} copy={mockCopy} />);

    expect(html).toContain("Create your account");
    expect(html).toContain("Create an account to look after your shop&#x27;s listing on the CB POS map.");
  });

  test("renders EmailOtpForm initial email state", () => {
    const html = renderToString(
      <EmailOtpForm
        locale="en"
        labels={{
          emailLabel: mockCopy.emailLabel,
          sendOtp: mockCopy.sendOtp,
          otpSent: mockCopy.otpSent,
          otpLabel: mockCopy.otpLabel,
          submit: mockCopy.submit,
          resend: mockCopy.resend,
          invalidCode: mockCopy.invalidCode,
          banned: mockCopy.banned,
        }}
      />,
    );

    expect(html).toContain("Email");
    expect(html).toContain("Email me a sign-in code");
  });
});
