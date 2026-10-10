import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../../../lib/i18n';
import { SpeakingExercise } from './SpeakingExercise';

class FakeMediaRecorder {
  static instances: FakeMediaRecorder[] = [];
  static isTypeSupported(_type: string) {
    return true;
  }

  state: RecordingState = 'inactive';
  readonly mimeType: string = 'audio/webm';
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
    this.mimeType = options?.mimeType ?? 'audio/webm';
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

const stopTrack = vi.fn();

beforeEach(() => {
  FakeMediaRecorder.instances = [];
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: stopTrack }],
      }),
    },
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('SpeakingExercise recording controls', () => {
  it('renders word and compact toolbar controls', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <SpeakingExercise word="steak" accent="US" canSkip={false} compact />
      </QueryClientProvider>,
    );

    expect(screen.getByText('steak')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Nghe mẫu' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Thu âm' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '1x' })).toBeTruthy();
  });

  it('cycles playback speeds when clicking the speed button', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <SpeakingExercise word="steak" accent="US" canSkip={false} compact />
      </QueryClientProvider>,
    );

    const speedButton = screen.getByRole('button', { name: '1x' });
    expect(speedButton.textContent).toBe('1x');

    await user.click(speedButton);
    expect(speedButton.textContent).toBe('1.25x');

    await user.click(speedButton);
    expect(speedButton.textContent).toBe('1.5x');

    await user.click(speedButton);
    expect(speedButton.textContent).toBe('0.5x');
  });

  it('starts recording when clicking the Thu âm button', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <SpeakingExercise word="steak" accent="US" canSkip={false} compact />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Thu âm' }));

    expect(await screen.findByRole('button', { name: 'Dừng thu âm' })).toBeTruthy();
    expect(FakeMediaRecorder.instances).toHaveLength(1);
  });
});
