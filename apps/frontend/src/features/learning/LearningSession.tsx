import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SessionView, AnswerFeedback, LearningQuestion } from '@phonologic/shared-types';
import { api } from '../../lib/api';
import { keys } from '../../lib/query';
import { playBrowserTts } from './audioUtils';
import { SpellingExercise } from './components/SpellingExercise';
import { SpeakingExercise } from './components/SpeakingExercise';
import { SessionSummary } from './components/SessionSummary';
import { ReportDialog } from './components/ReportDialog';
import {
  Button,
  IconButton,
  Icon,
  ProgressBar,
  Badge,
  Card,
  AnswerOption,
  InstructionCard,
  FeedbackPanel,
  AudioControl,
} from '../../components';

export interface LearningSessionProps {
  sessionId: string;
  onExit: () => void;
  onUpdated: () => void;
}

export function LearningSession({ sessionId, onExit, onUpdated }: LearningSessionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Fetch session data with react-query
  const {
    data: session,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: keys.session(sessionId),
    queryFn: () => api<SessionView>(`/learning/sessions/${sessionId}`),
    enabled: Boolean(sessionId),
  });

  // Track session initialization to avoid clobbering local state on refetch
  const initializedSessionIdRef = useRef<string | null>(null);

  // Active question index in the local view
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // User's current selection for the active question
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Local feedback displayed right after answering before continuing
  const [localFeedback, setLocalFeedback] = useState<AnswerFeedback | null>(null);

  // Cache updated session from server to advance on "Tiếp tục"
  const [pendingNextSession, setPendingNextSession] = useState<SessionView | null>(null);

  // Audio speed for TTS
  const [ttsSpeed, setTtsSpeed] = useState<'0.75x' | '1x'>('0.75x');

  // Stages
  const [showSpeakingStage, setShowSpeakingStage] = useState(false);
  const [showSummaryStage, setShowSummaryStage] = useState(false);

  // Content report modal
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Initialize session view state on first load
  useEffect(() => {
    if (!session) return;
    if (initializedSessionIdRef.current === session.id) return;
    initializedSessionIdRef.current = session.id;

    if (session.currentIndex >= session.questions.length) {
      if (session.speaking === 'pending') {
        setShowSpeakingStage(true);
      } else {
        setShowSummaryStage(true);
      }
    } else {
      const idx = Math.min(session.currentIndex, Math.max(0, session.questions.length - 1));
      setActiveQuestionIndex(idx);

      const currentQ = session.questions[idx];
      const prevAnswer = session.answers.find((a) => a.questionId === currentQ?.id);
      if (prevAnswer) {
        setSelectedIds(prevAnswer.selectedIds);
        setLocalFeedback(prevAnswer);
      } else {
        setSelectedIds([]);
        setLocalFeedback(null);
      }
    }
  }, [session]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeQuestionIndex, showSpeakingStage, showSummaryStage]);

  // Answer Submission Mutation
  const answerMutation = useMutation({
    mutationFn: (body: { questionId: string; selectedIds: string[] }) =>
      api<SessionView>(`/learning/sessions/${sessionId}/answers`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (updatedSession, variables) => {
      queryClient.setQueryData(keys.session(sessionId), updatedSession);
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
      const fb = updatedSession.answers.find((a) => a.questionId === variables.questionId) || null;
      setLocalFeedback(fb);
      setPendingNextSession(updatedSession);
      onUpdated();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : t('Lỗi khi kiểm tra đáp án.');
      alert(msg);
    },
  });

  // Skip Speaking Mutation
  const skipSpeakingMutation = useMutation({
    mutationFn: () =>
      api<SessionView>(`/learning/sessions/${sessionId}/speaking`, {
        method: 'POST',
        body: JSON.stringify({ status: 'skipped' }),
      }),
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(keys.session(sessionId), updatedSession);
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
      onUpdated();
      setShowSpeakingStage(false);
      setShowSummaryStage(true);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : t('Không thể bỏ qua bước nói.');
      alert(msg);
    },
  });

  const currentQuestion: LearningQuestion | undefined = session?.questions[activeQuestionIndex];

  // Lookup existing answered feedback from session
  const existingFeedback = session?.answers.find((a) => a.questionId === currentQuestion?.id);
  const currentFeedback = localFeedback || existingFeedback || null;
  const isQuestionAnswered = Boolean(currentFeedback);

  // Synchronize selection when switching active question index
  const handleSelectQuestionIndex = (idx: number) => {
    if (!session || idx < 0 || idx >= session.questions.length) return;
    setActiveQuestionIndex(idx);
    const q = session.questions[idx];
    const prev = session.answers.find((a) => a.questionId === q.id);
    if (prev) {
      setSelectedIds(prev.selectedIds);
      setLocalFeedback(prev);
    } else {
      setSelectedIds([]);
      setLocalFeedback(null);
    }
  };

  // Toggle or select choices
  const handleChoiceClick = (choiceId: string) => {
    if (isQuestionAnswered || !currentQuestion) return;

    if (currentQuestion.multiple) {
      if (selectedIds.includes(choiceId)) {
        setSelectedIds(selectedIds.filter((id) => id !== choiceId));
      } else {
        setSelectedIds([...selectedIds, choiceId]);
      }
    } else {
      setSelectedIds([choiceId]);
    }
  };

  // Submit Answer via mutation
  const handleCheckAnswer = () => {
    if (!session || !currentQuestion || selectedIds.length === 0 || answerMutation.isPending || isQuestionAnswered) {
      return;
    }
    answerMutation.mutate({
      questionId: currentQuestion.id,
      selectedIds,
    });
  };

  // Continue to next question or stage
  const handleContinue = () => {
    const nextSession = pendingNextSession || session;
    if (!nextSession) return;

    setLocalFeedback(null);
    setPendingNextSession(null);

    if (nextSession.currentIndex >= nextSession.questions.length) {
      if (nextSession.speaking === 'pending') {
        setShowSpeakingStage(true);
      } else {
        setShowSummaryStage(true);
      }
    } else {
      const nextIdx = nextSession.currentIndex;
      setActiveQuestionIndex(nextIdx);
      const q = nextSession.questions[nextIdx];
      const prev = nextSession.answers.find((a) => a.questionId === q?.id);
      if (prev) {
        setSelectedIds(prev.selectedIds);
        setLocalFeedback(prev);
      } else {
        setSelectedIds([]);
        setLocalFeedback(null);
      }
    }
  };

  // Speaking recorded callback
  const handleSpeakingDone = () => {
    if (session) {
      const updated: SessionView = {
        ...session,
        speaking: 'recorded',
        status: 'completed',
      };
      queryClient.setQueryData(keys.session(sessionId), updated);
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
    }
    onUpdated();
    setShowSpeakingStage(false);
    setShowSummaryStage(true);
  };

  // Play TTS audio
  const handlePlayTts = (text: string) => {
    const rate = ttsSpeed === '0.75x' ? 0.75 : 1.0;
    playBrowserTts(text, session?.accent || 'US', rate);
  };

  // Highlight span helper
  const renderHighlightedWord = (word: string, highlight?: { start: number; end: number }) => {
    if (!highlight || highlight.start < 0 || highlight.end > word.length || highlight.start >= highlight.end) {
      return <span>{word}</span>;
    }
    const before = word.slice(0, highlight.start);
    const target = word.slice(highlight.start, highlight.end);
    const after = word.slice(highlight.end);
    return (
      <span>
        {before}
        <span className="text-secondary bg-secondary-fixed/50 px-1 py-0.5 rounded-lg underline decoration-2 decoration-secondary font-black">
          {target}
        </span>
        {after}
      </span>
    );
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6" role="status">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
        <p className="font-display font-bold text-on-surface">{t('Đang tải phiên học...')}</p>
        <p className="text-sm text-on-surface-variant">{t('Chuẩn bị các câu hỏi ngữ âm phản xạ')}</p>
      </div>
    );
  }

  // Error Screen
  if (queryError || !session) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
        <Card tone="soft" className="p-8! max-w-md text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-error-container text-error flex items-center justify-center">
            <Icon name="error" size={32} />
          </div>
          <h2 className="font-display font-bold text-xl text-on-surface">{t('Không thể tải bài học')}</h2>
          <p className="text-sm text-on-surface-variant">
            {queryError ? queryError.message : t('Không tìm thấy dữ liệu phiên học.')}
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="md" onClick={onExit}>
              {t('Thoát ra')}
            </Button>
            <Button variant="primary" size="md" onClick={() => refetch()}>
              {t('Thử lại')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Summary Stage
  if (showSummaryStage) {
    return (
      <div className="min-h-screen bg-surface px-4 py-8">
        <SessionSummary session={session} onExit={onExit} />
      </div>
    );
  }

  // Speaking Stage
  if (showSpeakingStage) {
    const targetWord =
      session.questions.find((q) => q.word)?.word ||
      session.title ||
      'Practice';

    return (
      <div className="min-h-screen bg-surface flex flex-col">
        {/* Top bar */}
        <header className="h-16 border-b border-outline-variant/20 px-4 sm:px-8 flex items-center justify-between bg-surface-lowest">
          <IconButton icon="close" label={t('Thoát phiên học')} variant="ghost" size="sm" onClick={onExit} />
          <div className="flex items-center gap-2">
            <Badge tone="blue">{t('Bước luyện nói')}</Badge>
            <Badge tone="neutral">{t('Giọng {{accent}}', { accent: session.accent })}</Badge>
          </div>
          <IconButton
            icon="flag"
            label={t('Báo lỗi nội dung')}
            variant="ghost"
            size="sm"
            onClick={() => setIsReportOpen(true)}
          />
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
          <SpeakingExercise
            word={targetWord}
            accent={session.accent}
            sessionId={session.id}
            onUploaded={handleSpeakingDone}
            onSkipped={() => skipSpeakingMutation.mutate()}
            canSkip={true}
          />
        </main>

        <ReportDialog
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          version={session.version}
        />
      </div>
    );
  }

  // Active Quiz / Question Stage
  const totalQuestions = session.questions.length;
  const answeredCount = session.answers.length;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-outline-variant/20 px-4 sm:px-8 flex items-center justify-between gap-4 bg-surface-lowest sticky top-0 z-30">
        <IconButton icon="close" label={t('Thoát bài học')} variant="ghost" size="sm" onClick={onExit} />

        {/* Center Progress Indicator */}
        <div className="flex-1 max-w-xl mx-auto flex items-center gap-3">
          <ProgressBar
            value={answeredCount}
            max={totalQuestions}
            label={t('Tiến độ: {{answered}}/{{total}} câu', { answered: answeredCount, total: totalQuestions })}
          />
          <span className="font-display font-bold text-xs text-on-surface whitespace-nowrap hidden sm:inline">
            {answeredCount}/{totalQuestions}
          </span>
        </div>

        {/* Right Actions: Accent & Report Flag */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:inline-flex"><Badge tone="neutral">
            {session.accent}
          </Badge></div>
          <IconButton
            icon="flag"
            label={t('Báo lỗi nội dung')}
            variant="ghost"
            size="sm"
            onClick={() => setIsReportOpen(true)}
          />
        </div>
      </header>

      {/* Main Container: Asymmetric 2-Column Desktop Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-5 lg:p-6 grid grid-cols-1 xl:grid-cols-12 gap-5 items-start pb-24">
        {/* Left / Center Practice Arena (8 cols on desktop) */}
        <section className="xl:col-span-8 flex flex-col gap-3 sm:gap-3.5 w-full">
          {/* Question Mode Badge */}
          <div className="flex items-center gap-2">
            <Badge tone="blue" icon="psychology">
              {session.mode === 'review'
                ? t('Ôn tập phản xạ')
                : currentQuestion?.kind === 'meaning'
                ? t('Nhận diện nghĩa từ')
                : currentQuestion?.kind === 'spelling'
                ? t('Bóc tách & Ghép chữ')
                : t('Phản xạ âm ⇄ chữ')}
            </Badge>
            {currentQuestion?.multiple && (
              <Badge tone="yellow" icon="checklist">
                {t('Nhiều đáp án đúng')}
              </Badge>
            )}
          </div>

          {/* Prompt / Instruction Card */}
          <InstructionCard title={currentQuestion?.prompt || t('Chọn đáp án chính xác:')}>
            {currentQuestion?.multiple
              ? t('Câu hỏi này có thể có một hoặc nhiều phương án chính xác. Hãy chọn tất cả phương án thỏa mãn.')
              : currentQuestion?.kind === 'meaning'
              ? t('Chọn nghĩa tiếng Việt chính xác nhất cho từ vựng này.')
              : currentQuestion?.kind === 'spelling'
              ? t('Chạm các mảnh ghép chữ cái hoặc chùm âm vị để tạo thành từ hoàn chỉnh.')
              : t('Hãy nhận diện quan hệ âm – chữ phù hợp với ngữ cảnh.')}
          </InstructionCard>

          {/* Word Presentation Card if question has word or audioText */}
          {(currentQuestion?.word || currentQuestion?.audioText) && (
            <Card tone="soft" className="py-3 px-4 sm:py-3.5 sm:px-5 flex flex-col sm:flex-row items-center justify-between gap-3 border border-outline-variant/30">
              {currentQuestion.imageUrl && (
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-low p-1.5 shadow-xs shrink-0">
                  <img
                    src={currentQuestion.imageUrl}
                    alt={currentQuestion.word || t('Minh họa từ vựng')}
                    className="w-full h-full object-contain filter drop-shadow-sm"
                  />
                </div>
              )}

              {currentQuestion.word && (
                <div className="flex items-center gap-3 flex-wrap">
                  <div>
                    <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-on-surface uppercase">
                      {renderHighlightedWord(currentQuestion.word, currentQuestion.highlight)}
                    </h2>
                    {currentQuestion.meaning && (
                      <p className="text-xs sm:text-sm text-on-surface-variant font-medium">
                        {currentQuestion.meaning}
                      </p>
                    )}
                  </div>
                  {currentQuestion.notation && (
                    <Badge tone="yellow">{currentQuestion.notation}</Badge>
                  )}
                </div>
              )}

              {/* TTS Audio Control */}
              <div className="flex items-center gap-2 shrink-0">
                <AudioControl
                  label={t('Nghe âm mẫu')}
                  speed={ttsSpeed}
                  onPlay={() => handlePlayTts(currentQuestion.audioText || currentQuestion.word || '')}
                  onSpeedChange={() => setTtsSpeed((s) => (s === '0.75x' ? '1x' : '0.75x'))}
                />
              </div>
            </Card>
          )}

          {/* Answer Area */}
          <div className="flex flex-col gap-4">
            {currentQuestion?.kind === 'spelling' ? (
              <SpellingExercise
                choices={currentQuestion.choices}
                selectedIds={selectedIds}
                onChange={setSelectedIds}
                disabled={isQuestionAnswered || answerMutation.isPending}
                feedback={currentFeedback}
                targetWord={currentQuestion.word}
              />
            ) : (
              <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 m-0 p-0 border-0">
                <legend className="sr-only">{t('Các phương án trả lời')}</legend>
                {currentQuestion?.choices.map((choice, index) => {
                  const isSelected = selectedIds.includes(choice.id);

                  let state: 'idle' | 'correct' | 'incorrect' = 'idle';
                  if (currentFeedback) {
                    const isChoiceCorrect = currentFeedback.correctIds.includes(choice.id);
                    if (isSelected) {
                      state = isChoiceCorrect ? 'correct' : 'incorrect';
                    } else if (isChoiceCorrect) {
                      state = 'correct';
                    }
                  }

                  return (
                    <AnswerOption
                      key={choice.id}
                      letter={String.fromCharCode(65 + index)}
                      label={choice.label}
                      description={choice.description}
                      selected={isSelected}
                      state={state}
                      disabled={isQuestionAnswered || answerMutation.isPending}
                      onClick={() => handleChoiceClick(choice.id)}
                    />
                  );
                })}
              </fieldset>
            )}
          </div>

          {/* Feedback Panel if answered */}
          {currentFeedback && (
            <FeedbackPanel
              title={currentFeedback.correct ? t('Chính xác xuất sắc!') : t('Chưa chính xác!')}
              tone={currentFeedback.correct ? 'success' : 'error'}
              action={t('Tiếp tục')}
              onAction={handleContinue}
            >
              {currentFeedback.explanation ||
                (currentFeedback.correct
                  ? t('Bạn đã nhận diện chuẩn xác quan hệ âm và chữ.')
                  : t('Hãy ghi nhớ quy tắc này để phản xạ chính xác hơn.'))}
            </FeedbackPanel>
          )}
        </section>

        {/* Right Hint & Context Rail (4 cols on desktop) */}
        <aside className="hidden xl:flex xl:col-span-4 flex-col gap-4 sticky top-20">
          {/* Rule Reflex Hint Card */}
          <Card tone="white" className="p-5! flex flex-col gap-3 border border-outline-variant/30">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-secondary">
              <Icon name="lightbulb" size={20} />
              <span>{t('Mẹo Phản Xạ Quy Tắc')}</span>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              {t('Trong tiếng Anh, một tổ hợp chữ có thể chuyển hóa thành nhiều âm vị tùy thuộc vào trọng âm và ngữ cảnh từ.')}
            </p>

            <div className="p-3 rounded-xl bg-surface-low text-xs text-on-surface-variant flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span>{t('Chuẩn giọng:')}</span>
                <strong className="text-on-surface">
                  {session.accent === 'UK' ? t('Anh - Anh (UK)') : t('Anh - Mỹ (US)')}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('Trạng thái:')}</span>
                <strong className="text-primary font-bold">{t('Nội dung đã kiểm duyệt')}</strong>
              </div>
            </div>
          </Card>

          {/* Question Navigator */}
          <Card tone="soft" className="p-5! flex flex-col gap-3 border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-xs text-on-surface">{t('Danh sách câu hỏi')}</span>
              <span className="text-[11px] text-on-surface-variant">
                {t('{{answered}}/{{total}} đã làm', { answered: answeredCount, total: totalQuestions })}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {session.questions.map((q, idx) => {
                const isAnswered = session.answers.some((a) => a.questionId === q.id);
                const isCurrent = idx === activeQuestionIndex;

                return (
                  <Button
                    key={q.id}
                    type="button"
                    size="sm"
                    variant={isCurrent ? 'secondary' : isAnswered ? 'primary' : 'ghost'}
                    disabled={idx > session.currentIndex}
                    onClick={() => handleSelectQuestionIndex(idx)}
                    className="size-8! min-w-0! rounded-xl! p-0! text-xs!"
                    aria-current={isCurrent ? 'step' : undefined}
                    aria-label={t('Chuyển đến câu hỏi {{number}}', { number: idx + 1 })}
                  >
                    {idx + 1}
                  </Button>
                );
              })}
            </div>
          </Card>

          {/* Quick Report Flag button in rail */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsReportOpen(true)}
            className="text-on-surface-variant hover:text-error justify-start"
          >
            <Icon name="flag" size={18} />
            {t('Báo lỗi câu hỏi này')}
          </Button>
        </aside>
      </main>

      {/* Desktop / Mobile Action Bottom Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-surface-lowest/95 backdrop-blur-md border-t border-outline-variant/20 px-4 sm:px-8 py-3 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {currentFeedback ? (
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`text-sm sm:text-base font-black shrink-0 ${currentFeedback.correct ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {currentFeedback.correct ? t('Chính xác xuất sắc!') : t('Chưa chính xác!')}
                </span>
                {currentFeedback.explanation && (
                  <span className="text-xs text-on-surface-variant truncate hidden sm:inline">
                    {currentFeedback.explanation}
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleContinue}
                className="min-w-[160px] self-end sm:self-auto font-bold"
              >
                {t('Tiếp tục')}
                <Icon name="arrow_forward" size={18} />
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-end">
              <Button
                type="button"
                variant="primary"
                size="md"
                loading={answerMutation.isPending}
                disabled={selectedIds.length === 0 || isQuestionAnswered}
                onClick={handleCheckAnswer}
                className="w-full sm:w-auto min-w-[160px] font-bold"
              >
                {t('Kiểm tra')}
                <Icon name="arrow_forward" size={18} />
              </Button>
            </div>
          )}
        </div>
      </footer>

      {/* Content Report Dialog */}
      <ReportDialog
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        questionId={currentQuestion?.id}
        ruleId={currentQuestion?.ruleId}
        version={session.version}
      />
    </div>
  );
}
