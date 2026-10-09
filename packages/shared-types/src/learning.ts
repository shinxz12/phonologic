export type Accent = 'US' | 'UK';
export type QuestionKind = 'word_sound' | 'sound_spelling' | 'spelling_sound' | 'sound_word' | 'meaning' | 'spelling';
export interface Choice { id: string; label: string; description?: string }
export interface WordSegment { spelling: string; notation: string; start: number; end: number }
export interface LearningQuestion {
  id: string; kind: QuestionKind; prompt: string; word?: string; meaning?: string;
  notation?: string; highlight?: { start: number; end: number }; choices: Choice[];
  multiple: boolean; audioText?: string; explanation?: string; ruleId?: string;
  segments?: WordSegment[]; imageUrl?: string;
}
export interface ContentQuestion extends LearningQuestion { correctIds: string[] }
export interface LessonContent { id: string; title: string; description: string; accent: Accent; prerequisiteId: string | null; questions: ContentQuestion[] }
export interface ReadingTarget { id: string; word: string; meaning: string; start: number; end: number; segments: WordSegment[] }
export interface ReadingContent { id: string; title: string; description: string; level: string; accent: Accent; text: string; targets: ReadingTarget[]; imageUrl?: string }
export interface SourceRule { id: string; sourceRow: number; sourceLabel: string; pattern: string; examples: string[]; condition?: string; notation: string | null; status: 'draft' | 'approved'; note?: string }
export interface ContentBundle { notationVersion: string; notationConfirmed: boolean; rules: SourceRule[]; lessons: LessonContent[]; readings: ReadingContent[] }
export interface LessonSummary { id: string; title: string; description: string; accent: Accent; questionCount: number; status: 'locked' | 'current' | 'completed'; sessionId?: string }
export interface ReadingSummary { id: string; title: string; description: string; level: string; accent: Accent; targetCount: number; completedTargets: number; completed: boolean; imageUrl?: string }
export interface Preferences { goal: string; dailyMinutes: number; accent: Accent; timezone: string }
export interface LearnerProgress { answered: number; correct: number; accuracy: number | null; completedLessons: number; totalLessons: number; reviewCount: number; studyDays: number; streak: number; speakingRecorded: number; speakingSkipped: number; speakingScore: number | null; recent: { title: string; correct: boolean; at: string }[] }
export interface LearningDashboard { version: number; lessons: LessonSummary[]; readings: ReadingSummary[]; preferences: Preferences; progress: LearnerProgress; capabilities: { pronunciationAssessment: boolean; passwordRecovery: boolean }; contentNotice: string | null }
export interface AnswerFeedback { questionId: string; selectedIds: string[]; correctIds: string[]; correct: boolean; explanation: string }
export interface SessionView { id: string; lessonId: string; title: string; version: number; accent: Accent; mode: 'lesson' | 'review'; status: 'active' | 'completed'; currentIndex: number; questions: LearningQuestion[]; answers: AnswerFeedback[]; speaking: 'pending' | 'recorded' | 'skipped' }
export interface ReadingView extends ReadingContent { version: number; completedTargetIds: string[]; completed: boolean }
export interface RecordingView { id: string; sessionId: string | null; readingId: string | null; word: string; createdAt: string; status: 'recorded'; assessment: null }
export interface ContentReportInput { questionId?: string; ruleId?: string; version: number; description: string }
export interface ContentReportView extends ContentReportInput { id: string; userId: string; createdAt: string; status: 'open' | 'resolved' }
export interface AdminContentView { draft: ContentBundle; publishedVersion: number; reports: ContentReportView[] }
