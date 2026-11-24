/* R27 optional baseline benchmark. Research only, no hard pass based on elapsed time. MIT. */
'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs/promises');
const path=require('node:path');const {parseArgs}=require('node:util');
const os=require('node:os');const z=require('../src/zip');const f=require('./fixtures_r26');
const {stats}=require('./profile_offline_performance');
function ref(bytes){let crc=-1;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^-1)>>>0;}
async function main(){
 const o=parseArgs({options:{'output-dir':{type:'string'},runs:{type:'string',default:'3'}},args:process.argv.slice(2)}).values;
 if(!/^[3-6]$/.test(o.runs))throw Error('R27_INVALID_RUNS');
 const dir=path.resolve(o['output-dir']||path.join(os.tmpdir(),'aml-r27-crc'));
 await fs.mkdir(dir,{recursive:true});
 const bytes=f.nearLimitJson(),rows=[];
 const measure=(name,fn)=>{const from=process.hrtime.bigint();const crc=fn(bytes);return {type:name,crc,elapsedMs:Number(process.hrtime.bigint()-from)/1e6};};
 for(let i=0;i<Number(o.runs);i++){
   // Counterbalanced order reduces systematic warmup bias; never reject a slower result.
   const order=i%2?['optimized','reference']:['reference','optimized'];const steps={};
   for(const route of order)steps[route]=measure(route,route==='optimized'?z.crc32:ref);
   assert.equal(steps.optimized.crc,steps.reference.crc);
   rows.push({iteration:i+1,referenceMs:steps.reference.elapsedMs,optimizedMs:steps.optimized.elapsedMs,sameCRC:true});
 }
 const out={schema:'aml.r27.crc-bench.v1',mode:'synthetic-research',timestampMethod:'process.hrtime.bigint',
   inputs:{bytes:bytes.length,fixture:'R26 fixed generated near-limit JSON',version:require('../package.json').version},
   environment:{node:process.version,cpu:os.cpus()[0]?.model,logicalCores:os.cpus().length},
   rows,summary:{referenceMs:stats(rows.map(x=>x.referenceMs)),optimizedMs:stats(rows.map(x=>x.optimizedMs))},
   verdict:'CRC_PARITY_PASS',interpretation:'This CI/process median is not a universal user speed guarantee; use exact same data/browser to compare.'};
 const dest=path.join(dir,'r27-crc-parity-benchmark.json');await fs.writeFile(dest,JSON.stringify(out,null,2)+'\n');
 console.log('R27 CRC parity benchmark',JSON.stringify({rows:rows.length,referenceMedianMs:out.summary.referenceMs.medianMs,optimizedMedianMs:out.summary.optimizedMs.medianMs,crc:rows[0].sameCRC}));
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
