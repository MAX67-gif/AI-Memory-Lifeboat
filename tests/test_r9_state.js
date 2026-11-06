/* R9 privacy regression through the actual browser application's public DOM controls. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const CORE = require('../src/core.js');
const COMPARE = require('../src/compare.js');
const HEALTH = require('../src/health.js');
const DEMO = require('../src/demo.js');
const PILOT = require('../src/pilot_r5.js');
const FIRST = require('../src/first_result.js');

class FakeElement {
  constructor() {
    this.children=[]; this._text=''; this.value=''; this.hidden=false; this.disabled=false;
    this.className=''; this.dataset={}; this.attributes={}; this.listeners={}; this.files=[];
  }
  get textContent(){return this._text + this.children.map(n=>typeof n==='string'?n:n.textContent).join('');}
  set textContent(t){this._text=String(t);this.children=[];}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  fire(type){for(const f of this.listeners[type]||[])f({type,key:'',preventDefault(){}});}
  replaceChildren(...nodes){this.children=[];this._text='';this.append(...nodes);}
  append(...nodes){this.children.push(...nodes);}
  setAttribute(k,v){this.attributes[k]=String(v);}
  scrollIntoView(){}
  showModal(){this.open=true;}
  close(){this.open=false;this.fire('close');}
  focus(){}
  click(){this.fire('click');}
  remove(){}
}
function harness(zipOverrides={}){
  const src=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const ids=[...src.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  const elements=new Map(ids.map(id=>[id,new FakeElement()]));
  const by=id=>{if(!elements.has(id))throw Error('UNKNOWN_ELEMENT_'+id);return elements.get(id);};
  const picker=new FakeElement(),body=new FakeElement(),downloads=[];
  const document={getElementById:by,querySelector:s=>s==='label[for="archiveFile"]'?picker:null,
    createElement:tag=>{const el=new FakeElement();if(tag==='a'){el.click=()=>downloads.push({name:el.download,url:el.href});}return el;},createDocumentFragment:()=>new FakeElement(),body};
  const zip={MAX_ARCHIVE:128*1024*1024,...zipOverrides};
  const window={AMLCore:CORE,AMLCompare:COMPARE,AMLHealth:HEALTH,AMLDemo:DEMO,AMLPilotR5:PILOT,AMLFirstResult:FIRST,AMLZip:zip};
  const context={window,document,Blob,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},setTimeout(){},Uint8Array};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/app.js'),'utf8'),context,{filename:'src/app.js'});
  return {by,document,zip,downloads};
}
const newer=JSON.parse(fs.readFileSync(path.join(__dirname,'../examples/sample-newer.json'),'utf8'));
const older=JSON.parse(fs.readFileSync(path.join(__dirname,'../examples/sample-older.json'),'utf8'));
const own=(name,data)=>({name,size:Buffer.byteLength(data),text:async()=>data});
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function importJson(ui,name,items){ui.by('archiveFile').files=[own(name,JSON.stringify(items))];ui.by('archiveFile').fire('change');await flush();}
async function importOlder(ui,name,items){ui.by('olderFile').files=[own(name,JSON.stringify(items))];ui.by('olderFile').fire('change');await flush();}
function privateSurface(ui){return ['conversationList','conversationDetail','compareList','metrics','warningsPanel','warningList','healthSummary','healthCards','archiveAssessment','compareCounts','resultCount'].map(x=>ui.by(x).textContent).join('|');}

test('R9: clearing synthetic demo removes all hidden comparison titles and stale result text',()=>{
  const ui=harness();ui.by('tryDemo').click();
  assert.match(ui.by('compareList').textContent,/Original lesson notes/);
  ui.by('conversationList').children[0].click();
  ui.by('clearBtn').click();
  assert.equal(ui.by('results').hidden,true);
  assert.doesNotMatch(privateSurface(ui),/Original lesson notes|Weekend weather plan|umbrella|New example reminder/);
  assert.equal(ui.by('conversationDetail').textContent,'');
});

test('R9: starting newer import immediately removes the old DOM, including the prior selected message',async()=>{
  const ui=harness();await importJson(ui,'conversations.json',newer);
  ui.by('conversationList').children[0].click();
  assert.match(ui.by('conversationDetail').textContent,/umbrella/);
  let release; const pending=new Promise(r=>{release=r;});
  ui.by('archiveFile').files=[{name:'conversations.json',size:100,text:()=>pending}];ui.by('archiveFile').fire('change');
  assert.equal(ui.by('results').hidden,true);
  assert.doesNotMatch(privateSurface(ui),/umbrella|Weekend weather plan/);
  release(JSON.stringify(older));await flush();
  assert.equal(ui.by('results').hidden,false);
});

test('R9: invalid replacement leaves no old source text behind',async()=>{
  const ui=harness();await importJson(ui,'conversations.json',newer);
  ui.by('conversationList').children[0].click();
  await importJson(ui,'conversations.json','not valid json');
  assert.match(ui.by('status').textContent,/無法解析/);
  assert.equal(ui.by('results').hidden,true);
  assert.doesNotMatch(privateSurface(ui),/Weekend weather plan|umbrella/);
});

test('R9: changing older comparison removes previous diff titles while next file is pending',async()=>{
  const ui=harness();await importJson(ui,'conversations.json',newer);await importOlder(ui,'old.json',older);
  assert.match(ui.by('compareList').textContent,/Original lesson notes/);
  let release;const pending=new Promise(r=>release=r);
  ui.by('olderFile').files=[{name:'old.json',size:100,text:()=>pending}];ui.by('olderFile').fire('change');
  assert.equal(ui.by('comparePanel').hidden,true);
  assert.doesNotMatch(ui.by('compareList').textContent,/Original lesson notes/);
  assert.doesNotMatch(ui.by('healthCards').textContent,/兩次匯出出現差異/);
  release('bad-json');await flush();
  assert.doesNotMatch(ui.by('compareList').textContent,/Original lesson notes/);
});

test('R9: changing the new archive after a completed comparison scrubs hidden older titles',async()=>{
  const ui=harness();await importJson(ui,'conversations.json',newer);await importOlder(ui,'old.json',older);
  assert.match(ui.by('compareList').textContent,/Original lesson notes/);
  await importJson(ui,'new.json',older);
  assert.doesNotMatch(ui.by('compareList').textContent,/Original lesson notes/);
});

test('R9: failing a repeated CRC check revokes previously successful byte assessment',async()=>{
  let calls=0;
  const entry={id:'private_fixture',title:'Synthetic attachment',current_node:'n',mapping:{n:{parent:null,message:{author:{role:'user'},content:{parts:['hello']},metadata:{attachments:[{relative_path:'files/test.txt'}]}}}}};
  const z={getConversationsJson:async()=>({parsed:[entry],entryCount:2,entries:[{name:'conversations.json'},{name:'files/test.txt'}],sourceKind:'SINGLE_JSON',sourceFileCount:1}),
    verifyMatchedAttachments:async()=>{calls++;if(calls===1)return {schema:'aml.attachment-bytes.v1',checked_entries:1,bytes_crc32_verified:0,failed_integrity:1,skipped_size:0,skipped_budget:0,skipped_method:0,skipped_unsafe:0};throw Error('CRC_RETRY_FAILED');}};
  const ui=harness(z);
  ui.by('archiveFile').files=[{name:'export.zip',size:80,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer}];
  ui.by('archiveFile').fire('change');await flush();
  ui.by('verifyAttachments').click();await flush();
  assert.match(ui.by('healthCards').textContent,/位元組驗證未通過/);
  assert.equal(ui.by('verifyAttachments').disabled,false);
  ui.by('verifyAttachments').click();await flush();
  assert.doesNotMatch(ui.by('healthCards').textContent,/位元組驗證未通過/);
  assert.match(ui.by('attachmentVerifyStatus').textContent,/無法完成/);
  assert.equal(ui.by('verifyAttachments').disabled,false);
});

test('R9: clearing while a check is pending revokes the check and keeps the UI cleared',async()=>{
  let release;
  const entry={id:'fixture',title:'Clear while checking',current_node:'n',mapping:{n:{parent:null,message:{metadata:{attachments:[{relative_path:'files/test.txt'}]},author:{role:'user'},content:{parts:['sample']}}}}};
  const z={getConversationsJson:async()=>({parsed:[entry],entryCount:2,entries:[{name:'conversations.json'},{name:'files/test.txt'}],sourceKind:'SINGLE_JSON',sourceFileCount:1}),
    verifyMatchedAttachments:async()=>new Promise(r=>release=r)};
  const ui=harness(z);
  ui.by('archiveFile').files=[{name:'export.zip',size:80,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer}];
  ui.by('archiveFile').fire('change');await flush();
  ui.by('verifyAttachments').click();await flush();ui.by('clearBtn').click();
  release({schema:'aml.attachment-bytes.v1',checked_entries:1,bytes_crc32_verified:1,failed_integrity:0,skipped_size:0,skipped_budget:0,skipped_method:0,skipped_unsafe:0});await flush();
  assert.equal(ui.by('results').hidden,true);
  assert.equal(ui.by('verifyAttachments').disabled,true);
  assert.doesNotMatch(privateSurface(ui),/Clear while checking/);
});

// R10: content-bearing HTML requires a deliberate confirmation; audits remain one-click.
test('R10: selected private HTML must not download until explicit confirmation',async()=>{
  const ui=harness();await importJson(ui,'conversations.json',newer);
  ui.by('conversationList').children[0].click();
  ui.by('downloadHtml').click();
  assert.equal(ui.downloads.length,0,'HTML must not download on first click');
  assert.equal(ui.by('htmlExportConfirm').open,true);
  ui.by('confirmHtmlExport').click();
  assert.equal(ui.downloads.length,1);
  assert.equal(ui.downloads[0].name,'aml-conversation.html');
  assert.equal(ui.by('htmlExportConfirm').open,false);
});

test('R10: cancelling HTML export must not download a private transcript',async()=>{
  const ui=harness();await importJson(ui,'conversations.json',newer);
  ui.by('conversationList').children[0].click();
  ui.by('downloadHtml').click();
  ui.by('cancelHtmlExport').click();
  assert.equal(ui.downloads.length,0);
  assert.equal(ui.by('htmlExportConfirm').open,false);
});

test('R10: switching source and clearing must revoke a pending HTML export',async()=>{
  const ui=harness();await importJson(ui,'conversations.json',newer);
  ui.by('conversationList').children[0].click();
  ui.by('downloadHtml').click();
  ui.by('clearBtn').click();
  assert.equal(ui.by('htmlExportConfirm').open,false);
  ui.by('confirmHtmlExport').click();
  assert.equal(ui.downloads.length,0);
  await importJson(ui,'conversations.json',newer);
  ui.by('conversationList').children[0].click();
  ui.by('downloadHtml').click();
  const start=ui.downloads.length;
  let release;const pending=new Promise(r=>release=r);
  ui.by('archiveFile').files=[{name:'conversations.json',size:100,text:()=>pending}];
  ui.by('archiveFile').fire('change');
  assert.equal(ui.by('htmlExportConfirm').open,false);
  ui.by('confirmHtmlExport').click();
  assert.equal(ui.downloads.length,start);
  release(JSON.stringify(older));await flush();
});

test('R10: escaping the dialog revokes pending export; content-free audit stays direct',async()=>{
  const ui=harness();await importJson(ui,'conversations.json',newer);
  ui.by('conversationList').children[0].click();
  ui.by('downloadHtml').click();
  ui.by('htmlExportConfirm').close();
  ui.by('confirmHtmlExport').click();
  assert.equal(ui.downloads.length,0);
  ui.by('downloadAudit').click();
  assert.equal(ui.downloads.length,1);
  assert.match(ui.downloads[0].name,/aml-audit-/);
});
