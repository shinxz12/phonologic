import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Accent } from '@phonologic/shared-types';
import { useAudioRecorder } from '../../learning/useAudioRecorder';
import { Button, Card, Badge, Icon, IconButton } from '../../../components';
import { assessPassageAzure, type AzurePassageResult } from '../../learning/azureSpeech';

export interface PassageSpeakingExerciseProps {
  passageText: string;
  accent: Accent;
  title: string;
  onClose?: () => void;
}

export function PassageSpeakingExercise({
  passageText,
  accent,
  title,
  onClose,
}: PassageSpeakingExerciseProps) {
  const { t } = useTranslation();
  const {
    status,
    isRecording,
    audioUrl,
    audioBlob,
    duration,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [scoreResult, setScoreResult] = useState<AzurePassageResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const processedBlobRef = useRef<Blob | null>(null);

  const handleStart = async () => {
    if (status === 'requesting' || isRecording || isProcessing) return;
    setScoreResult(null);
    setErrorMessage(null);
    processedBlobRef.current = null;
    // Đọc đoạn văn: im lặng 4s -> tự động ngắt
    await startRecording({ silenceTimeoutMs: 4000, maxDurationMs: 120000 });
  };

  const handleStop = () => {
    stopRecording();
  };

  useEffect(() => {
    if (audioBlob && status === 'stopped' && processedBlobRef.current !== audioBlob) {
      processedBlobRef.current = audioBlob;
      analyzePassage(audioBlob);
    }
  }, [audioBlob, status]);

  const analyzePassage = async (blob: Blob) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await assessPassageAzure(blob, passageText, accent);
      setScoreResult(res);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Không thể phân tích đoạn văn. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    resetRecording();
    setScoreResult(null);
    setErrorMessage(null);
    setIsProcessing(false);
  };

  const togglePlayRecorded = () => {
    if (audioRef.current) {
      if (isPlayingRecorded) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlayingRecorded(false);
      } else {
        audioRef.current.play().catch(() => setIsPlayingRecorded(false));
        setIsPlayingRecorded(true);
      }
    }
  };

  return (
    <Card tone="white" className="p-5! rounded-3xl border border-primary/20 flex flex-col gap-4 shadow-sm bg-primary-container/5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Icon name="record_voice_over" size={20} />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-on-surface">{t('Luyện đọc cả bài')}</h3>
            <span className="text-xs text-on-surface-variant">{title}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="blue">{accent}</Badge>
          {onClose && (
            <IconButton icon="close" label={t('Đóng')} variant="ghost" size="sm" onClick={onClose} />
          )}
        </div>
      </div>

      {/* Recording Area */}
      <div className="flex flex-col items-center justify-center gap-3 py-2">
        {error ? (
          <div className="text-error text-center text-sm font-medium">
            <p>{t(error)}</p>
            <Button type="button" variant="outline" size="sm" onClick={handleReset} className="mt-2">
              {t('Thử lại')}
            </Button>
          </div>
        ) : isProcessing ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="w-8 h-8 rounded-full border-3 border-primary border-t-transparent animate-spin" />
            <p className="text-sm font-medium text-primary animate-pulse">{t('AI đang chấm điểm toàn bộ bài đọc...')}</p>
          </div>
        ) : isRecording ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-20 h-20 rounded-full bg-error/25 animate-ping pointer-events-none" />
              <Button
                type="button"
                variant="danger"
                onClick={handleStop}
                className="w-14 h-14 p-0! rounded-full flex items-center justify-center relative z-10"
                aria-label={t('Dừng đọc')}
              >
                <Icon name="stop" size={28} />
              </Button>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-mono text-error font-bold text-lg">
                {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
              </span>
              <span className="text-xs text-error font-medium animate-pulse">
                {t('Đang thu âm... Hãy đọc to và rõ ràng cả đoạn văn')}
              </span>
            </div>
          </div>
        ) : scoreResult ? (
          <div className="flex flex-col items-center gap-4 w-full">
            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlayingRecorded(false)}
                className="hidden"
              />
            )}

            {/* Score Summary Metrics */}
            <div className="grid grid-cols-4 gap-2 w-full max-w-md bg-surface-low p-3 rounded-2xl border border-outline-variant/20 text-center">
              <div className="flex flex-col">
                <span className="text-[11px] text-on-surface-variant font-bold uppercase">{t('Tổng điểm')}</span>
                <span className={`text-2xl font-black ${
                  scoreResult.score >= 80 ? 'text-primary' : scoreResult.score >= 60 ? 'text-tertiary' : 'text-error'
                }`}>{scoreResult.score}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-on-surface-variant font-bold uppercase">{t('Chuẩn xác')}</span>
                <span className="text-xl font-bold text-on-surface">{scoreResult.accuracyScore}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-on-surface-variant font-bold uppercase">{t('Trôi chảy')}</span>
                <span className="text-xl font-bold text-on-surface">{scoreResult.fluencyScore}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-on-surface-variant font-bold uppercase">{t('Đầy đủ')}</span>
                <span className="text-xl font-bold text-on-surface">{scoreResult.completenessScore}%</span>
              </div>
            </div>

            {/* Interactive Word Breakdown */}
            {scoreResult.words.length > 0 && (
              <div className="w-full bg-white p-4 rounded-2xl border border-outline-variant/30 leading-relaxed text-sm sm:text-base">
                <p className="text-xs text-on-surface-variant font-bold mb-2 uppercase tracking-wide">
                  {t('Chi tiết đánh giá từng từ:')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {scoreResult.words.map((w, i) => {
                    const isError = w.errorType === 'Mispronunciation' || w.accuracyScore < 60;
                    const isOmission = w.errorType === 'Omission';
                    return (
                      <span
                        key={i}
                        title={`Độ chuẩn: ${w.accuracyScore}%`}
                        className={`px-1.5 py-0.5 rounded-md transition-colors ${
                          isOmission
                            ? 'bg-surface-highest text-outline line-through'
                            : isError
                              ? 'bg-error-container/40 text-error font-bold underline decoration-wavy'
                              : w.accuracyScore >= 80
                                ? 'text-primary font-medium'
                                : 'text-tertiary'
                        }`}
                      >
                        {w.word}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-1">
              <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                <Icon name="refresh" size={18} className="mr-1" />
                {t('Đọc lại')}
              </Button>
              {audioUrl && (
                <Button type="button" variant="secondary" size="sm" onClick={togglePlayRecorded}>
                  <Icon name={isPlayingRecorded ? 'stop' : 'play_arrow'} size={18} className="mr-1" />
                  {t('Nghe lại bài đọc')}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Button type="button" variant="primary" size="md" onClick={handleStart} className="px-6">
              <Icon name="mic" size={20} className="mr-2" />
              {t('Bắt đầu đọc đoạn văn')}
            </Button>
            <span className="text-xs text-on-surface-variant">
              {t('Đọc trôi chảy đoạn văn. AI sẽ chấm độ chuẩn, độ trôi chảy và bắt lỗi từng từ.')}
            </span>
          </div>
        )}

        {errorMessage && (
          <p className="text-xs text-error font-medium mt-1">{errorMessage}</p>
        )}
      </div>
    </Card>
  );
}
