import {
  boolean,
  customType,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import type {
  AnswerFeedback,
  ContentBundle,
  ContentQuestion,
} from '@phonologic/shared-types';
import { users } from './users';

export const bytea = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

export const learningPreferences = pgTable('learning_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  goal: varchar('goal', { length: 64 }).notNull().default('communicate'),
  dailyMinutes: integer('daily_minutes').notNull().default(15),
  accent: varchar('accent', { length: 16 }).notNull().default('US'),
  timezone: varchar('timezone', { length: 64 }).notNull().default('Asia/Ho_Chi_Minh'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const learningContentDrafts = pgTable('learning_content_drafts', {
  id: varchar('id', { length: 32 }).primaryKey().default('current'),
  notationVersion: varchar('notation_version', { length: 64 }).notNull().default('0.1.0-draft'),
  notationConfirmed: boolean('notation_confirmed').notNull().default(false),
  bundle: jsonb('bundle').$type<ContentBundle>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const learningContentVersions = pgTable('learning_content_versions', {
  version: integer('version').primaryKey(),
  notationVersion: varchar('notation_version', { length: 64 }).notNull(),
  bundle: jsonb('bundle').$type<ContentBundle>().notNull(),
  publishedBy: uuid('published_by').references(() => users.id, { onDelete: 'set null' }),
  publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow().notNull(),
});

export const learningSessions = pgTable('learning_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  lessonId: varchar('lesson_id', { length: 128 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  version: integer('version').notNull(),
  accent: varchar('accent', { length: 16 }).notNull().default('US'),
  mode: varchar('mode', { length: 32 }).notNull().default('lesson'), // 'lesson' | 'review'
  status: varchar('status', { length: 32 }).notNull().default('active'), // 'active' | 'completed'
  currentIndex: integer('current_index').notNull().default(0),
  questions: jsonb('questions').$type<ContentQuestion[]>().notNull(),
  answers: jsonb('answers').$type<AnswerFeedback[]>().notNull().default([]),
  speaking: varchar('speaking', { length: 32 }).notNull().default('pending'), // 'pending' | 'recorded' | 'skipped'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const learningReviewErrors = pgTable('learning_review_errors', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  questionId: varchar('question_id', { length: 128 }).notNull(),
  lessonId: varchar('lesson_id', { length: 128 }).notNull(),
  version: integer('version').notNull(),
  question: jsonb('question').$type<ContentQuestion>().notNull(),
  resolved: boolean('resolved').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

export const readingProgress = pgTable('reading_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  readingId: varchar('reading_id', { length: 128 }).notNull(),
  version: integer('version').notNull(),
  completedTargetIds: jsonb('completed_target_ids').$type<string[]>().notNull().default([]),
  completed: boolean('completed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const recordings = pgTable('recordings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sessionId: uuid('session_id').references(() => learningSessions.id, { onDelete: 'set null' }),
  readingId: varchar('reading_id', { length: 128 }),
  word: varchar('word', { length: 128 }).notNull(),
  mimeType: varchar('mime_type', { length: 64 }).notNull().default('audio/webm'),
  audioData: bytea('audio_data').notNull(),
  size: integer('size').notNull().default(0),
  status: varchar('status', { length: 32 }).notNull().default('recorded'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const contentReports = pgTable('content_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  questionId: varchar('question_id', { length: 128 }),
  ruleId: varchar('rule_id', { length: 128 }),
  version: integer('version').notNull(),
  description: text('description').notNull(),
  status: varchar('status', { length: 32 }).notNull().default('open'), // 'open' | 'resolved'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});
