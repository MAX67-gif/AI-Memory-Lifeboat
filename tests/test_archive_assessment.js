'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const core=require('../src/core.js');
const docs=attachments=>[{
  id:'sample',current_node:'a',mapping:{a:{parent:null,message:{author:{role:'user'},metadata:{attachments},content:{parts:[{asset_pointer:'file-service://not-portable'}]}}}}
}];
const entries=['conversations.json','media/picture.png','duplicate.bin','duplicate.bin'].map(name=>({name}));
test('exact relative path only, no basename guessing, no file bytes verified',()=>{
  const a=core.assessArchiveReferences(docs([{relative_path:'media/picture.png'},{name:'picture.png'},{relative_path:'missing.png'}]),entries);
  assert.equal(a.matched_unique_paths,1);assert.equal(a.missing_explicit_paths,1);
  assert.equal(a.unverifiable_references,2);assert.equal(a.file_bytes_verified,false);
  assert.equal(a.non_conversations_file_entries,3);
});
test('reject unsafe path candidates as evidence of presence',()=>{
  const a=core.assessArchiveReferences(docs([{path:'../secret.txt'},{path:'C:\\secret.txt'},{path:'https://site.test/a'},{path:'/absolute'}]),entries);
  assert.equal(a.unsafe_path_references,4);assert.equal(a.matched_unique_paths,0);
});
test('ambiguous duplicate ZIP names never count as verified unique matching',()=>{
  const a=core.assessArchiveReferences(docs([{relative_path:'duplicate.bin'}]),entries);
  assert.equal(a.matched_unique_paths,0);assert.equal(a.ambiguous_paths,1);assert.equal(a.duplicate_entry_paths,1);
});
test('no user-supplied attachment filename leaks into counts-only assessment',()=>{
  const sensitive='SECRET_PERSONAL_SCAN.png';
  const a=core.assessArchiveReferences(docs([{path:sensitive}]),entries);
  assert.ok(!JSON.stringify(a).includes(sensitive));
});
test('invalid assessment shapes fail closed',()=>assert.throws(()=>core.assessArchiveReferences({},[]),/INVALID_ARCHIVE_ASSESSMENT/));
