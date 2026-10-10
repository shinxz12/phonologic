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
    results: Array<Array<{ transcript: string }> & { isFinal: boolean }>;
  }) => void) | null = null;
  abort = vi.fn();

  constructor() {
    FakeSpeechRecognition.instances.push(this);
  }

  start() {}

  emitFinal(...transcripts: string[]) {
    const result = transcripts.map((transcript) => ({ transcript })) as Array<{
      transcript: string;
    }> & { isFinal: boolean };
    result.isFinal = true;
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

  it('stays recording after a wrong word and stops after an exact final match', async () => {
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
    expect(FakeSpeechRecognition.instances).toHaveLength(1);

    await act(async () => {
      FakeSpeechRecognition.instances[0].emitFinal('stick');
    });
    expect(screen.getByRole('button', { name: 'Dừng thu âm' })).toBeTruthy();

    await act(async () => {
      FakeSpeechRecognition.instances[0].emitFinal('STEAK.');
    });

    expect(await screen.findByRole('button', { name: 'Nghe lại bản thu' })).toBeTruthy();
    expect(screen.getByRole('status', { name: 'Khớp từ nhận diện: 100%' }).textContent).toContain('100%');
    expect(stopTrack).toHaveBeenCalledTimes(1);
  });
});
