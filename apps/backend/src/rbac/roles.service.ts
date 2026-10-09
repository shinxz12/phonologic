import { Inject, Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import {
  ALL_PERMISSIONS,
  PERMISSIONS,
  type AssignRolesInput,
  type CreateRoleInput,
  type PermissionKey,
  type RoleResponse,
  type UpdateRoleInput,
} from '@phonologic/shared-types';
import {
  type Database,
  permissions,
  rolePermissions,
  roles,
  userRoles,
  users,
} from '@phonologic/db';
import { AppException } from '../common/app-exception';
import { DB_CONNECTION } from '../database/database.constants';
import { PermissionsService } from './permissions.service';

@Injectable()
export class RolesService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly permissionsService: PermissionsService,
  ) {}

  async listRoles(): Promise<RoleResponse[]> {
    const allRoles = await this.db.select().from(roles);
    const allRolePerms = await this.db
      .select({
        roleId: rolePermissions.roleId,
        permKey: permissions.key,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id));

    const permsByRole: Record<string, PermissionKey[]> = {};
    for (const r of allRoles) {
      permsByRole[r.id] = [];
    }

    for (const rp of allRolePerms) {
      const list = permsByRole[rp.roleId];
      if (list) {
        list.push(rp.permKey as PermissionKey);
      }
    }

    return allRoles.map((r) => ({
      id: r.id,
      key: r.key,
      name: r.name,
      isSystem: r.isSystem,
      permissions: permsByRole[r.id] ?? [],
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  listPermissions() {
    return {
      all: ALL_PERMISSIONS,
      catalog: PERMISSIONS,
    };
  }

  async createRole(dto: CreateRoleInput): Promise<RoleResponse> {
    const [existing] = await this.db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.key, dto.key))
      .limit(1);

    if (existing) {
      throw new AppException('ROLE_EXISTS', { message: 'Mã vai trò này đã tồn tại' });
    }

    const created = await this.db.transaction(async (tx) => {
      const [newRole] = await tx
        .insert(roles)
        .values({
          key: dto.key,
          name: dto.name,
          isSystem: false,
        })
        .returning();

      if (!newRole) {
        throw new AppException('INTERNAL_SERVER_ERROR', { message: 'Không thể tạo vai trò' });
      }

      if (dto.permissions.length > 0) {
        const dbPerms = await tx
          .select({ id: permissions.id, key: permissions.key })
          .from(permissions)
          .where(inArray(permissions.key, dto.permissions));

        if (dbPerms.length > 0) {
          await tx.insert(rolePermissions).values(
            dbPerms.map((p) => ({
              roleId: newRole.id,
              permissionId: p.id,
            })),
          );
        }
      }

      return newRole;
    });

    return {
      id: created.id,
      key: created.key,
      name: created.name,
      isSystem: created.isSystem,
      permissions: dto.permissions as PermissionKey[],
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateRole(roleId: string, dto: UpdateRoleInput): Promise<RoleResponse> {
    const [role] = await this.db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (!role) {
      throw new AppException('ROLE_NOT_FOUND', { message: 'Không tìm thấy vai trò' });
    }

    await this.db.transaction(async (tx) => {
      if (dto.name) {
        await tx
          .update(roles)
          .set({ name: dto.name, updatedAt: new Date() })
          .where(eq(roles.id, roleId));
      }

      if (dto.permissions) {
        await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

        if (dto.permissions.length > 0) {
          const dbPerms = await tx
            .select({ id: permissions.id, key: permissions.key })
            .from(permissions)
            .where(inArray(permissions.key, dto.permissions));

          if (dbPerms.length > 0) {
            await tx.insert(rolePermissions).values(
              dbPerms.map((p) => ({
                roleId,
                permissionId: p.id,
              })),
            );
          }
        }
      }
    });

    this.permissionsService.invalidate();

    const [updated] = await this.db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (!updated) {
      throw new AppException('ROLE_NOT_FOUND', { message: 'Không tìm thấy vai trò' });
    }
    const updatedPerms = await this.db
      .select({ key: permissions.key })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));

    return {
      id: updated.id,
      key: updated.key,
      name: updated.name,
      isSystem: updated.isSystem,
      permissions: updatedPerms.map((p) => p.key as PermissionKey),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteRole(roleId: string): Promise<void> {
    const [role] = await this.db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (!role) {
      throw new AppException('ROLE_NOT_FOUND', { message: 'Không tìm thấy vai trò' });
    }

    if (role.isSystem) {
      throw new AppException('ROLE_SYSTEM_IMMUTABLE', {
        message: 'Không thể xóa vai trò mặc định của hệ thống',
      });
    }

    await this.db.delete(roles).where(eq(roles.id, roleId));
    this.permissionsService.invalidate();
  }

  async assignUserRoles(
    userId: string,
    dto: AssignRolesInput,
  ): Promise<{ success: boolean; roleKeys: string[] }> {
    const [user] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new AppException('USER_NOT_FOUND', { message: 'Không tìm thấy người dùng' });
    }

    const targetRoles = await this.db
      .select({ id: roles.id, key: roles.key })
      .from(roles)
      .where(inArray(roles.key, dto.roleKeys));

    await this.db.transaction(async (tx) => {
      await tx.delete(userRoles).where(eq(userRoles.userId, userId));

      if (targetRoles.length > 0) {
        await tx.insert(userRoles).values(
          targetRoles.map((r) => ({
            userId,
            roleId: r.id,
          })),
        );
      }
    });

    this.permissionsService.invalidate(userId);
    return {
      success: true,
      roleKeys: targetRoles.map((r) => r.key),
    };
  }
}
