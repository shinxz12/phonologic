import { afterEach, describe, expect, it, vi } from 'vitest';
import { playBrowserTts } from './audioUtils';

class FakeUtterance {
  readonly text: string;
  lang = '';
  rate = 1;
  pitch = 1;
  volume = 1;
  voice: SpeechSynthesisVoice | null = null;
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
  });
});
