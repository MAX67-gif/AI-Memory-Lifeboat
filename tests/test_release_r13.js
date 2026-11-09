/* R13 explicit one-time official Release and consent boundary — synthetic tests only. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');const rd=x=>fs.readFileSync(path.join(root,x),'utf8');
const flow=rd('.github/workflows/release-offline-r13.yml');
const scripts=[...flow.matchAll(/^        run: \|\n((?:(?:^          .*\n)|(?:^\n))*)/gm)].map(x=>x[1].split('\n').map(y=>y.startsWith('          ')?y.slice(10):y).join('\n'));
test('R13 Release workflow only publishes canonical v0.10.2 main, without overwrites',()=>{
 assert.match(flow,/^  push:\n    branches: \[main\]/m);
 assert.doesNotMatch(flow,/\bpull_request:\s*\n/);
 assert.match(flow,/github\.repository == 'MAX67-gif\/AI-Memory-Lifeboat'/);
 assert.match(flow,/version.*0\.10\.2/);
 assert.match(flow,/permissions:\n  contents: read/);
 assert.match(flow,/    permissions:\n      contents: write/);
 assert.match(flow,/cancel-in-progress: false/);
 assert.match(flow,/existing="\$\(git ls-remote --tags origin/);
 assert.match(flow,/\[\[ -n "\$existing" \]\]/);
 assert.doesNotMatch(flow,/--clobber|--force|\bforce: true|release upload/);
 for(const s of scripts){const r=cp.spawnSync('bash',['-n'],{input:s,encoding:'utf8'});assert.equal(r.status,0,r.stderr);}
});
test('R13 release requires check and exact-source artifact checksums',()=>{
 assert.match(flow,/npm run check/);
 assert.match(flow,/git archive --format=zip --output=release\/AI_Memory_Lifeboat_Source_v0\.10\.2\.zip HEAD/);
 assert.match(flow,/sha256sum -c SHA256SUMS\.txt/);
 assert.match(flow,/unzip -tq/);
 assert.match(flow,/--target "\$GITHUB_SHA"/);
 assert.match(flow,/--notes-file docs\/R13_RELEASE_NOTES\.md/);
 assert.ok(flow.indexOf('npm run check')<flow.indexOf('gh release create'));
});
test('R13 source and single-file contain an accessible bounded, consent-protected HTML export',()=>{
 for(const h of ['index.html','dist/AI_Memory_Lifeboat_Offline.html']){
  const html=rd(h);assert.match(html,/<dialog id="htmlExportConfirm"/);
  assert.match(html,/aria-labelledby="htmlExportConfirmTitle"/);
  assert.match(html,/id="confirmHtmlExport"/);
  assert.match(html,/id="cancelHtmlExport"/);
  assert.match(html,/聊天原文/);
 }
 const s=rd('src/app.js');assert.match(s,/function requestSensitiveExport\(/);assert.match(s,/function confirmSensitiveExport\(/);assert.match(s,/function revokeSensitiveExport\(/);
 assert.match(s,/e\.html\.addEventListener\('click',requestSensitiveExport\)/);
 assert.doesNotMatch(s,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\s*\(/);
 assert.match(rd('dist/AI_Memory_Lifeboat_Offline.html'),/connect-src 'none'/);
});

test('R13 bounded content exports fail closed without changing parser data contracts',()=>{
  const source=rd('src/core.js'),app=rd('src/app.js');
  assert.match(source,/MAX_HTML_EXPORT_BYTES = 16 \* 1024 \* 1024/);
  assert.match(source,/HTML_EXPORT_TOO_LARGE/);
  assert.match(app,/已取消下載/);
  assert.match(app,/HTML_EXPORT_TOO_LARGE/);
  assert.doesNotMatch(app,/\bfetch\s*\(|\bXMLHttpRequest\b/);
});
