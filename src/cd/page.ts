import '../styles/main.css';
import '../styles/reference-mix.css';
import './styles.css';
import { assetUrl } from '../config/site';
import { CDAPIError, cdRequest, escapeHTML, type CollectorCatalog } from './api';
import { createAlbumPlayer } from './player';

const main = document.querySelector<HTMLElement>('#cd-main')!;
let disposePlayer: (() => void) | undefined;
let authenticated = false;
let checking = false;
const art = `<div class="cd-art-frame"><img src="${escapeHTML(assetUrl('assets/cover-dark-1200.webp'))}" srcset="${escapeHTML(assetUrl('assets/cover-dark-640.webp'))} 640w, ${escapeHTML(assetUrl('assets/cover-dark-1200.webp'))} 1200w" sizes="(max-width: 700px) 85vw, 44vw" width="1200" height="1200" fetchpriority="high" alt="Capa de psicoZ: desenhos vermelhos de olhos, mãos e correntes sobre preto." /><span class="cd-art-fallback" hidden>psicoZ<br><small>Arte indisponível no momento</small></span></div>`;
function prepareImages() {
  main.querySelectorAll<HTMLImageElement>('.cd-art-frame img').forEach((image) => {
    const fallback = () => { image.hidden = true; image.nextElementSibling?.removeAttribute('hidden'); };
    image.addEventListener('error', fallback, { once: true });
    if (image.complete && !image.naturalWidth) fallback();
  });
}
function showLogin(message = '', focus = false) {
  authenticated = false; disposePlayer?.(); disposePlayer = undefined;
  main.innerHTML = `<section class="cd-access" aria-labelledby="cd-access-title"><figure class="cd-access-art">${art}<figcaption><span>PSZ / PHYSICAL / 2026</span><span>OBJECT → ACCESS</span></figcaption><p class="cd-art-note">Uma cópia física.<br>Outra parte do universo.</p></figure><div class="cd-access-copy"><p class="section-label"><span class="cd-signal" aria-hidden="true"></span> RESERVED FOR THE PHYSICAL COPY</p><h1 id="cd-access-title">psicoZ</h1><p class="cd-access-subtitle">COLLECTOR ACCESS</p><p class="cd-access-lead">Você encontrou a área reservada para quem possui uma cópia física de PsicoZ.</p><form id="cd-login"><label for="cd-code">Digite o código localizado atrás do seu CD.</label><div class="cd-code-input"><input id="cd-code" name="code" type="password" autocomplete="current-password" autocapitalize="none" spellcheck="false" maxlength="128" required aria-describedby="cd-access-feedback" placeholder="Código da edição física" /><button type="button" class="cd-reveal" aria-label="Mostrar código" aria-pressed="false">VER</button></div><button class="button primary cd-unlock" type="submit">DESBLOQUEAR <span aria-hidden="true">↗</span></button><p id="cd-access-feedback" class="cd-feedback" role="status">${escapeHTML(message)}</p></form><p class="small-note cd-access-note">Esta área contém acesso ao álbum, downloads e conteúdos reservados aos proprietários da edição física.</p><div class="cd-access-stamp"><span>YTA // PSICOZ</span><span>PHYSICAL MEDIA INTERFACE</span></div></div></section>`;
  prepareImages();
  const form = main.querySelector<HTMLFormElement>('form')!;
  const input = main.querySelector<HTMLInputElement>('#cd-code')!;
  const feedback = main.querySelector<HTMLElement>('#cd-access-feedback')!;
  const button = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
  const reveal = main.querySelector<HTMLButtonElement>('.cd-reveal')!;
  reveal.addEventListener('click', () => { const show = input.type === 'password'; input.type = show ? 'text' : 'password'; reveal.textContent = show ? 'OCULTAR' : 'VER'; reveal.setAttribute('aria-pressed', String(show)); reveal.setAttribute('aria-label', show ? 'Ocultar código' : 'Mostrar código'); });
  input.addEventListener('input', () => input.removeAttribute('aria-invalid'));
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); if (button.disabled) return;
    const code = input.value;
    button.disabled = true; input.disabled = true;
    feedback.textContent = 'Verificando código…';
    try {
      await cdRequest('/api/cd-access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
      input.value = '';
      feedback.textContent = 'ACCESS GRANTED';
      main.classList.add('cd-granted');
      await new Promise((resolve) => setTimeout(resolve, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650));
      main.classList.remove('cd-granted');
      await showCollector();
    } catch (error) {
      feedback.textContent = error instanceof CDAPIError && error.status === 401 ? 'ACCESS DENIED — Código inválido. Confira o verso do CD e tente novamente.'
        : error instanceof CDAPIError && error.status === 429 ? 'Muitas tentativas. Aguarde um minuto e tente novamente.'
        : 'O acesso está indisponível agora. Tente novamente em instantes.';
      input.setAttribute('aria-invalid', String(error instanceof CDAPIError && error.status === 401));
      button.disabled = false; input.disabled = false; input.focus();
    }
  });
  if (focus) input.focus();
}
async function showCollector() {
  const catalog = await cdRequest<CollectorCatalog>('/api/cd-catalog');
  authenticated = true;
  main.innerHTML = `<section class="cd-intro" aria-labelledby="cd-title"><div class="cd-intro-copy"><p class="section-label">ACCESS GRANTED / PHYSICAL EDITION</p><h1 id="cd-title" tabindex="-1">psicoZ</h1><p class="cd-access-subtitle">Obrigado por fazer parte disso.</p><p>Se você chegou até aqui, uma cópia física de PsicoZ chegou até você.</p><p>Esse disco não termina no arquivo. Ele continua no papel, nos desenhos, no objeto que agora está nas suas mãos. Esta parte do projeto foi feita para acompanhar essa cópia.</p><p>Coloca pra tocar. Guarda o que fizer sentido.<br>Volta quando quiser.</p><span class="cd-signature">— YTA</span><a class="text-link" href="#cd-player">OUVIR O DISCO <span aria-hidden="true">↓</span></a></div><figure class="cd-collector-art">${art}<figcaption><span>PSICOZ // PHYSICAL COPY</span><span>15 POSIÇÕES</span></figcaption></figure></section><section id="cd-player" class="cd-player" aria-label="Player do álbum"></section><section class="cd-physical" aria-labelledby="cd-physical-title"><p class="section-label">O OBJETO TAMBÉM FAZ PARTE.</p><div><h2 id="cd-physical-title">Pra ter nas mãos.</h2><p>Em meio a tanto arquivo, stream e algoritmo, essa edição existe para devolver algo físico ao processo. O CD, a arte, o NFC e esta página são partes da mesma experiência.</p><p>A música atravessa tudo isso. O objeto fica com você.</p></div></section><footer class="cd-footer"><a class="text-link" href="/">← Voltar para PsicoZ</a><span class="cd-code">YTA // PSZ // PHYSICAL</span><button class="text-link cd-logout">Sair desta edição</button><p class="cd-feedback" role="status" id="cd-session-feedback"></p></footer>`;
  prepareImages();
  disposePlayer?.();
  disposePlayer = createAlbumPlayer(main.querySelector('#cd-player')!, catalog, () => showLogin('Sua sessão expirou. Digite o código do CD para entrar novamente.', true));
  main.querySelector<HTMLElement>('#cd-title')!.focus({ preventScroll: true });
  main.querySelector<HTMLButtonElement>('.cd-logout')!.addEventListener('click', async (event) => {
    const button = event.currentTarget as HTMLButtonElement; button.disabled = true;
    try { await cdRequest('/api/cd-logout', { method: 'POST' }); showLogin('Você saiu desta edição.', true); }
    catch { main.querySelector('#cd-session-feedback')!.textContent = 'Não foi possível sair. Tente novamente.'; button.disabled = false; }
  });
}
async function checkSession(initial = false) {
  if (checking || (!initial && !authenticated)) return;
  checking = true;
  try { await cdRequest('/api/cd-session'); if (initial) await showCollector(); }
  catch (error) {
    if (initial || (error instanceof CDAPIError && error.status === 401)) showLogin(error instanceof CDAPIError && error.status === 401 ? (initial ? '' : 'Sua sessão expirou. Digite o código do CD novamente.') : 'O acesso está indisponível agora. Tente novamente em instantes.');
  } finally { checking = false; }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) void checkSession(); });
window.addEventListener('focus', () => void checkSession());
setInterval(() => { if (!document.hidden) void checkSession(); }, 5 * 60 * 1000);
window.addEventListener('pagehide', () => { disposePlayer?.(); });
window.addEventListener('pageshow', (event) => { if (event.persisted) location.reload(); });
void checkSession(true);
