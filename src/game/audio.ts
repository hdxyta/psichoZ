import { assetUrl } from '../config/site';

/** Original test drone, distinct from Woodstock. Nothing is requested until sound is enabled. */
export function createGameAudio(notify: (message: string) => void) {
  const music = new Audio();
  music.preload = 'none'; music.loop = true; music.volume = .3;
  let context: AudioContext | null = null;
  let effectsVolume = .3;
  let enabled = false;
  let disposed = false;
  let generation = 0;
  music.addEventListener('error', () => { if (!disposed) notify('O áudio de teste não carregou. Você pode continuar sem som.'); });
  return {
    resume(sound: boolean) {
      enabled = sound; const request = ++generation;
      if (!sound) { music.pause(); void context?.suspend(); return; }
      try {
        if (!music.src) music.src = assetUrl('/audio/woodstock-demo-v1.wav');
        if (!context) context = new AudioContext();
        void context.resume().catch(() => notify('Efeitos de som indisponíveis. O jogo continua sem eles.'));
        void music.play().then(() => { if (disposed || !enabled || request !== generation) music.pause(); }).catch(() => {
          if (!disposed && enabled && request === generation) notify('O navegador não iniciou o áudio. Retome a partida ou jogue sem som.');
        });
      } catch { notify('Áudio indisponível neste navegador. Você pode jogar sem som.'); }
    },
    pause() { enabled = false; generation++; music.pause(); void context?.suspend(); },
    setVolumes(musicVolume: number, effects: number) { music.volume = musicVolume; effectsVolume = effects; },
    effect(kind: 'shot' | 'collect' | 'damage' | 'win' | 'scan') {
      if (!enabled || !context || context.state !== 'running') return;
      const oscillator = context.createOscillator(); const gain = context.createGain();
      const now = context.currentTime;
      oscillator.type = kind === 'shot' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(kind === 'collect' ? 660 : kind === 'win' ? 880 : kind === 'damage' ? 90 : kind === 'scan' ? 220 : 180, now);
      oscillator.frequency.exponentialRampToValueAtTime(kind === 'shot' ? 45 : kind === 'scan' ? 660 : 330, now + .17);
      gain.gain.setValueAtTime(effectsVolume * .14, now); gain.gain.exponentialRampToValueAtTime(.001, now + .23);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(now + .25);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      if (kind === 'collect' || kind === 'win') {
        for (const [index, frequency] of [440, 554.37, 659.25, 880].entries()) {
          const tone = context.createOscillator(); const envelope = context.createGain();
          const start = now + index * .09;
          tone.type = 'sine'; tone.frequency.value = frequency;
          envelope.gain.setValueAtTime(0, start); envelope.gain.linearRampToValueAtTime(effectsVolume * .09, start + .015);
          envelope.gain.exponentialRampToValueAtTime(.001, start + .38);
          tone.connect(envelope); envelope.connect(context.destination); tone.start(start); tone.stop(start + .4);
          tone.onended = () => { tone.disconnect(); envelope.disconnect(); };
        }
      }
    },
    dispose() { disposed = true; enabled = false; generation++; music.pause(); music.removeAttribute('src'); music.load(); void context?.close(); },
  };
}
