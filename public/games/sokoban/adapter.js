/* UI adapter and ink renderer for Tania Rascia's MIT Sokoban.js.
   Board movement, box pushing and target restoration are imported from upstream. */
import Sokoban from './Sokoban.js';
import { SUCCESS_BLOCK, levelOneMap, VOID } from './constants.js';
const game = new Sokoban({level:1});
const canvas = document.querySelector('canvas');
const status = document.getElementById('status');
const history = []; let paused = false, ended = false;
const target = levelOneMap.flat().filter(value => value === VOID || value === SUCCESS_BLOCK).length;
game.paintCell = function(ctx, cell, x, y) {
  const left = x * 75, top = y * 75;
  ctx.fillStyle = '#1b1316'; ctx.fillRect(left,top,75,75);
  ctx.strokeStyle = '#35252a'; ctx.lineWidth = 1; ctx.strokeRect(left,top,75,75);
  if(cell === 'wall') {
    ctx.fillStyle = '#dad1c5'; ctx.fillRect(left+3,top+3,69,69);
    ctx.fillStyle = '#090909'; ctx.fillRect(left+3,top+55,69,17);
    ctx.strokeStyle = '#938075'; ctx.lineWidth=2;
    for(let line=8;line<70;line+=10){ctx.beginPath();ctx.moveTo(left+line,top+6);ctx.lineTo(left+line-7,top+50);ctx.stroke();}
  } else if(cell === 'block' || cell === 'success_block') {
    ctx.fillStyle='#090909';ctx.fillRect(left+17,top+17,51,51);
    ctx.fillStyle=cell===SUCCESS_BLOCK?'#f51d36':'#f2ece2';ctx.fillRect(left+10,top+10,50,50);
    ctx.strokeStyle='#090909';ctx.lineWidth=4;ctx.strokeRect(left+10,top+10,50,50);
    ctx.beginPath();ctx.moveTo(left+18,top+18);ctx.lineTo(left+52,top+52);ctx.moveTo(left+52,top+18);ctx.lineTo(left+18,top+52);ctx.stroke();
  } else if(cell === 'void') {
    ctx.strokeStyle='#f51d36';ctx.lineWidth=5;ctx.beginPath();ctx.arc(left+37.5,top+37.5,19,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#f51d36';ctx.beginPath();ctx.arc(left+37.5,top+37.5,5,0,Math.PI*2);ctx.fill();
  } else if(cell === 'player') {
    ctx.fillStyle='#f51d36';ctx.beginPath();ctx.arc(left+37.5,top+37.5,23,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#090909';ctx.lineWidth=4;ctx.stroke();
    ctx.fillStyle='#f2ece2';ctx.fillRect(left+25,top+29,8,8);ctx.fillRect(left+42,top+29,8,8);ctx.fillStyle='#090909';ctx.fillRect(left+27,top+31,3,4);ctx.fillRect(left+44,top+31,3,4);
  }
};
function render() {
  game.render();
  const recovered = game.board.flat().filter(value => value === SUCCESS_BLOCK).length;
  ended = recovered === target;
  status.textContent = recovered + ' / ' + target + ' caixas' + (ended ? ' · Faixa recuperada' : '');
  window.PsicoZ?.report({phase:ended?'won':'playing',progress:recovered,total:target,label:'Caixas',hint:'Empurre as três caixas para os círculos vermelhos. Desfazer recupera a última jogada.'});
}
function move(direction) {
  if(paused || ended) return;
  const before=JSON.stringify(game.board);
  game.move(game.findPlayerCoords(),direction);
  if(JSON.stringify(game.board)!==before) history.push(before);
  render();
}
const map={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
document.addEventListener('keydown',event=>{if(map[event.key]){event.preventDefault();move(map[event.key]);}});
document.querySelectorAll('[data-direction]').forEach(button=>button.addEventListener('click',()=>move(button.dataset.direction)));
document.getElementById('undo').addEventListener('click',()=>{if(paused||ended||!history.length)return;game.board=JSON.parse(history.pop());render();});
document.getElementById('restart').addEventListener('click',()=>{if(paused)return;history.length=0;ended=false;game.render({restart:true});render();});
let touch;
canvas.addEventListener('pointerdown',event=>{touch={x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);});
canvas.addEventListener('pointerup',event=>{if(!touch)return;const dx=event.clientX-touch.x,dy=event.clientY-touch.y;touch=null;if(Math.max(Math.abs(dx),Math.abs(dy))>15)move(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');});
window.PsicoZ?.onPause(value=>{paused=value;touch=null;});
render();
