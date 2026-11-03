'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const zlib=require('node:zlib');
const {crc32,getConversationsJson,MAX_JSON_SHARDS}=require('../src/zip.js');
const core=require('../src/core.js');const health=require('../src/health.js');
const first=require('../src/first_result.js');
function row(id){return {id,title:'Synthetic '+id,current_node:'m',mapping:{m:{parent:null,message:{author:{role:'user'},content:{parts:['hello '+id]}}}}};}
function entry(name,raw=[],opts={}){return {name,raw:typeof raw==='string'?raw:JSON.stringify(raw),...opts};}
function makeZip(entries){
 let chunks=[],central=[],offset=0;let count=0;
 for(const e of entries){
  const name=Buffer.from(e.name,'utf8');
  const raw=Buffer.from(e.raw,'utf8');
  const deflated=e.deflate?zlib.deflateRawSync(raw):raw;
  const method=e.deflate?8:0;
  const crc=crc32(raw), local=Buffer.alloc(30), dir=Buffer.alloc(46);
  local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(method,8);
  local.writeUInt32LE(crc,14);local.writeUInt32LE(deflated.length,18);local.writeUInt32LE(raw.length,22);local.writeUInt16LE(name.length,26);
  dir.writeUInt32LE(0x02014b50,0);dir.writeUInt16LE(20,4);dir.writeUInt16LE(20,6);dir.writeUInt16LE(method,10);
  dir.writeUInt32LE(e.corruptCRC?crc^0x1:crc,16);dir.writeUInt32LE(deflated.length,20);dir.writeUInt32LE(e.fakeSize??raw.length,24);
  dir.writeUInt16LE(name.length,28);dir.writeUInt32LE(offset,42);
  chunks.push(local,name,deflated);central.push(dir,name);offset+=local.length+name.length+deflated.length;count++;
 }
 const center=Buffer.concat(central),end=Buffer.alloc(22);
 end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(count,8);end.writeUInt16LE(count,10);
 end.writeUInt32LE(center.length,12);end.writeUInt32LE(offset,16);
 return new Uint8Array(Buffer.concat([...chunks,center,end]));
}
const shard=(i,rows,opts={})=>entry(`conversations-${String(i).padStart(3,'0')}.json`,rows,opts);
const fail=async(entries,code)=>assert.rejects(getConversationsJson(makeZip(entries)),new RegExp(`ZIP_${code}`));
test('R6: two numbered parts imported in order with no silent truncation',async()=>{
 const r=await getConversationsJson(makeZip([shard(1,[row('later')]),shard(0,[row('first')])]));
 assert.equal(r.sourceKind,'NUMBERED_JSON_SHARDS'); assert.equal(r.sourceFileCount,2);
 assert.deepEqual(r.parsed.map(x=>x.id),['first','later']);
 assert.equal(core.parseChatGPTExport(r.parsed).audit.parsed_records,2);
});
test('R6: nested consistent folder supported, unrelated files ignored',async()=>{
 const entries=[entry('asset.png','image'),entry('export/conversations-001.json',[row('b')],{deflate:true}),entry('export/conversations-000.json',[row('a')],{deflate:true})];
 const r=await getConversationsJson(makeZip(entries)); assert.equal(r.entryCount,3); assert.equal(r.parsed.length,2);
});
test('R6: single classic still compatible',async()=>{
 const r=await getConversationsJson(makeZip([entry('conversations.json',[row('old')])]));
 assert.equal(r.sourceKind,'SINGLE_JSON');assert.equal(r.sourceFileCount,1);assert.equal(r.targetPath,'conversations.json');
});
test('R6: reject mixing classic and numbered to avoid duplicate/partial reads',async()=>{
 await fail([entry('conversations.json',[]),shard(0,[])],'AMBIGUOUS_JSON_SOURCES');
});
test('R6: reject missing shard 000',async()=>{await fail([shard(1,[])],'MISSING_JSON_SHARD');});
test('R6: reject noncontiguous shard numbering',async()=>{await fail([shard(0,[]),shard(2,[])],'MISSING_JSON_SHARD');});
test('R6: reject duplicate numbered shard',async()=>{await fail([shard(0,[]),shard(0,[])],'DUPLICATE_JSON_SHARD');});
test('R6: reject different subdirectories',async()=>{
 await fail([entry('a/conversations-000.json',[]),entry('b/conversations-001.json',[])],'MULTIPLE_SHARD_DIRECTORIES');
});
test('R6: reject non-standard numeric naming instead of silently ignoring it',async()=>{
 await fail([entry('conversations-0.json',[])],'UNSUPPORTED_SHARD_NAME');
});
test('R6: reject more than 32 parts',async()=>{
 await fail(Array.from({length:MAX_JSON_SHARDS+1},(_,i)=>shard(i,[])),'TOO_MANY_JSON_SHARDS');
});
test('R6: reject claimed total uncompressed shard bytes over limit before decompression',async()=>{
 await fail([shard(0,[],{fakeSize:64*1024*1024}),shard(1,[])],'JSON_SHARDS_TOO_LARGE');
});
test('R6: reject invalid JSON array type (all shards required)',async()=>{
 await fail([shard(0,[row('ok')]),entry('conversations-001.json','{}')],'EXPECTED_CONVERSATIONS_ARRAY');
});
test('R6: reject corrupted CRC in second shard, not report partial success',async()=>{
 await fail([shard(0,[]),shard(1,[row('bad')],{corruptCRC:true})],'CRC_MISMATCH');
});
test('R6: duplicate IDs retained as conflict instead of silently deduplicating',async()=>{
 const r=await getConversationsJson(makeZip([shard(0,[row('duplicate')]),shard(1,[row('duplicate')])]));
 const parsed=core.parseChatGPTExport(r.parsed);
 assert.equal(parsed.conversations.length,2);
 assert.ok(parsed.audit.issues.some(x=>x.code==='DUPLICATE_CONVERSATION_ID'));
});
test('R6: single numbered file is review, not verified complete',()=>{
 const p=core.parseChatGPTExport([row('isolated')]);p.audit.source_container='SINGLE_NUMBERED_JSON';p.audit.numbered_json_parts=1;
 const h=health.evaluate(p.audit);assert.equal(h.overall,'REVIEW');
 assert.ok(h.checks.some(x=>x.code==='SINGLE_NUMBERED_JSON'));
 const message=first.format(h,'PERSONAL_EXPORT');assert.match(message,/可能還有其他分片/);
 assert.doesNotMatch(message,/isolated/);
});
test('R6: shard count is safe to report but file names never appear in shareable guidance',()=>{
 const p=core.parseChatGPTExport([row('PRIVATE_TITLE_123')]);p.audit.source_container='NUMBERED_JSON_SHARDS';p.audit.numbered_json_parts=3;
 const h=health.evaluate(p.audit);assert.equal(h.checks.find(x=>x.code==='MULTIPLE_NUMBERED_JSON').count,3);
 const message=first.format(h,'PERSONAL_EXPORT');assert.match(message,/觀察 3 項/);
 assert.doesNotMatch(JSON.stringify(h)+message,/PRIVATE_TITLE_123|conversations-000\.json/);
});
test('R6: numbered conversation JSON is not wrongly counted as an unrelated attachment',async()=>{
 const zipBytes=makeZip([shard(0,[row('a')]),shard(1,[row('b')])]);
 const opened=await getConversationsJson(zipBytes);
 const a=core.assessArchiveReferences(opened.parsed,opened.entries);
 assert.equal(a.non_conversations_file_entries,0);
});
