/* Create a single-file offline inspector from the same source files. MIT.
 * Hash-based CSP permits only the embedded original scripts and stylesheet.
 */
'use strict';
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'style.css'),'utf8');
const hash=x=>`'sha256-${crypto.createHash('sha256').update(x,'utf8').digest('base64')}'`;
const scriptFiles=[];
let output=html.replace(/<script defer src="([^"]+)"\s*><\/script>\s*/g,(_,src)=>{
 if(!/^src\/[a-z0-9_]+\.js$/.test(src))throw Error('UNEXPECTED_SCRIPT:'+src);
 scriptFiles.push(src);return '';
});
if(scriptFiles.length!==11||!scriptFiles.includes('src/gateway.js'))throw Error('SCRIPT_LIST_CHANGED');
if(/<script\b/i.test(output))throw Error('UNEXPECTED_SCRIPT_IN_HTML');
if(!output.includes('<link rel="stylesheet" href="style.css">'))throw Error('STYLESHEET_MISSING');
if(/<\/style/i.test(css))throw Error('UNSAFE_STYLE_TERMINATOR');
const styleContent='\n'+css+'\n';
output=output.replace('<link rel="stylesheet" href="style.css">','<style>'+styleContent+'</style>');
const codes=scriptFiles.map(src=>fs.readFileSync(path.join(root,src),'utf8'));
for(const code of codes)if(/<\/script/i.test(code))throw Error('UNSAFE_SCRIPT_TERMINATOR');
const exactScripts=codes.map(c=>'\n'+c+'\n');
const scriptHashes=exactScripts.map(hash).join(' ');
const styleHash=hash(styleContent);
const replacement=`default-src 'none'; script-src ${scriptHashes}; style-src ${styleHash}; img-src data: blob:; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-src 'none'`;
output=output.replace(/default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-src 'none'/,replacement);
if(!output.includes(replacement))throw Error('CSP_REPLACEMENT_FAILED');
const inline=exactScripts.map(t=>'<script>'+t+'</script>').join('\n');
output=output.replace('</body>',inline+'\n</body>');
output='<!-- Generated from committed sources. Edit originals then rebuild. v0.10.5 -->\n'+output;
const dest=path.join(root,'dist','AI_Memory_Lifeboat_Offline.html');
if(process.argv.includes('--check')){
 if(!fs.existsSync(dest)||fs.readFileSync(dest,'utf8')!==output)throw Error('STALE_STANDALONE_BUILD: run npm run build:offline');
 console.log('STANDALONE_PARITY_PASS',Buffer.byteLength(output));
}else{
 fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,output,'utf8');
 console.log('BUILT_OFFLINE',Buffer.byteLength(output));
}
