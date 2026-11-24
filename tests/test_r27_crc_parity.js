/* R27 CRC32 parity and ZIP corruption/fail-closed; synthetic bytes only. MIT. */
'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const z=require('../src/zip');const f=require('../tools/fixtures_r26');
const slow=bytes=>{let crc=-1;for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^-1)>>>0;};
test('R27 indexed CRC matches IEEE known vector and previous bit-wise algorithm',()=>{
 assert.equal(z.crc32(new Uint8Array()),0);
 assert.equal(z.crc32(Buffer.from('123456789')),0xcbf43926);
 const sizes=[0,1,2,3,4,7,15,32,255,256,257,1024,4096,65535,262144];
 for(const n of sizes){const b=new Uint8Array(n);let state=0x12345678;
   for(let i=0;i<n;i++){state=(Math.imul(state,1664525)+1013904223)>>>0;b[i]=state>>>24;}
   assert.equal(z.crc32(b),slow(b),`CRC32 parity length ${n}`);
 }
 assert.equal(z.crc32([0,1,2,3]),slow([0,1,2,3]));
 assert.equal(z.crc32(new Set([0,1,2,3])),slow(new Set([0,1,2,3])));
});
test('R27 63.75 MiB synthetic payload has identical pre-registered CRC',()=>{
 assert.equal(z.crc32(f.nearLimitJson()),128265700);
});
test('R27 corrupted central-directory CRC is rejected, no partial parse',async()=>{
 const payload=Buffer.from(JSON.stringify([f.conv('crc-negative',4,'Synthetic CRC mismatch')]));
 const zip=Buffer.from(f.zip([{name:'conversations.json',data:payload}]));
 const central=zip.readUInt32LE(zip.length-22+16);
 zip.writeUInt32LE((zip.readUInt32LE(central+16)^1)>>>0,central+16);
 await assert.rejects(z.getConversationsJson(new Uint8Array(zip)),/ZIP_CRC_MISMATCH/);
});
test('R27 ZIP parser keeps former archive, shard and uncompressed-content limits',()=>{
 assert.equal(z.MAX_ARCHIVE,128*1024*1024);
 assert.equal(z.MAX_UNPACKED_JSON,64*1024*1024);
 assert.equal(z.MAX_JSON_SHARDS,32);
 const bad=z.MAX_ARCHIVE+1;
 assert.ok(bad>0);
});
