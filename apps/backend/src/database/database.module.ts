import { Global, Module } from '@nestjs/common';
import { createDbClient } from '@phonologic/db';
import { DB_CONNECTION } from './database.constants';
import { ENV } from '../config/env.token';
import type { Env } from '../config/env';

@Global()
@Module({
  providers: [
    {
      provide: DB_CONNECTION,
      inject: [ENV],
      useFactory: (env: Env) => createDbClient(env.DATABASE_URL),
    },
  ],
  exports: [DB_CONNECTION],
})
export class DatabaseModule {}
