import { Injectable, type ArgumentMetadata, type PipeTransform } from '@nestjs/common';
import type { FieldError } from '@phonologic/shared-types';
import type { ZodError } from 'zod';
import { AppException } from './app-exception';
import { isZodDto } from './zod-dto';

type ZodIssue = ZodError['issues'][number];

const CODE_PATTERN = /^[A-Z][A-Z0-9_]+$/;

function issueToFieldError(issue: ZodIssue): FieldError {
  const path = issue.path.join('.');
  if (CODE_PATTERN.test(issue.message)) {
    return { path, code: issue.message };
  }

  switch (issue.code) {
    case 'invalid_type':
      return { path, code: 'REQUIRED' };
    case 'too_small': {
      const min = 'minimum' in issue && typeof issue.minimum === 'number' ? issue.minimum : 0;
      return { path, code: 'TOO_SHORT', params: { min } };
    }
    case 'too_big': {
      const max = 'maximum' in issue && typeof issue.maximum === 'number' ? issue.maximum : 0;
      return { path, code: 'TOO_LONG', params: { max } };
    }
    case 'invalid_string':
      return { path, code: 'INVALID_FORMAT' };
    default:
      return { path, code: 'INVALID' };
  }
}

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const { metatype } = metadata;
    if (!isZodDto(metatype)) return value;

    const result = metatype.zodSchema.safeParse(value);
    if (result.success) return result.data;

    throw new AppException('VALIDATION_ERROR', {
      message: result.error.errors[0]?.message || 'Dữ liệu không hợp lệ',
      errors: result.error.issues.map(issueToFieldError),
    });
  }
}
