/* Wall footprints traced in original 1536 x 1024 artwork coordinates.
   Portals are gaps between polylines, including the four church entrances. */
(() => {
  const ox=-288, oy=-210, walls=[];
  function line(points) { for(let i=1;i<points.length;i++) walls.push([points[i-1][0]+ox,points[i-1][1]+oy,points[i][0]+ox,points[i][1]+oy]); }
  [
    // Church: north, south, east and west doorways remain open.
    [[565,451],[598,425],[598,375],[635,349],[697,349],[697,365],[732,365]],
    [[803,365],[840,365],[840,349],[899,349],[938,377],[938,425],[970,451]],
    [[565,509],[598,535],[598,570],[636,597],[691,597],[691,637],[724,637]],
    [[812,637],[845,637],[845,597],[900,597],[938,570],[938,535],[970,509]],
    [[565,451],[565,455]],[[565,505],[565,509]],[[970,451],[970,455]],[[970,505],[970,509]],
    // Chapel facade above the northern entrance.
    [[684,343],[684,297],[768,257],[850,297],[850,343]],
    // Inner cemetery fence with cardinal openings.
    [[352,422],[352,259],[474,211],[703,211]],
    [[833,211],[1064,211],[1185,259],[1185,422],[1100,422]],
    [[352,422],[434,422],[434,443]],[[1100,422],[1100,443]],
    [[434,514],[434,529],[352,529],[352,695],[435,755],[705,755]],
    [[830,755],[1100,755],[1185,695],[1185,529],[1100,529],[1100,514]],
    // Road-side walls; openings align with the cardinal and diagonal roads.
    [[302,205],[282,250],[282,408],[310,437],[426,437]],
    [[426,518],[313,518],[282,545],[282,706]],
    [[356,787],[421,816],[713,816]],[[819,816],[1123,816],[1190,788]],
    [[1254,708],[1254,545],[1226,518],[1110,518]],
    [[1110,437],[1226,437],[1254,408],[1254,250],[1231,205]],
    [[1170,150],[1123,148],[827,148]],[[709,148],[418,148],[365,165]],
    // Outer ruin walls facing the streets.
    [[0,433],[189,433],[211,412],[211,322]],
    [[163,265],[163,229],[254,164]],
    [[369,94],[713,94],[713,0]],[[817,0],[817,94],[1140,94]],
    [[1291,164],[1370,231],[1370,278]],
    [[1323,324],[1323,411],[1349,433],[1536,433]],
    [[1536,518],[1350,518],[1323,544],[1323,688]],
    [[1265,764],[1190,874],[817,874],[817,1024]],
    [[713,1024],[713,874],[388,874],[295,784]],
    [[211,691],[211,544],[190,518],[0,518]],
  ].forEach(line);
  function distance(x,y,s) {
    const dx=s[2]-s[0],dy=s[3]-s[1];
    const t=Math.max(0,Math.min(1,((x-s[0])*dx+(y-s[1])*dy)/(dx*dx+dy*dy||1)));
    return Math.hypot(x-s[0]-t*dx,y-s[1]-t*dy);
  }
  function clear(x,y,r,bounds) {
    if(bounds && (x<bounds.left+r || y<bounds.top+r || x>bounds.left+bounds.width-r || y>bounds.top+bounds.height-r)) return false;
    return walls.every(s=>distance(x,y,s)>=r+5);
  }
  function sight(a,b,r=0,bounds) {
    const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4));
    for(let i=0;i<=n;i++) if(!clear(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,r,bounds)) return false;
    return true;
  }
  function move(body,dx,dy,r,bounds) {
    const n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/4));
    for(let i=0;i<n;i++) {
      if(clear(body.x+dx/n,body.y,r,bounds)) body.x+=dx/n;
      if(clear(body.x,body.y+dy/n,r,bounds)) body.y+=dy/n;
    }
  }
  let cachedGrid=null;
  function navigation(bounds,target) {
    const cell=16,cols=Math.ceil(bounds.width/cell),rows=Math.ceil(bounds.height/cell);
    const key=[bounds.left,bounds.top,bounds.width,bounds.height].join(',');
    if(!cachedGrid || cachedGrid.key!==key) {
      const points=Array.from({length:cols*rows},(_,i)=>({x:bounds.left+(i%cols+.5)*cell,y:bounds.top+(Math.floor(i/cols)+.5)*cell}));
      const open=points.map(p=>clear(p.x,p.y,13,bounds));
      const neighbors=points.map((p,i)=>open[i]?[i-1,i+1,i-cols,i+cols].filter(j=>j>=0 && j<points.length && Math.abs(j%cols-i%cols)<=1 && open[j] && sight(p,points[j],13,bounds)):[]);
      cachedGrid={key,points,open,neighbors};
    }
    const {points,open,neighbors}=cachedGrid;
    const costs=new Int32Array(points.length).fill(-1),queue=[];
    let root=-1,best=Infinity;
    points.forEach((p,i)=>{const d=Math.hypot(p.x-target.x,p.y-target.y);if(open[i] && d<best){best=d;root=i;}});
    if(root>=0){costs[root]=0;queue.push(root);}
    for(let q=0;q<queue.length;q++) {
      const i=queue[q];
      for(const j of neighbors[i]) {
        if(costs[j]>=0) continue;
        costs[j]=costs[i]+1;queue.push(j);
      }
    }
    return {points,costs,nearest(p) {
      let result=null,distance=Infinity;
      for(const i of queue){const d=Math.hypot(points[i].x-p.x,points[i].y-p.y);if(d<distance){distance=d;result=points[i];}}
      return result;
    },direction(p) {
      if(sight(p,target,12,bounds)) return target;
      let result=null,score=Infinity;
      // Local visible cells avoid diagonal corner cutting and follow the shared field.
      const cx=Math.floor((p.x-bounds.left)/cell),cy=Math.floor((p.y-bounds.top)/cell);
      for(let y=cy-2;y<=cy+2;y++) for(let x=cx-2;x<=cx+2;x++) {
        if(x<0||x>=cols||y<0||y>=rows) continue;
        const i=y*cols+x;if(costs[i]<0) continue;
        const s=costs[i]*cell+Math.hypot(points[i].x-p.x,points[i].y-p.y)*.5;
        if(s<score && sight(p,points[i],12,bounds)){score=s;result=points[i];}
      }
      return result || p;
    }};
  }
  function separate(bodies,bounds) {
    for(let pass=0;pass<4;pass++) for(let i=0;i<bodies.length;i++) for(let j=i+1;j<bodies.length;j++) {
      const a=bodies[i],b=bodies[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
      if(d>=24)continue;
      const nx=d?dx/d:1,ny=d?dy/d:0,push=(24-d)/2+.01;
      move(a,-nx*push,-ny*push,12,bounds);move(b,nx*push,ny*push,12,bounds);
    }
  }
  window.AditivoMap={walls,clear,sight,move,navigation,separate,left:ox,top:oy,width:1536,height:1024};
})();
