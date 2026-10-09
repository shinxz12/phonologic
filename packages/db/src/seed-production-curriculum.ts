import bcrypt from 'bcryptjs';
import { ALL_PERMISSIONS, SYSTEM_ROLES } from '@phonologic/shared-types';
import { createDbClient } from './index';
import {
  learningContentDrafts,
  learningContentVersions,
  permissions,
  rolePermissions,
  roles,
  userRoles,
  users,
} from './schema';
import { PRODUCTION_CONTENT_BUNDLE } from './production-curriculum-data';
import { eq, max } from 'drizzle-orm';

export async function seedProductionCurriculum(databaseUrl?: string): Promise<void> {
  const url =
    databaseUrl ||
    process.env.DATABASE_URL ||
    'postgres://postgres:postgres@localhost:5432/phonologic';

  console.log('🚀 Bắt đầu gieo dữ liệu giáo trình chuẩn Production (PhonoLogic Curriculum Seed)...');
  const db = createDbClient(url);

  // 1. Seed Permissions
  console.log(`🔑 Đồng bộ ${ALL_PERMISSIONS.length} quyền hệ thống...`);
  for (const permKey of ALL_PERMISSIONS) {
    const [existing] = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(eq(permissions.key, permKey))
      .limit(1);

    if (!existing) {
      await db.insert(permissions).values({ key: permKey });
    }
  }

  // 2. Seed Roles & RolePermissions
  console.log('🛡️ Đồng bộ các vai trò hệ thống...');
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

  // 3. Seed Default Admin User
  const adminEmail = 'admin@phonologic.dev';
  let adminId: string;
  const [existingAdmin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@123456', 10);
    const [insertedAdmin] = await db
      .insert(users)
      .values({
        email: adminEmail,
        passwordHash,
        fullName: 'Hệ thống Quản trị',
        mustChangePassword: false,
      })
      .returning({ id: users.id });
    adminId = insertedAdmin.id;

    const [adminRole] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.key, 'ADMIN'))
      .limit(1);

    if (adminRole) {
      await db.insert(userRoles).values({
        userId: adminId,
        roleId: adminRole.id,
      });
    }
    console.log(`👤 Đã tạo tài khoản quản trị mặc định: ${adminEmail}`);
  } else {
    adminId = existingAdmin.id;
  }

  // 4. Update Draft with Production Bundle
  console.log(
    `📦 Đồng bộ bản nháp với ${PRODUCTION_CONTENT_BUNDLE.rules.length} quy tắc, ${PRODUCTION_CONTENT_BUNDLE.lessons.length} bài học, ${PRODUCTION_CONTENT_BUNDLE.readings.length} bài đọc...`
  );
  const [existingDraft] = await db
    .select({ id: learningContentDrafts.id })
    .from(learningContentDrafts)
    .where(eq(learningContentDrafts.id, 'current'))
    .limit(1);

  if (!existingDraft) {
    await db.insert(learningContentDrafts).values({
      id: 'current',
      notationVersion: PRODUCTION_CONTENT_BUNDLE.notationVersion,
      notationConfirmed: PRODUCTION_CONTENT_BUNDLE.notationConfirmed,
      bundle: PRODUCTION_CONTENT_BUNDLE,
      updatedAt: new Date(),
    });
  } else {
    await db
      .update(learningContentDrafts)
      .set({
        notationVersion: PRODUCTION_CONTENT_BUNDLE.notationVersion,
        notationConfirmed: PRODUCTION_CONTENT_BUNDLE.notationConfirmed,
        bundle: PRODUCTION_CONTENT_BUNDLE,
        updatedAt: new Date(),
      })
      .where(eq(learningContentDrafts.id, 'current'));
  }

  // 5. Publish Immutable Snapshot v1
  console.log('📸 Xuất bản Snapshot nội dung bất biến v1 vào learningContentVersions...');
  const [maxVersionRow] = await db
    .select({ version: max(learningContentVersions.version) })
    .from(learningContentVersions);

  const currentMaxVersion = maxVersionRow?.version ?? 0;
  if (currentMaxVersion === 0) {
    await db.insert(learningContentVersions).values({
      version: 1,
      notationVersion: PRODUCTION_CONTENT_BUNDLE.notationVersion,
      bundle: PRODUCTION_CONTENT_BUNDLE,
      publishedBy: adminId,
      publishedAt: new Date(),
    });
    console.log('🎉 Đã xuất bản thành công Snapshot v1 chuẩn Production!');
  } else {
    console.log(`ℹ️ Đã tồn tại Snapshot v${currentMaxVersion}, cập nhật phiên bản mới...`);
    const nextVersion = currentMaxVersion + 1;
    await db.insert(learningContentVersions).values({
      version: nextVersion,
      notationVersion: PRODUCTION_CONTENT_BUNDLE.notationVersion,
      bundle: PRODUCTION_CONTENT_BUNDLE,
      publishedBy: adminId,
      publishedAt: new Date(),
    });
    console.log(`🎉 Đã xuất bản thành công Snapshot v${nextVersion} chuẩn Production!`);
  }

  console.log('✅ Hoàn tất gieo dữ liệu giáo trình chuẩn Production!');
}

if (typeof process !== 'undefined' && process.argv[1]?.endsWith('seed-production-curriculum.ts')) {
  seedProductionCurriculum()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Lỗi khi gieo dữ liệu production:', err);
      process.exit(1);
    });
}
