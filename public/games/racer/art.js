/* Original vector-like psicoZ atlas. No OutRun sprites, source music or stock textures are used. */
Game.stats = () => ({ update() {} }); Game.playMusic = () => {}; Dom.storage = {};
Object.assign(COLORS, { SKY: '#f2ece2', TREE: '#090909', FOG: '#f2ece2', LIGHT: { road: '#171113', grass: '#d8cdc1', rumble: '#f51d36', lane: '#f2ece2' }, DARK: { road: '#171113', grass: '#b3a699', rumble: '#090909' }, START: { road: '#f2ece2', grass: '#090909', rumble: '#f51d36' }, FINISH: { road: '#f51d36', grass: '#090909', rumble: '#f2ece2' } });
Game.loadImages = function (_names, ready) {
  const sky = document.createElement('canvas'); sky.width = 1300; sky.height = 1500;
  const skyCtx = sky.getContext('2d'); skyCtx.fillStyle = '#f2ece2'; skyCtx.fillRect(5, 495, 1280, 480);
  skyCtx.fillStyle = '#f51d36'; skyCtx.beginPath(); skyCtx.arc(850, 620, 83, 0, Math.PI * 2); skyCtx.fill();
  for (let x = 0; x < 1280; x += 70) { skyCtx.fillStyle = '#090909'; const hillTop = 250 + x % 90, treeTop = 1190 + x % 85; skyCtx.fillRect(x, hillTop, 65, 485 - hillTop); skyCtx.fillRect(x + 15, treeTop, 40, 1465 - treeTop); skyCtx.strokeStyle = '#a08e80'; for (let y = 275; y < 480; y += 18) { skyCtx.beginPath(); skyCtx.moveTo(x, y); skyCtx.lineTo(x + 60, y - 25); skyCtx.stroke(); } }
  const atlas = document.createElement('canvas'); atlas.width = 1500; atlas.height = 1500;
  const ctx = atlas.getContext('2d');
  for (const [name, sprite] of Object.entries(SPRITES)) {
    if (!sprite || typeof sprite !== 'object' || !('x' in sprite)) continue;
    const { x, y, w, h } = sprite;
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = '#090909'; ctx.lineWidth = Math.max(2, w / 40);
    if (/CAR|PLAYER|TRUCK|SEMI/.test(name)) {
      ctx.fillStyle = '#090909'; ctx.fillRect(w * .03, h * .57, w * .94, h * .43);
      ctx.fillStyle = /PLAYER/.test(name) ? '#f2ece2' : '#f51d36'; ctx.beginPath(); ctx.moveTo(w * .07, h * .88); ctx.lineTo(w * .07, h * .42); ctx.lineTo(w * .23, h * .07); ctx.lineTo(w * .76, h * .07); ctx.lineTo(w * .93, h * .42); ctx.lineTo(w * .93, h * .88); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#090909'; ctx.fillRect(w * .26, h * .18, w * .48, h * .28); ctx.fillStyle = '#f51d36'; ctx.fillRect(w * .13, h * .65, w * .17, h * .13); ctx.fillRect(w * .7, h * .65, w * .17, h * .13);
    } else if (/BILLBOARD/.test(name)) {
      ctx.fillStyle = '#090909'; ctx.fillRect(w * .45, h * .45, w * .1, h * .55); ctx.fillStyle = '#f2ece2'; ctx.fillRect(4, 4, w - 8, h * .7); ctx.strokeRect(4, 4, w - 8, h * .7); ctx.fillStyle = '#f51d36'; ctx.font = `bold ${Math.floor(w / 6)}px monospace`; ctx.textAlign = 'center'; ctx.fillText('PSICOZ', w / 2, h * .44);
    } else {
      ctx.fillStyle = '#090909'; ctx.beginPath(); ctx.moveTo(w * .4, h); ctx.lineTo(w * .45, h * .1); ctx.lineTo(w * .54, h * .3); ctx.lineTo(w * .85, 0); ctx.lineTo(w * .64, h * .5); ctx.lineTo(w, h * .2); ctx.lineTo(w * .63, h * .65); ctx.lineTo(w * .66, h); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#f51d36'; ctx.beginPath(); ctx.moveTo(w * .49, h * .25); ctx.lineTo(w * .48, h * .8); ctx.stroke();
    }
    ctx.restore();
  }
  ready([sky, atlas]);
};
