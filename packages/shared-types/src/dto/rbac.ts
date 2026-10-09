import { z } from 'zod';
import { ALL_PERMISSIONS } from '../permissions';

export const createRoleSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2, 'Mã vai trò tối thiểu 2 ký tự')
    .max(64, 'Mã vai trò tối đa 64 ký tự')
    .regex(/^[A-Z0-9_]+$/, 'Mã vai trò phải là chữ hoa không dấu và dấu gạch dưới (VD: TEACHER_ASSISTANT)'),
  name: z.string().trim().min(1, 'Nhập tên hiển thị vai trò').max(128),
  permissions: z.array(
    z.string().refine((p) => (ALL_PERMISSIONS as readonly string[]).includes(p), {
      message: 'Quyền không hợp lệ',
    }),
  ),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z.object({
  name: z.string().trim().min(1).max(128).optional(),
  permissions: z
    .array(
      z.string().refine((p) => (ALL_PERMISSIONS as readonly string[]).includes(p), {
        message: 'Quyền không hợp lệ',
      }),
    )
    .optional(),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const assignRolesSchema = z.object({
  roleKeys: z.array(z.string().min(1)).min(1, 'Phải chỉ định ít nhất một vai trò'),
});

export type AssignRolesInput = z.infer<typeof assignRolesSchema>;
