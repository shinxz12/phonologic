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
    // Đọc từng từ: im lặng 2s -> tự động dừng
    await startRecording({ silenceTimeoutMs: 2000, maxDurationMs: 8000 });
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
        {!compact && (
          <div className="flex flex-col items-center gap-2">
            <h3 className="text-xl font-display font-bold text-on-surface text-center px-4">
              {t('Luyện phát âm cùng Microphone')}
            </h3>
            <p className="text-sm text-on-surface-variant text-center max-w-sm px-4">
              {t('Nhấn nút để bắt đầu thu âm phát âm của bạn.')}
            </p>
          </div>
        )}

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

          <div className="mt-1">
            <AudioControl
              onPlay={handlePlaySample}
              speed={speed}
              onSpeedChange={toggleSpeed}
              label={t('Nghe mẫu')}
            />
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
            <p role="status" className="py-4 text-center text-sm text-on-surface-variant">
              {recognitionNotice || t('Đang xử lý nhận diện giọng nói...')}
            </p>
          ) : isRecording ? (
            <div className={`flex items-center ${compact ? 'w-full justify-center gap-3' : 'flex-col gap-3'}`}>
              <div className="relative flex items-center justify-center shrink-0">
                <span className={`absolute ${compact ? 'w-16 h-16' : 'w-24 h-24'} rounded-full bg-error/25 animate-ping pointer-events-none`} />
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleStopRecording}
                  className={`relative z-10 ${compact ? 'w-12 h-12 p-0' : 'w-16 h-16 p-0'} rounded-full flex items-center justify-center`}
                  aria-label={t('Dừng thu âm')}
                >
                  <Icon name="stop" className={compact ? 'text-2xl' : 'text-3xl'} />
                </Button>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="font-mono text-error font-bold">
                  {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                </span>
                {!compact && (
                  <span className="text-xs text-error font-medium animate-pulse text-center px-4">
                    {t('Đang thu âm... Bản thu tự động được chấm điểm khi dừng.')}
                  </span>
                )}
              </div>
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

              <div className="flex items-center gap-2 flex-wrap justify-center mt-2">
                <Button type="button" variant="outline" onClick={handleReset}>
                  {t('Thu lại')}
                </Button>
                {audioUrl && (
                  <Button type="button" variant="outline" onClick={togglePlayRecorded}>
                    <Icon name={isPlayingRecorded ? 'stop' : 'play_arrow'} className="mr-1" />
                    {t('Nghe lại')}
                  </Button>
                )}
                {onUploaded && (
                  <Button type="button" variant="primary" onClick={onUploaded}>
                    {t('Tiếp tục')}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="primary"
              onClick={handleStartRecording}
              disabled={status === 'requesting'}
              className="px-8"
            >
              <Icon name="mic" className="mr-2" />
              {status === 'requesting' ? t('Đang kết nối...') : t('Bắt đầu thu âm')}
            </Button>
          )}
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
