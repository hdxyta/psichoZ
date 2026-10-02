/* Coordinates are reviewed against the supplied artwork, not an assumed grid.
   Armed sheets lack complete directional walk cycles: retain an armed pose and bob
   where the walk row loses its weapon (shotgun/staff). Left poses mirror right poses. */
(() => {
  const images = {};
  for (const name of ['nun','knife','shotgun','staff','fx-knife','fx-shotgun','fx-staff']) {
    const image = new Image(); image.src = `${name}.webp`; images[name] = image;
  }
  const centers = [120,215,310,401,490,579,669,759,851];
  // Transparent replacement atlases (1448 x 1086), irregular frame boundaries.
  const effectFrames = {
    knife:[[40,55,112,125],[160,43,132,147],[310,26,145,164],[465,10,164,184],[632,0,189,196]],
    shotgun:[[0,0,397,270],[400,0,270,270],[674,0,254,270],[932,0,274,270],[1207,0,241,270]],
    staff:[[0,445,351,225],[352,445,253,225],[606,445,269,225],[876,421,276,249],[1153,410,295,260]],
  };
  function draw(ctx, name, rect, x, y, w, h, flip = false) {
    const image = images[name];
    if (!image.complete || !image.naturalWidth) return false;
    ctx.save(); ctx.translate(x,y); if (flip) ctx.scale(-1,1);
    ctx.drawImage(image,...rect,-w/2,-h,w,h); ctx.restore(); return true;
  }
  window.AditivoArt = {
    drawPlayer(ctx,p) {
      const moving = p.moving, t = p.anim;
      if (!p.weapon) {
        const row = {down:1,left:2,right:3,up:4}[p.facing];
        // The down row changes to back views after column 5.
        const count = p.facing === 'down' ? 5 : 10;
        const col = moving ? Math.floor(t*9)%count : 0;
        return draw(ctx,'nun',[104+col*117,row*142+5,110,136],p.x,p.y+18,53,65);
      }
      const name = p.weapon;
      const height = name === 'staff' ? 112 : 96;
      let col = p.facing === 'up' ? 6 : ['left','right'].includes(p.facing) ? 4 : Math.floor(t*3)%4;
      // Side idle poses on the shotgun sheet omit most of the gun; use its armed 3/4 pose.
      if (name === 'shotgun' && ['left','right'].includes(p.facing)) col = 0;
      let row = 0;
      if (name === 'knife' && moving) row = 1;
      if (p.facing === 'up' && name !== 'shotgun') row = 1;
      // Attack art is lateral; keep vertical poses upright and show aimed FX separately.
      if (p.attack > 0 && ['left','right'].includes(p.facing)) {
        row = 2;
        col = Math.min(name === 'knife' ? 6 : name === 'shotgun' ? 5 : 8, Math.floor((1-p.attack/.32)*(name === 'knife' ? 7 : name === 'shotgun' ? 6 : 9)));
      }
      let rect;
      if (row === 2 && name === 'knife') rect = [82+col*116,205,112,94];
      else if (row === 2 && name === 'shotgun') rect = [80+col*99,208,97,96];
      else rect = [centers[col]-43, row*height+5,86,height-5];
      const bob = moving ? Math.sin(t*15)*1.8 : 0;
      return draw(ctx,name,rect,p.x,p.y+18+bob,rect[2]/rect[3]*64,64,p.facing==='left');
    },
    effect(ctx, kind, x,y,angle,age) {
      const frames = effectFrames[kind];
      const i = Math.max(0,Math.min(frames.length-1,Math.floor(age*frames.length)));
      const rect = frames[i];
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);
      ctx.globalCompositeOperation = 'source-over';
      const width = kind==='knife'?48+i*4:kind==='shotgun'?64:52;
      const height = width*rect[3]/rect[2];
      // The first three magic drawings face left; normalize before aiming.
      const ok = draw(ctx,`fx-${kind}`,rect,0,height/2,width,height,kind==='staff' && i<3);
      if (!ok) { ctx.strokeStyle='#ff334c';ctx.beginPath();ctx.arc(0,0,15,-1,1);ctx.stroke(); }
      ctx.restore();
    },
  };
})();
