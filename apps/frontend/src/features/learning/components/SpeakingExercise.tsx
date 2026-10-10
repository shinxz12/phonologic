import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Accent } from '@phonologic/shared-types';
import { useAudioRecorder } from '../useAudioRecorder';
import { playBrowserTts } from '../audioUtils';
import {
  startExactSpeechMatch,
  supportsSpeechRecognition,
  type SpeechMatchController,
} from '../speechRecognition';
import { Button, AudioControl, Card, Badge, Icon } from '../../../components';

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
  const [autoStopped, setAutoStopped] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechMatchRef = useRef<SpeechMatchController | null>(null);
  const autoStopSupported = supportsSpeechRecognition();

  useEffect(() => {
    return () => speechMatchRef.current?.stop();
  }, []);

  const stopSpeechMatch = () => {
    speechMatchRef.current?.stop();
    speechMatchRef.current = null;
  };

  const handleStartRecording = async () => {
    stopSpeechMatch();
    setAutoStopped(false);
    const started = await startRecording();
    if (!started) return;

    speechMatchRef.current = startExactSpeechMatch(word, accent, () => {
      speechMatchRef.current = null;
      setAutoStopped(true);
      stopRecording();
    });
  };

  const handleStopRecording = () => {
    stopSpeechMatch();
    stopRecording();
  };

  const handleReset = () => {
    stopSpeechMatch();
    setAutoStopped(false);
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

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl mx-auto">
      {/* Target Word Prominent Display */}
      <Card tone="soft" className="p-6! text-center flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <Badge tone="blue">{t('Giọng {{accent}}', { accent })}</Badge>
          {notation && <Badge tone="yellow">{notation}</Badge>}
        </div>

        <h2 className="font-display text-3xl font-extrabold tracking-tight text-on-surface uppercase">
          {word}
        </h2>

        {meaning && <p className="text-sm text-on-surface-variant font-medium">{meaning}</p>}

        {/* TTS Audio Control with Explicit Disclaimer */}
        <div className="flex flex-col items-center gap-1.5 pt-1">
          <AudioControl
            label={t('Nghe âm mẫu')}
            speed={speed}
            onPlay={handlePlaySample}
            onSpeedChange={handleToggleSpeed}
          />
        </div>
      </Card>

      {/* Recording Studio Area */}
      <Card tone="white" className="p-6! flex flex-col items-center gap-5 border border-outline-variant/30">
        <div className="text-center">
          <h3 className="font-display font-bold text-base text-on-surface">
            {t('Luyện phát âm cùng Microphone')}
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            {t('Nhấn nút để bắt đầu thu âm phát âm của bạn. Không chấm điểm giả lập AI.')}
          </p>
        </div>

        {/* Big Tactile Microphone Button / Recording State */}
        {uploadSuccess ? (
          <div className="py-4 flex flex-col items-center gap-2 text-primary">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="check_circle" size={40} />
            </div>
            <p className="font-display font-bold text-sm text-on-surface">
              {t('Đã lưu bản thu âm thành công!')}
            </p>
            <p className="text-xs text-on-surface-variant text-center max-w-xs">
              {t('Bản ghi âm thực tế của bạn đã được lưu trữ vào hệ thống.')}
            </p>
          </div>
        ) : isRecording ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-24 h-24 rounded-full bg-error/25 animate-ping pointer-events-none" />
              <Button
                type="button"
                variant="danger"
                onClick={handleStopRecording}
                className="relative z-10 size-24! rounded-full! p-0! shadow-lg"
                aria-label={t('Dừng thu âm')}
              >
                <Icon name="stop" size={42} />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-error font-mono font-bold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse" />
              00:{duration < 10 ? `0${duration}` : duration}
            </div>
            <span className="text-xs text-on-surface-variant font-medium text-center">
              {autoStopSupported
                ? t('Đang nghe từ "{{word}}"... Bản thu sẽ tự dừng khi nhận diện đúng.', { word })
                : t('Đang ghi âm... Nhấn nút vuông để dừng')}
            </span>
          </div>
        ) : status === 'stopped' && audioUrl ? (
          <div className="flex flex-col items-center gap-4 w-full">
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlayingRecorded(false)}
              className="hidden"
            />
            {autoStopped && (
              <p className="text-xs font-bold text-primary text-center" role="status">
                {t('Đã nhận diện đúng "{{word}}" và tự dừng bản thu.', { word })}
              </p>
            )}



            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handlePlayRecorded}
              >
                <Icon name={isPlayingRecorded ? 'pause' : 'play_arrow'} size={20} />
                {isPlayingRecorded ? t('Tạm dừng') : t('Nghe lại bản thu')}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleReset}
              >
                <Icon name="refresh" size={20} />
                {t('Thu lại')}
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleUpload}
              >
                <Icon name="cloud_upload" size={20} />
                {t('Lưu bản thu')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Button
              type="button"
              onClick={handleStartRecording}
              disabled={status === 'requesting'}
              className="size-24! rounded-full! p-0! bg-primary text-white shadow-lg hover:scale-105 active:scale-95 transition-transform"
              aria-label={t('Bắt đầu thu âm')}
            >
              <Icon name="mic" size={42} />
            </Button>
            <span className="text-xs text-on-surface-variant font-medium" aria-live="polite">
              {status === 'requesting' ? t('Đang kết nối microphone...') : t('Nhấn mic để bắt đầu nói')}
            </span>
          </div>
        )}

        {/* Error message if any */}
        {error && (
          <div className="p-3 rounded-xl bg-error-container text-error text-xs w-full text-center font-medium">
            {error}
          </div>
        )}

        {/* Skip action */}
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
