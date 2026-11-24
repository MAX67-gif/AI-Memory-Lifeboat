/* R26 synthetic-only bounded source fixtures. Research tool; not loaded by offline product. MIT. */
'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const MAX=64*1024*1024;
function node(id,previous,next,text){return {id,parent:previous,children:next?[next]:[],message:{author:{role:'user'},content:{content_type:'text',parts:[text]}}};}
function conv(id,count,text){
  const mapping={};for(let i=0;i<count;i++){
    const key=`${id}-m${i}`;
    mapping[key]=node(key,i?`${id}-m${i-1}`:null,i+1<count?`${id}-m${i+1}`:null,`${text} ${i+1}`);
  }
  return {id,title:`R26 Synthetic ${id}`,current_node:`${id}-m${count-1}`,mapping};
}
function jsonLong(){const rows=[conv('single-big',240,'R26_SYNTHETIC_LONG_'+('A'.repeat(38500)))];return Buffer.from(JSON.stringify(rows));}
function shardArrays(n){if(n<1||n>33||!Number.isInteger(n))throw Error('INVALID_SHARD_COUNT');
  return Array.from({length:n},(_,s)=>Array.from({length:25},(_,i)=>conv(`shard${s}-c${i}`,6,'R26_SYNTHETIC_'+('B'.repeat(250)))));
}
function crc32(data){let c=0xffffffff;for(const b of data){c^=b;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function zip(entries){
  const locals=[],centrals=[];let offset=0;let count=0;
  for(const {name,data} of entries){
    if(!/^conversations-(?:0[0-3][0-9])\.json$|^conversations\.json$/.test(name))throw Error('UNSAFE_SYNTHETIC_ZIP_NAME');
    if(!Buffer.isBuffer(data)||data.length>MAX)throw Error('INVALID_SYNTHETIC_SOURCE_SIZE');
    const nameBytes=Buffer.from(name,'utf8'),compressed=zlib.deflateRawSync(data,{level:6});const crc=crc32(data);
    const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);
    local.writeUInt16LE(8,8);local.writeUInt32LE(crc,14);local.writeUInt32LE(compressed.length,18);
    local.writeUInt32LE(data.length,22);local.writeUInt16LE(nameBytes.length,26);
    locals.push(local,nameBytes,compressed);
    const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(20,4);
    central.writeUInt16LE(20,6);central.writeUInt16LE(8,10);central.writeUInt32LE(crc,16);
    central.writeUInt32LE(compressed.length,20);central.writeUInt32LE(data.length,24);
    central.writeUInt16LE(nameBytes.length,28);central.writeUInt32LE(offset,42);
    centrals.push(central,nameBytes);offset+=local.length+nameBytes.length+compressed.length;count++;
  }
  const middle=Buffer.concat(centrals),end=Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(count,8);end.writeUInt16LE(count,10);
  end.writeUInt32LE(middle.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...locals,middle,end]);
}
function nearLimitJson(){
  const target=MAX-256*1024; // Fixed ~63.75 MiB; strictly below the 64 MiB boundary.
  const n=40;
  const base=Buffer.byteLength(JSON.stringify([conv('near',n,'R26_SYNTHETIC_NEAR_'+('Q'.repeat(0)))]));
  const padding=Math.floor((target-base)/n);
  if(padding<1000000||padding>1900000)throw Error('NEAR_LIMIT_PADDING_INVALID');
  const data=Buffer.from(JSON.stringify([conv('near',n,'R26_SYNTHETIC_NEAR_'+('Q'.repeat(padding)))]));
  if(data.length>MAX||data.length<MAX-512*1024)throw Error('NEAR_LIMIT_FIXTURE_OUT_OF_BOUNDS');
  return data;
}
function sha(data){return crypto.createHash('sha256').update(data).digest('hex');}
async function writeFixture(directory,kind){
  if(!['json-long','zip-32','zip-near-limit','json-over-limit','zip-33'].includes(kind))throw Error('UNSUPPORTED_R26_FIXTURE');
  await fs.mkdir(directory,{recursive:true});
  let data,filename,expect='PASS',conversations=0,shards=0,uncompressedBytes=0;
  if(kind==='json-long'){data=jsonLong();filename='conversations.json';conversations=1;uncompressedBytes=data.length;}
  if(kind==='zip-32'||kind==='zip-33'){
    shards=kind==='zip-32'?32:33;
    const arrays=shardArrays(shards);
    const entries=arrays.map((items,i)=>({name:`conversations-${String(i).padStart(3,'0')}.json`,data:Buffer.from(JSON.stringify(items))}));
    uncompressedBytes=entries.reduce((s,x)=>s+x.data.length,0);
    data=zip(entries);filename='chatgpt-synthetic.zip';conversations=shards*25;
    if(kind==='zip-33')expect='REJECT';
  }
  if(kind==='zip-near-limit'){
    const raw=nearLimitJson();uncompressedBytes=raw.length;data=zip([{name:'conversations.json',data:raw}]);
    filename='chatgpt-synthetic.zip';conversations=1;shards=1;
  }
  const output=path.join(directory,kind+'-'+filename);
  if(kind==='json-over-limit'){
    filename='conversations.json';expect='REJECT';uncompressedBytes=MAX+1;
    // Sparse oversized file: the product must reject on File.size before JSON.parse.
    const h=await fs.open(output,'w');try{await h.truncate(MAX+1);}finally{await h.close();}
  }else await fs.writeFile(output,data,{flag:'w'});
  const row={schema:'aml.r26.synthetic-source.v1',kind,filename,path:output,bytes:kind==='json-over-limit'?MAX+1:data.length,
    sha256:kind==='json-over-limit'?null:sha(data),uncompressedBytes,conversations,shards,expect,source:'ORIGINAL_SYNTHETIC_GENERATOR',
    noPrivateData:true};
  if(kind==='json-over-limit')row.sha256='SPARSE_ZERO_FILE_SHA_NOT_REPORTED';
  return row;
}
module.exports={MAX,node,conv,jsonLong,shardArrays,crc32,zip,nearLimitJson,writeFixture};
if(require.main===module){const [dir,kind]=process.argv.slice(2);writeFixture(dir,kind).then(x=>console.log(JSON.stringify({...x,path:path.basename(x.path)}))).catch(e=>{console.error(e.message);process.exitCode=1;});}
