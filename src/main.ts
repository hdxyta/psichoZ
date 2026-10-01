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
const released = album.releaseStatus === 'released';
const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' }).format(new Date(`${album.releaseDate}T12:00:00Z`));
const dateElement = $<HTMLTimeElement>('#release-date');
dateElement.dateTime = album.releaseDate;
dateElement.textContent = date;
text('#release-label', released ? 'Álbum lançado' : 'Lançamento planejado');

// A shared tag URL grants access only. It never fabricates a completed level.
if (new URLSearchParams(location.search).get('edition') === 'nfc') {
  store.updateNfc();
  history.replaceState(null, '', `${location.pathname}${location.search}#colecao`);
  requestAnimationFrame(() => $('#colecao').scrollIntoView());
}

if (album.concept) { text('#album-concept', album.concept); $('#album-concept').classList.remove('pending-copy'); }
if (artist.name) text('#artist-name', artist.name);
if (artist.bio) text('#artist-bio', artist.bio);
const approvedArtistLinks = artist.links.filter((link) => safeUrl(link.url));
if (approvedArtistLinks.length || safeUrl(artist.contactUrl)) {
  $('#artist-links').replaceChildren(...approvedArtistLinks.map(({ label, url }) => externalLink(label, safeUrl(url)!)));
}
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

function renderPresave(): void {
  const links = released ? listeningLinks : presaveLinks;
  if (released) {
    text('#presave-title', 'Dê o play em psicoZ.');
    text('#presave-description', 'Escolha um serviço de música para ouvir o álbum.');
    text('#panel-release', 'O álbum está entre nós.');
    document.querySelectorAll<HTMLButtonElement>('[data-open-presave]').forEach((button) => {
      if (button.id === 'cover-button') button.setAttribute('aria-label', 'Abrir painel para ouvir psicoZ');
      else button.textContent = 'Ouvir o álbum ↗';
    });
    text('#presave-dialog > .small-note', 'Os links abrem serviços externos, que podem pedir autenticação.');
  }
  $('#presave-links').replaceChildren(...links.map(({ label, url }) => {
    const valid = safeUrl(url);
    if (valid) {
      const link = externalLink(label, valid);
      link.className = 'service-link';
      return link;
    }
    const button = document.createElement('button');
    button.className = 'service-link';
    button.disabled = true;
    button.append(document.createTextNode(label));
    const note = document.createElement('small');
    note.textContent = 'Link a anunciar';
    button.append(note);
    return button;
  }));
  if (!links.some(({ url }) => safeUrl(url))) {
    const pending = document.createElement('p');
    pending.className = 'pending-copy';
    pending.textContent = 'Os links oficiais ainda não foram fornecidos. Volte aqui para acompanhar.';
    $('#presave-links').append(pending);
  }
}

function renderCollection(): void {
  const progress = store.getSnapshot();
  text('#collection-count', `${progress.unlockedTrackIds.length} de ${tracks.length} faixas conquistadas no jogo`);
  text('#collection-status', progress.nfcUnlocked
    ? 'Acesso da edição NFC liberado neste navegador. Os arquivos ainda não publicados aparecem como “Em breve”.'
    : 'Cada faixa tem um jogo. Complete os objetivos para registrar suas conquistas; a edição NFC libera acesso aos materiais publicados. Seu progresso fica salvo neste navegador.');
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
    detail.textContent = access.unlocked ? (progress.nfcUnlocked ? 'Acesso via NFC' : 'Conquistado no jogo') : 'Acesso ainda não conquistado';
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
    } else action.textContent = access.published ? 'Jogue para conquistar' : 'Em breve';
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
    const title = track.title ?? `Faixa ${track.number} — título a anunciar`;
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
    music.textContent = 'Áudio em breve';
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
    const title = track.title ?? `Faixa ${track.number} — título a anunciar`;
    card.querySelector('a')!.setAttribute('aria-label', `${recovered ? 'Jogar novamente' : 'Jogar'}: ${title}`);
    card.querySelector('.game-card-status')!.textContent = recovered ? 'Conquistada ✓' : '';
    card.querySelector('.game-card-action-label')!.textContent = recovered ? 'Jogar de novo' : 'Jogar';
  }
}

function applyMotion(): void {
  const reduce = store.getSnapshot().preferences.reducedMotion ?? motionQuery.matches;
  document.documentElement.dataset.reducedMotion = String(reduce);
  $<HTMLInputElement>('#reduce-motion').checked = reduce;
}

const presaveDialog = $<HTMLDialogElement>('#presave-dialog');
const resetDialog = $<HTMLDialogElement>('#reset-dialog');
let previousFocus: HTMLElement | null = null;
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
document.querySelectorAll<HTMLButtonElement>('[data-open-presave]').forEach((button) => button.addEventListener('click', () => openDialog(presaveDialog)));
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
renderCollection();
handleRoute();

