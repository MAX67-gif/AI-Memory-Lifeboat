/* R21: bounded message jump and unambiguous hit navigation. All fixtures synthetic. */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const v=require('../src/view_filters.js');
const messages=Array.from({length:1402},(_,i)=>({text:`Synthetic message ${i+1}`}));

test('R21 jump: explicitly numbered retained messages across 700-message windows',()=>{
 for(const [input,index,window] of [['1',0,0],['700',699,0],['701',700,1],['1110',1109,1],['1401',1400,2],['1402',1401,2]]){
   const i=v.readerMessageJump(input,messages.length);
   assert.equal(i,index);
   assert.equal(v.readerWindowForIndex(i,messages.length),window);
 }
});

test('R21 jump: malformed, out-of-range and empty requests fail closed',()=>{
 for(const raw of ['', ' ', '0','00','01','+1','-1','1.0','1e3','1e+3','0x2','3;alert(1)',' 2','2 ','1403','999999999',null,undefined,100,NaN,{},[]]){
   assert.equal(v.readerMessageJump(raw,1402),null,`Invalid jump should fail: ${String(raw)}`);
 }
 assert.equal(v.readerMessageJump('1',0),null);
 assert.equal(v.readerMessageJump('1',NaN),null);
});

test('R21 hit cursor: previous from unselected starts at LAST match',()=>{
 assert.equal(v.readerHitStep(2,-1,-1),1);
 assert.equal(v.readerHitStep(3,-1,-1),2);
 assert.equal(v.readerHitStep(2,0,-1),1);
 assert.equal(v.readerHitStep(2,1,-1),0);
});

test('R21 hit cursor: next from unselected starts at FIRST match',()=>{
 assert.equal(v.readerHitStep(3,-1,1),0);
 assert.equal(v.readerHitStep(3,0,1),1);
 assert.equal(v.readerHitStep(3,2,1),0);
});

test('R21 hit cursor: invalid dimensions and missing hits cannot produce an index',()=>{
 for(const [count,index,step] of [[0,-1,-1],[0,0,1],[-1,0,1],[2,2,1],[2,-2,1],[2,0,0],[2,0,2],[2,1.5,1],[2,'1',1],['2',1,1]]){
   assert.equal(v.readerHitStep(count,index,step),null);
 }
});

test('R21 UI requires explicit message-jump controls with accessible status',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const id of ['readerJumpWrap','readerJumpInput','readerJumpGo','readerJumpStatus']){
   assert.match(html,new RegExp(`id="${id}"`));
 }
 assert.match(html,/跳至第/);
 assert.match(html,/訊息/);
});

test('R21 app must clear obsolete search-hit highlighting before executing another query',()=>{
 const src=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
 assert.match(src,/removeAttribute\('data-reader-hit'\)/);
 assert.match(src,/readerHitStep\(/);
 assert.match(src,/readerMessageJump\(/);
});

test('R21 data boundaries: all helpers are UI-only; original retained message caps unchanged',()=>{
 assert.equal(v.readerWindow(messages,0,700).items.length,700);
 assert.equal(v.readerWindow(messages,2,700).items.length,2);
 assert.throws(()=>v.readerWindow(messages,1,701),/READER_WINDOW_SIZE/);
 const src=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
 assert.match(src,/MAX_RENDERED_MESSAGES=700/);
 assert.doesNotMatch(src,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\s*\(/);
});
