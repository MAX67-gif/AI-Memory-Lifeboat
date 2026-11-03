/* AI Memory Lifeboat v0.6.0 ZIP reader. Minimal central-directory reader.
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
  const MAX_JSON_SHARDS = 32; // bounded list of numbered JSON parts, not full-account certification
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
  function selectConversationEntries(entries) {
    const full=entries.filter(e => /(^|\/)conversations\.json$/.test(e.name));
    const shards=entries.map(e => {
      const m=/^(.*\/)?conversations-(\d{3})\.json$/.exec(e.name);
      return m?{entry:e, prefix:m[1]||'', number:Number(m[2])}:null;
    }).filter(Boolean);
    const possible=entries.filter(e => /(^|\/)conversations-\d+\.json$/.test(e.name));
    if(possible.length>shards.length)fail('UNSUPPORTED_SHARD_NAME');
    if(full.length && (full.length!==1 || shards.length))fail('AMBIGUOUS_JSON_SOURCES');
    if(full.length===1)return {kind:'SINGLE_JSON',selected:[full[0]]};
    if(!shards.length)fail('CONVERSATIONS_JSON_MISSING');
    if(shards.length>MAX_JSON_SHARDS)fail('TOO_MANY_JSON_SHARDS');
    const prefix=shards[0].prefix;
    if(shards.some(s=>s.prefix!==prefix))fail('MULTIPLE_SHARD_DIRECTORIES');
    shards.sort((a,b)=>a.number-b.number);
    for(let i=0;i<shards.length;i++)if(shards[i].number!==i)
      fail(shards[i].number<i?'DUPLICATE_JSON_SHARD':'MISSING_JSON_SHARD');
    const combined=shards.reduce((size,s)=>size+s.entry.unpacked,0);
    if(combined>MAX_UNPACKED_JSON)fail('JSON_SHARDS_TOO_LARGE');
    return {kind:'NUMBERED_JSON_SHARDS',selected:shards.map(s=>s.entry)};
  }
  async function readJsonEntry(bytes, view, e) {
    if(e.flags&1)fail('ENCRYPTED_UNSUPPORTED');
    if(e.method!==0&&e.method!==8)fail('COMPRESSION_UNSUPPORTED');
    if(e.unpacked>MAX_UNPACKED_JSON||e.compressed>MAX_ARCHIVE)fail('JSON_TOO_LARGE');
    const at=e.localOffset;
    if(at+30>bytes.length||uint32(view,at)!==0x04034b50)fail('LOCAL_HEADER_INVALID');
    const nameLen=view.getUint16(at+26,true),extraLen=view.getUint16(at+28,true);
    const method=view.getUint16(at+8,true),flags=view.getUint16(at+6,true);
    if(method!==e.method||flags!==e.flags)fail('HEADER_MISMATCH');
    const nameEnd=at+30+nameLen;
    if(nameEnd>bytes.length)fail('LOCAL_NAME_OUT_OF_BOUNDS');
    const localName=decodeName(bytes.subarray(at+30,nameEnd),flags);
    if(localName!==e.name)fail('LOCAL_CENTRAL_NAME_MISMATCH');
    const dataStart=nameEnd+extraLen;
    if(dataStart>bytes.length||dataStart+e.compressed>bytes.length)fail('DATA_OUT_OF_BOUNDS');
    const compressed=bytes.subarray(dataStart,dataStart+e.compressed);
    const unpacked=e.method===0?compressed:await inflateRawLimited(compressed,e.unpacked);
    if(unpacked.length!==e.unpacked)fail('UNCOMPRESSED_SIZE_MISMATCH');
    if(crc32(unpacked)!==e.crc)fail('CRC_MISMATCH');
    let txt;
    try{txt=decoder.decode(unpacked);}catch(_){fail('INVALID_UTF8_JSON');}
    try{return JSON.parse(txt.replace(/^\uFEFF/,''));}catch(_){fail('INVALID_JSON');}
  }
  async function getConversationsJson(bytes) {
    const entries=readEntries(bytes);
    const selection=selectConversationEntries(entries);
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    const all=[];
    let total=0;
    for(const e of selection.selected){
      const parsed=await readJsonEntry(bytes,view,e);
      if(!Array.isArray(parsed))fail('EXPECTED_CONVERSATIONS_ARRAY');
      total+=parsed.length;
      if(total>30000)fail('TOO_MANY_CONVERSATIONS');
      for(const row of parsed)all.push(row);
    }
    return {parsed:all,entryCount:entries.length,
      targetPath:selection.kind==='SINGLE_JSON'?selection.selected[0].name:null,
      sourceKind:selection.kind,sourceFileCount:selection.selected.length,entries};
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
    MAX_ARCHIVE,MAX_UNPACKED_JSON,MAX_JSON_SHARDS,MAX_ATTACHMENT_BYTES,MAX_ATTACHMENT_TOTAL,MAX_ATTACHMENT_ENTRIES});
});
