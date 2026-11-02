'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const health=require('../src/health.js');const core=require('../src/core.js');
const chat=[{id:'id-private',title:'PRIVATE TITLE',current_node:'a',mapping:{a:{parent:null,message:{author:{role:'user'},content:{parts:['PRIVATE SECRET TEXT']}}}}}];
function audit(){return core.parseChatGPTExport(chat).audit;}
test('R3 status is LIMITED_CHECK_OK only for supported checks, never full backup verified',()=>{
  const a=health.evaluate(audit());
  assert.equal(a.overall,'LIMITED_CHECK_OK');
  assert.equal(a.account_completeness,'NOT_VERIFIABLE_FROM_EXPORT');
  assert.ok(a.checks.some(x=>x.code==='PRESERVE_SOURCE'));
  assert.ok(a.checks.some(x=>x.code==='JSON_LIMIT'));
  assert.ok(a.limitations.includes('NOT_FULL_ACCOUNT_BACKUP_CERTIFICATION'));
});
test('R3 invalid record and missing path require attention',()=>{
  const a=audit();a.invalid_records=1;a.missing_current_paths=2;
  const report=health.evaluate(a);
  assert.equal(report.overall,'ATTENTION');
  assert.equal(report.checks.find(x=>x.code==='CURRENT_PATHS').count,2);
});
test('R3 attachment path and byte CRC errors distinguish review vs attention',()=>{
  const a=audit();a.attachment_reference_observations=2;
  a.archive_path_assessment={schema:'aml.archive-path-assessment.v1',missing_explicit_paths:1};
  const report=health.evaluate(a,{bytes:{schema:'aml.attachment-bytes.v1',failed_integrity:2,skipped_budget:1}});
  assert.equal(report.overall,'ATTENTION');
  assert.ok(report.checks.some(x=>x.code==='ZIP_PATH_MISSING'));
  assert.ok(report.checks.some(x=>x.code==='BYTE_FAILURE'));
  assert.ok(report.checks.some(x=>x.code==='BYTE_LIMIT'));
  assert.equal(report.byte_check_performed,true);
});
test('R3 comparison limitation reports no inferred deletion',()=>{
  const a=audit();const report=health.evaluate(a,{diff:{schema:'aml.snapshot-diff.v1',counts:{NOT_IN_NEW_EXPORT:3}}});
  assert.equal(report.overall,'REVIEW');
  assert.ok(report.checks.some(x=>x.code==='DIFF_LIMIT'));
  assert.ok(report.checks.find(x=>x.code==='DIFF_LIMIT').action.includes('不等於帳戶已刪除'));
});
test('R3 fixed UI copy and report are sanitized, never copy arbitrary input strings',()=>{
  const a=audit();a.issues=[{code:'EVIL_NAME',detail:'PRIVATE SECRET TEXT'}];
  a.zip_entry_count=2;a.warnings=['PRIVATE TITLE'];
  a.archive_path_assessment={schema:'aml.archive-path-assessment.v1',matched_unique_paths:1,unsafe_path_references:1};
  const s=JSON.stringify(health.evaluate(a));
  for(const v of ['PRIVATE TITLE','PRIVATE SECRET TEXT','id-private','EVIL_NAME'])assert.ok(!s.includes(v));
  assert.doesNotMatch(s,/"(?:file_path|conversation_id)"/);
});
test('R3 rejects unrelated audit objects; hostile negative counts cannot affect statuses',()=>{
  assert.throws(()=>health.evaluate({schema:'alien'}),/HEALTH_INVALID_AUDIT/);
  const a=audit();a.invalid_records=-99;
  assert.equal(health.evaluate(a).overall,'LIMITED_CHECK_OK');
});
