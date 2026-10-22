// Small WebCrypto helpers shared by the IP hash, claim tokens and webhook signatures.

const encoder = new TextEncoder();

export const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");

export async function sha256Hex(input: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(input)));
}

export async function hmacSha256Hex(secret: string, message: string | ArrayBuffer): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const data = typeof message === "string" ? encoder.encode(message) : message;
  return toHex(await crypto.subtle.sign("HMAC", key, data));
}

/** Constant-time string comparison (workerd's crypto.subtle.timingSafeEqual). */
export function safeEqual(a: string, b: string): boolean {
  const ab = encoder.encode(a);
  const bb = encoder.encode(b);
  if (ab.byteLength !== bb.byteLength) return false;
  return crypto.subtle.timingSafeEqual(ab, bb);
}
