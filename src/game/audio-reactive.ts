export interface TimelineEvent { time: number; type: string; intensity?: number }

/** Deterministic timeline dispatcher; real audio analysis can be layered on later. */
export function createAudioReactiveSystem(events: readonly TimelineEvent[], onEvent: (event: TimelineEvent) => void) {
  const ordered = [...events].sort((a, b) => a.time - b.time);
  let cursor = 0;
  return { update(seconds: number) { while (cursor < ordered.length && ordered[cursor].time <= seconds) onEvent(ordered[cursor++]); }, reset() { cursor = 0; } };
}

export const SILENCIO_EVENTS: readonly TimelineEvent[] = [
  { time: 8, type: 'glitch', intensity: .45 },
  { time: 24, type: 'surge', intensity: .75 },
  { time: 42, type: 'glitch', intensity: 1 },
];
