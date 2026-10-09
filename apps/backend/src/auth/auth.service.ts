import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type {
  AuthResult,
  ChangePasswordInput,
  LoginInput,
  MeResponse,
  RefreshInput,
  RegisterInput,
  UpdateProfileInput,
} from '@phonologic/shared-types';
import {
  type Database,
  roles,
  userRoles,
  users,
} from '@phonologic/db';
import { AppException } from '../common/app-exception';
import { DB_CONNECTION } from '../database/database.constants';
import { PermissionsService } from '../rbac/permissions.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly permissions: PermissionsService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    const [existing] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      throw new AppException('USER_EXISTS', { message: 'Email này đã được sử dụng' });
    }

    const passwordHash = await this.passwords.hash(input.password);

    const createdUser = await this.db.transaction(async (tx) => {
      const [u] = await tx
        .insert(users)
        .values({
          email,
          fullName: input.fullName.trim(),
          passwordHash,
          status: 'ACTIVE',
          mustChangePassword: false,
        })
        .returning();

      if (!u) {
        throw new AppException('INTERNAL_SERVER_ERROR', { message: 'Không thể tạo tài khoản' });
      }

      const [studentRole] = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.key, 'STUDENT'))
        .limit(1);

      if (studentRole) {
        await tx.insert(userRoles).values({
          userId: u.id,
          roleId: studentRole.id,
        });
      }

      return u;
    });
    const accessToken = this.tokens.signAccessToken(createdUser.id, createdUser.tokenVersion);
    const refreshToken = await this.tokens.issueRefreshToken(createdUser.id);

    return {
      accessToken,
      refreshToken,
      mustChangePassword: createdUser.mustChangePassword,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        fullName: createdUser.fullName,
        avatar: createdUser.avatar,
        status: createdUser.status,
        createdAt: createdUser.createdAt.toISOString(),
      },
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || user.deletedAt) {
      throw new AppException('AUTH_INVALID_CREDENTIALS', {
        message: 'Email hoặc mật khẩu không chính xác',
      });
    }

    if (user.status !== 'ACTIVE') {
      throw new AppException('AUTH_ACCOUNT_INACTIVE', {
        message: 'Tài khoản đã bị tạm khóa hoặc vô hiệu hóa',
      });
    }

    const isMatch = await this.passwords.verify(input.password, user.passwordHash);
    if (!isMatch) {
      throw new AppException('AUTH_INVALID_CREDENTIALS', {
        message: 'Email hoặc mật khẩu không chính xác',
      });
    }

    const accessToken = this.tokens.signAccessToken(user.id, user.tokenVersion);
    const refreshToken = await this.tokens.issueRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      mustChangePassword: user.mustChangePassword,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }

  async refresh(input: RefreshInput): Promise<AuthResult> {
    const { userId, refreshToken } = await this.tokens.rotateRefreshToken(input.refreshToken);

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      throw new AppException('AUTH_ACCOUNT_INACTIVE', {
        message: 'Phiên làm việc đã hết hạn hoặc tài khoản không hoạt động',
      });
    }

    const accessToken = this.tokens.signAccessToken(user.id, user.tokenVersion);

    return {
      accessToken,
      refreshToken,
      mustChangePassword: user.mustChangePassword,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }

  async logout(userId: string): Promise<void> {
    await this.tokens.revokeAllForUser(userId);
    this.permissions.invalidate(userId);
  }

  async me(userId: string): Promise<MeResponse> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.deletedAt) {
      throw new AppException('USER_NOT_FOUND', { message: 'Không tìm thấy người dùng' });
    }

    const roleKeys = await this.permissions.getUserRoles(userId);
    const userPermissions = await this.permissions.getUserPermissions(userId);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      roleKeys,
      permissions: userPermissions,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async changePassword(userId: string, input: ChangePasswordInput): Promise<AuthResult> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.deletedAt) {
      throw new AppException('USER_NOT_FOUND', { message: 'Không tìm thấy người dùng' });
    }

    const isMatch = await this.passwords.verify(input.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppException('AUTH_CURRENT_PASSWORD_WRONG', {
        message: 'Mật khẩu hiện tại không chính xác',
      });
    }

    const passwordHash = await this.passwords.hash(input.newPassword);
    const nextVersion = user.tokenVersion + 1;

    await this.db
      .update(users)
      .set({
        passwordHash,
        tokenVersion: nextVersion,
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    await this.tokens.revokeAllForUser(userId);
    this.permissions.invalidate(userId);

    const accessToken = this.tokens.signAccessToken(user.id, nextVersion);
    const refreshToken = await this.tokens.issueRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      mustChangePassword: false,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<MeResponse> {
    await this.db
      .update(users)
      .set({
        ...(input.fullName ? { fullName: input.fullName.trim() } : {}),
        ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return this.me(userId);
  }
}
