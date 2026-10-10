import type { Accent } from '@phonologic/shared-types';

export interface PronunciationScoreResult {
  score: number; // 0 - 100
  grade: 'excellent' | 'good' | 'fair' | 'poor';
  matched: boolean;
  transcript: string;
  targetWord: string;
  feedbackText: string;
  details: {
    textSimilarity: number; // 0 - 100
    confidenceScore: number; // 0 - 100
    acousticQuality: number; // 0 - 100
  };
}

/**
 * Tính toán độ tương đồng xâu ký tự theo Levenshtein distance (0.0 - 1.0)
 */
export function calculateStringSimilarity(s1: string, s2: string): number {
  const a = s1.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const b = s2.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  if (a === b) return 1.0;
  if (!a || !b) return 0.0;

  // Nếu b chứa a hoặc a chứa b (nhận diện trong cụm từ)
  if (a.includes(b) || b.includes(a)) {
    const minLen = Math.min(a.length, b.length);
    const maxLen = Math.max(a.length, b.length);
    return Math.max(0.85, minLen / maxLen);
  }

  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[a.length][b.length];
  const maxLen = Math.max(a.length, b.length);
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Thuật toán chấm điểm phát âm đa chiều tại Client:
 * - 60% Độ khớp văn bản & ngữ âm (Text & Phonetic Similarity)
 * - 25% Độ tin cậy nhận diện âm thanh của engine (Confidence Score)
 * - 15% Chất lượng tín hiệu (Độ dài & Âm lượng hợp lệ)
 */
export function scorePronunciation(
  targetWord: string,
  transcript: string,
  confidence: number,
  durationSeconds: number,
  averageVolumeRms = 0.5
): PronunciationScoreResult {
  const cleanTarget = targetWord.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const cleanTranscript = transcript.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

  // Missing recognition data is not evidence of poor pronunciation.
  if (!cleanTarget || !cleanTranscript) {
    return {
      score: 0,
      grade: 'poor',
      matched: false,
      transcript: cleanTranscript,
      targetWord: cleanTarget,
      feedbackText: 'Chưa nhận diện được giọng nói. Hãy thử lại.',
      details: { textSimilarity: 0, confidenceScore: 0, acousticQuality: 0 },
    };
  }

  // 1. Text Similarity (0 - 100)
  const similarity = calculateStringSimilarity(cleanTarget, cleanTranscript);
  const isExact = cleanTarget === cleanTranscript;
  const isContained =
    Boolean(cleanTarget && cleanTranscript) &&
    (cleanTranscript.includes(cleanTarget) || cleanTarget.includes(cleanTranscript));

  let textScore = Math.round(similarity * 100);
  if (isExact) {
    textScore = 100;
  } else if (isContained) {
    textScore = Math.max(90, textScore);
  }
  // 2. Confidence Score (0 - 100)
  // Engine confidence is 0.0 - 1.0; nếu 0 hoặc không có thì ước lượng theo similarity
  const safeConfidence = confidence > 0 ? confidence : similarity;
  const confidenceScore = Math.round(safeConfidence * 100);

  // 3. Acoustic Quality Score (0 - 100)
  // Thời lượng chuẩn cho phát âm một từ là 0.4s - 3.5s
  let durationBonus = 100;
  if (durationSeconds < 0.3) {
    durationBonus = 40; // quá ngắn, có thể là tiếng click chuột/tiếng thở
  } else if (durationSeconds > 4.5) {
    durationBonus = 70; // quá dài, có tạp âm
  }

  const volumeBonus = averageVolumeRms > 0.05 ? 100 : 50;
  const acousticQuality = Math.round(durationBonus * 0.7 + volumeBonus * 0.3);

  // 4. Tổng hợp điểm cuối (0 - 100)
  const totalScore = Math.min(
    100,
    Math.max(
      cleanTranscript ? 15 : 0,
      Math.round(textScore * 0.6 + confidenceScore * 0.25 + acousticQuality * 0.15)
    )
  );

  let grade: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
  let feedbackText = '';

  if (totalScore >= 85) {
    grade = 'excellent';
    feedbackText = `Phát âm chuẩn xác xuất sắc! Nhận diện chuẩn từ "${cleanTarget}".`;
  } else if (totalScore >= 70) {
    grade = 'good';
    feedbackText = `Phát âm tốt! Máy nghe được: "${cleanTranscript}".`;
  } else if (totalScore >= 50) {
    grade = 'fair';
    feedbackText = `Phát âm chưa thật chuẩn. Máy nghe được: "${cleanTranscript}" (từ mục tiêu là "${cleanTarget}"). Hãy nghe lại âm mẫu và thử lại!`;
  } else {
    grade = 'poor';
    feedbackText = cleanTranscript
      ? `Máy nghe thành: "${cleanTranscript}". Hãy đọc to và rõ ràng hơn từ "${cleanTarget}".`
      : `Chưa nghe rõ phát âm. Hãy bật mic gần hơn và đọc rõ từ "${cleanTarget}".`;
  }

  return {
    score: totalScore,
    grade,
    matched: isExact || isContained || similarity >= 0.8,
    transcript: cleanTranscript,
    targetWord: cleanTarget,
    feedbackText,
    details: {
      textSimilarity: textScore,
      confidenceScore,
      acousticQuality,
    },
  };
}

interface WebSpeechRecognitionEvent {
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [itemIndex: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface WebSpeechRecognitionErrorEvent {
  error: string;
}

interface WebSpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: WebSpeechRecognitionEvent) => void) | null;
  onspeechstart?: (() => void) | null;
  onspeechend?: (() => void) | null;
  onerror: ((event: WebSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface WebSpeechRecognitionConstructor {
  new (): WebSpeechRecognitionInstance;
}

/**
 * Trình điều khiển Speech Recognition tại Client
 */
export function startClientSpeechRecognition(
  accent: Accent = 'US',
  onResult: (res: { transcript: string; confidence: number }) => void,
  onComplete?: (error?: string) => void,
  onSpeechEnd?: () => void
): { stop: () => void; cancel: () => void; isSupported: boolean } {
  if (typeof window === 'undefined') {
    return { stop: () => {}, cancel: () => {}, isSupported: false };
  }

  const windowWithSpeech = window as unknown as {
    SpeechRecognition?: WebSpeechRecognitionConstructor;
    webkitSpeechRecognition?: WebSpeechRecognitionConstructor;
  };

  const SpeechRec =
    windowWithSpeech.SpeechRecognition ||
    windowWithSpeech.webkitSpeechRecognition;

  if (!SpeechRec) {
    return { stop: () => {}, cancel: () => {}, isSupported: false };
  }

  try {
    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.lang = accent === 'UK' ? 'en-GB' : 'en-US';

    let finished = false;
    let stopRequested = false;
    let finalizeTimeout: number | null = null;

    const cleanup = () => {
      if (finalizeTimeout !== null) window.clearTimeout(finalizeTimeout);
      finalizeTimeout = null;
      recognition.onresult = null;
      recognition.onspeechend = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {
        // The service may already have disconnected.
      }
    };

    const complete = (error?: string) => {
      if (finished) return;
      finished = true;
      cleanup();
      onComplete?.(error);
    };

    const stop = () => {
      if (finished || stopRequested) return;
      stopRequested = true;
      // stop() asks the engine to return its pending result; it is asynchronous.
      // Finish on a final result/end, with a bounded wait for an unresponsive service.
      finalizeTimeout = window.setTimeout(() => complete(), 2000);
      try {
        recognition.stop();
      } catch {
        complete();
      }
    };

    recognition.onresult = (event: WebSpeechRecognitionEvent) => {
      if (finished) return;
      if (event.results && event.results.length > 0) {
        let bestTranscript = '';
        let bestConfidence = 0;
        let isFinalDelivered = false;

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res && res.length > 0) {
            for (let j = 0; j < res.length; j++) {
              const alt = res[j];
              if (alt && alt.transcript && alt.transcript.trim()) {
                if (!bestTranscript || (alt.confidence && alt.confidence > bestConfidence)) {
                  bestTranscript = alt.transcript.trim();
                  bestConfidence = alt.confidence || 0;
                }
              }
            }
            if (res.isFinal) {
              isFinalDelivered = true;
            }
          }
        }

        if (bestTranscript) {
          onResult({
            transcript: bestTranscript,
            confidence: bestConfidence,
          });
        }
        if (isFinalDelivered) {
          complete();
        }
      }
    };

    recognition.onspeechend = () => {
      if (finished) return;
      onSpeechEnd?.();
      stop();
    };

    recognition.onerror = (e: WebSpeechRecognitionErrorEvent) => {
      complete(e.error);
    };

    recognition.onend = () => complete();

    recognition.start();

    return {
      stop,
      cancel: () => {
        if (finished) return;
        finished = true;
        cleanup();
      },
      isSupported: true,
    };
  } catch (err) {
    console.warn('SpeechRecognition start failed:', err);
    return { stop: () => {}, cancel: () => {}, isSupported: false };
  }
}
