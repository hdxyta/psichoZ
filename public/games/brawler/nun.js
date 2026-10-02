(() => {
  // Irregular sheets: [x, y, width, height, footX, footY], in native pixels.
  const frames={
    walk:[[8,110,291,565,159,661],[279,105,255,570,405,661],[496,125,267,550,636,661],[741,126,259,549,871,661],[954,125,266,550,1090,661],[1184,125,271,550,1329,661],[1420,125,266,550,1543,661],[1638,125,278,550,1778,661]],
    attack:[[8,184,256,466,139,640],[234,184,262,466,327,640],[438,184,269,466,548,640],[656,184,291,466,773,640],[913,184,336,466,1024,640],[1191,176,291,474,1310,640],[1454,182,263,468,1570,640],[1686,182,230,468,1808,640]],
    'run-fire':[[6,177,250,452,124,616],[237,177,254,452,350,616],[478,176,296,453,580,616],[718,179,253,450,833,616],[963,176,247,453,1080,616],[1193,173,295,456,1304,616],[1416,176,256,453,1527,616],[1647,176,269,453,1782,616]],
    guard:[[10,130,301,683,150,800],[286,150,294,663,432,800],[565,193,282,620,706,800],[835,227,270,586,973,800],[1100,205,286,608,1240,800],[1385,129,287,684,1521,800]],
    special:[[10,140,225,570,125,695],[239,139,219,571,350,695],[444,149,275,561,568,695],[664,143,357,567,789,695],[907,141,380,569,1037,695],[1155,178,345,532,1294,695],[1444,158,248,552,1557,695],[1684,174,227,536,1792,695]],
    jump:[[4,327,272,409,146,726],[249,268,259,468,378,726],[498,164,237,466,624,616],[726,109,239,446,846,544],[950,77,249,478,1060,540],[1188,154,246,490,1310,630],[1415,307,269,429,1542,726],[1661,266,255,470,1792,726]],
    shot:[[10,241,297,365,50,423],[317,278,259,297,355,423],[585,308,222,237,620,423],[823,324,225,210,860,423],[1052,333,222,196,1094,423],[1293,344,200,169,1334,423],[1511,343,213,161,1548,423],[1741,346,163,151,1772,423]],
    explosion:[[24,461,118,140,81,590],[150,400,176,203,237,590],[331,333,250,270,457,590],[578,254,280,349,715,590],[833,151,430,452,1048,590],[1252,317,263,286,1383,590],[1517,359,229,244,1633,590],[1751,363,154,240,1829,590]],
  };
  const sheets={};
  for(const name of Object.keys(frames)){const img=new Image();img.src=`nun-${name}.webp`;sheets[name]=img;}
  // Exclude neighboring bodies, casings, and the baked-in flying grenades.
  const masks={
    attack:{
      1:[[234,647],[234,300],[300,184],[420,184],[420,342],[496,391],[485,431],[407,390],[409,540],[422,647]],
      2:[[438,647],[475,480],[458,358],[489,257],[532,184],[661,184],[643,265],[707,266],[707,308],[659,315],[661,387],[618,410],[645,647]],
      3:[[656,647],[684,492],[675,383],[707,284],[754,184],[906,184],[882,266],[947,267],[947,311],[872,315],[852,410],[891,647]],
      4:[[913,647],[945,488],[934,365],[968,276],[1011,184],[1153,184],[1126,266],[1167,255],[1205,233],[1249,279],[1235,332],[1172,322],[1104,376],[1100,476],[1140,647]],
    },
    'run-fire':{
      2:[[478,625],[500,479],[480,375],[520,267],[555,177],[682,177],[663,282],[704,274],[774,284],[752,348],[697,363],[659,410],[694,526],[674,625]],
      3:[[718,625],[734,520],[759,454],[744,368],[776,277],[809,207],[894,179],[916,199],[900,291],[971,308],[971,365],[909,395],[905,458],[947,564],[952,625]],
      5:[[1193,625],[1213,493],[1195,369],[1235,256],[1270,173],[1390,173],[1382,276],[1420,277],[1488,286],[1463,349],[1403,359],[1370,406],[1378,529],[1364,625]],
      6:[[1416,625],[1450,526],[1465,455],[1445,376],[1480,286],[1520,209],[1580,176],[1642,176],[1630,295],[1672,326],[1672,377],[1610,397],[1599,460],[1635,543],[1580,625]],
    },
    special:{
      3:[[665,708],[706,551],[715,446],[691,423],[718,316],[783,208],[834,143],[900,143],[906,245],[876,282],[967,287],[1021,332],[1008,380],[963,365],[936,346],[889,419],[890,588],[903,708]],
      4:[[907,708],[959,576],[997,459],[969,437],[984,336],[1029,245],[1083,199],[1113,141],[1173,141],[1164,257],[1275,248],[1287,288],[1162,344],[1127,418],[1126,608],[1148,708]],
      5:[[1155,708],[1196,577],[1256,441],[1225,428],[1253,334],[1302,220],[1333,178],[1407,178],[1407,263],[1398,291],[1450,352],[1500,383],[1486,425],[1454,402],[1410,370],[1408,438],[1384,507],[1402,708]],
    },
  };
  function state(f){
    if(f.special>0)return 'special';
    if(f.attack>0)return Math.abs(f.vx)>12 && f.grounded?'run-fire':'attack';
    if(f.guarding)return 'guard';
    if(!f.grounded||f.landing>0)return 'jump';
    return Math.abs(f.vx)>12?'walk':'idle';
  }
  const isolated=new Map();
  function isolate(name,index){
    const key=`${name}:${index}`;if(isolated.has(key))return isolated.get(key);
    const [x,y,w,h]=frames[name][index],c=document.createElement('canvas');c.width=w;c.height=h;
    const context=c.getContext('2d',{willReadFrequently:true});
    const mask=masks[name]?.[index];
    if(mask){context.beginPath();mask.forEach(([mx,my],i)=>i?context.lineTo(mx-x,my-y):context.moveTo(mx-x,my-y));context.closePath();context.clip();}
    context.drawImage(sheets[name],x,y,w,h,0,0,w,h);
    // Keep the connected character, removing disconnected pieces of adjacent poses.
    // Done once per frame, never inside the recurring animation work.
    const pixels=context.getImageData(0,0,w,h),data=pixels.data,seen=new Uint8Array(w*h),queue=new Int32Array(w*h);
    let largest=[];
    for(let start=0;start<w*h;start++){
      if(seen[start]||data[start*4+3]<32)continue;
      let head=0,tail=1;queue[0]=start;seen[start]=1;
      while(head<tail){
        const p=queue[head++],px=p%w,py=Math.floor(p/w);
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
          const nx=px+dx,ny=py+dy;if(nx<0||nx>=w||ny<0||ny>=h)continue;
          const n=ny*w+nx;if(!seen[n]&&data[n*4+3]>=32){seen[n]=1;queue[tail++]=n;}
        }
      }
      if(tail>largest.length)largest=Array.from(queue.subarray(0,tail));
    }
    const keep=new Uint8Array(w*h);
    for(const p of largest){const px=p%w,py=Math.floor(p/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=px+dx,ny=py+dy;if(nx>=0&&nx<w&&ny>=0&&ny<h)keep[ny*w+nx]=1;}}
    for(let p=0;p<w*h;p++)if(!keep[p])data[p*4+3]=0;
    context.putImageData(pixels,0,0);isolated.set(key,c);return c;
  }
  function frame(ctx,name,index,px,py,scale,facing=1){
    const img=sheets[name];if(!img.complete||!img.naturalWidth)return false;
    const [x,y,w,h,ax,ay]=frames[name][index];
    ctx.save();ctx.translate(px,py);ctx.scale(facing*scale,scale);
    const mask=masks[name]?.[index];
    if(mask){ctx.beginPath();mask.forEach(([mx,my],i)=>i?ctx.lineTo(mx-ax,my-ay):ctx.moveTo(mx-ax,my-ay));ctx.closePath();ctx.clip();}
    if(name==='shot'||name==='explosion')ctx.drawImage(img,x,y,w,h,x-ax,y-ay,w,h);
    else ctx.drawImage(isolate(name,index),x-ax,y-ay);
    ctx.restore();return true;
  }
  window.SilencioNun={state,draw(ctx,f){
    const action=state(f),name=action==='idle'?'attack':action;
    let i=0;
    if(action==='walk')i=Math.floor(f.walkDistance/13)%8;
    else if(action==='attack'||action==='run-fire')i=Math.min(7,Math.floor((.56-f.attack)/.07));
    else if(action==='special')i=Math.min(7,Math.floor((.8-f.special)/.1));
    else if(action==='guard')i=f.blocked>0?3:Math.min(2,Math.floor(f.guardTime*14));
    else if(action==='jump')i=f.grounded?6:f.jumpTime<.07?0:f.jumpTime<.14?1:f.vy< -230?2:Math.abs(f.vy)<=230?4:5;
    ctx.save();ctx.globalAlpha=f.hurt>0?.72:1;
    const result=frame(ctx,name,Math.max(0,i),f.x+f.w/2,f.y+f.h,96/({walk:485,attack:450,'run-fire':410,guard:610,special:495,jump:420}[name]),f.facing);
    ctx.restore();return result;
  },drawShot(ctx,x,y,age,facing){
    return frame(ctx,'shot',Math.min(7,Math.floor(age/.045)),x,y,.13,facing);
  },drawExplosion(ctx,x,y,age){
    return frame(ctx,'explosion',Math.min(7,Math.floor(age/.075)),x,y+35,.42);
  },drawGrenade(ctx,x,y,age){
    const img=sheets.special;if(!img.complete||!img.naturalWidth)return false;
    ctx.save();ctx.translate(x,y);ctx.rotate(age*8);ctx.drawImage(img,1495,124,54,60,-8,-9,16,18);ctx.restore();return true;
  }};
})();
