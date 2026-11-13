/* R16 public contract: deterministic, local-only comparison routing and coverage filters. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('../src/view_filters.js');
const CORE = require('../src/core.js');
const counts = Object.freeze({ONLY_IN_NEW_EXPORT:2, NOT_IN_NEW_EXPORT:1,CURRENT_VIEW_CHANGED:3, METADATA_ONLY_CHANGED:1, NO_DETECTED_CURRENT_VIEW_CHANGE:4,INCONCLUSIVE_ID:2,INCONCLUSIVE_PATH:3,INCONCLUSIVE_TEXT:5,INCONCLUSIVE_TITLE:7});

test('R16: unknown headline counts all four inconclusive status categories', () => {
  assert.equal(F.countUnknown(counts),17);
  assert.equal(F.countUnknown({}),0);
});
test('R16: unknown comparison is routed to a warning, ahead of changed/not-seen groups', () => {
  const route=F.routeComparison({counts});
  assert.equal(route.code,'REVIEW_UNCERTAIN');
  assert.match(route.message,/無法完整比較/);
  assert.match(route.message,/不是完整備份認證/);
});
test('R16: no changes detected remains explicitly limited to supported scope', () => {
  const route=F.routeComparison({counts:{NO_DETECTED_CURRENT_VIEW_CHANGE:10}});
  assert.equal(route.code,'NO_DETECTED_CHANGE_IN_SCOPE');
  assert.match(route.message,/已支援|指定範圍/);
  assert.match(route.message,/不代表兩份匯出完全相同/);
});
test('R16: changed and metadata-only results are separate bounded review routes', () => {
  assert.equal(F.routeComparison({counts:{CURRENT_VIEW_CHANGED:1}}).code,'REVIEW_DIFFERENCES');
  assert.equal(F.routeComparison({counts:{METADATA_ONLY_CHANGED:1}}).code,'REVIEW_METADATA');
});
test('R16: comparison filters do not convert missing, unknown or unchanged into deletion proof', () => {
  const statuses=['ONLY_IN_NEW_EXPORT','NOT_IN_NEW_EXPORT','CURRENT_VIEW_CHANGED','METADATA_ONLY_CHANGED','NO_DETECTED_CURRENT_VIEW_CHANGE','INCONCLUSIVE_PATH','INCONCLUSIVE_ID','INCONCLUSIVE_TEXT','INCONCLUSIVE_TITLE'];
  const items=statuses.map((status,i)=>({status,title:`synthetic ${i}`}));
  assert.equal(F.filterComparison(items,'ALL').length,8);
  assert.deepEqual(F.filterComparison(items,'UNKNOWN').map(x=>x.status),statuses.slice(5));
  assert.deepEqual(F.filterComparison(items,'DIFFERENCES').map(x=>x.status),['CURRENT_VIEW_CHANGED']);
  assert.deepEqual(F.filterComparison(items,'NOT_SEEN').map(x=>x.status),['NOT_IN_NEW_EXPORT']);
  assert.deepEqual(F.filterComparison(items,'NEW').map(x=>x.status),['ONLY_IN_NEW_EXPORT']);
  assert.deepEqual(F.filterComparison(items,'METADATA').map(x=>x.status),['METADATA_ONLY_CHANGED']);
  assert.throws(()=>F.filterComparison(items,'NOT_AN_OPTION'),/INVALID_COMPARE_FILTER/);
});
test('R16: comparison pager reaches all 241 items without silent slice(0,120) loss',()=>{
  const items=Array.from({length:241},(_,i)=>({status:'INCONCLUSIVE_TEXT',title:`Synthetic ${i}`}));
  const seen=[];
  for(let i=0;i<4;i++){const page=F.page(items,i,80);seen.push(...page.items.map(x=>x.title));assert.equal(page.totalPages,4);}
  assert.equal(new Set(seen).size,241);
  assert.equal(F.page(items,99,80).page,3);
  assert.equal(F.page(items,-99,80).page,0);
  assert.equal(F.page([],0,80).totalPages,1);
});
test('R16: non-integer page index and unsafe page size are rejected',()=>{
  assert.throws(()=>F.page([],0,0),/INVALID_PAGE_SIZE/);
  assert.throws(()=>F.page([],1.2,80),/INVALID_PAGE_INDEX/);
});
test('R16: local coverage filters isolate known title/text/path/non-text/off-path conditions',()=>{
  const cases=[{title:'a',pathStatus:'CURRENT_PATH_PRESENT',titleTruncated:true,messages:[]},
    {title:'b',pathStatus:'CURRENT_PATH_PRESENT',truncatedVisibleMessages:1,messages:[{text:'hello'}]},
    {title:'c',pathStatus:'MISSING_PARENT',messages:[]},
    {title:'d',pathStatus:'CURRENT_PATH_PRESENT',excludedNodes:1,messages:[]},
    {title:'e',pathStatus:'CURRENT_PATH_PRESENT',nonTextCount:2,messages:[]},
    {title:'f',pathStatus:'CURRENT_PATH_PRESENT',messages:[]}];
  assert.equal(F.filterConversations(cases,'ALL').length,6);
  assert.deepEqual(F.filterConversations(cases,'TITLE_TRUNCATED').map(x=>x.title),['a']);
  assert.deepEqual(F.filterConversations(cases,'TEXT_TRUNCATED').map(x=>x.title),['b']);
  assert.deepEqual(F.filterConversations(cases,'PATH_UNAVAILABLE').map(x=>x.title),['c']);
  assert.deepEqual(F.filterConversations(cases,'OTHER_BRANCH').map(x=>x.title),['d']);
  assert.deepEqual(F.filterConversations(cases,'NON_TEXT').map(x=>x.title),['e']);
});
test('R16: conversation risk filter combines with existing full-source local search',()=>{
  const cases=[{title:'umbrella',titleTruncated:true,messages:[{text:'rain'}]},{title:'garden',titleTruncated:true,messages:[{text:'umbrella'}]},{title:'weather',titleTruncated:false,messages:[{text:'umbrella'}]}];
  const searched=CORE.searchConversations(cases,'umbrella');
  assert.equal(searched.length,3);
  assert.deepEqual(F.filterConversations(searched,'TITLE_TRUNCATED').map(x=>x.title),['umbrella','garden']);
  assert.throws(()=>F.filterConversations(cases,'INVALID'),/INVALID_CONVERSATION_FILTER/);
});
