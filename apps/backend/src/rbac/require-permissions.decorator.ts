import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from '@phonologic/shared-types';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';
export const RequirePermissions = (...permissions: PermissionKey[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
