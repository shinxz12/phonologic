import {
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import { type Database, users } from '@phonologic/db';
import { AppException } from '../common/app-exception';
import { IS_PUBLIC_KEY } from '../common/public.decorator';
import { ENV } from '../config/env.token';
import type { Env } from '../config/env';
import { DB_CONNECTION } from '../database/database.constants';
import type { AuthUser } from './current-user.decorator';

interface AccessPayload {
  sub: string;
  ver: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    @Inject(DB_CONNECTION) private readonly db: Database,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: AuthUser;
    }>();

    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppException('AUTH_ACCESS_TOKEN_MISSING', { message: 'Thiếu access token' });
    }

    let payload: AccessPayload;
    try {
      payload = this.jwt.verify<AccessPayload>(header.slice(7), {
        secret: this.env.JWT_ACCESS_SECRET,
      });
    } catch {
      throw new AppException('AUTH_ACCESS_TOKEN_INVALID', { message: 'Access token không hợp lệ' });
    }

    const [user] = await this.db
      .select({
        id: users.id,
        tokenVersion: users.tokenVersion,
        status: users.status,
        deletedAt: users.deletedAt,
      })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user || user.status !== 'ACTIVE' || user.deletedAt || user.tokenVersion !== payload.ver) {
      throw new AppException('AUTH_SESSION_EXPIRED', { message: 'Phiên đăng nhập đã hết hiệu lực' });
    }

    request.user = { id: user.id, tokenVersion: user.tokenVersion };
    return true;
  }
}
