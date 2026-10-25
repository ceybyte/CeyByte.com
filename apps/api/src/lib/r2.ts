import { AwsClient } from "aws4fetch";
import { ApiError } from "./errors";

// 02-TRD §9. The browser PUTs straight to R2 with a 5-minute presigned URL. R2 can't enforce size or type on a
// presigned PUT, so `verifyUpload` checks both after the fact, plus the file's magic bytes.

export const UPLOAD_PURPOSES = ["donation_slip", "crash_log", "ticket_screenshot"] as const;
export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

const MB = 1024 * 1024;

export const UPLOAD_RULES: Record<
  UploadPurpose,
  { mime: readonly string[]; ext: readonly string[]; maxBytes: number }
> = {
  donation_slip: {
    mime: ["image/jpeg", "image/png", "application/pdf"],
    ext: ["jpg", "jpeg", "png", "pdf"],
    maxBytes: 5 * MB,
  },
  crash_log: {
    mime: ["text/plain", "application/zip", "application/x-zip-compressed"],
    ext: ["log", "txt", "zip"],
    maxBytes: 5 * MB,
  },
  ticket_screenshot: { mime: ["image/jpeg", "image/png"], ext: ["jpg", "jpeg", "png"], maxBytes: 5 * MB },
};

const isZip = (b: Uint8Array) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;

const MAGIC: Record<string, (b: Uint8Array) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "application/pdf": (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
  "application/zip": isZip,
  "application/x-zip-compressed": isZip,
  // Plain text has no signature; reject anything with NUL bytes (a binary in disguise).
  "text/plain": (b) => !b.includes(0),
};

export function matchesMagic(mime: string, firstBytes: Uint8Array) {
  return MAGIC[mime]?.(firstBytes) ?? false;
}

export function checkDeclaredFile(
  purpose: UploadPurpose,
  fileName: string,
  contentType: string,
  size: number,
) {
  const rule = UPLOAD_RULES[purpose];
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (size > rule.maxBytes) throw new ApiError("FILE_TOO_LARGE");
  if (!rule.mime.includes(contentType) || !rule.ext.includes(ext))
    throw new ApiError("FILE_TYPE_NOT_ALLOWED");
  return ext;
}

function client(env: Env) {
  if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) throw new ApiError("ENV_MISCONFIGURED");
  return new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto",
  });
}

const objectUrl = (env: Env, key: string) =>
  new URL(`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/cbpos-uploads/${key}`);

export async function presignPut(env: Env, key: string, contentType: string, expiresSec = 300) {
  const url = objectUrl(env, key);
  url.searchParams.set("X-Amz-Expires", String(expiresSec));
  if (env.ENVIRONMENT === "test" || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    url.searchParams.set("X-Amz-Signature", "test-mock-signature");
    return url.toString();
  }
  const signed = await client(env).sign(
    new Request(url, { method: "PUT", headers: { "content-type": contentType } }),
    { aws: { signQuery: true } },
  );
  return signed.url;
}

/** Admin-only viewing of private objects (slips, crash logs). */
export async function presignGet(env: Env, key: string, expiresSec = 120) {
  const url = objectUrl(env, key);
  url.searchParams.set("X-Amz-Expires", String(expiresSec));
  if (env.ENVIRONMENT === "test" || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    url.searchParams.set("X-Amz-Signature", "test-mock-signature");
    return url.toString();
  }
  const signed = await client(env).sign(new Request(url, { method: "GET" }), { aws: { signQuery: true } });
  return signed.url;
}

/** After the browser's PUT: size, type and magic bytes. Deletes the object when it fails. */
export async function verifyUpload(bucket: R2Bucket, key: string, purpose: UploadPurpose) {
  const head = await bucket.head(key);
  if (!head) throw new ApiError("UPLOAD_NOT_FOUND");
  const rule = UPLOAD_RULES[purpose];
  const mime = head.httpMetadata?.contentType ?? "";
  if (head.size > rule.maxBytes) {
    await bucket.delete(key);
    throw new ApiError("FILE_TOO_LARGE");
  }
  const start = await bucket.get(key, { range: { offset: 0, length: 8 } });
  const bytes = start ? new Uint8Array(await start.arrayBuffer()) : new Uint8Array();
  if (!rule.mime.includes(mime) || !matchesMagic(mime, bytes)) {
    await bucket.delete(key);
    throw new ApiError("FILE_TYPE_NOT_ALLOWED");
  }
  return { key, mime, size: head.size };
}
