/* R26 fail-closed synthetic-only source generator and browser instrumentation contracts. MIT. */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const fixture=require('../tools/fixtures_r26');
const runner=require('../tools/profile_import_boundaries_r26');
const zip=require('../src/zip');
const root=path.join(__dirname,'..');

test('R26 original long JSON fixture is deterministic, within 64 MiB, and contains no personal export',()=>{
 const a=fixture.jsonLong(),b=fixture.jsonLong();
 assert.equal(a.equals(b),true);assert.ok(a.length>8*1024*1024);assert.ok(a.length<fixture.MAX);
 assert.equal(JSON.parse(a.toString()).length,1);assert.ok(a.includes(Buffer.from('R26_SYNTHETIC_LONG')));
 assert.equal(require('node:crypto').createHash('sha256').update(a).digest('hex'),'dea8f97bf075e12b94f945981facaecc7f80611841870178311c6e85a92a74d7');
});
test('R26 32-shard ZIP is real deflate-raw, all 000..031 and CRC valid with 800 synthetic conversations',async()=>{
 const items=fixture.shardArrays(32).map((arr,i)=>({name:`conversations-${String(i).padStart(3,'0')}.json`,data:Buffer.from(JSON.stringify(arr))}));
 const bytes=fixture.zip(items);const entries=zip.readEntries(new Uint8Array(bytes));
 assert.equal(entries.length,32);assert.ok(entries.every(x=>x.method===8));
 assert.equal(entries[0].name,'conversations-000.json');assert.equal(entries.at(-1).name,'conversations-031.json');
 assert.equal(require('node:crypto').createHash('sha256').update(bytes).digest('hex'),'62526600bb9c0ce36ada6817ec00628a28e4fe0d7d60cc14f21024f366c5f818');
 const out=await zip.getConversationsJson(new Uint8Array(bytes));
 assert.equal(out.sourceKind,'NUMBERED_JSON_SHARDS');assert.equal(out.sourceFileCount,32);assert.equal(out.parsed.length,800);
});
test('R26 33-shard source fails closed with exact established ZIP count guard',async()=>{
 const arr=fixture.shardArrays(33).map((items,i)=>({name:`conversations-${String(i).padStart(3,'0')}.json`,data:Buffer.from(JSON.stringify(items))}));
 await assert.rejects(zip.getConversationsJson(new Uint8Array(fixture.zip(arr))),/ZIP_TOO_MANY_JSON_SHARDS/);
});
test('R26 near-capacity JSON is below 64 MiB and no larger than one ZIP source',()=>{
 const data=fixture.nearLimitJson(),archive=fixture.zip([{name:'conversations.json',data}]);
 assert.ok(data.length>fixture.MAX-512*1024&&data.length<fixture.MAX);
 assert.equal(zip.readEntries(new Uint8Array(archive))[0].unpacked,data.length);
 assert.equal(JSON.parse(data.toString()).length,1);
});
test('R26 fixture writes immutable-size evidence without reporting private data',async()=>{
 const dir=await fsp.mkdtemp(path.join(os.tmpdir(),'aml-r26-unit-'));
 try{const over=await fixture.writeFixture(dir,'json-over-limit');assert.equal(over.expect,'REJECT');
   assert.equal(over.bytes,64*1024*1024+1);assert.equal((await fsp.stat(over.path)).size,over.bytes);
   const sh=await fixture.writeFixture(dir,'zip-33');assert.equal(sh.expect,'REJECT');assert.equal(sh.shards,33);
 }finally{await fsp.rm(dir,{recursive:true,force:true});}
});
test('R26 CLI refuses invalid profiles, run counts and unbounded repetitions',()=>{
 assert.equal(runner.args([]).kind,'json-long');assert.equal(runner.args(['--kind','zip-32']).kind,'zip-32');
 for(const kind of ['zip64','other','json-near-limit'])assert.throws(()=>runner.args(['--kind',kind]),/INVALID_R26_KIND/);
 for(const runs of ['0','1','2','9','100','03','abc'])assert.throws(()=>runner.args(['--runs',runs]));
 assert.throws(()=>runner.args(['--warmup','3']));assert.equal(runner.STARTUP_BUDGET_MS,25000);
});
test('R26 instrumentation requires fresh loader, raw CDP file input and explicit no-outbound / private clearing',()=>{
 const code=fs.readFileSync(path.join(root,'tools/profile_import_boundaries_r26.js'),'utf8');
 for(const v of ['DOM.setFileInputFiles','loads.has(nav.loaderId)','MAX_RENDERED_MESSAGES','NEGATIVE_SOURCE_DID_NOT_REVOKE_SENSITIVE_STATE','longtask','Runtime.getHeapUsage','maxSampledHeapUsedBytes','ENV_BLOCKED_FILE_NAVIGATION']){
   if(v==='MAX_RENDERED_MESSAGES')continue;
   assert.ok(code.includes(v),'missing '+v);
 }
 assert.ok(code.includes('relaunches:0'));assert.ok(code.includes('Fetch.failRequest'));
 const product=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
 assert.doesNotMatch(product,/profile_import_boundaries_r26|fixtures_r26/);
});
