/* Synthetic performance evidence shape and fail-closed options. MIT. */
'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {fixture,stats,options}=require('../tools/profile_offline_performance.js');
test('deterministic original fixture, complete R23 marker and source-only IDs',()=>{
 const a=fixture(),b=fixture();assert.equal(a.sha256,b.sha256);assert.equal(a.original,b.original);
 assert.equal(a.messages,1402);assert.equal(a.fillers,200);
 const items=JSON.parse(a.original);assert.equal(items.length,201);
 assert.equal(Object.keys(items[0].mapping).length,1402);
 assert.equal(items[0].mapping.m1110.message.content.parts[0].includes('R23_SEARCH_HIT'),true);
 assert.equal(items[0].current_node,'m1402');assert.equal(JSON.parse(a.replacement).length,1);
 assert.ok(!JSON.stringify(items).includes('sk-'));
});
test('fixture budget accepts bounded stress and rejects unsafe sizes',()=>{
 assert.equal(JSON.parse(fixture(2804,450).original).length,451);
 for(const pair of [[1401,200],[10001,200],[1402,199],[1402,3001],[-1,200],[1402,NaN]])
   assert.throws(()=>fixture(...pair),/INVALID_SYNTHETIC_FIXTURE_SIZE/);
});
test('statistics use true numeric sort and explicit nearest-rank p95',()=>{
 assert.deepEqual(stats([8,30,10,3,1]),{n:5,medianMs:8,p95NearestRankMs:30,minMs:1,maxMs:30});
 assert.equal(stats([1,2,3,4]).medianMs,2.5);
 for(const a of [[],[1,-3],[NaN]])assert.throws(()=>stats(a));
});
test('repeat and parameter validation never silently accepts invalid input',()=>{
 const a=options([]);assert.equal(a.runs,5);assert.equal(a.warmup,1);
 assert.equal(options(['--runs','3','--messages','2804']).runs,3);
 for(const v of ['0','2','16','1.2','-5','NaN','0005'])assert.throws(()=>options(['--runs',v]));
 assert.throws(()=>options(['--warmup','4']));assert.throws(()=>options(['--fillers','1.2']));
});
