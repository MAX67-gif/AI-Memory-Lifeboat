/* R28 real-Chrome, fixed synthetic-only, long-text rendering and privacy guard. MIT.
 * Chrome file:// is required in CI; this is not bundled in the offline HTML. */
'use strict';
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const {setTimeout:delay}=require('node:timers/promises');
const {pathToFileURL}=require('node:url');
const {parseArgs}=require('node:util');
const {conv}=require('./fixtures_r26');
const {stats}=require('./profile_offline_performance');

const STARTUP_BUDGET_MS=25000,CDP_BUDGET_MS=15000;
const SHADOW_RULE='.conversation-detail .message{content-visibility:auto;contain-intrinsic-size:auto 160px}';
const MATRIX=Object.freeze([
  {messages:20,chars:8000},{messages:80,chars:16000},
  {messages:120,chars:32000},{messages:240,chars:38500},
  {messages:240,chars:64000},{messages:701,chars:8000}
]);
const VIEWPORTS=Object.freeze([{name:'desktop',width:1280,height:900,mobile:false},
  {name:'mobile-emulated',width:390,height:844,mobile:true}]);
function options(argv){const v=parseArgs({args:argv,options:{
  chrome:{type:'string'},'output-dir':{type:'string'},'include-baseline':{type:'boolean'},help:{type:'boolean'}
}}).values;return v;}
function fixture(messages,chars){
  if(!MATRIX.some(x=>x.messages===messages&&x.chars===chars))throw Error('R28_UNREGISTERED_FIXTURE');
  const json=Buffer.from(JSON.stringify([conv('r28',messages,'R28_SYNTHETIC_'+('A'.repeat(chars)))]));
  return {json,sha256:crypto.createHash('sha256').update(json).digest('hex'),bytes:json.length,messages,chars};
}
function baselineHtml(candidate){
  const m=candidate.match(/<style>([\s\S]*?)<\/style>/);
  if(!m)throw Error('R28_STYLE_BLOCK_MISSING');
  const oldStyle=m[1];
  if(oldStyle.split(SHADOW_RULE).length!==2)throw Error('R28_RULE_MISSING_OR_REPEATED');
  const restored=oldStyle.replace(SHADOW_RULE,'');
  const sha=s=>`'sha256-${crypto.createHash('sha256').update(s,'utf8').digest('base64')}'`;
  const before=sha(oldStyle),after=sha(restored);
  if(candidate.split(before).length!==2)throw Error('R28_CSP_HASH_MISSING_OR_REPEATED');
  return candidate.replace(before,after).replace(m[0],`<style>${restored}</style>`);
}
async function until(check,label,ms=15000){const since=Date.now();let error;
  while(Date.now()-since<ms){try{const r=await check();if(r)return r;}catch(e){error=e;}await delay(70);}
  throw Error('TIMEOUT_'+label+(error?'_LAST_'+String(error.message).slice(0,80):''));
}
async function cdp(url){const ws=new WebSocket(url),pending=new Map(),handlers=new Map();let n=0;
  await Promise.race([once(ws,'open'),once(ws,'error').then(()=>{throw Error('CDP_CONNECT_ERROR');}),
    delay(7000).then(()=>{throw Error('CDP_CONNECT_TIMEOUT');})]);
  ws.addEventListener('message',({data})=>{const r=JSON.parse(data);if(r.id){pending.get(r.id)?.(r);return;}
    for(const h of handlers.get(r.method)||[])h(r.params||{});});
  ws.addEventListener('close',()=>{for(const cb of pending.values())cb({error:{message:'CDP_SOCKET_CLOSED'}});});
  return {on:(name,fn)=>handlers.set(name,[...(handlers.get(name)||[]),fn]),
    send:(method,params={},budget=CDP_BUDGET_MS)=>new Promise((resolve,reject)=>{
      const id=++n;let done=false;
      const timer=setTimeout(()=>{if(!done){done=true;pending.delete(id);reject(Error('CDP_TIMEOUT_'+method));}},budget);
      pending.set(id,r=>{if(done)return;done=true;clearTimeout(timer);pending.delete(id);
        r.error?reject(Error(method+': '+String(r.error.message).slice(0,100))):resolve(r.result||{});});
      try{ws.send(JSON.stringify({id,method,params}));}catch(e){clearTimeout(timer);pending.delete(id);reject(e);}
    }),close:()=>ws.close()};
}
async function evaluate(page,fn,...args){const result=await page.send('Runtime.evaluate',{
  expression:`(${fn})(...${JSON.stringify(args)})`,awaitPromise:true,returnByValue:true
});if(result.exceptionDetails)throw Error('PAGE_EXCEPTION_'+String(result.exceptionDetails.exception?.description||result.exceptionDetails.text).slice(0,110));
  return result.result?.value;
}
async function run(chrome,report,files,base){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'aml-r28-chrome-'));
  const browser=spawn(chrome,['--headless','--no-sandbox','--disable-dev-shm-usage',
    '--disable-background-networking','--disable-extensions','--disable-sync',
    '--no-first-run','--no-default-browser-check','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost',
    `--user-data-dir=${dir}`,'--remote-debugging-port=0','about:blank'],{stdio:['ignore','ignore','pipe']});
  let spawnError,stderr='',socket,page,errors=[],outbound=[],loaderIds=new Set();
  browser.on('error',e=>spawnError=e);browser.stderr.setEncoding('utf8');
  browser.stderr.on('data',x=>{stderr=(stderr+x).slice(-2000);});
  const since=Date.now(),startup=report.startup={budgetMs:STARTUP_BUDGET_MS,
    polls:0,elapsedMs:null,state:'WAITING',relaunches:0,browser:path.basename(chrome)};
  const allowed=new Set([base.candidateUrl,base.baselineUrl,'about:blank']);
  try{
    let conn;
    try{conn=await until(async()=>{startup.polls++;
      if(spawnError||browser.exitCode!==null)return {failed:true};
      const parts=(await fs.readFile(path.join(dir,'DevToolsActivePort'),'utf8')).trim().split('\n');
      return parts.length===2?{port:parts[0],path:parts[1]}:null;
    },'CHROME_STARTUP',STARTUP_BUDGET_MS);}catch(e){startup.state=spawnError||browser.exitCode!==null?'PROCESS_EXIT':'ENDPOINT_TIMEOUT';throw e;}
    startup.state=conn.failed?'PROCESS_EXIT':'ENDPOINT_READY';startup.elapsedMs=Date.now()-since;
    if(conn.failed)throw Error('R28_CHROME_PROCESS_START_FAILED');
    const host=`127.0.0.1:${conn.port}`;
    socket=await cdp(`ws://${host}${conn.path}`);startup.state='CDP_CONNECTED';
    report.environment.browser=(await socket.send('Browser.getVersion')).product;
    const targets=await (await fetch(`http://${host}/json/list`,{signal:AbortSignal.timeout(6000)})).json();
    const target=targets.find(x=>x.type==='page');if(!target)throw Error('R28_PAGE_MISSING');
    page=await cdp(target.webSocketDebuggerUrl);
    page.on('Page.frameNavigated',x=>{if(x.frame?.loaderId)loaderIds.add(x.frame.loaderId);});
    const permitted=url=>allowed.has(url)||url.startsWith('blob:')||url.startsWith('data:');
    page.on('Network.requestWillBeSent',x=>{if(!permitted(x.request.url))outbound.push('BLOCKED_EXTERNAL_REQUEST');});
    page.on('Network.webSocketCreated',x=>{if(!permitted(x.url))outbound.push('BLOCKED_EXTERNAL_SOCKET');});
    page.on('Fetch.requestPaused',x=>page.send(permitted(x.request.url)?'Fetch.continueRequest':'Fetch.failRequest',
      permitted(x.request.url)?{requestId:x.requestId}:{requestId:x.requestId,errorReason:'BlockedByClient'})
      .catch(()=>errors.push('INTERCEPTOR_ERROR')));
    page.on('Runtime.exceptionThrown',()=>errors.push('UNCAUGHT_JS_EXCEPTION'));
    page.on('Runtime.consoleAPICalled',x=>{if(x.type==='error'||x.type==='assert')errors.push('CONSOLE_ERROR');});
    for(const name of ['Page.enable','Runtime.enable','DOM.enable','Network.enable','Fetch.enable','Performance.enable'])await page.send(name);
    const prepare=async(url,record)=>{
      loaderIds.clear();const nav=await page.send('Page.navigate',{url});
      if(nav.errorText)throw Error('R28_NAVIGATION_'+nav.errorText);
      if(!nav.loaderId)throw Error('R28_FRESH_LOADER_MISSING');
      await until(async()=>loaderIds.has(nav.loaderId)&&await evaluate(page,()=>document.readyState==='complete'&&!!document.getElementById('archiveFile')),'FRESH_DOCUMENT');
      const d=await page.send('DOM.getDocument');const input=await page.send('DOM.querySelector',{nodeId:d.root.nodeId,selector:'#archiveFile'});
      if(!input.nodeId)throw Error('R28_FILE_INPUT_MISSING');
      record.pageLoaded=true;return input.nodeId;
    };
    const oneCase=async(spec,viewport,mode,iteration)=>{
      const entry=files.find(x=>x.messages===spec.messages&&x.chars===spec.chars);
      const result={messages:spec.messages,chars:spec.chars,sourceSha256:entry.sha256,
        sourceBytes:entry.bytes,viewport:viewport.name,mode,iteration,status:'STARTED'};
      const started=Date.now();
      try{
        const input=await prepare(mode==='shadow'?base.candidateUrl:base.baselineUrl,result);
        await page.send('DOM.setFileInputFiles',{nodeId:input,files:[entry.file]});
        const imported=await until(async()=>evaluate(page,()=>{
          const s=document.querySelector('#status');if(s.classList.contains('error'))return {failed:true};
          return s.classList.contains('ok')?{count:document.querySelectorAll('#conversationList button').length}:null;
        }),'IMPORT',16000);
        if(imported.failed||imported.count!==1)throw Error('R28_IMPORT_DID_NOT_SUCCEED');
        const first=await evaluate(page,()=>{
          const t=performance.now();document.querySelector('#conversationList button').click();
          window.__r28SelectAt=t;return document.querySelectorAll('#conversationDetail .message').length;
        });
        const expected=Math.min(spec.messages,700);
        if(first!==expected)throw Error('R28_BOUNDED_WINDOW_MISMATCH');
        const paint=await evaluate(page,async()=>{
          await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
          return {ms:performance.now()-window.__r28SelectAt,
            nodes:document.querySelectorAll('#conversationDetail .message').length,
            contentVisibility:getComputedStyle(document.querySelector('#conversationDetail .message')).contentVisibility};
        });
        if(paint.nodes!==expected||!Number.isFinite(paint.ms))throw Error('R28_RENDER_INVARIANT');
        if(mode==='shadow'&&paint.contentVisibility!=='auto')throw Error('R28_CSS_SHADOW_NOT_ACTIVE');
        if(mode==='baseline'&&paint.contentVisibility==='auto')throw Error('R28_BASELINE_CONFOUNDED');
        result.selectToFrameMs=Number(paint.ms.toFixed(2));
        const metrics=await page.send('Performance.getMetrics',{},CDP_BUDGET_MS);
        result.performanceMetricsCount=metrics.metrics?.length||0;
        if(result.performanceMetricsCount<10)throw Error('R28_CDP_METRICS_UNAVAILABLE');
        const last=await evaluate(page,async(last,more)=>{
          if(more){const box=document.querySelector('#readerJumpInput');box.value=String(last);
            document.querySelector('#readerJumpGo').click();}
          else{const q=document.querySelector('#readerQuery');q.value=' '+last;
            q.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#readerFind').click();}
          await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
          const focus=document.activeElement;
          const txt=focus?.querySelector('pre')?.textContent||'';
          const nodes=document.querySelectorAll('#conversationDetail .message').length;
          return {focusLabel:focus?.getAttribute('aria-label'),textEnds:txt.endsWith(' '+last),
            visibleNodes:nodes,old:document.querySelector('#downloadHtml').disabled};
        },spec.messages,spec.messages>700);
        if(last.focusLabel!==`第 ${spec.messages} 則訊息`||!last.textEnds||last.visibleNodes>700||last.old)
          throw Error('R28_FOCUS_OR_ORIGINAL_TEXT_LOST');
        result.focusLastPassed=true;
        const erased=await evaluate(page,()=>{
          document.querySelector('#downloadHtml').click();const open=document.querySelector('#htmlExportConfirm').open;
          document.querySelector('#clearBtn').click();return {wasOpen:open,isOpen:document.querySelector('#htmlExportConfirm').open,
            nodes:document.querySelectorAll('#conversationDetail .message').length,
            buttons:document.querySelectorAll('#conversationList button').length,
            disabled:document.querySelector('#downloadHtml').disabled};
        });
        if(!erased.wasOpen||erased.isOpen||erased.nodes||erased.buttons||!erased.disabled)
          throw Error('R28_PRIVATE_CONSENT_OR_DOM_SCRUB');
        if(outbound.length||errors.length)throw Error('R28_UNEXPECTED_RUNTIME_OR_OUTBOUND');
        result.status='PASS';result.elapsedMs=Date.now()-started;
        console.log('R28_PASS',viewport.name,mode,spec.messages,spec.chars,result.selectToFrameMs);
      }catch(e){result.status='FAIL';result.reason=String(e.message).slice(0,160);
        result.elapsedMs=Date.now()-started;console.error('R28_FAIL',viewport.name,mode,spec.messages,spec.chars,result.reason);
      }
      return result;
    };
    for(const viewport of VIEWPORTS){
      await page.send('Emulation.setDeviceMetricsOverride',{width:viewport.width,height:viewport.height,
        mobile:viewport.mobile,deviceScaleFactor:1});
      await page.send('Emulation.setTouchEmulationEnabled',{enabled:viewport.mobile});
      for(const spec of MATRIX){
        const times=spec.messages===240&&spec.chars===38500?3:1;
        for(let i=0;i<times;i++){
          const result=await oneCase(spec,viewport,'shadow',i+1);report.cases.push(result);
          if(result.status!=='PASS')throw Error('R28_SHADOW_FAIL_'+result.reason);
        }
      }
      if(outbound.length||errors.length)throw Error('R28_BROWSER_SECURITY_FAIL');
    }
    // Research evidence: baseline only AFTER all mandatory candidate cases; failure remains RED,
    // never upgrades a baseline timeout to PASS or contaminates later candidate checks.
    if(base.includeBaseline){
      const vp=VIEWPORTS[0];await page.send('Emulation.setDeviceMetricsOverride',{
        width:vp.width,height:vp.height,mobile:vp.mobile,deviceScaleFactor:1});
      const result=await oneCase({messages:240,chars:38500},vp,'baseline',1);
      report.baselineObservation=result;
    }
    report.networkViolations=outbound.length;report.runtimeErrors=errors.length;
  }catch(e){report.error={code:'R28_CHROME_EVIDENCE_FAILED',detail:String(e.message).slice(0,200),
    chromeExitCode:browser.exitCode,chromeSpawnError:spawnError?.code||null,
    chromeStderrTail:stderr.slice(-900)};throw e;
  }finally{
    page?.close();socket?.close();
    if(browser.pid&&browser.exitCode===null&&browser.signalCode===null){
      const end=once(browser,'exit');browser.kill();await Promise.race([end,delay(1800)]);
      if(browser.exitCode===null&&browser.signalCode===null){browser.kill('SIGKILL');await end;}
    }
    await fs.rm(dir,{recursive:true,force:true,maxRetries:3});
  }
}
async function main(){const cfg=options(process.argv.slice(2));if(cfg.help){console.log('--chrome PATH --output-dir DIR [--include-baseline]');return;}
  const dir=path.resolve(cfg['output-dir']||path.join(os.tmpdir(),'aml-r28-longtext'));
  await fs.mkdir(dir,{recursive:true});
  const work=await fs.mkdtemp(path.join(os.tmpdir(),'aml-r28-synthetic-'));
  const current=path.resolve(__dirname,'../dist/AI_Memory_Lifeboat_Offline.html');
  const report={schema:'aml.r28.longtext-real-chrome.v1',mode:'SYNTHETIC_ONLY',productVersion:require('../package.json').version,
    provenance:'file:// actual standalone with hash CSP; baseline derived only by removing scoped R28 CSS and updating hash',
    definition:'selectToFrameMs is selection click to 2 rAF; layout and frame scheduling included; no FPS guarantee',
    environment:{node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model,
      logicalCores:os.cpus().length,totalSystemMemoryBytes:os.totalmem()},matrix:MATRIX,
    cases:[],baselineObservation:null,networkViolations:null,runtimeErrors:null,startup:null};
  try{
    const actual=await fs.readFile(current,'utf8');
    const baseline=path.join(work,'baseline.html');
    await fs.writeFile(baseline,baselineHtml(actual),'utf8');
    const files=[];
    for(const spec of MATRIX){const fx=fixture(spec.messages,spec.chars);
      const file=path.join(work,`synthetic-${spec.messages}-${spec.chars}-conversations.json`);
      await fs.writeFile(file,fx.json);files.push({...spec,sha256:fx.sha256,bytes:fx.bytes,file});}
    report.fixtures=files.map(x=>({messages:x.messages,chars:x.chars,bytes:x.bytes,sha256:x.sha256}));
    await run(cfg.chrome||process.env.CHROME_BIN||'google-chrome',report,files,{
      candidateUrl:pathToFileURL(current).href,baselineUrl:pathToFileURL(baseline).href,
      includeBaseline:cfg['include-baseline']===true
    });
    report.verdict='PASS';
  }catch(e){report.verdict=/ERR_BLOCKED_BY_ADMINISTRATOR|ERR_ACCESS_DENIED/.test(String(e.message))?'ENV_BLOCKED':'FAIL';
    process.exitCode=1;console.error('R28 evidence verdict:',report.verdict,String(e.message).slice(0,180));}
  finally{const file=path.join(dir,'r28-longtext-real-chrome.json');
    await fs.writeFile(file,JSON.stringify(report,null,2)+'\n','utf8');
    await fs.rm(work,{recursive:true,force:true,maxRetries:3});
    console.log('R28 evidence:',file);}
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={MATRIX,STARTUP_BUDGET_MS,CDP_BUDGET_MS,SHADOW_RULE,fixture,baselineHtml,options};
