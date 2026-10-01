/* psicoZ adapter around Makzan's MIT CSS3 matching example. Rules remain upstream;
   replaces its storage, graphics, transition-end dependency and result presentation. */
(function () {
  var paused = false, ended = false;
  var symbols = { cardAK: ['◉', 'Olho'], cardAQ: ['✦', 'Estrela'], cardAJ: ['☾', 'Lua'], cardBK: ['♰', 'Cruz'], cardBQ: ['♠', 'Espinho'], cardBJ: ['◇', 'Diamante'] };
  var oldSelect = selectCard;
  savedSavingObject = function () { return undefined; };
  saveSavingObject = function () {};
  selectCard = function () { if (!paused && !ended) oldSelect.call(this); };
  function report(phase) {
    var pairs = (12 - document.querySelectorAll('.card').length) / 2;
    document.getElementById('pair-count').textContent = pairs + ' / 6 pares';
    window.PsicoZ?.report({phase: phase || 'playing', progress:pairs, total:6, label:'Pares', hint: 'Vire duas cartas e encontre os seis pares.'});
  }
  var originalCheck = checkPattern;
  checkPattern = function () {
    originalCheck();
    // The upstream only listens to a WebKit transition event. Also settle without animation.
    if (document.querySelector('.card-removed')) setTimeout(removeTookCards, 180);
  };
  removeTookCards = function () {
    document.querySelectorAll('.card-removed').forEach(function(card) {
      matchingGame.savingObject.removedCards.push(Number(card.dataset.cardIndex));
      var space = document.createElement('span'); space.className = 'card-hole'; space.textContent = '✓'; space.setAttribute('aria-label', 'Par encontrado'); card.replaceWith(space);
    });
    if (!document.querySelector('.card')) gameover(); else report();
  };
  gameover = function () {
    if (ended) return; ended = true; clearInterval(matchingGame.timer);
    document.getElementById('result').textContent = 'Os seis pares foram revelados. Faixa recuperada.';
    report('won');
  };
  var originalTimer = countTimer;
  countTimer = function () {
    originalTimer();
    if (matchingGame.elapsedTime >= 120 && !ended) { ended = true; clearInterval(matchingGame.timer); document.getElementById('result').textContent = 'O tempo terminou. Tente novamente.'; report('lost'); }
  };
  function labelCards() {
    document.querySelectorAll('.card').forEach(function (card) {
      var pattern = $(card).data('pattern'); var symbol = symbols[pattern];
      if (!symbol) return;
      card.querySelector('.back').textContent = symbol[0];
      var label = 'Carta ' + (Number(card.dataset.cardIndex) + 1) + (card.classList.contains('card-flipped') ? ': ' + symbol[1] : ': fechada');
      if (card.getAttribute('aria-label') !== label) card.setAttribute('aria-label', label);
    });
  }
  $(function () {
    labelCards(); report();
    new MutationObserver(labelCards).observe(document.getElementById('cards'), {subtree:true, attributes:true, attributeFilter:['class']});
    document.getElementById('restart').addEventListener('click', function () { location.reload(); });
  });
  window.PsicoZ?.onPause(function (value) { paused = value; });
})();
