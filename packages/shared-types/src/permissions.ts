export const PERMISSIONS = {
  user: ['create', 'read', 'update', 'delete', 'resetPassword'],
  rbac: ['manageRoles', 'assignRoles'],
  course: ['create', 'read', 'update', 'delete'],
  lesson: ['create', 'read', 'update', 'delete'],
  vocab: ['create', 'read', 'update', 'delete'],
  study: ['readProgress', 'submitExercise'],
} as const;

type Catalog = typeof PERMISSIONS;

export type PermissionKey = {
  [G in keyof Catalog]: `${G & string}.${Catalog[G][number]}`;
}[keyof Catalog];

export const ALL_PERMISSIONS: PermissionKey[] = Object.entries(PERMISSIONS).flatMap(
  ([group, actions]) =>
    (actions as readonly string[]).map((action) => `${group}.${action}` as PermissionKey),
);
