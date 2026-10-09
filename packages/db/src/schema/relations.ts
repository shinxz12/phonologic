import { relations } from 'drizzle-orm';
import { refreshTokens, users } from './users';
import { permissions, rolePermissions, roles, userRoles } from './roles';
import {
  contentReports,
  learningPreferences,
  learningReviewErrors,
  learningSessions,
  readingProgress,
  recordings,
} from './learning';

export const usersRelations = relations(users, ({ many, one }) => ({
  refreshTokens: many(refreshTokens),
  userRoles: many(userRoles),
  preferences: one(learningPreferences, {
    fields: [users.id],
    references: [learningPreferences.userId],
  }),
  sessions: many(learningSessions),
  recordings: many(recordings),
  readingProgress: many(readingProgress),
  reviewErrors: many(learningReviewErrors),
  contentReports: many(contentReports),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const learningPreferencesRelations = relations(learningPreferences, ({ one }) => ({
  user: one(users, {
    fields: [learningPreferences.userId],
    references: [users.id],
  }),
}));

export const learningSessionsRelations = relations(learningSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [learningSessions.userId],
    references: [users.id],
  }),
  recordings: many(recordings),
}));

export const recordingsRelations = relations(recordings, ({ one }) => ({
  user: one(users, {
    fields: [recordings.userId],
    references: [users.id],
  }),
  session: one(learningSessions, {
    fields: [recordings.sessionId],
    references: [learningSessions.id],
  }),
}));

export const readingProgressRelations = relations(readingProgress, ({ one }) => ({
  user: one(users, {
    fields: [readingProgress.userId],
    references: [users.id],
  }),
}));

export const learningReviewErrorsRelations = relations(learningReviewErrors, ({ one }) => ({
  user: one(users, {
    fields: [learningReviewErrors.userId],
    references: [users.id],
  }),
}));

export const contentReportsRelations = relations(contentReports, ({ one }) => ({
  user: one(users, {
    fields: [contentReports.userId],
    references: [users.id],
  }),
}));
