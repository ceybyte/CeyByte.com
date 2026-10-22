// API error codes and their HTTP status (02-TRD §5.3). User-facing text lives in messages/*.json as
// `errors.{CODE}`; the web app maps a code to its message, never the API.

export const ERROR_STATUS = {
  VALIDATION_FAILED: 422,
  TURNSTILE_FAILED: 403,
  RATE_LIMITED: 429,
  LOCATION_OUTSIDE_SRI_LANKA: 422,
  INVALID_PHONE: 422,
  FILE_TOO_LARGE: 413,
  FILE_TYPE_NOT_ALLOWED: 415,
  UPLOAD_NOT_FOUND: 404,
  NOT_FOUND: 404,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  RELEASE_UNAVAILABLE: 503,
  SIGNATURE_INVALID: 400,
  ENV_MISCONFIGURED: 500,
  INTERNAL: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

export type ApiError = {
  code: ErrorCode;
  requestId: string;
  /** Field path → i18n key, for VALIDATION_FAILED. */
  fields?: Record<string, string>;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };
