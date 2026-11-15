/* R18: conservative visible-page selection over 421 wholly synthetic conversations. MIT. */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const view=require('../src/view_filters.js');
const source=fs.readFileSync(require('node:path').join(__dirname,'../src/app.js'),'utf8');
const items=Array.from({length:421},(_,i)=>({id:'synthetic-'+i,pathStatus:i%19?'CURRENT_PATH_PRESENT':'CURRENT_PATH_UNAVAILABLE',messages:[],excludedNodes:0,nonTextCount:0}));
test('421 synthetic conversations are paged as 200, 200 and 21',()=>{
 const pages=[0,1,2].map(i=>view.page(items,i,200));
 assert.deepEqual(pages.map(p=>p.items.length),[200,200,21]);
 assert.equal(pages[0].total,421);
 assert.equal(pages[2].totalPages,3);
});
test('selected item must exist in current page, not merely whole match list',()=>{
 const a=view.page(items,0,200),b=view.page(items,1,200),c=view.page(items,2,200);
 assert.equal(view.selectionOnCurrentPage(items,0,a.items),true);
 assert.equal(view.selectionOnCurrentPage(items,0,b.items),false);
 assert.equal(view.selectionOnCurrentPage(items,200,b.items),true);
 assert.equal(view.selectionOnCurrentPage(items,420,c.items),true);
});
test('risk filter must revoke off-list selection and retain visible selection',()=>{
 const risky=view.filterConversations(items,'PATH_UNAVAILABLE');
 const page=view.page(risky,0,200).items;
 assert.equal(view.selectionOnCurrentPage(items,1,page),false);
 assert.equal(view.selectionOnCurrentPage(items,19,page),true);
});
test('empty list, stale identity and invalid selection fail closed',()=>{
 const onPage=items.slice(0,200);
 for(const i of [null,undefined,-1,421,Infinity,NaN,1.5,'0'])
  assert.equal(view.selectionOnCurrentPage(items,i,onPage),false);
 assert.equal(view.selectionOnCurrentPage(items,0,[]),false);
 assert.equal(view.selectionOnCurrentPage(items,1,[{...items[1]}]),false);
 assert.equal(view.selectionOnCurrentPage(items,0,null),false);
});
test('app enforces page-scoped lease and revokes HTML export on hidden selection',()=>{
 assert.ok(source.includes('view.page(matched,listPage,LIST_PAGE_SIZE)'));
 assert.ok(source.includes('view.selectionOnCurrentPage(current.conversations,selected,page.items)'));
 assert.ok(source.includes('revokeSensitiveExport();selected=null;e.html.disabled=true;'));
 assert.ok(source.includes('pending.generation===generation && pending.selected===selected'));
});
