(() => {
  'use strict';
  const canvas=document.getElementById('blade-canvas'),ctx=canvas.getContext('2d'),status=document.querySelector('[data-game-status]');
  const W=canvas.width,H=canvas.height,total=6; let completed=new Set(),slashes=[],petals=[],swing=0,ended=false,last=performance.now(),drag=null;
  const strokes=[
    {id:0,label:'p',pts:[[250,225],[212,225],[212,330],[252,330],[268,294],[252,260],[212,260]]},
    {id:1,label:'s',pts:[[356,228],[302,228],[294,267],[350,283],[342,326],[286,326]]},
    {id:2,label:'i',pts:[[420,228],[420,330],[420,204],[420,206]]},
    {id:3,label:'c',pts:[[536,232],[476,226],[448,276],[474,326],[536,320]]},
    {id:4,label:'o',pts:[[630,226],[574,226],[552,276],[574,328],[630,328],[654,276],[630,226]]},
    {id:5,label:'Z',pts:[[724,226],[820,226],[708,330],[826,330]]},
  ];
  function report(phase,hint){status.textContent=`TRAÇOS ${completed.size} / ${total} · ${hint}`;window.PsicoZ?.report({phase,progress:completed.size,total,label:'TRAÇOS',hint});}
  function spawnPetal(){petals.push({x:Math.random()*W,y:-20,r:4+Math.random()*8,vx:-20+Math.random()*40,vy:35+Math.random()*65,a:Math.random()*6});}
  function cut(id){if(ended||completed.has(id))return;completed.add(id);const s=strokes[id];for(let i=1;i<s.pts.length;i++){slashes.push({a:s.pts[i-1],b:s.pts[i],life:1,id});}swing=.28;document.querySelector(`[data-slash="${id}"]`)?.classList.add('done');if(completed.size>=total){ended=true;report('won','Os cortes revelaram psicoZ.');}else report('playing',`Corte ${id+1} gravado.`);}
  function nearestStroke(a,b){const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;return strokes.map(s=>{const c=s.pts.reduce((p,q)=>[p[0]+q[0],p[1]+q[1]],[0,0]).map(v=>v/s.pts.length);return {id:s.id,d:Math.hypot(mx-c[0],my-c[1])};}).sort((x,y)=>x.d-y.d)[0];}
  function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
  function drawWall(){ctx.fillStyle='#0b0809';ctx.fillRect(92,70,776,346);ctx.strokeStyle='#3a1118';ctx.lineWidth=4;ctx.strokeRect(92,70,776,346);ctx.strokeStyle='#18080c';ctx.lineWidth=1;for(let x=110;x<860;x+=34){ctx.beginPath();ctx.moveTo(x,70);ctx.lineTo(x-90,416);ctx.stroke();}ctx.fillStyle='#14070b';ctx.fillRect(0,416,W,124);ctx.strokeStyle='#ff1734';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(120,540);ctx.lineTo(352,416);ctx.moveTo(840,540);ctx.lineTo(608,416);ctx.stroke();}
  function drawGuide(){ctx.save();ctx.globalAlpha=.12;ctx.strokeStyle='#f5eee4';ctx.lineWidth=6;ctx.lineCap='round';for(const s of strokes){ctx.beginPath();s.pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();}ctx.restore();}
  function drawSlashes(){ctx.lineCap='round';for(const id of completed){const s=strokes[id];ctx.strokeStyle='#ff1734';ctx.lineWidth=8;ctx.shadowColor='#ff1734';ctx.shadowBlur=0;ctx.beginPath();s.pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();ctx.strokeStyle='#f5eee4';ctx.lineWidth=2;ctx.stroke();}for(const sl of slashes){ctx.globalAlpha=Math.max(0,sl.life);ctx.strokeStyle='#f5eee4';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(sl.a[0],sl.a[1]);ctx.lineTo(sl.b[0],sl.b[1]);ctx.stroke();ctx.globalAlpha=1;}}
  function drawSamurai(){const sway=Math.sin(performance.now()/260)*3;ctx.save();ctx.translate(0,sway);ctx.fillStyle='#050505';ctx.fillRect(250,438,460,78);ctx.strokeStyle='#f5eee4';ctx.lineWidth=3;ctx.strokeRect(250,438,460,78);ctx.fillStyle='#f5eee4';ctx.fillRect(456,372,48,78);ctx.fillStyle='#050505';ctx.fillRect(468,390,24,12);ctx.strokeStyle='#ff1734';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(482,432);ctx.lineTo(482+swing*210,214-swing*40);ctx.stroke();ctx.strokeStyle='#f5eee4';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(482,432);ctx.lineTo(642+swing*160,144);ctx.stroke();ctx.restore();}
  function drawPetals(dt){if(Math.random()<.55)spawnPetal();for(const p of petals){p.x+=p.vx*dt;p.y+=p.vy*dt;p.a+=dt*4;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.sin(p.a));ctx.fillStyle=Math.random()<.5?'#ff9eb6':'#f5eee4';ctx.globalAlpha=.65;ctx.beginPath();ctx.ellipse(0,0,p.r,p.r*.45,0,0,Math.PI*2);ctx.fill();ctx.restore();}petals=petals.filter(p=>p.y<H+30);ctx.globalAlpha=1;}
  function drawEnd(){if(!ended)return;ctx.fillStyle='#050505dd';ctx.fillRect(190,150,580,170);ctx.strokeStyle='#ff1734';ctx.lineWidth=5;ctx.strokeRect(190,150,580,170);ctx.fillStyle='#f5eee4';ctx.font='900 36px Georgia';ctx.fillText('psicoZ revelado',338,238);ctx.font='700 16px monospace';ctx.fillText('Nenhum corte estava solto.',374,272);}
  function tick(t){const dt=Math.min(.05,(t-last)/1000||0);last=t;swing=Math.max(0,swing-dt);ctx.clearRect(0,0,W,H);ctx.fillStyle='#050505';ctx.fillRect(0,0,W,H);drawWall();drawGuide();drawSlashes();drawPetals(dt);drawSamurai();drawEnd();requestAnimationFrame(tick);}report('playing','Faça cortes na parede.');requestAnimationFrame(tick);
  for(const b of document.querySelectorAll('[data-slash]'))b.addEventListener('click',()=>cut(Number(b.dataset.slash)));
  document.addEventListener('keydown',e=>{const n=Number(e.key);if(n>=1&&n<=6){e.preventDefault();cut(n-1);}});
  canvas.addEventListener('pointerdown',e=>{drag=point(e);});canvas.addEventListener('pointerup',e=>{if(!drag)return;const end=point(e),near=nearestStroke(drag,end);if(near.d<210)cut(near.id);drag=null;});
  window.PsicoZ?.onPause(()=>{});
})();
