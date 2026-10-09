import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Accent, ReadingView, ReadingTarget, Choice } from '@phonologic/shared-types';
import { api } from '../../lib/api';
import { keys } from '../../lib/query';
import { playBrowserTts } from '../learning/audioUtils';
import { SpellingExercise } from '../learning/components/SpellingExercise';
import { SpeakingExercise } from '../learning/components/SpeakingExercise';
import { ReportDialog } from '../learning/components/ReportDialog';
import {
  Button,
  IconButton,
  Icon,
  ProgressBar,
  Badge,
  Card,
  AudioControl,
  SegmentTile,
  FeedbackPanel,
} from '../../components';

export interface ReadingDetailProps {
  readingId: string;
  onExit: () => void;
  onUpdated: () => void;
}

export function ReadingDetail({ readingId, onExit, onUpdated }: ReadingDetailProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Fetch Reading Data with react-query
  const {
    data: reading,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: keys.reading(readingId),
    queryFn: () => api<ReadingView>(`/learning/readings/${readingId}`),
    enabled: Boolean(readingId),
  });

  // Track initial target selection once per readingId
  const initializedReadingIdRef = useRef<string | null>(null);

  // Active target being practiced
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  // Spelling exercise state for the active target
  const [spellingTokens, setSpellingTokens] = useState<Choice[]>([]);
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
  const [spellingFeedback, setSpellingFeedback] = useState<
    | { correct: true; key: string; word: string }
    | { correct: false; key: string }
    | null
  >(null);

  // Passage TTS state
  // Passage TTS state & Accent
  const [passageSpeed, setPassageSpeed] = useState<'0.75x' | '1x'>('0.75x');
  const [passageAccent, setPassageAccent] = useState<Accent>('US');
  const [practiceStep, setPracticeStep] = useState<'spell' | 'speak'>('spell');

  useEffect(() => {
    if (reading?.accent) {
      setPassageAccent(reading.accent);
    }
  }, [reading?.accent]);

  useEffect(() => {
    setPracticeStep('spell');
  }, [selectedTargetId]);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Initialize selected target on initial load
  useEffect(() => {
    if (!reading) return;
    if (initializedReadingIdRef.current === reading.id) return;
    initializedReadingIdRef.current = reading.id;

    if (reading.targets.length > 0) {
      const uncompleted = reading.targets.find((t) => !reading.completedTargetIds.includes(t.id));
      const initial = uncompleted || reading.targets[0];
      setSelectedTargetId(initial.id);
    }
  }, [reading]);

  // Selected Target object
  const selectedTarget = useMemo(() => {
    if (!reading || !selectedTargetId) return null;
    return reading.targets.find((t) => t.id === selectedTargetId) || null;
  }, [reading, selectedTargetId]);

  // Generate spelling tokens when selected target changes
  useEffect(() => {
    if (!selectedTarget) {
      setSpellingTokens([]);
      setSelectedTokenIds([]);
      setSpellingFeedback(null);
      return;
    }

    let tokens: Choice[] = [];
    if (selectedTarget.segments && selectedTarget.segments.length > 1) {
      tokens = selectedTarget.segments.map((seg, idx) => ({
        id: `seg-${idx}-${seg.start}-${seg.end}`,
        label: seg.spelling,
        description: seg.notation || undefined,
      }));
    } else {
      tokens = selectedTarget.word.split('').map((char, idx) => ({
        id: `char-${idx}-${char}`,
        label: char,
      }));
    }

    // Deterministically shuffle
    const shuffled = [...tokens].sort((a, b) => {
      const hashA = a.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const hashB = b.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return (hashA % 7) - (hashB % 7);
    });

    setSpellingTokens(shuffled);
    setSelectedTokenIds([]);
    setSpellingFeedback(null);
  }, [selectedTarget]);

  // Mutation to mark a target practiced
  const markTargetMutation = useMutation({
    mutationFn: (targetId: string) =>
      api<ReadingView>(`/learning/readings/${readingId}/targets`, {
        method: 'POST',
        body: JSON.stringify({ targetId }),
      }),
    onSuccess: (updatedReading) => {
      queryClient.setQueryData(keys.reading(readingId), updatedReading);
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
      onUpdated();
    },
    onError: (err: unknown) => {
      console.warn('Lỗi khi đánh dấu từ mục tiêu:', err);
    },
  });

  // Mutation to complete entire reading
  const completeReadingMutation = useMutation({
    mutationFn: () =>
      api<ReadingView>(`/learning/readings/${readingId}/complete`, {
        method: 'POST',
      }),
    onSuccess: (updatedReading) => {
      queryClient.setQueryData(keys.reading(readingId), updatedReading);
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
      onUpdated();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : t('Không thể hoàn thành bài đọc.');
      alert(msg);
    },
  });

  // Play Story Passage TTS using selected accent
  const handlePlayPassage = () => {
    if (!reading) return;
    const rate = passageSpeed === '0.75x' ? 0.75 : 1.0;
    playBrowserTts(reading.text, passageAccent, rate);
  };
  // Check Spelling Exercise for current target
  const handleCheckSpelling = () => {
    if (!reading || !selectedTarget || selectedTokenIds.length === 0 || markTargetMutation.isPending) {
      return;
    }

    const tokenMap = new Map<string, Choice>();
    spellingTokens.forEach((t) => tokenMap.set(t.id, t));
    const assembledWord = selectedTokenIds.map((id) => tokenMap.get(id)?.label || '').join('');

    const isMatch = assembledWord.trim().toLowerCase() === selectedTarget.word.trim().toLowerCase();

    if (isMatch) {
      setSpellingFeedback({
        correct: true,
        key: 'Chính xác! Bạn đã ghép đúng từ "{{word}}".',
        word: selectedTarget.word,
      });

      // Mark target practiced on server if not yet marked
      if (!reading.completedTargetIds.includes(selectedTarget.id)) {
        markTargetMutation.mutate(selectedTarget.id);
      }
    } else {
      setSpellingFeedback({
        correct: false,
        key: 'Chưa đúng thứ tự chữ cái/âm vị. Hãy chạm vào mảnh đã chọn để gỡ ra và thử lại.',
      });
    }
  };

  // Sliced text rendering with exact character offsets
  const renderStoryText = () => {
    if (!reading) return null;

    const sortedTargets = [...reading.targets].sort((a, b) => a.start - b.start);
    const elements: React.ReactNode[] = [];
    let currentIndex = 0;

    for (const target of sortedTargets) {
      const start = Math.max(0, Math.min(target.start, reading.text.length));
      const end = Math.max(start, Math.min(target.end, reading.text.length));

      if (start > currentIndex) {
        elements.push(
          <span key={`text-${currentIndex}`} className="text-on-surface">
            {reading.text.slice(currentIndex, start)}
          </span>
        );
      }

      const isSelected = selectedTarget?.id === target.id;
      const isCompleted = reading.completedTargetIds.includes(target.id);
      const statusLabel = isCompleted ? t('đã hoàn thành') : t('chưa hoàn thành');

      elements.push(
        <Button
          key={`target-${target.id}`}
          variant={isSelected ? 'secondary' : isCompleted ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setSelectedTargetId(target.id)}
          className="min-h-0! h-auto! py-0.5! px-2! mx-0.5 gap-1! align-baseline text-[length:inherit]! whitespace-nowrap"
          aria-pressed={isSelected}
          aria-label={t('Từ mục tiêu {{word}}, {{status}}', { word: target.word, status: statusLabel })}
        >
          <span>{reading.text.slice(start, end)}</span>
          {isCompleted && (
            <Icon
              name="check_circle"
              size={14}
            />
          )}
        </Button>
      );

      currentIndex = Math.max(currentIndex, end);
    }

    if (currentIndex < reading.text.length) {
      elements.push(
        <span key={`text-${currentIndex}`} className="text-on-surface">
          {reading.text.slice(currentIndex)}
        </span>
      );
    }

    return elements;
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6" role="status">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
        <p className="font-display font-bold text-on-surface">{t('Đang tải bài đọc...')}</p>
        <p className="text-sm text-on-surface-variant">{t('Chuẩn bị văn bản và các từ mục tiêu ngữ âm')}</p>
      </div>
    );
  }

  // Error Screen
  if (queryError || !reading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
        <Card tone="soft" className="p-8! max-w-md text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-error-container text-error flex items-center justify-center">
            <Icon name="error" size={32} />
          </div>
          <h2 className="font-display font-bold text-xl text-on-surface">{t('Không thể tải bài đọc')}</h2>
          <p className="text-sm text-on-surface-variant">
            {queryError ? queryError.message : t('Không tìm thấy dữ liệu bài đọc.')}
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

  const allTargetsPracticed = reading.completedTargetIds.length === reading.targets.length;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top Header */}
      <header className="h-14 sm:h-16 border-b border-outline-variant/20 px-4 sm:px-8 flex items-center justify-between gap-4 bg-surface-lowest sticky top-0 z-30">
        <div className="flex min-w-0 items-center gap-3">
          <IconButton icon="arrow_back" label={t('Quay lại thư viện')} variant="ghost" size="sm" onClick={onExit} />
          <h1 className="font-display font-bold text-base sm:text-lg text-on-surface truncate max-w-xs sm:max-w-md max-[360px]:hidden">
            {reading.title}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {/* Targets progress */}
          <div className="hidden sm:flex items-center gap-2">
            <ProgressBar
              value={reading.completedTargetIds.length}
              max={reading.targets.length}
              label={t('Đã luyện: {{completed}}/{{total}} từ', {
                completed: reading.completedTargetIds.length,
                total: reading.targets.length,
              })}
            />
            <span className="font-display font-bold text-xs text-on-surface whitespace-nowrap">
              {t('Đã luyện: {{completed}}/{{total}} từ', {
                completed: reading.completedTargetIds.length,
                total: reading.targets.length,
              })}
            </span>
          </div>

          <Badge tone="blue">{t('Cấp {{level}}', { level: reading.level })}</Badge>
          <Badge tone="neutral">{reading.accent}</Badge>

          <IconButton
            icon="flag"
            label={t('Báo lỗi bài đọc')}
            variant="ghost"
            size="sm"
            onClick={() => setIsReportOpen(true)}
          />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-20">
        {/* Left Column: Reading Passage & Target List (6 cols on desktop/iPad landscape) */}
        <section className="lg:col-span-6 flex flex-col gap-5">
          <Card tone="white" className="p-5! sm:p-6! rounded-3xl border border-outline-variant/30 flex flex-col gap-4 shadow-xs">
            {/* Story Header */}
            <div className="flex items-start justify-between gap-3 border-b border-outline-variant/20 pb-3">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-black text-on-surface tracking-tight">
                  {reading.title}
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                  {reading.description}
                </p>
              </div>

              {reading.completed && (
                <Badge tone="green" icon="check_circle">
                  {t('Đã hoàn thành')}
                </Badge>
              )}
            </div>

            {/* Passage Audio Toolbar with Accent & Speed */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 bg-surface-low p-2 rounded-2xl border border-outline-variant/20">
              <AudioControl
                label={t('Đọc cả bài')}
                speed={passageSpeed}
                onPlay={handlePlayPassage}
                onSpeedChange={() => setPassageSpeed((s) => (s === '0.75x' ? '1x' : '0.75x'))}
              />
              <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-xl border border-outline-variant/30">
                <span className="text-[11px] text-on-surface-variant font-medium mr-1">{t('Giọng:')}</span>
                {(['US', 'UK'] as const).map((acc) => (
                  <Button
                    key={acc}
                    size="sm"
                    type="button"
                    variant={passageAccent === acc ? 'secondary' : 'ghost'}
                    onClick={() => setPassageAccent(acc)}
                    className={`min-h-7! h-7! px-2! text-xs! font-bold! rounded-lg! ${
                      passageAccent === acc ? 'bg-secondary text-on-secondary font-black' : ''
                    }`}
                  >
                    {acc}
                  </Button>
                ))}
              </div>
            </div>

            {/* Passage Content with Interactive Spans */}
            <div
              className="text-base sm:text-lg leading-loose font-sans text-on-surface tracking-wide select-text py-1"
              role="region"
              aria-label={t('Văn bản bài đọc')}
            >
              {renderStoryText()}
            </div>

            {/* Quick Target Words Switcher inside Story card */}
            <div className="pt-3 border-t border-outline-variant/20 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  {t('Từ vựng mục tiêu trong bài')} ({reading.targets.length})
                </span>
                <span className="text-xs text-on-surface-variant">
                  {t('Đã luyện: {{completed}}/{{total}} từ', {
                    completed: reading.completedTargetIds.length,
                    total: reading.targets.length,
                  })}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {reading.targets.map((target) => {
                  const isCur = target.id === selectedTargetId;
                  const isDone = reading.completedTargetIds.includes(target.id);
                  const statusLabel = isDone ? t('đã hoàn thành') : t('chưa hoàn thành');
                  return (
                    <Button
                      key={target.id}
                      size="sm"
                      type="button"
                      variant={isCur ? 'secondary' : isDone ? 'primary' : 'outline'}
                      aria-pressed={isCur}
                      aria-label={t('Từ mục tiêu {{word}}, {{status}}', { word: target.word, status: statusLabel })}
                      onClick={() => setSelectedTargetId(target.id)}
                      className="min-h-8! h-8! px-2.5! text-xs! font-bold!"
                    >
                      <span>{target.word}</span>
                      {isDone && <Icon name="check_circle" size={14} />}
                    </Button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Reading Completion Banner */}
          {allTargetsPracticed && (
            <Card
              tone={reading.completed ? 'soft' : 'yellow'}
              className="p-6! rounded-3xl border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                  <Icon name="check_circle" size={28} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-on-surface">
                    {reading.completed
                      ? t('Bài đọc đã hoàn thành!')
                      : t('Đã luyện tập đủ tất cả các từ mục tiêu!')}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {reading.completed
                      ? t('Bạn có thể tiếp tục luyện tập lại bất cứ lúc nào.')
                      : t('Nhấn nút bên cạnh để ghi nhận hoàn thành bài đọc.')}
                  </p>
                </div>
              </div>

              {!reading.completed && (
                <Button
                  variant="primary"
                  size="md"
                  loading={completeReadingMutation.isPending}
                  onClick={() => completeReadingMutation.mutate()}
                  className="whitespace-nowrap w-full sm:w-auto"
                >
                  <Icon name="verified" size={20} />
                  {t('Hoàn thành bài đọc')}
                </Button>
              )}
            </Card>
          )}
        </section>

        {/* Right Column: Target Word Practice Arena (5 cols) matching Stitch b4a0c731 */}
        {/* Right Column: Focused Word Practice Arena (6 cols on desktop/iPad landscape) */}
        <aside className="lg:col-span-6 flex flex-col gap-5 sticky top-18">
          {selectedTarget ? (
            <Card tone="white" className="p-5! sm:p-6! rounded-3xl border border-outline-variant/30 flex flex-col gap-4 shadow-xs">
              {/* Target Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-outline-variant/20">
                <div>
                  <span className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">
                    {t('Từ vựng mục tiêu:')}
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-black text-on-surface uppercase tracking-tight mt-0.5">
                    {selectedTarget.word}
                  </h3>
                  <p className="text-xs sm:text-sm text-secondary font-bold mt-0.5">
                    {selectedTarget.meaning}
                  </p>
                </div>

                {reading.completedTargetIds.includes(selectedTarget.id) ? (
                  <Badge tone="green" icon="check_circle">
                    {t('Đã hoàn thành')}
                  </Badge>
                ) : (
                  <Badge tone="yellow" icon="pending">
                    {t('Cần luyện tập')}
                  </Badge>
                )}
              </div>

              {/* Segments breakdown if available */}
              {selectedTarget.segments && selectedTarget.segments.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-on-surface-variant font-medium">
                    {t('Bóc tách chữ – âm:')}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {selectedTarget.segments.map((s, idx) => (
                      <SegmentTile
                        key={`${s.spelling}-${idx}`}
                        spelling={s.spelling}
                        notation={s.notation}
                        selected={false}
                        state="idle"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Step Switcher (Tabs) */}
              <div className="flex rounded-xl bg-surface-low p-1 border border-outline-variant/20 gap-1">
                <Button
                  size="sm"
                  type="button"
                  variant={practiceStep === 'spell' ? 'secondary' : 'ghost'}
                  onClick={() => setPracticeStep('spell')}
                  className={`flex-1 font-bold text-xs! min-h-9! h-9! ${practiceStep === 'spell' ? 'bg-white text-primary shadow-xs' : ''}`}
                >
                  <Icon name="spellcheck" size={18} />
                  {t('Bước 1: Ghép chữ')}
                </Button>
                <Button
                  size="sm"
                  type="button"
                  variant={practiceStep === 'speak' ? 'secondary' : 'ghost'}
                  onClick={() => setPracticeStep('speak')}
                  className={`flex-1 font-bold text-xs! min-h-9! h-9! ${practiceStep === 'speak' ? 'bg-white text-primary shadow-xs' : ''}`}
                >
                  <Icon name="record_voice_over" size={18} />
                  {t('Bước 2: Luyện phát âm')}
                </Button>
              </div>

              {/* Step 1: Spelling Exercise */}
              {practiceStep === 'spell' && (
                <div className="flex flex-col gap-3 pt-1">
                  <SpellingExercise
                    choices={spellingTokens}
                    selectedIds={selectedTokenIds}
                    onChange={setSelectedTokenIds}
                    disabled={markTargetMutation.isPending}
                  />

                  {spellingFeedback && (
                    <div className="flex flex-col gap-2">
                      <FeedbackPanel
                        title={spellingFeedback.correct ? t('Ghép từ chính xác!') : t('Chưa chính xác')}
                        tone={spellingFeedback.correct ? 'success' : 'error'}
                      >
                        {spellingFeedback.correct
                          ? t(spellingFeedback.key, { word: spellingFeedback.word })
                          : t(spellingFeedback.key)}
                      </FeedbackPanel>
                      {spellingFeedback.correct && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          onClick={() => setPracticeStep('speak')}
                          className="w-full justify-center font-bold"
                        >
                          {t('Chuyển sang Luyện phát âm')}
                          <Icon name="arrow_forward" size={18} />
                        </Button>
                      )}
                    </div>
                  )}

                  {!spellingFeedback?.correct && (
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      loading={markTargetMutation.isPending}
                      disabled={selectedTokenIds.length === 0}
                      onClick={handleCheckSpelling}
                      className="w-full justify-center mt-1 font-bold"
                    >
                      <Icon name="check" size={18} />
                      {t('Kiểm tra chính tả')}
                    </Button>
                  )}
                </div>
              )}

              {/* Step 2: Speaking / Pronunciation */}
              {practiceStep === 'speak' && (
                <div className="flex flex-col gap-3 pt-1">
                  <SpeakingExercise
                    word={selectedTarget.word}
                    accent={passageAccent}
                    readingId={reading.id}
                    meaning={selectedTarget.meaning}
                    canSkip={false}
                  />
                </div>
              )}
            </Card>
          ) : (
            <Card tone="soft" className="p-8! text-center flex flex-col items-center gap-3">
              <Icon name="touch_app" size={32} className="text-on-surface-variant" />
              <p className="text-sm text-on-surface-variant">
                {t('Hãy chọn một từ mục tiêu trong đoạn văn bên trái để bắt đầu luyện tập.')}
              </p>
            </Card>
          )}
        </aside>
      </main>

      {/* Content Report Modal */}
      <ReportDialog
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        version={reading.version}
      />
    </div>
  );
}
