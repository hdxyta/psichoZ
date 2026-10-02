import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
function setup(){
  const scope={window:{} as any};
  runInNewContext(readFileSync('public/games/brawler/nun-combat.js','utf8'),scope);
  const combat=scope.window.SilencioNunCombat.create();
  const owner={x:100,y:414,w:44,h:72,power:22,side:1,hp:100,facing:1};
  const target={x:180,y:414,w:44,h:72,side:-1,hp:100};
  const hits:any[]=[];
  const hit=(...args:any[])=>hits.push(args);
  return {combat,owner,target,hits,hit};
}
describe('projéteis da Freira Armada',()=>{
  it('atinge à distância sem atravessar alvos estreitos, uma vez por bala',()=>{
    const {combat,owner,target,hits,hit}=setup();
    combat.fire(owner);combat.update(.1,[owner,target],[],960,hit);
    expect(hits).toHaveLength(1);expect(hits[0][2]).toBe(22);
    expect(combat.projectiles).toHaveLength(0);
    combat.update(.1,[owner,target],[],960,hit);expect(hits).toHaveLength(1);
  });
  it('respeita a direção e uma plataforma entre arma e alvo',()=>{
    const {combat,owner,target,hits,hit}=setup();
    combat.fire(owner);combat.update(.1,[owner,target],[{x:170,y:400,w:5,h:40}],960,hit);
    expect(hits).toHaveLength(0);expect(combat.projectiles).toHaveLength(0);
    owner.facing=-1;target.x=0;combat.fire(owner);combat.update(.1,[owner,target],[],960,hit);
    expect(hits).toHaveLength(1);expect(hits[0][3]).toBe(-1);
  });
  it('granada sobe, rebate no chão e explode uma única vez com dano em área',()=>{
    const {combat,owner,target,hits,hit}=setup();target.x=475;
    combat.fire(owner,true);
    const initialY=combat.projectiles[0].y;
    combat.update(.1,[owner,target],[{x:0,y:486,w:960,h:30}],960,hit);
    expect(combat.projectiles[0].y).toBeLessThan(initialY);
    for(let i=0;i<70;i++)combat.update(.02,[owner,target],[{x:0,y:486,w:960,h:30}],960,hit);
    expect(combat.projectiles).toHaveLength(0);expect(hits).toHaveLength(1);
    expect(hits[0][2]).toBe(44);expect(hits[0][4]).toBe(true);
  });
  it('não causa dano fora do raio e limpa tiros e efeitos entre rounds',()=>{
    const {combat,owner,target,hits,hit}=setup();target.x=850;
    combat.fire(owner,true);
    for(let i=0;i<70;i++)combat.update(.02,[owner,target],[{x:0,y:486,w:960,h:30}],960,hit);
    expect(hits).toHaveLength(0);
    combat.fire(owner);expect(combat.projectiles).toHaveLength(1);
    combat.clear();expect(combat.projectiles).toHaveLength(0);expect(combat.visuals).toHaveLength(0);
  });
});
