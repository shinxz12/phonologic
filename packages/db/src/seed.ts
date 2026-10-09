import bcrypt from 'bcryptjs';
import { ALL_PERMISSIONS, SYSTEM_ROLES } from '@phonologic/shared-types';
import { createDbClient } from './index';
import { permissions, rolePermissions, roles, userRoles, users } from './schema';
import { eq } from 'drizzle-orm';

async function seed() {
  const databaseUrl =
    process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/phonologic';

  console.log('🌱 Bắt đầu gieo dữ liệu (Seeding Database via Drizzle)...');
  const db = createDbClient(databaseUrl);

  // 1. Seed Permissions
  console.log(`🔑 Đồng bộ ${ALL_PERMISSIONS.length} quyền hệ thống...`);
  for (const permKey of ALL_PERMISSIONS) {
    const existing = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(eq(permissions.key, permKey))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(permissions).values({ key: permKey });
    }
  }

  // 2. Seed Roles & RolePermissions
  console.log(`🛡️ Đồng bộ các vai trò hệ thống...`);
  for (const systemRole of SYSTEM_ROLES) {
    let roleId: string;
    const [existingRole] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.key, systemRole.key))
      .limit(1);

    if (!existingRole) {
      const [inserted] = await db
        .insert(roles)
        .values({
          key: systemRole.key,
          name: systemRole.name,
          isSystem: systemRole.isSystem,
        })
        .returning({ id: roles.id });
      roleId = inserted.id;
    } else {
      roleId = existingRole.id;
      await db
        .update(roles)
        .set({ name: systemRole.name, isSystem: systemRole.isSystem })
        .where(eq(roles.id, roleId));
    }

    // Assign permissions
    const dbPerms = await db.select().from(permissions);
    const permById: Record<string, string> = {};
    for (const p of dbPerms) {
      permById[p.key] = p.id;
    }

    for (const permKey of systemRole.permissions) {
      const pId = permById[permKey];
      if (pId) {
        await db
          .insert(rolePermissions)
          .values({ roleId, permissionId: pId })
          .onConflictDoNothing();
      }
    }
  }

  // 3. Seed Default Admin
  const adminEmail = 'admin@phonologic.dev';
  const [existingAdmin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  if (!existingAdmin) {
    console.log(`👤 Tạo tài khoản Quản trị viên mặc định: ${adminEmail}`);
    const passwordHash = await bcrypt.hash('Admin@123456', 10);
    const [createdAdmin] = await db
      .insert(users)
      .values({
        email: adminEmail,
        fullName: 'Hệ thống Quản trị',
        passwordHash,
        mustChangePassword: false,
      })
      .returning({ id: users.id });

    const [adminRole] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.key, 'ADMIN'))
      .limit(1);

    if (adminRole) {
      await db.insert(userRoles).values({
        userId: createdAdmin.id,
        roleId: adminRole.id,
      });
    }
  }

  console.log('✅ Gieo dữ liệu thành công!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Lỗi khi gieo dữ liệu:', err);
  process.exit(1);
});
