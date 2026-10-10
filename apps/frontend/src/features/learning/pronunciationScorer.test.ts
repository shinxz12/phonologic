import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scorePronunciation, startClientSpeechRecognition } from './pronunciationScorer';

describe('scorePronunciation', () => {
  it.each([1, 6.5])('does not invent a score from an empty transcript after %s seconds', (duration) => {
    const result = scorePronunciation('steak', '', 0, duration);
    expect(result.score).toBe(0);
    expect(result.matched).toBe(false);
    expect(result.details.acousticQuality).toBe(0);
  });

  it('treats punctuation without any words as missing recognition data', () => {
    const result = scorePronunciation('steak', '... ...', 0, 1);
    expect(result.score).toBe(0);
    expect(result.transcript).toBe('');
  });
});

class FakeRecognition {
  static current: FakeRecognition;
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  lang = '';
  onresult: ((event: {
    results: Array<Array<{ transcript: string; confidence: number }> & { isFinal: boolean }>;
  }) => void) | null = null;
  onspeechend: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();

  constructor() {
    FakeRecognition.current = this;
  }

  emit(transcript: string, isFinal: boolean) {
    const result = Object.assign([{ transcript, confidence: 0.8 }], { isFinal });
    this.onresult?.({ results: [result] });
  }
}

describe('startClientSpeechRecognition lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('webkitSpeechRecognition', FakeRecognition);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('allows final results after speechend and completes once', () => {
    const onResult = vi.fn();
    const onComplete = vi.fn();
    startClientSpeechRecognition('UK', onResult, onComplete);
    const recognition = FakeRecognition.current;
    const lateEnd = recognition.onend;
    recognition.onspeechend?.();
    expect(onComplete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(800);
    recognition.emit('steak', true);
    lateEnd?.();
    expect(onResult).toHaveBeenCalledWith({ transcript: 'steak', confidence: 0.8 });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(recognition.abort).toHaveBeenCalledTimes(1);
    expect(recognition.lang).toBe('en-GB');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('finishes and releases the microphone if stop never receives a final result or end', () => {
    const onComplete = vi.fn();
    const controller = startClientSpeechRecognition('US', vi.fn(), onComplete);
    controller.stop();
    controller.stop();
    vi.advanceTimersByTime(2500);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(FakeRecognition.current.stop).toHaveBeenCalledTimes(1);
    expect(FakeRecognition.current.abort).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('ignores queued results after cancellation and clears the pending timeout', () => {
    const onResult = vi.fn();
    const onComplete = vi.fn();
    const controller = startClientSpeechRecognition('US', onResult, onComplete);
    const recognition = FakeRecognition.current;
    const lateResult = recognition.onresult;
    controller.stop();
    controller.cancel();
    lateResult?.({ results: [Object.assign([{ transcript: 'old', confidence: 0.8 }], { isFinal: true })] });
    vi.advanceTimersByTime(2500);
    expect(onResult).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    expect(recognition.abort).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
