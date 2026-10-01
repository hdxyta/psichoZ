import { CDAPIError, cdRequest, escapeHTML, timeLabel, trackTitle, type CollectorCatalog } from './api';
import { assetUrl } from '../config/site';

export function createAlbumPlayer(root: HTMLElement, catalog: CollectorCatalog, onExpired: () => void): () => void {
  const audio = new Audio();
  audio.preload = 'none';
  let active = -1; let revision = 0; let disposed = false;
  let waveAbort: AbortController | undefined;
  let peaks: number[] = [];
  let paint: typeof import('./waveform').drawWaveform | undefined;
  let activeVisible = true;
  const cleanup = new AbortController();
  const signal = cleanup.signal;
  const title = (i: number) => trackTitle(catalog.tracks[i]);
  const releaseNote = catalog.downloadsLockedUntil ? `Downloads disponíveis em ${new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(catalog.downloadsLockedUntil))}.` : '';
  root.innerHTML = `<div class="cd-player-heading"><div><p class="section-label">SIDE A + B / FULL ALBUM</p><h2 id="cd-list-title">O disco é seu.</h2></div><div><button class="button secondary" data-album-download ${catalog.albumDownloadUrl && !releaseNote ? '' : 'disabled'} aria-describedby="cd-download-note">↓ BAIXAR ÁLBUM</button><p id="cd-download-note" class="small-note">${escapeHTML(releaseNote || (catalog.albumDownloadUrl ? '' : 'Arquivo do álbum ainda não publicado.'))}</p></div></div>
    <p class="cd-feedback" role="status" data-download-status></p>
    <ol class="cd-tracks" aria-labelledby="cd-list-title">${catalog.tracks.map((track, i) => `<li class="cd-track" data-track="${track.id}"><div class="cd-track-summary"><span class="cd-track-number">${String(track.number).padStart(2, '0')}</span><div class="cd-track-name"><h3>${escapeHTML(title(i))}</h3><span class="small-note">${track.streamUrl ? 'YTA / PSICOZ' : 'Áudio ainda não publicado'}</span></div><span class="cd-duration">${timeLabel(track.durationSeconds)}</span><button class="cd-play" data-select="${i}" aria-label="Reproduzir ${escapeHTML(title(i))}" aria-expanded="false" ${track.streamUrl ? '' : 'disabled'}>▶<span class="cd-play-label"> PLAY</span></button></div><div class="cd-track-detail" hidden></div></li>`).join('')}</ol>
    <aside class="cd-mini" aria-label="Mini player" hidden><div class="cd-mini-inner"><img src="${escapeHTML(assetUrl('assets/cover-dark-640.webp'))}" width="48" height="48" alt="" /><button class="cd-mini-title" data-show-active><strong></strong><small>YTA / PSICOZ</small></button><div class="cd-mini-controls"><button data-prev aria-label="Faixa anterior">◀</button><button data-toggle aria-label="Reproduzir">▶</button><button data-next aria-label="Próxima faixa">▶|</button></div><input class="cd-mini-seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Posição da música no mini player" disabled /></div></aside>`;
  const rows = Array.from(root.querySelectorAll<HTMLElement>('.cd-track'));
  const mini = root.querySelector<HTMLElement>('.cd-mini')!;
  const miniSeek = root.querySelector<HTMLInputElement>('.cd-mini-seek')!;
  const feedback = root.querySelector<HTMLElement>('[data-download-status]')!;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.target === rows[active]) activeVisible = entry.isIntersecting;
    syncMini();
  }, { threshold: 0.15 });
  const resize = new ResizeObserver(() => draw());
  resize.observe(root);
  function detail() { return rows[active]?.querySelector<HTMLElement>('.cd-track-detail'); }
  function neighbor(direction: number) {
    for (let i = active + direction; i >= 0 && i < catalog.tracks.length; i += direction) if (catalog.tracks[i].streamUrl) return i;
    return -1;
  }
  function status(value: string) { const element = detail()?.querySelector<HTMLElement>('[data-audio-status]'); if (element) element.textContent = value; }
  function draw() {
    const canvas = detail()?.querySelector<HTMLCanvasElement>('canvas');
    if (canvas && peaks.length && paint) paint(canvas, peaks, Number.isFinite(audio.duration) && audio.duration > 0 ? audio.currentTime / audio.duration : 0);
  }
  function syncMini() { mini.hidden = active < 0 || activeVisible; }
  function update() {
    if (active < 0 || disposed) return;
    const playing = !audio.paused && !audio.ended;
    const duration = Number.isFinite(audio.duration) ? audio.duration : catalog.tracks[active].durationSeconds;
    const seekable = duration !== null && duration > 0;
    root.querySelectorAll<HTMLButtonElement>('[data-toggle]').forEach((button) => { button.textContent = playing ? 'Ⅱ' : '▶'; button.setAttribute('aria-label', playing ? 'Pausar' : 'Reproduzir'); });
    const select = rows[active].querySelector<HTMLButtonElement>('[data-select]')!;
    select.innerHTML = playing ? 'Ⅱ<span class="cd-play-label"> PAUSE</span>' : '▶<span class="cd-play-label"> PLAY</span>';
    select.setAttribute('aria-label', `${playing ? 'Pausar' : 'Reproduzir'} ${title(active)}`);
    const clock = detail()?.querySelector('[data-clock]');
    if (clock) clock.textContent = `${timeLabel(audio.currentTime)} / ${timeLabel(duration)}`;
    const rowDuration = rows[active].querySelector('.cd-duration');
    if (rowDuration) rowDuration.textContent = timeLabel(duration);
    for (const slider of [detail()?.querySelector<HTMLInputElement>('[data-seek]'), miniSeek]) {
      if (!slider) continue;
      slider.disabled = !seekable;
      slider.value = String(seekable ? audio.currentTime / duration! * 1000 : 0);
      slider.setAttribute('aria-valuetext', `${timeLabel(audio.currentTime)} de ${timeLabel(duration)}`);
    }
    root.querySelectorAll<HTMLButtonElement>('[data-prev]').forEach((button) => { button.disabled = neighbor(-1) < 0; });
    root.querySelectorAll<HTMLButtonElement>('[data-next]').forEach((button) => { button.disabled = neighbor(1) < 0; });
    draw(); syncMini();
  }
  async function verifySession() {
    try { await cdRequest('/api/cd-session'); } catch (error) { if (!disposed && error instanceof CDAPIError && error.status === 401) onExpired(); }
  }
  async function playCurrent(): Promise<void> {
    const attempt = revision;
    try { await audio.play(); }
    catch (error) {
      if (disposed || attempt !== revision || (error instanceof DOMException && error.name === 'AbortError')) return;
      status(error instanceof DOMException && error.name === 'NotAllowedError' ? 'Toque em Play para continuar.' : 'Não foi possível tocar esta faixa. Toque em Play para tentar novamente.');
      update(); void verifySession();
    }
  }
  function toggle() {
    if (active < 0) return;
    if (audio.paused) { if (audio.error) audio.load(); void playCurrent(); } else audio.pause();
  }
  async function select(index: number) {
    if (disposed || !catalog.tracks[index]?.streamUrl) return;
    if (index === active) { toggle(); return; }
    revision++; const current = revision;
    audio.pause(); waveAbort?.abort(); observer.disconnect(); peaks = [];
    rows.forEach((row, i) => {
      const selected = i === index;
      row.classList.toggle('is-active', selected);
      const button = row.querySelector<HTMLButtonElement>('[data-select]')!;
      button.setAttribute('aria-expanded', String(selected));
      button.setAttribute('aria-label', `Reproduzir ${title(i)}`);
      button.innerHTML = '▶<span class="cd-play-label"> PLAY</span>';
      const panel = row.querySelector<HTMLElement>('.cd-track-detail')!;
      panel.hidden = !selected;
      panel.replaceChildren();
    });
    active = index;
    const track = catalog.tracks[index];
    detail()!.innerHTML = `<div class="cd-wave"><canvas aria-hidden="true"></canvas><input data-seek type="range" min="0" max="1000" value="0" step="1" aria-label="Posição em ${escapeHTML(title(index))}" disabled /></div><div class="cd-wave-meta"><span data-clock>0:00 / ${timeLabel(track.durationSeconds)}</span><span data-wave-status>Preparando forma de onda…</span></div><div class="cd-transport"><div><button data-prev aria-label="Faixa anterior">◀</button><button data-toggle aria-label="Pausar">Ⅱ</button><button data-next aria-label="Próxima faixa">▶|</button></div><button class="cd-download" data-download="${index}" ${track.downloadUrl && !releaseNote ? '' : 'disabled'} aria-describedby="cd-download-note">${releaseNote ? 'No lançamento' : track.downloadUrl ? '↓ DOWNLOAD' : 'Download pendente'}</button></div><p class="cd-feedback" role="status" data-audio-status>Carregando áudio…</p>`;
    mini.querySelector('strong')!.textContent = title(index);
    activeVisible = true; observer.observe(rows[index]);
    audio.src = track.streamUrl!;
    audio.preload = 'metadata';
    void playCurrent(); update();
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: title(index), artist: 'YTA', album: 'psicoZ', artwork: [{ src: assetUrl('assets/cover-dark-640.webp'), sizes: '640x640', type: 'image/webp' }] });
    }
    waveAbort = new AbortController(); const waveSignal = waveAbort.signal;
    try {
      const module = await import('./waveform');
      waveSignal.throwIfAborted();
      const values = await module.loadPeaks(track, waveSignal);
      if (disposed || revision !== current) return;
      peaks = values; paint = module.drawWaveform;
      detail()!.querySelector('[data-wave-status]')!.textContent = 'Toque ou arraste para explorar'; draw();
    } catch (error) {
      if (disposed || revision !== current) return;
      detail()!.querySelector('[data-wave-status]')!.textContent = 'Forma de onda indisponível. Use a barra de posição.';
      if (error instanceof Error && error.message === 'session') onExpired();
    }
  }
  async function download(url: string, button: HTMLButtonElement) {
    button.disabled = true; feedback.textContent = 'Preparando download…';
    try {
      const response = await fetch(url, { method: 'HEAD', credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(15_000) });
      if (!response.ok) throw new CDAPIError(response.status);
      if (!response.headers.get('Content-Disposition')?.startsWith('attachment')) throw new CDAPIError(503);
      if (disposed) return;
      // Native download streams to disk instead of buffering a large ZIP in a Blob.
      const link = document.createElement('a'); link.href = url; link.download = ''; link.hidden = true;
      root.append(link); link.click(); link.remove();
      feedback.textContent = 'Download solicitado. Confira os downloads do navegador.';
    } catch (error) {
      if (disposed) return;
      if (error instanceof CDAPIError && error.status === 401) { onExpired(); return; }
      feedback.textContent = 'O download não ficou disponível. Tente novamente em instantes.';
    } finally { button.disabled = false; }
  }
  root.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button');
    if (!button || button.disabled) return;
    if (button.dataset.select !== undefined) void select(Number(button.dataset.select));
    if (button.hasAttribute('data-toggle')) toggle();
    if (button.hasAttribute('data-prev') && neighbor(-1) >= 0) void select(neighbor(-1));
    if (button.hasAttribute('data-next') && neighbor(1) >= 0) void select(neighbor(1));
    if (button.hasAttribute('data-show-active')) { rows[active].scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); rows[active].querySelector<HTMLButtonElement>('[data-select]')!.focus({ preventScroll: true }); }
    if (button.dataset.download !== undefined) { const url = catalog.tracks[Number(button.dataset.download)].downloadUrl; if (url) void download(url, button); }
    if (button.hasAttribute('data-album-download') && catalog.albumDownloadUrl) void download(catalog.albumDownloadUrl, button);
  }, { signal });
  root.addEventListener('input', (event) => {
    const slider = event.target as HTMLInputElement;
    if (slider.type === 'range' && Number.isFinite(audio.duration)) { audio.currentTime = Number(slider.value) / 1000 * audio.duration; update(); }
  }, { signal });
  for (const name of ['timeupdate', 'durationchange', 'loadedmetadata', 'seeked', 'pause', 'play']) audio.addEventListener(name, update, { signal });
  audio.addEventListener('playing', () => status('Reproduzindo'), { signal });
  audio.addEventListener('pause', () => { if (!audio.error) status('Pausado'); }, { signal });
  audio.addEventListener('waiting', () => status('Carregando áudio…'), { signal });
  audio.addEventListener('error', () => { status('Áudio indisponível. Toque em Play para tentar novamente.'); void verifySession(); }, { signal });
  audio.addEventListener('ended', () => { const next = neighbor(1); if (next >= 0) void select(next); else { status('Fim do álbum. Obrigado por ouvir.'); update(); } }, { signal });
  if ('mediaSession' in navigator) {
    const handlers: Record<string, () => void> = { play: () => { void playCurrent(); }, pause: () => { audio.pause(); }, previoustrack: () => { if (neighbor(-1) >= 0) void select(neighbor(-1)); }, nexttrack: () => { if (neighbor(1) >= 0) void select(neighbor(1)); } };
    for (const [action, handler] of Object.entries(handlers)) {
      try { navigator.mediaSession.setActionHandler(action as MediaSessionAction, handler); } catch { /* Optional platform controls. */ }
    }
  }
  return () => {
    disposed = true; revision++; cleanup.abort(); waveAbort?.abort(); observer.disconnect(); resize.disconnect();
    audio.pause(); audio.removeAttribute('src'); audio.load(); mini.remove();
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
      for (const action of ['play', 'pause', 'previoustrack', 'nexttrack'] as MediaSessionAction[]) try { navigator.mediaSession.setActionHandler(action, null); } catch { /* Optional. */ }
    }
  };
}
