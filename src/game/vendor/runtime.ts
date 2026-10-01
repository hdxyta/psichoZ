import './styles.css';
import type { VendorGame } from '../../data/vendor-games';
import type { ArcadeOptions } from '../arcade/runtime';

type Screen = 'ready' | 'loading' | 'playing' | 'paused' | 'won' | 'lost' | 'error';
export function mountVendorGame(host: HTMLElement, game: VendorGame, options: ArcadeOptions) {
  host.innerHTML = `<div class="vendor-game" data-screen="ready"><header class="vendor-header"><div><span data-track></span><strong data-title></strong></div><p data-progress>Pronto para jogar</p><time data-time></time><button data-pause aria-label="Pausar partida" disabled>Ⅱ</button><button data-close aria-label="Fechar jogo">×</button></header><div class="vendor-stage"></div><footer class="vendor-footer"><p data-hint></p><a data-source target="_blank" rel="noopener noreferrer"></a></footer><div class="vendor-overlay"><section class="vendor-menu" aria-labelledby="vendor-heading"><span class="vendor-eyebrow" data-genre></span><h2 id="vendor-heading"></h2><strong data-objective></strong><p data-instructions></p><p class="vendor-result" role="status" data-result hidden></p><div class="vendor-buttons"><button class="button primary" data-start>Jogar</button><button class="button primary" data-collection hidden>Ver minha coleção</button><button class="button secondary" data-restart hidden>Recomeçar fase</button><button class="text-link" data-exit>Voltar aos jogos</button></div><p class="vendor-note">Música a publicar. Conquistas ficam neste navegador.</p><p class="vendor-note" data-credit></p></section></div></div>`;
  const root = host.querySelector<HTMLElement>('.vendor-game')!;
  const q = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const overlay = q('.vendor-overlay'), stage = q('.vendor-stage');
  q('[data-track]').textContent = `PSICOZ / ${game.trackId.replace('-', ' ')}`;
  q('[data-title]').textContent = game.title; q('[data-genre]').textContent = `${game.genre} / ${game.subtitle}`;
  q('#vendor-heading').textContent = game.title; q('[data-objective]').textContent = game.objective;
  q('[data-instructions]').textContent = game.instructions;
  q('[data-hint]').textContent = game.instructions;
  const source = q<HTMLAnchorElement>('[data-source]'); source.href = game.repository; source.textContent = `Base: ${game.sourceName} ↗`;
  q('[data-credit]').textContent = `Código adaptado de ${game.sourceName}. Créditos e licença preservados junto ao jogo.`;
  let screen: Screen = 'ready', frame: HTMLIFrameElement | null = null, token = '', elapsed = 0, last = 0, raf = 0, loadTimer = 0, disposed = false, awarded = false;
  const abort = new AbortController();
  const listen = (target: EventTarget, type: string, listener: EventListener) => target.addEventListener(type, listener, { signal: abort.signal });
  function command(paused: boolean) { frame?.contentWindow?.postMessage({ type: 'psicoz-command', token, paused }, location.origin); }
  function setScreen(next: Screen) {
    screen = next; root.dataset.screen = next; overlay.hidden = next === 'playing'; stage.inert = next !== 'playing'; last = 0;
    q<HTMLButtonElement>('[data-pause]').disabled = next !== 'playing';
    const start = q<HTMLButtonElement>('[data-start]'); start.hidden = !['ready', 'paused'].includes(next); start.textContent = next === 'paused' ? 'Continuar partida' : 'Jogar';
    q('[data-restart]').hidden = !['paused', 'won', 'lost', 'error'].includes(next); q('[data-collection]').hidden = next !== 'won';
    q('#vendor-heading').textContent = { ready: game.title, loading: 'Abrindo o jogo…', playing: game.title, paused: 'Pausa', won: 'Faixa recuperada', lost: 'Tente outra vez', error: 'Jogo indisponível' }[next];
    if (next !== 'loading' && next !== 'ready') command(next !== 'playing');
    if (next === 'playing') frame?.focus();
    else if (next === 'won') q('[data-collection]').focus();
    else if (['lost', 'error'].includes(next)) q('[data-restart]').focus();
    else if (['ready', 'paused'].includes(next)) start.focus();
  }
  function end(won: boolean, detail?: string) {
    if (screen !== 'playing') return;
    setScreen(won ? 'won' : 'lost');
    const result = q('[data-result]'); result.hidden = false;
    if (won && !awarded) { awarded = true; result.textContent = `${options.onWin([`${game.trackId}-${game.slug}-recovered`])} O MP3 continua aguardando publicação.`; }
    else result.textContent = detail ?? 'Esta tentativa acabou. Recomece para tentar recuperar a faixa.';
  }
  function fail(message: string) {
    clearTimeout(loadTimer); setScreen('error'); q('[data-result]').hidden = false; q('[data-result]').textContent = message;
  }
  function begin(forceRestart = false) {
    if (screen === 'paused' && !forceRestart) { setScreen('playing'); return; }
    frame?.remove(); token = crypto.randomUUID(); elapsed = 0; awarded = false; q('[data-result]').hidden = true;
    q('[data-progress]').textContent = 'Carregando…';
    frame = document.createElement('iframe'); frame.title = `${game.title} — ${game.genre}`;
    frame.src = `/games/${game.slug}/index.html?session=${encodeURIComponent(token)}&motion=${options.reducedMotion() ? 'reduce' : 'full'}`;
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
    frame.setAttribute('referrerpolicy', 'no-referrer');
    stage.replaceChildren(frame); setScreen('loading');
    clearTimeout(loadTimer); loadTimer = window.setTimeout(() => fail('O jogo não respondeu. Recomece para tentar carregar novamente.'), 15000);
  }
  listen(window, 'message', ((event: MessageEvent) => {
    if (disposed || event.source !== frame?.contentWindow || event.origin !== location.origin || event.data?.type !== 'psicoz-game' || event.data.token !== token) return;
    const data = event.data;
    if (data.error) { fail('Um recurso do jogo falhou. Recomece a fase ou volte ao seletor.'); return; }
    if (data.request === 'pause') { pause(); return; }
    if (!['playing', 'won', 'lost'].includes(data.phase) || !Number.isFinite(data.progress) || !Number.isFinite(data.total) || data.total <= 0) return;
    if (screen === 'loading') { clearTimeout(loadTimer); setScreen('playing'); }
    if (screen !== 'playing') return;
    q('[data-progress]').textContent = `${String(data.label).slice(0, 80)} ${data.progress} / ${data.total}`;
    q('[data-hint]').textContent = String(data.hint || game.instructions).slice(0, 400);
    if (data.phase === 'won' && data.progress >= data.total) end(true);
    if (data.phase === 'lost') end(false, String(data.hint || 'Tente novamente.'));
  }) as EventListener);
  const pause = () => { if (screen === 'playing') setScreen('paused'); };
  listen(q('[data-start]'), 'click', (() => begin()) as EventListener);
  listen(q('[data-restart]'), 'click', (() => begin(true)) as EventListener);
  listen(q('[data-collection]'), 'click', (() => options.onExit(true)) as EventListener);
  for (const selector of ['[data-exit]', '[data-close]']) listen(q(selector), 'click', (() => options.onExit()) as EventListener);
  listen(q('[data-pause]'), 'click', pause as EventListener);
  listen(window, 'keydown', ((e: KeyboardEvent) => { if (e.code === 'KeyP' || e.code === 'Escape') { e.preventDefault(); pause(); } }) as EventListener);
  listen(document, 'visibilitychange', (() => { if (document.hidden) pause(); }) as EventListener);
  // A focus move into the iframe also fires window blur; it is not an application switch.
  listen(window, 'blur', (() => { window.setTimeout(() => { if (document.activeElement !== frame) pause(); }, 0); }) as EventListener);
  function tick(time: number) {
    if (disposed) return;
    if (screen === 'playing' && last) elapsed += Math.min(.1, (time - last) / 1000);
    last = time;
    const remaining = Math.max(0, Math.ceil(game.duration - elapsed));
    q('[data-time]').textContent = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
    if (screen === 'playing' && remaining === 0) end(false, 'O tempo acabou. Recomece para tentar novamente.');
    raf = requestAnimationFrame(tick);
  }
  setScreen('ready'); raf = requestAnimationFrame(tick);
  return { pause, dispose() { disposed = true; clearTimeout(loadTimer); cancelAnimationFrame(raf); abort.abort(); frame?.remove(); frame = null; root.remove(); } };
}
