import type { ArcadeConfig, ArcadeStatus } from './types';

export type PuzzleKind = 'memory' | 'circuit' | 'rhythm' | 'sequence' | 'finale';
export interface PuzzleCell { symbol: number | null; state: 'hidden' | 'visible' | 'matched' | 'on' | 'off' | 'active'; disabled: boolean }
export interface PuzzleView {
  kind: Exclude<PuzzleKind, 'finale'>;
  cells: PuzzleCell[];
  columns: number;
  heading: string;
  detail: string;
  beat: number;
  accepting: boolean;
}
export interface PuzzleSession {
  update(dt: number): void;
  choose(index: number): void;
  status(): ArcadeStatus;
  view(): PuzzleView;
}

function random(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}
function shuffle<T>(items: T[], seed: number): T[] {
  const result = [...items], next = random(seed);
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
const safeDt = (dt: number) => Number.isFinite(dt) ? Math.max(0, dt) : 0;

function memory(seed: number, pairCount = 6): PuzzleSession {
  const deck = shuffle(Array.from({ length: pairCount * 2 }, (_, i) => i % pairCount), seed);
  const matched = new Set<number>();
  let phase: ArcadeStatus['phase'] = 'playing', preview = 2.2, waiting = 0, errors = 0;
  let selected: number[] = [];
  const limit = pairCount === 6 ? 14 : 8;
  return {
    update(dt) {
      if (phase !== 'playing') return;
      preview = Math.max(0, preview - safeDt(dt));
      if (waiting > 0) {
        waiting = Math.max(0, waiting - safeDt(dt));
        if (!waiting) selected = [];
      }
    },
    choose(index) {
      if (phase !== 'playing' || preview > 0 || waiting > 0 || !Number.isInteger(index) || index < 0 || index >= deck.length || matched.has(index) || selected.includes(index)) return;
      selected.push(index);
      if (selected.length < 2) return;
      if (deck[selected[0]] === deck[selected[1]]) {
        selected.forEach((cell) => matched.add(cell));
        selected = [];
        if (matched.size === deck.length) phase = 'won';
      } else {
        errors += 1;
        waiting = 0.8;
        if (errors >= limit) phase = 'lost';
      }
    },
    status: () => ({ phase, progress: matched.size / 2, total: pairCount, label: 'Pares recuperados', hint: preview > 0 ? 'Observe os símbolos. As cartas viram em instantes.' : `${limit - errors} erros restantes · vire duas cartas com o mesmo símbolo.` }),
    view: () => ({ kind: 'memory', columns: pairCount === 6 ? 4 : 3, heading: 'Lembre o que viu.', detail: preview > 0 ? 'MEMORIZE' : waiting > 0 ? 'SÍMBOLOS DIFERENTES' : 'ENCONTRE OS PARES', beat: 0, accepting: phase === 'playing' && !preview && !waiting,
      cells: deck.map((symbol, i) => ({ symbol: preview > 0 || selected.includes(i) || matched.has(i) ? symbol : null, state: matched.has(i) ? 'matched' : preview > 0 || selected.includes(i) ? 'visible' : 'hidden', disabled: phase !== 'playing' || preview > 0 || waiting > 0 || matched.has(i) })) }),
  };
}

export function toggleCircuit(cells: readonly boolean[], index: number): boolean[] {
  const next = [...cells];
  if (!Number.isInteger(index) || index < 0 || index >= 9) return next;
  const x = index % 3, y = Math.floor(index / 3);
  for (let i = 0; i < 9; i += 1) if (Math.abs(i % 3 - x) + Math.abs(Math.floor(i / 3) - y) <= 1) next[i] = !next[i];
  return next;
}
function circuit(seed: number): PuzzleSession {
  let cells = Array<boolean>(9).fill(true);
  for (const index of shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8], seed).slice(0, 4)) cells = toggleCircuit(cells, index);
  // A non-empty authored puzzle is mandatory, even if the generator changes later.
  if (cells.every(Boolean)) cells = toggleCircuit(cells, 4);
  let phase: ArcadeStatus['phase'] = 'playing', moves = 0;
  return {
    update() {},
    choose(index) {
      if (phase !== 'playing' || !Number.isInteger(index) || index < 0 || index >= 9) return;
      cells = toggleCircuit(cells, index);
      moves += 1;
      if (cells.every(Boolean)) phase = 'won';
      else if (moves >= 24) phase = 'lost';
    },
    status: () => ({ phase, progress: cells.filter(Boolean).length, total: 9, label: 'Selos conectados', hint: `${24 - moves} movimentos · cada selo alterna a si e os vizinhos. Deixe todos vermelhos.` }),
    view: () => ({ kind: 'circuit', columns: 3, heading: 'Feche o circuito.', detail: 'ATIVE OS NOVE SELOS', beat: 0, accepting: phase === 'playing', cells: cells.map((on) => ({ symbol: on ? 2 : null, state: on ? 'on' : 'off', disabled: phase !== 'playing' })) }),
  };
}

function sequence(seed: number, lengths = [3, 4, 5, 6]): PuzzleSession {
  const next = random(seed), pattern = Array.from({ length: Math.max(...lengths) }, () => Math.floor(next() * 4));
  let phase: ArcadeStatus['phase'] = 'playing', round = 0, position = 0, clock = 0, errors = 0, showing = true;
  const intro = 0.65, interval = 0.8, litFor = 0.5;
  function active() {
    if (!showing || clock < intro) return -1;
    const index = Math.floor((clock - intro) / interval);
    return index < lengths[round] && (clock - intro) % interval < litFor ? pattern[index] : -1;
  }
  return {
    update(dt) {
      if (phase !== 'playing' || !showing) return;
      clock += safeDt(dt);
      if (clock >= intro + lengths[round] * interval + 0.35) { showing = false; position = 0; }
    },
    choose(index) {
      if (phase !== 'playing' || showing || !Number.isInteger(index) || index < 0 || index > 3) return;
      if (index !== pattern[position]) {
        errors += 1;
        if (errors >= 3) phase = 'lost';
        else { showing = true; clock = 0; position = 0; }
        return;
      }
      position += 1;
      if (position === lengths[round]) {
        round += 1;
        if (round === lengths.length) phase = 'won';
        else { showing = true; clock = 0; position = 0; }
      }
    },
    status: () => ({ phase, progress: round, total: lengths.length, label: 'Sequências devolvidas', hint: phase === 'won' ? 'A sequência está completa.' : showing ? `Observe a ordem dos ${lengths[round]} símbolos · ${3 - errors} tentativas.` : `Sua vez: símbolo ${position + 1} de ${lengths[round]} · ${3 - errors} tentativas.` }),
    view: () => ({ kind: 'sequence', columns: 4, heading: 'Não quebre a ordem.', detail: showing ? 'OBSERVE A SEQUÊNCIA' : 'REPITA A SEQUÊNCIA', beat: 0, accepting: phase === 'playing' && !showing,
      cells: Array.from({ length: 4 }, (_, i) => ({ symbol: i, state: active() === i ? 'active' : 'visible', disabled: phase !== 'playing' || showing })) }),
  };
}

export const RHYTHM_BEAT_COUNT = 24;
export const RHYTHM_INTERVAL = 0.75;
export const RHYTHM_START = 1.5;
export const RHYTHM_WINDOW = 0.2;
function rhythm(): PuzzleSession {
  const resolved = new Set<number>();
  let phase: ArcadeStatus['phase'] = 'playing', clock = 0, hits = 0, errors = 0, feedback = 'Prepare-se';
  const check = () => {
    if (errors > 6) phase = 'lost';
    else if (resolved.size === RHYTHM_BEAT_COUNT) phase = hits >= 18 ? 'won' : 'lost';
  };
  return {
    update(dt) {
      if (phase !== 'playing') return;
      clock += safeDt(dt);
      for (let i = 0; i < RHYTHM_BEAT_COUNT; i += 1) if (!resolved.has(i) && clock > RHYTHM_START + i * RHYTHM_INTERVAL + RHYTHM_WINDOW) {
        resolved.add(i); errors += 1; feedback = 'Pulso perdido';
      }
      check();
    },
    choose(index) {
      if (phase !== 'playing' || index !== 0) return;
      const beat = Math.round((clock - RHYTHM_START) / RHYTHM_INTERVAL);
      if (beat >= 0 && beat < RHYTHM_BEAT_COUNT && !resolved.has(beat) && Math.abs(clock - (RHYTHM_START + beat * RHYTHM_INTERVAL)) <= RHYTHM_WINDOW) {
        resolved.add(beat); hits += 1; feedback = 'No pulso!';
      } else { errors += 1; feedback = 'Fora do pulso'; }
      check();
    },
    status: () => ({ phase, progress: hits, total: 24, label: 'Pulsos certos · mínimo 18', hint: `${feedback} · ${Math.max(0, 6 - errors)} falhas permitidas · acerte 18 dos 24 pulsos.` }),
    view: () => ({ kind: 'rhythm', columns: 1, heading: 'Segure a tensão.', detail: 'PADRÃO DEMONSTRATIVO · ESPAÇO OU TOQUE', beat: clock, accepting: phase === 'playing', cells: [{ symbol: 0, state: 'visible', disabled: phase !== 'playing' }] }),
  };
}

function finale(seed: number): PuzzleSession {
  const stages = [memory(seed, 3), circuit(seed + 11), sequence(seed + 17, [4])];
  let stage = 0;
  const names = ['Memória', 'Circuito', 'Sequência'];
  function advance() { if (stage < 2 && stages[stage].status().phase === 'won') stage += 1; }
  return {
    update(dt) { stages[stage].update(dt); advance(); },
    choose(index) { stages[stage].choose(index); advance(); },
    status() {
      const current = stages[stage].status();
      return { phase: current.phase, progress: current.phase === 'won' ? 3 : stage, total: 3, label: 'Provas concluídas', hint: `${stage + 1}/3 · ${names[stage]} · ${current.hint}` };
    },
    view() { return { ...stages[stage].view(), heading: `Prova ${stage + 1} / 3 · ${names[stage]}` }; },
  };
}

export function createPuzzleSession(config: Pick<ArcadeConfig, 'kind' | 'seed'>): PuzzleSession {
  switch (config.kind) {
    case 'memory': return memory(config.seed);
    case 'circuit': return circuit(config.seed);
    case 'rhythm': return rhythm();
    case 'sequence': return sequence(config.seed);
    case 'finale': return finale(config.seed);
    default: throw new Error(`Unsupported puzzle engine: ${config.kind}`);
  }
}
