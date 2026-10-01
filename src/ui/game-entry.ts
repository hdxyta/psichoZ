import type { ProgressStore } from '../state/progress';
import { tracks } from '../data/catalog';
import { getVendorGame } from '../data/vendor-games';
import type { TrackId } from '../data/models';

/** Home-side gateway: only the selected engine family is imported when opening a game. */
export function createGameEntry(store: ProgressStore, refreshCollection: () => void) {
  let dialog: HTMLDialogElement | null = null;
  let session: { dispose(): void; pause(): void } | null = null;
  let version = 0;
  let currentTrack: TrackId | null = null;
  let previousFocus: HTMLElement | null = null;
  function close() {
    version++; session?.dispose(); session = null;
    dialog?.close(); dialog?.remove(); dialog = null; currentTrack = null;
    document.body.classList.remove('game-open');
    if (previousFocus?.isConnected) previousFocus.focus(); previousFocus = null;
  }
  async function open(trackId: string = 'track-01') {
    if (dialog && currentTrack === trackId) return;
    if (dialog) close();
    const track = tracks.find(item => item.id === trackId);
    if (!track?.levelId) return;
    const request = ++version; currentTrack = track.id;
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const currentDialog = document.createElement('dialog'); dialog = currentDialog;
    const trackName = track.title ?? `FILE_${String(track.number).padStart(2, '0')}`;
    currentDialog.id = 'game-dialog'; currentDialog.className = 'game-dialog';
    currentDialog.setAttribute('aria-label', `${trackName} — fase ${track.number}`);
    function loading(message: string) {
      currentDialog.innerHTML = '<div class="game-loading"><p class="section-label">psicoZ / jogos do álbum</p><h2></h2><p role="status"></p><button class="button secondary" data-loading-exit>Voltar aos jogos</button></div>';
      currentDialog.querySelector('h2')!.textContent = trackName;
      currentDialog.querySelector('[role="status"]')!.textContent = message;
      currentDialog.querySelector('[data-loading-exit]')!.addEventListener('click', () => { location.hash = 'jogo'; });
    }
    loading('Preparando a experiência…');
    document.body.append(currentDialog); document.body.classList.add('game-open'); currentDialog.showModal();
    currentDialog.querySelector<HTMLButtonElement>('button')!.focus();
    currentDialog.addEventListener('cancel', event => { event.preventDefault(); if (session) session.pause(); else location.hash = 'jogo'; });
    const options = {
      onExit: (collection?: boolean) => { location.hash = collection ? 'colecao' : 'jogo'; },
      onWin: (collectibles: string[]) => {
        store.completeLevel(track.levelId!, collectibles); refreshCollection();
        return store.getStatus().message ?? 'Conquista salva neste navegador.';
      },
      reducedMotion: () => document.documentElement.dataset.reducedMotion === 'true',
      setReducedMotion: (value: boolean) => { store.setReducedMotion(value); refreshCollection(); },
    };
    try {
      const { mountVendorGame } = await import('../game/vendor/runtime');
      if (request !== version) return;
      const config = getVendorGame(trackId); if (!config) throw new Error('Fase sem configuração');
      session = mountVendorGame(currentDialog, config, options);
    } catch {
      if (request !== version) return;
      session?.dispose(); session = null;
      loading('Não foi possível carregar a fase. A home e a coleção continuam disponíveis.');
      const retry = document.createElement('button'); retry.className = 'button primary'; retry.textContent = 'Tentar novamente';
      retry.onclick = () => { close(); void open(trackId); };
      currentDialog.querySelector('.game-loading')!.append(retry); retry.focus();
    }
  }
  return { open, close };
}

