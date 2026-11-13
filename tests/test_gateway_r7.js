/* R7 first-task gateway source, security and standalone parity checks */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const gateway=require('../src/gateway.js');
test('English and Traditional Chinese first-task text explicitly exclude account proof',()=>{
 for(const lang of ['zh-Hant','en']){
  const t=gateway.translations[lang];assert.ok(t.title&&t.stepOne&&t.stepThree&&t.honesty&&t.find);
  const result=gateway.describe(lang,2,true);
  assert.match(result,lang==='en'?/NOT.*account|not.*account|NOT.*backup/:/不是|不代表|備份/);
  assert.notEqual(result,gateway.describe(lang,2,false));
 }
 assert.match(gateway.translations.en.honesty,/not a fully translated English UI/i);
 assert.equal(gateway.describe('en',123,false),gateway.translations.en.missing);
});
test('single-file HTML contains exact current scripts once and a hash-only CSP',()=>{
 const source=read('index.html'),single=read('dist/AI_Memory_Lifeboat_Offline.html');
 assert.match(source,/id="firstTaskGateway"/);assert.match(source,/src="src\/gateway\.js"/);
 assert.doesNotMatch(single,/<script\b[^>]*\bsrc=/i);assert.doesNotMatch(single,/<link\b[^>]*\bhref="style\.css"/i);
 assert.match(single,/connect-src 'none'/);assert.match(single,/form-action 'none'/);
 const csp=single.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/i)?.[1];
 assert.ok(csp,'page CSP meta missing');assert.doesNotMatch(csp,/unsafe-inline|unsafe-eval/i);
 assert.doesNotMatch(single,/<iframe\b|<script[^>]*src="https?:/i);
 const hashes=[...single.matchAll(/'sha256-([A-Za-z0-9+/=]+)'/g)].map(x=>x[1]);
 assert.equal(hashes.length,12,'11 script hashes + 1 stylesheet hash');
 const tags=[...single.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
 assert.equal(tags.length,11);
 for(const code of tags){const hash=crypto.createHash('sha256').update(code).digest('base64');assert.ok(hashes.includes(hash),'script missing CSP hash');}
 const style=single.match(/<style>([\s\S]*?)<\/style>/);
 assert.ok(style);assert.ok(hashes.includes(crypto.createHash('sha256').update(style[1]).digest('base64')));
 assert.match(single,/AI Memory Lifeboat v0\.10\.5/);
});
test('standalone builder uses source files, not independently maintained runtime',()=>{
 const scripts=['core','zip','compare','health','demo','pilot','pilot_r5','first_result','view_filters','app','gateway'];
 const dist=read('dist/AI_Memory_Lifeboat_Offline.html');
 for(const script of scripts){const source=read(`src/${script}.js`);assert.ok(dist.includes(source),`missing exact source ${script}`)}
 const pkg=JSON.parse(read('package.json'));assert.equal(pkg.scripts['build:check'],'node tools/build_standalone.js --check');
 assert.ok(!/fetch\s*\(|XMLHttpRequest|sendBeacon/.test(read('src/gateway.js')));
});
