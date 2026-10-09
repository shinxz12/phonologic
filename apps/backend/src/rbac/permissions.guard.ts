import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { PermissionKey } from '@phonologic/shared-types';
import { AppException } from '../common/app-exception';
import type { AuthUser } from '../auth/current-user.decorator';
import { PermissionsService } from './permissions.service';
import { REQUIRED_PERMISSIONS_KEY } from './require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<PermissionKey[] | undefined>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user) {
      throw new AppException('AUTH_ACCESS_TOKEN_MISSING', { message: 'Yêu cầu đăng nhập' });
    }

    const hasAccess = await this.permissionsService.hasAll(user.id, required);
    if (!hasAccess) {
      throw new AppException('PERMISSION_DENIED', {
        message: 'Bạn không có quyền thực hiện thao tác này',
        extra: { missingPermissions: required },
      });
    }

    return true;
  }
}
