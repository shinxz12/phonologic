import { test, expect } from 'bun:test';
import { AllExceptionsFilter } from '../src/common/all-exceptions.filter';
import { AppException } from '../src/common/app-exception';
import type { ArgumentsHost } from '@nestjs/common';
import type { Request, Response } from 'express';

function createMockHost(headers: Record<string, string>): {
  host: ArgumentsHost;
  statusCode: number;
  responseBody: unknown;
} {
  let statusCode = 200;
  let responseBody: unknown = null;

  const mockReq = {
    headers,
  } as unknown as Request;

  const mockRes = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(body: unknown) {
      responseBody = body;
      return this;
    },
  } as unknown as Response;

  const host = {
    switchToHttp: () => ({
      getRequest: () => mockReq,
      getResponse: () => mockRes,
    }),
  } as unknown as ArgumentsHost;

  return {
    host,
    get statusCode() {
      return statusCode;
    },
    get responseBody() {
      return responseBody;
    },
  };
}

test('AllExceptionsFilter returns Vietnamese message by default (vi locale)', () => {
  const filter = new AllExceptionsFilter();
  const mock = createMockHost({});
  const ex = new AppException('ROLE_EXISTS');

  filter.catch(ex, mock.host);

  expect(mock.statusCode).toBe(409);
  expect((mock.responseBody as { message: string }).message).toBe(
    'Vai trò với mã này đã tồn tại'
  );
});

test('AllExceptionsFilter returns English message when Accept-Language: en is passed', () => {
  const filter = new AllExceptionsFilter();
  const mock = createMockHost({ 'accept-language': 'en-US,en;q=0.9' });
  const ex = new AppException('AUTH_INVALID_CREDENTIALS');

  filter.catch(ex, mock.host);

  expect(mock.statusCode).toBe(401);
  expect((mock.responseBody as { message: string }).message).toBe(
    'Incorrect email or password'
  );
});

test('AllExceptionsFilter translates explicit backend message when x-lang: en is passed', () => {
  const filter = new AllExceptionsFilter();
  const mock = createMockHost({ 'x-lang': 'en' });
  const ex = new AppException('VALIDATION_ERROR', {
    message: 'Tập tin ghi âm không hợp lệ',
  });

  filter.catch(ex, mock.host);

  expect(mock.statusCode).toBe(400);
  expect((mock.responseBody as { message: string }).message).toBe(
    'Invalid audio file'
  );
});

test('AllExceptionsFilter translates field error messages for en locale', () => {
  const filter = new AllExceptionsFilter();
  const mock = createMockHost({ 'accept-language': 'en' });
  const ex = new AppException('VALIDATION_ERROR', {
    errors: [
      { path: 'email', message: 'Email không đúng định dạng', code: 'INVALID_FORMAT' },
    ],
  });

  filter.catch(ex, mock.host);

  expect(mock.statusCode).toBe(400);
  const body = mock.responseBody as {
    errors: Array<{ path: string; message: string }>;
  };
  expect(body.errors[0]?.message).toBe('Enter a valid email address');
});
