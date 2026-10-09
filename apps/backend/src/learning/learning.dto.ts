import { z } from 'zod';
import { createZodDto } from '../common/zod-dto';

export const preferencesSchema = z.object({
  goal: z.string().min(1).max(64),
  dailyMinutes: z.number().int().min(1).max(180),
  accent: z.enum(['US', 'UK']),
  timezone: z.string().min(1).max(64),
});

export const createSessionSchema = z.object({
  lessonId: z.string().min(1),
});

export const submitAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedIds: z.array(z.string()),
});

export const speakingStatusSchema = z.object({
  status: z.literal('skipped'),
});

export const readingTargetSchema = z.object({
  targetId: z.string().min(1),
});

export const contentReportSchema = z.object({
  questionId: z.string().optional(),
  ruleId: z.string().optional(),
  version: z.number().int().nonnegative(),
  description: z.string().min(5),
});

export const publishContentSchema = z.object({
  notationConfirmed: z.boolean().optional(),
  notationVersion: z.string().optional(),
});

export const choiceSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
});

export const wordSegmentSchema = z.object({
  spelling: z.string(),
  notation: z.string(),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
});

export const contentQuestionSchema = z.object({
  id: z.string().min(1),
  kind: z.enum([
    'word_sound',
    'sound_spelling',
    'spelling_sound',
    'sound_word',
    'meaning',
    'spelling',
  ]),
  prompt: z.string().min(1),
  word: z.string().optional(),
  meaning: z.string().optional(),
  notation: z.string().optional(),
  highlight: z
    .object({
      start: z.number().int().nonnegative(),
      end: z.number().int().nonnegative(),
    })
    .optional(),
  choices: z.array(choiceSchema),
  multiple: z.boolean(),
  audioText: z.string().optional(),
  explanation: z.string().optional(),
  ruleId: z.string().optional(),
  segments: z.array(wordSegmentSchema).optional(),
  imageUrl: z.string().optional(),
  correctIds: z.array(z.string()),
});

export const lessonContentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  accent: z.enum(['US', 'UK']),
  prerequisiteId: z.string().nullable(),
  questions: z.array(contentQuestionSchema),
});

export const readingTargetContentSchema = z.object({
  id: z.string().min(1),
  word: z.string().min(1),
  meaning: z.string(),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  segments: z.array(wordSegmentSchema),
});

export const readingContentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  level: z.string(),
  accent: z.enum(['US', 'UK']),
  text: z.string().min(1),
  targets: z.array(readingTargetContentSchema),
  imageUrl: z.string().optional(),
});

export const sourceRuleSchema = z.object({
  id: z.string().min(1),
  sourceRow: z.number().int(),
  sourceLabel: z.string(),
  pattern: z.string(),
  examples: z.array(z.string()),
  condition: z.string().optional(),
  notation: z.string().nullable(),
  status: z.enum(['draft', 'approved']),
  note: z.string().optional(),
});

export const contentBundleSchema = z.object({
  notationVersion: z.string().min(1),
  notationConfirmed: z.boolean(),
  rules: z.array(sourceRuleSchema),
  lessons: z.array(lessonContentSchema),
  readings: z.array(readingContentSchema),
});

export class PreferencesDto extends createZodDto(preferencesSchema) {}
export class CreateSessionDto extends createZodDto(createSessionSchema) {}
export class SubmitAnswerDto extends createZodDto(submitAnswerSchema) {}
export class SpeakingStatusDto extends createZodDto(speakingStatusSchema) {}
export class ReadingTargetDto extends createZodDto(readingTargetSchema) {}
export class ContentReportDto extends createZodDto(contentReportSchema) {}
export class PublishContentDto extends createZodDto(publishContentSchema) {}
export class ContentBundleDto extends createZodDto(contentBundleSchema) {}
