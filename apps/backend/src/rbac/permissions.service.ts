import { Inject, Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import type { PermissionKey } from '@phonologic/shared-types';
import {
  type Database,
  permissions,
  rolePermissions,
  roles,
  userRoles,
} from '@phonologic/db';
import { DB_CONNECTION } from '../database/database.constants';

const TTL_MS = 60_000;

interface CacheEntry {
  permissions: Set<string>;
  roles: string[];
  expiresAt: number;
}

@Injectable()
export class PermissionsService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(@Inject(DB_CONNECTION) private readonly db: Database) {}

  async getUserPermissions(userId: string): Promise<PermissionKey[]> {
    const entry = await this.getUserCacheEntry(userId);
    return Array.from(entry.permissions) as PermissionKey[];
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const entry = await this.getUserCacheEntry(userId);
    return entry.roles;
  }

  async has(userId: string, permission: PermissionKey): Promise<boolean> {
    const entry = await this.getUserCacheEntry(userId);
    return entry.permissions.has(permission);
  }

  async hasAll(userId: string, requiredPermissions: PermissionKey[]): Promise<boolean> {
    const entry = await this.getUserCacheEntry(userId);
    return requiredPermissions.every((p) => entry.permissions.has(p));
  }

  invalidate(userId?: string): void {
    if (userId) {
      this.cache.delete(userId);
    } else {
      this.cache.clear();
    }
  }

  private async getUserCacheEntry(userId: string): Promise<CacheEntry> {
    const cached = this.cache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached;
    }

    const userRoleRows = await this.db
      .select({
        roleKey: roles.key,
        roleId: roles.id,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    const roleKeys = userRoleRows.map((r) => r.roleKey);
    const roleIds = userRoleRows.map((r) => r.roleId);

    const permSet = new Set<string>();
    if (roleIds.length > 0) {
      const permRows = await this.db
        .select({
          key: permissions.key,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(inArray(rolePermissions.roleId, roleIds));

      for (const p of permRows) {
        permSet.add(p.key);
      }
    }

    const entry: CacheEntry = {
      permissions: permSet,
      roles: roleKeys,
      expiresAt: Date.now() + TTL_MS,
    };

    this.cache.set(userId, entry);
    return entry;
  }
}
