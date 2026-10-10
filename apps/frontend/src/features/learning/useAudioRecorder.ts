import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import type { RecordingView } from '@phonologic/shared-types';
import { api } from '../../lib/api';
import { queryClient, keys } from '../../lib/query';

export type AudioRecorderStatus =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'stopped'
  | 'uploading'
  | 'uploaded'
  | 'error';

export interface StartRecordingOptions {
  prepTimeoutMs?: number;
  silenceTimeoutMs?: number;
  maxDurationMs?: number;
}

export interface UseAudioRecorderReturn {
  status: AudioRecorderStatus;
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  duration: number;
  error: string | null;
  startRecording: (options?: StartRecordingOptions) => Promise<boolean>;
  stopRecording: () => void;
  resetRecording: () => void;
  uploadRecording: (
    word: string,
    options?: { sessionId?: string; readingId?: string }
  ) => Promise<RecordingView | null>;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const { t } = useTranslation();
  const [status, setStatus] = useState<AudioRecorderStatus>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [recorderError, setRecorderError] = useState<{ key: string } | Error | null>(null);

  const mountedRef = useRef(true);
  const generationRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const vadIntervalRef = useRef<number | null>(null);

  // Sync ref with audioUrl
  audioUrlRef.current = audioUrl;

  const cleanupStream = useCallback(() => {
    if (vadIntervalRef.current) {
      window.clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const detachAndStopRecorder = useCallback(() => {
    if (mediaRecorderRef.current) {
      const recorder = mediaRecorderRef.current;
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.onerror = null;
      if (recorder.state !== 'inactive') {
        try {
          recorder.stop();
        } catch {
          // ignore
        }
      }
      mediaRecorderRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
      detachAndStopRecorder();
      cleanupStream();
      clearTimer();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, [cleanupStream, clearTimer, detachAndStopRecorder]);

  // Upload Mutation via React Query
  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      word,
      options,
    }: {
      file: Blob;
      word: string;
      options?: { sessionId?: string; readingId?: string };
    }) => {
      const formData = new FormData();
      const filename = file.type.includes('mp4') ? 'speech.mp4' : 'speech.webm';
      formData.append('file', file, filename);
      formData.append('word', word);
      if (options?.sessionId) formData.append('sessionId', options.sessionId);
      if (options?.readingId) formData.append('readingId', options.readingId);

      return api<RecordingView>('/learning/recordings', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.recordings });
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
    },
  });

  const startRecording = useCallback(async (options?: StartRecordingOptions) => {
    const prepTimeoutMs = options?.prepTimeoutMs ?? 2000;
    const silenceTimeoutMs = options?.silenceTimeoutMs ?? 1000;
    const maxDurationMs = options?.maxDurationMs ?? 8000;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setRecorderError({ key: 'Trình duyệt của bạn không hỗ trợ ghi âm microphone.' });
      return false;
    }

    const currentGen = ++generationRef.current;
    detachAndStopRecorder();
    cleanupStream();
    clearTimer();

    setStatus('requesting');

    let stream: MediaStream;
    try {
      // Bật chống ồn phần cứng/trình duyệt (WebRTC DSP noise suppression)
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
        },
      });
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: unknown) {
        if (!mountedRef.current || generationRef.current !== currentGen) {
          return false;
        }
        setStatus('error');
        const key =
          err instanceof DOMException &&
          (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
            ? 'Quyền truy cập microphone bị từ chối. Vui lòng cho phép quyền microphone trên trình duyệt hoặc chọn Bỏ qua.'
            : 'Không thể kết nối với microphone thiết bị.';
        setRecorderError({ key });
        return false;
      }
    }

    // If unmounted or reset while getUserMedia was pending, stop granted tracks immediately
    if (!mountedRef.current || generationRef.current !== currentGen) {
      stream.getTracks().forEach((track) => track.stop());
      return false;
    }

    streamRef.current = stream;

    if (typeof MediaRecorder === 'undefined') {
      cleanupStream();
      setStatus('error');
      setRecorderError({ key: 'Trình duyệt của bạn không hỗ trợ ghi âm microphone.' });
      return false;
    }

    let mimeType = '';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/webm')) {
      mimeType = 'audio/webm';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4';
    }

    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    // Capture per-recording chunks locally in closure
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (generationRef.current === currentGen && e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      clearTimer();
      cleanupStream();
      if (!mountedRef.current || generationRef.current !== currentGen) {
        return;
      }
      const type = chunks[0]?.type || mimeType || 'audio/webm';
      const blob = new Blob(chunks, { type });
      const url = URL.createObjectURL(blob);
      setAudioBlob(blob);
      setAudioUrl(url);
      audioUrlRef.current = url;
      setStatus('stopped');
    };

    recorder.onerror = () => {
      if (!mountedRef.current || generationRef.current !== currentGen) return;
      setStatus('error');
      setRecorderError({ key: 'Không thể kết nối với microphone thiết bị.' });
    };
    recorder.start(200);
    setStatus('recording');
    setDuration(0);

    // Voice Activity Detection & Auto-stop
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        // Bộ lọc High-pass filter cắt hoàn toàn tiếng ù rền trầm của quạt máy tính (< 120Hz)
        const source = ctx.createMediaStreamSource(stream);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 120;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;

        source.connect(filter);
        filter.connect(analyser);

        const freqData = new Uint8Array(analyser.frequencyBinCount);
        const startRecordTime = Date.now();
        let lastSoundTime = Date.now();
        let hasSpoken = false;
        let ambientNoiseFloor = 20;
        let calibrationSamples = 0;

        vadIntervalRef.current = window.setInterval(() => {
          if (!mountedRef.current || generationRef.current !== currentGen) return;

          // 1. Giới hạn thời gian tối đa
          if (Date.now() - startRecordTime > maxDurationMs) {
            if (vadIntervalRef.current) {
              window.clearInterval(vadIntervalRef.current);
              vadIntervalRef.current = null;
            }
            stopRecording();
            return;
          }

          // 2. Đo năng lượng dải tần giọng người (bins 2 đến 36 ~150Hz - 4.5kHz)
          analyser.getByteFrequencyData(freqData);
          let peakVoice = 0;
          for (let i = 2; i < Math.min(36, freqData.length); i++) {
            if (freqData[i] > peakVoice) peakVoice = freqData[i];
          }

          // Trong 300ms đầu, tự động học đo mức ồn của quạt máy tính để thích ứng
          if (calibrationSamples < 3) {
            calibrationSamples++;
            if (peakVoice > ambientNoiseFloor) ambientNoiseFloor = peakVoice;
            lastSoundTime = Date.now();
            return;
          }

          // Ngưỡng giọng nói động: luôn cao hơn tiếng ồn của quạt máy tính + 14 đơn vị (tối thiểu 35)
          const dynamicVoiceThreshold = Math.max(35, ambientNoiseFloor + 14);

          if (peakVoice > dynamicVoiceThreshold) {
            hasSpoken = true;
            lastSoundTime = Date.now();
          } else {
            if (!hasSpoken) {
              // Chưa nói: trong 2s chuẩn bị không nói gì -> tự động ngắt
              if (Date.now() - startRecordTime >= prepTimeoutMs) {
                if (vadIntervalRef.current) {
                  window.clearInterval(vadIntervalRef.current);
                  vadIntervalRef.current = null;
                }
                stopRecording();
              }
            } else {
              // Đã nói xong: nếu im lặng đúng 1s -> dừng ngay lập tức
              if (Date.now() - lastSoundTime >= silenceTimeoutMs) {
                if (vadIntervalRef.current) {
                  window.clearInterval(vadIntervalRef.current);
                  vadIntervalRef.current = null;
                }
                stopRecording();
              }
            }
          }
        }, 100);
      }
    } catch {
      // Fallback
    }

    const startTime = Date.now();
    timerRef.current = window.setInterval(() => {
      if (mountedRef.current && generationRef.current === currentGen) {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }
    }, 500);
    return true;
  }, [cleanupStream, clearTimer, detachAndStopRecorder]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const resetRecording = useCallback(() => {
    generationRef.current += 1;
    detachAndStopRecorder();
    cleanupStream();
    clearTimer();
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecorderError(null);
    setStatus('idle');
  }, [cleanupStream, clearTimer, detachAndStopRecorder]);

  const uploadRecording = useCallback(
    async (word: string, options?: { sessionId?: string; readingId?: string }): Promise<RecordingView | null> => {
      if (!audioBlob) {
        setRecorderError({ key: 'Chưa có bản thu âm để lưu.' });
        return null;
      }
      try {
        setStatus('uploading');
        setRecorderError(null);
        const res = await uploadMutation.mutateAsync({ file: audioBlob, word, options });
        setStatus('uploaded');
        return res;
      } catch (err: unknown) {
        setStatus('stopped');
        setRecorderError(err instanceof Error ? err : { key: 'Lỗi khi tải bản thu lên máy chủ.' });
        return null;
      }
    },
    [audioBlob, uploadMutation]
  );

  return {
    status,
    isRecording: status === 'recording',
    audioBlob,
    audioUrl,
    duration,
    error:
      recorderError instanceof Error
        ? recorderError.message
        : recorderError
          ? t(recorderError.key)
          : null,
    startRecording,
    stopRecording,
    resetRecording,
    uploadRecording,
  };
}
