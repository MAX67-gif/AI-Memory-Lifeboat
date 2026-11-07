/* Deterministic per-file SHA256 and Git blob manifest of public sources. MIT. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const sha=(data,alg)=>crypto.createHash(alg).update(data).digest('hex');
const excluded=new Set(['PUBLIC_PACKAGE_MANIFEST.json','FILE_SHA256SUMS.txt']);
const files=[];
function collect(rel=''){
 const here=path.join(root,rel);
 for(const ent of fs.readdirSync(here,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en'))){
  const r=rel?rel+'/'+ent.name:ent.name;
  if(ent.isSymbolicLink())throw Error('SYMLINK_FORBIDDEN:'+r);
  if(ent.isDirectory()){
   if(['.git','node_modules','coverage'].includes(ent.name))continue;
   collect(r);continue;
  }
  if(!ent.isFile()||ent.name==='.git')continue;
  if(excluded.has(r)||r.endsWith('.log')||r.endsWith('.bak')||r.endsWith('.tmp'))continue;
  if(!/^[a-zA-Z0-9_./-]+$/.test(r)||r.split('/').includes('..'))throw Error('UNSAFE_PUBLIC_PATH:'+r);
  if(/PRIVATE|Project-Brain|\.env$|\.sqlite$|\.db$/i.test(r)||r==='conversations.json')throw Error('PRIVATE_PATH:'+r);
  const b=fs.readFileSync(path.join(root,r));
  const git=Buffer.concat([Buffer.from(`blob ${b.length}\0`),b]);
  files.push({path:r,sha256:sha(b,'sha256'),git_blob_sha1:sha(git,'sha1'),bytes:b.length});
 }
}
collect();files.sort((a,b)=>a.path.localeCompare(b.path,'en'));
if(files.length<46)throw Error('TOO_FEW_PUBLIC_FILES');
const prior=JSON.parse(fs.readFileSync(path.join(root,'PUBLIC_PACKAGE_MANIFEST.json'),'utf8'));
prior.version='0.10.1-preview-source';prior.date='2026-11-07';
prior.base_public_main='0451cd319aaddef040764d938a84559489d91b7e';
prior.github_publication='EXTERNAL_VERIFICATION_REQUIRED';prior.github_branch_merge='EXTERNAL_VERIFICATION_REQUIRED';
prior.source='R11 verified maintainer evidence plus R12 bounded HTML export safety hotfix with a separately pinned release';
prior.scope=['R6 bounded ChatGPT JSON and ZIP shards unchanged','R7 bilingual first-task guide (not a full English UI)','R8 pinned release preserved','R9 clear hidden DOM and revoke stale comparison/CRC results preserved', 'R10 explicit local-only content-bearing HTML export confirmation preserved', 'R12 deliberate 16 MiB output cap fails closed without producing oversized HTML'];
prior.evidence.node_test_target='npm run check';
prior.evidence.browser='real Chromium synthetic offline and source parity, hosted Pages NOT_VERIFIED';
prior.evidence.real_account_export_tested=false;prior.evidence.external_adoption_confirmed=false;
prior.evidence.official_release=false;prior.evidence.source_publication_status='VERIFY_GITHUB_MAIN_NOT_MANIFEST';
prior.provenance_scope='LOCAL_PACKAGE_SNAPSHOT_NOT_LIVE_GITHUB_STATE';
prior.files=files;
const manifest=JSON.stringify(prior,null,2)+'\n';
const sums=files.map(f=>`${f.sha256}  ${f.path}`).join('\n')+'\n';
const expected=process.argv.includes('--check');
for(const [name,data] of [['PUBLIC_PACKAGE_MANIFEST.json',manifest],['FILE_SHA256SUMS.txt',sums]]){
 const dest=path.join(root,name);
 if(expected){if(!fs.existsSync(dest)||fs.readFileSync(dest,'utf8')!==data)throw Error('STALE_PACKAGE_MANIFEST:'+name)}
 else fs.writeFileSync(dest,data,'utf8');
}
console.log(expected?'MANIFEST_PARITY_PASS':'MANIFEST_BUILT',files.length);
