/* R20: bounded reader windows and scoped, private message search. Synthetic data only. MIT. */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const view=require('../src/view_filters.js');
const root=path.join(__dirname,'..');
const messages=Array.from({length:1402},(_,i)=>({role:i%2?'assistant':'user',text:i===1109?'synthetic private marker beyond first 700':'Ordinary fictional message '+i,textTruncated:i===1300}));

test('R20: bounded 700-message windows reach after the old reader limit without silently losing anything',()=>{
 const a=view.readerWindow(messages,0),b=view.readerWindow(messages,1),c=view.readerWindow(messages,2);
 assert.deepEqual([a.items.length,b.items.length,c.items.length],[700,700,2]);
 assert.deepEqual([a.start,b.start,c.start],[0,700,1400]);
 assert.equal(c.total,1402);assert.equal(c.totalPages,3);
 assert.equal(a.items.some(x=>x.text.includes('private marker')),false);
 assert.equal(b.items.some(x=>x.text.includes('private marker')),true);
 assert.equal(new Set([...a.items,...b.items,...c.items]).size,1402);
});

test('R20: window index is conservative and bounded',()=>{
 assert.equal(view.readerWindow(messages,99).page,2);
 assert.equal(view.readerWindow(messages,-99).page,0);
 assert.throws(()=>view.readerWindow(messages,0,701),/READER_WINDOW_SIZE/);
 assert.throws(()=>view.readerWindow(messages,1.3),/READER_WINDOW_INDEX/);
 assert.equal(view.readerWindow([],0).totalPages,1);
});

test('R20: only visible kept message text is searchable, not title, hidden branches or omitted tails',()=>{
 const hit=view.readerSearchHits(messages,'PRIVATE MARKER');
 assert.deepEqual(hit,[1109]);
 assert.deepEqual(view.readerSearchHits(messages,'NOT-IN-RETENTION'),[]);
 assert.deepEqual(view.readerSearchHits(messages,''),[]);
 assert.deepEqual(view.readerSearchHits(messages,'  '),[]);
 assert.throws(()=>view.readerSearchHits(messages,{}),/READER_SEARCH_INVALID/);
 assert.throws(()=>view.readerSearchHits(messages,'X'.repeat(161)),/READER_SEARCH_LENGTH/);
});

test('R20: hit indices map to bounded window, never cause out-of-range data access',()=>{
 assert.equal(view.readerWindowForIndex(1109,1402),1);
 assert.equal(view.readerWindowForIndex(1401,1402),2);
 assert.equal(view.readerWindowForIndex(-1,1402),null);
 assert.equal(view.readerWindowForIndex(1402,1402),null);
 assert.equal(view.readerWindowForIndex('1',1402),null);
 assert.equal(view.readerWindowForIndex(1.5,1402),null);
 assert.equal(view.readerWindowForIndex(0,0),null);
});

test('R20: browsing code scopes search to selected conversation and resets on source changes',()=>{
 const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
 assert.match(app,/function resetReaderSession\(/);
 assert.match(app,/view\.readerWindow\(/);
 assert.match(app,/view\.readerSearchHits\(c\.messages,query\)/);
 assert.match(app,/view\.readerWindowForIndex\(/);
 assert.match(app,/resetReaderSession\(\);/);
 assert.doesNotMatch(app,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\s*\(/);
});

test('R20: source and built HTML have accessible bounded reader tools',()=>{
 for(const f of ['index.html','dist/AI_Memory_Lifeboat_Offline.html']){
  const html=fs.readFileSync(path.join(root,f),'utf8');
  for(const id of ['readerTools','readerPrev','readerNext','readerWindowInfo','readerQuery','readerFind','readerPrevHit','readerNextHit','readerHitInfo']){
   assert.match(html,new RegExp(`id="${id}"`));
  }
  assert.match(html,/最多 700 則/);
 }
});
