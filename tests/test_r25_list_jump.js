/* R25 list navigation: pure synthetic bounds, explicit consent and accessibility. MIT. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const view=require('../src/view_filters.js');
const root=path.join(__dirname,'..'),app=fs.readFileSync(path.join(root,'src/app.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
test('R25: all 30,000 conversations can be reached by bounded 200-item pages',()=>{
 const rows=Array.from({length:30000},(_,i)=>({title:'Synthetic '+i}));
 const page=view.page(rows,149,200);
 assert.equal(page.items.length,200);assert.equal(page.totalPages,150);assert.equal(page.items[0],rows[29800]);
 assert.equal(view.jumpToPage('150',page.totalPages),149);
 assert.equal(view.jumpToPage('1',page.totalPages),0);
 for(const invalid of ['0','00','01','+1','-1','1e2','15.0',' 2','2 ','151','000150','2;alert(1)','999999',null,1,NaN])
   assert.equal(view.jumpToPage(invalid,page.totalPages),null,`reject ${String(invalid)}`);
});
test('R25 UI includes explicit accessible, screen-reader-live local list jump',()=>{
 for(const id of ['listJumpWrap','listPageJump','listGoPage','listJumpStatus'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/id="listPageJump"[^>]*type="text"[^>]*inputmode="numeric"/);
 assert.match(html,/id="listJumpStatus"[^>]*role="status"[^>]*aria-live="polite"/);
 assert.match(html,/三頁以上可輸入頁碼直接前往/);
});
test('R25 jump route rejects invalid state without changing page or selection',()=>{
 const start=app.indexOf('function goToListPage(){');const end=app.indexOf('e.listGoPage.addEventListener',start);
 assert.ok(start>0&&end>start);
 const fn=app.slice(start,end);
 assert.match(fn,/if\(target===null\)\{[\s\S]*?return;/);
 assert.match(fn,/listPage=target;renderList\(\)/);
 assert.match(fn,/view\.jumpToPage\(e\.listPageJump\.value,pages\)/);
 assert.doesNotMatch(fn,/download\(/);
});
test('R25 page hop uses established per-page selection lease and revokes text export if offscreen',()=>{
 assert.match(app,/selectionOnCurrentPage\(current\.conversations,selected,page\.items\)/);
 assert.match(app,/revokeSensitiveExport\(\);resetReaderSession\(\);selected=null;e\.html\.disabled=true/);
 assert.match(app,/e\.listPageJump\.addEventListener\('keydown',ev=>\{if\(committedEnter\(ev\)\)/);
 assert.match(app,/readerPage=0;readerHits=\[\];readerHitCursor=-1/);
 assert.match(app,/e\.listJumpWrap\.hidden=totalPages<3/);
});
test('R25 source replacement and clear erase stale list jump and error state',()=>{
 assert.match(app,/e\.listPageJump\.value='';e\.listPageJump\.disabled=true/);
 assert.match(app,/e\.listJumpStatus\.textContent='';e\.listPageJump\.removeAttribute\('aria-invalid'\)/);
 assert.match(app,/e\.search\.addEventListener\('input',\(\)=>\{clearListJumpInput\(\)/);
 assert.match(app,/e\.riskFilter\.addEventListener\('change',\(\)=>\{clearListJumpInput\(\)/);
 assert.match(app,/e\.listPageJump\.addEventListener\('input',\(\)=>\{e\.listJumpStatus\.textContent=''/);
});
