'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core=require('../src/core.js');
const sample=require('../examples/sample-conversations.json');
function row(mapping, current='a') { return [{id:'conv',title:'Title',create_time:1730000000,update_time:1730000100,mapping,current_node:current}]; }
function msg(role,parts){return {author:{role},content:{content_type:'text',parts}};}
const node=(parent,message)=>({parent,message});
test('known sample reads one current branch',()=>{
  const {audit,conversations}=core.parseChatGPTExport(sample);
  assert.equal(audit.input_records,1);
  assert.equal(audit.parsed_records,1);
  assert.equal(audit.active_visible_messages,2);
  assert.equal(conversations[0].messages[0].role,'user');
  assert.equal(conversations[0].messages[1].role,'assistant');
});
test('refuses unrelated JSON shapes and excessive records',()=>{
  assert.throws(()=>core.parseChatGPTExport({conversations:[]}),/EXPECTED/);
  assert.throws(()=>core.parseChatGPTExport(Array(30001).fill({})),/TOO_MANY/);
});
test('invalid records skipped and reported',()=>{
  let {audit}=core.parseChatGPTExport([null,{},...sample]);
  assert.equal(audit.invalid_records,2);
  assert.ok(audit.warnings.includes('INVALID_RECORDS_SKIPPED'));
});
test('current path ordered from root to leaf',()=>{
  const s=row({a:node(null,msg('user',['first'])),b:node('a',msg('assistant',['second'])),c:node('b',msg('user',['third']))},'c');
  const c=core.parseChatGPTExport(s).conversations[0];
  assert.deepEqual(c.messages.map(m=>m.text),['first','second','third']);
});
test('excludes off-branch, never flattens graph into invented history',()=>{
  const s=row({a:node(null,msg('user',['first'])),b:node('a',msg('assistant',['main'])),c:node('a',msg('assistant',['other']))},'b');
  const {audit,conversations}=core.parseChatGPTExport(s);
  assert.equal(audit.off_path_message_nodes,1);
  assert.equal(conversations[0].messages.length,2);
  assert.equal(core.searchConversations(conversations,'other').length,0);
  assert.ok(audit.warnings.includes('OFF_PATH_NODES_NOT_IN_READING_VIEW'));
});
test('missing current node and broken parent are not fabricated',()=>{
  const a=core.parseChatGPTExport(row({a:node('missing',msg('user',['secret']))},'a'));
  assert.equal(a.conversations[0].messages.length,0);
  assert.equal(a.audit.missing_current_paths,1);
  assert.ok(a.audit.warnings.includes('BROKEN_PARENT_CHAIN'));
});
test('cyclic parents bounded and warned',()=>{
  const r=core.parseChatGPTExport(row({a:node('b',msg('user',['a'])),b:node('a',msg('user',['b']))},'a'));
  assert.equal(r.conversations[0].messages.length,0);
  assert.ok(r.audit.issues.some(x=>x.code==='PARENT_CYCLE'));
});
test('role filters do not mistake tool nodes for assistant',()=>{
  const r=core.parseChatGPTExport(row({a:node(null,msg('tool',['secret tool message'])),b:node('a',msg('assistant',['answer']))},'b'));
  assert.deepEqual(r.conversations[0].messages.map(x=>x.role),['assistant']);
});
test('attachment observations are not existence claims',()=>{
  const s=row({a:node(null,{author:{role:'user'},metadata:{attachments:[{id:'abc'}]},content:{parts:[{asset_pointer:'file-service://fake'}]}})},'a');
  const a=core.parseChatGPTExport(s).audit;
  assert.equal(a.attachment_reference_observations,2);
  assert.equal(a.account_completeness,'NOT_VERIFIABLE_FROM_EXPORT');
  assert.ok(a.claims_not_made.includes('all_attachments_present'));
});
test('non-text content warned',()=>{
  const s=row({a:node(null,msg('user',['hello',{image_asset_pointer:'sensitive'}]))},'a');
  const a=core.parseChatGPTExport(s).audit;
  assert.equal(a.non_text_parts_not_rendered,1);
  assert.ok(a.warnings.includes('NON_TEXT_PARTS_NOT_RENDERED'));
});
test('search uses current path but matches titles',()=>{
  const c=core.parseChatGPTExport(sample).conversations;
  assert.equal(core.searchConversations(c,'weather').length,1);
  assert.equal(core.searchConversations(c,'nonexistent').length,0);
});
test('download HTML escapes user-provided markup and uses restrictive CSP',()=>{
  const c=core.parseChatGPTExport(row({a:node(null,msg('user',['<img src=x onerror=alert(1)> & "hello"']))},'a')).conversations[0];
  const html=core.exportConversationHtml(c);
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('default-src'));
});
test('timestamps are handled as source seconds, no current date substitution',()=>{
  assert.match(core.formatTime(0),/1970/);
  assert.equal(core.formatTime(null),'Unknown');
  assert.equal(core.formatTime(NaN),'Unknown');
});
test('JSON report contains no chat content',()=>{
  const c=core.parseChatGPTExport(row({a:node(null,msg('user',['SENSITIVE_UNIQUE_TEXT']))},'a'));
  assert.ok(!JSON.stringify(c.audit).includes('SENSITIVE_UNIQUE_TEXT'));
});
test('metadata options record ZIP count without inferring presence',()=>{
  const a=core.parseChatGPTExport(sample,{zipEntryCount:12}).audit;
  assert.equal(a.zip_entry_count,12);
  assert.equal(a.zip_entry_bytes_not_extracted,true);
});
