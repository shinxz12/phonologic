import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../../../lib/i18n';
import { SpeakingExercise } from './SpeakingExercise';

class FakeMediaRecorder {
  static instances: FakeMediaRecorder[] = [];
  static isTypeSupported(type: string) {
    return type === 'audio/mp4';
  }

  state: RecordingState = 'inactive';
  readonly mimeType: string;
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
    this.mimeType = options?.mimeType ?? 'audio/mp4';
    FakeMediaRecorder.instances.push(this);
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({
      data: new Blob(['recorded-audio'], { type: this.mimeType }),
    } as BlobEvent);
    this.onstop?.();
  }
}

class FakeSpeechRecognition {
  static instances: FakeSpeechRecognition[] = [];
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  lang = '';
  onresult: ((event: {
    resultIndex: number;
    results: Array<
      Array<{ transcript: string; confidence?: number }> & { isFinal: boolean }
    >;
  }) => void) | null = null;
  abort = vi.fn();

  constructor() {
    FakeSpeechRecognition.instances.push(this);
  }

  start() {}

  emit(transcript: string, confidence: number, isFinal: boolean) {
    const result = [{ transcript, confidence }] as Array<{
      transcript: string;
      confidence?: number;
    }> & { isFinal: boolean };
    result.isFinal = isFinal;
    this.onresult?.({ resultIndex: 0, results: [result] });
  }
}

const stopTrack = vi.fn();

beforeEach(() => {
  FakeMediaRecorder.instances = [];
  FakeSpeechRecognition.instances = [];
  stopTrack.mockClear();
  Object.defineProperty(globalThis, 'MediaRecorder', {
    configurable: true,
    value: FakeMediaRecorder,
  });
  Object.defineProperty(window, 'webkitSpeechRecognition', {
    configurable: true,
    value: FakeSpeechRecognition,
  });
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: vi.fn(async () => ({
        getTracks: () => [{ stop: stopTrack }],
      })),
    },
  });
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:recording'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('SpeakingExercise recording controls', () => {
  it('keeps manual tap-to-stop when speech recognition is unavailable', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const user = userEvent.setup();
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: undefined,
    });


    render(
      <QueryClientProvider client={queryClient}>
        <SpeakingExercise word="steak" accent="US" canSkip={false} compact />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Bắt đầu thu âm' }));

    expect(await screen.findByRole('button', { name: 'Dừng thu âm' })).toBeTruthy();
    expect(FakeMediaRecorder.instances).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Dừng thu âm' }));

    expect(await screen.findByRole('button', { name: 'Nghe lại bản thu' })).toBeTruthy();
    expect(stopTrack).toHaveBeenCalledTimes(1);
  });

  it('auto-stops after a wrong final result and displays its match score', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <SpeakingExercise word="steak" accent="US" canSkip={false} />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Bắt đầu thu âm' }));
    expect(await screen.findByRole('button', { name: 'Dừng thu âm' })).toBeTruthy();

    await act(async () => {
      FakeSpeechRecognition.instances[0].emit('stick', 0.8, true);
    });

    expect(await screen.findByRole('button', { name: 'Thu lại' })).toBeTruthy();
    expect(screen.getByRole('status', { name: 'Khớp từ nhận diện: 65%' }).textContent).toContain('65%');
  });

  it('scores the latest interim result when the learner stops manually', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <SpeakingExercise word="steak" accent="US" canSkip={false} compact />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Bắt đầu thu âm' }));
    await act(async () => {
      FakeSpeechRecognition.instances[0].emit('steam', 0.6, false);
    });
    await user.click(screen.getByRole('button', { name: 'Dừng thu âm' }));

    expect(await screen.findByRole('button', { name: 'Thu lại' })).toBeTruthy();
    expect(screen.getByRole('status', { name: 'Khớp từ nhận diện: 75%' }).textContent).toContain('75%');
  });

  it('uses recognition confidence instead of always awarding 100%', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <SpeakingExercise word="steak" accent="US" canSkip={false} />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Bắt đầu thu âm' }));
    await act(async () => {
      FakeSpeechRecognition.instances[0].emit('STEAK.', 0.8, true);
    });

    expect(await screen.findByRole('button', { name: 'Thu lại' })).toBeTruthy();
    expect(screen.getByRole('status', { name: 'Khớp từ nhận diện: 95%' }).textContent).toContain('95%');
  });
});
