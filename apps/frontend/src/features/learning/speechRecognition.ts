import type { Accent } from '@phonologic/shared-types';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
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
}

interface SpeechRecognitionConstructorLike {
  new (): SpeechRecognitionInstanceLike;
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

export function startExactSpeechMatch(
  target: string,
  accent: Accent,
  onMatch: () => void
): SpeechMatchController | null {
  const SpeechRecognition = getSpeechRecognitionConstructor();
  const normalizedTarget = normalizeRecognizedPhrase(target);
  if (!SpeechRecognition || !normalizedTarget) return null;

  try {
    const recognition = new SpeechRecognition();
    let stopped = false;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;
    recognition.lang = accent === 'UK' ? 'en-GB' : 'en-US';

    const stop = () => {
      if (stopped) return;
      stopped = true;
      try {
        recognition.abort();
      } catch {
        // The recognition service may already have ended.
      }
    };

    recognition.onresult = (event) => {
      for (let resultIndex = event.resultIndex; resultIndex < event.results.length; resultIndex += 1) {
        const result = event.results[resultIndex];
        if (!result?.isFinal) continue;

        for (let alternativeIndex = 0; alternativeIndex < result.length; alternativeIndex += 1) {
          if (normalizeRecognizedPhrase(result[alternativeIndex]?.transcript ?? '') === normalizedTarget) {
            stop();
            onMatch();
            return;
          }
        }
      }
    };

    recognition.start();
    return { stop };
  } catch {
    return null;
  }
}
