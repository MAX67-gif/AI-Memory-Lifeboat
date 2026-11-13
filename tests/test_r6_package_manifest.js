'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');const readText=p=>fs.readFileSync(path.join(root,p),'utf8');const SHA=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'PUBLIC_PACKAGE_MANIFEST.json'),'utf8'));
const excluded=new Set(['PUBLIC_PACKAGE_MANIFEST.json','FILE_SHA256SUMS.txt']);
test('R6 package manifest only lists safe relative public file paths and correct bytes',()=>{
  assert.equal(manifest.schema,'aml.public-package.v1');
  assert.equal(manifest.version,'0.10.3-preview-source');
  assert.equal(manifest.github_publication,'EXTERNAL_VERIFICATION_REQUIRED');
  assert.equal(manifest.github_branch_merge,'EXTERNAL_VERIFICATION_REQUIRED');
  assert.ok(Array.isArray(manifest.files)&&manifest.files.length>=40);
  const seen=new Set();
  for(const f of manifest.files){
    assert.match(f.path,/^[a-zA-Z0-9_./-]+$/);
    assert.ok(!f.path.startsWith('/')&&!f.path.split('/').includes('..'));
    assert.ok(!excluded.has(f.path));
    assert.ok(!f.path.includes('PRIVATE')&&!f.path.includes('Project-Brain'));
    assert.ok(!seen.has(f.path));seen.add(f.path);
    assert.equal(SHA(f.path),f.sha256,`SHA mismatch: ${f.path}`);
    assert.equal(fs.statSync(path.join(root,f.path)).size,f.bytes);
  }
  assert.ok(seen.has('examples/synthetic-numbered-export.zip'));
  assert.ok(seen.has('tests/test_shards_r6.js'));assert.ok(seen.has('dist/AI_Memory_Lifeboat_Offline.html'));assert.ok(seen.has('src/gateway.js')); 
});
test('R6 SHA256SUMS and manifest list have exactly the same public files',()=>{
 const rows=fs.readFileSync(path.join(root,'FILE_SHA256SUMS.txt'),'utf8').trim().split('\n').map(s=>s.match(/^([a-f0-9]{64})  (.+)$/));
 assert.ok(rows.every(Boolean));
 assert.equal(rows.length,manifest.files.length);
 const indexed=new Map(manifest.files.map(x=>[x.path,x.sha256]));
 for(const [,sha,p] of rows)assert.equal(indexed.get(p),sha);
});

test('R6 package records snapshot provenance rather than live GitHub publication claims',()=>{
 const m=manifest; assert.equal(m.provenance_scope,'LOCAL_PACKAGE_SNAPSHOT_NOT_LIVE_GITHUB_STATE');
 for(const p of ['README.md','README.en.md','index.html'])assert.doesNotMatch(readText(p),/v0\.6\.0 Sandbox Preview|not merged on GitHub|尚未發佈 GitHub/);
});
