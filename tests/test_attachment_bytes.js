'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const zlib=require('node:zlib');
const zip=require('../src/zip.js');const core=require('../src/core.js');
const enc=s=>Buffer.from(s,'utf8');
function makeZip(files){
  const locals=[],centrals=[];let offset=0;
  for(const f of files){
    const name=enc(f.name),data=Buffer.isBuffer(f.data)?f.data:enc(f.data||'');
    const packed=f.deflate?zlib.deflateRawSync(data):data;
    const method=f.method??(f.deflate?8:0),flags=f.flags??0x800;
    const crc=(f.badCrc?0:zip.crc32(data))>>>0;
    const l=Buffer.alloc(30);l.writeUInt32LE(0x04034b50,0);l.writeUInt16LE(20,4);l.writeUInt16LE(flags,6);l.writeUInt16LE(method,8);
    l.writeUInt32LE(crc,14);l.writeUInt32LE(packed.length,18);l.writeUInt32LE(data.length,22);l.writeUInt16LE(name.length,26);
    const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50,0);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);
    c.writeUInt16LE(flags,8);c.writeUInt16LE(method,10);c.writeUInt32LE(crc,16);c.writeUInt32LE(packed.length,20);
    c.writeUInt32LE(f.claimedSize??data.length,24);c.writeUInt16LE(name.length,28);c.writeUInt32LE(offset,42);
    locals.push(l,name,packed);centrals.push(c,name);offset+=l.length+name.length+packed.length;
  }
  const cd=Buffer.concat(centrals),e=Buffer.alloc(22);e.writeUInt32LE(0x06054b50,0);e.writeUInt16LE(files.length,8);e.writeUInt16LE(files.length,10);
  e.writeUInt32LE(cd.length,12);e.writeUInt32LE(offset,16);
  return new Uint8Array(Buffer.concat([...locals,cd,e]));
}
const raw=[{id:'some-private-id',current_node:'n',mapping:{n:{parent:null,message:{
  author:{role:'user'},content:{parts:['PRIVATE CHAT CONTENT',{asset_pointer:'file-service://x',relative_path:'assets/pic.png'}]},
  metadata:{attachments:[{relative_path:'assets/pic.png'},{path:'assets/notes.txt'},{path:'assets/not-here.bin'}]}
}}}}];
test('R3 exact path collection is distinct and does not infer missing paths',()=>{
  const entries=zip.readEntries(makeZip([{name:'conversations.json',data:'[]'},{name:'assets/pic.png',data:'imagebytes'},{name:'assets/notes.txt',data:'notes'}]));
  assert.deepEqual(core.listUniqueExactAttachmentPaths(raw,entries).sort(),['assets/notes.txt','assets/pic.png']);
  assert.equal(core.assessArchiveReferences(raw,entries).missing_explicit_paths,1);
});
test('R3 checks stored and deflated entry bytes without exporting paths',async()=>{
  const bytes=makeZip([{name:'assets/pic.png',data:'imagebytes'},{name:'assets/notes.txt',data:'notes',deflate:true}]);
  const r=await zip.verifyMatchedAttachments(bytes,['assets/pic.png','assets/notes.txt']);
  assert.equal(r.bytes_crc32_verified,2);assert.equal(r.failed_integrity,0);
  assert.equal(r.checked_entries,2);assert.equal(r.checked_uncompressed_bytes,15);
  assert.ok(!JSON.stringify(r).includes('assets/'));
  assert.ok(!JSON.stringify(r).includes('pic.png'));
});
test('R3 CRC mismatch is reported, never counted as verified',async()=>{
  const bytes=makeZip([{name:'sensitive.bin',data:'SECRET_PERSON',badCrc:true}]);
  const report=await zip.verifyMatchedAttachments(bytes,['sensitive.bin']);
  assert.equal(report.bytes_crc32_verified,0);assert.equal(report.failed_integrity,1);
  assert.ok(!JSON.stringify(report).includes('SECRET_PERSON'));
});
test('R3 unsupported method, encrypted and oversized claims remain unverified',async()=>{
  const bytes=makeZip([{name:'one',data:'abc',method:12},{name:'two',data:'xyz',flags:1},{name:'three',data:'tiny',claimedSize:5*1024*1024}]);
  const r=await zip.verifyMatchedAttachments(bytes,['one','two','three']);
  assert.equal(r.skipped_method,2);assert.equal(r.skipped_size,1);assert.equal(r.bytes_crc32_verified,0);
});
test('R3 duplicate paths are not arbitrarily accepted',async()=>{
  const bytes=makeZip([{name:'same.txt',data:'a'},{name:'same.txt',data:'b'}]);
  const r=await zip.verifyMatchedAttachments(bytes,['same.txt']);
  assert.equal(r.skipped_unsafe,1);assert.equal(r.bytes_crc32_verified,0);
});
test('R3 no file paths, traversal or missing names are marked verified',async()=>{
  const bytes=makeZip([{name:'a.txt',data:'okay'}]);
  const r=await zip.verifyMatchedAttachments(bytes,['../secret','a.txt','absent.txt']);
  assert.equal(r.bytes_crc32_verified,1);assert.equal(r.skipped_unsafe,2);
});
test('R3 tampered local header is refused without leaking filenames',async()=>{
  const bytes=makeZip([{name:'a.txt',data:'hello'}]);bytes[30]='b'.charCodeAt(0);
  const r=await zip.verifyMatchedAttachments(bytes,['a.txt']);
  assert.equal(r.failed_integrity,1);assert.equal(r.bytes_crc32_verified,0);
});
test('R3 bounded count never decompresses more than 24 files',async()=>{
  const files=Array.from({length:27},(_,i)=>({name:`file${i}.txt`,data:'x'}));
  const r=await zip.verifyMatchedAttachments(makeZip(files),files.map(x=>x.name));
  assert.equal(r.checked_entries,24);assert.equal(r.skipped_budget,3);
});
test('R3 invalid caller types rejected',async()=>{
  await assert.rejects(zip.verifyMatchedAttachments('bad',['x']),/INVALID_ATTACHMENT_VERIFY_INPUT/);
  await assert.rejects(zip.verifyMatchedAttachments(makeZip([]),'bad'),/INVALID_ATTACHMENT_VERIFY_INPUT/);
});
