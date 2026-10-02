import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
function setup(){
  const scope={window:{} as any};runInNewContext(readFileSync('public/games/brawler/wing-combat.js','utf8'),scope);
  const combat=scope.window.SilencioWingCombat.create();
  const owner={x:100,y:414,w:44,h:72,hp:112,side:1,facing:1,power:18};
  const target={x:220,y:414,w:44,h:72,hp:100,side:-1};
  const platforms=[{x:0,y:486,w:960,h:34}],hits:any[]=[];
  return {combat,owner,target,platforms,hits,hit:(...args:any[])=>hits.push(args)};
}
describe('magia do Anjo Rasgado',()=>{
  it('acerta à distância uma vez, inclusive cruzando o alvo em um passo',()=>{
    const {combat,owner,target,hits,hit}=setup();combat.fire(owner);combat.update(.2,[owner,target],[],960,hit);
    expect(hits).toHaveLength(1);expect(hits[0][2]).toBe(18);expect(combat.projectiles).toHaveLength(0);
    combat.update(.1,[owner,target],[],960,hit);expect(hits).toHaveLength(1);
  });
  it('respeita obstáculos e espelha a magia ao virar',()=>{
    const {combat,owner,target,hits,hit}=setup();combat.fire(owner);
    combat.update(.2,[owner,target],[{x:180,y:400,w:10,h:60}],960,hit);expect(hits).toHaveLength(0);
    owner.facing=-1;target.x=0;combat.fire(owner);combat.update(.2,[owner,target],[],960,hit);
    expect(hits).toHaveLength(1);expect(hits[0][3]).toBe(-1);
  });
  it('ancora a chama no chão e só causa dano durante a subida, uma vez',()=>{
    const {combat,owner,target,platforms,hits,hit}=setup();combat.summon(owner,target,platforms,960);
    expect(combat.flames[0].y).toBe(486);
    combat.update(.1,[owner,target],platforms,960,hit);expect(hits).toHaveLength(0);
    for(let i=0;i<10;i++)combat.update(.1,[owner,target],platforms,960,hit);
    expect(hits).toHaveLength(1);expect(hits[0][2]).toBe(42);expect(combat.flames).toHaveLength(0);
  });
  it('usa a plataforma abaixo dos pés e não atinge alvos fora da coluna',()=>{
    const {combat,owner,target,platforms,hits,hit}=setup();owner.y=200;target.x=750;
    platforms.push({x:200,y:360,w:170,h:18});combat.summon(owner,target,platforms,960);
    expect(combat.flames[0].y).toBe(360);
    for(let i=0;i<11;i++)combat.update(.1,[owner,target],platforms,960,hit);
    expect(hits).toHaveLength(0);
    combat.fire(owner);combat.summon(owner,target,platforms,960);combat.clear();
    expect(combat.projectiles).toHaveLength(0);expect(combat.flames).toHaveLength(0);expect(combat.impacts).toHaveLength(0);
  });
});
