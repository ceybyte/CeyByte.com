// Promote an existing user to admin (02-TRD §12.2). The person signs in once first, so the user row exists.
//   bun scripts/make-admin.ts --email you@example.com            # local D1
//   bun scripts/make-admin.ts --email you@example.com --preview  # cbpos-db-preview
//   bun scripts/make-admin.ts --email you@example.com --remote   # production D1
// `wrangler d1 execute` can't bind parameters, so the email is validated strictly before it goes into SQL.
import { z } from "zod";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};

const email = z
  .email()
  .max(254)
  .regex(/^[^'"\\;\s]+$/, "unexpected characters")
  .safeParse(flag("--email")?.trim().toLowerCase());
if (!email.success) {
  console.error("Usage: bun scripts/make-admin.ts --email you@example.com [--preview | --remote]");
  process.exit(1);
}

const target = args.includes("--remote") ? "remote" : args.includes("--preview") ? "preview" : "local";
const flags = { local: ["--local"], preview: ["--remote", "--env", "preview"], remote: ["--remote"] }[target];
const db = target === "preview" ? "cbpos-db-preview" : "cbpos-db";

async function d1(sql: string) {
  const proc = Bun.spawn(["bunx", "wrangler", "d1", "execute", db, ...flags, "--json", "--command", sql], {
    cwd: "apps/api",
    stdout: "pipe",
    stderr: "inherit",
  });
  const out = await new Response(proc.stdout).text();
  if ((await proc.exited) !== 0) process.exit(1);
  const parsed = JSON.parse(out) as { results: { email: string; role: string }[] }[];
  return parsed[0]?.results ?? [];
}

const rows = await d1(
  `UPDATE users SET role = 'admin', updated_at = ${Date.now()} WHERE email = '${email.data}' RETURNING email, role`,
);
if (rows.length === 0) {
  console.error(`No user with ${email.data} on ${target} D1. Sign in once at /login, then run this again.`);
  process.exit(1);
}
console.warn(`${email.data} is now an admin (${target}).`);
