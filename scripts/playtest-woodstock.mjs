import { chromium, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// This playthrough uses only ordinary UI clicks, physical keyboard input and the
// visible pause map. It neither imports simulation code nor injects game/save state.
const baseURL = process.env.PLAYTEST_URL || 'http://127.0.0.1:4173';
const startedAt = new Date();
const runId = startedAt.toISOString().replace(/[:.]/gu, '-');
const folder = resolve('docs/screenshots/woodstock-playtest-2026-09-21', runId);
await mkdir(folder, { recursive: true });
const previousReport = await readFile(resolve('docs/playtest-woodstock.md'), 'utf8').catch(() => '');
if (previousReport) {
  const baselineFolder = resolve('docs/baselines/woodstock-playtest', runId);
  await mkdir(baselineFolder, { recursive: true });
  await writeFile(resolve(baselineFolder, 'playtest-woodstock.md'), previousReport, { flag: 'wx' });
}
const records = [];
const screenshots = [];
const errors = [];
const started = performance.now();
let heldInputMs = 0;
let activeMs = 0;
let activeStarted = null;
let status = 'Não concluído';
let failure = null;
const combatResult = 'Rota oeste para evitar a sentinela; nenhum disparo nesta execução.';
let persisted = false;
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(error.message));
const game = page.locator('.woodstock-game');

async function screen() { return game.getAttribute('data-screen'); }

async function assertPlaying() {
  const current = await screen();
  if (current !== 'playing') throw new Error(`A partida deixou de estar jogável: ${current}. ${await page.locator('[data-menu-description]').textContent()}`);
}

async function hold(keys, milliseconds) {
  const duration = Math.max(35, Math.min(1300, milliseconds));
  await assertPlaying();
  const start = performance.now();
  for (const key of keys) await page.keyboard.down(key);
  try { await page.waitForTimeout(duration); }
  finally { for (const key of keys) await page.keyboard.up(key); }
  heldInputMs += performance.now() - start;
  await assertPlaying();
}

async function resume() {
  const current = await screen();
  if (current === 'playing') return;
  if (current !== 'paused' && current !== 'ready') throw new Error(`Não foi possível retomar: ${current}`);
  const controls = page.locator('details[data-controls]');
  if (!(await controls.evaluate((element) => element.open))) await controls.locator('summary').click();
  await controls.getByRole('button', { name: 'Jogar só com teclado', exact: true }).click();
  await expect(game).toHaveAttribute('data-screen', 'playing');
  activeStarted = performance.now();
}

async function pauseMap() {
  await assertPlaying();
  await page.keyboard.press('p');
  await expect(game).toHaveAttribute('data-screen', 'paused');
  if (activeStarted !== null) activeMs += performance.now() - activeStarted;
  activeStarted = null;
  const details = page.locator('.game-map-details');
  if (!(await details.evaluate((element) => element.open))) await details.getByText('Mapa do labirinto', { exact: true }).click();
  await expect(page.locator('[data-map-player]')).toBeVisible();
  const transform = await page.locator('[data-map-player]').getAttribute('transform');
  const match = /translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.e+]+)\)/u.exec(transform || '');
  if (!match) throw new Error(`Transformação do mapa não legível: ${transform}`);
  return {
    x: Number(match[1]), z: Number(match[2]), yaw: -Number(match[3]) * Math.PI / 180,
    health: Number(await page.locator('[data-health]').textContent()),
    symbols: (await page.locator('[data-symbol-count]').textContent()).trim(),
  };
}

async function capture(name) {
  const path = resolve(folder, `${name}.png`);
  await page.screenshot({ path, animations: 'disabled', scale: 'css' });
  screenshots.push({ name, path: `screenshots/woodstock-playtest-2026-09-21/${runId}/${name}.png` });
}

async function navigateTo(target, label) {
  let position = await pauseMap();
  for (let attempt = 0; attempt < 28; attempt += 1) {
    const dx = target.x - position.x;
    const dz = target.z - position.z;
    if (Math.hypot(dx, dz) <= 0.24) {
      const record = { label, ...position, wallSeconds: (performance.now() - started) / 1000 };
      records.push(record);
      console.log(JSON.stringify(record));
      await resume();
      return;
    }
    // Keep the view north during navigation and use the ordinary strafe controls.
    // Projection uses only the direction shown in the user-visible pause map.
    const forward = -Math.sin(position.yaw) * dx - Math.cos(position.yaw) * dz;
    const strafe = Math.cos(position.yaw) * dx - Math.sin(position.yaw) * dz;
    const longitudinal = Math.abs(forward) >= Math.abs(strafe);
    const amount = longitudinal ? forward : strafe;
    const key = longitudinal ? (amount > 0 ? 'w' : 's') : (amount > 0 ? 'd' : 'a');
    const duration = Math.min(1100, Math.max(45, (Math.abs(amount) - 0.07) / 3.6 * 1000));
    await resume();
    await hold([key], duration);
    const next = await pauseMap();
    if (Math.hypot(next.x - position.x, next.z - position.z) < 0.025 && Math.abs(amount) > 0.4) {
      throw new Error(`Movimento bloqueado no caminho para ${label}: (${position.x}, ${position.z}), tecla ${key}.`);
    }
    position = next;
  }
  throw new Error(`Não alcançou ${label} dentro do limite de correções; posição ${position.x},${position.z}.`);
}

async function collect(number) {
  await expect(page.locator('[data-prompt]')).toContainText(/restaurar|recolher símbolo/u);
  await page.keyboard.press('e');
  await expect(page.locator('[data-symbol-count]')).toHaveText(`${number} / 3`);
  console.log(`Símbolo ${number}/3 recolhido por E.`);
  if (number === 3) await capture('three-symbols');
}

try {
  await page.goto(`${baseURL}/#/jogar/track-01`);
  await expect(game).toHaveAttribute('data-screen', 'ready', { timeout: 20000 });
  await resume();
  await page.waitForTimeout(180);
  await capture('start');
  for (const [x, z, label] of [[0, 10, 'Saída do corredor'], [-4, 10, 'Entrada oeste'], [-4, 5.5, 'Contorno da parede oeste'], [-9, 4, 'Símbolo olho']]) await navigateTo({ x, z }, label);
  await collect(1);
  for (const [x, z, label] of [[-4, 5.5, 'Retorno oeste'], [-4, 10, 'Abertura sul'], [4, 10, 'Entrada leste'], [4, -3, 'Corredor leste'], [9, -3, 'Símbolo mão']]) await navigateTo({ x, z }, label);
  await collect(2);
  for (const [x, z, label] of [[4, -3, 'Retorno leste'], [4, 10, 'Retorno sul leste'], [-4, 10, 'Retorno sul oeste'], [-4, 5.5, 'Passagem oeste'], [-13, 5.5, 'Rota afastada da sentinela'], [-13, -7, 'Contorno da grade oeste'], [-8, -15, 'Símbolo corrente']]) await navigateTo({ x, z }, label);
  await collect(3);
  for (const [x, z, label] of [[-4, -15, 'Retorno da corrente'], [-4, -21, 'Contorno da grade final'], [0, -21, 'Saída']]) await navigateTo({ x, z }, label);
  await expect(page.locator('[data-prompt]')).toContainText(/libertar o sinal|ativar saída/u);
  await page.keyboard.press('e');
  await expect(game).toHaveAttribute('data-screen', 'won');
  if (activeStarted !== null) activeMs += performance.now() - activeStarted;
  activeStarted = null;
  await expect(page.locator('.game-reward')).toContainText('Woodstock conquistada');
  await capture('victory');
  await page.getByRole('button', { name: 'Ver minha coleção', exact: true }).click();
  await expect(page).toHaveURL(/#colecao$/u);
  await expect(page.locator('#collection-count')).toHaveText('1 de 15 faixas conquistadas no jogo');
  await expect(page.locator('[data-reward-id="track-01-mp3"]')).toContainText('Conquistado no jogo');
  await expect(page.locator('[data-reward-id="track-01-mp3"]')).toContainText('Em breve');
  await capture('collection');
  await page.reload();
  await expect(page.locator('#collection-count')).toHaveText('1 de 15 faixas conquistadas no jogo');
  await expect(page.locator('[data-reward-id="track-01-mp3"]')).toContainText('Conquistado no jogo');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('psicoz:progress') || '{}'));
  if (saved.nfcUnlocked !== false || !saved.unlockedTrackIds?.includes('track-01') || !saved.completedLevelIds?.includes('level-01')) throw new Error('A conquista recarregada não corresponde à fase concluída sem NFC.');
  persisted = true;
  await capture('collection-reload');
  expect(errors).toEqual([]);
  status = 'Concluído';
  console.log(`PLAYTEST PASS: vitória real, coleção e reload; ${((performance.now() - started) / 1000).toFixed(1)}s de execução.`);
} catch (error) {
  failure = error instanceof Error ? error.message : String(error);
  status = 'Falhou';
  console.error(failure);
  try { await capture('failure'); } catch { /* Retain the original failure if capture is unavailable. */ }
  process.exitCode = 1;
} finally {
  if (activeStarted !== null) activeMs += performance.now() - activeStarted;
  const endedAt = new Date();
  const wallSeconds = (performance.now() - started) / 1000;
  const report = `# Playtest real — Woodstock\n\n` +
    `- Resultado: **${status}**.\n- Início: ${startedAt.toISOString()}. Fim: ${endedAt.toISOString()}.\n` +
    `- Ambiente: Chrome ${browser.version()}, contexto isolado, headless, viewport 1280 × 800, redução de movimento, áudio desativado.\n` +
    `- Comando: \`node scripts/playtest-woodstock.mjs\`. URL: ${baseURL}/#/jogar/track-01.\n` +
    `- Duração real do script: ${wallSeconds.toFixed(1)} s; períodos entre retomar e pausar: ${(activeMs / 1000).toFixed(1)} s; teclas mantidas: ${(heldInputMs / 1000).toFixed(1)} s. Estas medições não são duração típica de exploração humana nem medição de FPS.\n` +
    `- Controles reais nesta execução: “Controles e ajustes” → “Jogar só com teclado”, W/A/S/D, P e E. O mapa visível na pausa informa posição/direção para corrigir a navegação.\n` +
    `- Nenhuma posição, vitória ou conquista foi injetada. O armazenamento foi apenas lido ao final, após a vitória pela saída.\n` +
    `- Combate: ${combatResult}\n- Coleção e persistência após reload: ${persisted ? 'confirmadas, track-01/level-01; NFC falso' : 'não confirmadas'}.\n` +
    `- Erros JavaScript: ${errors.length ? errors.join('; ') : 'nenhum capturado'}.\n` +
    (failure ? `\n## Falha observada\n\n${failure}\n` : '') +
    `\n## Percurso observado\n\n| Marco | X | Z | Integridade | Símbolos | Tempo real acumulado |\n|---|---:|---:|---:|---|---:|\n` +
    records.map((record) => `| ${record.label} | ${record.x.toFixed(2)} | ${record.z.toFixed(2)} | ${record.health} | ${record.symbols} | ${record.wallSeconds.toFixed(1)} s |`).join('\n') +
    `\n\n## Capturas\n\n` + screenshots.map((shot) => `- [${shot.name}](${shot.path})`).join('\n') +
    `\n\n## Limites\n\nPercurso automatizado com mapa e rota previamente conhecida. Não substitui avaliação de dificuldade por uma pessoa, pointer lock, áudio, toque em aparelho físico ou medição de 2–4 minutos para primeira exploração.\n`;
  const history = previousReport ? '\n---\n\n# Registro anterior, preservado\n\n' + previousReport : '';
  await writeFile(resolve('docs/playtest-woodstock.md'), report + history, 'utf8');
  await browser.close();
}
