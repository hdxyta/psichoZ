(() => {
  // Each pose has its own foot anchor; the sheets are not a uniform grid.
  const frames={
    walk:[[0,125,281,591,191,698],[240,125,317,591,433,698],[498,125,283,591,679,698],[723,125,263,591,906,698],[956,125,260,591,1130,698],[1207,125,250,591,1369,698],[1422,125,253,591,1593,698],[1656,125,260,591,1835,698]],
    jump:[[9,430,288,305,212,721],[263,294,286,441,444,721],[523,213,250,522,650,714],[733,150,253,507,892,640],[950,110,254,530,1110,624],[1184,201,276,490,1347,682],[1404,311,276,424,1580,721],[1645,399,271,336,1844,721]],
    attack:[[6,190,216,505,157,679],[198,190,246,505,355,679],[410,190,265,505,575,679],[627,190,352,505,801,679],[884,190,429,505,1078,679],[1232,190,282,505,1420,679],[1473,190,221,505,1620,679],[1667,190,249,505,1833,679]],
    guard:[[0,182,317,601,230,773],[294,182,295,601,494,773],[550,182,289,601,739,773],[805,182,300,601,1001,773],[1063,247,342,536,1270,773],[1343,182,329,601,1583,773]],
    special:[[0,296,190,396,135,678],[157,296,251,396,306,678],[351,296,290,396,513,678],[624,296,280,396,793,678],[906,296,277,396,1070,678],[1187,296,173,396,1304,678],[1433,296,192,396,1550,678],[1688,296,228,396,1831,678]],
    magic:[[19,337,125,171,87,427],[144,279,232,275,263,427],[369,302,250,229,538,427],[593,304,337,238,829,427],[916,311,321,208,1143,427],[1244,348,258,156,1435,427],[1500,359,211,132,1656,427],[1716,334,191,192,1838,427]],
    fire:[[9,551,247,236,138,755],[244,500,245,289,369,755],[481,420,239,369,606,755],[711,268,250,521,837,755],[949,105,257,684,1082,755],[1192,10,261,785,1320,755],[1440,163,259,626,1565,755],[1686,290,230,499,1809,755]],
  };
  const sheets={},cache=new Map();
  for(const name of Object.keys(frames)){const img=new Image();img.src=`wing-${name}.webp`;sheets[name]=img;}
  // Trim embedded spells at the hand. Actual magic/fire is rendered by combat.
  const masks={
    attack:{
      3:[[627,692],[657,550],[667,371],[714,288],[743,204],[826,190],[864,251],[839,300],[852,317],[907,319],[947,295],[956,315],[935,340],[957,348],[938,359],[853,350],[849,475],[859,610],[891,692]],
      4:[[884,692],[923,560],[938,378],[978,300],[1018,217],[1095,190],[1122,245],[1097,294],[1106,318],[1174,322],[1189,312],[1193,341],[1175,352],[1101,350],[1108,466],[1116,614],[1166,692]],
      5:[[1232,692],[1270,550],[1291,373],[1340,275],[1390,204],[1455,190],[1477,239],[1457,286],[1464,331],[1503,367],[1500,410],[1477,397],[1457,359],[1467,522],[1471,646],[1460,692]],
      6:[[1473,692],[1502,553],[1500,440],[1531,350],[1550,284],[1580,215],[1640,190],[1674,239],[1648,288],[1660,426],[1655,611],[1680,667],[1680,692]],
    },
    guard:{3:[[805,782],[857,631],[841,502],[865,334],[927,259],[966,206],[1049,182],[1080,238],[1050,301],[1083,401],[1070,567],[1078,714],[1105,772],[1050,782]]},
    special:{
      0:[[0,689],[0,571],[18,480],[17,408],[56,349],[77,312],[144,296],[176,344],[155,394],[166,500],[164,645],[186,668],[186,689]],
      1:[[157,690],[188,560],[177,443],[220,360],[253,305],[321,296],[347,339],[333,383],[355,405],[389,391],[400,405],[390,426],[342,432],[339,561],[373,677],[373,690]],
      2:[[351,690],[410,552],[390,450],[417,364],[471,306],[538,296],[563,344],[539,388],[572,403],[608,405],[617,423],[598,437],[550,430],[550,552],[592,676],[592,690]],
      3:[[624,690],[678,552],[660,445],[700,364],[741,309],[810,296],[840,344],[815,386],[846,406],[880,412],[888,433],[857,438],[815,428],[813,568],[829,690]],
      4:[[906,690],[956,552],[934,440],[971,359],[1021,304],[1089,296],[1119,341],[1094,385],[1130,407],[1164,408],[1172,430],[1140,439],[1094,426],[1091,569],[1106,690]],
      5:[[1187,690],[1205,550],[1200,440],[1231,370],[1268,312],[1324,296],[1360,327],[1341,352],[1331,413],[1346,568],[1343,690]],
      6:[[1433,690],[1451,549],[1450,440],[1481,359],[1517,312],[1576,296],[1609,332],[1584,373],[1588,426],[1603,576],[1598,690]],
    },
  };
  function isolate(name,index){
    const key=`${name}:${index}`;if(cache.has(key))return cache.get(key);
    const [x,y,w,h]=frames[name][index],c=document.createElement('canvas');c.width=w;c.height=h;
    const ctx=c.getContext('2d',{willReadFrequently:true}),mask=masks[name]?.[index];
    if(mask){ctx.beginPath();mask.forEach(([px,py],i)=>i?ctx.lineTo(px-x,py-y):ctx.moveTo(px-x,py-y));ctx.closePath();ctx.clip();}
    ctx.drawImage(sheets[name],x,y,w,h,0,0,w,h);
    const pixels=ctx.getImageData(0,0,w,h),data=pixels.data,seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let largest=[];
    for(let start=0;start<w*h;start++){
      if(seen[start]||data[start*4+3]<32)continue;
      let head=0,tail=1;queue[0]=start;seen[start]=1;
      while(head<tail){const p=queue[head++],px=p%w,py=Math.floor(p/w);
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=px+dx,ny=py+dy;if(nx<0||nx>=w||ny<0||ny>=h)continue;const n=ny*w+nx;if(!seen[n]&&data[n*4+3]>=32){seen[n]=1;queue[tail++]=n;}}
      }
      if(tail>largest.length)largest=Array.from(queue.subarray(0,tail));
    }
    const keep=new Uint8Array(w*h);
    for(const p of largest){const px=p%w,py=Math.floor(p/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=px+dx,ny=py+dy;if(nx>=0&&nx<w&&ny>=0&&ny<h)keep[ny*w+nx]=1;}}
    for(let p=0;p<w*h;p++)if(!keep[p])data[p*4+3]=0;
    ctx.putImageData(pixels,0,0);cache.set(key,c);return c;
  }
  function state(f){
    if(f.special>0)return 'special';if(f.attack>0)return 'attack';if(f.guarding)return 'guard';
    if(!f.grounded||f.landing>0)return 'jump';return Math.abs(f.vx)>12?'walk':'idle';
  }
  function frame(ctx,name,index,x,y,scale,facing=1){
    const img=sheets[name];if(!img.complete||!img.naturalWidth)return false;
    const [sx,sy,w,h,ax,ay]=frames[name][index];
    ctx.save();ctx.translate(x,y);ctx.scale(facing*scale,scale);
    if(name==='magic'||name==='fire')ctx.drawImage(img,sx,sy,w,h,sx-ax,sy-ay,w,h);
    else ctx.drawImage(isolate(name,index),sx-ax,sy-ay);
    ctx.restore();return true;
  }
  window.SilencioWing={state,draw(ctx,f){
    const action=state(f),name=action==='idle'?'walk':action;let i=0;
    if(action==='walk')i=Math.floor(f.walkDistance/14)%8;
    else if(action==='attack')i=Math.min(7,Math.floor((.64-f.attack)/.08));
    else if(action==='special')i=Math.min(7,Math.floor((.96-f.special)/.12));
    else if(action==='guard')i=f.blocked>0?4:Math.min(3,Math.floor(f.guardTime*13));
    else if(action==='jump')i=f.grounded?7:f.jumpTime<.07?0:f.jumpTime<.14?1:f.vy< -250?2:Math.abs(f.vy)<=250?4:5;
    ctx.save();ctx.globalAlpha=f.hurt>0?.72:1;
    const result=frame(ctx,name,Math.max(0,i),f.x+f.w/2,f.y+f.h,96/({walk:505,jump:440,attack:425,guard:510,special:329}[name]),f.facing);
    ctx.restore();return result;
  },drawMagic(ctx,p){
    const i=p.impact?Math.min(7,6+Math.floor(p.age/.1)):Math.min(5,Math.floor(p.age/.055));
    return frame(ctx,'magic',i,p.x,p.y,.17,p.facing);
  },drawFire(ctx,p){
    ctx.save();ctx.globalAlpha=p.age>.8?Math.max(0,(1.05-p.age)/.25):1;
    const result=frame(ctx,'fire',Math.min(7,Math.floor(p.age/.1)),p.x,p.y,.23);ctx.restore();return result;
  }};
})();
