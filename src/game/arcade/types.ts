import type { TrackId } from '../../data/models';

export type EngineKind = 'explore' | 'runner' | 'arena' | 'platform' | 'memory' | 'drive' | 'circuit' | 'rhythm' | 'chase' | 'boss' | 'maze' | 'sequence' | 'finale';
export interface ArcadeConfig {
  trackId: TrackId;
  kind: EngineKind;
  title: string;
  subtitle: string;
  objective: string;
  instructions: string;
  duration: number;
  seed: number;
}
export interface ArcadeInput {
  x: number;
  y: number;
  primary: boolean;
  secondary: boolean;
  pointer: { x: number; y: number } | null;
  click: boolean;
}
export interface ArcadeStatus {
  phase: 'playing' | 'won' | 'lost';
  progress: number;
  total: number;
  label: string;
  hint: string;
}
export interface ArcadeEngine {
  update(dt: number, input: ArcadeInput): void;
  draw(ctx: CanvasRenderingContext2D, time: number, reducedMotion: boolean): void;
  status(): ArcadeStatus;
  /** Optional DOM controls for board games; labels must expose the same visible information. */
  mountControls?(host: HTMLElement): () => void;
}
export type ArcadeFactory = (config: ArcadeConfig) => ArcadeEngine;
export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 540;
export const INK = '#090909';
export const PAPER = '#f2ece2';
export const RED = '#f51d36';
