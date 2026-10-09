import type { ZodType } from 'zod';

export interface ZodDto<TOut> {
  new (): TOut;
  readonly zodSchema: ZodType<TOut>;
}

export function createZodDto<TOut>(schema: ZodType<TOut>): ZodDto<TOut> {
  class Dto {
    static readonly zodSchema = schema;
  }
  return Dto as unknown as ZodDto<TOut>;
}

export function isZodDto(metatype: unknown): metatype is ZodDto<unknown> {
  return typeof metatype === 'function' && 'zodSchema' in metatype;
}
