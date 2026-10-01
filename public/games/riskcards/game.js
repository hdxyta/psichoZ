(() => {
  'use strict';
  const canvas = document.getElementById('risk-canvas');
  const ctx = canvas.getContext('2d');
  const handEl = document.querySelector('[data-hand]');
  const status = document.querySelector('[data-game-status]');
  const W = canvas.width, H = canvas.height, roundsToWin = 3;
  const lanes = [118, 270, 422];
  const deck = [
    {id:'dealer', name:'Dealer', count:7, atk:5, hp:4, trait:'buff', text:'+2 ataque na lane vizinha mais fraca.'},
    {id:'smoker', name:'Smoker', count:10, atk:3, hp:5, trait:'fog', text:'Reduz o ataque inimigo da lane.'},
    {id:'crackhead', name:'Crackhead', count:16, atk:2, hp:3, trait:'rush', text:'Ataca primeiro, mas quebra fácil.'},
    {id:'gunman', name:'Gunman', count:6, atk:7, hp:3, trait:'range', text:'Causa dano antes do choque.'},
    {id:'runner', name:'Runner', count:12, atk:4, hp:3, trait:'flank', text:'Se vencer, ajuda a próxima lane.'},
    {id:'lookout', name:'Lookout', count:8, atk:3, hp:7, trait:'guard', text:'Segura muito dano.'},
    {id:'chemist', name:'Chemist', count:5, atk:4, hp:4, trait:'burn', text:'Marca o inimigo com dano extra.'},
    {id:'hound', name:'Cães de beco', count:14, atk:3, hp:2, trait:'swarm', text:'Ganha força quando vem em massa.'},
  ];
  const enemies = [
    [{name:'Cobradores',count:8,atk:4,hp:4},{name:'Sirene baixa',count:10,atk:3,hp:4},{name:'Olheiros rivais',count:7,atk:5,hp:3}],
    [{name:'Bonde vermelho',count:13,atk:4,hp:4},{name:'Capangas',count:9,atk:6,hp:4},{name:'Ratos da esquina',count:18,atk:2,hp:3}],
    [{name:'Chefão sem rosto',count:8,atk:8,hp:6},{name:'Multidão quebrada',count:22,atk:3,hp:4},{name:'Gunmen rivais',count:10,atk:7,hp:3}],
  ];
  let round = 1, selected = 0, hand = [], placed = [null,null,null], enemy = [], log = '', resolving = false, ended = false;
  function report(phase, hint) {
    status.textContent = `ASSALTO ${Math.min(round, roundsToWin)} / ${roundsToWin} · ${hint}`;
    window.PsicoZ?.report({phase, progress: Math.max(0, Math.min(round-1, roundsToWin)), total: roundsToWin, label:'ASSALTOS', hint});
  }
  function drawHand() {
    handEl.replaceChildren(...hand.map((card, index) => {
      const btn = document.createElement('button'); btn.type='button'; btn.setAttribute('aria-pressed', String(index === selected)); btn.disabled = resolving || ended;
      btn.innerHTML = `<strong>${card.name}</strong><em>${card.count}x soldados</em><span>ATK ${card.atk} · HP ${card.hp} · ${card.text}</span>`;
      btn.addEventListener('click', () => { selected = index; drawHand(); draw(); });
      return btn;
    }));
  }
  function drawDeck() { hand = Array.from({length:3}, (_,i) => deck[(round*3 + i + Math.floor(Math.random()*deck.length)) % deck.length]); selected = 0; drawHand(); }
  function startRound() { placed = [null,null,null]; enemy = enemies[round-1].map(e => ({...e})); log = 'Posicione suas cartas.'; drawDeck(); report('playing','Posicione tropas nas lanes.'); draw(); }
  function cloneTroop(card) { return {...card, alive:card.count, power: card.count*card.atk, block: card.count*card.hp}; }
  function place(lane) { if (resolving || ended || !hand[selected]) return; placed[lane] = cloneTroop(hand[selected]); hand.splice(selected,1); if (!hand.length) drawDeck(); selected = Math.min(selected, hand.length-1); log = `${placed[lane].name} ocupa a lane ${lane+1}.`; drawHand(); draw(); }
  function applyTraits() {
    for (let i=0;i<3;i++) {
      const p = placed[i], e = enemy[i]; if (!p) continue;
      if (p.trait === 'buff') {
        const target = placed.map((t,j)=>t?{j,score:t.power}:null).filter(Boolean).sort((a,b)=>a.score-b.score)[0];
        if (target) placed[target.j].power += 14;
      }
      if (p.trait === 'fog') e.power = Math.max(0, e.count * (e.atk-1)); else e.power = e.count * e.atk;
      if (p.trait === 'range') e.block -= p.count * 5;
      if (p.trait === 'burn') e.block -= 22;
      if (p.trait === 'swarm' && p.count >= 14) p.power += 18;
      if (p.trait === 'guard') p.block += 24;
      if (p.trait === 'rush') p.power += 20;
    }
  }
  function resolveBattle() {
    if (resolving || ended) return; resolving = true; applyTraits();
    let wins = 0, summary = [];
    for (let i=0;i<3;i++) {
      const p = placed[i] || {name:'Vazio',count:0,atk:0,hp:0,power:0,block:0};
      const e = enemy[i]; e.power ??= e.count * e.atk; e.block ??= e.count * e.hp;
      const pScore = p.power + p.block*.55;
      const eScore = e.power + e.block*.55;
      const won = pScore >= eScore; if (won) wins += 1;
      summary.push(`${i+1}:${won?'sua':'deles'}`);
      if (won && p.trait === 'flank' && i < 2 && placed[i+1]) placed[i+1].power += 18;
    }
    log = `Resultado ${summary.join(' · ')}.`; draw();
    setTimeout(() => {
      resolving = false;
      if (wins >= 2) {
        if (round >= roundsToWin) { ended = true; report('won','Três assaltos vencidos. Risco assumido.'); log = 'CONQUISTA SALVA'; draw(); return; }
        round += 1; startRound();
      } else { ended = true; report('lost','A mesa virou contra você.'); log = 'DERROTA'; draw(); }
    }, 650);
  }
  function cardShape(x,y,w,h,title,count,color) {
    ctx.fillStyle='#080808'; ctx.fillRect(x,y,w,h); ctx.strokeStyle='#f5eee4'; ctx.lineWidth=3; ctx.strokeRect(x,y,w,h); ctx.fillStyle=color; ctx.fillRect(x,y,8,h); ctx.font='900 15px Georgia'; ctx.fillStyle='#f5eee4'; ctx.fillText(title,x+16,y+26); ctx.font='900 22px monospace'; ctx.fillStyle='#ff1734'; ctx.fillText(`${count}x`,x+16,y+58);
  }
  function drawTroops(x,y,side,troop,color) {
    if (!troop) return;
    const n = Math.min(18, troop.count);
    for (let i=0;i<n;i++) { const col=i%6,row=Math.floor(i/6); ctx.fillStyle=color; ctx.fillRect(x + side*col*12, y+row*16, 8, 12); ctx.fillStyle='#050505'; ctx.fillRect(x + side*col*12+2,y+row*16+2,4,4); }
  }
  function draw() {
    ctx.clearRect(0,0,W,H); ctx.fillStyle='#070707'; ctx.fillRect(0,0,W,H); ctx.strokeStyle='#23070d'; ctx.lineWidth=1; for(let x=-120;x<W;x+=34){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+170,H);ctx.stroke();}
    ctx.fillStyle='#10070a'; ctx.fillRect(58,72,844,382); ctx.strokeStyle='#3b1018'; ctx.lineWidth=3; ctx.strokeRect(58,72,844,382); ctx.fillStyle='#f5eee4'; ctx.font='900 18px monospace'; ctx.fillText(`ASSALTO ${Math.min(round,3)} / 3`,402,48); ctx.fillStyle='#cbb9bd'; ctx.font='700 13px monospace'; ctx.fillText(log,34,520);
    for (let i=0;i<3;i++) { const y=lanes[i]; ctx.strokeStyle=i===selected?'#ff1734':'#331018'; ctx.lineWidth=2; ctx.strokeRect(86,y-48,788,104); ctx.fillStyle='#1b090d'; ctx.fillRect(470,y-48,4,104); ctx.fillStyle='#ff1734'; ctx.font='900 14px monospace'; ctx.fillText(`LANE ${i+1}`,102,y-22); const p=placed[i], e=enemy[i]; if(p){cardShape(132,y-36,150,76,p.name,p.count,'#ff1734'); drawTroops(320,y-20,1,p,'#f5eee4');} if(e){cardShape(680,y-36,150,76,e.name,e.count,'#7b1020'); drawTroops(626,y-20,-1,e,'#ff1734');} }
    if (ended) { ctx.fillStyle='#050505cc'; ctx.fillRect(220,178,520,150); ctx.strokeStyle='#ff1734'; ctx.lineWidth=5; ctx.strokeRect(220,178,520,150); ctx.fillStyle='#f5eee4'; ctx.font='900 34px Georgia'; ctx.fillText(log,300,260); }
  }
  for (const btn of document.querySelectorAll('[data-lane]')) btn.addEventListener('click', () => place(Number(btn.dataset.lane)));
  document.querySelector('[data-action="resolve"]').addEventListener('click', resolveBattle);
  document.querySelector('[data-action="redraw"]').addEventListener('click', () => { if(!resolving && !ended){ drawDeck(); log='Mão trocada. Posicione com cuidado.'; draw(); }});
  canvas.addEventListener('pointerdown', event => { const rect=canvas.getBoundingClientRect(); const y=(event.clientY-rect.top)/rect.height*H; const lane=lanes.map((ly,i)=>({i,d:Math.abs(y-ly)})).sort((a,b)=>a.d-b.d)[0]; if(lane.d<70) place(lane.i); });
  window.PsicoZ?.onPause(() => {});
  startRound();
})();
