/// <reference types="bun-types" />
/**
 * Developer helper script to generate an admin session for local development / testing.
 *
 * Usage:
 *   bun scripts/dev-login.ts
 *   bun scripts/dev-login.ts --email custom-admin@example.com
 */

import { z } from "zod";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};

const emailArg = flag("--email")?.trim().toLowerCase() ?? "dev-admin@example.com";
const email = z
  .string()
  .email()
  .max(254)
  .regex(/^[^'"\\;\s]+$/, "unexpected characters")
  .parse(emailArg);

const db = "cbpos-db";

async function d1(sql: string) {
  const proc = Bun.spawn(["bunx", "wrangler", "d1", "execute", db, "--local", "--json", "--command", sql], {
    cwd: "apps/api",
    stdout: "pipe",
    stderr: "inherit",
  });
  const out = await new Response(proc.stdout).text();
  if ((await proc.exited) !== 0) process.exit(1);
  const parsed = JSON.parse(out) as { results: Record<string, unknown>[] }[];
  return parsed[0]?.results ?? [];
}

const now = Date.now();
const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days
const sessionToken = `dev_admin_${crypto.randomUUID().replace(/-/g, "")}`;
const sessionId = crypto.randomUUID();
const userId = crypto.randomUUID();

// 1. Ensure admin user exists
await d1(`
  INSERT INTO users (id, name, email, email_verified, role, banned, locale, created_at, updated_at)
  VALUES ('${userId}', 'Dev Admin', '${email}', 1, 'admin', 0, 'en', ${now}, ${now})
  ON CONFLICT(email) DO UPDATE SET role = 'admin', updated_at = ${now};
`);

// Fetch user ID for the session
const userRows = await d1(`SELECT id FROM users WHERE email = '${email}'`);
const finalUserId = (userRows[0]?.id as string) ?? userId;

// 2. Insert session
await d1(`
  INSERT INTO sessions (id, token, user_id, expires_at, created_at, updated_at)
  VALUES ('${sessionId}', '${sessionToken}', '${finalUserId}', ${expiresAt}, ${now}, ${now});
`);

console.log("\n=======================================================");
console.log("  CB POS Admin Session Created (Local Development)");
console.log("=======================================================\n");
console.log(`Admin User:   ${email}`);
console.log(`Session Token: ${sessionToken}`);
console.log(`Expires:       ${new Date(expiresAt).toISOString()}\n`);
console.log("To log in immediately in your browser on localhost:");
console.log("1. Open http://localhost:8787 (or http://localhost:3000) in your browser");
console.log("2. Open Developer Tools (F12 or Cmd+Opt+I) -> Console tab");
console.log("3. Paste and run the following command:\n");
console.log(`   document.cookie = "better-auth.session_token=${sessionToken}; path=/; max-age=2592000";\n`);
console.log("4. Navigate to: http://localhost:8787/admin (or http://localhost:3000/admin)");
console.log("\n=======================================================\n");
