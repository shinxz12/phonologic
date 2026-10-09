import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Serve pre-built static frontend SPA assets if present
  const possiblePaths = [
    path.resolve(__dirname, '../../frontend/dist'),
    path.resolve(__dirname, '../frontend/dist'),
    path.resolve(__dirname, '../../apps/frontend/dist'),
    path.resolve(process.cwd(), 'apps/frontend/dist'),
    path.resolve(process.cwd(), 'frontend/dist'),
  ];
  const clientDist = possiblePaths.find((p) => fs.existsSync(p));

  if (clientDist) {
    app.useStaticAssets(clientDist);
    const server = app.getHttpAdapter().getInstance();
    // SPA fallback: any non-API GET request serves index.html
    server.get(/^(?!\/api).*/, (_req: unknown, res: { sendFile: (p: string) => void }) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
    console.log(`📦 Serving static frontend from ${clientDist}`);
  }

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);
  console.log(`🚀 Phonologic Server running at http://localhost:${port}`);
  console.log(`📡 API available at http://localhost:${port}/api`);
}

void bootstrap();
