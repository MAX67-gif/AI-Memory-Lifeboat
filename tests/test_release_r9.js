/* R9 release distribution and safety regression tests. Original synthetic sources only. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');const rd=p=>fs.readFileSync(path.join(root,p),'utf8');
const workflow=rd('.github/workflows/release-offline-r9.yml');
const scriptRuns=[...workflow.matchAll(/^        run: \|\n((?:(?:^          .*\n)|(?:^\n))*)/gm)].map(x=>x[1].split('\n').map(line=>line.startsWith('          ')?line.slice(10):line).join('\n'));
test('workflow limits publication to canonical main and R9 only',()=>{
 assert.match(workflow,/^  push:\n    branches: \[main\]/m);
 assert.doesNotMatch(workflow,/\bpull_request:\s*\n/);
 assert.match(workflow,/github\.repository == 'MAX67-gif\/AI-Memory-Lifeboat'/);
 assert.match(workflow,/version.*0\.9\.0/);
 assert.match(workflow,/permissions:\n  contents: read/);
 assert.match(workflow,/    permissions:\n      contents: write/);
 assert.match(workflow,/cancel-in-progress: false/);
});
test('release assets derive from exact commit and include checksums and ZIP integrity',()=>{
 assert.match(workflow,/npm run check/);
 assert.match(workflow,/cp dist\/AI_Memory_Lifeboat_Offline\.html/);
 assert.match(workflow,/git archive --format=zip --output=release\/AI_Memory_Lifeboat_Source_v0\.9\.0\.zip HEAD/);
 assert.match(workflow,/sha256sum -c SHA256SUMS\.txt/);
 assert.match(workflow,/unzip -tq/);
 assert.match(workflow,/gh release create "\$tag"/);
 assert.match(workflow,/--target "\$GITHUB_SHA"/);
 assert.match(workflow,/--notes-file docs\/R9_RELEASE_NOTES\.md/);
 assert.ok(workflow.indexOf('npm run check')<workflow.indexOf('gh release create'));
});
test('existing tags are immutable and transport errors abort instead of assuming a free tag',()=>{
 assert.match(workflow,/existing="\$\(git ls-remote --tags origin/);
 assert.match(workflow,/\[\[ -n "\$existing" \]\]/);
 assert.doesNotMatch(workflow,/--clobber|--force|\bforce: true|release upload/);
 assert.ok(scriptRuns.length>=3);
 for(const shell of scriptRuns){const c=cp.spawnSync('bash',['-n'],{input:shell,encoding:'utf8'});assert.equal(c.status,0,c.stderr)}
});
test('README is explicit about download unavailability, scope and independent adoption',()=>{
 for(const name of ['README.md','README.en.md']){
  const d=rd(name);
  assert.match(d,/releases\/tag\/v0\.9\.0/);
  assert.match(d,/dist\/AI_Memory_Lifeboat_Offline\.html/);
  assert.match(d,/SHA256SUMS\.txt/);
  assert.match(d,/尚未|not yet/i);
 }
 assert.match(rd('docs/R9_RELEASE_NOTES.md'),/not.*complete|does not certify/i);
 assert.match(rd('docs/R9_RELEASE_NOTES.md'),/No independent human adoption/i);
});
test('single-file remains generated from exact source with CSP no connect-src',()=>{
 const d=rd('dist/AI_Memory_Lifeboat_Offline.html');
 assert.match(d,/v0\.10\.4/);
 assert.match(d,/connect-src 'none'/);
 assert.doesNotMatch(d,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\s*\(/);
 const m=d.match(/<script>([\s\S]*?)<\/script>/g)||[];
 assert.equal(m.length,10);
 assert.ok(d.length>90000);
 assert.match(rd('src/app.js'),/aml-first-result-v0\.10\.4\.txt/);
 assert.doesNotMatch(rd('src/app.js'),/aml-first-result-v0\.6\.0\.txt/);
});

test('R9 state-scrubbed browser implementation and manifest file exclusion',()=>{
 const app=rd('src/app.js');
 assert.match(app,/function clearRenderedData\(/);
 assert.match(app,/function clearComparisonView\(/);
 assert.match(app,/delete current\.audit\.attachment_byte_assessment/);
 assert.match(rd('tools/build_manifest.js'),/ent\.name==='\.git'/);
 assert.match(rd('AGENTS.md'),/R9 addendum/);
});
