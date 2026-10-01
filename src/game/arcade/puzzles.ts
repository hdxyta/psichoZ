import { INK, PAPER, RED, type ArcadeConfig, type ArcadeEngine } from './types';
import { createPuzzleSession, RHYTHM_BEAT_COUNT, RHYTHM_INTERVAL, RHYTHM_START, type PuzzleView } from './puzzle-model';
import './puzzles.css';

const names = ['Olho', 'Mão', 'Elo', 'Cruz', 'Dente', 'Estrela'];
const marks = [
  '<path d="M3 16Q16 2 29 16Q16 30 3 16Z"/><circle cx="16" cy="16" r="5"/>',
  '<path d="M10 27 5 16Q4 12 7 13L11 18 10 6Q10 3 13 5L14 14 15 3Q17 1 18 5L18 14 21 6Q24 4 24 8L22 17 26 13Q30 12 28 17L22 27Z"/>',
  '<ellipse cx="12" cy="12" rx="6" ry="10" transform="rotate(35 12 12)"/><ellipse cx="20" cy="21" rx="6" ry="10" transform="rotate(35 20 21)"/>',
  '<path d="M12 3H20V12H29V20H20V29H12V20H3V12H12Z"/>',
  '<path d="M5 5Q11 2 16 6Q22 2 27 5L24 16 19 29 16 18 12 29 7 17Z"/>',
  '<path d="M16 2 20 11 30 12 22 19 25 29 16 24 7 29 10 19 2 12 12 11Z"/>',
];
function svg(symbol: number | null): string {
  return `<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round">${symbol === null ? '<path d="M6 6 26 26M26 6 6 26M3 16H29M16 3V29"/>' : marks[symbol % marks.length]}</svg>`;
}
export function puzzleCellRects(view: PuzzleView) {
  const width = view.kind === 'memory' ? 140 : 152, height = view.kind === 'memory' ? 106 : 116, gap = 18;
  const rows = Math.ceil(view.cells.length / view.columns);
  const left = (960 - (view.columns * width + (view.columns - 1) * gap)) / 2;
  const top = 114 + (338 - (rows * height + (rows - 1) * gap)) / 2;
  return view.cells.map((_, i) => ({ x: left + i % view.columns * (width + gap), y: top + Math.floor(i / view.columns) * (height + gap), width, height }));
}
function mark(ctx: CanvasRenderingContext2D, symbol: number | null, x: number, y: number, size: number) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 32, size / 32); ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  ctx.beginPath();
  if (symbol === 0) {
    ctx.moveTo(-14, 0); ctx.quadraticCurveTo(0, -18, 14, 0); ctx.quadraticCurveTo(0, 18, -14, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2);
  } else if (symbol === 2) {
    ctx.rotate(-0.5); ctx.ellipse(0, -6, 5, 9, 0, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 7, 5, 9, 0, 0, Math.PI * 2);
  } else if (symbol === 1) {
    ctx.moveTo(-8, 14); ctx.lineTo(-14, -1); ctx.lineTo(-8, 2); ctx.lineTo(-8, -12); ctx.lineTo(-4, -12); ctx.lineTo(-2, 0); ctx.lineTo(-1, -15); ctx.lineTo(3, -15); ctx.lineTo(3, 0); ctx.lineTo(8, -10); ctx.lineTo(12, -8); ctx.lineTo(7, 5); ctx.lineTo(14, 0); ctx.lineTo(8, 14); ctx.closePath();
  } else if (symbol === 3) {
    ctx.rect(-4, -14, 8, 28); ctx.rect(-14, -4, 28, 8);
  } else if (symbol === 4) {
    ctx.moveTo(-12, -12); ctx.lineTo(0, -9); ctx.lineTo(12, -12); ctx.lineTo(9, 3); ctx.lineTo(4, 14); ctx.lineTo(0, 5); ctx.lineTo(-5, 14); ctx.closePath();
  } else if (symbol === 5) {
    for (let i = 0; i < 10; i += 1) { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 6 : 15; if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath();
  } else {
    ctx.moveTo(-12, -12); ctx.lineTo(12, 12); ctx.moveTo(12, -12); ctx.lineTo(-12, 12); ctx.moveTo(-15, 0); ctx.lineTo(15, 0);
  }
  ctx.stroke(); ctx.restore();
}

export function createPuzzleEngine(config: ArcadeConfig): ArcadeEngine {
  const session = createPuzzleSession(config);
  let primaryHeld = false, mounted = false, sync = () => {};
  function choose(index: number) { session.choose(index); sync(); }
  return {
    update(dt, input) {
      session.update(dt);
      const view = session.view();
      if (view.kind === 'rhythm') {
        if ((input.primary && !primaryHeld) || input.click) choose(0);
      } else if (!mounted && input.click && input.pointer) {
        const pointer = input.pointer;
        const index = puzzleCellRects(view).findIndex((rect) => pointer.x >= rect.x && pointer.x <= rect.x + rect.width && pointer.y >= rect.y && pointer.y <= rect.y + rect.height);
        if (index >= 0) choose(index);
      }
      primaryHeld = input.primary;
      sync();
    },
    status: () => session.status(),
    draw(ctx) {
      const view = session.view();
      ctx.fillStyle = PAPER; ctx.fillRect(0, 0, 960, 540);
      ctx.strokeStyle = '#d7cbbf'; ctx.lineWidth = 1;
      for (let x = -540; x < 960; x += 15) { ctx.beginPath(); ctx.moveTo(x, 540); ctx.lineTo(x + 540, 0); ctx.stroke(); }
      ctx.fillStyle = INK; ctx.fillRect(55, 32, 855, 476); ctx.fillStyle = RED; ctx.fillRect(48, 25, 855, 476);
      ctx.fillStyle = INK; ctx.fillRect(58, 35, 835, 456);
      ctx.fillStyle = PAPER; ctx.textAlign = 'center'; ctx.font = 'bold 28px monospace';
      if (!mounted || view.kind === 'rhythm') ctx.fillText(view.heading, 480, 80);
      if (view.kind === 'rhythm') {
        ctx.fillStyle = PAPER; ctx.fillRect(126, 267, 708, 6);
        ctx.fillStyle = RED; ctx.fillRect(438, 193, 84, 155); ctx.strokeStyle = PAPER; ctx.lineWidth = 4; ctx.strokeRect(438, 193, 84, 155);
        for (let i = 0; i < RHYTHM_BEAT_COUNT; i += 1) {
          const x = 480 + (RHYTHM_START + i * RHYTHM_INTERVAL - view.beat) * 210;
          if (x < 128 || x > 835) continue;
          ctx.fillStyle = PAPER; ctx.fillRect(x - 12, 254, 24, 32); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(x - 12, 254, 24, 32);
        }
        ctx.fillStyle = PAPER; ctx.font = 'bold 22px monospace'; ctx.fillText('TOQUE QUANDO O SELO CRUZAR A FAIXA', 480, 389);
        ctx.font = '16px monospace'; ctx.fillText('O centro vermelho marca a hora de agir.', 480, 424);
      } else if (!mounted) {
        const rects = puzzleCellRects(view);
        view.cells.forEach((cell, i) => {
          const r = rects[i], red = cell.state === 'on' || cell.state === 'active', light = cell.state === 'matched';
          ctx.fillStyle = RED; ctx.fillRect(r.x + 6, r.y + 6, r.width, r.height);
          ctx.fillStyle = red ? RED : light ? PAPER : '#161616'; ctx.fillRect(r.x, r.y, r.width, r.height);
          ctx.strokeStyle = PAPER; ctx.lineWidth = 2.5; ctx.strokeRect(r.x, r.y, r.width, r.height);
          ctx.strokeStyle = red || light ? INK : PAPER; mark(ctx, cell.symbol, r.x + r.width / 2, r.y + r.height / 2 - 4, 47);
          ctx.fillStyle = red || light ? INK : PAPER; ctx.font = 'bold 12px monospace'; ctx.fillText(`${i + 1} · ${cell.state === 'hidden' ? '?' : cell.state === 'off' ? 'INATIVO' : cell.symbol === null ? '—' : names[cell.symbol].toUpperCase()}`, r.x + r.width / 2, r.y + r.height - 13);
        });
      }
      if (!mounted || view.kind === 'rhythm') { ctx.fillStyle = PAPER; ctx.font = 'bold 15px monospace'; ctx.fillText(view.detail, 480, 478); }
    },
    mountControls(host) {
      mounted = true;
      const panel = document.createElement('section'); panel.className = 'puzzle-panel';
      const heading = document.createElement('h3'); heading.className = 'puzzle-heading';
      const detail = document.createElement('p'); detail.className = 'puzzle-detail';
      const board = document.createElement('div'); board.className = 'puzzle-controls'; board.setAttribute('role', 'group'); board.setAttribute('aria-label', 'Tabuleiro interativo'); panel.append(heading, board, detail); host.append(panel);
      let previous = '';
      sync = () => {
        const view = session.view(), key = JSON.stringify(view.cells) + view.kind + view.heading + view.detail;
        if (key === previous) return;
        previous = key; panel.dataset.kind = view.kind; heading.textContent = view.heading; detail.textContent = view.detail; heading.hidden = detail.hidden = view.kind === 'rhythm'; board.style.gridTemplateColumns = `repeat(${view.columns}, minmax(0, 1fr))`;
        if (board.children.length !== view.cells.length) board.replaceChildren(...view.cells.map((_, i) => {
          const button = document.createElement('button'); button.type = 'button'; button.dataset.puzzleIndex = String(i); button.addEventListener('click', () => choose(i)); return button;
        }));
        view.cells.forEach((cell, i) => {
          const button = board.children[i] as HTMLButtonElement, pulse = view.kind === 'rhythm';
          const name = pulse ? 'Marcar pulso' : cell.state === 'hidden' ? `Carta ${i + 1}, virada` : cell.state === 'off' ? `Selo ${i + 1}, inativo` : `${i + 1}, ${cell.symbol === null ? 'selo' : names[cell.symbol]}${cell.state === 'matched' ? ', par encontrado' : cell.state === 'on' ? ', ativo' : cell.state === 'active' ? ', sinal da sequência' : ''}`;
          button.className = pulse ? 'puzzle-pulse' : ''; button.dataset.state = cell.state; button.disabled = cell.disabled; button.setAttribute('aria-label', name);
          button.innerHTML = `${svg(cell.symbol)}<span>${pulse ? 'MARCAR PULSO' : `${i + 1}${cell.state === 'matched' ? ' ✓' : cell.state === 'on' ? ' ON' : cell.state === 'off' ? ' OFF' : ''}`}</span>`;
        });
      };
      sync();
      return () => { mounted = false; sync = () => {}; panel.remove(); };
    },
  };
}
