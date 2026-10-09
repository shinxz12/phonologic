import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

for (const envPath of [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
]) {
  if (fs.existsSync(envPath)) {
    try {
      process.loadEnvFile(envPath);
      break;
    } catch {
      // ignore
    }
  }
}

export const envSchema = z.object({
  DATABASE_URL: z.string().default('postgres://postgres:postgres@localhost:5432/phonologic'),
  PORT: z.coerce.number().default(4000),
  JWT_ACCESS_SECRET: z.string().min(16).default('phonologic_super_secret_access_jwt_key_2026'),
  JWT_REFRESH_SECRET: z.string().min(16).default('phonologic_super_secret_refresh_jwt_key_2026'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  CORS_ORIGIN: z.string().default('*'),
});

export type Env = z.infer<typeof envSchema>;
