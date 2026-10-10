import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Accent } from '@phonologic/shared-types';
import { useAudioRecorder } from '../useAudioRecorder';
import { playBrowserTts } from '../audioUtils';
import {
  scorePronunciation,
  startClientSpeechRecognition,
  type PronunciationScoreResult,
} from '../pronunciationScorer';
import { Button, AudioControl, Card, Badge, Icon, IconButton } from '../../../components';

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
    duration,
    error,
    startRecording,
    stopRecording,
    resetRecording,
    uploadRecording,
  } = useAudioRecorder();

  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [speed, setSpeed] = useState<'0.75x' | '1x'>('0.75x');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [scoreResult, setScoreResult] = useState<PronunciationScoreResult | null>(null);
  const recognitionRef = useRef<{ stop: () => void; isSupported: boolean } | null>(null);
  const transcriptRef = useRef<{ transcript: string; confidence: number }>({ transcript: '', confidence: 0 });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pressStartTimeRef = useRef<number>(0);
  const autoStopTimeoutRef = useRef<number | null>(null);

  const clearAutoStopTimeout = () => {
    if (autoStopTimeoutRef.current !== null) {
      window.clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearAutoStopTimeout();
      stopRecognition();
    };
  }, []);

  const handleStartRecording = async () => {
    if (status === 'requesting' || isRecording) return;
    clearAutoStopTimeout();
    setScoreResult(null);
    transcriptRef.current = { transcript: '', confidence: 0 };
    pressStartTimeRef.current = Date.now();

    recognitionRef.current = startClientSpeechRecognition(
      accent,
      (res) => {
        transcriptRef.current = res;
      },
      () => {
        // onSpeechEnd: auto-stop when user stops speaking
        handleStopRecording();
      }
    );

    await startRecording();

    // Auto-stop after 6.5s if no speech or long pause
    autoStopTimeoutRef.current = window.setTimeout(() => {
      handleStopRecording();
    }, 6500);
  };

  const handlePointerDown = () => {
    handleStartRecording();
  };

  const handlePointerUp = () => {
    const pressDuration = Date.now() - pressStartTimeRef.current;
    if (pressDuration < 300) {
      // Short tap: keep recording for tap-to-speak
      return;
    }
    if (isRecording) {
      handleStopRecording();
    }
  };

  const handleStopRecording = () => {
    clearAutoStopTimeout();
    stopRecording();
    stopRecognition();

    const applyScore = () => {
      const res = scorePronunciation(
        word,
        transcriptRef.current.transcript,
        transcriptRef.current.confidence,
        duration,
        0.5
      );
      setScoreResult(res);
    };

    if (transcriptRef.current.transcript) {
      applyScore();
    } else {
      setTimeout(applyScore, 300);
    }
  };

  const handleReset = () => {
    clearAutoStopTimeout();
    stopRecognition();
    setScoreResult(null);
    transcriptRef.current = { transcript: '', confidence: 0 };
    resetRecording();
  };

  const handlePlaySample = () => {
    const rate = speed === '0.75x' ? 0.75 : 1.0;
    playBrowserTts(word, accent, rate);
  };

  const handleToggleSpeed = () => {
    setSpeed((s) => (s === '0.75x' ? '1x' : '0.75x'));
  };

  const handlePlayRecorded = () => {
    if (!audioUrl) return;
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

  const handleUpload = async () => {
    const res = await uploadRecording(word, { sessionId, readingId });
    if (res) {
      setUploadSuccess(true);
      if (onUploaded) {
        setTimeout(onUploaded, 1200);
      }
    }
  };

  const handleComplete = async () => {
    if (audioUrl) {
      await handleUpload();
      return;
    }
    setUploadSuccess(true);
    if (onUploaded) {
      setTimeout(onUploaded, 600);
    }
  };

  return (
    <div className={`flex w-full flex-col mx-auto ${compact ? 'gap-3 max-w-none' : 'gap-6 max-w-xl'}`}>
      {!compact && (
        <Card tone="soft" className="p-6! text-center flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <Badge tone="blue">{t('Giọng {{accent}}', { accent })}</Badge>
            {notation && <Badge tone="yellow">{notation}</Badge>}
          </div>

          <h2 className="font-display text-3xl font-extrabold tracking-tight text-on-surface uppercase">
            {word}
          </h2>

          {meaning && <p className="text-sm text-on-surface-variant font-medium">{meaning}</p>}

          <div className="flex flex-col items-center gap-1.5 pt-1">
            <AudioControl
              label={t('Nghe âm mẫu')}
              speed={speed}
              onPlay={handlePlaySample}
              onSpeedChange={handleToggleSpeed}
            />
          </div>
        </Card>
      )}

      <Card
        tone="white"
        className={
          compact
            ? 'p-0! flex flex-col items-center gap-3 border-0! shadow-none! rounded-none! bg-transparent!'
            : 'p-6! flex flex-col items-center gap-5 border border-outline-variant/30'
        }
      >
        {compact ? (
          <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-2xl bg-surface-low px-3 py-2 border border-outline-variant/20">
            <Badge tone="blue">{t('Giọng {{accent}}', { accent })}</Badge>
            <AudioControl
              label={t('Nghe âm mẫu')}
              speed={speed}
              onPlay={handlePlaySample}
              onSpeedChange={handleToggleSpeed}
            />
          </div>
        ) : (
          <div className="text-center">
            <h3 className="font-display font-bold text-base text-on-surface">
              {t('Luyện phát âm cùng Microphone')}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              {t('Nhấn nút để bắt đầu thu âm phát âm của bạn. Không chấm điểm giả lập AI.')}
            </p>
          </div>
        )}

        {uploadSuccess ? (
          <div className={`${compact ? 'py-1' : 'py-4'} flex flex-col items-center gap-2 text-primary`}>
            <div className={`${compact ? 'w-12 h-12' : 'w-16 h-16'} rounded-full bg-primary/10 flex items-center justify-center`}>
              <Icon name="check_circle" size={compact ? 28 : 40} />
            </div>
            <p className="font-display font-bold text-sm text-on-surface">
              {t('Đã lưu bản thu âm thành công!')}
            </p>
            {!compact && (
              <p className="text-xs text-on-surface-variant text-center max-w-xs">
                {t('Bản ghi âm thực tế của bạn đã được lưu trữ vào hệ thống.')}
              </p>
            )}
          </div>
        ) : isRecording ? (
          <div className={`flex items-center ${compact ? 'w-full justify-center gap-3' : 'flex-col gap-3'}`}>
            <div className="relative flex items-center justify-center shrink-0">
              <span className={`absolute ${compact ? 'w-16 h-16' : 'w-24 h-24'} rounded-full bg-error/25 animate-ping pointer-events-none`} />
              <Button
                type="button"
                variant="danger"
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onClick={handleStopRecording}
                className={`relative z-10 ${compact ? 'size-16!' : 'size-24!'} rounded-full! p-0! shadow-lg`}
                aria-label={t('Dừng thu âm')}
              >
                <Icon name="stop" size={compact ? 30 : 42} />
              </Button>
            </div>
            <div className={`flex flex-col gap-1 ${compact ? 'min-w-0 items-start' : 'items-center'}`}>
              <div className="flex items-center gap-2 text-error font-mono font-bold text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse" />
                00:{duration < 10 ? `0${duration}` : duration}
              </div>
              <span className={`text-xs text-on-surface-variant font-medium ${compact ? 'text-left' : 'text-center'}`}>
                {recognitionRef.current?.isSupported
                  ? t('Đang nghe từ "{{word}}"... Bản thu sẽ tự dừng khi bạn nói xong.', { word })
                  : t('Đang ghi âm... Nhấn nút vuông để dừng')}
              </span>
            </div>
          </div>
        ) : status === 'stopped' && audioUrl ? (
          <div className={`flex flex-col items-center w-full ${compact ? 'gap-2' : 'gap-4'}`}>
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlayingRecorded(false)}
              className="hidden"
            />
            {scoreResult && (
              <div className="flex flex-col items-center gap-1.5 py-1">
                <div
                  className={`relative shrink-0 ${compact ? 'size-16' : 'size-20'}`}
                  role="status"
                  aria-label={t('Khớp từ nhận diện: {{score}}%', { score: scoreResult.score })}
                >
                  <svg className="size-full -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      className="fill-none stroke-surface-highest"
                      strokeWidth="6"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      className={`fill-none ${
                        scoreResult.score >= 80
                          ? 'stroke-primary'
                          : scoreResult.score >= 50
                            ? 'stroke-tertiary'
                            : 'stroke-error'
                      }`}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="201.06"
                      strokeDashoffset={201.06 * (1 - scoreResult.score / 100)}
                    />
                  </svg>
                  <span
                    className={`absolute inset-0 grid place-items-center font-display font-black ${
                      scoreResult.score >= 80
                        ? 'text-primary'
                        : scoreResult.score >= 50
                          ? 'text-tertiary'
                          : 'text-error'
                    } ${compact ? 'text-sm' : 'text-base'}`}
                  >
                    {scoreResult.score}%
                  </span>
                </div>

                {scoreResult.transcript && (
                  <span className="text-xs text-on-surface-variant font-medium text-center">
                    {t('Nghe được:')} <strong className="text-on-surface font-bold">"{scoreResult.transcript}"</strong>
                    {scoreResult.matched && <span className="text-primary ml-1 font-bold">✓</span>}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 w-full">
              <IconButton
                type="button"
                variant="secondary"
                size="md"
                icon={isPlayingRecorded ? 'pause' : 'play_arrow'}
                label={isPlayingRecorded ? t('Tạm dừng') : t('Nghe lại bản thu')}
                onClick={handlePlayRecorded}
              />
              <IconButton
                type="button"
                variant="outline"
                size="md"
                icon="replay"
                label={t('Thu lại')}
                onClick={handleReset}
              />
              {onUploaded && (
                <IconButton
                  type="button"
                  variant="primary"
                  size="md"
                  icon="cloud_upload"
                  label={t('Lưu bản thu')}
                  onClick={handleComplete}
                />
              )}
            </div>
          </div>
        ) : (
          <div className={`flex items-center justify-center ${compact ? 'w-full gap-3' : 'flex-col gap-3'}`}>
            <Button
              type="button"
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onClick={handleStartRecording}
              disabled={status === 'requesting'}
              className={`${compact ? 'size-16!' : 'size-24!'} rounded-full! p-0! bg-primary text-white shadow-lg hover:scale-105 active:scale-95 transition-transform shrink-0`}
              aria-label={t('Bắt đầu thu âm')}
            >
              <Icon name="mic" size={compact ? 30 : 42} />
            </Button>
            <div className={compact ? 'min-w-0' : 'contents'}>
              {compact && (
                <p className="font-display text-sm font-bold text-on-surface">
                  {t('Luyện phát âm cùng Microphone')}
                </p>
              )}
              <span className={`text-xs text-on-surface-variant font-medium ${compact ? 'block mt-0.5' : ''}`} aria-live="polite">
                {status === 'requesting' ? t('Đang kết nối microphone...') : t('Nhấn mic để bắt đầu nói')}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className={`${compact ? 'p-2' : 'p-3'} rounded-xl bg-error-container text-error text-xs w-full text-center font-medium`}>
            {error}
          </div>
        )}

        {canSkip && !uploadSuccess && (
          <div className="pt-2 border-t border-outline-variant/20 w-full flex justify-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSkipped}
              className="text-on-surface-variant hover:text-on-surface"
            >
              {t('Bỏ qua bước nói')}
              <Icon name="skip_next" size={18} />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
