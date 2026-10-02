(() => {
  // Native 1916 x 821 coordinates; individual anchors keep claws planted.
  const frames={
    walk:[[7,239,249,342,145,573],[258,239,239,342,383,573],[498,239,236,342,622,573],[735,239,240,342,858,573],[977,239,233,342,1097,573],[1211,239,234,342,1332,573],[1446,239,234,342,1570,573],[1681,239,235,342,1800,573]],
    attack:[[3,305,197,248,110,547],[204,302,225,251,326,547],[430,265,226,288,550,547],[657,280,281,273,779,547],[914,367,404,186,1027,547],[1307,273,199,280,1410,547],[1507,282,199,271,1610,547],[1707,304,209,249,1810,547]],
    combo:[[2,231,231,296,122,510],[234,231,233,296,351,510],[468,231,235,296,584,510],[704,220,257,307,823,510],[935,220,354,307,1060,510],[1220,245,236,282,1340,510],[1453,217,221,310,1570,510],[1674,220,242,307,1792,510]],
    guard:[[4,168,308,393,154,550],[318,192,326,369,485,550],[648,228,322,333,807,550],[973,200,312,361,1138,550],[1288,175,313,386,1460,550],[1605,168,311,393,1767,550]],
    special:[[2,272,222,307,120,565],[224,263,217,316,338,565],[441,226,222,353,552,565],[661,170,244,409,785,565],[885,203,327,378,1038,565],[1120,312,334,304,1282,565],[1426,252,264,329,1550,565],[1688,260,228,321,1800,565]],
    jump:[[3,355,259,332,145,679],[272,401,277,286,420,679],[550,298,251,360,680,634],[767,192,222,359,879,539],[978,148,245,355,1100,491],[1205,140,220,337,1315,466],[1430,211,229,379,1541,578],[1642,355,274,333,1780,679]],
  };
  const sheets={};
  for(const name of Object.keys(frames)){const img=new Image();img.src=`scorpion-${name}.webp`;sheets[name]=img;}
  const masks={
    attack:{4:[[914,552],[928,431],[1000,380],[1150,393],[1210,365],[1320,375],[1320,469],[1240,488],[1112,454],[1140,552]]},
    combo:{4:[[935,525],[956,405],[974,288],[1014,220],[1135,220],[1170,292],[1290,298],[1290,337],[1140,347],[1145,410],[1223,456],[1223,493],[1140,487],[1140,525]]},
    special:{
      4:[[885,310],[885,268],[970,270],[968,218],[1019,203],[1150,231],[1208,322],[1212,439],[1160,536],[1121,560],[1120,581],[922,581],[935,459],[971,415],[953,352]],
      5:[[1130,612],[1145,547],[1183,465],[1199,394],[1260,372],[1269,312],[1314,348],[1332,413],[1370,360],[1400,362],[1390,489],[1454,484],[1454,612]],
    },
  };
  window.SilencioScorpion={draw(ctx,f){
    const action=window.SilencioFrog.state(f),name=action==='idle'?'walk':action,entries=frames[name],img=sheets[name];
    if(!img.complete || !img.naturalWidth)return false;
    let index=0;
    if(action==='walk')index=Math.floor(f.walkDistance/12)%8;
    else if(action==='attack'||action==='combo')index=Math.min(7,Math.floor((1-f.attack/.56)*8));
    else if(action==='special')index=Math.min(7,Math.floor((1-f.special/.9)*8));
    else if(action==='guard')index=f.blocked>0?2:Math.min(1,Math.floor(f.guardTime*12));
    else if(action==='jump')index=f.grounded?(f.landing>.06?6:7):f.jumpTime<.07?1:f.jumpTime<.14?2:f.vy< -230?3:Math.abs(f.vy)<=230?4:5;
    index=Math.max(0,index);
    const [x,y,w,h,ax,ay]=entries[index];
    const scale=96/({walk:330,attack:235,combo:270,guard:380,special:285,jump:325}[name]);
    ctx.save();ctx.translate(f.x+f.w/2,f.y+f.h);ctx.scale(f.facing,1);ctx.globalAlpha=f.hurt>0?.72:1;
    const mask=masks[name]?.[index];
    if(mask){ctx.beginPath();mask.forEach(([px,py],i)=>{if(i)ctx.lineTo((px-ax)*scale,(py-ay)*scale);else ctx.moveTo((px-ax)*scale,(py-ay)*scale);});ctx.closePath();ctx.clip();}
    ctx.drawImage(img,x,y,w,h,(x-ax)*scale,(y-ay)*scale,w*scale,h*scale);ctx.restore();return true;
  }};
})();
