import type { GameState, LevelConfig, LevelSymbol, Vec2 } from './model.ts';
import { hasLineOfSight, INTERACTION_RANGE } from './simulation.ts';

type SymbolKind = LevelSymbol['kind'];

/** Fiction authored for this game, not an interpretation of the song's meaning. */
export const MISSION_STEPS: Readonly<Record<SymbolKind, { title: string; description: string }>> = {
  eye: { title: 'Revele o sinal', description: 'Restaure o selo do olho para revelar a primeira parte do sinal.' },
  hand: { title: 'Recupere a força', description: 'Restaure o selo da mão para alimentar a transmissão.' },
  chain: { title: 'Rompa o bloqueio', description: 'Restaure o selo do elo para liberar a transmissão.' },
};

const SYMBOL_ORDER: readonly SymbolKind[] = ['eye', 'hand', 'chain'];

export interface MissionCheckpoint {
  id: string;
  kind: SymbolKind;
  title: string;
  description: string;
  restored: boolean;
}

export type MissionDirection = 'à frente' | 'à frente, à esquerda' | 'à esquerda' | 'atrás, à esquerda'
  | 'atrás' | 'atrás, à direita' | 'à direita' | 'à frente, à direita';

export interface MissionTarget {
  id: string;
  kind: 'symbol' | 'exit';
  symbolKind: SymbolKind | null;
  position: Vec2;
  title: string;
  description: string;
  /** Straight-line metres to the target, not a navigable route length. */
  distance: number;
  /** Relative yaw in radians: positive is left, matching simulation/Three conventions. */
  bearing: number;
  direction: MissionDirection;
  /** True only when an interaction is both near enough and unobstructed. */
  inRange: boolean;
  lineOfSight: boolean;
}

export interface MissionStatus {
  title: string;
  intro: string;
  phase: 'restore' | 'transmit' | 'won' | 'lost';
  completed: number;
  total: number;
  checkpoints: MissionCheckpoint[];
  objective: string;
  hint: string;
  target: MissionTarget | null;
}

function directionFor(bearing: number): MissionDirection {
  const directions: readonly MissionDirection[] = [
    'à frente', 'à frente, à esquerda', 'à esquerda', 'atrás, à esquerda',
    'atrás', 'atrás, à direita', 'à direita', 'à frente, à direita',
  ];
  return directions[(Math.round(bearing / (Math.PI / 4)) + 8) % 8];
}

/** Suggested order only: collecting any authored seal remains valid and can never softlock the mission. */
export function getMission(state: Readonly<GameState>, level: LevelConfig): MissionStatus {
  const symbols = [...level.symbols].sort((a, b) => SYMBOL_ORDER.indexOf(a.kind) - SYMBOL_ORDER.indexOf(b.kind));
  const restored = new Set(state.collected);
  const checkpoints = symbols.map((symbol) => ({ id: symbol.id, kind: symbol.kind, ...MISSION_STEPS[symbol.kind], restored: restored.has(symbol.id) }));
  const completed = checkpoints.filter((checkpoint) => checkpoint.restored).length;
  const base = {
    title: 'Liberte o sinal',
    intro: 'Três selos aprisionam o sinal. Restaure-os, atravesse a sentinela e ative a transmissão na saída.',
    completed, total: checkpoints.length, checkpoints,
  };
  if (state.phase === 'won') return { ...base, phase: 'won', objective: 'Sinal livre', hint: 'Transmissão ativada. Confira sua coleção.', target: null };
  if (state.phase === 'lost') return { ...base, phase: 'lost', objective: 'Sinal interrompido', hint: 'Tente outra rota. Selos restauram até 25 de integridade; pulsos certeiros interrompem a sentinela.', target: null };
  const next = symbols.find((symbol) => !restored.has(symbol.id));
  const position = next ? { x: next.x, z: next.z } : { ...level.exit };
  const dx = position.x - state.player.x;
  const dz = position.z - state.player.z;
  const distance = Math.hypot(dx, dz);
  const targetYaw = distance > 1e-8 ? Math.atan2(-dx, -dz) : state.player.yaw;
  const bearing = Math.atan2(Math.sin(targetYaw - state.player.yaw), Math.cos(targetYaw - state.player.yaw));
  const lineOfSight = hasLineOfSight(state.player, position, level.walls);
  const target: MissionTarget = {
    id: next?.id ?? `${level.id}:exit`,
    kind: next ? 'symbol' : 'exit',
    symbolKind: next?.kind ?? null,
    position,
    title: next ? MISSION_STEPS[next.kind].title : 'Ative a transmissão',
    description: next ? MISSION_STEPS[next.kind].description : 'Os selos estão restaurados. Interaja na saída para libertar o sinal.',
    distance, bearing, direction: directionFor(bearing), lineOfSight,
    inRange: distance <= INTERACTION_RANGE && lineOfSight,
  };
  const hint = target.inRange
    ? next ? 'Interaja para restaurar o selo e recuperar até 25 de integridade.' : 'Interaja para ativar a transmissão.'
    : lineOfSight ? `Objetivo ${target.direction}. Aproxime-se para interagir.` : `Sinal ${target.direction}. Contorne as paredes; a direção indica o alvo, não a rota.`;
  return { ...base, phase: next ? 'restore' : 'transmit', objective: target.title, hint, target };
}

export interface RunMedal { tier: 'gold' | 'silver' | 'bronze'; title: string; description: string }
export interface RunSummary {
  outcome: GameState['phase'];
  health: number;
  shots: number;
  elapsedSeconds: number;
  medal: RunMedal | null;
}

/** Session-only recognition from actual run metrics; no score, download, save or reward mutation. */
export function getRunSummary(state: Readonly<GameState>): RunSummary {
  const elapsedSeconds = Math.max(0, state.elapsed);
  const health = state.player.health;
  const shots = state.shots;
  let medal: RunMedal | null = null;
  if (state.phase === 'won') {
    if (health >= 75 && shots <= 6 && elapsedSeconds <= 180) {
      medal = { tier: 'gold', title: 'Sintonia plena', description: 'Transmissão em até 3 min, com 75 ou mais de integridade e até 6 disparos.' };
    } else if (health >= 40 && shots <= 12 && elapsedSeconds <= 300) {
      medal = { tier: 'silver', title: 'Pulso firme', description: 'Transmissão em até 5 min, com 40 ou mais de integridade e até 12 disparos.' };
    } else {
      medal = { tier: 'bronze', title: 'Sinal livre', description: 'Os três selos foram restaurados e a transmissão foi ativada.' };
    }
  }
  return { outcome: state.phase, health, shots, elapsedSeconds, medal };
}
