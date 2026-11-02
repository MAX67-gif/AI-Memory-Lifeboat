'use strict';
const test=require('node:test'); const assert=require('node:assert/strict');
const pilot=require('../src/pilot.js'),demo=require('../src/demo.js');
const core=require('../src/core.js'),compare=require('../src/compare.js');
const newer=require('../examples/sample-newer.json'),older=require('../examples/sample-older.json');
test('R4 embedded synthetic demo is exactly the public synthetic fixtures',()=>{
 const a=demo.getSnapshots();
 assert.deepEqual(a.newer,newer);assert.deepEqual(a.older,older);
 assert.equal(core.parseChatGPTExport(a.newer).audit.input_records,newer.length);
 const out=compare.compareSnapshots(core.parseChatGPTExport(a.older),core.parseChatGPTExport(a.newer));
 assert.ok(out.summary.counts.ONLY_IN_NEW_EXPORT>=1);
});
test('R4 demo returns fresh data; no shared mutable fixture',()=>{
 const first=demo.getSnapshots();first.newer[0].title='SECRET_OVERRIDE';
 const second=demo.getSnapshots();assert.notEqual(second.newer[0].title,'SECRET_OVERRIDE');
});
test('R4 pilot receipt has only fixed choices and no user content',()=>{
 const result=pilot.createReceipt({ease:'EASY',clarity:'CLEAR',reuse:'YES'},'PERSONAL_EXPORT');
 assert.equal(result.schema,'aml.pilot-feedback.v1');assert.equal(result.tool_version,'0.4.0');
 assert.equal(result.sharing,'USER_DOWNLOAD_ONLY_NOT_SUBMITTED');
 assert.deepEqual(Object.keys(result),['schema','tool_version','source_mode','sharing','account_completeness','privacy','answers']);
 assert.deepEqual(Object.keys(result.answers),['ease','clarity','reuse']);
 assert.equal(result.privacy.contains_chat_text,false);
});
test('R4 unknown values and source types must be rejected rather than reflected',()=>{
 for(const v of ['<img src=x>','PRIVATE_TITLE','abc','PASS','file:///secret','READY'])
   assert.throws(()=>pilot.createReceipt({ease:v}));
 for(const x of ['PRIVATE_ARCHIVE','UNKNOWN','',null,0,[]])
   assert.throws(()=>pilot.createReceipt({},x));
 assert.throws(()=>pilot.createReceipt('malicious text'));assert.throws(()=>pilot.createReceipt([]));
});
test('R4 arbitrary unexpected fields never leak in shareable feedback',()=>{
 const privateValues=['REAL_EMAIL@example.com','D:/My private document','CONVERSATION_PRIVATE','person-123','MY_CHAT_TEXT','<script>'];
 const input={ease:'EASY',clarity:'CONFUSING',reuse:'MAYBE'};
 privateValues.forEach((v,i)=>{input['extra_'+i]=v;});
 let text=JSON.stringify(pilot.createReceipt(input));
 for(const v of privateValues)assert.equal(text.includes(v),false);
 assert.ok(!/\"(?:timestamp|filename|file_path|user_agent|hash)\":\"/.test(text));
});
test('R4 all defaults are NOT_TESTED and never imply human participation',()=>{
 const receipt=pilot.createReceipt();
 assert.deepEqual(receipt.answers,{ease:'NOT_TESTED',clarity:'NOT_TESTED',reuse:'NOT_TESTED'});
 assert.equal(receipt.source_mode,'PERSONAL_EXPORT');
});
