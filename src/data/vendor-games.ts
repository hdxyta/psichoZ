import { tracks } from './catalog';
import type { TrackId } from './models';
export interface VendorGame {
  trackId: TrackId; slug: string; genre: string; title: string; subtitle: string;
  objective: string; instructions: string; repository: string; sourceName: string; duration: number;
}
const definitions: Array<Omit<VendorGame, 'title'>> = [
  {trackId:'track-01',slug:'maze',genre:'Labirinto',subtitle:'O caminho perdido',objective:'Encontre a saída do labirinto.',instructions:'Use as setas, WASD ou os controles de toque para encontrar a saída.',repository:'https://github.com/wrksp8/TheLostPath',sourceName:'The Lost Path',duration:300},
  {trackId:'track-02',slug:'snake',genre:'Snake',subtitle:'Fome de sinal',objective:'Recolha seis sinais sem bater no próprio corpo.',instructions:'Mude de direção com as setas ou o direcional de toque.',repository:'https://github.com/varshney-himanshu/snake-game-js',sourceName:'Snake Game',duration:180},
  {trackId:'track-03',slug:'flappy',genre:'Voo entre obstáculos',subtitle:'Atravesse o silêncio',objective:'Passe por oito portais sem colidir.',instructions:'Clique, toque ou pressione Espaço para ganhar altura.',repository:'https://github.com/pyforgedev/flappy-bird',sourceName:'Flappy Bird',duration:180},
  {trackId:'track-04',slug:'pong',genre:'Pong',subtitle:'Duelo vermelho',objective:'Faça três pontos antes da raquete adversária.',instructions:'Mova sua raquete com as setas, o mouse ou o dedo.',repository:'https://github.com/jakesgordon/javascript-pong',sourceName:'JavaScript Pong',duration:300},
  {trackId:'track-05',slug:'tetris',genre:'Blocos em queda',subtitle:'Inverta a queda',objective:'Complete duas linhas antes de empilhar até o teto.',instructions:'Setas movem e giram; Espaço derruba a peça. Há botões de toque.',repository:'https://github.com/jakesgordon/javascript-tetris',sourceName:'JavaScript Tetris',duration:300},
  {trackId:'track-06',slug:'memory',genre:'Memória',subtitle:'Duplo negativo',objective:'Encontre os seis pares de símbolos.',instructions:'Clique ou toque em duas cartas. Memorize os pares que não combinarem.',repository:'https://github.com/makzan/HTML5-Games-Examples',sourceName:'CSS3 Matching / Makzan',duration:120},
  {trackId:'track-07',slug:'racer',genre:'Corrida na estrada',subtitle:'Estrada sem voz',objective:'Complete uma volta no circuito.',instructions:'Acelere, freie e vire com as setas ou os controles de toque.',repository:'https://github.com/jakesgordon/javascript-racer',sourceName:'JavaScript Racer',duration:300},
  {trackId:'track-08',slug:'untangle',genre:'Desatar nós',subtitle:'Nós do sinal',objective:'Desembarace duas redes sem deixar linhas cruzadas.',instructions:'Arraste os nós com o mouse ou dedo. Também pode selecionar um nó e movê-lo pelas setas.',repository:'https://github.com/makzan/HTML5-Games-Examples',sourceName:'Canvas Untangle / Makzan',duration:240},
  {trackId:'track-09',slug:'asteroids',genre:'Asteroids',subtitle:'Órbita do caos',objective:'Destrua os asteroides para recuperar o sinal.',instructions:'Gire, acelere e dispare com setas e Espaço, ou botões de toque.',repository:'https://github.com/dmcinnes/HTML5-Asteroids',sourceName:'HTML5 Asteroids',duration:240},
  {trackId:'track-10',slug:'breakout',genre:'Quebra de blocos',subtitle:'Ruptura',objective:'Quebre os 12 blocos antes de perder três vidas.',instructions:'Mova a raquete com mouse, toque ou setas. Lance a bola com Espaço ou o botão.',repository:'https://github.com/jakesgordon/javascript-breakout',sourceName:'JavaScript Breakout',duration:300},
  {trackId:'track-11',slug:'minesweeper',genre:'Campo minado',subtitle:'Não pise em falso',objective:'Revele as 56 casas seguras sem detonar as oito minas.',instructions:'Toque ou clique para revelar. Use a bandeira para marcar uma suspeita.',repository:'https://github.com/saiuttejr/GameBox',sourceName:'GameBox Minesweeper',duration:300},
  {trackId:'track-12',slug:'invaders',genre:'Invasores',subtitle:'A última voz',objective:'Elimine uma formação de invasores.',instructions:'Mova para os lados e dispare com setas e Espaço, ou pelos botões de toque.',repository:'https://github.com/dwmkerr/spaceinvaders',sourceName:'Space Invaders',duration:240},
  {trackId:'track-13',slug:'sokoban',genre:'Sokoban',subtitle:'Peso da cidade',objective:'Empurre as três caixas para os três alvos.',instructions:'Use as setas, WASD ou toque. Caixas só podem ser empurradas; use Desfazer quando precisar.',repository:'https://github.com/taniarascia/sokoban',sourceName:'Sokoban / Tania Rascia',duration:300},
  {trackId:'track-14',slug:'simon',genre:'Simon',subtitle:'Repita o rito',objective:'Repita quatro rodadas de sinais sem errar.',instructions:'Observe a sequência e repita clicando ou tocando nos símbolos.',repository:'https://github.com/d4vucat/Simon-Game',sourceName:'Simon Game',duration:240},
  {trackId:'track-15',slug:'2048',genre:'Fusão numérica',subtitle:'A última fusão',objective:'Combine os blocos até formar o número 256.',instructions:'Use as setas ou deslize o dedo para combinar números iguais.',repository:'https://github.com/gabrielecirulli/2048',sourceName:'2048 / Gabriele Cirulli',duration:360},
];
export const VENDOR_GAMES: ReadonlyArray<VendorGame> = definitions.map(game => ({...game,title:tracks.find(t=>t.id===game.trackId)?.title ?? 'FILE_15'}));
export const getVendorGame = (id: string) => VENDOR_GAMES.find(game => game.trackId === id);




