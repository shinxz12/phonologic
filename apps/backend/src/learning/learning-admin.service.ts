import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, max, sql } from 'drizzle-orm';
import {
  contentReports,
  learningContentDrafts,
  learningContentVersions,
} from '@phonologic/db';
import type { Database } from '@phonologic/db';
import type {
  AdminContentView,
  ContentBundle,
  ContentReportView,
  FieldError,
  LessonContent,
} from '@phonologic/shared-types';
import { AppException } from '../common/app-exception';
import { DB_CONNECTION } from '../database/database.constants';
import { INITIAL_SOURCE_RULES } from '@phonologic/db/src/initial-draft-rules';

@Injectable()
export class LearningAdminService {
  constructor(@Inject(DB_CONNECTION) private readonly db: Database) {}

  async getAdminContent(): Promise<AdminContentView> {
    const draft = await this.getOrCreateDraft();
    const publishedVersion = await this.getLatestPublishedVersionNumber();
    const reports = await this.listReports();

    return {
      draft,
      publishedVersion,
      reports,
    };
  }

  async updateDraft(bundle: ContentBundle): Promise<AdminContentView> {
    const [existing] = await this.db
      .select({ id: learningContentDrafts.id })
      .from(learningContentDrafts)
      .where(eq(learningContentDrafts.id, 'current'))
      .limit(1);

    if (existing) {
      await this.db
        .update(learningContentDrafts)
        .set({
          notationVersion: bundle.notationVersion,
          notationConfirmed: bundle.notationConfirmed,
          bundle,
          updatedAt: new Date(),
        })
        .where(eq(learningContentDrafts.id, 'current'));
    } else {
      await this.db.insert(learningContentDrafts).values({
        id: 'current',
        notationVersion: bundle.notationVersion,
        notationConfirmed: bundle.notationConfirmed,
        bundle,
        updatedAt: new Date(),
      });
    }

    return this.getAdminContent();
  }

  async publishDraft(
    userId: string,
    options?: { notationConfirmed?: boolean; notationVersion?: string },
  ): Promise<AdminContentView> {
    // Perform publish atomically with advisory lock and draft read inside transaction
    await this.db.transaction(async (tx) => {
      // 1. Advisory transaction lock to prevent concurrent publish collisions
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('learning_publish_lock'))`);

      // 2. Read draft inside transaction
      const [draftRow] = await tx
        .select()
        .from(learningContentDrafts)
        .where(eq(learningContentDrafts.id, 'current'))
        .limit(1);

      let draft: ContentBundle;
      if (draftRow) {
        draft = draftRow.bundle as ContentBundle;
      } else {
        draft = {
          notationVersion: '0.1.0-draft',
          notationConfirmed: false,
          rules: INITIAL_SOURCE_RULES,
          lessons: [],
          readings: [],
        };
      }

      if (options?.notationConfirmed !== undefined) {
        draft.notationConfirmed = options.notationConfirmed;
      }
      if (options?.notationVersion !== undefined) {
        draft.notationVersion = options.notationVersion;
      }

      // 3. Strict structural validation
      const validationErrors: FieldError[] = [];

      if (!draft.notationConfirmed) {
        validationErrors.push({
          path: 'notationConfirmed',
          code: 'NOTATION_NOT_CONFIRMED',
        });
      }

      // Rules: uniqueness & approved rules official notation
      const seenRuleIds = new Set<string>();
      const approvedRuleIdSet = new Set<string>();

      for (const rule of draft.rules || []) {
        if (seenRuleIds.has(rule.id)) {
          validationErrors.push({
            path: `rules.${rule.id}`,
            code: 'DUPLICATE_RULE_ID',
          });
        }
        seenRuleIds.add(rule.id);

        if (rule.status === 'approved') {
          if (!rule.notation || !rule.notation.trim()) {
            validationErrors.push({
              path: `rules.${rule.id}.notation`,
              code: 'APPROVED_RULE_MISSING_OFFICIAL_NOTATION',
            });
          } else {
            approvedRuleIdSet.add(rule.id);
          }
        }
      }

      // Lessons: uniqueness, questions, choices, answers, cycles
      if (!draft.lessons || draft.lessons.length === 0) {
        validationErrors.push({
          path: 'lessons',
          code: 'LESSONS_EMPTY',
        });
      } else {
        const seenLessonIds = new Set<string>();
        const seenQuestionIds = new Set<string>();
        const lessonMap = new Map<string, LessonContent>();

        for (const lesson of draft.lessons) {
          if (seenLessonIds.has(lesson.id)) {
            validationErrors.push({
              path: `lessons.${lesson.id}`,
              code: 'DUPLICATE_LESSON_ID',
            });
          }
          seenLessonIds.add(lesson.id);
          lessonMap.set(lesson.id, lesson);

          if (!lesson.questions || lesson.questions.length === 0) {
            validationErrors.push({
              path: `lessons.${lesson.id}.questions`,
              code: 'LESSON_QUESTIONS_EMPTY',
            });
            continue;
          }

          for (const q of lesson.questions) {
            if (seenQuestionIds.has(q.id)) {
              validationErrors.push({
                path: `lessons.${lesson.id}.questions.${q.id}`,
                code: 'DUPLICATE_QUESTION_ID',
              });
            }
            seenQuestionIds.add(q.id);

            if (!q.choices || q.choices.length === 0) {
              validationErrors.push({
                path: `lessons.${lesson.id}.questions.${q.id}.choices`,
                code: 'CHOICES_EMPTY',
              });
              continue;
            }

            const seenChoiceIds = new Set<string>();
            for (const choice of q.choices) {
              if (seenChoiceIds.has(choice.id)) {
                validationErrors.push({
                  path: `lessons.${lesson.id}.questions.${q.id}.choices.${choice.id}`,
                  code: 'DUPLICATE_CHOICE_ID',
                });
              }
              seenChoiceIds.add(choice.id);
            }

            if (!q.correctIds || q.correctIds.length === 0) {
              validationErrors.push({
                path: `lessons.${lesson.id}.questions.${q.id}.correctIds`,
                code: 'CORRECT_IDS_EMPTY',
              });
            } else {
              for (const cId of q.correctIds) {
                if (!seenChoiceIds.has(cId)) {
                  validationErrors.push({
                    path: `lessons.${lesson.id}.questions.${q.id}.correctIds`,
                    code: 'CORRECT_ID_NOT_IN_CHOICES',
                  });
                }
              }

              // Single-select questions must have exactly 1 correct ID
              if (!q.multiple && q.correctIds.length !== 1) {
                validationErrors.push({
                  path: `lessons.${lesson.id}.questions.${q.id}.correctIds`,
                  code: 'SINGLE_SELECT_MUST_HAVE_EXACTLY_ONE_CORRECT',
                });
              }
            }

            // ruleId must reference an approved rule with confirmed notation
            if (q.ruleId) {
              if (!approvedRuleIdSet.has(q.ruleId)) {
                validationErrors.push({
                  path: `lessons.${lesson.id}.questions.${q.id}.ruleId`,
                  code: 'RULE_ID_NOT_APPROVED_OR_CONFIRMED',
                });
              }
            }

            // Highlight requires word
            if (q.highlight) {
              if (!q.word || !q.word.trim()) {
                validationErrors.push({
                  path: `lessons.${lesson.id}.questions.${q.id}.highlight`,
                  code: 'HIGHLIGHT_REQUIRES_WORD',
                });
              } else if (
                q.highlight.start < 0 ||
                q.highlight.end > q.word.length ||
                q.highlight.end <= q.highlight.start
              ) {
                validationErrors.push({
                  path: `lessons.${lesson.id}.questions.${q.id}.highlight`,
                  code: 'INVALID_HIGHLIGHT_SPAN',
                });
              }
            }

            // Segments validation
            if (q.segments) {
              for (const seg of q.segments) {
                if (!q.word || !q.word.trim()) {
                  validationErrors.push({
                    path: `lessons.${lesson.id}.questions.${q.id}.segments`,
                    code: 'SEGMENTS_REQUIRE_WORD',
                  });
                  break;
                }
                if (
                  seg.start < 0 ||
                  seg.end <= seg.start ||
                  seg.end > q.word.length ||
                  !seg.notation.trim()
                ) {
                  validationErrors.push({
                    path: `lessons.${lesson.id}.questions.${q.id}.segments`,
                    code: 'INVALID_WORD_SEGMENT_BOUNDS',
                  });
                } else {
                  const slice = q.word.slice(seg.start, seg.end).toLowerCase();
                  if (slice !== seg.spelling.toLowerCase()) {
                    validationErrors.push({
                      path: `lessons.${lesson.id}.questions.${q.id}.segments`,
                      code: 'SEGMENT_SPELLING_MISMATCH_WORD_SLICE',
                    });
                  }
                }
              }
            }
          }
        }

        // Prerequisites existence and cycle detection
        for (const lesson of draft.lessons) {
          if (lesson.prerequisiteId) {
            if (!seenLessonIds.has(lesson.prerequisiteId)) {
              validationErrors.push({
                path: `lessons.${lesson.id}.prerequisiteId`,
                code: 'PREREQUISITE_NOT_FOUND',
              });
            } else if (lesson.prerequisiteId === lesson.id) {
              validationErrors.push({
                path: `lessons.${lesson.id}.prerequisiteId`,
                code: 'PREREQUISITE_SELF_REFERENCE',
              });
            } else {
              // Trace prerequisite chain for cycles
              const visitedChain = new Set<string>([lesson.id]);
              let currId: string | null = lesson.prerequisiteId;
              while (currId) {
                if (visitedChain.has(currId)) {
                  validationErrors.push({
                    path: `lessons.${lesson.id}.prerequisiteId`,
                    code: 'PREREQUISITE_CYCLE_DETECTED',
                  });
                  break;
                }
                visitedChain.add(currId);
                const nextPrereq = lessonMap.get(currId);
                currId = nextPrereq?.prerequisiteId || null;
              }
            }
          }
        }
      }

      // Readings: uniqueness & target segments
      const seenReadingIds = new Set<string>();
      for (const reading of draft.readings || []) {
        if (seenReadingIds.has(reading.id)) {
          validationErrors.push({
            path: `readings.${reading.id}`,
            code: 'DUPLICATE_READING_ID',
          });
        }
        seenReadingIds.add(reading.id);

        const seenTargetIds = new Set<string>();
        for (const target of reading.targets || []) {
          if (seenTargetIds.has(target.id)) {
            validationErrors.push({
              path: `readings.${reading.id}.targets.${target.id}`,
              code: 'DUPLICATE_TARGET_ID',
            });
          }
          seenTargetIds.add(target.id);

          if (
            target.start < 0 ||
            target.end > reading.text.length ||
            target.end <= target.start
          ) {
            validationErrors.push({
              path: `readings.${reading.id}.targets.${target.id}`,
              code: 'INVALID_TARGET_OFFSET',
            });
          } else {
            const sliceText = reading.text.slice(target.start, target.end).toLowerCase();
            if (sliceText !== target.word.toLowerCase()) {
              validationErrors.push({
                path: `readings.${reading.id}.targets.${target.id}`,
                code: 'TARGET_WORD_OFFSET_MISMATCH',
              });
            }
          }

          if (target.segments) {
            for (const seg of target.segments) {
              if (
                seg.start < 0 ||
                seg.end <= seg.start ||
                seg.end > target.word.length ||
                !seg.notation.trim()
              ) {
                validationErrors.push({
                  path: `readings.${reading.id}.targets.${target.id}.segments`,
                  code: 'INVALID_TARGET_SEGMENT_BOUNDS',
                });
              } else {
                const segSlice = target.word.slice(seg.start, seg.end).toLowerCase();
                if (segSlice !== seg.spelling.toLowerCase()) {
                  validationErrors.push({
                    path: `readings.${reading.id}.targets.${target.id}.segments`,
                    code: 'TARGET_SEGMENT_SPELLING_MISMATCH',
                  });
                }
              }
            }
          }
        }
      }

      if (validationErrors.length > 0) {
        throw new AppException('VALIDATION_ERROR', {
          message: 'Dữ liệu nội dung chưa đạt chuẩn xuất bản',
          errors: validationErrors,
        });
      }

      // Calculate max version inside transaction
      const [maxRow] = await tx
        .select({ version: max(learningContentVersions.version) })
        .from(learningContentVersions);

      const nextVersion = (maxRow?.version ?? 0) + 1;

      // Insert immutable version and update draft inside same transaction
      await tx.insert(learningContentVersions).values({
        version: nextVersion,
        notationVersion: draft.notationVersion,
        bundle: draft,
        publishedBy: userId,
        publishedAt: new Date(),
      });

      await tx
        .update(learningContentDrafts)
        .set({
          notationVersion: draft.notationVersion,
          notationConfirmed: draft.notationConfirmed,
          bundle: draft,
          updatedAt: new Date(),
        })
        .where(eq(learningContentDrafts.id, 'current'));
    });

    return this.getAdminContent();
  }

  async resolveReport(reportId: string): Promise<{ success: boolean }> {
    const [existing] = await this.db
      .select({ id: contentReports.id })
      .from(contentReports)
      .where(eq(contentReports.id, reportId))
      .limit(1);

    if (!existing) {
      throw new AppException('NOT_FOUND', { message: 'Không tìm thấy báo cáo' });
    }

    await this.db
      .update(contentReports)
      .set({
        status: 'resolved',
        resolvedAt: new Date(),
      })
      .where(eq(contentReports.id, reportId));

    return { success: true };
  }

  private async getOrCreateDraft(): Promise<ContentBundle> {
    const [row] = await this.db
      .select()
      .from(learningContentDrafts)
      .where(eq(learningContentDrafts.id, 'current'))
      .limit(1);

    if (row) {
      return row.bundle as ContentBundle;
    }

    const defaultBundle: ContentBundle = {
      notationVersion: '0.1.0-draft',
      notationConfirmed: false,
      rules: INITIAL_SOURCE_RULES,
      lessons: [],
      readings: [],
    };

    await this.db.insert(learningContentDrafts).values({
      id: 'current',
      notationVersion: '0.1.0-draft',
      notationConfirmed: false,
      bundle: defaultBundle,
      updatedAt: new Date(),
    });

    return defaultBundle;
  }

  private async getLatestPublishedVersionNumber(): Promise<number> {
    const [latest] = await this.db
      .select({ version: max(learningContentVersions.version) })
      .from(learningContentVersions);

    return latest?.version ?? 0;
  }

  private async listReports(): Promise<ContentReportView[]> {
    const rows = await this.db
      .select()
      .from(contentReports)
      .orderBy(desc(contentReports.createdAt));

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      questionId: r.questionId || undefined,
      ruleId: r.ruleId || undefined,
      version: r.version,
      description: r.description,
      status: r.status as 'open' | 'resolved',
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
