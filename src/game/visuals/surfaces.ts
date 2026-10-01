import * as THREE from 'three';

export interface IndustrialSurfaces {
  concrete: THREE.CanvasTexture;
  floor: THREE.CanvasTexture;
  contact: THREE.CanvasTexture;
  glow: THREE.CanvasTexture;
  cracks: THREE.CanvasTexture;
  hazard: THREE.CanvasTexture;
}

function seededRandom(initial: number) {
  let seed = initial;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

/** Periodic value noise keeps the mottling continuous across repeated tiles. */
function noiseLayer(cells: number, random: () => number) {
  const values = Float32Array.from({ length: cells * cells }, random);
  return (u: number, v: number) => {
    const x = u * cells, y = v * cells;
    const ix = Math.floor(x), iy = Math.floor(y);
    const dx = x - ix, dy = y - iy;
    const tx = dx * dx * (3 - 2 * dx), ty = dy * dy * (3 - 2 * dy);
    const at = (a: number, b: number) => values[(b % cells) * cells + a % cells]!;
    const top = at(ix, iy) * (1 - tx) + at(ix + 1, iy) * tx;
    const bottom = at(ix, iy + 1) * (1 - tx) + at(ix + 1, iy + 1) * tx;
    return top * (1 - ty) + bottom * ty;
  };
}

function mineralBase(ctx: CanvasRenderingContext2D, size: number, random: () => number, base: number) {
  const broad = noiseLayer(4, random), medium = noiseLayer(16, random), fine = noiseLayer(64, random);
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size, v = y / size;
    const value = base + (broad(u, v) - .5) * 30 + (medium(u, v) - .5) * 17
      + (fine(u, v) - .5) * 11 + (random() - .5) * 12;
    const index = (y * size + x) * 4;
    image.data[index] = image.data[index + 1] = image.data[index + 2] = value;
    image.data[index + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
}

function wrapped(ctx: CanvasRenderingContext2D, size: number, paint: () => void) {
  for (const x of [-size, 0, size]) for (const y of [-size, 0, size]) {
    ctx.save(); ctx.translate(x, y); paint(); ctx.restore();
  }
}

function stain(ctx: CanvasRenderingContext2D, size: number, random: () => number, strength: number) {
  const x = random() * size, y = random() * size, radius = 22 + random() * 60;
  wrapped(ctx, size, () => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(38,39,40,${strength})`);
    gradient.addColorStop(.45, `rgba(38,39,40,${strength * .4})`);
    gradient.addColorStop(1, 'rgba(38,39,40,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  });
}

function fissure(ctx: CanvasRenderingContext2D, random: () => number, x: number, y: number,
  length: number, opacity: number, tileSize?: number) {
  const points: [number, number][] = [[x, y]];
  for (let i = 0; i < 12; i++) {
    x += (random() - .5) * length * .15; y += length / 12;
    points.push([x, y]);
  }
  const draw = () => {
    ctx.lineWidth = .8; ctx.strokeStyle = `rgba(25,26,28,${opacity})`;
    ctx.beginPath(); ctx.moveTo(...points[0]!);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    ctx.stroke();
    const fork = points[6]!;
    ctx.lineWidth = .55; ctx.beginPath(); ctx.moveTo(...fork);
    ctx.lineTo(fork[0] + length * .16, fork[1] + length * .14);
    ctx.lineTo(fork[0] + length * .2, fork[1] + length * .33); ctx.stroke();
  };
  if (tileSize) wrapped(ctx, tileSize, draw); else draw();
}

/** Original procedural surfaces; independent seeds make every session reproducible. */
export function createIndustrialSurfaces(
  renderer: THREE.WebGLRenderer,
  track: <T extends THREE.Texture>(value: T) => T,
): IndustrialSurfaces {
  const anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  function surface(width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void, repeat = false) {
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não foi possível preparar as superfícies do jogo.');
    paint(ctx);
    const texture = track(new THREE.CanvasTexture(canvas));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = anisotropy;
    if (repeat) texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  const concrete = surface(512, 512, (ctx) => {
    const random = seededRandom(970231);
    mineralBase(ctx, 512, random, 181);
    for (let i = 0; i < 24; i++) stain(ctx, 512, random, .025 + random() * .055);
    // Sparse pores read as concrete at close range without a repeated panel border.
    for (let i = 0; i < 1900; i++) {
      ctx.fillStyle = `rgba(25,26,28,${.04 + random() * .12})`;
      ctx.fillRect(random() * 512, random() * 512, .6 + random() * 1.7, .5 + random() * 1.2);
    }
    fissure(ctx, random, 164, 31, 127, .19, 512);
    fissure(ctx, random, 468, 396, 93, .14, 512);
  }, true);

  const floor = surface(512, 512, (ctx) => {
    const random = seededRandom(461579);
    mineralBase(ctx, 512, random, 153);
    for (let i = 0; i < 18; i++) stain(ctx, 512, random, .025 + random() * .045);
    for (let i = 0; i < 3400; i++) {
      ctx.fillStyle = random() > .5 ? 'rgba(235,235,235,.08)' : 'rgba(30,30,32,.09)';
      ctx.fillRect(random() * 512, random() * 512, .7 + random() * 2.3, .6 + random());
    }
    // No tile borders: this map repeats 10 × 16 across the level floor.
    fissure(ctx, random, 221, 334, 84, .12, 512);
  }, true);

  const contact = surface(256, 256, (ctx) => {
    const gradient = ctx.createRadialGradient(128, 128, 7, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(0,0,0,.9)');
    gradient.addColorStop(.28, 'rgba(0,0,0,.58)');
    gradient.addColorStop(.65, 'rgba(0,0,0,.16)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 256);
  });
  const glow = surface(128, 128, (ctx) => {
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(.14, 'rgba(255,255,255,.69)');
    gradient.addColorStop(.5, 'rgba(255,255,255,.22)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
  });
  const cracks = surface(256, 256, (ctx) => {
    const random = seededRandom(260723);
    fissure(ctx, random, 111, 21, 129, .73);
    fissure(ctx, random, 132, 96, 125, .6);
  });
  const hazard = surface(256, 64, (ctx) => {
    const random = seededRandom(782411);
    ctx.fillStyle = '#d7a74d'; ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#202225';
    for (let x = -64; x < 256; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 32, 0);
      ctx.lineTo(x + 96, 64); ctx.lineTo(x + 64, 64); ctx.fill();
    }
    for (let i = 0; i < 680; i++) {
      ctx.fillStyle = random() > .5 ? 'rgba(166,166,164,.34)' : 'rgba(40,40,40,.19)';
      ctx.fillRect(random() * 256, random() * 64, .5 + random() * 4, .5 + random() * 1.5);
    }
  }, true);
  return { concrete, floor, contact, glow, cracks, hazard };
}
