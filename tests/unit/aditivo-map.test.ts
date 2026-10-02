import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test,expect} from 'vitest';
const context={window:{} as any};
runInNewContext(readFileSync('public/games/zombie/cemetery.js','utf8'),context);
const map=context.window.AditivoMap;
const bounds={left:0,top:0,width:960,height:540};
test('walls stop movement and dash without blocking the four church doors',()=>{
  const body={x:350,y:180};
  map.move(body,-120,0,12,bounds);
  expect(body.x).toBeGreaterThan(320);
  for(const [x,y] of [[565,480],[970,480],[768,365],[768,637]]) expect(map.clear(x-288,y-210,12)).toBe(true);
  expect(map.sight({x:350,y:180},{x:280,y:180})).toBe(false);
});
test('zombies find a route to the church from each side',()=>{
  const target={x:480,y:270},nav=map.navigation(bounds,target);
  for(const start of [{x:220,y:170},{x:720,y:170},{x:480,y:30},{x:480,y:500}]) {
    const body={...nav.nearest(start)};
    for(let i=0;i<1000 && Math.hypot(body.x-target.x,body.y-target.y)>20;i++) {
      const p=nav.direction(body),d=Math.hypot(p.x-body.x,p.y-body.y)||1;
      map.move(body,(p.x-body.x)/d*Math.min(3,d),(p.y-body.y)/d*Math.min(3,d),12,bounds);
      expect(map.clear(body.x,body.y,12,bounds)).toBe(true);
    }
    expect(Math.hypot(body.x-target.x,body.y-target.y)).toBeLessThan(21);
  }
});
test('separation resolves actor overlap without pushing through walls',()=>{
  const bodies=[{x:480,y:270},{x:480,y:270},{x:484,y:270}];
  for(let i=0;i<10;i++) map.separate(bodies,bounds);
  for(let i=0;i<bodies.length;i++) for(let j=i+1;j<bodies.length;j++) expect(Math.hypot(bodies[i].x-bodies[j].x,bodies[i].y-bodies[j].y)).toBeGreaterThan(23.9);
  bodies.forEach(p=>expect(map.clear(p.x,p.y,12,bounds)).toBe(true));
});

test('outer streets remain connected through cemetery gates after expansion',()=>{
  const full={left:map.left,top:map.top,width:map.width,height:map.height};
  const target={x:480,y:270},nav=map.navigation(full,target);
  for(const start of [{x:480,y:-175},{x:480,y:765},{x:-240,y:270},{x:1190,y:270}]) {
    const body={...nav.nearest(start)};
    expect(Math.hypot(body.x-start.x,body.y-start.y)).toBeLessThan(30);
    for(let i=0;i<1500 && Math.hypot(body.x-target.x,body.y-target.y)>20;i++) {
      const p=nav.direction(body),d=Math.hypot(p.x-body.x,p.y-body.y)||1;
      map.move(body,(p.x-body.x)/d*Math.min(4,d),(p.y-body.y)/d*Math.min(4,d),12,full);
    }
    expect(Math.hypot(body.x-target.x,body.y-target.y)).toBeLessThan(21);
  }
});
