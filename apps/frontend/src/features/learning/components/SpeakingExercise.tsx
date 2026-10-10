import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Accent } from '@phonologic/shared-types';
import { useAudioRecorder } from '../useAudioRecorder';
import { playBrowserTts } from '../audioUtils';
import { Button, AudioControl, Card, Badge, Icon, IconButton } from '../../../components';
import { assessPronunciationAzure, type AzurePronunciationResult } from '../azureSpeech';

const SPEEDS = ['0.5x', '0.75x', '1x', '1.25x', '1.5x'] as const;
type SpeechSpeed = (typeof SPEEDS)[number];

const SPEED_RATES: Record<SpeechSpeed, number> = {
  '0.5x': 0.5,
  '0.75x': 0.75,
  '1x': 1.0,
  '1.25x': 1.25,
  '1.5x': 1.5,
};

export interface SpeakingExerciseProps {
  word: string;
  accent: Accent;
  sessionId?: string;
  readingId?: string;
  notation?: string;
  meaning?: string;
  onUploaded?: () => void;
  onSkipped?: () => void;
  canSkip?: boolean;
  compact?: boolean;
}

export function SpeakingExercise({
  word,
  accent,
  sessionId,
  readingId,
  notation,
  meaning,
  onUploaded,
  onSkipped,
  canSkip = true,
  compact = false,
}: SpeakingExerciseProps) {
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
    uploadRecording,
  } = useAudioRecorder();

  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [speed, setSpeed] = useState<SpeechSpeed>('1x');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [scoreResult, setScoreResult] = useState<AzurePronunciationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognitionNotice, setRecognitionNotice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const processedBlobRef = useRef<Blob | null>(null);


  const handleStartRecording = async () => {
    if (status === 'requesting' || isRecording || isProcessing) return;
    setScoreResult(null);
    setRecognitionNotice(null);
    setIsProcessing(false);
    processedBlobRef.current = null;
    // 2s chuẩn bị (nếu không nói gì), 1s im lặng sau khi đọc xong -> tự động ngắt
    await startRecording({ prepTimeoutMs: 2000, silenceTimeoutMs: 1000, maxDurationMs: 8000 });
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  // Watch for audioBlob changes to trigger Azure AI scoring
  useEffect(() => {
    if (audioBlob && status === 'stopped' && processedBlobRef.current !== audioBlob) {
      processedBlobRef.current = audioBlob;
      scoreWithAzure(audioBlob);
    }
  }, [audioBlob, status]);

  const scoreWithAzure = async (blob: Blob) => {
    setIsProcessing(true);
    setRecognitionNotice('AI đang phân tích chi tiết phát âm...');
    try {
      const result = await assessPronunciationAzure(blob, word, accent);
      setScoreResult(result);
      setRecognitionNotice(null);
    } catch (err: any) {
      console.error(err);
      setRecognitionNotice(err.message || 'Lỗi khi kết nối Azure AI. Bạn có thể nghe lại để đối chiếu.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    resetRecording();
    setScoreResult(null);
    setRecognitionNotice(null);
    setUploadSuccess(false);
    setIsProcessing(false);
  };

  const handlePlaySample = () => {
    playBrowserTts(word, accent, SPEED_RATES[speed]);
  };

  const toggleSpeed = () => {
    setSpeed((s) => {
      const idx = SPEEDS.indexOf(s);
      return SPEEDS[(idx + 1) % SPEEDS.length];
    });
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

  const handleSave = async () => {
    if (uploadSuccess) return;
    const res = await uploadRecording(word, { sessionId, readingId });
    if (res) {
      setUploadSuccess(true);
      onUploaded?.();
    }
  };

  return (
    <Card tone="white" className={compact ? 'p-2' : 'p-6'}>
      <div className={`grid gap-4 ${compact ? '' : 'sm:gap-6'}`}>
        {/* Bỏ tiêu đề dài dòng để rút gọn UI */}

        <div className="flex flex-col items-center gap-3">
          <Badge tone="blue">
            {accent}
          </Badge>
          <div className="flex flex-col items-center gap-1">
            <span className={`font-display font-black text-on-surface ${compact ? 'text-3xl' : 'text-4xl'}`}>
              {word}
            </span>
            {notation && <span className="font-serif text-lg text-primary">{notation}</span>}
            {meaning && <span className="text-sm text-on-surface-variant text-center px-4">{meaning}</span>}
          </div>

          {/* Thanh điều khiển: Loa và Mic đặt cạnh nhau, bằng nhau, kèm tốc độ */}
          <div className="flex items-center gap-1.5 mt-2">
            <IconButton
              icon="volume_up"
              label={t('Nghe mẫu')}
              variant="secondary"
              size="sm"
              onClick={handlePlaySample}
            />
            {isRecording ? (
              <IconButton
                icon="stop"
                label={t('Dừng thu âm')}
                variant="danger"
                size="sm"
                onClick={handleStopRecording}
                className="animate-pulse"
              />
            ) : (
              <IconButton
                icon="mic"
                label={t('Thu âm')}
                variant="primary"
                size="sm"
                onClick={handleStartRecording}
                disabled={status === 'requesting'}
              />
            )}
            {audioUrl && !isRecording && (
              <IconButton
                icon={isPlayingRecorded ? 'stop' : 'play_arrow'}
                label={t('Nghe lại')}
                variant="outline"
                size="sm"
                onClick={togglePlayRecorded}
              />
            )}
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={toggleSpeed}
              className="min-w-13 h-9! font-mono font-bold text-xs px-2.5!"
              title={t('Tốc độ: {{speed}}', { speed })}
            >
              {speed}
            </Button>
          </div>
        </div>

        <div className={`flex flex-col items-center min-h-[140px] justify-center ${compact ? 'gap-3' : 'gap-4'}`}>
          {error ? (
            <div className="flex flex-col items-center gap-3 text-error px-4 text-center">
              <Icon name="mic_off" className="text-3xl" />
              <p className="text-sm font-medium">{t(error)}</p>
              <Button type="button" variant="outline" onClick={handleReset}>
                {t('Thử lại')}
              </Button>
            </div>
          ) : status === 'uploading' ? (
            <div className="flex flex-col items-center gap-3 text-on-surface-variant">
              <Icon name="cloud_upload" className="text-3xl animate-pulse" />
              <p className="text-sm font-medium">{t('Đang lưu bản thu...')}</p>
            </div>
          ) : uploadSuccess ? (
            <div className={`${compact ? 'py-1' : 'py-4'} flex flex-col items-center gap-2 text-primary`}>
              <Icon name="check_circle" className="text-4xl" />
              <p className="text-sm font-bold text-center px-4">{t('Đã lưu bản thu âm thành công!')}</p>
              {!compact && (
                <p className="text-xs text-on-surface-variant text-center max-w-xs">
                  {t('Bản ghi âm thực tế của bạn đã được lưu trữ vào hệ thống.')}
                </p>
              )}
            </div>
          ) : isProcessing ? (
            <div className="flex items-center gap-2 py-4" role="status">
              <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-xs text-on-surface-variant font-medium animate-pulse">
                {t('Đang chấm điểm...')}
              </span>
            </div>
          ) : isRecording ? (
            <div className="flex flex-col items-center gap-1.5 py-3" aria-live="polite">
              {/* Sóng âm thanh động chuẩn app học tiếng Anh */}
              <div className="flex items-center justify-center gap-1 h-5">
                <span className="w-1 bg-error rounded-full animate-bounce h-2" style={{ animationDelay: '0ms' }} />
                <span className="w-1 bg-error rounded-full animate-bounce h-4" style={{ animationDelay: '150ms' }} />
                <span className="w-1 bg-error rounded-full animate-bounce h-5" style={{ animationDelay: '300ms' }} />
                <span className="w-1 bg-error rounded-full animate-bounce h-3" style={{ animationDelay: '450ms' }} />
                <span className="w-1 bg-error rounded-full animate-bounce h-2" style={{ animationDelay: '200ms' }} />
              </div>
              <span className="font-mono text-error font-bold text-xs">
                {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
              </span>
            </div>
          ) : (scoreResult !== null || recognitionNotice !== null || (status === 'stopped' && Boolean(audioUrl))) ? (
            <div className={`flex flex-col items-center w-full ${compact ? 'gap-2' : 'gap-4'}`}>
              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlayingRecorded(false)}
                  className="hidden"
                />
              )}
              {scoreResult && (
                <div className="flex flex-col items-center gap-2 py-1 w-full max-w-sm">
                  <div className="flex gap-6 items-center justify-center mb-2">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">{t('Chuẩn âm')}</span>
                      <span className={`text-3xl font-black ${
                        scoreResult.score >= 80 ? 'text-primary' : scoreResult.score >= 60 ? 'text-tertiary' : 'text-error'
                      }`}>{scoreResult.score}%</span>
                    </div>
                    <div className="w-px h-8 bg-surface-highest" />
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">{t('Nhận diện')}</span>
                      <span className="text-xl font-bold text-on-surface">{scoreResult.accuracyScore}%</span>
                    </div>
                  </div>

                  {scoreResult.phonemes.length > 0 && (
                    <div className="flex flex-col items-center gap-1.5 mt-1 w-full bg-surface-low p-3 rounded-2xl border border-outline-variant/20">
                      <span className="text-[11px] text-on-surface-variant font-medium">{t('Chi tiết từng âm tiết:')}</span>
                      <div className="flex flex-wrap justify-center gap-2">
                        {scoreResult.phonemes.map((p, i) => {
                          const isGood = p.accuracyScore >= 80;
                          const isFair = p.accuracyScore >= 60 && p.accuracyScore < 80;
                          return (
                            <div
                              key={i}
                              className={`flex flex-col items-center px-2 py-1 rounded-xl border ${
                                isGood
                                  ? 'bg-primary-container/30 border-primary/30 text-primary'
                                  : isFair
                                    ? 'bg-tertiary-container/30 border-tertiary/30 text-tertiary'
                                    : 'bg-error-container/30 border-error/40 text-error font-bold'
                              }`}
                            >
                              <span className="text-base font-serif font-black">{p.phoneme}</span>
                              <span className="text-[10px] font-mono">{p.accuracyScore}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Bỏ dòng "Nghe được:" theo yêu cầu */}
                </div>
              )}

              {recognitionNotice && (
                <p role="status" className="text-center text-sm text-on-surface-variant">
                  {t(recognitionNotice)}
                </p>
              )}

              {onUploaded && (
                <div className="flex items-center justify-center mt-3">
                  <Button type="button" variant="primary" onClick={onUploaded}>
                    {t('Tiếp tục')}
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {canSkip && status === 'idle' && (
          <div className="flex justify-center border-t border-surface-highest pt-4">
            <Button type="button" variant="ghost" size="sm" onClick={onSkipped}>
              {t('Bỏ qua bài này')}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
