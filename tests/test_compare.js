'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const core=require('../src/core.js');const cmp=require('../src/compare.js');
const msg=(value,role='user')=>({author:{role},create_time:1730000123,content:{content_type:'text',parts:[value]}});
const row=(id,title='Record',value='content',extra={})=>({id,title,mapping:{a:{parent:null,message:msg(value)}},current_node:'a',...extra});
const parse=rows=>core.parseChatGPTExport(rows);
const counts=(a,b)=>cmp.compareSnapshots(parse(a),parse(b)).summary.counts;
test('new/absent refer only to two exports, never account deletion',()=>{
  const c=counts([row('a'),row('b')],[row('b'),row('c')]);
  assert.equal(c.ONLY_IN_NEW_EXPORT,1);assert.equal(c.NOT_IN_NEW_EXPORT,1);
  const sum=cmp.compareSnapshots(parse([row('a')]),parse([])).summary;
  assert.ok(sum.warnings.some(x=>x.includes('NOT_PROOF_OF_ACCOUNT_DELETION')));
});
test('changed active text recognized, hidden chat is not exported in summary',()=>{
  const c=cmp.compareSnapshots(parse([row('a','secret title','SECRETDATA_A')]),parse([row('a','secret title','SECRETDATA_B')]));
  assert.equal(c.summary.counts.CURRENT_VIEW_CHANGED,1);
  assert.ok(!JSON.stringify(c.summary).includes('SECRETDATA'));
  assert.ok(!JSON.stringify(c.summary).includes('secret title'));
  assert.ok(!JSON.stringify(c.summary).includes('"a"'));
});
test('metadata change distinguished from current path change',()=>{
  const c=counts([row('a','old name')],[row('a','new name')]);
  assert.equal(c.METADATA_ONLY_CHANGED,1);assert.equal(c.CURRENT_VIEW_CHANGED,0);
});
test('same current view does not claim full backup equality',()=>{
  const c=cmp.compareSnapshots(parse([row('a')]),parse([row('a')]));
  assert.equal(c.summary.counts.NO_DETECTED_CURRENT_VIEW_CHANGE,1);
  assert.ok(c.summary.warnings.some(x=>x.includes('OFF_PATH')));
});
test('off-path text changes alone are NOT certified as detected',()=>{
  const base=row('a');base.mapping.b={parent:'a',message:msg('side-1')};
  const revised=structuredClone(base);revised.mapping.b.message.content.parts=['side-2'];
  const c=counts([base],[revised]);
  assert.equal(c.NO_DETECTED_CURRENT_VIEW_CHANGE,1);
});
test('missing current path causes inconclusive, not false equality',()=>{
  const c=counts([row('a')],[row('a','x','y',{current_node:'missing'})]);
  assert.equal(c.INCONCLUSIVE_PATH,1);
});
test('missing ID is never synthesized into cross-export matching',()=>{
  const c=counts([row(null)],[row(null)]);
  assert.equal(c.INCONCLUSIVE_ID,2);
  assert.equal(c.NO_DETECTED_CURRENT_VIEW_CHANGE,0);
});
test('duplicate identifiers block comparison without choosing arbitrary version',()=>{
  const c=counts([row('a'),row('a')],[row('a')]);
  assert.equal(c.INCONCLUSIVE_ID,1);assert.equal(c.CURRENT_VIEW_CHANGED,0);
});
test('comparison rejects unrelated inputs',()=>{
  assert.throws(()=>cmp.compareSnapshots(null,null),/INVALID_SNAPSHOT_PAIR/);
  assert.throws(()=>cmp.compareSnapshots({conversations:[],audit:{schema:'wrong'}},{conversations:[],audit:{schema:'aml.audit.v1'}}),/INVALID_SNAPSHOT_PAIR/);
});
test('counts add up exactly to displayed local items',()=>{
  const r=cmp.compareSnapshots(parse([row('a'),row('b')]),parse([row('b'),row('c')]));
  assert.equal(Object.values(r.summary.counts).reduce((a,b)=>a+b,0),r.items.length);
});
