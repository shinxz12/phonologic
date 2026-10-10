import { afterEach, describe, expect, it, vi } from 'vitest';
import { playBrowserTts } from './audioUtils';

class FakeUtterance {
  readonly text: string;
  lang = '';
  rate = 1;
  pitch = 1;
  volume = 1;
  voice: SpeechSynthesisVoice | null = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

function installSpeechSynthesis(voices: SpeechSynthesisVoice[] = []) {
  const synthesis = {
    speaking: false,
    pending: false,
    paused: false,
    getVoices: vi.fn(() => voices),
    speak: vi.fn(),
    cancel: vi.fn(),
    resume: vi.fn(),
    onvoiceschanged: null as (() => void) | null,
  };

  Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
    configurable: true,
    value: FakeUtterance,
  });
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: synthesis,
  });

  return synthesis;
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('playBrowserTts', () => {
  it('starts speech synchronously with the default voice while mobile voices are still loading', () => {
    const synthesis = installSpeechSynthesis();

    playBrowserTts('  steak  ', 'US', 0.75);

    expect(synthesis.speak).toHaveBeenCalledTimes(1);
    const utterance = synthesis.speak.mock.calls[0][0] as unknown as FakeUtterance;
    expect(utterance.text).toBe('steak');
    expect(utterance.lang).toBe('en-US');
    expect(utterance.rate).toBe(0.75);
    expect(synthesis.cancel).not.toHaveBeenCalled();
    utterance.onstart?.();
    utterance.onend?.();
  });

  it('replaces active speech and selects the requested accent voice', () => {
    const ukVoice = {
      name: 'Daniel',
      lang: 'en-GB',
    } as SpeechSynthesisVoice;
    const synthesis = installSpeechSynthesis([ukVoice]);
    synthesis.speaking = true;
    synthesis.paused = true;

    playBrowserTts('water', 'UK');

    expect(synthesis.cancel).toHaveBeenCalledTimes(1);
    expect(synthesis.resume).toHaveBeenCalledTimes(1);
    const utterance = synthesis.speak.mock.calls[0][0] as unknown as FakeUtterance;
    expect(utterance.voice).toBe(ukVoice);
    expect(utterance.lang).toBe('en-GB');
    utterance.onstart?.();
    utterance.onend?.();
  });

  it('retries with a loaded voice when Chrome initially exposes no voices', () => {
    const voices: SpeechSynthesisVoice[] = [];
    const synthesis = installSpeechSynthesis(voices);

    playBrowserTts('steak', 'US');
    expect(synthesis.speak).toHaveBeenCalledTimes(1);

    const usVoice = {
      name: 'Google US English',
      lang: 'en-US',
    } as SpeechSynthesisVoice;
    voices.push(usVoice);
    synthesis.onvoiceschanged?.();

    expect(synthesis.cancel).toHaveBeenCalledTimes(1);
    expect(synthesis.speak).toHaveBeenCalledTimes(2);
    const retriedUtterance = synthesis.speak.mock.calls[1][0] as unknown as FakeUtterance;
    expect(retriedUtterance.voice).toBe(usVoice);
    retriedUtterance.onstart?.();
    retriedUtterance.onend?.();
  });

  it('resets a Chrome synthesis queue that accepts speech but never starts it', () => {
    vi.useFakeTimers();
    const voice = {
      name: 'Google US English',
      lang: 'en-US',
    } as SpeechSynthesisVoice;
    const synthesis = installSpeechSynthesis([voice]);

    playBrowserTts('steak', 'US');
    expect(synthesis.speak).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(900);

    expect(synthesis.cancel).toHaveBeenCalledTimes(1);
    expect(synthesis.speak).toHaveBeenCalledTimes(2);
    const retriedUtterance = synthesis.speak.mock.calls[1][0] as unknown as FakeUtterance;
    expect(retriedUtterance.voice).toBeNull();
    retriedUtterance.onstart?.();
    retriedUtterance.onend?.();
  });
});
