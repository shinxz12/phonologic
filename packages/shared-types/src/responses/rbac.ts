import type { PermissionKey } from '../permissions';

export interface RoleResponse {
  id: string;
  key: string;
  name: string;
  isSystem: boolean;
  permissions: PermissionKey[];
  createdAt: string;
  updatedAt: string;
}

export interface PermissionGroup {
  group: string;
  permissions: PermissionKey[];
}
