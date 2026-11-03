 'use strict';
const test=require('node:test'); const assert=require('node:assert/strict');
const old=require('../src/pilot.js');const newer=require('../src/pilot_r5.js');
const summary=require('../src/first_result.js');const health=require('../src/health.js');
const core=require('../src/core.js');
const privateChat=[{id:'SUPER_SECRET_ID_8',title:'Private Topic ABC',current_node:'n',mapping:{n:{parent:null,message:{author:{role:'user'},content:{parts:['MY SECRET PHRASE!']}}}}}];
const privateAudit=core.parseChatGPTExport(privateChat).audit;
test('R5 first-result human-readable summary is fully fixed and scoped to known report',()=>{
 const h=health.evaluate(privateAudit);
 const txt=summary.format(h,'PERSONAL_EXPORT');
 assert.match(txt,/帳戶資料全部匯出/);assert.match(txt,/保留/);
 assert.match(txt,/僅限/);assert.match(txt,/工具版本：0\.5\.0/);
 for(const bad of ['SUPER_SECRET_ID_8','Private Topic ABC','MY SECRET PHRASE!'])assert.ok(!txt.includes(bad));
});
test('R5 synthetic demo explicitly cannot certify account',()=>{
 const txt=summary.format(health.evaluate(privateAudit),'SYNTHETIC_DEMO');
 assert.match(txt,/合成示範/);assert.match(txt,/不是/);assert.match(txt,/無法證明/);
});
test('R5 report rejects invalid source and unsupported health schemas',()=>{
 const h=health.evaluate(privateAudit);for(const v of ['PRIVATE_TITLE','personal','',null,{},1])assert.throws(()=>summary.format(h,v));
 assert.throws(()=>summary.format({schema:'malicious',overall:'ATTENTION',checks:[]},'PERSONAL_EXPORT'));
 assert.throws(()=>summary.format({...h,overall:'COMPLETE'},'PERSONAL_EXPORT'));
});
test('R5 report never reflects untrusted health title/action/issue and ignores unknown codes',()=>{
 const h=health.evaluate(privateAudit);
 h.checks.push({code:'UNKNOWN',title:'SUPER_PRIVATE_TOPIC',action:'../SECRET.PATH'});
 h.checks.push({code:'PRESERVE_SOURCE',title:'XSS PRIVATE TITLE',action:'<script>alert(1)</script>',count:4});
 const txt=summary.format(h,'PERSONAL_EXPORT');
 for(const bad of ['SUPER_PRIVATE_TOPIC','../SECRET.PATH','XSS PRIVATE TITLE','<script>'])assert.ok(!txt.includes(bad));
 assert.match(txt,/觀察 4 項/);
});
test('R5 report does not emit unsafe counts',()=>{
 const h=health.evaluate(privateAudit);
 h.checks=[{code:'INVALID_RECORDS',count:9999999999999999999},{code:'CURRENT_PATHS',count:-2},{code:'NON_TEXT',count:'MY SECRET PHRASE!'}];
 const txt=summary.format(h,'PERSONAL_EXPORT');
 assert.doesNotMatch(txt,/9999999999999999999|MY SECRET PHRASE!/);
});
test('R5 pilot v2 contains only five whitelisted fields, no input spill',()=>{
 const data=newer.createReceipt({ease:'EASY',clarity:'CLEAR',reuse:'MAYBE',firstTask:'COMPLETED_ALONE',understandsScope:'YES',extra:'MY SECRET PHRASE!'},'PERSONAL_EXPORT');
 assert.equal(data.schema,'aml.pilot-feedback.v2');assert.equal(data.tool_version,'0.5.0');
 assert.deepEqual(Object.keys(data.answers),['ease','clarity','reuse','firstTask','understandsScope']);
 assert.equal(data.evidence_status,'SELF_REPORTED_NOT_INDEPENDENT_HUMAN_VERIFICATION');
 assert.equal(data.sharing,'USER_DOWNLOAD_ONLY_NOT_SUBMITTED');
 assert.equal(JSON.stringify(data).includes('MY SECRET PHRASE!'),false);
});
test('R5 v2 rejects arbitrary hostile enum and source values',()=>{
 for(const value of ['PRIVATE EMAIL@example.com','<img onerror=1>','DONE','../test','',null,5])assert.throws(()=>newer.createReceipt({firstTask:value}));
 for(const mode of [null,'other','MY SECRET PHRASE!',0])assert.throws(()=>newer.createReceipt({},mode));
 assert.throws(()=>newer.createReceipt('private'));assert.throws(()=>newer.createReceipt([]));
});
test('R5 pilot defaults are not tested; no implied success',()=>{
 const d=newer.createReceipt();
 assert.ok(Object.values(d.answers).every(x=>x==='NOT_TESTED'));
 assert.equal(d.evidence_status,'SELF_REPORTED_NOT_INDEPENDENT_HUMAN_VERIFICATION');
});
test('R4 pilot v1 still produces identical 0.4.0 schema and choices',()=>{
 const previous=old.createReceipt({ease:'EASY',clarity:'CLEAR',reuse:'YES'});
 assert.equal(previous.schema,'aml.pilot-feedback.v1');assert.equal(previous.tool_version,'0.4.0');
 assert.deepEqual(Object.keys(previous.answers),['ease','clarity','reuse']);
});
test('R5 navigation and downloads present; scoped privacy guard remains',()=>{
 const fs=require('node:fs'); const path=require('node:path');
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 assert.match(html,/id="downloadFirstResult"/);
 assert.match(html,/id="pilotTask"/);assert.match(html,/id="pilotScope"/);
 for(const target of ['auditTitle','compareTitle','browseTitle'])assert.ok(html.includes(`href="#${target}"`));
 assert.match(html,/connect-src 'none'/);
});
