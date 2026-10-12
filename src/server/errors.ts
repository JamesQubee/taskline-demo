export type ErrorCode =
  | "unauthorized"
  | "not_found"
  | "validation_error"
  | "invalid_json"
  | "limit_reached"
  | "rate_limited"
  | "internal_error";

/** An expected failure with a message that is safe to show to the user. */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    /** Per-field messages for validation errors, keyed by field name. */
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const unauthorized = () =>
  new AppError(401, "unauthorized", "Sign in to continue.");

// Also used when a record exists but belongs to someone else, so the API
// never reveals which ids are taken.
export const notFound = (what: string) =>
  new AppError(404, "not_found", `${what} not found.`);

export const limitReached = (message: string) =>
  new AppError(409, "limit_reached", message);

export const rateLimited = (message: string) =>
  new AppError(429, "rate_limited", message);
