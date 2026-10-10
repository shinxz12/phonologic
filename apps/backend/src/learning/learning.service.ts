import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import {
  contentReports,
  learningContentDrafts,
  learningContentVersions,
  learningPreferences,
  learningReviewErrors,
  learningSessions,
  readingProgress,
  recordings,
} from '@phonologic/db';
import type { Database } from '@phonologic/db';
import type {
  Accent,
  AnswerFeedback,
  ContentBundle,
  ContentQuestion,
  ContentReportInput,
  LearnerProgress,
  LearningDashboard,
  LearningQuestion,
  LessonSummary,
  Preferences,
  QuestionKind,
  ReadingContent,
  ReadingSummary,
  ReadingView,
  RecordingView,
  SessionView,
  SourceRule,
} from '@phonologic/shared-types';
import { AppException } from '../common/app-exception';
import { DB_CONNECTION } from '../database/database.constants';
import { isCorrectAnswer } from './answer-grading';

export interface AudioUploadFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/ogg',
  'audio/ogg;codecs=opus',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
  'audio/x-m4a',
  'audio/aac',
]);


@Injectable()
export class LearningService {
  constructor(@Inject(DB_CONNECTION) private readonly db: Database) {}


  async getAzureSpeechToken(): Promise<{ token: string; region: string }> {
    const key = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;

    if (!key || !region) {
      throw new AppException('INTERNAL_SERVER_ERROR', {
        message: 'Tính năng chấm điểm chưa được cấu hình trên máy chủ.',
      });
    }

    try {
      const response = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        throw new Error('Azure token endpoint trả về lỗi');
      }

      const token = await response.text();
      return { token, region };
    } catch {
      throw new AppException('INTERNAL_SERVER_ERROR', {
        message: 'Không thể khởi tạo dịch vụ chấm điểm.',
      });
    }
  }
  // 1. Preferences
  async getPreferences(userId: string): Promise<Preferences> {
    const [row] = await this.db
      .select()
      .from(learningPreferences)
      .where(eq(learningPreferences.userId, userId))
      .limit(1);

    if (row) {
      return {
        goal: row.goal,
        dailyMinutes: row.dailyMinutes,
        accent: row.accent as Accent,
        timezone: row.timezone,
      };
    }

    return {
      goal: 'communicate',
      dailyMinutes: 15,
      accent: 'US',
      timezone: 'Asia/Ho_Chi_Minh',
    };
  }

  async updatePreferences(userId: string, input: Preferences): Promise<Preferences> {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: input.timezone });
    } catch {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Múi giờ không hợp lệ',
      });
    }

    await this.db
      .insert(learningPreferences)
      .values({
        userId,
        goal: input.goal,
        dailyMinutes: input.dailyMinutes,
        accent: input.accent,
        timezone: input.timezone,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: learningPreferences.userId,
        set: {
          goal: input.goal,
          dailyMinutes: input.dailyMinutes,
          accent: input.accent,
          timezone: input.timezone,
          updatedAt: new Date(),
        },
      });

    return input;
  }

  // 2. Published Content Version Helper
  async getLatestPublishedBundle(): Promise<{
    version: number;
    bundle: ContentBundle;
  } | null> {
    const [latest] = await this.db
      .select()
      .from(learningContentVersions)
      .orderBy(desc(learningContentVersions.version))
      .limit(1);

    if (!latest) return null;
    return {
      version: latest.version,
      bundle: latest.bundle as ContentBundle,
    };
  }

  async getPublishedBundleByVersion(version: number): Promise<ContentBundle | null> {
    const [row] = await this.db
      .select()
      .from(learningContentVersions)
      .where(eq(learningContentVersions.version, version))
      .limit(1);

    return row ? (row.bundle as ContentBundle) : null;
  }

  // 3. Dashboard
  async getDashboard(userId: string): Promise<LearningDashboard> {
    const preferences = await this.getPreferences(userId);
    const published = await this.getLatestPublishedBundle();

    const capabilities = {
      pronunciationAssessment: false,
      passwordRecovery: false,
    };

    if (!published || published.version === 0) {
      return {
        version: 0,
        lessons: [],
        readings: [],
        preferences,
        progress: {
          answered: 0,
          correct: 0,
          accuracy: null,
          completedLessons: 0,
          totalLessons: 0,
          reviewCount: 0,
          studyDays: 0,
          streak: 0,
          speakingRecorded: 0,
          speakingSkipped: 0,
          speakingScore: null,
          recent: [],
        },
        capabilities,
        contentNotice:
          'Chưa có nội dung chính thức được xuất bản. Vui lòng quay lại sau hoặc liên hệ quản trị viên.',
      };
    }

    const { version, bundle } = published;

    const userSessions = await this.db
      .select()
      .from(learningSessions)
      .where(eq(learningSessions.userId, userId));

    const completedLessonIds = new Set<string>();
    const activeSessionByLessonId = new Map<string, string>();
    for (const sess of userSessions) {
      if (sess.mode === 'lesson') {
        if (sess.status === 'completed') {
          completedLessonIds.add(sess.lessonId);
        } else if (sess.status === 'active') {
          activeSessionByLessonId.set(sess.lessonId, sess.id);
        }
      }
    }

    const lessons: LessonSummary[] = bundle.lessons.map((lesson) => {
      let status: 'locked' | 'current' | 'completed' = 'locked';
      const activeSessionId = activeSessionByLessonId.get(lesson.id);

      if (completedLessonIds.has(lesson.id)) {
        status = 'completed';
      } else if (activeSessionId) {
        status = 'current';
      } else if (!lesson.prerequisiteId || completedLessonIds.has(lesson.prerequisiteId)) {
        status = 'current';
      }

      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        accent: lesson.accent,
        questionCount: lesson.questions?.length ?? 0,
        status,
        sessionId: activeSessionId,
      };
    });

    const readingProgressRows = await this.db
      .select()
      .from(readingProgress)
      .where(eq(readingProgress.userId, userId));

    const readingProgressMap = new Map<
      string,
      { completedTargetIds: string[]; completed: boolean }
    >();
    for (const rp of readingProgressRows) {
      readingProgressMap.set(rp.readingId, {
        completedTargetIds: (rp.completedTargetIds as string[]) || [],
        completed: rp.completed,
      });
    }

    const readings: ReadingSummary[] = bundle.readings.map((reading) => {
      const prog = readingProgressMap.get(reading.id);
      return {
        id: reading.id,
        title: reading.title,
        description: reading.description,
        level: reading.level,
        accent: reading.accent,
        targetCount: reading.targets?.length ?? 0,
        completedTargets: prog?.completedTargetIds?.length ?? 0,
        completed: prog?.completed ?? false,
        imageUrl: reading.imageUrl,
      };
    });

    const progress = await this.calculateLearnerProgress(
      userId,
      userSessions,
      bundle.lessons.length,
      preferences.timezone,
    );

    return {
      version,
      lessons,
      readings,
      preferences,
      progress,
      capabilities,
      contentNotice: null,
    };
  }

  private async calculateLearnerProgress(
    userId: string,
    userSessions: (typeof learningSessions.$inferSelect)[],
    totalLessons: number,
    timezone: string,
  ): Promise<LearnerProgress> {
    let answered = 0;
    let correct = 0;
    let speakingSkipped = 0;
    const recentAnswers: { title: string; correct: boolean; at: string }[] = [];

    const sortedSessions = [...userSessions].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );

    const activeDaysSet = new Set<string>();

    for (const sess of sortedSessions) {
      if (sess.speaking === 'skipped') {
        speakingSkipped++;
      }
      const answers = (sess.answers as AnswerFeedback[]) || [];
      answered += answers.length;
      for (const ans of answers) {
        if (ans.correct) correct++;
        if (recentAnswers.length < 5) {
          recentAnswers.push({
            title: sess.title,
            correct: ans.correct,
            at: sess.updatedAt.toISOString(),
          });
        }
      }

      try {
        const dateStr = sess.updatedAt.toLocaleDateString('en-CA', { timeZone: timezone });
        activeDaysSet.add(dateStr);
      } catch {
        activeDaysSet.add(sess.updatedAt.toISOString().slice(0, 10));
      }
    }

    const userRecordings = await this.db
      .select({ createdAt: recordings.createdAt })
      .from(recordings)
      .where(eq(recordings.userId, userId));

    const speakingRecorded = userRecordings.length;
    for (const rec of userRecordings) {
      try {
        const dateStr = rec.createdAt.toLocaleDateString('en-CA', { timeZone: timezone });
        activeDaysSet.add(dateStr);
      } catch {
        activeDaysSet.add(rec.createdAt.toISOString().slice(0, 10));
      }
    }

    const [reviewCountResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(learningReviewErrors)
      .where(
        and(
          eq(learningReviewErrors.userId, userId),
          eq(learningReviewErrors.resolved, false),
        ),
      );
    const reviewCount = reviewCountResult?.count ?? 0;

    const completedLessonIds = new Set<string>();
    for (const sess of userSessions) {
      if (sess.mode === 'lesson' && sess.status === 'completed') {
        completedLessonIds.add(sess.lessonId);
      }
    }

    const streak = this.calculateStreak(activeDaysSet, timezone);

    return {
      answered,
      correct,
      accuracy: answered > 0 ? Math.round((correct / answered) * 100) : null,
      completedLessons: completedLessonIds.size,
      totalLessons,
      reviewCount,
      studyDays: activeDaysSet.size,
      streak,
      speakingRecorded,
      speakingSkipped,
      speakingScore: null,
      recent: recentAnswers,
    };
  }

  private calculateStreak(days: Set<string>, timezone: string): number {
    if (days.size === 0) return 0;

    const now = new Date();
    let todayStr: string;
    let yesterdayStr: string;

    try {
      todayStr = now.toLocaleDateString('en-CA', { timeZone: timezone });
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: timezone });
    } catch {
      todayStr = now.toISOString().slice(0, 10);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      yesterdayStr = yesterday.toISOString().slice(0, 10);
    }

    let checkDate: Date;
    if (days.has(todayStr)) {
      checkDate = now;
    } else if (days.has(yesterdayStr)) {
      checkDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else {
      return 0;
    }

    let streak = 0;
    while (true) {
      let dStr: string;
      try {
        dStr = checkDate.toLocaleDateString('en-CA', { timeZone: timezone });
      } catch {
        dStr = checkDate.toISOString().slice(0, 10);
      }

      if (days.has(dStr)) {
        streak++;
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }

    return streak;
  }

  // 4. Rules
  async getRules(search?: string): Promise<SourceRule[]> {
    const published = await this.getLatestPublishedBundle();
    if (!published || !published.bundle.rules) return [];

    let approvedRules = published.bundle.rules.filter((r) => r.status === 'approved');

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      approvedRules = approvedRules.filter((r) => {
        if (r.pattern && r.pattern.toLowerCase().includes(q)) return true;
        if (r.sourceLabel && r.sourceLabel.toLowerCase().includes(q)) return true;
        if (r.notation && r.notation.toLowerCase().includes(q)) return true;
        if (r.condition && r.condition.toLowerCase().includes(q)) return true;
        if (r.examples && r.examples.some((ex) => ex.toLowerCase().includes(q))) return true;
        return false;
      });
    }

    return approvedRules;
  }

  // 5. Learning Sessions
  async createSession(userId: string, lessonId: string): Promise<SessionView> {
    return await this.db.transaction(async (tx) => {
      // Per-user advisory lock before existence query to prevent concurrent duplicate session creation
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${'session_create_' + userId}))`,
      );

      const published = await this.getLatestPublishedBundle();
      if (!published) {
        throw new AppException('NOT_FOUND', { message: 'Chưa có nội dung bài học được xuất bản' });
      }

      const lesson = published.bundle.lessons.find((l) => l.id === lessonId);
      if (!lesson) {
        throw new AppException('LESSON_NOT_FOUND', { message: 'Không tìm thấy bài học' });
      }

      // Enforce prerequisites
      if (lesson.prerequisiteId) {
        const [prereqCompleted] = await tx
          .select({ id: learningSessions.id })
          .from(learningSessions)
          .where(
            and(
              eq(learningSessions.userId, userId),
              eq(learningSessions.lessonId, lesson.prerequisiteId),
              eq(learningSessions.status, 'completed'),
            ),
          )
          .limit(1);

        if (!prereqCompleted) {
          throw new AppException('VALIDATION_ERROR', {
            message: 'Bạn cần hoàn thành bài học tiên quyết trước',
          });
        }
      }

      // Check if user already has an active session for this lesson
      const [existingActive] = await tx
        .select()
        .from(learningSessions)
        .where(
          and(
            eq(learningSessions.userId, userId),
            eq(learningSessions.lessonId, lessonId),
            eq(learningSessions.status, 'active'),
          ),
        )
        .for('update')
        .limit(1);

      if (existingActive) {
        return this.toSessionView(existingActive);
      }

      const preferences = await this.getPreferences(userId);
      const sessionAccent = preferences.accent || lesson.accent;

      const [newSession] = await tx
        .insert(learningSessions)
        .values({
          userId,
          lessonId: lesson.id,
          title: lesson.title,
          version: published.version,
          accent: sessionAccent,
          mode: 'lesson',
          status: 'active',
          currentIndex: 0,
          questions: lesson.questions,
          answers: [],
          speaking: 'pending',
        })
        .returning();

      if (!newSession) {
        throw new AppException('INTERNAL_SERVER_ERROR', {
          message: 'Không thể tạo phiên học mới',
        });
      }

      return this.toSessionView(newSession);
    });
  }

  async createReviewSession(userId: string): Promise<SessionView> {
    return await this.db.transaction(async (tx) => {
      // Per-user advisory lock before existence query
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${'session_create_' + userId}))`,
      );

      // Resume existing active review session if present
      const [existingReview] = await tx
        .select()
        .from(learningSessions)
        .where(
          and(
            eq(learningSessions.userId, userId),
            eq(learningSessions.mode, 'review'),
            eq(learningSessions.status, 'active'),
          ),
        )
        .for('update')
        .limit(1);

      if (existingReview) {
        return this.toSessionView(existingReview);
      }

      const published = await this.getLatestPublishedBundle();
      if (!published) {
        throw new AppException('NOT_FOUND', { message: 'Không có nội dung bài học nào' });
      }

      // Map current published questions by ID so withdrawn questions are NOT resurrected
      const publishedQuestionsMap = new Map<string, ContentQuestion>();
      for (const lesson of published.bundle.lessons) {
        for (const q of lesson.questions) {
          publishedQuestionsMap.set(q.id, q);
        }
      }

      const errorRows = await tx
        .select({ questionId: learningReviewErrors.questionId })
        .from(learningReviewErrors)
        .where(
          and(
            eq(learningReviewErrors.userId, userId),
            eq(learningReviewErrors.resolved, false),
          ),
        );

      const seen = new Set<string>();
      const questions: ContentQuestion[] = [];
      for (const row of errorRows) {
        if (!seen.has(row.questionId)) {
          seen.add(row.questionId);
          const publishedQ = publishedQuestionsMap.get(row.questionId);
          if (publishedQ) {
            questions.push(publishedQ);
          }
        }
      }

      if (questions.length === 0) {
        throw new AppException('NOT_FOUND', {
          message: 'Không có câu hỏi nào cần ôn tập',
        });
      }

      const preferences = await this.getPreferences(userId);

      const [reviewSession] = await tx
        .insert(learningSessions)
        .values({
          userId,
          lessonId: 'review',
          title: 'Ôn tập câu sai',
          version: published.version,
          accent: preferences.accent,
          mode: 'review',
          status: 'active',
          currentIndex: 0,
          questions,
          answers: [],
          speaking: 'skipped',
        })
        .returning();

      if (!reviewSession) {
        throw new AppException('INTERNAL_SERVER_ERROR', {
          message: 'Không thể tạo phiên ôn tập',
        });
      }

      return this.toSessionView(reviewSession);
    });
  }

  async getSession(userId: string, sessionId: string): Promise<SessionView> {
    const [session] = await this.db
      .select()
      .from(learningSessions)
      .where(
        and(
          eq(learningSessions.id, sessionId),
          eq(learningSessions.userId, userId),
        ),
      )
      .limit(1);

    if (!session) {
      throw new AppException('NOT_FOUND', { message: 'Không tìm thấy phiên học' });
    }

    return this.toSessionView(session);
  }

  async submitAnswer(
    userId: string,
    sessionId: string,
    questionId: string,
    selectedIds: string[],
  ): Promise<SessionView> {
    return await this.db.transaction(async (tx) => {
      const [session] = await tx
        .select()
        .from(learningSessions)
        .where(
          and(
            eq(learningSessions.id, sessionId),
            eq(learningSessions.userId, userId),
          ),
        )
        .for('update')
        .limit(1);

      if (!session) {
        throw new AppException('NOT_FOUND', { message: 'Không tìm thấy phiên học' });
      }

      const questions = session.questions as ContentQuestion[];
      const answers = (session.answers as AnswerFeedback[]) || [];

      // Idempotence: if question already answered, return current state
      const alreadyAnswered = answers.find((a) => a.questionId === questionId);
      if (alreadyAnswered) {
        return this.toSessionView(session);
      }

      if (session.status === 'completed') {
        throw new AppException('VALIDATION_ERROR', { message: 'Phiên học đã hoàn thành' });
      }

      const currentIndex = session.currentIndex;
      if (currentIndex >= questions.length) {
        throw new AppException('VALIDATION_ERROR', { message: 'Đã hết câu hỏi trong phiên' });
      }

      const currentQuestion = questions[currentIndex];
      if (!currentQuestion) {
        throw new AppException('VALIDATION_ERROR', { message: 'Không tìm thấy câu hỏi hiện tại' });
      }

      if (currentQuestion.id !== questionId) {
        throw new AppException('VALIDATION_ERROR', {
          message: 'Chỉ được trả lời câu hỏi hiện tại',
        });
      }

      const isCorrect = isCorrectAnswer(currentQuestion, selectedIds);

      const feedback: AnswerFeedback = {
        questionId: currentQuestion.id,
        selectedIds,
        correctIds: currentQuestion.correctIds || [],
        correct: isCorrect,
        explanation: currentQuestion.explanation || '',
      };

      const updatedAnswers = [...answers, feedback];
      const nextIndex = currentIndex + 1;
      const isCompleted = nextIndex >= questions.length;

      if (!isCorrect) {
        await tx.insert(learningReviewErrors).values({
          userId,
          questionId: currentQuestion.id,
          lessonId: session.lessonId,
          version: session.version,
          question: currentQuestion,
          resolved: false,
        });
      } else if (session.mode === 'review') {
        await tx
          .update(learningReviewErrors)
          .set({
            resolved: true,
            resolvedAt: new Date(),
          })
          .where(
            and(
              eq(learningReviewErrors.userId, userId),
              eq(learningReviewErrors.questionId, currentQuestion.id),
            ),
          );
      }

      const [updatedSession] = await tx
        .update(learningSessions)
        .set({
          currentIndex: nextIndex,
          answers: updatedAnswers,
          status: isCompleted ? 'completed' : 'active',
          updatedAt: new Date(),
        })
        .where(eq(learningSessions.id, session.id))
        .returning();

      if (!updatedSession) {
        throw new AppException('INTERNAL_SERVER_ERROR', {
          message: 'Không thể cập nhật phiên học',
        });
      }

      return this.toSessionView(updatedSession);
    });
  }

  async updateSpeakingStatus(
    userId: string,
    sessionId: string,
    status: 'skipped',
  ): Promise<SessionView> {
    const [session] = await this.db
      .select()
      .from(learningSessions)
      .where(
        and(
          eq(learningSessions.id, sessionId),
          eq(learningSessions.userId, userId),
        ),
      )
      .limit(1);

    if (!session) {
      throw new AppException('NOT_FOUND', { message: 'Không tìm thấy phiên học' });
    }

    const [updated] = await this.db
      .update(learningSessions)
      .set({
        speaking: status,
        updatedAt: new Date(),
      })
      .where(eq(learningSessions.id, session.id))
      .returning();

    if (!updated) {
      throw new AppException('INTERNAL_SERVER_ERROR', {
        message: 'Không thể cập nhật trạng thái luyện nói',
      });
    }

    return this.toSessionView(updated);
  }

  // Answer sanitizer: omit notation & segments for unanswered sound recognition questions
  private toSessionView(session: typeof learningSessions.$inferSelect): SessionView {
    const fullQuestions = (session.questions as ContentQuestion[]) || [];
    const answers = (session.answers as AnswerFeedback[]) || [];
    const answeredQuestionIds = new Set(answers.map((a) => a.questionId));

    const sanitizedQuestions: LearningQuestion[] = fullQuestions.map((q) => {
      const isAnswered = answeredQuestionIds.has(q.id);
      const isSoundRecognition =
        q.kind === 'word_sound' ||
        q.kind === 'spelling_sound' ||
        q.kind === 'sound_spelling';

      const sanitized: LearningQuestion = {
        id: q.id,
        kind: q.kind as QuestionKind,
        prompt: q.prompt,
        word: q.word,
        meaning: isAnswered || q.kind !== 'meaning' ? q.meaning : undefined,
        notation: isAnswered || !isSoundRecognition ? q.notation : undefined,
        highlight: q.highlight,
        choices: q.choices,
        multiple: q.multiple,
        audioText: q.audioText,
        ruleId: q.ruleId,
        segments: isAnswered || !isSoundRecognition ? q.segments : undefined,
        imageUrl: q.imageUrl,
        explanation: isAnswered ? q.explanation : undefined,
      };

      return sanitized;
    });

    return {
      id: session.id,
      lessonId: session.lessonId,
      title: session.title,
      version: session.version,
      accent: session.accent as Accent,
      mode: session.mode as 'lesson' | 'review',
      status: session.status as 'active' | 'completed',
      currentIndex: session.currentIndex,
      questions: sanitizedQuestions,
      answers,
      speaking: session.speaking as 'pending' | 'recorded' | 'skipped',
    };
  }

  // 6. Readings: transactional locked progress helper fixing version snapshot on initial open
  private async getOrCreateReadingProgressTx(
    tx: Database,
    userId: string,
    readingId: string,
  ): Promise<{
    reading: ReadingContent;
    version: number;
    completedTargetIds: string[];
    completed: boolean;
  }> {
    // Advisory lock per user + reading to serialize initial open and updates
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${'reading_' + userId + '_' + readingId}))`,
    );

    const [existingProgress] = await tx
      .select()
      .from(readingProgress)
      .where(
        and(
          eq(readingProgress.userId, userId),
          eq(readingProgress.readingId, readingId),
        ),
      )
      .for('update')
      .limit(1);

    if (existingProgress) {
      const bundle = await this.getPublishedBundleByVersion(existingProgress.version);
      if (!bundle) {
        throw new AppException('NOT_FOUND', { message: 'Phiên bản bài đọc không tồn tại' });
      }
      const reading = bundle.readings.find((r) => r.id === readingId);
      if (!reading) {
        throw new AppException('NOT_FOUND', { message: 'Không tìm thấy bài đọc' });
      }
      return {
        reading,
        version: existingProgress.version,
        completedTargetIds: (existingProgress.completedTargetIds as string[]) || [],
        completed: existingProgress.completed,
      };
    }

    // No existing progress: lock snapshot to current latest published version
    const published = await this.getLatestPublishedBundle();
    if (!published) {
      throw new AppException('NOT_FOUND', { message: 'Chưa có nội dung bài đọc' });
    }
    const reading = published.bundle.readings.find((r) => r.id === readingId);
    if (!reading) {
      throw new AppException('NOT_FOUND', { message: 'Không tìm thấy bài đọc' });
    }

    await tx.insert(readingProgress).values({
      userId,
      readingId,
      version: published.version,
      completedTargetIds: [],
      completed: false,
    });

    return {
      reading,
      version: published.version,
      completedTargetIds: [],
      completed: false,
    };
  }

  async getReading(userId: string, readingId: string): Promise<ReadingView> {
    return await this.db.transaction(async (tx) => {
      const data = await this.getOrCreateReadingProgressTx(tx, userId, readingId);
      return {
        ...data.reading,
        version: data.version,
        completedTargetIds: data.completedTargetIds,
        completed: data.completed,
      };
    });
  }

  async markReadingTarget(
    userId: string,
    readingId: string,
    targetId: string,
  ): Promise<ReadingView> {
    return await this.db.transaction(async (tx) => {
      const data = await this.getOrCreateReadingProgressTx(tx, userId, readingId);

      const targetExists = data.reading.targets.some((t) => t.id === targetId);
      if (!targetExists) {
        throw new AppException('VALIDATION_ERROR', {
          message: 'Từ mục tiêu không thuộc bài đọc này',
        });
      }

      const completedSet = new Set(data.completedTargetIds);
      completedSet.add(targetId);
      const updatedTargetIds = Array.from(completedSet);

      await tx
        .update(readingProgress)
        .set({
          completedTargetIds: updatedTargetIds,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(readingProgress.userId, userId),
            eq(readingProgress.readingId, readingId),
          ),
        );

      return {
        ...data.reading,
        version: data.version,
        completedTargetIds: updatedTargetIds,
        completed: data.completed,
      };
    });
  }

  async completeReading(userId: string, readingId: string): Promise<ReadingView> {
    return await this.db.transaction(async (tx) => {
      const data = await this.getOrCreateReadingProgressTx(tx, userId, readingId);

      const targetIds = data.reading.targets.map((t) => t.id);
      const completedSet = new Set(data.completedTargetIds);
      const allCompleted = targetIds.every((id) => completedSet.has(id));

      if (!allCompleted) {
        throw new AppException('VALIDATION_ERROR', {
          message: 'Cần hoàn thành tất cả các từ mục tiêu trước khi hoàn thành bài đọc',
        });
      }

      await tx
        .update(readingProgress)
        .set({
          completed: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(readingProgress.userId, userId),
            eq(readingProgress.readingId, readingId),
          ),
        );

      return {
        ...data.reading,
        version: data.version,
        completedTargetIds: data.completedTargetIds,
        completed: true,
      };
    });
  }

  // 7. Audio Recordings
  async listRecordings(userId: string): Promise<RecordingView[]> {
    // Project only metadata fields; do not select heavy audioData binary
    const rows = await this.db
      .select({
        id: recordings.id,
        sessionId: recordings.sessionId,
        readingId: recordings.readingId,
        word: recordings.word,
        createdAt: recordings.createdAt,
        status: recordings.status,
      })
      .from(recordings)
      .where(eq(recordings.userId, userId))
      .orderBy(desc(recordings.createdAt));

    return rows.map((r) => ({
      id: r.id,
      sessionId: r.sessionId,
      readingId: r.readingId,
      word: r.word,
      createdAt: r.createdAt.toISOString(),
      status: 'recorded',
      assessment: null,
    }));
  }

  async createRecording(
    userId: string,
    file: AudioUploadFile,
    word: string,
    sessionId?: string,
    readingId?: string,
  ): Promise<RecordingView> {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Tập tin ghi âm không hợp lệ',
      });
    }

    if (file.buffer.length > 5 * 1024 * 1024) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Kích thước tập tin ghi âm vượt quá giới hạn 5MB',
      });
    }

    const trimmedWord = (word || '').trim();
    if (trimmedWord.length === 0 || trimmedWord.length > 128) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Từ cần ghi âm phải từ 1 đến 128 ký tự',
      });
    }

    const mimeType = (file.mimetype || 'audio/webm').toLowerCase().trim();
    if (!ALLOWED_AUDIO_MIME_TYPES.has(mimeType)) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Định dạng âm thanh không được hỗ trợ',
      });
    }

    return await this.db.transaction(async (tx) => {
      // Validate session ownership if provided; reject foreign/unknown context
      let verifiedSessionId: string | null = null;
      if (sessionId) {
        const [userSession] = await tx
          .select({ id: learningSessions.id })
          .from(learningSessions)
          .where(
            and(
              eq(learningSessions.id, sessionId),
              eq(learningSessions.userId, userId),
            ),
          )
          .for('update')
          .limit(1);

        if (!userSession) {
          throw new AppException('VALIDATION_ERROR', {
            message: 'Phiên học không tồn tại hoặc không thuộc quyền sở hữu của bạn',
          });
        }

        verifiedSessionId = userSession.id;

        // Atomically update session speaking status
        await tx
          .update(learningSessions)
          .set({
            speaking: 'recorded',
            updatedAt: new Date(),
          })
          .where(eq(learningSessions.id, userSession.id));
      }

      // Validate reading if provided
      let verifiedReadingId: string | null = null;
      if (readingId) {
        const [progress] = await tx
          .select({ id: readingProgress.id })
          .from(readingProgress)
          .where(
            and(
              eq(readingProgress.userId, userId),
              eq(readingProgress.readingId, readingId),
            ),
          )
          .limit(1);

        if (!progress) {
          const published = await this.getLatestPublishedBundle();
          const readingExists = published?.bundle.readings.some((r) => r.id === readingId);
          if (!readingExists) {
            throw new AppException('VALIDATION_ERROR', {
              message: 'Bài đọc không hợp lệ',
            });
          }
        }

        verifiedReadingId = readingId;
      }

      const [inserted] = await tx
        .insert(recordings)
        .values({
          userId,
          sessionId: verifiedSessionId,
          readingId: verifiedReadingId,
          word: trimmedWord,
          mimeType,
          audioData: file.buffer,
          size: file.buffer.length,
          status: 'recorded',
        })
        .returning();

      if (!inserted) {
        throw new AppException('INTERNAL_SERVER_ERROR', {
          message: 'Không thể lưu bản thu âm',
        });
      }

      return {
        id: inserted.id,
        sessionId: inserted.sessionId,
        readingId: inserted.readingId,
        word: inserted.word,
        createdAt: inserted.createdAt.toISOString(),
        status: 'recorded',
        assessment: null,
      };
    });
  }

  async getRecordingAudio(
    userId: string,
    recordingId: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    // Add owner filter upfront in SQL query
    const [row] = await this.db
      .select({
        mimeType: recordings.mimeType,
        audioData: recordings.audioData,
      })
      .from(recordings)
      .where(
        and(
          eq(recordings.id, recordingId),
          eq(recordings.userId, userId),
        ),
      )
      .limit(1);

    if (!row) {
      throw new AppException('NOT_FOUND', { message: 'Không tìm thấy bản thu âm' });
    }

    return {
      buffer: row.audioData,
      mimeType: row.mimeType,
    };
  }

  async deleteRecording(
    userId: string,
    recordingId: string,
  ): Promise<{ success: boolean }> {
    const [row] = await this.db
      .select({ id: recordings.id })
      .from(recordings)
      .where(
        and(
          eq(recordings.id, recordingId),
          eq(recordings.userId, userId),
        ),
      )
      .limit(1);

    if (!row) {
      throw new AppException('NOT_FOUND', { message: 'Không tìm thấy bản thu âm' });
    }

    await this.db
      .delete(recordings)
      .where(
        and(
          eq(recordings.id, recordingId),
          eq(recordings.userId, userId),
        ),
      );

    return { success: true };
  }

  // 8. Content Reports
  async createReport(
    userId: string,
    input: ContentReportInput,
  ): Promise<{ success: boolean }> {
    await this.db.insert(contentReports).values({
      userId,
      questionId: input.questionId || null,
      ruleId: input.ruleId || null,
      version: input.version,
      description: input.description,
      status: 'open',
    });

    return { success: true };
  }
}
