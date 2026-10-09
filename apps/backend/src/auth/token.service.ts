import { randomBytes, createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { type Database, refreshTokens } from '@phonologic/db';
import { DB_CONNECTION } from '../database/database.constants';
import { ENV } from '../config/env.token';
import type { Env } from '../config/env';
import { AppException } from '../common/app-exception';

const REFRESH_BYTES = 32;

@Injectable()
export class TokenService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly jwt: JwtService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  signAccessToken(userId: string, tokenVersion: number): string {
    return this.jwt.sign(
      { sub: userId, ver: tokenVersion },
      {
        secret: this.env.JWT_ACCESS_SECRET,
        expiresIn: this.env.JWT_ACCESS_TTL as JwtSignOptions['expiresIn'],
      },
    );
  }

  async issueRefreshToken(userId: string): Promise<string> {
    const raw = randomBytes(REFRESH_BYTES).toString('hex');
    const tokenHash = createHash('sha256').update(raw).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.db.insert(refreshTokens).values({
      userId,
      tokenHash,
      expiresAt,
    });

    return raw;
  }

  async rotateRefreshToken(raw: string): Promise<{ userId: string; refreshToken: string }> {
    const tokenHash = createHash('sha256').update(raw).digest('hex');

    const [existing] = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1);

    if (!existing || existing.revokedAt || existing.expiresAt <= new Date()) {
      throw new AppException('AUTH_REFRESH_TOKEN_INVALID', {
        message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ',
      });
    }

    const next = randomBytes(REFRESH_BYTES).toString('hex');
    const nextHash = createHash('sha256').update(next).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.db.transaction(async (tx) => {
      await tx
        .update(refreshTokens)
        .set({ revokedAt: new Date(), replacedByHash: nextHash })
        .where(eq(refreshTokens.tokenHash, tokenHash));

      await tx.insert(refreshTokens).values({
        userId: existing.userId,
        tokenHash: nextHash,
        expiresAt,
      });
    });

    return { userId: existing.userId, refreshToken: next };
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
  }
}
