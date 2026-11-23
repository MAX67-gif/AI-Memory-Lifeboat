/* R22: composition confirmation must not activate reading navigation. Synthetic only. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');

// A DOM event seam runs the real app. Visual focus/scroll behavior is checked in Chrome.
function harness(){
 const document={activeElement:null};
 class Element{
  constructor(){this.children=[];this._text='';this.value='';this.hidden=false;this.disabled=false;this.dataset={};this.attrs={};this.listeners={};this.files=[];}
  get textContent(){return this._text+this.children.map(n=>typeof n==='string'?n:n.textContent).join('');}
  set textContent(value){this._text=String(value);this.children=[];}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=[];this._text='';this.append(...nodes);}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  fire(type,detail={}){const event={type,key:'',defaultPrevented:false,...detail,preventDefault(){this.defaultPrevented=true;}};for(const fn of this.listeners[type]||[])fn(event);return event;}
  click(){if(!this.disabled)this.fire('click');}
  focus(){document.activeElement=this;}
  scrollIntoView(){}
  setAttribute(key,value){this.attrs[key]=String(value);}
  getAttribute(key){return this.attrs[key]??null;}
  removeAttribute(key){delete this.attrs[key];if(key==='data-reader-hit')delete this.dataset.readerHit;}
  querySelectorAll(selector){
   const attr=selector.match(/^\[([^=]+)="([^"]*)"\]$/),result=[];
   for(const child of this.children){if(!(child instanceof Element))continue;
    const key=attr?.[1].replace(/^data-/,'').replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
    if(attr&&(attr[1].startsWith('data-')?child.dataset[key]:child.getAttribute(attr[1]))===attr[2])result.push(child);
    result.push(...child.querySelectorAll(selector));
   }return result;
  }
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  showModal(){this.open=true;}
  close(){this.open=false;this.fire('close');}
  remove(){}
 }
 const ids=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 const elements=new Map(ids.map(id=>[id,new Element()])),picker=new Element();
 const by=id=>{assert.ok(elements.has(id),'Unknown DOM id '+id);return elements.get(id);};
 Object.assign(document,{getElementById:by,querySelector:()=>picker,createElement:()=>new Element(),createDocumentFragment:()=>new Element(),body:new Element()});
 const window={};
 for(const [global,file] of Object.entries({AMLCore:'core',AMLCompare:'compare',AMLHealth:'health',AMLDemo:'demo',AMLPilotR5:'pilot_r5',AMLFirstResult:'first_result',AMLViewFilters:'view_filters',AMLZip:'zip'}))window[global]=require(path.join(root,'src',file+'.js'));
 vm.runInNewContext(fs.readFileSync(path.join(root,'src/app.js'),'utf8'),{window,document,Blob,URL:{createObjectURL:()=> 'blob:synthetic',revokeObjectURL(){}},setTimeout(){},Uint8Array},{filename:'src/app.js'});
 return {by,document};
}
async function selectedReader(){
 const ui=harness(),mapping={};
 for(let n=1;n<=1402;n++)mapping['n'+n]={parent:n===1?null:'n'+(n-1),message:{author:{role:'user'},content:{parts:[n===1110?'合成資料命中':'Synthetic retained message '+n]}}};
 const source=JSON.stringify([{id:'SYNTHETIC_COMPOSITION',title:'Synthetic composition test',current_node:'n1402',mapping}]);
 ui.by('archiveFile').files=[{name:'conversations.json',size:Buffer.byteLength(source),text:async()=>source}];
 ui.by('archiveFile').fire('change');await new Promise(r=>setImmediate(r));ui.by('conversationList').children[0].click();
 return ui;
}

for(const [label,event] of [['composing',{isComposing:true,keyCode:13}],['legacy229',{isComposing:false,keyCode:229}],['both',{isComposing:true,keyCode:229}]]){
 test('R22: '+label+' Enter leaves in-progress search composition untouched',async()=>{
  const ui=await selectedReader(),input=ui.by('readerQuery');input.value='合成資料';input.fire('input');input.focus();
  const before=ui.by('readerWindowInfo').textContent;
  const result=input.fire('keydown',{key:'Enter',...event});
  assert.equal(result.defaultPrevented,false,'IME must own its confirmation key');
  assert.equal(ui.document.activeElement,input,'Do not move focus before composition commits');
  assert.equal(ui.by('readerWindowInfo').textContent,before);
  assert.equal(ui.by('conversationDetail').querySelectorAll('[data-reader-hit="true"]').length,0);
  assert.equal(ui.by('readerNextHit').disabled,true);
 });
 test('R22: '+label+' Enter does not execute a pending message-number jump',async()=>{
  const ui=await selectedReader(),input=ui.by('readerJumpInput');input.value='1110';input.fire('input');input.focus();
  const before=ui.by('readerWindowInfo').textContent;
  const result=input.fire('keydown',{key:'Enter',...event});
  assert.equal(result.defaultPrevented,false);assert.equal(ui.document.activeElement,input);
  assert.equal(ui.by('readerWindowInfo').textContent,before);assert.equal(ui.by('readerJumpStatus').textContent,'');
 });
}
test('R22: committed Enter still searches retained Chinese text and focuses its hit',async()=>{
 const ui=await selectedReader(),input=ui.by('readerQuery');input.value='合成資料';input.fire('input');input.focus();
 assert.equal(input.fire('keydown',{key:'Enter',isComposing:false,keyCode:13}).defaultPrevented,true);
 assert.equal(ui.document.activeElement.dataset.readerIndex,'1109');assert.equal(ui.document.activeElement.dataset.readerHit,'true');
 assert.match(ui.by('readerWindowInfo').textContent,/701–1400/);
});
test('R22: committed Enter still jumps to retained message 1402 within a two-message window',async()=>{
 const ui=await selectedReader(),input=ui.by('readerJumpInput');input.value='1402';input.focus();
 assert.equal(input.fire('keydown',{key:'Enter',isComposing:false,keyCode:13}).defaultPrevented,true);
 assert.equal(ui.document.activeElement.dataset.readerIndex,'1401');assert.match(ui.by('readerWindowInfo').textContent,/1401–1402/);
});
