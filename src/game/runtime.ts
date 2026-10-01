import './styles.css';
import { WOODSTOCK_LEVEL as level } from './level';
import { createGameState, stepGame, INTERACTION_RANGE, hasLineOfSight, getEnemyAwareness } from './simulation';
import { getMission, getRunSummary, MISSION_STEPS } from './mission';
import { createNavigator } from './navigation';
import { createWorld } from './renderer';
import { createInput, type ControlMode } from './input';
import { createGameAudio } from './audio';
import type { GameEvent, LevelSymbol } from './model';

const sealNames = { eye: 'Olho', hand: 'Mão', chain: 'Elo' };
function sealIcon(kind: LevelSymbol['kind']) {
  const paths = {
    eye: '<path d="M2 12Q12 1 22 12Q12 23 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    hand: '<path d="M7 12V6a1 1 0 0 1 2 0v5-7a1 1 0 0 1 2 0v7-8a1 1 0 0 1 2 0v8-6a1 1 0 0 1 2 0v9l2-3a1.4 1.4 0 0 1 2 2l-4 7H9l-5-7a1.5 1.5 0 0 1 2-2Z"/>',
    chain: '<path d="m9 15 6-6m-6 2-2 2a4 4 0 0 0 6 6l3-3a4 4 0 0 0-1-6M9 14a4 4 0 0 1-1-6l3-3a4 4 0 0 1 6 6l-2 2"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[kind]}</svg>`;
}

interface GameOptions {
  onExit(collection?: boolean): void;
  onWin(collectibles: string[]): string;
  reducedMotion(): boolean;
  setReducedMotion(value: boolean): void;
}
type Screen = 'ready' | 'playing' | 'paused' | 'won' | 'lost' | 'error';

export function mountGame(host: HTMLElement, options: GameOptions) {
  host.innerHTML = `
    <div class="woodstock-game" data-screen="ready">
      <div class="game-world" aria-label="Labirinto de concreto, grades e correntes"></div>
      <div class="game-vignette" aria-hidden="true"></div>
      <div class="game-hud">
        <div class="game-objective"><span class="game-eyebrow">Woodstock / liberte o sinal</span><strong data-objective>Revele o sinal</strong><div class="game-seal-progress" aria-label="Selos restaurados">${level.symbols.map((symbol) => `<span data-seal-id="${symbol.id}" aria-label="${sealNames[symbol.kind]}: bloqueado">${sealIcon(symbol.kind)}</span>`).join('')}<span class="symbol-count" data-symbol-count>0 / 3</span></div><span class="game-navigation" data-navigation>Rastreie o primeiro selo.</span></div>
        <div class="game-vitals"><span>Integridade <b data-health>100</b></span><meter min="0" max="100" value="100" aria-label="Integridade"></meter><button type="button" class="game-pause" aria-label="Pausar partida">Ⅱ</button></div>
      </div>
      <div class="game-crosshair" aria-hidden="true"><i></i><i></i></div>
      <p class="game-prompt" data-prompt></p>
      <p class="game-notice" role="status" data-notice></p>
      <p class="game-threat" data-threat data-awareness="patrolling" hidden></p>
      <div class="game-transmission" hidden aria-live="polite"><span>03 / 03 SELOS RESTAURADOS</span><strong>Sinal livre.</strong><p>Transmissão ativada.</p></div>
      <div class="game-touch">
        <div class="game-look-zone" data-look-zone aria-label="Arraste para olhar"></div>
        <div class="game-move-zone" data-move-zone aria-label="Arraste para mover"><div class="game-joystick" data-joystick aria-label="Direcional de movimento"><span></span></div></div>
        <div class="game-touch-actions"><button type="button" data-interact aria-label="Interagir">E<span>Interagir</span></button><button type="button" data-fire aria-label="Disparar pulso">⊕<span>Disparar</span></button></div>
      </div>
      <div class="game-toolbar"><span data-control-hint></span><div class="game-toolbar-actions"><button type="button" class="game-scan" data-scan aria-label="Rastrear sinal"><span aria-hidden="true">⌁</span><span data-scan-label>Rastrear</span><kbd>Q</kbd></button><button type="button" data-fullscreen aria-label="Tela cheia">⛶</button></div></div>
      <div class="game-overlay">
        <section class="game-menu" aria-labelledby="woodstock-heading">
          <div class="game-menu-top"><span class="wordmark" translate="no">psicoZ</span><span class="game-eyebrow">01 / Frequência aprisionada</span></div>
          <p class="game-eyebrow" data-menu-kicker>O concreto guarda um sinal. Você pode libertá-lo.</p>
          <h2 id="woodstock-heading">Woodstock</h2>
          <strong class="game-mission-title" data-mission-title>Liberte o sinal.</strong>
          <p data-menu-description>Três selos mantêm a transmissão presa neste labirinto. Restaure os altares, enfrente ou drible a sentinela e leve o sinal até a torre.</p>
          <ol class="game-mission-steps" data-mission-steps>${level.symbols.map((symbol, index) => `<li>${sealIcon(symbol.kind)}<span><small>0${index + 1} / ${sealNames[symbol.kind]}</small>${MISSION_STEPS[symbol.kind].title}</span></li>`).join('')}</ol>
          <p class="game-mission-payoff" data-mission-payoff>Cada selo recupera até 25 de integridade. Liberte a transmissão para conquistar o mini CD digital de Woodstock.</p>
          <div class="game-reward" hidden><div class="reward-disc" aria-label="Mini CD virtual de Woodstock"><span translate="no">psicoZ</span></div><div><strong>Woodstock conquistada</strong><p data-run-medal></p><p data-run-stats></p><p data-save-message></p><p class="game-reward-pending">Mini CD virtual na coleção. O MP3 será disponibilizado quando for publicado.</p></div></div>
          <p class="game-error" role="status" data-error hidden></p>
          <div class="game-control-picker" role="group" aria-label="Como você vai jogar"><button type="button" data-control-mode="mouse" aria-pressed="true">Mouse + teclado</button><button type="button" data-control-mode="touch" aria-pressed="false">Controles de toque</button></div>
          <p class="game-control-guide" data-control-guide></p>
          <p class="game-display-note" data-display-note role="status"></p>
          <div class="game-mouse-fallback" hidden><p role="status">Este navegador não liberou a captura do mouse. Tente entrar novamente ou use o modo abaixo: segure o botão direito para olhar e clique com o esquerdo para disparar.</p><button type="button" class="button secondary" data-drag>Jogar com mouse livre</button></div>
          <div class="game-menu-actions"><button type="button" class="button primary" data-start>Entrar no labirinto <span aria-hidden="true">↗</span></button><button type="button" class="button primary" data-collection hidden>Ver minha coleção</button><button type="button" class="button secondary" data-restart hidden>Recomeçar fase</button><button type="button" class="text-link" data-exit>Voltar à home</button></div>
          <div class="game-settings">
            <label class="game-sound"><input type="checkbox" data-sound /> Ativar áudio de teste</label><p class="game-demo-note">Som demonstrativo original. Não é a música Woodstock.</p>
            <details data-controls><summary>Controles e ajustes</summary><p>WASD: mover · mouse: olhar · clique ou Espaço: disparar · E: interagir · Q: rastrear · F: tela cheia · Esc/P: pausar.</p><p>O rastreador revela um caminho pelo chão durante seis segundos. Recarrega em oito segundos. A trilha contorna as paredes; cada selo revela o caminho seguinte.</p><p>Sem mouse: setas ↑↓ movem, ←→ giram e PageUp/PageDown ajustam a mira.</p><p>No toque: arraste à esquerda para mover e à direita para olhar. Segure e arraste Disparar para mirar enquanto atira. Paisagem oferece mais espaço; retrato também funciona.</p><button type="button" class="button secondary" data-keyboard>Jogar só com teclado</button><button type="button" class="button secondary" data-fullscreen-menu>Tela cheia</button><label>Sensibilidade <input type="range" min="0.4" max="2" step="0.1" value="1" data-sensitivity /></label><label>Música de teste <input type="range" min="0" max="1" step="0.05" value="0.3" data-music-volume /></label><label>Efeitos <input type="range" min="0" max="1" step="0.05" value="0.3" data-effects-volume /></label><label><input type="checkbox" data-game-motion /> Reduzir movimento</label></details>
            <details class="game-map-details"><summary>Mapa do labirinto</summary><svg class="game-map" viewBox="-17 -26 34 52" role="img" aria-label="Mapa: você em branco, símbolos em dourado e saída em vermelho"><g data-map-walls></g><g data-map-symbols></g><rect x="-1" y="-22" width="2" height="2" fill="#ef5362"/><path data-map-player d="M0,-.8 L.55,.5 L-.55,.5 Z" fill="#fff"/></svg><p>Você em branco · símbolos em dourado · saída em vermelho. As grades também bloqueiam passagem e disparos.</p></details>
          </div>
        </section>
      </div>
    </div>`;
  const root = host.querySelector<HTMLElement>('.woodstock-game')!;
  const $ = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const abort = new AbortController();
  let screen: Screen = 'ready';
  let state = createGameState(level);
  let frame = 0;
  let lastTime = 0;
  let uiTime = 0;
  let disposed = false;
  let startRequest = 0;
  let starting = false;
  let hitRemaining = 0;
  let rewarded = false;
  let noticeRemaining = 0;
  let scanRemaining = 6;
  let scanCooldown = 0;
  let routeRefresh = 0;
  let victoryRemaining = 0;
  const navigator = createNavigator(level);
  const sound = $<HTMLInputElement>('[data-sound]');
  const sensitivity = $<HTMLInputElement>('[data-sensitivity]');
  const motion = $<HTMLInputElement>('[data-game-motion]'); motion.checked = options.reducedMotion();
  const menu = $('.game-menu');
  const worldHost = $('.game-world');
  function notice(message: string) { $('[data-notice]').textContent = message; noticeRemaining = 5; }
  const audio = createGameAudio(notice);
  let world: ReturnType<typeof createWorld> | null = null;
  let input: ReturnType<typeof createInput> | null = null;
  function updateControls() {
    const touch = !!input?.touch;
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-control-mode]')) button.setAttribute('aria-pressed', String((button.dataset.controlMode === 'touch') === touch));
    $('[data-control-guide]').textContent = touch ? 'Dois polegares: mova à esquerda e mire à direita. Segure e arraste Disparar para mirar e atirar juntos.' : input?.mode === 'drag' ? 'Mouse livre: segure o botão direito para mirar e clique com o esquerdo para disparar. WASD move. E recolhe. P pausa.' : input?.mode === 'keyboard' ? 'Setas para mover e girar. PageUp/PageDown ajustam a mira. Espaço dispara. E recolhe. P pausa.' : 'WASD para mover. Mouse para mirar. Clique para disparar. E para recolher. Esc libera o cursor e pausa.';
    $('[data-control-hint]').textContent = touch ? 'Arraste para mirar' : input?.mode === 'drag' ? 'Botão direito: mirar · esquerdo: pulso · E: selo · Q: rastrear · P: pausa' : input?.mode === 'keyboard' ? 'Setas: mover / girar · Espaço: pulso · E: selo · Q: rastrear · P: pausa' : 'WASD: mover · mouse: mirar · clique: pulso · E: selo · Q: rastrear · Esc: pausa';
    $('[data-start]').textContent = starting ? 'Ativando mouse…' : screen === 'paused' ? 'Retomar partida' : 'Entrar no labirinto ↗';
    $<HTMLButtonElement>('[data-start]').disabled = starting;
  }
  function showScreen(next: Screen) {
    screen = next; root.dataset.screen = next;
    const playing = next === 'playing';
    $('.game-overlay').hidden = playing;
    $('.game-hud').hidden = !playing;
    $('.game-crosshair').hidden = !playing;
    $('.game-touch').hidden = !playing;
    $('.game-toolbar').hidden = !playing;
    $('[data-prompt]').hidden = !playing;
    $('.game-transmission').hidden = !playing || victoryRemaining <= 0;
    if (!playing) $('[data-threat]').hidden = true;
    input?.setActive(playing);
    if (!playing) { input?.unlock(); audio.pause(); cancelAnimationFrame(frame); frame = 0; }
    const ready = next === 'ready'; const paused = next === 'paused';
    const won = next === 'won'; const lost = next === 'lost'; const error = next === 'error';
    $('[data-menu-kicker]').textContent = won ? 'A frequência encontrou uma saída.' : lost ? 'A sentinela interrompeu o sinal.' : paused ? 'Seu sinal continua aqui.' : error ? 'A fase está indisponível neste navegador.' : 'O concreto guarda um sinal. Você pode libertá-lo.';
    $('#woodstock-heading').textContent = won ? 'Sinal livre.' : lost ? 'O silêncio venceu.' : paused ? 'Em pausa.' : 'Woodstock';
    $('[data-menu-description]').textContent = won ? 'Os três selos estão restaurados. A torre transmite novamente — e Woodstock agora faz parte da sua coleção.' : lost ? 'Tente outra rota. Um pulso certeiro interrompe a sentinela; restaurar um selo recupera até 25 de integridade.' : paused ? `${getMission(state, level).objective}. A partida e o áudio estão pausados.` : error ? 'Volte à home ou tente abrir a fase novamente. Sua coleção permanece disponível.' : 'Três selos mantêm a transmissão presa neste labirinto. Restaure os altares, enfrente ou drible a sentinela e leve o sinal até a torre.';
    $('[data-mission-title]').hidden = !ready;
    $('[data-mission-steps]').hidden = !ready;
    $('[data-mission-payoff]').hidden = !ready;
    $('[data-start]').hidden = !(ready || paused);
    $('[data-keyboard]').hidden = !(ready || paused) || !!input?.touch;
    $('.game-control-picker').hidden = !(ready || paused);
    $('[data-control-guide]').hidden = !(ready || paused);
    if (!(ready || paused)) $('.game-mouse-fallback').hidden = true;
    $('[data-restart]').hidden = !(paused || lost || won);
    $('[data-collection]').hidden = !won;
    $('.game-reward').hidden = !won;
    $('.game-settings').hidden = won || lost || error;
    updateControls();
    if (!playing) {
      menu.scrollTop = 0;
      root.querySelector<HTMLButtonElement>(won ? '[data-collection]' : lost ? '[data-restart]' : error ? '[data-exit]' : '[data-start]')?.focus();
    }
  }
  function cancelStart() { startRequest++; starting = false; input?.unlock(); updateControls(); }
  function pause() { if (starting) cancelStart(); if (screen === 'playing') { showScreen(rewarded ? 'won' : 'paused'); updateMap(); } }
  function fail(message: string) {
    $('[data-error]').textContent = message; $('[data-error]').hidden = false;
    showScreen('error');
  }
  function updateMap() {
    const player = root.querySelector<SVGElement>('[data-map-player]')!;
    player.setAttribute('transform', `translate(${state.player.x.toFixed(2)} ${state.player.z.toFixed(2)}) rotate(${-state.player.yaw * 180 / Math.PI})`);
    for (const symbol of level.symbols) root.querySelector(`[data-map-symbol="${symbol.id}"]`)?.setAttribute('opacity', state.collected.includes(symbol.id) ? '.15' : '1');
  }
  function updateHud() {
    const mission = getMission(state, level);
    $('[data-health]').textContent = String(state.player.health);
    $<HTMLMeterElement>('meter').value = state.player.health;
    $('[data-symbol-count]').textContent = `${state.collected.length} / 3`;
    $('[data-objective]').textContent = mission.objective;
    for (const checkpoint of mission.checkpoints) {
      const element = $(`[data-seal-id="${checkpoint.id}"]`);
      element.dataset.restored = String(checkpoint.restored);
      element.setAttribute('aria-label', `${sealNames[checkpoint.kind]}: ${checkpoint.restored ? 'restaurado' : 'bloqueado'}`);
    }
    const nearby = level.symbols.find((symbol) => !state.collected.includes(symbol.id) && Math.hypot(symbol.x - state.player.x, symbol.z - state.player.z) <= INTERACTION_RANGE && hasLineOfSight(state.player, symbol, level.walls));
    const atExit = Math.hypot(level.exit.x - state.player.x, level.exit.z - state.player.z) <= INTERACTION_RANGE && hasLineOfSight(state.player, level.exit, level.walls);
    const action = input?.touch ? 'Toque em Interagir' : 'Pressione E';
    $('[data-prompt]').textContent = nearby ? `${action} · restaurar ${sealNames[nearby.kind].toLowerCase()} · +25 integridade` : atExit ? `${action} · ${state.collected.length === 3 ? 'libertar o sinal' : 'a torre precisa dos três selos'}` : state.elapsed < 8 ? 'Siga os pulsos no chão. Rastreie novamente com Q ou ⌁.' : '';
    if (rewarded) $('[data-prompt]').textContent = '';
    root.dataset.interactable = String(!!nearby || atExit);
    root.dataset.damaged = String(state.damageFlash > 0);
    root.dataset.scanning = String(screen === 'playing' && scanRemaining > 0 && !!mission.target);
    $('[data-navigation]').textContent = !mission.target ? mission.objective : scanRemaining > 0 ? '⌁ Siga a trilha de luz' : mission.target.inRange ? 'Selo ao alcance' : `${sealNames[mission.target.symbolKind ?? 'chain']} · sinal ${mission.target.direction} · ${Math.round(mission.target.distance)} m`;
    if (mission.target?.kind === 'exit' && scanRemaining <= 0) $('[data-navigation]').textContent = `Torre · ${mission.target.direction} · ${Math.round(mission.target.distance)} m`;
    $('[data-scan-label]').textContent = scanRemaining > 0 ? `Rastreando · ${Math.ceil(scanRemaining)}s` : scanCooldown > 0 ? `Recarga · ${Math.ceil(scanCooldown)}s` : 'Rastrear';
    $<HTMLButtonElement>('[data-scan]').disabled = scanCooldown > 0 || rewarded;
    const awareness = getEnemyAwareness(state, level);
    $('[data-threat]').dataset.awareness = awareness;
    $('[data-threat]').hidden = screen !== 'playing' || !['hunting', 'stunned'].includes(awareness) || rewarded;
    $('[data-threat]').textContent = awareness === 'stunned' ? 'SENTINELA INTERROMPIDA · avance' : 'SENTINELA EM ALERTA · dispare ou use cobertura';
  }
  function scan() {
    if (screen !== 'playing' || scanCooldown > 0 || rewarded) return;
    scanRemaining = 6; scanCooldown = 8; routeRefresh = 0; audio.effect('scan'); updateHud();
  }
  function processEvents(events: GameEvent[]) {
    for (const event of events) {
      if (event.type === 'shot') { audio.effect('shot'); if (event.hit === 'enemy') { hitRemaining = .22; notice('Pulso certeiro. A sentinela foi interrompida.'); } }
      if (event.type === 'symbol-collected') { audio.effect('collect'); scanRemaining = 6; scanCooldown = 0; routeRefresh = 0; notice(`${state.collected.length} de 3 selos restaurados. ${state.collected.length === 3 ? 'A torre despertou. Liberte o sinal.' : 'Um novo caminho acendeu.'}`); }
      if (event.type === 'player-restored') notice(`Selo restaurado. +${event.amount} de integridade. Siga o próximo sinal.`);
      if (event.type === 'exit-locked') notice(`A transmissão precisa de mais ${event.remaining} ${event.remaining === 1 ? 'selo' : 'selos'}.`);
      if (event.type === 'player-damaged') { audio.effect('damage'); notice('A sentinela está perto. Afaste-se ou dispare.'); }
      if (event.type === 'enemy-defeated') notice('Sentinela desativada. O caminho está livre.');
      if (event.type === 'won' && !rewarded) {
        rewarded = true; audio.effect('win');
        $('[data-save-message]').textContent = options.onWin(state.collected);
        const summary = getRunSummary(state);
        $('[data-run-medal]').textContent = summary.medal?.title ?? 'Sinal livre';
        $('[data-run-medal]').title = summary.medal?.description ?? '';
        const seconds = Math.floor(summary.elapsedSeconds);
        $('[data-run-stats]').textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} de percurso · ${summary.health} de integridade · ${summary.shots} pulsos`;
        victoryRemaining = options.reducedMotion() ? .7 : 2.2; root.dataset.transmitting = 'true'; $('.game-transmission').hidden = false;
        scanRemaining = 0; world?.setGuide([]); updateHud();
      }
      if (event.type === 'lost') showScreen('lost');
    }
  }
  function tick(time: number) {
    frame = 0;
    if (disposed || screen !== 'playing' || !world || !input) return;
    const dt = Math.min(.05, Math.max(0, (time - lastTime) / 1000)); lastTime = time;
    processEvents(stepGame(state, input.sample(dt, Number(sensitivity.value)), dt, level));
    scanRemaining = Math.max(0, scanRemaining - dt); scanCooldown = Math.max(0, scanCooldown - dt);
    routeRefresh -= dt;
    if (routeRefresh <= 0) {
      const target = getMission(state, level).target;
      world.setGuide(scanRemaining > 0 && target ? navigator.route(state.player, target.position) : []);
      routeRefresh = .35;
    }
    world.render(state, dt, options.reducedMotion());
    if (victoryRemaining > 0) { victoryRemaining -= dt; if (victoryRemaining <= 0) showScreen('won'); }
    hitRemaining = Math.max(0, hitRemaining - dt);
    root.dataset.hit = String(hitRemaining > 0);
    root.dataset.firing = String(state.muzzleFlash > 0);
    uiTime += dt; noticeRemaining -= dt;
    if (noticeRemaining <= 0) $('[data-notice]').textContent = '';
    if (uiTime >= .1) { uiTime = 0; updateHud(); }
    if (screen === 'playing') frame = requestAnimationFrame(tick);
  }
  async function start(mode: ControlMode) {
    if (!world || !input || disposed || starting || !(screen === 'ready' || screen === 'paused')) return;
    input.setMode(mode); $('.game-mouse-fallback').hidden = true;
    const request = ++startRequest;
    if (mode === 'mouse') {
      starting = true; updateControls();
      const locked = await input.lock();
      if (disposed || request !== startRequest) return;
      starting = false; updateControls();
      if (!locked) { $('.game-mouse-fallback').hidden = false; $('[data-drag]').focus(); return; }
      if (document.hidden) { input.unlock(); return; }
    }
    showScreen('playing'); updateHud(); lastTime = performance.now();
    audio.resume(sound.checked);
    world.canvas.focus();
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(tick);
  }
  function restart() {
    cancelStart(); state = createGameState(level); rewarded = false; noticeRemaining = 0; hitRemaining = 0; scanRemaining = 6; scanCooldown = 0; routeRefresh = 0; victoryRemaining = 0; root.dataset.transmitting = 'false'; world?.setGuide([]); $('[data-notice]').textContent = '';
    world?.render(state, 0, options.reducedMotion()); updateMap(); updateHud();
    showScreen('ready');
  }
  const listen = (selector: string, event: string, callback: () => void) => $(selector).addEventListener(event, callback, { signal: abort.signal });
  listen('[data-start]', 'click', () => { void start(input?.mode ?? 'mouse'); });
  listen('[data-keyboard]', 'click', () => { void start('keyboard'); });
  listen('[data-drag]', 'click', () => { void start('drag'); });
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-control-mode]')) button.addEventListener('click', () => {
    cancelStart(); input?.setMode(button.dataset.controlMode as ControlMode); $('.game-mouse-fallback').hidden = true; showScreen(screen);
  }, { signal: abort.signal });
  async function fullscreen() {
    $('[data-display-note]').textContent = '';
    const unavailable = (message: string) => { notice(message); $('[data-display-note]').textContent = message; };
    try {
      if (document.fullscreenElement === root) await document.exitFullscreen();
      else if (root.requestFullscreen) await root.requestFullscreen();
      else unavailable('Tela cheia indisponível aqui. Você pode jogar nesta janela.');
    } catch { if (!disposed) unavailable('Este navegador não permitiu tela cheia. Você pode jogar nesta janela.'); }
  }
  listen('[data-fullscreen]', 'click', () => { void fullscreen(); });
  listen('[data-fullscreen-menu]', 'click', () => { void fullscreen(); });
  document.addEventListener('fullscreenchange', () => {
    const full = document.fullscreenElement === root;
    $('[data-fullscreen]').setAttribute('aria-label', full ? 'Sair da tela cheia' : 'Tela cheia');
    $('[data-fullscreen-menu]').textContent = full ? 'Sair da tela cheia' : 'Tela cheia';
    if (!full) pause();
    world?.resize(); world?.render(state, 0, options.reducedMotion());
  }, { signal: abort.signal });
  listen('.game-pause', 'click', pause);
  listen('[data-scan]', 'click', scan);
  listen('[data-restart]', 'click', restart);
  listen('[data-exit]', 'click', () => options.onExit());
  listen('[data-collection]', 'click', () => options.onExit(true));
  listen('[data-game-motion]', 'change', () => { options.setReducedMotion(motion.checked); world?.render(state, 0, motion.checked); });
  for (const selector of ['[data-music-volume]', '[data-effects-volume]']) listen(selector, 'input', () => audio.setVolumes(Number($<HTMLInputElement>('[data-music-volume]').value), Number($<HTMLInputElement>('[data-effects-volume]').value)));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); }, { signal: abort.signal });
  // Menus remain keyboard-contained even in browsers with inconsistent dialog Tab wrapping.
  root.addEventListener('keydown', (event) => {
    if (event.code === 'KeyF' && screen === 'playing' && !event.repeat) { event.preventDefault(); void fullscreen(); return; }
    if (event.key !== 'Tab' || screen === 'playing') return;
    const items = [...menu.querySelectorAll<HTMLElement>('button, input, summary')].filter((element) => !element.hidden && element.getClientRects().length && !(element as HTMLButtonElement).disabled);
    const first = items[0]; const last = items[items.length - 1];
    if (first && last && (event.shiftKey ? document.activeElement === first : document.activeElement === last)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
  }, { signal: abort.signal });
  root.querySelector('[data-map-walls]')!.innerHTML = level.walls.map((wall) => `<rect x="${wall.x - wall.width / 2}" y="${wall.z - wall.depth / 2}" width="${wall.width}" height="${wall.depth}" fill="${wall.kind === 'bars' ? '#82545a' : '#69636a'}"/>`).join('');
  root.querySelector('[data-map-symbols]')!.innerHTML = level.symbols.map((symbol) => `<circle data-map-symbol="${symbol.id}" cx="${symbol.x}" cy="${symbol.z}" r=".6" fill="#ef233c"/>`).join('');
  try {
    world = createWorld(worldHost, level, { onContextLost: () => fail('O navegador perdeu o contexto gráfico. Saia e abra a fase novamente.'), onAssetError: () => notice('Uma arte não carregou; o labirinto continua jogável.') });
    world.canvas.tabIndex = 0; world.canvas.setAttribute('aria-label', 'Área do jogo. WASD ou setas para mover, E para interagir, Espaço para disparar, P para pausar.');
    input = createInput(root, world.canvas, pause, scan); input.setMode(input.mode);
    world.render(state, 0, options.reducedMotion()); updateMap(); updateHud(); showScreen('ready');
  } catch {
    world?.dispose(); world = null;
    fail('WebGL 2 não está disponível. Tente um navegador com aceleração gráfica habilitada; a home e a coleção não dependem do jogo.');
  }
  return {
    pause,
    dispose() {
      disposed = true; startRequest++; cancelAnimationFrame(frame); abort.abort(); input?.dispose(); audio.dispose(); world?.dispose();
      if (document.fullscreenElement === root) void document.exitFullscreen().catch(() => {});
      host.replaceChildren();
    },
  };
}
