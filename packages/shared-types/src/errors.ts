export const ERROR_STATUS = {
  // Auth
  AUTH_INVALID_CREDENTIALS: 401,
  AUTH_ACCESS_TOKEN_MISSING: 401,
  AUTH_ACCESS_TOKEN_INVALID: 401,
  AUTH_REFRESH_TOKEN_INVALID: 401,
  AUTH_SESSION_EXPIRED: 401,
  AUTH_ACCOUNT_INACTIVE: 403,
  AUTH_CURRENT_PASSWORD_WRONG: 400,

  // RBAC
  PERMISSION_DENIED: 403,
  ROLE_NOT_FOUND: 404,
  ROLE_EXISTS: 409,
  ROLE_SYSTEM_IMMUTABLE: 400,
  ROLE_CANNOT_REVOKE_OWN_ADMIN: 400,

  // Users
  USER_NOT_FOUND: 404,
  USER_EXISTS: 409,

  // Courses & Lessons (English Learning Domain)
  COURSE_NOT_FOUND: 404,
  LESSON_NOT_FOUND: 404,
  VOCABULARY_NOT_FOUND: 404,

  // Generic
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

export const ERROR_CODES = Object.keys(ERROR_STATUS) as ErrorCode[];

export type ErrorParams = Record<string, string | number>;

export interface FieldError {
  path: string;
  code: string;
  params?: ErrorParams;
}

export interface ErrorEnvelope {
  statusCode: number;
  code: ErrorCode;
  message: string;
  params?: ErrorParams;
  errors?: FieldError[];
  [extra: string]: unknown;
}

export function isErrorEnvelope(value: unknown): value is ErrorEnvelope {
  if (!value || typeof value !== 'object') return false;
  const cand = value as Partial<ErrorEnvelope>;
  return (
    typeof cand.statusCode === 'number' &&
    typeof cand.code === 'string' &&
    cand.code in ERROR_STATUS &&
    typeof cand.message === 'string'
  );
}

export function fallbackCodeForStatus(status: number): ErrorCode {
  switch (status) {
    case 400:
      return 'VALIDATION_ERROR';
    case 401:
      return 'AUTH_ACCESS_TOKEN_INVALID';
    case 403:
      return 'PERMISSION_DENIED';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'USER_EXISTS';
    default:
      return 'INTERNAL_SERVER_ERROR';
  }
}
