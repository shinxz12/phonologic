import type { Accent } from '@phonologic/shared-types';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence?: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionInstanceLike {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  start: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onspeechend?: (() => void) | null;
  onerror?: ((event: { error: string }) => void) | null;
  onend?: (() => void) | null;
}

interface SpeechRecognitionConstructorLike {
  new (): SpeechRecognitionInstanceLike;
}

export interface SpeechMatchResult {
  transcript: string;
  score: number;
}

export interface SpeechMatchController {
  stop: () => void;
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructorLike | null {
  if (typeof window === 'undefined') return null;

  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
  };

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

export function supportsSpeechRecognition(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}

export function normalizeRecognizedPhrase(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/[^a-z0-9']+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function calculateTextSimilarity(target: string, transcript: string): number {
  if (target === transcript) return 1;
  if (!target || !transcript) return 0;

  let shorter = target;
  let longer = transcript;
  if (shorter.length > longer.length) {
    shorter = transcript;
    longer = target;
  }

  let previous = new Uint16Array(shorter.length + 1);
  let current = new Uint16Array(shorter.length + 1);
  for (let index = 0; index <= shorter.length; index += 1) previous[index] = index;

  for (let longerIndex = 1; longerIndex <= longer.length; longerIndex += 1) {
    current[0] = longerIndex;
    for (let shorterIndex = 1; shorterIndex <= shorter.length; shorterIndex += 1) {
      const substitutionCost =
        longer[longerIndex - 1] === shorter[shorterIndex - 1] ? 0 : 1;
      current[shorterIndex] = Math.min(
        current[shorterIndex - 1] + 1,
        previous[shorterIndex] + 1,
        previous[shorterIndex - 1] + substitutionCost
      );
    }
    [previous, current] = [current, previous];
  }

  return 1 - previous[shorter.length] / longer.length;
}

export function scoreRecognizedPhrase(
  target: string,
  transcript: string,
  confidence?: number
): number {
  const normalizedTarget = normalizeRecognizedPhrase(target);
  const normalizedTranscript = normalizeRecognizedPhrase(transcript);
  const similarity = calculateTextSimilarity(normalizedTarget, normalizedTranscript);
  if (similarity === 0) return 0;

  const hasConfidence =
    typeof confidence === 'number' && Number.isFinite(confidence) && confidence > 0;
  const normalizedConfidence = hasConfidence
    ? Math.min(1, Math.max(0, confidence))
    : similarity;

  return Math.round((similarity * 0.75 + normalizedConfidence * 0.25) * 100);
}

export function startSpeechRecognition(
  target: string,
  accent: Accent,
  onResult: (result: SpeechMatchResult, isFinal: boolean) => void
): SpeechMatchController | null {
  const SpeechRecognition = getSpeechRecognitionConstructor();
  const normalizedTarget = normalizeRecognizedPhrase(target);
  if (!SpeechRecognition || !normalizedTarget) return null;

  try {
    const recognition = new SpeechRecognition();
    let stopped = false;
    let finalizeTimer: number | null = null;
    let bestResult: SpeechMatchResult | null = null;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;
    recognition.lang = accent === 'UK' ? 'en-GB' : 'en-US';

    const clearFinalizeTimer = () => {
      if (finalizeTimer !== null) {
        window.clearTimeout(finalizeTimer);
        finalizeTimer = null;
      }
    };

    const stop = () => {
      if (stopped) return;
      stopped = true;
      clearFinalizeTimer();
      try {
        recognition.abort();
      } catch {
        // The recognition service may already have ended.
      }
    };

    recognition.onresult = (event) => {
      if (stopped) return;

      for (let resultIndex = event.resultIndex; resultIndex < event.results.length; resultIndex += 1) {
        const recognitionResult = event.results[resultIndex];
        if (!recognitionResult) continue;

        for (
          let alternativeIndex = 0;
          alternativeIndex < recognitionResult.length;
          alternativeIndex += 1
        ) {
          const alternative = recognitionResult[alternativeIndex];
          if (!alternative) continue;
          const candidate = {
            transcript: alternative.transcript,
            score: scoreRecognizedPhrase(target, alternative.transcript, alternative.confidence),
          };
          if (!bestResult || candidate.score > bestResult.score) bestResult = candidate;
        }

        if (!bestResult) continue;
        onResult(bestResult, recognitionResult.isFinal);
        if (recognitionResult.isFinal) {
          stop();
          return;
        }
      }
    };

    // On mobile devices, onspeechend triggers the moment the user stops speaking.
    // Wait 350ms for any pending final result to process, then auto-stop immediately.
    recognition.onspeechend = () => {
      if (stopped) return;
      clearFinalizeTimer();
      finalizeTimer = window.setTimeout(() => {
        if (stopped) return;
        if (bestResult) {
          onResult(bestResult, true);
        }
        stop();
      }, 350);
    };

    recognition.onerror = () => {
      if (stopped) return;
      if (bestResult) {
        onResult(bestResult, true);
      }
      stop();
    };

    recognition.onend = () => {
      if (stopped) return;
      if (bestResult) {
        onResult(bestResult, true);
      }
      stop();
    };

    recognition.start();
    return { stop };
  } catch {
    return null;
  }
}
