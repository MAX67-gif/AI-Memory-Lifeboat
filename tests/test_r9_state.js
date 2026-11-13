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
const VIEW = require('../src/view_filters.js');

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
  const window={AMLCore:CORE,AMLCompare:COMPARE,AMLHealth:HEALTH,AMLDemo:DEMO,AMLPilotR5:PILOT,AMLFirstResult:FIRST,AMLViewFilters:VIEW,AMLZip:zip};
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


test('R12: oversized HTML export closes confirmation, downloads nothing, and shows a safe error',async()=>{
  const ui=harness();await importJson(ui,'conversations.json',newer);
  ui.by('conversationList').children[0].click();
  const many=Array.from({length:18},()=>({role:'assistant',text:'A'.repeat(1024*1024),created:0}));
  // This test exercises the same public selected-conversation export through the UI.
  const selected=ui.by('conversationList').children[0];
  // Reimport a source whose current path contains sufficient synthetic text to exceed the bounded export.
  const chain={};let last=null;
  for(let i=0;i<many.length;i++){
    const id='n'+i;chain[id]={parent:last,message:{author:{role:'assistant'},content:{parts:[many[i].text]}}};last=id;
  }
  await importJson(ui,'conversations.json',[{id:'synthetic-large',title:'Large fictional note',mapping:chain,current_node:last}]);
  ui.by('conversationList').children[0].click();ui.by('downloadHtml').click();
  assert.equal(ui.downloads.length,0);
  ui.by('confirmHtmlExport').click();
  assert.equal(ui.downloads.length,0);
  assert.equal(ui.by('htmlExportConfirm').open,false);
  assert.match(ui.by('status').textContent,/超過|上限|過大/);
});

// R13: truncation follows the source from parsing through reading, reports and clear.
test('R13: shortened messages warn in the reading DOM and warnings clear on source change',async()=>{
 const ui=harness();
 const sample=[{id:'r13-ui-synthetic',title:'R13 synthetic long text',current_node:'a',mapping:{a:{parent:null,message:{author:{role:'user'},content:{parts:['A'.repeat(2_000_000)+'UNSEEN_TAIL']}}}}}];
 await importJson(ui,'conversations.json',sample);
 ui.by('conversationList').children[0].click();
 assert.match(ui.by('conversationDetail').textContent,/截短/);
 assert.match(ui.by('healthCards').textContent,/截短/);
 assert.doesNotMatch(ui.by('conversationDetail').textContent,/UNSEEN_TAIL/);
 await importOlder(ui,'older.json',sample);
 assert.match(ui.by('compareList').textContent,/截短|無法完整比較/);
 assert.doesNotMatch(ui.by('compareList').textContent,/undefined/);
 ui.by('clearBtn').click();
 assert.equal(ui.by('conversationDetail').textContent,'');
 assert.equal(ui.by('healthCards').textContent,'');
 assert.equal(ui.by('compareList').textContent,'');
 await importJson(ui,'conversations.json',newer);
 ui.by('conversationList').children[0].click();
 assert.doesNotMatch(ui.by('conversationDetail').textContent,/截短/);
});

// R14 uses the same application-event seam and synthetic-only fixtures.
function r14Rows(title,count=1){
 const mapping={};for(let i=0;i<count;i++)mapping['n'+i]={parent:i?'n'+(i-1):null,message:{author:{role:i%2?'assistant':'user'},content:{parts:['SYNTHETIC_MESSAGE_'+i]}}};
 return [{id:'r14-stable',title,current_node:'n'+(count-1),mapping}];
}
test('R14: long title notice appears before messages and is removed when source changes',async()=>{
 const ui=harness();await importJson(ui,'conversations.json',r14Rows('PRIVATE_TITLE_'.repeat(45)));
 ui.by('conversationList').children[0].click();
 const detail=ui.by('conversationDetail');
 const note=detail.children.findIndex(c=>c.dataset?.titleTruncated==='true');
 const message=detail.children.findIndex(c=>c.className==='message');
 assert.ok(note>=0&&note<message);assert.match(detail.children[note].textContent,/標題已截短/);
 assert.match(ui.by('warningList').textContent,/標題/);assert.match(ui.by('healthCards').textContent,/標題/);
 await importJson(ui,'new.json',r14Rows('New short title'));ui.by('conversationList').children[0].click();
 assert.doesNotMatch(detail.textContent,/標題已截短|PRIVATE_TITLE_/);
 ui.by('clearBtn').click();assert.equal(detail.textContent,'');
});

test('R14: 701-message scope is visible above the bounded reading window, not hidden at the end',async()=>{
 const ui=harness();await importJson(ui,'conversations.json',r14Rows('Long conversation',701));
 ui.by('conversationList').children[0].click();
 const detail=ui.by('conversationDetail'),children=detail.children;
 const note=children.findIndex(c=>c.dataset?.readingWindow==='true');
 const message=children.findIndex(c=>c.className==='message');
 assert.ok(note>=0&&note<message);assert.match(children[note].textContent,/700.*701/);
 assert.match(children[note].textContent,/搜尋/);assert.match(children[note].textContent,/HTML/);
 assert.equal(children.filter(c=>c.className==='message').length,700);
 assert.doesNotMatch(detail.textContent,/SYNTHETIC_MESSAGE_700/);
 ui.by('searchBox').value='SYNTHETIC_MESSAGE_700';ui.by('searchBox').fire('input');
 assert.match(ui.by('resultCount').textContent,/符合 1 則/);
 ui.by('conversationList').children[0].click();assert.match(detail.textContent,/700.*701/);
 await importJson(ui,'short.json',r14Rows('Exactly cap',700));ui.by('conversationList').children[0].click();
 assert.equal(detail.children.filter(c=>c.className==='message').length,700);
 assert.ok(!detail.children.some(c=>c.dataset?.readingWindow==='true'));
 assert.match(detail.textContent,/顯示 700.*700/);
});

test('R14: title-unknown comparison has a readable label and clear removes the old scope notices',async()=>{
 const ui=harness();await importJson(ui,'conversations.json',r14Rows('X'.repeat(500)+'NEW'));
 await importOlder(ui,'old.json',r14Rows('X'.repeat(500)+'OLD'));
 assert.match(ui.by('compareList').textContent,/標題已截短，無法完整比較/);
 assert.match(ui.by('healthCards').textContent,/兩次匯出/);
 ui.by('clearBtn').click();assert.equal(ui.by('compareList').textContent,'');
 assert.equal(ui.by('healthCards').textContent,'');assert.equal(ui.by('conversationDetail').textContent,'');
});

test('R14: coverage notices precede a long heading that can fill a mobile reading pane',async()=>{
 const ui=harness();const title='T'.repeat(500);
 await importJson(ui,'conversations.json',r14Rows(title+'omitted',701));ui.by('conversationList').children[0].click();
 const children=ui.by('conversationDetail').children;
 const heading=children.findIndex(c=>c.textContent===title);
 const note=children.findIndex(c=>c.dataset?.titleTruncated==='true');
 const scope=children.findIndex(c=>c.dataset?.readingWindow==='true');
 assert.match(children[0].textContent,/顯示 700 \/ 701/);
 assert.ok(note>=0&&note<heading);assert.ok(scope>=0&&scope<heading);
});

// R15: bounded browsing over all matched conversations, without silently hiding item 201+.
const r15Records = n => Array.from({length:n},(_,i)=>({
  id:`R15_ID_${i}`, title:`R15_TITLE_${String(i).padStart(4,'0')}`,
  current_node:'n',mapping:{n:{parent:null,message:{author:{role:'user'},content:{parts:[`R15_BODY_${String(i).padStart(4,'0')}`]}}}}
}));

test('R15: a 201st matching conversation is reachable by one page turn without adding 201 DOM rows',async()=>{
  const ui=harness();await importJson(ui,'conversations.json',r15Records(201));
  assert.equal(ui.by('conversationList').children.length,200);
  assert.match(ui.by('resultCount').textContent,/201/);
  assert.match(ui.by('listPageInfo').textContent,/1\s*\/\s*2/);
  assert.equal(ui.by('listPrev').disabled,true);
  ui.by('listNext').click();
  assert.equal(ui.by('conversationList').children.length,1);
  assert.match(ui.by('conversationList').textContent,/R15_TITLE_0200/);
  assert.equal(ui.by('listNext').disabled,true);
  ui.by('conversationList').children[0].click();
  assert.match(ui.by('conversationDetail').textContent,/R15_BODY_0200/);
  ui.by('listPrev').click();
  assert.equal(ui.by('conversationList').children.length,200);
  assert.match(ui.by('listPageInfo').textContent,/1\s*\/\s*2/);
});

test('R15: a 401st match is reachable; search resets to page one and does not truncate search coverage',async()=>{
  const ui=harness();await importJson(ui,'conversations.json',r15Records(401));
  ui.by('listNext').click();ui.by('listNext').click();
  assert.equal(ui.by('conversationList').children.length,1);
  assert.match(ui.by('conversationList').textContent,/R15_TITLE_0400/);
  assert.match(ui.by('listPageInfo').textContent,/3\s*\/\s*3/);
  ui.by('searchBox').value='R15_BODY_0300';ui.by('searchBox').fire('input');
  assert.equal(ui.by('conversationList').children.length,1);
  assert.match(ui.by('conversationList').textContent,/R15_TITLE_0300/);
  assert.match(ui.by('resultCount').textContent,/1/);
  assert.equal(ui.by('listPager').hidden,true);
  ui.by('searchBox').value='NOT_A_REAL_SYNTHETIC_MESSAGE';ui.by('searchBox').fire('input');
  assert.equal(ui.by('listPager').hidden,true);
  assert.equal(ui.by('listNext').disabled,true);
  assert.match(ui.by('conversationList').textContent,/沒有符合/);
});

test('R15: changing source and clearing revoke the paging state and old rendered titles',async()=>{
  const ui=harness();await importJson(ui,'conversations.json',r15Records(401));
  ui.by('listNext').click();ui.by('listNext').click();
  assert.match(ui.by('conversationList').textContent,/R15_TITLE_0400/);
  await importJson(ui,'conversations.json',r15Records(201));
  assert.equal(ui.by('conversationList').children.length,200);
  assert.match(ui.by('listPageInfo').textContent,/1\s*\/\s*2/);
  assert.doesNotMatch(ui.by('conversationList').textContent,/R15_TITLE_0400/);
  ui.by('clearBtn').click();
  assert.equal(ui.by('listPager').hidden,true);
  assert.equal(ui.by('listNext').disabled,true);
  assert.equal(ui.by('conversationList').textContent,'');
});

test('R15: exact 200 records do not invent a second page or require paging',async()=>{
  const ui=harness();await importJson(ui,'conversations.json',r15Records(200));
  assert.equal(ui.by('conversationList').children.length,200);
  assert.equal(ui.by('listPager').hidden,true);
  assert.equal(ui.by('listPrev').disabled,true);
  assert.equal(ui.by('listNext').disabled,true);
  assert.match(ui.by('resultCount').textContent,/200/);
  ui.by('listNext').click();
  assert.equal(ui.by('conversationList').children.length,200);
});

// R16: interaction-surface tests for local truth routing and complete browsing.
const syntheticRows=(n,tag='NEW')=>Array.from({length:n},(_,i)=>({
  id:`${tag}-${i}`,title:`Synthetic ${tag} ${i}`,
  current_node:'n',mapping:{n:{parent:null,message:{author:{role:'user'},content:{parts:[`Synthetic content ${i}`]}}}}
}));
test('R16: comparison filter and bounded pages reach all 167 new records without hiding them at 120',async()=>{
  const ui=harness();await importJson(ui,'newer.json',syntheticRows(167));await importOlder(ui,'older.json',[]);
  const pager=ui.by('comparePager'),info=ui.by('comparePageInfo');
  assert.equal((ui.by('compareList').textContent.match(/只在新版匯出中出現/g)||[]).length,80);
  assert.match(info.textContent,/第 1 \/ 3 頁/);
  assert.equal(pager.hidden,false);
  ui.by('compareNext').click();ui.by('compareNext').click();
  assert.equal((ui.by('compareList').textContent.match(/只在新版匯出中出現/g)||[]).length,7);
  assert.match(ui.by('compareList').textContent,/Synthetic NEW 166/);
  assert.equal(ui.by('compareNext').disabled,true);
  ui.by('compareFilter').value='UNKNOWN';ui.by('compareFilter').fire('change');
  assert.match(ui.by('compareList').textContent,/沒有符合/);
  assert.equal(ui.by('comparePager').hidden,true);
});
test('R16: title-truncated snapshot shows one uncertainty in comparison metric and route',async()=>{
  const common='Q'.repeat(510);
  const older=[{id:'fixture',title:common+' old',current_node:'n',mapping:{n:{parent:null,message:{author:{role:'user'},content:{parts:['same']}}}}}];
  const newer=[{id:'fixture',title:common+' new',current_node:'n',mapping:{n:{parent:null,message:{author:{role:'user'},content:{parts:['same']}}}}}];
  const ui=harness();await importJson(ui,'newer.json',newer);await importOlder(ui,'older.json',older);
  assert.equal(ui.by('compareCounts').children[3].children[0].textContent,'1');
  assert.match(ui.by('compareRoute').textContent,/無法完整比較/);
  ui.by('compareFilter').value='UNKNOWN';ui.by('compareFilter').fire('change');
  assert.match(ui.by('compareList').textContent,/標題已截短/);
});
test('R16: risk filter combines with search and clears hidden selection when it no longer matches',async()=>{
  const rows=syntheticRows(3);rows[0].title='T'.repeat(520);
  const ui=harness();await importJson(ui,'newer.json',rows);
  ui.by('conversationList').children[1].click();assert.equal(ui.by('downloadHtml').disabled,false);
  ui.by('riskFilter').value='TITLE_TRUNCATED';ui.by('riskFilter').fire('change');
  assert.equal(ui.by('conversationList').children.length,1);
  assert.equal(ui.by('downloadHtml').disabled,true);
  assert.doesNotMatch(ui.by('conversationDetail').textContent,/Synthetic content 1/);
  ui.by('searchBox').value='does-not-exist';ui.by('searchBox').fire('input');
  assert.match(ui.by('resultCount').textContent,/符合 0/);
  ui.by('clearBtn').click();assert.equal(ui.by('riskFilter').value,'ALL');
});
