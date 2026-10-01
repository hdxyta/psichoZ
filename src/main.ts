import './styles/main.css';
import './styles/reference-mix.css';
import './styles/game-hub.css';
import { album, artist, presaveLinks, listeningLinks, assetUrl, safeUrl } from './config/site';
import { tracks, rewards, levels } from './data/catalog';
import { getVendorGame } from './data/vendor-games';
import { createProgressStore } from './state/progress';
import { getAccess } from './state/access';
import { createGameEntry } from './ui/game-entry';

const $ = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Elemento necessário ausente: ${selector}`);
  return element;
};
const text = (selector: string, value: string) => { $(selector).textContent = value; };
const store = createProgressStore();
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const releaseDate = new Date(album.releaseDate);
const releasedByDate = () => Date.now() >= releaseDate.getTime();
const released = album.releaseStatus === 'released' || releasedByDate();
const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' }).format(releaseDate);
const dateElement = $<HTMLTimeElement>('#release-date');
dateElement.dateTime = album.releaseDate;
dateElement.textContent = date;
text('#release-label', released ? 'PSICOZ IS OUT NOW' : album.artist);

// A shared tag URL grants access only. It never fabricates a completed level.
if (new URLSearchParams(location.search).get('edition') === 'nfc') {
  store.updateNfc();
  history.replaceState(null, '', `${location.pathname}${location.search}#colecao`);
  requestAnimationFrame(() => $('#colecao').scrollIntoView());
}

text('#album-concept', album.concept);
text('#artist-name', artist.name);
text('#artist-bio', artist.bio);
const approvedArtistLinks = artist.links.filter((link) => safeUrl(link.url));
$('#artist-links').replaceChildren(...approvedArtistLinks.map(({ label, url }) => externalLink(label, safeUrl(url)!)));
if (safeUrl(artist.contactUrl)) $('#artist-links').append(externalLink('Contato', safeUrl(artist.contactUrl)!));
if (safeUrl(artist.photoUrl, true)) {
  const photo = document.createElement('img');
  photo.className = 'artist-photo';
  photo.src = artist.photoUrl!.startsWith('/') ? assetUrl(artist.photoUrl!) : artist.photoUrl!;
  photo.alt = artist.name ? `Retrato de ${artist.name}` : 'Retrato do artista';
  photo.width = 640;
  photo.height = 640;
  photo.loading = 'lazy';
  $('.artist-copy').prepend(photo);
}

function externalLink(label: string, url: string): HTMLAnchorElement {
  const link = document.createElement('a');
  link.textContent = `${label} ↗`;
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.className = 'text-link';
  link.setAttribute('aria-label', `${label} (abre em outra aba)`);
  return link;
}

function trackEvent(name: string, data: Record<string, unknown> = {}): void {
  window.dispatchEvent(new CustomEvent('psicoz:analytics', { detail: { name, data } }));
}

function renderCountdown(): void {
  const countdown = $('#release-countdown');
  const total = releaseDate.getTime() - Date.now();
  if (total <= 0) {
    countdown.textContent = 'PSICOZ IS OUT NOW';
    text('#release-label', 'PSICOZ IS OUT NOW');
    document.querySelectorAll<HTMLElement>('[data-open-presave]').forEach((element) => {
      if (element.id !== 'cover-button') element.textContent = 'OUVIR PSICOZ ↗';
    });
    return;
  }
  const seconds = Math.floor(total / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  countdown.replaceChildren(...[
    `${days}D`, `${String(hours).padStart(2, '0')}H`, `${String(minutes).padStart(2, '0')}M`, `${String(secs).padStart(2, '0')}S`,
  ].map((part) => {
    const span = document.createElement('span');
    span.textContent = part;
    return span;
  }));
}

function renderTeaser(): void {
  const teaser = $<HTMLElement>('#teaser');
  const url = safeUrl(album.trailerUrl, true);
  if (!url) {
    teaser.hidden = true;
    return;
  }
  const video = document.createElement('video');
  video.controls = true;
  video.preload = 'metadata';
  video.playsInline = true;
  video.src = url.startsWith('/') ? assetUrl(url) : url;
  const poster = safeUrl(album.trailerPosterUrl, true);
  if (poster) video.poster = poster.startsWith('/') ? assetUrl(poster) : poster;
  $('#teaser-slot').replaceChildren(video);
  teaser.hidden = false;
}

function renderPresave(): void {
  const links = released ? listeningLinks : presaveLinks;
  if (released) {
    text('#presave-title', 'LISTEN TO PSICOZ.');
    text('#presave-description', 'Escolha um serviço de música para ouvir o álbum.');
    text('#panel-release', 'O álbum está entre nós.');
    document.querySelectorAll<HTMLButtonElement>('[data-open-presave]').forEach((button) => {
      if (button.id === 'cover-button') button.setAttribute('aria-label', 'Abrir painel para ouvir psicoZ');
      else button.textContent = 'OUVIR PSICOZ ↗';
    });
    text('#presave-dialog > .small-note', 'Os links abrem serviços externos, que podem pedir autenticação.');
  }
  $('#presave-links').replaceChildren(...links.flatMap(({ label, url }) => {
    const valid = safeUrl(url);
    if (valid) {
      const link = externalLink(label, valid);
      link.className = 'service-link';
      return [link];
    }
    return [];
  }));
  if (!links.some(({ url }) => safeUrl(url))) {
    const pending = document.createElement('p');
    pending.className = 'small-note';
    pending.textContent = 'Nenhum serviço aprovado para exibição pública neste momento.';
    $('#presave-links').append(pending);
  }
}

function renderCollection(): void {
  const progress = store.getSnapshot();
  text('#collection-count', `${progress.unlockedTrackIds.length} de ${tracks.length} faixas conquistadas no jogo`);
  text('#collection-status', progress.nfcUnlocked
    ? 'NFC ACCESS liberado neste navegador. Isso abre acesso aos materiais publicados, mas não marca fases como completas.'
    : 'PLAY → COMPLETE → UNLOCK. Complete experiências para registrar conquistas; a edição NFC libera acesso aos materiais publicados.');
  const completedGames = progress.completedLevelIds.length;
  $('#collection-stats').replaceChildren(...[
    ['TRACKS', `${progress.unlockedTrackIds.length} / ${tracks.length}`],
    ['ARTWORKS', `${progress.collectibles.filter((item) => item.includes('art')).length} / ${artworkTotal()}`],
    ['GAMES', `${completedGames} / ${tracks.length}`],
    ['SECRETS', `${progress.collectibles.filter((item) => item.includes('secret')).length} / ??`],
  ].map(([label, value]) => {
    const card = document.createElement('div');
    card.className = 'collection-stat';
    const strong = document.createElement('strong');
    strong.textContent = value;
    const span = document.createElement('span');
    span.textContent = label;
    card.append(strong, span);
    return card;
  }));
  $('#rewards-list').replaceChildren(...rewards.map((reward, index) => {
    const access = getAccess(reward, progress);
    const row = document.createElement('li');
    row.className = 'reward';
    row.dataset.rewardId = reward.id;
    const number = document.createElement('span');
    number.className = 'reward-index';
    number.textContent = reward.kind === 'track' ? String(index + 1).padStart(2, '0') : '✧';
    const copy = document.createElement('div');
    copy.className = 'reward-copy';
    const name = document.createElement('p');
    name.className = 'reward-name';
    name.textContent = reward.label;
    const detail = document.createElement('small');
    detail.textContent = access.unlocked ? (progress.nfcUnlocked ? 'NFC ACCESS' : 'COMPLETED') : 'LOCKED';
    if (reward.sizeBytes !== null) detail.textContent += ` · ${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(reward.sizeBytes / 1048576)} MiB`;
    copy.append(name, detail);
    const action = document.createElement(access.canDownload ? 'a' : 'span');
    action.className = access.canDownload ? 'download-link' : 'reward-action';
    if (action instanceof HTMLAnchorElement) {
      const url = safeUrl(reward.url, true)!;
      action.href = url.startsWith('/') ? assetUrl(url) : url;
      action.download = '';
      action.textContent = 'Baixar';
      action.setAttribute('aria-label', `Baixar ${reward.label}`);
    } else action.textContent = access.published ? 'PLAY TO UNLOCK' : 'SEALED';
    row.append(number, copy, action);
    return row;
  }));
  const storage = store.getStatus();
  text('#storage-status', storage.message ?? 'Seu progresso fica salvo apenas neste navegador.');
  if (storage.mode === 'memory') {
    text('#announcement', storage.message!);
    text('#collection-status', `${$('#collection-status').textContent} ${storage.message}`);
  }
  renderGameHub();
  applyMotion();
}

function artworkTotal(): number {
  return rewards.filter((reward) => reward.kind === 'artwork').length;
}

function renderGameHub(): void {
  const completed = new Set(store.getSnapshot().completedLevelIds);
  const conquered = tracks.filter((track) => track.levelId && completed.has(track.levelId)).length;
  text('#game-progress-count', `${conquered} / ${tracks.length}`);
  text('#game-progress-caption', `${conquered} de ${tracks.length} jogos conquistados`);
  const progress = $<HTMLProgressElement>('#game-progress');
  progress.max = tracks.length;
  progress.value = conquered;
  const list = $('#tracklist');
  // Keep the same links during progress updates so returning from a game restores focus.
  if (!list.childElementCount) list.append(...tracks.map((track) => {
    const config = getVendorGame(track.id);
    const card = document.createElement('li');
    card.className = 'game-card';
    card.dataset.gameTrack = track.id;
    card.dataset.trackId = track.id;
    const link = document.createElement('a');
    link.href = `#/jogar/${track.id}`;
    link.className = 'game-card-link';
    const title = track.title ?? `FILE_${String(track.number).padStart(2, '0')}`;
    const sleeve = document.createElement('div');
    sleeve.className = 'game-sleeve';
    sleeve.setAttribute('aria-hidden', 'true');
    const albumPrint = document.createElement('div');
    albumPrint.className = 'game-sleeve-art';
    albumPrint.style.backgroundImage = `url("${assetUrl('/assets/cover-dark-640.webp')}")`;
    albumPrint.style.backgroundPosition = `${(track.number % 4) * 32}% ${(track.number % 3) * 45}%`;
    const number = document.createElement('span');
    number.className = 'game-card-number';
    number.textContent = String(track.number).padStart(2, '0');
    number.setAttribute('aria-hidden', 'true');
    const screen = document.createElement('div');
    screen.className = 'game-screen';
    const thumbnail = document.createElement('img');
    thumbnail.className = 'game-thumbnail';
    thumbnail.src = assetUrl(`/assets/game-thumbs/${config?.slug ?? 'maze'}.jpg`);
    thumbnail.alt = '';
    thumbnail.width = 720;
    thumbnail.height = 450;
    thumbnail.loading = 'lazy';
    thumbnail.decoding = 'async';
    const fallback = document.createElement('span');
    fallback.className = 'game-thumb-fallback';
    fallback.textContent = config?.genre ?? 'Minigame';
    thumbnail.addEventListener('error', () => { thumbnail.hidden = true; screen.dataset.unavailable = 'true'; });
    thumbnail.addEventListener('load', () => { thumbnail.hidden = false; delete screen.dataset.unavailable; });
    screen.append(fallback, thumbnail);
    sleeve.append(albumPrint, screen);
    const copy = document.createElement('div');
    copy.className = 'game-card-copy';
    const meta = document.createElement('div');
    meta.className = 'game-card-meta';
    const kind = document.createElement('span');
    kind.className = 'game-card-genre';
    kind.textContent = config?.genre ?? 'Minigame';
    const status = document.createElement('span');
    status.className = 'game-card-status';
    meta.append(kind, status);
    const heading = document.createElement('h3');
    heading.className = 'track-name';
    heading.textContent = title;
    const credits = document.createElement('span');
    credits.className = 'track-credit';
    credits.textContent = track.credits ?? '';
    credits.hidden = !track.credits;
    const objective = document.createElement('p');
    objective.className = 'game-card-objective';
    objective.textContent = config?.objective ?? 'Explore o minigame desta faixa.';
    const footer = document.createElement('div');
    footer.className = 'game-card-footer';
    const music = document.createElement('span');
    music.className = 'game-card-audio';
    music.textContent = '';
    const mobileKind = document.createElement('span');
    mobileKind.className = 'game-card-mobile-kind';
    mobileKind.textContent = config?.genre ?? 'Minigame';
    const trackMeta = document.createElement('p');
    trackMeta.className = 'game-card-track-meta';
    trackMeta.append(mobileKind, music);
    const action = document.createElement('span');
    action.className = 'game-card-action';
    const label = document.createElement('span');
    label.className = 'game-card-action-label';
    const arrow = document.createElement('span');
    arrow.className = 'game-card-play';
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden', 'true');
    action.append(label, arrow);
    footer.append(action, status);
    meta.append(objective);
    copy.append(heading, credits, trackMeta);
    link.append(number, sleeve, copy, meta, footer);
    card.append(link);
    return card;
  }));
  for (const track of tracks) {
    const card = list.querySelector<HTMLElement>(`[data-game-track="${track.id}"]`)!;
    const recovered = track.levelId !== null && completed.has(track.levelId);
    card.dataset.recovered = String(recovered);
    const title = track.title ?? `FILE_${String(track.number).padStart(2, '0')}`;
    card.querySelector('a')!.setAttribute('aria-label', `${recovered ? 'Jogar novamente' : 'Jogar'}: ${title}`);
    card.querySelector('.game-card-status')!.textContent = recovered ? 'COMPLETED' : 'AVAILABLE';
    card.querySelector('.game-card-action-label')!.textContent = recovered ? 'REPLAY' : 'ENTER';
  }
}

function applyMotion(): void {
  const reduce = store.getSnapshot().preferences.reducedMotion ?? motionQuery.matches;
  document.documentElement.dataset.reducedMotion = String(reduce);
  $<HTMLInputElement>('#reduce-motion').checked = reduce;
}

const presaveDialog = $<HTMLDialogElement>('#presave-dialog');
const resetDialog = $<HTMLDialogElement>('#reset-dialog');
const collectionPopover = $('#collection-popover');
const collectionTriggers = [...document.querySelectorAll<HTMLButtonElement>('[data-open-collection]')];
let previousFocus: HTMLElement | null = null;
let previousCollectionFocus: HTMLElement | null = null;
function closeCollection(): void {
  if (collectionPopover.hidden) return;
  collectionPopover.hidden = true;
  collectionTriggers.forEach((trigger) => trigger.setAttribute('aria-expanded', 'false'));
  previousCollectionFocus?.focus();
}
function openCollection(): void {
  previousCollectionFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  collectionPopover.hidden = false;
  collectionTriggers.forEach((trigger) => trigger.setAttribute('aria-expanded', 'true'));
  collectionPopover.querySelector<HTMLButtonElement>('[data-close-collection]')?.focus();
}
function openDialog(dialog: HTMLDialogElement): void {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  dialog.showModal();
  dialog.querySelector<HTMLButtonElement>('[data-close-dialog]')?.focus();
}
for (const dialog of [presaveDialog, resetDialog]) {
  dialog.querySelectorAll<HTMLButtonElement>('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('close', () => previousFocus?.focus());
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]')]
      .filter((element) => !element.hidden && element.getClientRects().length > 0);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (first && last && (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  } });
}
document.querySelectorAll<HTMLButtonElement>('[data-open-presave]').forEach((button) => button.addEventListener('click', () => {
  trackEvent(released ? 'spotify_click' : 'presave_click', { source: button.id || 'cta' });
  openDialog(presaveDialog);
}));
document.querySelectorAll<HTMLElement>('[data-enter-psicoz]').forEach((link) => link.addEventListener('click', () => trackEvent('enter_psicoz')));
collectionTriggers.forEach((button) => {
  button.setAttribute('aria-controls', 'collection-popover');
  button.setAttribute('aria-expanded', 'false');
  button.addEventListener('click', () => {
    if (collectionPopover.hidden) trackEvent('collection_open');
    collectionPopover.hidden ? openCollection() : closeCollection();
  });
});
collectionPopover.querySelector<HTMLButtonElement>('[data-close-collection]')?.addEventListener('click', closeCollection);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeCollection(); });
document.addEventListener('click', (event) => {
  const target = event.target;
  if (collectionPopover.hidden || !(target instanceof Node)) return;
  if (collectionPopover.contains(target) || collectionTriggers.some((trigger) => trigger.contains(target))) return;
  closeCollection();
});
$('#reset-progress').addEventListener('click', () => openDialog(resetDialog));
$('#confirm-reset').addEventListener('click', () => {
  store.reset();
  // Avoid immediately restoring access on reload of the same NFC visit after an explicit reset.
  const url = new URL(location.href);
  url.searchParams.delete('edition');
  history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  renderCollection();
  resetDialog.close();
  text('#announcement', 'O progresso de psicoZ foi apagado neste navegador.');
});
$<HTMLInputElement>('#reduce-motion').addEventListener('change', (event) => {
  store.setReducedMotion((event.currentTarget as HTMLInputElement).checked);
  renderCollection();
});
motionQuery.addEventListener('change', applyMotion);

const gameEntry = createGameEntry(store, renderCollection);
function handleRoute(): void {
  document.querySelectorAll<HTMLAnchorElement>('.album-tabs a').forEach((link) => {
    if (link.hash === location.hash || (link.hash === '#faixas' && (location.hash === '#jogo' || location.hash.startsWith('#/jogar/')))) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  const trackId = /^#\/jogar\/(track-\d{2})$/u.exec(location.hash)?.[1];
  const playable = trackId && tracks.some((track) => track.id === trackId && levels.some((level) => level.id === track.levelId && level.available));
  if (playable) {
    trackEvent('game_start', { trackId });
    void gameEntry.open(trackId);
  } else {
    gameEntry.close();
    if (location.hash.startsWith('#/jogar/')) {
      history.replaceState(null, '', `${location.pathname}${location.search}#jogo`);
      $('#jogo').scrollIntoView();
      text('#announcement', 'Jogo não encontrado. Escolha uma das 15 faixas para jogar.');
    }
  }
}
window.addEventListener('hashchange', handleRoute);

$<HTMLFormElement>('#signup-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const email = $<HTMLInputElement>('#signup-email');
  if (!email.validity.valid) {
    text('#signup-status', 'Digite um e-mail válido para entrar.');
    email.focus();
    return;
  }
  trackEvent('email_signup', { state: 'email_confirmation_pending' });
  text('#signup-status', 'CONFIRME SEU E-MAIL. Enviaremos um link quando o endpoint double opt-in estiver conectado.');
  email.value = '';
});

// Optional art failure keeps the rest of the page and the cover's textual action usable.
document.querySelectorAll<HTMLImageElement>('main img').forEach((image) => {
  const onError = () => {
    if (image.dataset.failed === 'true') return;
    image.dataset.failed = 'true';
    image.hidden = true;
    const box = document.createElement('div');
    box.className = 'image-failure';
    box.setAttribute('role', 'status');
    const message = document.createElement('p');
    message.textContent = 'Esta arte não carregou. Você pode continuar explorando a página.';
    const retry = document.createElement('button');
    retry.className = 'button secondary';
    retry.textContent = 'Tentar carregar a arte';
    retry.addEventListener('click', () => {
      const attempt = new AbortController();
      retry.disabled = true;
      message.textContent = 'Carregando a arte…';
      image.hidden = false;
      image.addEventListener('load', () => {
        attempt.abort();
        const focusTarget = image.closest('button') ?? image;
        if (!(focusTarget instanceof HTMLButtonElement)) focusTarget.tabIndex = -1;
        focusTarget.focus();
        box.remove();
        image.dataset.failed = 'false';
      }, { once: true, signal: attempt.signal });
      image.addEventListener('error', () => {
        attempt.abort();
        image.hidden = true;
        message.textContent = 'A arte continua indisponível. Tente novamente quando sua conexão estiver estável.';
        retry.disabled = false;
        retry.focus();
      }, { once: true, signal: attempt.signal });
      const originalSrc = image.getAttribute('src')!;
      const originalSrcset = image.getAttribute('srcset');
      image.removeAttribute('srcset');
      image.src = originalSrc;
      if (originalSrcset) image.srcset = originalSrcset;
    });
    box.append(message, retry);
    (image.closest('button') ?? image).insertAdjacentElement('afterend', box);
  };
  image.addEventListener('error', onError);
  if (image.complete && image.naturalWidth === 0) onError();
});

renderPresave();
renderCountdown();
window.setInterval(renderCountdown, 1000);
renderTeaser();
renderCollection();
handleRoute();

