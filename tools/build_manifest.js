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
  if(!ent.isFile())continue;
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
prior.version='0.7.0-preview-source';prior.date='2026-11-03';
prior.base_public_main='ccfd324598a25f39c9159568aaf35ef1c0cf5d88';
prior.github_publication='EXTERNAL_VERIFICATION_REQUIRED';prior.github_branch_merge='EXTERNAL_VERIFICATION_REQUIRED';
prior.source='R6 verified public main plus R7 first-task gateway and deterministic single-file offline distribution';
prior.scope=['R6 bounded ChatGPT JSON and ZIP shards unchanged','Bilingual first-task guide (not a full English UI)','Single-file offline HTML generated with strict CSP and no server'];
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
