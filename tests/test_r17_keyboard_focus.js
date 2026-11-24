/* R17: deterministic keyboard focus targets, safety and bounded local navigation. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const view=require('../src/view_filters.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('R17: Up/Down/Home/End stay on current list page and clamp at bounds',()=>{
 assert.equal(view.keyboardTargetIndex('ArrowUp',0,200),0);
 assert.equal(view.keyboardTargetIndex('ArrowDown',199,200),199);
 assert.equal(view.keyboardTargetIndex('ArrowDown',0,200),1);
 assert.equal(view.keyboardTargetIndex('ArrowUp',100,200),99);
 assert.equal(view.keyboardTargetIndex('Home',150,200),0);
 assert.equal(view.keyboardTargetIndex('End',150,200),199);
 assert.equal(view.keyboardTargetIndex('End',1,3),2);
});
test('R17: unknown keys and invalid/empty list never navigate or select',()=>{
 for(const key of ['Enter',' ','Tab','Escape','a','PageDown'])assert.equal(view.keyboardTargetIndex(key,1,4),null);
 for(const [index,count] of [[-1,5],[5,5],[0,0],[1,-2],[1,1.5],[NaN,5]])assert.equal(view.keyboardTargetIndex('ArrowDown',index,count),null);
});
test('R17: local list focus is explicitly restored after a re-render',()=>{
 const app=read('src/app.js');
 assert.match(app,/restoreFocus=typeof e\.list\.contains/);
 assert.match(app,/e\.list\.querySelector\('\[aria-current="true"\]'\)\?\.focus\(\{preventScroll:true\}\)/);
 assert.match(app,/view\.keyboardTargetIndex\(ev\.key,currentIndex,buttons\.length\)/);
 assert.match(app,/if\(target===null\)return/);
 assert.match(app,/ev\.preventDefault\(\);buttons\[target\]\.focus/);
 assert.doesNotMatch(app,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\s*\(/);
});
test('R17: source and generated standalone expose matching keyboard instructions',()=>{
 for(const f of ['index.html','dist/AI_Memory_Lifeboat_Offline.html']){
  const html=read(f);assert.match(html,/Home／End/);assert.match(read('src/app.js'),/aria-current/);
  assert.match(html,/v0\.11\.2 Preview/);
 }
 assert.match(read('dist/AI_Memory_Lifeboat_Offline.html'),/connect-src 'none'/);
});
