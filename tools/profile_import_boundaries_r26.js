/* R26 opt-in evidence: real Chrome file:// synthetic JSON / 32-shard ZIP / near-64MiB import. MIT. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const {pathToFileURL}=require('node:url');
const {parseArgs}=require('node:util');
const {setTimeout:delay}=require('node:timers/promises');
const {writeFixture}=require('./fixtures_r26');
const {stats}=require('./profile_offline_performance');
const URL_TO_TEST=pathToFileURL(path.resolve(__dirname,'../dist/AI_Memory_Lifeboat_Offline.html')).href;
const STARTUP_BUDGET_MS=25000;
const VIEWPORTS=[{name:'desktop',width:1280,height:900,mobile:false},{name:'mobile-emulated',width:390,height:844,mobile:true}];
const EXPECTED={
  'json-long':{conversations:1,messages:240,source:'conversations.json',negative:'json-over-limit'},
  'zip-32':{conversations:800,messages:6,source:'chatgpt-synthetic.zip',negative:'zip-33'},
  'zip-near-limit':{conversations:1,messages:40,source:'chatgpt-synthetic.zip',negative:'json-over-limit'}
};
function args(argv){
  const v=parseArgs({args:argv,options:{kind:{type:'string',default:'json-long'},runs:{type:'string',default:'3'},warmup:{type:'string',default:'1'},chrome:{type:'string'},'output-dir':{type:'string'},help:{type:'boolean'}}}).values;
  if(!EXPECTED[v.kind])throw Error('INVALID_R26_KIND');
  for(const key of ['runs','warmup']){if(!/^(0|[1-9][0-9]*)$/.test(v[key]))throw Error('INVALID_R26_'+key);v[key]=Number(v[key]);}
  if(v.runs<3||v.runs>8||v.warmup>2)throw Error('INVALID_R26_ITERATION_BOUNDS');
  return v;
}
async function until(fn,label,deadline=30000){const start=Date.now();let last='';while(Date.now()-start<deadline){try{const x=await fn();if(x)return x;}catch(e){last=String(e.message).slice(0,100);}await delay(70);}throw Error(`TIMEOUT_${label}${last?'_LAST_'+last:''}`);}
async function cdp(url){
  const ws=new WebSocket(url),pending=new Map(),listeners=new Map();let nextId=0;
  await Promise.race([once(ws,'open'),once(ws,'error').then(()=>{throw Error('CDP_SOCKET_ERROR')}),delay(7000).then(()=>{throw Error('CDP_CONNECT_TIMEOUT')})]);
  ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(m.id){pending.get(m.id)?.(m);return;}for(const handler of listeners.get(m.method)||[])handler(m.params||{});});
  ws.addEventListener('close',()=>{for(const cb of pending.values())cb({error:{message:'CDP_CLOSED'}})});
  return {on:(event,fn)=>listeners.set(event,[...(listeners.get(event)||[]),fn]),
    send:(method,params={})=>new Promise((resolve,reject)=>{const id=++nextId;let finished=false;
      const timer=setTimeout(()=>{if(!finished){finished=true;pending.delete(id);reject(Error('CDP_METHOD_TIMEOUT_'+method));}},120000);
      pending.set(id,m=>{if(finished)return;finished=true;clearTimeout(timer);pending.delete(id);
        m.error?reject(Error('CDP_ERROR_'+method+'_'+String(m.error.message).slice(0,100))):resolve(m.result||{});});
      try{ws.send(JSON.stringify({id,method,params}));}catch(e){clearTimeout(timer);pending.delete(id);reject(e);}
    }),close:()=>ws.close()};
}
function evaluated(page,fn,...vals){return page.send('Runtime.evaluate',{expression:`(${fn})(...${JSON.stringify(vals)})`,awaitPromise:true,returnByValue:true}).then(x=>{if(x.exceptionDetails)throw Error('PAGE_EXCEPTION_'+String(x.exceptionDetails.text).slice(0,120));return x.result?.value;});}
function byteStats(data){const s=stats(data);return {n:s.n,medianBytes:s.medianMs,
  p95NearestRankBytes:s.p95NearestRankMs,minBytes:s.minMs,maxBytes:s.maxMs};}
async function heapSample(page){
  // Performance.getMetrics is a non-GC-forcing sample. Runtime.getHeapUsage stalled
  // after rendering 240 long-text messages in a real Chrome research run.
  const {metrics}=await page.send('Performance.getMetrics');
  const m=new Map((metrics||[]).map(x=>[x.name,x.value]));
  const used=m.get('JSHeapUsedSize'),total=m.get('JSHeapTotalSize');
  if(!Number.isFinite(used)||!Number.isFinite(total)||used<0||total<0)
    throw Error('R26_PERFORMANCE_HEAP_METRIC_UNAVAILABLE');
  return {usedBytes:used,totalBytes:total};
}
async function browserRun(config,report,fixtures){
  const userDir=await fs.mkdtemp(path.join(os.tmpdir(),'aml-r26-browser-'));
  const stderr={tail:''};let spawnError=null,br,page;
  const chrome=config.chrome||process.env.CHROME_BIN||'google-chrome';
  const proc=spawn(chrome,['--headless','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking',
    '--disable-extensions','--disable-sync','--no-first-run','--no-default-browser-check',
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost',`--user-data-dir=${userDir}`,
    '--remote-debugging-port=0','about:blank'],{stdio:['ignore','ignore','pipe']});
  proc.on('error',e=>{spawnError=e;});proc.stderr.setEncoding('utf8');
  proc.stderr.on('data',s=>{stderr.tail=(stderr.tail+s).slice(-2500);});
  const since=Date.now(),startup=report.startup={state:'WAITING',budgetMs:STARTUP_BUDGET_MS,elapsedMs:null,polls:0,relaunches:0,browser:path.basename(chrome)};
  try{
    let conn;
    try{conn=await until(async()=>{startup.polls++;if(spawnError||proc.exitCode!==null)return{failed:true};
      const lines=(await fs.readFile(path.join(userDir,'DevToolsActivePort'),'utf8')).trim().split('\n');
      return lines.length===2&&lines[0]&&lines[1]?{port:lines[0],socket:lines[1]}:null;
    },'CHROME_STARTUP',STARTUP_BUDGET_MS);}catch(e){startup.state=spawnError||proc.exitCode!==null?'PROCESS_EXIT_OR_START_ERROR':'ENDPOINT_TIMEOUT';throw e;}
    startup.state=conn.failed?'PROCESS_EXIT_OR_START_ERROR':'ENDPOINT_READY';startup.elapsedMs=Date.now()-since;
    if(conn.failed)throw Error('CHROME_STARTUP_PROCESS_EXIT_OR_START_ERROR');
    const host=`127.0.0.1:${conn.port}`;br=await cdp(`ws://${host}${conn.socket}`);
    startup.state='CDP_CONNECTED';startup.elapsedMs=Date.now()-since;
    report.environment.chrome=(await br.send('Browser.getVersion')).product;
    const targets=await (await fetch(`http://${host}/json/list`,{signal:AbortSignal.timeout(7000)})).json();
    const target=targets.find(t=>t.type==='page');if(!target)throw Error('CHROME_PAGE_NOT_FOUND');
    page=await cdp(target.webSocketDebuggerUrl);
    const loads=new Set(),net=[],errors=[];
    page.on('Page.frameNavigated',p=>{if(p.frame?.loaderId)loads.add(p.frame.loaderId);});
    const allowed=url=>url===URL_TO_TEST||url==='about:blank'||url.startsWith('blob:')||url.startsWith('data:');
    page.on('Network.requestWillBeSent',p=>{if(!allowed(p.request.url))net.push('OUTBOUND_REQUEST');});
    page.on('Network.webSocketCreated',p=>{if(!allowed(p.url))net.push('OUTBOUND_SOCKET');});
    page.on('Fetch.requestPaused',p=>page.send(allowed(p.request.url)?'Fetch.continueRequest':'Fetch.failRequest',
      allowed(p.request.url)?{requestId:p.requestId}:{requestId:p.requestId,errorReason:'BlockedByClient'}).catch(()=>errors.push('FETCH_HANDLER_ERROR')));
    page.on('Runtime.exceptionThrown',()=>errors.push('RUNTIME_EXCEPTION'));
    page.on('Runtime.consoleAPICalled',p=>{if(['error','assert'].includes(p.type))errors.push('CONSOLE_ERROR');});
    for(const m of ['Page.enable','Runtime.enable','DOM.enable','Network.enable','Fetch.enable','Performance.enable'])await page.send(m);
    for(const v of VIEWPORTS){
      await page.send('Emulation.setDeviceMetricsOverride',{width:v.width,height:v.height,mobile:v.mobile,deviceScaleFactor:1});
      await page.send('Emulation.setTouchEmulationEnabled',{enabled:v.mobile});
      const rows=[];
      for(let i=0;i<config.warmup+config.runs;i++){
        const mark=step=>{report.progress={kind:config.kind,viewport:v.name,iteration:i+1,step};
          console.log('R26_STAGE',config.kind,v.name,i+1,step);};
        mark('NAVIGATE');
        loads.clear();const nav=await page.send('Page.navigate',{url:URL_TO_TEST});
        if(nav.errorText){
          if(/ERR_BLOCKED_BY_ADMINISTRATOR|ERR_ACCESS_DENIED/.test(nav.errorText))throw Error('ENV_BLOCKED_FILE_NAVIGATION');
          throw Error('R26_FILE_NAVIGATION_'+String(nav.errorText).replace(/[^A-Za-z0-9_:-]/g,'').slice(0,90));
        }
        if(!nav.loaderId)throw Error('R26_NEW_DOCUMENT_INVALID');
        await until(async()=>loads.has(nav.loaderId)&&await evaluated(page,()=>document.readyState==='complete'&&!!document.querySelector('#archiveFile')),'FRESH_DOCUMENT',15000);
        await evaluated(page,()=>{
          const inp=document.querySelector('#archiveFile'),status=document.querySelector('#status');
          window.__r26={state:'WAITING',startMs:null,readyMs:null,paintMs:null,longTasks:[],observerSupported:false};
          if(typeof PerformanceObserver==='function'&&PerformanceObserver.supportedEntryTypes?.includes('longtask')){
            window.__r26.observerSupported=true;
            new PerformanceObserver(list=>{for(const t of list.getEntries())window.__r26.longTasks.push(t.duration);}).observe({type:'longtask',buffered:true});
          }
          inp.addEventListener('change',()=>{window.__r26.state='READING';window.__r26.startMs=performance.now();},true);
          new MutationObserver(()=>{
            if(window.__r26.state!=='READING')return;
            if(status.classList.contains('ok')||status.classList.contains('error')){
              window.__r26.readyMs=performance.now();window.__r26.state=status.classList.contains('ok')?'PASS':'REJECT';
              requestAnimationFrame(()=>requestAnimationFrame(()=>{window.__r26.paintMs=performance.now();}));
            }
          }).observe(status,{attributes:true,attributeFilter:['class']});
        });
        mark('HEAP_BEFORE_IMPORT');
        const before=await heapSample(page);
        const doc=await page.send('DOM.getDocument');
        const input=await page.send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'#archiveFile'});
        if(!input.nodeId)throw Error('R26_FILE_INPUT_NOT_FOUND');
        mark('SEND_FILE_TO_CHROME');
        await page.send('DOM.setFileInputFiles',{files:[fixtures.positive.path],nodeId:input.nodeId});
        mark('WAITING_FOR_IMPORT_STATUS');
        const ready=await until(async()=>{const result=await evaluated(page,()=>{
          const r=window.__r26;return {state:r.state,done:r.paintMs!==null,elapsedMs:r.readyMs-r.startMs,
            paintedMs:r.paintMs-r.startMs,longTasks:r.longTasks,observerSupported:r.observerSupported};
        });return result.done?result:null;},'IMPORT_UI',90000);
        if(ready.state!=='PASS')throw Error('R26_SYNTHETIC_IMPORT_REJECTED');
        if(!Number.isFinite(ready.elapsedMs)||ready.elapsedMs<0||ready.paintedMs<ready.elapsedMs)throw Error('R26_TIMING_INVALID');
        const examined=await evaluated(page,expected=>{
          const count=document.querySelectorAll('#conversationList button').length;
          const info=document.querySelector('#resultCount').textContent;
          return {count,found:info.includes(String(expected)),status:document.querySelector('#status').classList.contains('ok')};
        },EXPECTED[config.kind].conversations);
        assert.equal(examined.status,true);assert.equal(examined.found,true);
        assert.equal(examined.count,Math.min(200,EXPECTED[config.kind].conversations));
        mark('HEAP_AFTER_IMPORT');
        const afterImport=await heapSample(page);
        mark('SELECT_FIRST_CONVERSATION');
        const selected=await evaluated(page,expected=>{
          const b=document.querySelector('#conversationList button');b.click();
          return {messages:document.querySelectorAll('#conversationDetail .message').length,
            selected:document.querySelector('#conversationList [aria-current="true"]')!==null,
            buttonEnabled:!document.querySelector('#downloadHtml').disabled};
        },EXPECTED[config.kind].messages);
        assert.equal(selected.messages,EXPECTED[config.kind].messages);assert.equal(selected.selected,true);assert.equal(selected.buttonEnabled,true);
        mark('HEAP_AFTER_SELECTION');
        const afterSelection=await heapSample(page);
        mark('VERIFY_RESET_AND_NEGATIVE');
        const negative=i===config.warmup;let negativeOk=null;
        if(negative){
          const pending=await evaluated(page,()=>{document.querySelector('#downloadHtml').click();return document.querySelector('#htmlExportConfirm').open;});
          if(!pending)throw Error('R26_PRIVATE_CONSENT_NOT_OPEN');
          await page.send('DOM.setFileInputFiles',{files:[fixtures.negative.path],nodeId:input.nodeId});
          negativeOk=await until(()=>evaluated(page,()=>{
            const status=document.querySelector('#status');
            if(!status.classList.contains('error'))return null;
            return {oldButtons:document.querySelectorAll('#conversationList button').length,
              oldMessages:document.querySelectorAll('#conversationDetail .message').length,
              hidden:document.querySelector('#results').hidden,
              downloadDisabled:document.querySelector('#downloadHtml').disabled,
              modalOpen:document.querySelector('#htmlExportConfirm').open};
          }),'NEGATIVE_FAIL_CLOSED',30000);
          if(negativeOk.oldButtons!==0||negativeOk.oldMessages!==0||!negativeOk.hidden||!negativeOk.downloadDisabled||negativeOk.modalOpen)
            throw Error('R26_NEGATIVE_SOURCE_DID_NOT_REVOKE_SENSITIVE_STATE');
        }else{
          await evaluated(page,()=>document.querySelector('#clearBtn').click());
          const clean=await evaluated(page,()=>({hidden:document.querySelector('#results').hidden,
            oldButtons:document.querySelectorAll('#conversationList button').length,
            oldMessages:document.querySelectorAll('#conversationDetail .message').length,
            downloadDisabled:document.querySelector('#downloadHtml').disabled}));
          if(!clean.hidden||clean.oldButtons!==0||clean.oldMessages!==0||!clean.downloadDisabled)throw Error('R26_CLEAR_NOT_PRIVATE');
        }
        mark('HEAP_AFTER_CLEAR');
        const afterClear=await heapSample(page);
        if(net.length||errors.length)throw Error('R26_EXTERNAL_REQUEST_OR_RUNTIME_ERROR');
        const metric={iteration:i+1,warmup:i<config.warmup,measured:i>=config.warmup,readyMs:ready.elapsedMs,
          toPaintMs:ready.paintedMs,longtaskSupported:ready.observerSupported,
          longTaskCount:ready.observerSupported?ready.longTasks.length:null,
          longTaskMaxMs:ready.observerSupported?Math.max(0,...ready.longTasks):null,
          longTaskTotalMs:ready.observerSupported?ready.longTasks.reduce((s,d)=>s+d,0):null,
          memoryUsedBytes:{before:before.usedBytes,afterImport:afterImport.usedBytes,
            afterSelection:afterSelection.usedBytes,afterClear:afterClear.usedBytes},
          maxSampledHeapUsedBytes:Math.max(before.usedBytes,afterImport.usedBytes,afterSelection.usedBytes,afterClear.usedBytes),
          negativeValidated:!!negativeOk};
        rows.push(metric);
        mark('ITERATION_PASS');
      }
      const measured=rows.filter(x=>x.measured);
      report.viewports.push({name:v.name,mobileEmulated:v.mobile,rows,
        summary:{readyMs:stats(measured.map(r=>r.readyMs)),toPaintMs:stats(measured.map(r=>r.toPaintMs)),
          maxSampledHeapUsedBytes:byteStats(measured.map(r=>r.maxSampledHeapUsedBytes))},
        negativeRefutationPassed:rows.some(x=>x.negativeValidated),
        longTaskAvailable:measured.every(x=>x.longtaskSupported)});
    }
    report.outboundRequestCount=net.length;report.runtimeErrorCount=errors.length;
  }catch(e){report.error={code:'R26_VALIDATION_FAILED',reason:String(e.message).slice(0,160),
    phase:startup.state,chromeExitCode:proc.exitCode,chromeSpawnError:spawnError?.code||null,chromeStderrTail:stderr.tail.slice(-1100)};throw e;
  }finally{
    page?.close();br?.close();
    if(proc.pid&&proc.exitCode===null&&proc.signalCode===null){const ended=once(proc,'exit');proc.kill();await Promise.race([ended,delay(2000)]);
      if(proc.exitCode===null&&proc.signalCode===null){proc.kill('SIGKILL');await ended;}}
    await fs.rm(userDir,{recursive:true,force:true,maxRetries:3});
  }
}
async function main(){
  const c=args(process.argv.slice(2));if(c.help){console.log('--kind json-long|zip-32|zip-near-limit --chrome PATH --output-dir DIR --runs 3 --warmup 1');return;}
  const out=path.resolve(c['output-dir']||path.join(os.tmpdir(),'aml-r26-evidence'));
  await fs.mkdir(out,{recursive:true});
  const temp=await fs.mkdtemp(path.join(os.tmpdir(),'aml-r26-fixtures-'));
  const report={schema:'aml.r26.boundary-evidence.v1',mode:'SYNTHETIC_ONLY_RESEARCH_NOT_PRODUCT_RELEASE',product:'v'+require('../package.json').version,kind:c.kind,
    definition:'readyMs is capture-phase input change to .ok status; toPaintMs includes two animation frames',
    resources:'Performance.getMetrics JS heap sampled at four checkpoints, not true peak heap/RSS; long tasks count only if supported',
    environment:{node:process.version,platform:process.platform,cpu:os.cpus()[0]?.model,logicalCores:os.cpus().length,totalSystemRamBytes:os.totalmem()},
    configuration:{runs:c.runs,warmup:c.warmup,newDocumentPerTrial:true,chromeStartBudgetMs:STARTUP_BUDGET_MS},
    viewports:[],outboundRequestCount:null,runtimeErrorCount:null};
  try{
    const fx=await writeFixture(temp,c.kind),negative=await writeFixture(temp,EXPECTED[c.kind].negative);
    report.fixture={...fx,path:undefined};report.negativeFixture={...negative,path:undefined};
    await browserRun(c,report,{positive:fx,negative});
    report.verdict='PASS';
  }catch(e){process.exitCode=1;report.verdict=String(e.message).startsWith('ENV_BLOCKED_')?'ENV_BLOCKED':'FAIL';
    if(!report.error)report.error={code:'R26_FIXTURE_OR_RUNNER_FAILED',reason:String(e.message).slice(0,160)};
    console.error('R26 evidence failure:',report.error.code,report.error.reason);
  }finally{
    await fs.writeFile(path.join(out,`r26-${c.kind}-synthetic-evidence.json`),JSON.stringify(report,null,2)+'\n','utf8');
    await fs.rm(temp,{recursive:true,force:true,maxRetries:3});
    console.log('R26 evidence:',path.join(out,`r26-${c.kind}-synthetic-evidence.json`));
  }
}
if(require.main===module)main().catch(e=>{console.error('R26 runner error:',e.message);process.exitCode=1;});
module.exports={args,EXPECTED,STARTUP_BUDGET_MS,byteStats};
