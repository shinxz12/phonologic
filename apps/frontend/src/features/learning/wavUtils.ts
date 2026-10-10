/**
 * Converts any browser audio Blob (webm, mp4, etc.) to 16kHz mono 16-bit PCM WAV Blob.
 * Azure Speech Pronunciation Assessment requires standard 16kHz PCM WAV.
 */
export async function convertBlobTo16kHzWav(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: 16000,
  });

  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const pcmData = audioBuffer.getChannelData(0); // Mono channel 16kHz

  // Create WAV buffer: 44 bytes header + PCM 16-bit samples
  const wavBuffer = new ArrayBuffer(44 + pcmData.length * 2);
  const view = new DataView(wavBuffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length
  view.setUint32(4, 36 + pcmData.length * 2, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 = PCM)
  view.setUint16(20, 1, true);
  // channel count (1 = Mono)
  view.setUint16(22, 1, true);
  // sample rate (16000)
  view.setUint32(24, 16000, true);
  // byte rate (sample rate * block align = 16000 * 2 = 32000)
  view.setUint32(28, 32000, true);
  // block align (channel count * bytes per sample = 1 * 2 = 2)
  view.setUint16(32, 2, true);
  // bits per sample (16)
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, pcmData.length * 2, true);

  // Write float PCM samples as 16-bit signed integers
  let offset = 44;
  for (let i = 0; i < pcmData.length; i++) {
    const s = Math.max(-1, Math.min(1, pcmData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  await audioContext.close();
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
