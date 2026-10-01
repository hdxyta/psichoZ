import type { CollectorTrack } from './api';

/** Decode only the active, optimized stream. Prefer offline peaks for long tracks. */
export async function loadPeaks(track: CollectorTrack, signal: AbortSignal): Promise<number[]> {
  signal = AbortSignal.any([signal, AbortSignal.timeout(30_000)]);
  const response = await fetch(track.peaksUrl ?? track.streamUrl!, { credentials: 'same-origin', signal });
  if (!response.ok) throw new Error(response.status === 401 ? 'session' : 'waveform');
  const limit = track.peaksUrl ? 64_000 : 24 * 1024 * 1024;
  if (Number(response.headers.get('Content-Length')) > limit) { await response.body?.cancel(); throw new Error('size'); }
  const reader = response.body!.getReader();
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > limit) { await reader.cancel(); throw new Error('size'); }
    chunks.push(part.value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  if (track.peaksUrl) {
    const values: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(values) || !values.length || values.length > 4000 || !values.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1)) throw new Error('peaks');
    return values;
  }
  signal.throwIfAborted();
  const context = new AudioContext();
  try {
    const audio = await context.decodeAudioData(bytes.buffer);
    signal.throwIfAborted();
    const data = audio.getChannelData(0);
    const step = Math.max(1, Math.ceil(data.length / 600));
    const peaks: number[] = [];
    for (let i = 0; i < data.length; i += step) {
      let peak = 0;
      for (let j = i; j < Math.min(i + step, data.length); j++) peak = Math.max(peak, Math.abs(data[j]));
      peaks.push(peak);
    }
    return peaks;
  } finally { await context.close(); }
}

export function drawWaveform(canvas: HTMLCanvasElement, peaks: number[], progress: number) {
  const width = canvas.clientWidth; const height = canvas.clientHeight;
  const scale = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
  const context = canvas.getContext('2d');
  if (!context || !width) return;
  context.scale(scale, scale);
  const bars = Math.min(peaks.length, Math.floor(width / 4));
  for (let i = 0; i < bars; i++) {
    const from = Math.floor(i * peaks.length / bars);
    const to = Math.max(from + 1, Math.floor((i + 1) * peaks.length / bars));
    const amplitude = Math.max(...peaks.slice(from, to));
    const barHeight = Math.max(2, amplitude * (height - 8));
    context.fillStyle = i / bars < progress ? '#f20d1f' : '#88807a';
    context.fillRect(i * width / bars, (height - barHeight) / 2, Math.max(1, width / bars - 2), barHeight);
  }
}
