import { Global, Module } from '@nestjs/common';
import { ENV } from './env.token';
import { envSchema } from './env';

@Global()
@Module({
  providers: [
    {
      provide: ENV,
      useFactory: () => envSchema.parse(process.env),
    },
  ],
  exports: [ENV],
})
export class ConfigModule {}
