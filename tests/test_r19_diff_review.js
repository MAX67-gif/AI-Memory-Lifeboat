/* R19: local-only comparison workbench, no transcript data in portable review guidance. MIT. */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const V=require('../src/view_filters.js');
const rows=Array.from({length:321},(_,i)=>({status:[
  'INCONCLUSIVE_PATH','INCONCLUSIVE_ID','INCONCLUSIVE_TEXT','INCONCLUSIVE_TITLE',
  'ONLY_IN_NEW_EXPORT','NOT_IN_NEW_EXPORT','CURRENT_VIEW_CHANGED','METADATA_ONLY_CHANGED','NO_DETECTED_CURRENT_VIEW_CHANGE'
][i%9],title:`Private title ${i} X-TOP-SECRET-${i};`}));
const counts=Object.fromEntries(Object.keys(V.DIFF_GROUPS||{}).map(k=>[k,0]));
const countByStatus=Object.fromEntries([...new Set(rows.map(x=>x.status))].map(s=>[s,rows.filter(x=>x.status===s).length]));
test('R19 baseline: existing 80-per-page navigation covers all 321 review items',()=>{
  const all=V.filterComparison(rows,'ALL');
  let emitted=[];for(let p=0;p<4;p++)emitted.push(...V.page(all,p,80).items);
  assert.equal(all.length,286); // no-detected-change is intentionally omitted from review list
  assert.equal(emitted.length,286);assert.equal(new Set(emitted).size,286);
});
test('R19: four independent unknown causes are separately selectable',()=>{
  for(const [group,status] of Object.entries({UNKNOWN_PATH:'INCONCLUSIVE_PATH',UNKNOWN_ID:'INCONCLUSIVE_ID',UNKNOWN_TEXT:'INCONCLUSIVE_TEXT',UNKNOWN_TITLE:'INCONCLUSIVE_TITLE'})){
    const items=V.filterComparison(rows,group);
    assert.ok(items.length>0);assert.ok(items.every(x=>x.status===status));
  }
  assert.equal(V.filterComparison(rows,'UNKNOWN').length,144);
});
test('R19: local-only title search combines with status filter and is case-insensitive',()=>{
  const filtered=V.filterComparison(rows,'UNKNOWN_TITLE','   x-tOp-SeCrEt-003  ');
  assert.deepEqual(filtered,[]);
  const filtered2=V.filterComparison(rows,'UNKNOWN_TITLE','x-top-secret-3;');
  assert.equal(filtered2.length,1);assert.equal(filtered2[0].title,'Private title 3 X-TOP-SECRET-3;');
  assert.equal(V.filterComparison(rows,'ALL','no-match-private-text').length,0);
  assert.throws(()=>V.filterComparison(rows,'UNKNOWN',{}),/INVALID_COMPARE_SEARCH/);
});
test('R19: direct 1-based page jump validates and never silently coerces garbage',()=>{
  assert.equal(V.jumpToPage('2',5),1);
  assert.equal(V.jumpToPage('5',5),4);
  assert.equal(V.jumpToPage('0',5),null);
  assert.equal(V.jumpToPage('6',5),null);
  for(const bad of ['', ' ', ' 1', '1.0', '1e2','+2','-1', 'NaN','Infinity','01','0x2','1a',{}, 3])
    assert.equal(V.jumpToPage(bad,5),null);
  assert.equal(V.jumpToPage('1',1),0);
});
test('R19: privacy-safe review guidance whitelists counts, never personal fields',()=>{
  const summary={schema:'aml.snapshot-diff.v1',counts:countByStatus,
    title:'NEVER-LEAK-PRIVATE-TITLE',account:'my-address@example.com',items:rows,secret:'SHOULD-NOT-EXIST',
    warnings:['person@example.com'],input_summary:{older:{records:100},newer:{records:200}}};
  const out=V.formatReviewGuide(summary);
  assert.match(out,/INCONCLUSIVE_TEXT/);assert.match(out,/INCONCLUSIVE_TITLE/);
  assert.match(out,/帳戶|完整/);assert.match(out,/未見|刪除/);
  for(const secret of ['Private title','X-TOP-SECRET','NEVER-LEAK','my-address@example.com','SHOULD-NOT-EXIST','person@example.com'])
    assert.equal(out.includes(secret),false,secret);
  assert.ok(Buffer.byteLength(out,'utf8')<8192);
  assert.equal(V.formatReviewGuide(summary),out);
});
test('R19: review guidance under unknown/truncation never claims equality',()=>{
  const txt=V.formatReviewGuide({counts:{INCONCLUSIVE_TEXT:8,NO_DETECTED_CURRENT_VIEW_CHANGE:15}});
  assert.match(txt,/無法|未知/);assert.doesNotMatch(txt,/帳戶已完整備份|所有內容均相同/);
});
test('R19: missing counts are safe zeros, not injected arbitrary text',()=>{
  const text=V.formatReviewGuide({counts:{INCONCLUSIVE_ID:'9999',NOT_IN_NEW_EXPORT:-3,ONLY_IN_NEW_EXPORT:Infinity}});
  assert.match(text,/INCONCLUSIVE_ID: 0/);
  assert.match(text,/NOT_IN_NEW_EXPORT: 0/);
});
test('R19: no claim of zero uncertainty if unknown-counts present',()=>{
 const text=V.formatReviewGuide({counts:{INCONCLUSIVE_PATH:1}});
 assert.match(text,/先核對|先檢查/);assert.doesNotMatch(text,/完全相同/);
});
test('R19 UI contains separate unknown filters, search, jump and privacy-safe TXT control',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 for(const id of ['compareSearch','compareUnknownBreakdown','comparePageJump','compareGoPage','downloadReviewGuide'])assert.match(html,new RegExp(`id="${id}"`));
 for(const group of ['UNKNOWN_PATH','UNKNOWN_ID','UNKNOWN_TEXT','UNKNOWN_TITLE'])assert.match(html,new RegExp(`value="${group}"`));
});
