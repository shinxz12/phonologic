import { HttpException } from '@nestjs/common';
import {
  ERROR_STATUS,
  type ErrorCode,
  type ErrorParams,
  type FieldError,
} from '@phonologic/shared-types';

export interface AppExceptionOptions {
  message?: string;
  params?: ErrorParams;
  errors?: FieldError[];
  extra?: Record<string, unknown>;
  cause?: unknown;
}

export class AppException extends HttpException {
  readonly code: ErrorCode;
  readonly params?: ErrorParams;
  readonly errors?: FieldError[];
  readonly extra?: Record<string, unknown>;

  constructor(code: ErrorCode, options: AppExceptionOptions = {}) {
    const status = ERROR_STATUS[code] ?? 500;
    const message = options.message ?? code;
    super(
      {
        message,
        code,
        params: options.params,
        errors: options.errors,
        ...options.extra,
      },
      status,
      { cause: options.cause },
    );
    this.code = code;
    this.params = options.params;
    this.errors = options.errors;
    this.extra = options.extra;
  }
}
