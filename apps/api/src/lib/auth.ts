import { LOCALES, type Locale } from "@cbpos/shared/enums";
import { accounts, sessions, users, verifications } from "@cbpos/shared/db/schema";
import { betterAuth } from "better-auth";
import { admin, emailOTP } from "better-auth/plugins";
import { withCloudflare } from "better-auth-cloudflare";
import en from "../../../../messages/en.json";
import si from "../../../../messages/si.json";
import ta from "../../../../messages/ta.json";
import type { Db } from "./db";
import { ApiError } from "./errors";
import { log } from "./log";

// 02-TRD §12.2. Passwordless (email OTP + Google, D5), one instance per request (CLAUDE.md §5.2).
// Sessions live in D1 only. KV secondary storage was dropped: a stale KV hit can keep a banned or demoted
// session alive for its full lifetime (better-auth-cloudflare README, "KV and session revocation").
// Better Auth's own IP tracking and rate limiter are off because they persist raw IPs; RL_AUTH limits sign-in
// and sessions.ip_address holds the daily IP hash instead (05-SCHEMA §4).

const MARKER = "[[TRANSLATE]]";
const EMAIL = { en: en.email, si: si.email, ta: ta.email } as const;

function otpEmail(locale: Locale, otp: string) {
  const pick = (key: "subject" | "body") => {
    const text = EMAIL[locale].otp[key];
    return text.startsWith(MARKER) ? EMAIL.en.otp[key] : text;
  };
  return { subject: pick("subject").replace("{otp}", otp), text: pick("body").replace("{otp}", otp) };
}

async function sendOtpEmail(env: Env, to: string, otp: string, locale: Locale) {
  const { subject, text } = otpEmail(locale, otp);
  if (!env.RESEND_API_KEY) {
    if (env.ENVIRONMENT === "production") throw new ApiError("ENV_MISCONFIGURED");
    log.info("dev_otp", { otp, note: "RESEND_API_KEY not set, so the code is logged instead of emailed" });
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, text }),
  });
  if (!res.ok) {
    log.error("otp_email_failed", { status: res.status });
    throw new ApiError("INTERNAL");
  }
}

export function localeFromCookie(cookieHeader: string | null): Locale {
  const value = /(?:^|;\s*)NEXT_LOCALE=([a-z]{2})/.exec(cookieHeader ?? "")?.[1];
  return LOCALES.find((l) => l === value) ?? "en";
}

export function createAuth(env: Env, db: Db, opts: { ipHash?: string | null; locale?: Locale } = {}) {
  const google =
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
      : undefined;

  return betterAuth({
    baseURL: env.SITE_URL,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.SITE_URL],
    ...withCloudflare(
      {
        autoDetectIpAddress: false,
        geolocationTracking: false,
        d1: { db, options: { usePlural: true, schema: { users, sessions, accounts, verifications } } },
      },
      {
        emailAndPassword: { enabled: false },
        socialProviders: google,
        rateLimit: { enabled: false },
        advanced: {
          ipAddress: { disableIpTracking: true },
          database: { generateId: () => crypto.randomUUID() },
        },
        user: {
          additionalFields: {
            locale: { type: "string", required: false, defaultValue: "en", input: false },
          },
        },
        databaseHooks: {
          session: {
            create: {
              before: async (session) => ({
                data: { ...session, ipAddress: opts.ipHash ?? null, userAgent: null },
              }),
            },
          },
        },
        plugins: [
          admin({ defaultRole: "merchant", adminRoles: ["admin"] }),
          emailOTP({
            otpLength: 6,
            expiresIn: 600,
            allowedAttempts: 5,
            sendVerificationOTP: ({ email, otp }) => sendOtpEmail(env, email, otp, opts.locale ?? "en"),
          }),
        ],
      },
    ),
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthSession = Auth["$Infer"]["Session"];
