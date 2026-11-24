/* R28 synthetic-only source/data and conditional browser rendering checks. */
'use strict';
const assert=require('node:assert/strict'),test=require('node:test');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const {MATRIX,STARTUP_BUDGET_MS,CDP_BUDGET_MS,SHADOW_RULE,fixture,baselineHtml,options}=
  require('../tools/verify_longtext_r28.js');
const src=()=>fs.readFileSync(path.join(root,'src/app.js'),'utf8');
const css=fs.readFileSync(path.join(root,'style.css'),'utf8');
const html=fs.readFileSync(path.join(root,'dist/AI_Memory_Lifeboat_Offline.html'),'utf8');
test('R28 scoped offscreen CSS preserves DOM semantics and print visibility',()=>{
  assert.equal(css.split(SHADOW_RULE).length-1,1);
  assert.match(css,/@media print\{\.conversation-detail \.message\{content-visibility:visible\}\}/);
  assert.match(css,/\.message pre\{white-space:pre-wrap;overflow-wrap:anywhere/);
  assert.match(src(),/MAX_RENDERED_MESSAGES=700/);
  assert.match(src(),/e\.detail\.append\(section\)/);
  assert.match(src(),/focusReaderMessage\(/);
  assert.match(src(),/revokeSensitiveExport\(/);
});
test('R28 original-code-only CSP baseline has one hash change and no product JS removal',()=>{
  const baseline=baselineHtml(html);
  assert.notEqual(html,baseline);
  assert.match(html,/content-visibility:auto/);
  assert.doesNotMatch(baseline,/content-visibility:auto/);
  assert.match(baseline,/connect-src 'none'/);
  assert.match(baseline,/script-src 'sha256-/);
  const candScripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
  const baseScripts=[...baseline.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
  assert.equal(candScripts.length,11);assert.deepEqual(candScripts,baseScripts);
});
test('R28 synthetic matrix precommitted, sizes bounded and SHA deterministic',()=>{
  assert.deepEqual(MATRIX.map(x=>[x.messages,x.chars]),[[20,8000],[80,16000],[120,32000],
    [240,38500],[240,64000],[701,8000]]);
  const a=fixture(240,38500),b=fixture(240,38500);
  assert.equal(a.sha256,b.sha256);assert.equal(a.bytes,b.bytes);
  assert.equal(JSON.parse(a.json.toString())[0].current_node,'r28-m239');
  assert.ok(a.bytes>9e6&&a.bytes<10e6);
  assert.throws(()=>fixture(700,64000),/R28_UNREGISTERED_FIXTURE/);
  for(const x of MATRIX){const item=fixture(x.messages,x.chars);assert.ok(item.bytes<64*1024*1024);}
});
test('R28 browser hard-gates new loader, 15s CDP, current-path/700 and private HTML revoke',()=>{
  assert.equal(STARTUP_BUDGET_MS,25000);assert.equal(CDP_BUDGET_MS,15000);
  const script=fs.readFileSync(path.join(root,'tools/verify_longtext_r28.js'),'utf8');
  for(const marker of ['FRESH_DOCUMENT','CDP_TIMEOUT_','R28_BOUNDED_WINDOW_MISMATCH',
    'R28_FOCUS_OR_ORIGINAL_TEXT_LOST','R28_PRIVATE_CONSENT_OR_DOM_SCRUB',
    'R28_UNEXPECTED_RUNTIME_OR_OUTBOUND'])assert.ok(script.includes(marker),marker);
  assert.match(script,/relaunches:0/);
  assert.deepEqual(options([])['include-baseline'],undefined);
  assert.equal(options(['--include-baseline'])['include-baseline'],true);
});
test('R28 product does not add upload routes, modify original ZIP limits or remove HTML consent',()=>{
  assert.doesNotMatch(src(),/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\s*\(/);
  const zip=fs.readFileSync(path.join(root,'src/zip.js'),'utf8');
  assert.match(zip,/MAX_ARCHIVE = 128 \* 1024 \* 1024/);
  assert.match(zip,/MAX_UNPACKED_JSON = 64 \* 1024 \* 1024/);
  assert.match(zip,/MAX_JSON_SHARDS = 32/);
  assert.match(src(),/e\.htmlExportConfirm\.showModal\(\)/);
  assert.match(src(),/if\(!allowed\)return;/);
});
