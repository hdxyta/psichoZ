export class CDAPIError extends Error {
  constructor(public status: number) { super('Não foi possível completar a solicitação.'); }
}
export async function cdRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(15_000), ...options });
  if (!response.ok) throw new CDAPIError(response.status);
  if (!response.headers.get('Content-Type')?.includes('application/json')) throw new CDAPIError(503);
  return response.json() as Promise<T>;
}
export function escapeHTML(value: string) {
  return value.replace(/[&<>"']/gu, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}
export interface CollectorTrack {
  id: string; number: number; title: string | null; durationSeconds: number | null;
  streamUrl: string | null; downloadUrl: string | null; peaksUrl: string | null;
}
export interface CollectorCatalog { tracks: CollectorTrack[]; albumDownloadUrl: string | null; downloadsLockedUntil: string | null }
export const trackTitle = (track: CollectorTrack) => track.title ?? `Faixa ${String(track.number).padStart(2, '0')} — título a confirmar`;
export function timeLabel(seconds: number | null) {
  if (seconds === null || !Number.isFinite(seconds)) return '—:—';
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
