import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test,expect} from 'vitest';
const context={window:{} as any};
runInNewContext(readFileSync('public/games/zombie/camera.js','utf8'),context);
const camera=context.window.AditivoCamera;
test('map expands every three cards, zoom stops after three reductions',()=>{
  expect(camera.layout(2,960,540).zoom).toBe(1);
  for(const n of [3,6,9]) expect(camera.layout(n,960,540).zoom).toBeLessThan(camera.layout(n-1,960,540).zoom);
  expect(camera.layout(12,960,540).zoom).toBe(camera.layout(9,960,540).zoom);
  expect(camera.layout(30,960,540).width).toBeGreaterThan(camera.layout(12,960,540).width);
});
test('pointer conversion follows camera offset and zoom',()=>{
  const view={x:1100,y:800,zoom:.8};
  expect(camera.toWorld(480,270,view,960,540)).toEqual({x:1100,y:800});
  expect(camera.toWorld(560,350,view,960,540)).toEqual({x:1200,y:900});
});
test('camera stops at arena boundaries',()=>{
  expect(camera.center(-1000,-100,1200,960)).toBe(380);
  expect(camera.center(5000,-100,1200,960)).toBe(620);
});
