import { sha256Hex } from "./crypto";

// 02-TRD §11: ipHash = sha256(ip + dailySalt), dailySalt = sha256(IP_HASH_PEPPER + YYYY-MM-DD).
// The salt rotates at UTC midnight, so hashes can't be joined across days. Raw IPs are never stored.

export const utcDay = (now = new Date()) => now.toISOString().slice(0, 10);

export async function ipHash(env: Pick<Env, "IP_HASH_PEPPER">, ip: string, now = new Date()) {
  const salt = await sha256Hex(env.IP_HASH_PEPPER + utcDay(now));
  return sha256Hex(ip + salt);
}

/** The client IP as Cloudflare sees it. Local dev and tests have no CF header. */
export const clientIp = (headers: Headers) => headers.get("cf-connecting-ip") ?? "127.0.0.1";
