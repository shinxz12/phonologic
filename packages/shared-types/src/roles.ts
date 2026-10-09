import { ALL_PERMISSIONS, type PermissionKey } from './permissions';

export interface SystemRole {
  key: string;
  name: string;
  isSystem: boolean;
  permissions: PermissionKey[];
}

export const SYSTEM_ROLES: SystemRole[] = [
  {
    key: 'ADMIN',
    name: 'Quản trị hệ thống',
    isSystem: true,
    permissions: [...ALL_PERMISSIONS],
  },
  {
    key: 'TEACHER',
    name: 'Giáo viên',
    isSystem: true,
    permissions: [
      'course.create',
      'course.read',
      'course.update',
      'course.delete',
      'lesson.create',
      'lesson.read',
      'lesson.update',
      'lesson.delete',
      'vocab.create',
      'vocab.read',
      'vocab.update',
      'vocab.delete',
      'user.read',
      'study.readProgress',
    ],
  },
  {
    key: 'STUDENT',
    name: 'Học viên',
    isSystem: true,
    permissions: [
      'course.read',
      'lesson.read',
      'vocab.read',
      'study.readProgress',
      'study.submitExercise',
    ],
  },
];
