/* R21 explicit one-time official Release and consent boundary — synthetic tests only. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');const rd=x=>fs.readFileSync(path.join(root,x),'utf8');
const flow=rd('.github/workflows/release-offline-r21.yml');
const scripts=[...flow.matchAll(/^        run: \|\n((?:(?:^          .*\n)|(?:^\n))*)/gm)].map(x=>x[1].split('\n').map(y=>y.startsWith('          ')?y.slice(10):y).join('\n'));
test('R21 Release workflow only publishes canonical v0.11.0 main, without overwrites',()=>{
 assert.match(flow,/^  push:\n    branches: \[main\]/m);
 assert.doesNotMatch(flow,/\bpull_request:\s*\n/);
 assert.match(flow,/github\.repository == 'MAX67-gif\/AI-Memory-Lifeboat'/);
 assert.match(flow,/version.*0\.11\.0/);
 assert.match(flow,/permissions:\n  contents: read/);
 assert.match(flow,/    permissions:\n      contents: write/);
 assert.match(flow,/cancel-in-progress: false/);
 assert.match(flow,/existing="\$\(git ls-remote --tags origin/);
 assert.match(flow,/\[\[ -n "\$existing" \]\]/);
 assert.doesNotMatch(flow,/--clobber|--force|\bforce: true|release upload/);
 for(const s of scripts){const r=cp.spawnSync('bash',['-n'],{input:s,encoding:'utf8'});assert.equal(r.status,0,r.stderr);}
});
test('R21 release requires check and exact-source artifact checksums',()=>{
 assert.match(flow,/npm run check/);
 assert.match(flow,/git archive --format=zip --output=release\/AI_Memory_Lifeboat_Source_v0\.11\.0\.zip HEAD/);
 assert.match(flow,/sha256sum -c SHA256SUMS\.txt/);
 assert.match(flow,/unzip -tq/);
 assert.match(flow,/--target "\$GITHUB_SHA"/);
 assert.match(flow,/--notes-file docs\/R21_RELEASE_NOTES\.md/);
 assert.ok(flow.indexOf('npm run check')<flow.indexOf('gh release create'));
});
test('R21 source and single-file contain an accessible bounded, consent-protected HTML export',()=>{
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

test('R21 bounded content exports fail closed without changing parser data contracts',()=>{
  const source=rd('src/core.js'),app=rd('src/app.js');
  assert.match(source,/MAX_HTML_EXPORT_BYTES = 16 \* 1024 \* 1024/);
  assert.match(source,/HTML_EXPORT_TOO_LARGE/);
  assert.match(app,/已取消下載/);
  assert.match(app,/HTML_EXPORT_TOO_LARGE/);
  assert.doesNotMatch(app,/\bfetch\s*\(|\bXMLHttpRequest\b/);
});

test('R21: comparison and risk controls are both in the generated and source HTML',()=>{
 for(const h of ['index.html','dist/AI_Memory_Lifeboat_Offline.html']){
  const html=rd(h);
  for(const id of ['compareRoute','compareFilter','comparePager','comparePrev','compareNext','coverageMetrics','riskFilter'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/connect-src 'none'/);
 }
 assert.match(rd('src/app.js'),/view\.countUnknown\(c\)/);
 assert.match(rd('src/app.js'),/view\.filterComparison/);
 assert.match(rd('src/app.js'),/view\.filterConversations/);
 assert.match(rd('src/app.js'),/COMPARE_PAGE_SIZE=80/);
});

test('R21: selected data must be on this visible list page before private export remains enabled',()=>{
 const s=rd('src/app.js'),v=rd('src/view_filters.js');
 assert.match(s,/view\.page\(matched,listPage,LIST_PAGE_SIZE\)/);
 assert.match(s,/view\.selectionOnCurrentPage\(current\.conversations,selected,page\.items\)/);
 assert.match(s,/revokeSensitiveExport\(\);resetReaderSession\(\);selected=null;e\.html\.disabled=true;/);
 assert.match(v,/selectionOnCurrentPage/);
});

test('R21 local title search and private TXT remain display-only, never change snapshot comparison schema',()=>{
 const app=rd('src/app.js'),view=rd('src/view_filters.js'),summary=rd('src/compare.js');
 assert.match(app,/formatReviewGuide\(compared\.summary\)/);
 assert.match(app,/filterComparison\(compared\.items,e\.compareFilter\.value,e\.compareSearch\.value\)/);
 assert.match(app,/e\.compareSearch\.value=''/);
 assert.match(view,/jumpToPage/);
 assert.match(view,/UNKNOWN_PATH/);
 assert.match(summary,/const SCHEMA='aml\.snapshot-diff\.v1'/);
 assert.doesNotMatch(app,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\s*\(/);
});

test('R21: retained-message navigation and search controls preserve strict CSP and sensitive export gate',()=>{
 for(const h of ['index.html','dist/AI_Memory_Lifeboat_Offline.html']){
  const html=rd(h);
  for(const id of ['readerTools','readerPrev','readerNext','readerWindowInfo','readerQuery','readerFind','readerPrevHit','readerNextHit','readerHitInfo'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/最多 700 則/);
 }
 const s=rd('src/app.js');
 assert.match(s,/view\.readerSearchHits\(c\.messages,query\)/);
 assert.match(s,/resetReaderSession\(\)/);
 assert.match(s,/MAX_RENDERED_MESSAGES=700/);
 assert.match(s,/function requestSensitiveExport\(/);
 assert.doesNotMatch(s,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\s*\(/);
});

test('R21 new message jumping and navigation are bounded, deterministic and render safely',()=>{
 const html=rd('index.html');
 for(const id of ['readerJumpInput','readerJumpGo','readerJumpWrap','readerJumpStatus'])assert.match(html,new RegExp(`id="${id}"`));
 const app=rd('src/app.js'),view=rd('src/view_filters.js');
 assert.match(app,/view\.readerMessageJump/);
 assert.match(app,/view\.readerHitStep/);
 assert.match(app,/removeAttribute\('data-reader-hit'\)/);
 assert.match(view,/function readerMessageJump/);
 assert.match(view,/function readerHitStep/);
 assert.match(app,/MAX_RENDERED_MESSAGES=700/);
 assert.doesNotMatch(app,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\s*\(/);
});
