import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test, expect } from 'vitest';
const context = {window:{} as {AditivoWeapons:{dropForCards(n:number):string|null; collect(a:string|null,b:string):string}}};
runInNewContext(readFileSync('public/games/zombie/weapons.js','utf8'),context);
const rules=context.window.AditivoWeapons;
test('drops depend on chosen cards: first, third, then five more',()=>{
  expect(Array.from({length:10},(_,n)=>rules.dropForCards(n))).toEqual([null,'knife',null,'shotgun',null,null,null,null,'staff',null]);
});
test('collecting an old drop cannot downgrade the equipped weapon',()=>{
  expect(rules.collect(null,'knife')).toBe('knife');
  expect(rules.collect('knife','shotgun')).toBe('shotgun');
  expect(rules.collect('shotgun','staff')).toBe('staff');
  expect(rules.collect('staff','knife')).toBe('staff');
});
