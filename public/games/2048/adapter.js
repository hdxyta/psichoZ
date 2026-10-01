/* Integration for Gabriele Cirulli's MIT 2048: original move/merge/grid/input code.
   Local in-memory storage, themed display and terminal result bridge only. */
(function () {
  var paused = false;
  function SessionStorage() { this.best = 0; this.state = null; }
  SessionStorage.prototype.getBestScore = function () { return this.best; };
  SessionStorage.prototype.setBestScore = function (value) { this.best = value; };
  SessionStorage.prototype.getGameState = function () { return this.state; };
  SessionStorage.prototype.setGameState = function (value) { this.state = value; };
  SessionStorage.prototype.clearGameState = function () { this.state = null; };
  var originalActuate = GameManager.prototype.actuate;
  GameManager.prototype.actuate = function () {
    originalActuate.call(this);
    var maximum = 0;
    this.grid.eachCell(function (_x, _y, tile) { if (tile) maximum = Math.max(maximum, tile.value); });
    window.PsicoZ?.report({phase:this.won?'won':this.over?'lost':'playing',progress:Math.min(256,maximum),total:256,label:'Maior selo',hint:'Una dois números iguais. Crie uma peça 256 para recuperar a faixa.'});
  };
  var originalMove = GameManager.prototype.move;
  GameManager.prototype.move = function(direction) { if (!paused) originalMove.call(this,direction); };
  HTMLActuator.prototype.message = function (won) {
    this.messageContainer.classList.add(won?'game-won':'game-over');
    this.messageContainer.querySelector('p').textContent = won?'Selo 256 recuperado.':'Sem movimentos.';
  };
  var style = document.createElement('style'), rules = '';
  for(var x=1;x<=4;x++) for(var y=1;y<=4;y++) rules += '.tile-position-'+x+'-'+y+'{--x:'+(x-1)+';--y:'+(y-1)+'}';
  style.textContent=rules;document.head.append(style);
  for(var index=0;index<16;index++){var cell=document.createElement('span');cell.className='grid-cell';document.querySelector('.grid-container').append(cell);}
  var game = new GameManager(4, KeyboardInputManager, HTMLActuator, SessionStorage);
  document.querySelectorAll('[data-move]').forEach(function(button){button.addEventListener('click',function(){game.inputManager.emit('move',Number(button.dataset.move));});});
  window.PsicoZ?.onPause(function(value){paused=value;});
})();
