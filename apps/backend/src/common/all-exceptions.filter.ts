import {
  Catch,
  HttpException,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ERROR_STATUS,
  fallbackCodeForStatus,
  getErrorMessage,
  translateBackendMessage,
  type ErrorCode,
  type ErrorEnvelope,
  type ErrorParams,
} from '@phonologic/shared-types';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const locale = this.extractLocale(request);

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json(this.normalize(status, exception.getResponse(), locale));
      return;
    }

    if (exception && typeof exception === 'object') {
      const rawStatus =
        'status' in exception && typeof exception.status === 'number'
          ? exception.status
          : 'statusCode' in exception && typeof exception.statusCode === 'number'
            ? exception.statusCode
            : undefined;

      if (rawStatus && rawStatus >= 400 && rawStatus < 600) {
        const rawMessage =
          'message' in exception && typeof exception.message === 'string'
            ? exception.message
            : 'Yêu cầu không hợp lệ';
        const message = translateBackendMessage(rawMessage, locale);

        response.status(rawStatus).json({
          statusCode: rawStatus,
          code: fallbackCodeForStatus(rawStatus),
          message,
        });
        return;
      }
    }

    this.logger.error(
      exception instanceof Error ? (exception.stack ?? exception.message) : exception,
    );
    const code: ErrorCode = 'INTERNAL_SERVER_ERROR';
    const message = getErrorMessage(code, undefined, locale);
    response.status(500).json({
      statusCode: 500,
      code,
      message,
    } satisfies ErrorEnvelope);
  }

  private extractLocale(request?: Request): 'vi' | 'en' {
    if (!request || !request.headers) return 'vi';
    const raw = (
      request.headers['x-lang'] ||
      request.headers['x-locale'] ||
      request.headers['accept-language']
    ) as string | undefined;

    if (raw) {
      const lower = raw.toLowerCase().trim();
      if (lower.startsWith('en') || lower.includes('en-') || lower.includes('en,')) {
        return 'en';
      }
    }
    return 'vi';
  }

  private normalize(status: number, body: unknown, locale: 'vi' | 'en'): ErrorEnvelope {
    if (body !== null && typeof body === 'object') {
      const record: Record<string, unknown> = { ...body };
      const rawCode = record.code;
      const code: ErrorCode =
        typeof rawCode === 'string' && rawCode in ERROR_STATUS
          ? (rawCode as ErrorCode)
          : fallbackCodeForStatus(status);

      const params = (
        record.params && typeof record.params === 'object' ? record.params : undefined
      ) as ErrorParams | undefined;
      const localized = getErrorMessage(code, params, locale);
      const explicitMessage =
        typeof record.message === 'string' && record.message !== code ? record.message : undefined;
      const message = explicitMessage
        ? translateBackendMessage(explicitMessage, locale)
        : (localized || code);

      if (Array.isArray(record.errors)) {
        record.errors = record.errors.map((err) => {
          if (err && typeof err === 'object' && typeof err.message === 'string') {
            return {
              ...err,
              message: translateBackendMessage(err.message, locale),
            };
          }
          return err;
        });
      }

      return { ...record, statusCode: status, code, message };
    }

    const code = fallbackCodeForStatus(status);
    const message =
      getErrorMessage(code, undefined, locale) ||
      (typeof body === 'string' ? translateBackendMessage(body, locale) : code);
    return { statusCode: status, code, message };
  }
}
