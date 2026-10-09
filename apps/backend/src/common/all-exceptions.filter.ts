import {
  Catch,
  HttpException,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ERROR_STATUS,
  fallbackCodeForStatus,
  getErrorMessage,
  type ErrorCode,
  type ErrorEnvelope,
  type ErrorParams,
} from '@phonologic/shared-types';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json(this.normalize(status, exception.getResponse()));
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
        const message =
          'message' in exception && typeof exception.message === 'string'
            ? exception.message
            : 'Yêu cầu không hợp lệ';

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
    const message = getErrorMessage(code);
    response.status(500).json({
      statusCode: 500,
      code,
      message,
    } satisfies ErrorEnvelope);
  }

  private normalize(status: number, body: unknown): ErrorEnvelope {
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
      const localized = getErrorMessage(code, params);
      const explicitMessage =
        typeof record.message === 'string' && record.message !== code ? record.message : undefined;
      const message = explicitMessage || localized || code;

      return { ...record, statusCode: status, code, message };
    }

    const code = fallbackCodeForStatus(status);
    const message = getErrorMessage(code) || (typeof body === 'string' ? body : code);
    return { statusCode: status, code, message };
  }
}
