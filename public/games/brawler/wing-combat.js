(() => {
  function create(){
    const projectiles=[],flames=[],impacts=[];
    function fire(owner){projectiles.push({owner,x:owner.x+owner.w/2+owner.facing*30,y:owner.y+owner.h-72,vx:owner.facing*620,facing:owner.facing,age:0,life:.95});}
    function summon(owner,target,platforms,width){
      const center=owner.x+owner.w/2,targetX=target.x+target.w/2;
      const ahead=(targetX-center)*owner.facing;
      const x=Math.max(36,Math.min(width-36,ahead>50&&ahead<=300?targetX:center+owner.facing*155));
      // Project down from the caster's feet, never attach the fire to the air.
      const ground=platforms.filter(p=>x>=p.x&&x<=p.x+p.w&&p.y>=owner.y+owner.h-5).sort((a,b)=>a.y-b.y)[0];
      if(ground)flames.push({owner,x,y:ground.y,age:0,hits:new Set()});
    }
    function update(dt,fighters,platforms,width,hit){
      for(let i=impacts.length-1;i>=0;i--){impacts[i].age+=dt;if(impacts[i].age>=.2)impacts.splice(i,1);}
      for(let i=projectiles.length-1;i>=0;i--){
        const p=projectiles[i],oldX=p.x;p.x+=p.vx*dt;p.age+=dt;p.life-=dt;
        const crossed=r=>p.y+7>=r.y&&p.y-7<=r.y+r.h&&Math.max(oldX,p.x)+7>=r.x&&Math.min(oldX,p.x)-7<=r.x+r.w;
        const distance=r=>p.facing>0?Math.max(0,r.x-oldX):Math.max(0,oldX-r.x-r.w);
        const candidates=[...platforms.map(r=>({r,fighter:false})),...fighters.filter(f=>f!==p.owner&&f.side!==p.owner.side&&f.hp>0).map(r=>({r,fighter:true}))];
        const collision=candidates.filter(c=>crossed(c.r)).sort((a,b)=>distance(a.r)-distance(b.r))[0];
        if(collision){
          if(collision.fighter)hit(p.owner,collision.r,p.owner.power,p.facing,false);
          impacts.push({x:p.facing>0?collision.r.x:collision.r.x+collision.r.w,y:p.y,age:0,facing:p.facing,impact:true});
        }
        if(collision||p.life<=0||p.x< -50||p.x>width+50)projectiles.splice(i,1);
      }
      for(let i=flames.length-1;i>=0;i--){
        const f=flames[i];f.age+=dt;
        // The collision follows the rising column and stops during dissipation.
        const heights=[0,35,65,105,145,172,120,75];
        const height=heights[Math.min(7,Math.floor(f.age/.1))];
        if(f.age>=.2&&f.age<.8)for(const target of fighters){
          if(target===f.owner||target.side===f.owner.side||target.hp<=0||f.hits.has(target))continue;
          if(target.x+target.w>=f.x-25&&target.x<=f.x+25&&target.y+target.h>f.y-height&&target.y<f.y+2){
            f.hits.add(target);hit(f.owner,target,f.owner.power+24,target.x+target.w/2>=f.x?1:-1,true);
          }
        }
        if(f.age>=1.05)flames.splice(i,1);
      }
    }
    return {projectiles,flames,impacts,fire,summon,update,clear(){projectiles.length=0;flames.length=0;impacts.length=0;}};
  }
  window.SilencioWingCombat={create};
})();
