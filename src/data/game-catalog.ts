import type { ArcadeConfig } from '../game/arcade/types';
import { tracks } from './catalog';

/** Game fiction and mechanics are independent of the unreleased audio and lyrics. */
const ARCADE_DESIGNS: ReadonlyArray<Omit<ArcadeConfig, 'title'>> = [
  {
    trackId: 'track-02', kind: 'explore', subtitle: 'Arquivo proibido', duration: 120, seed: 2,
    objective: 'Encontre os quatro arquivos e alcance a porta da cidade.',
    instructions: 'Mova-se com WASD, setas, direcional de toque ou apontando e arrastando. Evite a grade elétrica; você tem três vidas.',
  },
  {
    trackId: 'track-03', kind: 'runner', subtitle: 'Corra do silêncio', duration: 90, seed: 3,
    objective: 'Atravesse 16 grades e buracos até o fim do percurso.',
    instructions: 'A corrida é automática. Espaço, W, seta para cima, clique ou ação pula. Os olhos são bônus: a fuga é o objetivo.',
  },
  {
    trackId: 'track-04', kind: 'arena', subtitle: 'Ritual de ruptura', duration: 120, seed: 4,
    objective: 'Interrompa oito sentinelas e sobreviva à arena.',
    instructions: 'WASD, setas ou direcional de toque movem. Mire e clique para disparar. Espaço ou ação dispara com mira automática quando não há ponteiro. Você tem cinco vidas.',
  },
  {
    trackId: 'track-05', kind: 'platform', subtitle: 'Entre as falhas', duration: 120, seed: 5,
    objective: 'Recupere os oito olhos das plataformas e alcance a porta final.',
    instructions: 'A/D, setas ou toque movem. Espaço, cima, clique ou ação pula; Shift ou ação secundária dá um impulso.',
  },
  {
    trackId: 'track-06', kind: 'memory', subtitle: 'Duplo negativo', duration: 120, seed: 6,
    objective: 'Encontre os seis pares escondidos sem esgotar as tentativas.',
    instructions: 'Observe a revelação inicial. Clique ou toque em duas cartas para virá-las; Tab e Enter também funcionam. Você pode errar até 13 vezes.',
  },
  {
    trackId: 'track-07', kind: 'drive', subtitle: 'Estrada sem voz', duration: 90, seed: 7,
    objective: 'Desvie de 16 barricadas, pegue 12 olhos e chegue ao fim da estrada.',
    instructions: 'Mude de faixa com A/D, setas, toque no direcional ou clique na pista desejada.',
  },
  {
    trackId: 'track-08', kind: 'circuit', subtitle: 'Curto-circuito', duration: 120, seed: 8,
    objective: 'Deixe os nove selos vermelhos em até 24 movimentos.',
    instructions: 'Cada selo alterna a própria cor e a dos vizinhos acima, abaixo e dos lados. Clique, toque ou use Tab e Enter.',
  },
  {
    trackId: 'track-09', kind: 'arena', subtitle: 'Cerco vermelho', duration: 120, seed: 9,
    objective: 'Interrompa 12 sentinelas e encerre o cerco.',
    instructions: 'Mova-se com WASD, setas ou toque. Mire e clique ou use Espaço/ação para disparar. Sem ponteiro, a mira é automática. Você tem cinco vidas.',
  },
  {
    trackId: 'track-10', kind: 'rhythm', subtitle: 'Pulso interrompido', duration: 40, seed: 10,
    objective: 'Acerte pelo menos 18 dos 24 pulsos na zona vermelha.',
    instructions: 'Espaço, clique ou toque marca o pulso quando ele cruza a faixa vermelha. Ritmo visual demonstrativo; o áudio oficial está pendente.',
  },
  {
    trackId: 'track-11', kind: 'chase', subtitle: 'Caçada na contramão', duration: 90, seed: 11,
    objective: 'Escape da perseguição atravessando 16 grades e buracos.',
    instructions: 'Espaço, cima, clique ou ação pula. Shift ou ação secundária dá impulso. Esquerda e direita ajustam a velocidade da corrida.',
  },
  {
    trackId: 'track-12', kind: 'boss', subtitle: 'A última voz', duration: 120, seed: 12,
    objective: 'Acerte 28 impactos no núcleo e sobreviva aos projéteis.',
    instructions: 'Mova-se com WASD, setas ou toque. Mire e clique ou use Espaço/ação para disparar. Sem ponteiro, a mira é automática. Você tem cinco vidas.',
  },
  {
    trackId: 'track-13', kind: 'maze', subtitle: 'Quarteirão fechado', duration: 120, seed: 13,
    objective: 'Encontre quatro arquivos e atravesse o labirinto até a porta.',
    instructions: 'Use WASD, setas, direcional de toque ou apontar e arrastar. Espere as três grades elétricas desativarem antes de atravessar. Você tem três vidas.',
  },
  {
    trackId: 'track-14', kind: 'sequence', subtitle: 'Não quebre o rito', duration: 120, seed: 14,
    objective: 'Repita quatro sequências, de três até seis símbolos.',
    instructions: 'Espere a demonstração e repita na mesma ordem. Clique, toque ou use Tab e Enter. O terceiro erro encerra a tentativa.',
  },
  {
    trackId: 'track-15', kind: 'finale', subtitle: 'O último selo', duration: 180, seed: 15,
    objective: 'Supere três provas: memória, circuito e sequência.',
    instructions: 'Encontre três pares, ative os nove selos e repita quatro símbolos. Siga cada etapa com clique, toque ou Tab e Enter.',
  },
];

export const ARCADE_CONFIGS: ReadonlyArray<ArcadeConfig> = ARCADE_DESIGNS.map((config) => ({
  ...config,
  title: tracks.find((track) => track.id === config.trackId)?.title ?? 'FILE_15',
}));

export function getArcadeConfig(trackId: string): ArcadeConfig | undefined {
  return ARCADE_CONFIGS.find((config) => config.trackId === trackId);
}
