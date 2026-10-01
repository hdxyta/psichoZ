import { tracks } from './catalog';
import type { TrackId } from './models';
export interface VendorGame {
  trackId: TrackId; slug: string; genre: string; title: string; subtitle: string;
  objective: string; instructions: string; repository: string; sourceName: string; duration: number;
}
const definitions: Array<Omit<VendorGame, 'title'>> = [
  {trackId:'track-01',slug:'tower',genre:'Tower defense',subtitle:'Defesa da transmissão',objective:'Construa torres e sobreviva a três ondas antes que a torre perca o sinal.',instructions:'Toque ou clique nos sigilos para construir torres. Use 1/2 para escolher torre e Espaço para chamar a próxima onda.',repository:'https://github.com/CoolDude2349/Offline-HTML-Games-Pack',sourceName:'Tower defense adaptado para psicoZ',duration:300},
  {trackId:'track-02',slug:'zombie',genre:'Zumbi top-down',subtitle:'Rounds do aditivo',objective:'Sobreviva a quatro rounds de zumbis e escolha uma carta de melhoria entre ondas.',instructions:'WASD ou setas movem. Mire com mouse ou toque, segure para atirar e escolha uma carta ao fim de cada round.',repository:'https://github.com/CoolDude2349/Offline-HTML-Games-Pack',sourceName:'Zombie rounds adaptado para psicoZ',duration:300},
  {trackId:'track-03',slug:'brawler',genre:'Arena fighter',subtitle:'Ringue da capa',objective:'Escolha um personagem da capa e derrube três oponentes em rounds de plataforma.',instructions:'A/D ou setas movem, Espaço pula, J ataca e K usa especial. No celular, use os botões e toque na arena para virar e atacar.',repository:'https://github.com/CoolDude2349/Offline-HTML-Games-Pack',sourceName:'Brawler de plataforma adaptado para psicoZ',duration:300},
  {trackId:'track-04',slug:'pong',genre:'Pong',subtitle:'Duelo vermelho',objective:'Faça três pontos antes da raquete adversária.',instructions:'Mova sua raquete com as setas, o mouse ou o dedo.',repository:'https://github.com/jakesgordon/javascript-pong',sourceName:'JavaScript Pong',duration:300},
  {trackId:'track-05',slug:'tetris',genre:'Blocos em queda',subtitle:'Inverta a queda',objective:'Complete duas linhas antes de empilhar até o teto.',instructions:'Setas movem e giram; Espaço derruba a peça. Há botões de toque.',repository:'https://github.com/jakesgordon/javascript-tetris',sourceName:'JavaScript Tetris',duration:300},
  {trackId:'track-06',slug:'memory',genre:'Memória',subtitle:'Duplo negativo',objective:'Encontre os seis pares de símbolos.',instructions:'Clique ou toque em duas cartas. Memorize os pares que não combinarem.',repository:'https://github.com/makzan/HTML5-Games-Examples',sourceName:'CSS3 Matching / Makzan',duration:120},
  {trackId:'track-07',slug:'racer',genre:'Corrida na estrada',subtitle:'Estrada sem voz',objective:'Complete uma volta no circuito.',instructions:'Acelere, freie e vire com as setas ou os controles de toque.',repository:'https://github.com/jakesgordon/javascript-racer',sourceName:'JavaScript Racer',duration:300},
  {trackId:'track-08',slug:'untangle',genre:'Desatar nós',subtitle:'Nós do sinal',objective:'Desembarace duas redes sem deixar linhas cruzadas.',instructions:'Arraste os nós com o mouse ou dedo. Também pode selecionar um nó e movê-lo pelas setas.',repository:'https://github.com/makzan/HTML5-Games-Examples',sourceName:'Canvas Untangle / Makzan',duration:240},
  {trackId:'track-09',slug:'redterraria',genre:'Sandbox de blocos',subtitle:'Mina vermelha',objective:'Explore o mundo lateral, mine minério vermelho e acenda cinco sigilos.',instructions:'A/D movem, Espaço pula, clique ou toque minera/ativa. Use o modo Bloco para construir com minério.',repository:'https://github.com/CoolDude2349/Offline-HTML-Games-Pack',sourceName:'Red Terraria adaptado para psicoZ',duration:300},
  {trackId:'track-10',slug:'breakout',genre:'Quebra de blocos',subtitle:'Ruptura',objective:'Quebre os 12 blocos antes de perder três vidas.',instructions:'Mova a raquete com mouse, toque ou setas. Lance a bola com Espaço ou o botão.',repository:'https://github.com/jakesgordon/javascript-breakout',sourceName:'JavaScript Breakout',duration:300},
  {trackId:'track-11',slug:'riskcards',genre:'Card battler tático',subtitle:'Baralho de rua',objective:'Posicione cartas que invocam tropas e vença três assaltos em lanes.',instructions:'Escolha uma das três cartas, posicione em uma lane e resolva o turno. Cada carta invoca uma tropa com quantidade, ataque e resistência.',repository:'https://github.com/CoolDude2349/Offline-HTML-Games-Pack',sourceName:'Risk cards adaptado para psicoZ',duration:300},
  {trackId:'track-12',slug:'invaders',genre:'Invasores',subtitle:'A última voz',objective:'Elimine uma formação de invasores.',instructions:'Mova para os lados e dispare com setas e Espaço, ou pelos botões de toque.',repository:'https://github.com/dwmkerr/spaceinvaders',sourceName:'Space Invaders',duration:240},
  {trackId:'track-13',slug:'greyride',genre:'Narrativa de carro',subtitle:'Vidro da frente',objective:'Faça escolhas dentro do carro, no caminho e no final até alcançar a mesma esquina.',instructions:'Escolha uma ação por cena. O carro e o personagem ficam fixos; o fundo se move e a rota muda conforme suas decisões.',repository:'https://github.com/CoolDude2349/Offline-HTML-Games-Pack',sourceName:'Grey ride adaptado para psicoZ',duration:300},
  {trackId:'track-14',slug:'sakurablade',genre:'FPS de katana',subtitle:'Guarda das sakuras',objective:'Faça seis cortes na parede até os traços revelarem psicoZ.',instructions:'Arraste no canvas ou use os botões/teclas 1–6 para cortar. Complete todos os traços sem perder o foco.',repository:'https://github.com/CoolDude2349/Offline-HTML-Games-Pack',sourceName:'Sakura blade adaptado para psicoZ',duration:240},
  {trackId:'track-15',slug:'2048',genre:'Fusão numérica',subtitle:'A última fusão',objective:'Combine os blocos até formar o número 256.',instructions:'Use as setas ou deslize o dedo para combinar números iguais.',repository:'https://github.com/gabrielecirulli/2048',sourceName:'2048 / Gabriele Cirulli',duration:360},
];
export const VENDOR_GAMES: ReadonlyArray<VendorGame> = definitions.map(game => ({...game,title:tracks.find(t=>t.id===game.trackId)?.title ?? 'FILE_15'}));
export const getVendorGame = (id: string) => VENDOR_GAMES.find(game => game.trackId === id);









