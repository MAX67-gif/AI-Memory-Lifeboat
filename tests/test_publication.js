'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('file version and copyright policy synchronized',()=>{
  for(const p of ['src/app.js','src/gateway.js','index.html','package.json','README.md','README.en.md'])assert.match(read(p),/0\.9\.0/);
  assert.match(read('src/first_result.js'),/0\.6\.0/);
  assert.match(read('src/pilot_r5.js'),/0\.5\.0/); // preserve prior v2 receipt version
  // v1 schema and implementation must remain version 0.4.0 for backwards-compatible receipts.
  assert.match(read('src/pilot.js'),/0\.4\.0/);
  assert.match(read('LICENSE'),/MIT License/);
});
test('no runtime fetch or network transports in application JS',()=>{
  for(const p of ['src/core.js','src/zip.js','src/compare.js','src/health.js','src/demo.js','src/pilot.js','src/pilot_r5.js','src/first_result.js','src/app.js','src/gateway.js']){
    const data=read(p);assert.doesNotMatch(data,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\s*\(|sendBeacon\s*\(/);
  }
});
test('HTML only references local scripts/styles and disallows connect',()=>{
  const html=read('index.html');assert.match(html,/connect-src 'none'/);
  assert.doesNotMatch(html,/<script[^>]+src=["']https?:\/\//);
  assert.match(html,/src="src\/core\.js"/);assert.match(html,/src="src\/zip\.js"/);assert.match(html,/src="src\/compare\.js"/);assert.match(html,/src="src\/health\.js"/);assert.match(html,/src="src\/demo\.js"/);assert.match(html,/src="src\/pilot\.js"/);assert.match(html,/src="src\/pilot_r5\.js"/);assert.match(html,/src="src\/first_result\.js"/);assert.match(html,/src="src\/gateway\.js"/);
});
test('public source does not contain private archive or real user exports',()=>{
  const files=['README.md','README.en.md','SECURITY.md','PRIVACY.md','index.html'];
  for(const name of files){const data=read(name);assert.doesNotMatch(data,/sk-[A-Za-z0-9]{20,}/);}
  assert.ok(fs.existsSync(path.join(root,'examples/sample-conversations.json')));
});
