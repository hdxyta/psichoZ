import { describe, expect, it } from 'vitest';
import { createPuzzleSession, RHYTHM_BEAT_COUNT, RHYTHM_INTERVAL, RHYTHM_START, toggleCircuit, type PuzzleSession } from '../../src/game/arcade/puzzle-model';
import { createPuzzleEngine } from '../../src/game/arcade/puzzles';

function recoverMemory(game: PuzzleSession) {
  // Learn only the symbols actually shown to the player in the initial preview.
  const preview = game.view().cells.map((cell) => cell.symbol);
  game.update(2.3);
  for (const symbol of new Set(preview)) {
    preview.forEach((candidate, index) => { if (candidate === symbol) game.choose(index); });
  }
}
function solveCircuit(game: PuzzleSession) {
  const initial = game.view().cells.map((cell) => cell.state === 'on');
  for (let mask = 0; mask < 512; mask += 1) {
    let cells = initial;
    for (let index = 0; index < 9; index += 1) if (mask & (1 << index)) cells = toggleCircuit(cells, index);
    if (cells.every(Boolean)) {
      for (let index = 0; index < 9; index += 1) if (mask & (1 << index)) game.choose(index);
      return;
    }
  }
  throw new Error('Circuit visible to the player has no solution');
}
function observeSequence(game: PuzzleSession): number[] {
  const pattern: number[] = [];
  let lastActive = -1;
  for (let frame = 0; frame < 2000 && !game.view().accepting; frame += 1) {
    game.update(0.025);
    const active = game.view().cells.findIndex((cell) => cell.state === 'active');
    if (active >= 0 && active !== lastActive) pattern.push(active);
    lastActive = active;
  }
  expect(game.view().accepting).toBe(true);
  return pattern;
}

describe('memory board', () => {
  it('requires six distinct real pairs and cannot win through repeated clicks or idle updates', () => {
    const game = createPuzzleSession({ kind: 'memory', seed: 6 });
    const snapshot = game.view().cells;
    game.choose(0);
    expect(game.status().progress).toBe(0);
    game.update(3);
    for (let i = 0; i < 30; i += 1) game.choose(0);
    game.update(120);
    expect(game.status()).toMatchObject({ phase: 'playing', progress: 0 });
    expect(game.view().cells.filter((cell) => cell.state === 'visible')).toHaveLength(1);
    for (const symbol of new Set(snapshot.map((cell) => cell.symbol))) {
      const pair = snapshot.flatMap((cell, i) => cell.symbol === symbol ? [i] : []);
      if (!pair.includes(0)) continue;
      pair.forEach((index) => game.choose(index));
    }
    expect(game.status().progress).toBe(1);
  });
  it('can be solved using only the visible preview, then stays won', () => {
    const game = createPuzzleSession({ kind: 'memory', seed: 94 });
    recoverMemory(game);
    expect(game.status()).toMatchObject({ phase: 'won', progress: 6, total: 6 });
    game.choose(0); game.update(500);
    expect(game.status().phase).toBe('won');
  });
  it('fails after fourteen mismatches and ignores input during the reveal cooldown', () => {
    const game = createPuzzleSession({ kind: 'memory', seed: 6 });
    const cells = game.view().cells;
    const different = cells.findIndex((cell) => cell.symbol !== cells[0].symbol);
    game.update(3);
    for (let i = 0; i < 14; i += 1) {
      game.choose(0); game.choose(different); game.choose(1);
      expect(game.status().progress).toBe(0);
      game.update(0.9);
    }
    expect(game.status().phase).toBe('lost');
  });
});

describe('circuit board', () => {
  it('generates solvable, unfinished circuits across seeds', () => {
    for (const seed of [0, 1, 8, 39, 1000, 4294967295]) {
      const game = createPuzzleSession({ kind: 'circuit', seed });
      expect(game.status().phase).toBe('playing');
      expect(game.status().progress).toBeLessThan(9);
      game.update(500);
      expect(game.status().phase).toBe('playing');
      solveCircuit(game);
      expect(game.status()).toMatchObject({ phase: 'won', progress: 9 });
    }
  });
  it('toggles only orthogonal neighbors and loses after its move budget', () => {
    expect(toggleCircuit(Array(9).fill(false), 0)).toEqual([true, true, false, true, false, false, false, false, false]);
    const game = createPuzzleSession({ kind: 'circuit', seed: 8 });
    const snapshot = game.view();
    game.choose(-1); game.choose(10); game.choose(1.5);
    expect(game.view()).toEqual(snapshot);
    for (let i = 0; i < 24; i += 1) game.choose(0);
    expect(game.status().phase).toBe('lost');
  });
});

describe('visual rhythm challenge', () => {
  it('requires a fresh press and cannot score by holding the primary action', () => {
    const game = createPuzzleEngine({ kind: 'rhythm', seed: 10, trackId: 'track-10', title: 'Rhythm', subtitle: '', objective: '', instructions: '', duration: 35 });
    const input = { x: 0, y: 0, primary: true, secondary: false, pointer: null, click: false };
    game.update(RHYTHM_START, input);
    expect(game.status().progress).toBe(1);
    game.update(RHYTHM_INTERVAL, input);
    expect(game.status().progress).toBe(1);
    game.update(0, { ...input, primary: false });
    game.update(0, input);
    expect(game.status().progress).toBe(2);
  });
  it('wins from twenty-four distinct on-beat inputs', () => {
    const game = createPuzzleSession({ kind: 'rhythm', seed: 10 });
    game.update(RHYTHM_START);
    for (let i = 0; i < RHYTHM_BEAT_COUNT; i += 1) {
      if (i) game.update(RHYTHM_INTERVAL);
      game.choose(0);
    }
    expect(game.status()).toMatchObject({ phase: 'won', progress: 24, total: 24 });
  });
  it('permits six missed beats but still requires eighteen hits and all beats resolved', () => {
    const game = createPuzzleSession({ kind: 'rhythm', seed: 10 });
    game.update(RHYTHM_START);
    for (let i = 0; i < 18; i += 1) {
      if (i) game.update(RHYTHM_INTERVAL);
      game.choose(0);
    }
    expect(game.status().phase).toBe('playing');
    game.update(5);
    expect(game.status()).toMatchObject({ phase: 'won', progress: 18 });
  });
  it('loses on idle and cannot score the same pulse repeatedly', () => {
    const idle = createPuzzleSession({ kind: 'rhythm', seed: 10 });
    idle.update(40); expect(idle.status().phase).toBe('lost');
    const spam = createPuzzleSession({ kind: 'rhythm', seed: 10 });
    spam.update(RHYTHM_START);
    for (let i = 0; i < 20; i += 1) spam.choose(0);
    expect(spam.status()).toMatchObject({ phase: 'lost', progress: 1 });
  });
});

describe('sequence challenge', () => {
  it('plays visible sequences and requires all four rounds', () => {
    const game = createPuzzleSession({ kind: 'sequence', seed: 14 });
    game.choose(0); expect(game.status().progress).toBe(0);
    for (let round = 0; round < 4; round += 1) {
      const pattern = observeSequence(game);
      expect(pattern).toHaveLength(round + 3);
      pattern.forEach((symbol) => game.choose(symbol));
      expect(game.status().progress).toBe(round + 1);
    }
    expect(game.status().phase).toBe('won');
  });
  it('replays after wrong input, loses at three errors, and never wins without input', () => {
    const game = createPuzzleSession({ kind: 'sequence', seed: 14 });
    for (let i = 0; i < 3; i += 1) {
      const pattern = observeSequence(game);
      game.choose((pattern[0] + 1) % 4);
    }
    expect(game.status().phase).toBe('lost');
    const idle = createPuzzleSession({ kind: 'sequence', seed: 14 });
    idle.update(1000);
    expect(idle.status()).toMatchObject({ phase: 'playing', progress: 0 });
  });
});

describe('finale challenge', () => {
  it('requires all three different trials in order, using actual visible board information', () => {
    const game = createPuzzleSession({ kind: 'finale', seed: 15 });
    expect(game.view().kind).toBe('memory');
    recoverMemory(game);
    expect(game.status()).toMatchObject({ phase: 'playing', progress: 1 });
    expect(game.view().kind).toBe('circuit');
    solveCircuit(game);
    expect(game.status()).toMatchObject({ phase: 'playing', progress: 2 });
    expect(game.view().kind).toBe('sequence');
    const pattern = observeSequence(game);
    expect(pattern).toHaveLength(4);
    pattern.forEach((symbol) => game.choose(symbol));
    expect(game.status()).toMatchObject({ phase: 'won', progress: 3, total: 3 });
  });
  it('does not advance from idle', () => {
    const game = createPuzzleSession({ kind: 'finale', seed: 15 });
    game.update(1000);
    expect(game.status()).toMatchObject({ phase: 'playing', progress: 0 });
  });
  it('propagates a failed trial without advancing or awarding victory', () => {
    const game = createPuzzleSession({ kind: 'finale', seed: 15 });
    const cells = game.view().cells;
    const different = cells.findIndex((cell) => cell.symbol !== cells[0].symbol);
    game.update(3);
    for (let i = 0; i < 8; i += 1) {
      game.choose(0); game.choose(different); game.update(0.9);
    }
    expect(game.status()).toMatchObject({ phase: 'lost', progress: 0 });
    expect(game.view().kind).toBe('memory');
  });
});
