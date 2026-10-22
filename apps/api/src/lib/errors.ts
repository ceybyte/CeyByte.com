import { ERROR_STATUS, type ErrorCode } from "@cbpos/shared/errors";

// Throw anywhere in a route; the app's onError turns it into the ApiResult envelope (02-TRD §5.3).
export class ApiError extends Error {
  readonly status: (typeof ERROR_STATUS)[ErrorCode];

  constructor(
    readonly code: ErrorCode,
    readonly options: { fields?: Record<string, string>; retryAfter?: number } = {},
  ) {
    super(code);
    this.status = ERROR_STATUS[code];
  }
}
