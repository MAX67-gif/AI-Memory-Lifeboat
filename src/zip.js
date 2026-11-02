/* AI Memory Lifeboat v0.4.0 ZIP reader. Minimal central-directory reader.
 * No file extraction; bounded decompression; CRC check for target JSON.
 * Copyright (c) 2026 MAX67-gif. MIT.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.AMLZip = api;
})(typeof globalThis === 'object' ? globalThis : null, function () {
  'use strict';
  const MAX_ARCHIVE = 128 * 1024 * 1024;
  const MAX_UNPACKED_JSON = 64 * 1024 * 1024;
  const MAX_FILES = 25000;
  const MAX_NAME_BYTES = 4096;
  const decoder = new TextDecoder('utf-8', {fatal:true});
  function fail(code) { throw new Error('ZIP_'+code); }
  function uint32(view, offset) { return view.getUint32(offset, true); }
  function crc32(bytes) {
    let crc = -1;
    for (const byte of bytes) {
      crc ^= byte;
      for (let i=0;i<8;i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
    return (crc ^ -1) >>> 0;
  }
  function decodeName(bytes, flags) {
    if (bytes.length > MAX_NAME_BYTES) fail('NAME_TOO_LONG');
    if (!(flags & 0x800) && bytes.some(b => b > 127)) fail('NON_UTF8_NAME_UNSUPPORTED');
    try { return decoder.decode(bytes); } catch (_) { fail('INVALID_UTF8_NAME'); }
  }
  function safeName(name) {
    return !!name && !name.includes('\\') && !name.includes('\0') &&
      !name.startsWith('/') && !/^[A-Za-z]:/.test(name) &&
      !name.split('/').some(x => x === '..' || x === '.');
  }
  function readEntries(bytes) {
    if (!(bytes instanceof Uint8Array)) throw new TypeError('Expected Uint8Array');
    if (bytes.byteLength > MAX_ARCHIVE) fail('ARCHIVE_TOO_LARGE');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let end = -1;
    for (let pos=bytes.length-22;pos>=Math.max(0,bytes.length-22-65535);pos--) {
      if (uint32(view,pos) === 0x06054b50 && pos + 22 + view.getUint16(pos+20,true) === bytes.length) {end=pos;break;}
    }
    if (end < 0) fail('END_RECORD_MISSING');
    const disk = view.getUint16(end+4,true);
    const diskCentral = view.getUint16(end+6,true);
    const countDisk = view.getUint16(end+8,true);
    const count = view.getUint16(end+10,true);
    const size = uint32(view,end+12), offset=uint32(view,end+16);
    if (disk || diskCentral || countDisk !== count) fail('MULTI_DISK_UNSUPPORTED');
    if (count === 65535 || size === 0xffffffff || offset === 0xffffffff) fail('ZIP64_UNSUPPORTED');
    if (count > MAX_FILES) fail('TOO_MANY_ENTRIES');
    if (offset + size > end) fail('INVALID_CENTRAL_DIRECTORY');
    let p = offset;
    const entries=[];
    for (let i=0;i<count;i++) {
      if (p+46 > offset+size || uint32(view,p)!==0x02014b50) fail('INVALID_ENTRY_HEADER');
      const flags=view.getUint16(p+8,true), method=view.getUint16(p+10,true);
      const crc=uint32(view,p+16), compressed=uint32(view,p+20), unpacked=uint32(view,p+24);
      const nameLen=view.getUint16(p+28,true), extraLen=view.getUint16(p+30,true), commentLen=view.getUint16(p+32,true);
      const localOffset=uint32(view,p+42);
      const next=p+46+nameLen+extraLen+commentLen;
      if (next>offset+size) fail('ENTRY_OUT_OF_BOUNDS');
      const name=decodeName(bytes.subarray(p+46,p+46+nameLen),flags);
      if (!safeName(name)) fail('UNSAFE_ENTRY_PATH');
      if (compressed===0xffffffff||unpacked===0xffffffff||localOffset===0xffffffff) fail('ZIP64_ENTRY_UNSUPPORTED');
      entries.push({name, flags, method, crc, compressed, unpacked, localOffset});
      p=next;
    }
    if (p!==offset+size) fail('CENTRAL_DIRECTORY_TRAILING_BYTES');
    return entries;
  }
  async function inflateRawLimited(data, claimedSize, limit = MAX_UNPACKED_JSON) {
    if (typeof DecompressionStream !== 'function') fail('BROWSER_DEFLATE_UNAVAILABLE');
    let stream;
    try { stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')); }
    catch (_) { fail('BROWSER_DEFLATE_UNAVAILABLE'); }
    const reader=stream.getReader();
    const chunks=[];
    let total=0;
    try {
      for (;;) {
        const {done,value}=await reader.read();
        if (done) break;
        total+=value.byteLength;
        if (total>limit||total>claimedSize) { await reader.cancel().catch(()=>{}); fail('EXPANSION_LIMIT'); }
        chunks.push(value);
      }
    } catch(e) { if (String(e.message).startsWith('ZIP_')) throw e; fail('DEFLATE_FAILED'); }
    const out=new Uint8Array(total);let cursor=0;
    for (const c of chunks) {out.set(c,cursor); cursor+=c.byteLength;}
    return out;
  }
  async function getConversationsJson(bytes) {
    const entries=readEntries(bytes);
    const candidates=entries.filter(e => e.name==='conversations.json'||e.name.endsWith('/conversations.json'));
    if (!candidates.length) fail('CONVERSATIONS_JSON_MISSING');
    if (candidates.length!==1) fail('MULTIPLE_CONVERSATIONS_JSON');
    const e=candidates[0];
    if (e.flags & 1) fail('ENCRYPTED_UNSUPPORTED');
    if (e.method!==0 && e.method!==8) fail('COMPRESSION_UNSUPPORTED');
    if (e.unpacked>MAX_UNPACKED_JSON || e.compressed>MAX_ARCHIVE) fail('JSON_TOO_LARGE');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const p=e.localOffset;
    if (p+30>bytes.byteLength || uint32(view,p)!==0x04034b50) fail('LOCAL_HEADER_INVALID');
    const nameLen=view.getUint16(p+26,true),extraLen=view.getUint16(p+28,true);
    const method=view.getUint16(p+8,true);
    const localFlags=view.getUint16(p+6,true);
    if (method!==e.method || localFlags!==e.flags) fail('HEADER_MISMATCH');
    const localName=decodeName(bytes.subarray(p+30,p+30+nameLen),localFlags);
    if (localName!==e.name) fail('LOCAL_CENTRAL_NAME_MISMATCH');
    const dataStart=p+30+nameLen+extraLen;
    if (dataStart>bytes.length||dataStart+e.compressed>bytes.length) fail('DATA_OUT_OF_BOUNDS');
    const compressed=bytes.subarray(dataStart,dataStart+e.compressed);
    const unpacked=e.method===0?compressed:await inflateRawLimited(compressed,e.unpacked);
    if (unpacked.length!==e.unpacked) fail('UNCOMPRESSED_SIZE_MISMATCH');
    if (crc32(unpacked)!==e.crc) fail('CRC_MISMATCH');
    let text;
    try {text=decoder.decode(unpacked);} catch (_) {fail('INVALID_UTF8_JSON');}
    let parsed;
    try {parsed=JSON.parse(text.replace(/^\uFEFF/,''));} catch (_) {fail('INVALID_JSON');}
    return {parsed, entryCount:entries.length, targetPath:e.name, entries};
  }
  const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;
  const MAX_ATTACHMENT_TOTAL = 16 * 1024 * 1024;
  const MAX_ATTACHMENT_ENTRIES = 24;
  async function verifyMatchedAttachments(bytes, paths) {
    if (!(bytes instanceof Uint8Array) || !Array.isArray(paths)) throw new TypeError('INVALID_ATTACHMENT_VERIFY_INPUT');
    const entries = readEntries(bytes);
    const result={schema:'aml.attachment-bytes.v1',tool_version:'0.4.0',
      verification:'LIMITED_ZIP_ENTRY_CRC32_ONLY',account_completeness:'NOT_VERIFIABLE_FROM_EXPORT',
      requested_unique_paths:0,unique_matching_entries:0,bytes_crc32_verified:0,
      failed_integrity:0,skipped_size:0,skipped_budget:0,skipped_method:0,skipped_unsafe:0,
      checked_uncompressed_bytes:0,checked_entries:0,
      content_matches_original_source:'NOT_PROVEN',file_paths_in_report:false,
      notes:['CRC32_CHECKS_ARCHIVE_INTERNAL_CONSISTENCY_NOT_AUTHENTICITY',
        'NO_PROOF_OF_ORIGINAL_UPLOADS_OR_ALL_ACCOUNT_ATTACHMENTS',
        'OVERSIZE_UNSUPPORTED_AND_UNMATCHED_FILES_NOT_VERIFIED']};
    // No paths are returned or logged. Only distinct, explicit safe paths may enter the bounded scanner.
    const unique=new Set(paths);
    result.requested_unique_paths=unique.size;
    const matched=new Map();
    for(const entry of entries){
      if(unique.has(entry.name)){
        if(!matched.has(entry.name))matched.set(entry.name,[]);
        matched.get(entry.name).push(entry);
      }
    }
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    let budget=0,seen=0;
    for(const name of unique){
      if(typeof name!=='string'||!safeName(name)||name.endsWith('/')){result.skipped_unsafe++;continue;}
      const group=matched.get(name)||[];
      if(group.length!==1){result.skipped_unsafe++;continue;}
      const entry=group[0];result.unique_matching_entries++;
      if(seen++>=MAX_ATTACHMENT_ENTRIES){result.skipped_budget++;continue;}
      if(entry.flags&1 || ![0,8].includes(entry.method)){result.skipped_method++;continue;}
      if(entry.unpacked>MAX_ATTACHMENT_BYTES){result.skipped_size++;continue;}
      if(budget+entry.unpacked>MAX_ATTACHMENT_TOTAL){result.skipped_budget++;continue;}
      budget+=entry.unpacked;
      result.checked_entries++;
      try{
        const p=entry.localOffset;
        if(p+30>bytes.length||uint32(view,p)!==0x04034b50)fail('LOCAL_HEADER_INVALID');
        const localFlags=view.getUint16(p+6,true),method=view.getUint16(p+8,true);
        const nameLen=view.getUint16(p+26,true),extraLen=view.getUint16(p+28,true);
        if(method!==entry.method||localFlags!==entry.flags)fail('HEADER_MISMATCH');
        const nameEnd=p+30+nameLen;
        if(nameEnd>bytes.length)fail('LOCAL_NAME_OUT_OF_BOUNDS');
        const localName=decodeName(bytes.subarray(p+30,nameEnd),localFlags);
        if(localName!==entry.name)fail('LOCAL_CENTRAL_NAME_MISMATCH');
        const dataStart=nameEnd+extraLen;
        if(dataStart>bytes.length||dataStart+entry.compressed>bytes.length)fail('DATA_OUT_OF_BOUNDS');
        const compressed=bytes.subarray(dataStart,dataStart+entry.compressed);
        const output=entry.method===0?compressed:await inflateRawLimited(compressed,entry.unpacked,MAX_ATTACHMENT_BYTES);
        if(output.length!==entry.unpacked || crc32(output)!==entry.crc)fail('CRC_OR_SIZE_MISMATCH');
        result.bytes_crc32_verified++;
        result.checked_uncompressed_bytes+=output.length;
      }catch(_){
        result.failed_integrity++;
      }
    }
    return result;
  }
  return Object.freeze({readEntries,getConversationsJson,verifyMatchedAttachments,crc32,
    MAX_ARCHIVE,MAX_UNPACKED_JSON,MAX_ATTACHMENT_BYTES,MAX_ATTACHMENT_TOTAL,MAX_ATTACHMENT_ENTRIES});
});
