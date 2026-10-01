const SVG_NS = 'http://www.w3.org/2000/svg';
const RIDGES = 42;
const SAMPLES = 105;
let instanceNumber = 0;

type SpectrumMode = 'relief' | 'lines';
type SpectrumPalette = 'psicoz' | 'spectrum';

const palettes: Record<SpectrumPalette, ReadonlyArray<readonly [number, string]>> = {
  psicoz: [[0, '#ffe0aa'], [0.2, '#fbbda7'], [0.43, '#ed6679'], [0.65, '#c93253'], [1, '#511f3d']],
  spectrum: [[0, '#ff766b'], [0.24, '#fbd878'], [0.45, '#5ac7bb'], [0.7, '#536fd1'], [1, '#752f85']],
};

function gaussian(value: number, center: number, width: number): number {
  return Math.exp(-(((value - center) / width) ** 2));
}

// Coherent, seeded relief detail: neighboring slices belong to the same terrain.
// It is an abstract drawing, never inferred from music or a microphone.
function grain(x: number, y: number): number {
  const hash = (a: number, b: number) => {
    const value = Math.sin(a * 127.1 + b * 311.7 + 41.9) * 43758.5453;
    return value - Math.floor(value);
  };
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const smooth = (value: number) => value * value * (3 - 2 * value);
  const tx = smooth(x - ix);
  const ty = smooth(y - iy);
  const far = hash(ix, iy) * (1 - tx) + hash(ix + 1, iy) * tx;
  const near = hash(ix, iy + 1) * (1 - tx) + hash(ix + 1, iy + 1) * tx;
  return far * (1 - ty) + near * ty;
}

function terrain(u: number, depth: number): number {
  const spine = 194 * gaussian(u, 0.3 + depth * 0.17, 0.085) * gaussian(depth, 0.39, 0.43);
  const shoulder = 144 * gaussian(u, 0.57 + depth * 0.09, 0.064) * gaussian(depth, 0.53, 0.34);
  const outcrop = 79 * gaussian(u, 0.77 - depth * 0.06, 0.07) * gaussian(depth, 0.47, 0.42);
  const foothills = 22 * gaussian(u, 0.48, 0.3) * gaussian(depth, 0.58, 0.53);
  const texture = 0.76 + 0.35 * grain(u * 24, depth * 11) + 0.12 * grain(u * 58, depth * 19);
  return (spine + shoulder + outcrop + foothills) * texture * Math.sin(Math.PI * u) ** 0.35;
}

/** Mount an intentionally silent, static SVG study. The returned function releases its DOM/listeners. */
export function mountSpectrum(root: HTMLElement): () => void {
  const svg = root.querySelector<SVGSVGElement>('#spectrum-art');
  const layer = svg?.querySelector<SVGGElement>('[data-spectrum-lines]');
  if (!svg || !layer) return () => {};

  const controls = new AbortController();
  const modeButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-spectrum-mode]')];
  const paletteButton = root.querySelector<HTMLButtonElement>('[data-spectrum-palette]');
  const perspective = root.querySelector<HTMLInputElement>('[data-spectrum-perspective]');
  let mode: SpectrumMode = root.dataset.mode === 'lines' ? 'lines' : 'relief';
  let palette: SpectrumPalette = root.dataset.palette === 'spectrum' ? 'spectrum' : 'psicoz';

  const definitions = document.createElementNS(SVG_NS, 'defs');
  const gradient = document.createElementNS(SVG_NS, 'linearGradient');
  const gradientId = `psicoz-spectrum-${++instanceNumber}`;
  gradient.id = gradientId;
  gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
  gradient.setAttribute('x1', '0');
  gradient.setAttribute('x2', '0');
  gradient.setAttribute('y1', '26');
  gradient.setAttribute('y2', '346');
  definitions.append(gradient);
  svg.prepend(definitions);

  const paths = Array.from({ length: RIDGES }, (_, index) => {
    const path = document.createElementNS(SVG_NS, 'path');
    path.classList.add('spectrum-ridge');
    path.style.stroke = `url(#${gradientId})`;
    path.setAttribute('stroke-width', String(0.85 + index / (RIDGES - 1) * 0.45));
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    layer.append(path);
    return path;
  });

  function drawGeometry(): void {
    const input = perspective ? Number(perspective.value) : 0;
    const degrees = Math.min(20, Math.max(-20, Number.isFinite(input) ? input : 0));
    const angle = degrees / 20;
    perspective?.setAttribute('aria-valuetext', `${degrees} graus`);
    for (let row = 0; row < RIDGES; row += 1) {
      const depth = row / (RIDGES - 1);
      const points: string[] = [];
      for (let sample = 0; sample < SAMPLES; sample += 1) {
        const u = sample / (SAMPLES - 1);
        const x = 91 + u * (643 - angle * 35) + depth * (172 + angle * 45) - angle * 10;
        const floor = 173 + depth * 143 + u * 18 + angle * (u - 0.5) * 28;
        // Scale the complete relief into the viewBox; never flatten a peak by clipping it.
        const height = terrain(u, depth) * 0.75 * (1 + angle * 0.06);
        const y = floor - height;
        points.push(`${sample ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`);
      }
      // SVG fills the open silhouette implicitly but does not stroke its closing floor edge.
      paths[row].setAttribute('d', points.join(' '));
    }
  }

  function paint(): void {
    root.dataset.mode = mode;
    root.dataset.palette = palette;
    for (const button of modeButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.spectrumMode === mode));
    }
    paletteButton?.setAttribute('aria-pressed', String(palette === 'spectrum'));
    gradient.replaceChildren(...palettes[palette].map(([offset, color]) => {
      const stop = document.createElementNS(SVG_NS, 'stop');
      stop.setAttribute('offset', String(offset));
      stop.setAttribute('stop-color', color);
      return stop;
    }));
    for (let row = 0; row < RIDGES; row += 1) {
      const depth = row / (RIDGES - 1);
      paths[row].style.fill = mode === 'lines' ? 'none' : `rgb(${13 + Math.round(depth * 3)} 9 ${15 + Math.round(depth * 3)})`;
      paths[row].style.strokeOpacity = String(mode === 'lines' ? 0.43 + depth * 0.5 : 0.56 + depth * 0.44);
    }
  }

  for (const button of modeButtons) {
    button.addEventListener('click', () => {
      const next = button.dataset.spectrumMode;
      if (next === 'relief' || next === 'lines') { mode = next; paint(); }
    }, { signal: controls.signal });
  }
  paletteButton?.addEventListener('click', () => {
    palette = palette === 'psicoz' ? 'spectrum' : 'psicoz';
    paint();
  }, { signal: controls.signal });
  perspective?.addEventListener('input', drawGeometry, { signal: controls.signal });

  drawGeometry();
  paint();

  return () => {
    controls.abort();
    for (const path of paths) path.remove();
    definitions.remove();
  };
}
