'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('file version and copyright policy synchronized',()=>{
  for(const p of ['src/core.js','src/zip.js','src/compare.js','src/app.js','index.html','package.json','README.md'])assert.match(read(p),/0\.2\.0/);
  assert.match(read('LICENSE'),/MIT License/);
});
test('no runtime fetch or network transports in application JS',()=>{
  for(const p of ['src/core.js','src/zip.js','src/compare.js','src/app.js']){
    const data=read(p);assert.doesNotMatch(data,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\s*\(|sendBeacon\s*\(/);
  }
});
test('HTML only references local scripts/styles and disallows connect',()=>{
  const html=read('index.html');assert.match(html,/connect-src 'none'/);
  assert.doesNotMatch(html,/<script[^>]+src=["']https?:\/\//);
  assert.match(html,/src="src\/core\.js"/);assert.match(html,/src="src\/zip\.js"/);assert.match(html,/src="src\/compare\.js"/);
});
test('public source does not contain private archive or real user exports',()=>{
  const files=['README.md','README.en.md','SECURITY.md','PRIVACY.md','index.html'];
  for(const name of files){const data=read(name);assert.doesNotMatch(data,/sk-[A-Za-z0-9]{20,}/);}
  assert.ok(fs.existsSync(path.join(root,'examples/sample-conversations.json')));
});
