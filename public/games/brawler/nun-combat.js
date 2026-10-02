(() => {
  // Simulation is independent of rendering so missing sprites never disable damage.
  function create(){
    const projectiles=[],visuals=[];
    function fire(owner,grenade=false,damage=owner.power){
      const facing=owner.facing;
      const p={owner,kind:grenade?'grenade':'bullet',x:owner.x+owner.w/2+facing*34,y:owner.y+owner.h-(grenade?76:69),vx:facing*(grenade?330:880),vy:grenade?-540:0,age:0,life:grenade?1.15:.7,damage:grenade?owner.power+22:damage,facing};
      projectiles.push(p);
      if(!grenade)visuals.push({kind:'muzzle',x:p.x,y:p.y,age:0,life:.36,facing});
    }
    function update(dt,fighters,platforms,width,hit){
      for(let i=visuals.length-1;i>=0;i--){visuals[i].age+=dt;visuals[i].life-=dt;if(visuals[i].life<=0)visuals.splice(i,1);}
      for(let i=projectiles.length-1;i>=0;i--){
        const p=projectiles[i],oldX=p.x,oldY=p.y;
        p.age+=dt;p.life-=dt;
        if(p.kind==='grenade')p.vy+=1200*dt;
        p.x+=p.vx*dt;p.y+=p.vy*dt;
        const target=fighters.find(f=>f!==p.owner&&f.side!==p.owner.side&&f.hp>0);
        let remove=false;
        if(p.kind==='bullet'){
          // Swept horizontal collision prevents fast bullets skipping a fighter.
          const crossed=r=>p.y>=r.y-3&&p.y<=r.y+r.h+3&&Math.max(oldX,p.x)>=r.x&&Math.min(oldX,p.x)<=r.x+r.w;
          const distance=r=>p.facing>0?Math.max(0,r.x-oldX):Math.max(0,oldX-r.x-r.w);
          const wall=platforms.filter(crossed).sort((a,b)=>distance(a)-distance(b))[0];
          if(target&&crossed(target)&&(!wall||distance(target)<distance(wall))){hit(p.owner,target,p.damage,p.facing,false);remove=true;}
          else if(wall)remove=true;
          if(p.life<=0||p.x< -30||p.x>width+30)remove=true;
        }else{
          if(p.x<8||p.x>width-8){p.x=Math.max(8,Math.min(width-8,p.x));p.vx*=-.5;}
          for(const platform of platforms){
            if(p.x>=platform.x&&p.x<=platform.x+platform.w&&oldY+8<=platform.y&&p.y+8>=platform.y&&p.vy>=0){
              p.y=platform.y-8;p.vy=Math.abs(p.vy)>100?-p.vy*.32:0;p.vx*=.7;break;
            }
          }
          const contact=target&&p.x>=target.x-7&&p.x<=target.x+target.w+7&&p.y>=target.y-7&&p.y<=target.y+target.h+7;
          if(p.life<=0||contact){
            visuals.push({kind:'explosion',x:p.x,y:p.y,age:0,life:.6,facing:1});
            if(target){
              const dx=p.x-Math.max(target.x,Math.min(p.x,target.x+target.w));
              const dy=p.y-Math.max(target.y,Math.min(p.y,target.y+target.h));
              if(Math.hypot(dx,dy)<=96)hit(p.owner,target,p.damage,target.x+target.w/2>=p.x?1:-1,true);
            }
            remove=true;
          }
        }
        if(remove)projectiles.splice(i,1);
      }
    }
    return {projectiles,visuals,fire,update,clear(){projectiles.length=0;visuals.length=0;}};
  }
  window.SilencioNunCombat={create};
})();
