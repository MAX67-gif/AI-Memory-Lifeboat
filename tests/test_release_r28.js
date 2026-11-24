/* Execute the real release shell gates using isolated synthetic command boundaries. MIT. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const workflow=fs.readFileSync(path.join(__dirname,'../.github/workflows/release-offline-r28.yml'),'utf8');
const scripts=[...workflow.matchAll(/^        run: \|\n((?:(?:^          .*\n)|(?:^\n))*)/gm)].map(m=>m[1].split('\n').map(line=>line.startsWith('          ')?line.slice(10):line).join('\n'));
const gate=scripts.find(s=>s.includes('publish=true'));
const publish=scripts.find(s=>s.includes('gh release create'));
function isolated(run){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aml-r28-publish-'));try{return run(dir);}finally{fs.rmSync(dir,{recursive:true,force:true});}}
function publisher(dir,existing='',exit=0){
 const bin=path.join(dir,'bin');fs.mkdirSync(bin);
 fs.writeFileSync(path.join(bin,'git'),'#!/bin/sh\n[ "$1" = "ls-remote" ] || exit 97\nprintf "%s" "$AML_TEST_EXISTING"\nexit "$AML_TEST_EXIT"\n',{mode:0o700});
 fs.writeFileSync(path.join(bin,'gh'),'#!/bin/sh\nprintf "%s\\n" "$@" > "$AML_TEST_ARGS"\n',{mode:0o700});
 const argsPath=path.join(dir,'arguments');
 const result=cp.spawnSync('bash',['-c',publish],{cwd:dir,encoding:'utf8',env:{...process.env,PATH:bin+path.delimiter+process.env.PATH,GH_TOKEN:'',GITHUB_SHA:'b'.repeat(40),AML_TEST_EXISTING:existing,AML_TEST_EXIT:String(exit),AML_TEST_ARGS:argsPath}});
 return {result,args:fs.existsSync(argsPath)?fs.readFileSync(argsPath,'utf8').trim().split('\n'):null};
}
test('R28 pinned gate permits only 0.11.4 and refuses past or unreviewed future versions',()=>isolated(dir=>{
 assert.ok(gate,'Missing executable version gate');
 for(const [version,allowed] of [['0.11.4',true],['0.11.3',false],['0.11.5',false],['0.11.4-preview',false]]){
  fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({version}));const output=path.join(dir,'output');fs.writeFileSync(output,'');
  const result=cp.spawnSync('bash',['-c',gate],{cwd:dir,encoding:'utf8',env:{...process.env,GITHUB_OUTPUT:output}});
  assert.equal(result.status,0,result.stderr);assert.equal(fs.readFileSync(output,'utf8').trim(),`publish=${allowed}`);
 }
}));
test('R28 existing tag refuses release without invoking publisher',()=>isolated(dir=>{
 const {result,args}=publisher(dir,'a'.repeat(40)+'\trefs/tags/v0.11.4\n');
 assert.notEqual(result.status,0);assert.match(result.stderr,/REFUSE_EXISTING_TAG_OR_RELEASE/);assert.equal(args,null);
}));
test('R28 transport failure refuses release instead of treating the tag as free',()=>isolated(dir=>{
 const {result,args}=publisher(dir,'',128);assert.equal(result.status,128);assert.equal(args,null);
}));
test('R28 free tag publishes exactly the reviewed version, SHA and three named assets',()=>isolated(dir=>{
 const {result,args}=publisher(dir);assert.equal(result.status,0,result.stderr);
 assert.deepEqual(args.slice(0,6),['release','create','v0.11.4','release/AI_Memory_Lifeboat_Offline.html','release/AI_Memory_Lifeboat_Source_v0.11.4.zip','release/SHA256SUMS.txt']);
 assert.equal(args[args.indexOf('--target')+1],'b'.repeat(40));
 assert.equal(args[args.indexOf('--notes-file')+1],'docs/R28_RELEASE_NOTES.md');
 assert.ok(!args.some(x=>['--force','--clobber','upload'].includes(x)));
}));
