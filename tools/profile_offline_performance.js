/* R23 opt-in, synthetic-only, real-Chrome offline UX profiling. No application code or telemetry. MIT. */
'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { pathToFileURL } = require('node:url');
const { parseArgs } = require('node:util');
const { setTimeout: delay } = require('node:timers/promises');
const target = pathToFileURL(path.resolve(__dirname, '../dist/AI_Memory_Lifeboat_Offline.html')).href;
const viewports = [{name:'desktop',width:1280,height:900,mobile:false},{name:'mobile-emulated',width:390,height:844,mobile:true}];

function fixture(messages=1402, fillers=200) {
  if(!Number.isSafeInteger(messages)||messages<1402||messages>10000||
     !Number.isSafeInteger(fillers)||fillers<200||fillers>3000)throw Error('INVALID_SYNTHETIC_FIXTURE_SIZE');
  const node=(id,number,previous,last)=>({
    id, parent:previous, children:last?[]:[`m${number+1}`],
    message:{author:{role:number%2?'user':'assistant'},content:{content_type:'text',parts:[`Synthetic only · message ${number}${number===1110?' R23_SEARCH_HIT':''}`]}}
  });
  const mapping={};
  for(let i=1;i<=messages;i++)mapping[`m${i}`]=node(`m${i}`,i,i===1?null:`m${i-1}`,i===messages);
  const original=JSON.stringify([{id:'synthetic-primary',title:'Synthetic primary',current_node:`m${messages}`,mapping},
    ...Array.from({length:fillers},(_,i)=>({id:`synthetic-filler-${i}`,title:`Synthetic filler ${i+1}`,current_node:'m1',
      mapping:{m1:node('m1',1,null,true)}}))]);
  const replacement=JSON.stringify([{id:'synthetic-primary',title:'Synthetic replacement',current_node:'m1',
    mapping:{m1:node('m1',1,null,true)}}]);
  return {original,replacement, messages,fillers,sha256:crypto.createHash('sha256').update(original).digest('hex'),bytes:Buffer.byteLength(original)};
}
function stats(samples){
  assert.ok(samples.length>0&&samples.every(n=>Number.isFinite(n)&&n>=0));
  const sorted=[...samples].sort((a,b)=>a-b);
  const rank=p=>sorted[Math.max(0,Math.ceil(sorted.length*p)-1)];
  return {n:sorted.length,medianMs:Number((sorted.length%2?sorted[(sorted.length-1)/2]:
    (sorted[sorted.length/2-1]+sorted[sorted.length/2])/2).toFixed(3)),
    p95NearestRankMs:Number(rank(.95).toFixed(3)),minMs:Number(sorted[0].toFixed(3)),
    maxMs:Number(sorted.at(-1).toFixed(3))};
}
function options(argv){
  const { values }=parseArgs({args:argv,options:{chrome:{type:'string'},'output-dir':{type:'string'},
    runs:{type:'string',default:'5'},warmup:{type:'string',default:'1'},messages:{type:'string',default:'1402'},
    fillers:{type:'string',default:'200'},help:{type:'boolean'}}});
  const out={...values};
  for(const key of ['runs','warmup','messages','fillers']){
    if(!/^(0|[1-9][0-9]*)$/.test(out[key]))throw Error('INVALID_OPTION_'+key);
    out[key]=Number(out[key]);
  }
  if(out.runs<3||out.runs>15||out.warmup>3)throw Error('UNSUPPORTED_REPEAT_COUNT');
  return out;
}
async function until(check,label,ms=12000){
  const start=Date.now();let last;
  while(Date.now()-start<ms){try{const v=await check();if(v)return v;}catch(e){last=e;}
    await delay(60);}
  throw Error(`TIMEOUT_${label}${last?'_LAST_'+String(last?.message).slice(0,90):''}`);
}
async function cdp(url){
  const ws=new WebSocket(url);const pending=new Map(), handlers=new Map();let id=0;
  await Promise.race([once(ws,'open'),once(ws,'error').then(()=>{throw Error('CDP_WEBSOCKET_ERROR');}),
    once(ws,'close').then(()=>{throw Error('CDP_WEBSOCKET_CLOSED');}),delay(7000).then(()=>{throw Error('CDP_CONNECT_TIMEOUT');})]);
  ws.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.id){const done=pending.get(m.id);if(done)done(m);}
    else for(const fn of handlers.get(m.method)||[])fn(m.params||{});});
  ws.addEventListener('close',()=>{for(const done of pending.values())done({error:{message:'CDP_CLOSED'}});});
  return {on:(name,fn)=>handlers.set(name,[...(handlers.get(name)||[]),fn]),
    send:(method,params={})=>new Promise((resolve,reject)=>{const key=++id;
      const timer=setTimeout(()=>{pending.delete(key);reject(Error('CDP_TIMEOUT_'+method));},90000);
      pending.set(key,m=>{clearTimeout(timer);pending.delete(key);m.error?reject(Error(`${method}: ${m.error.message}`)):resolve(m.result||{});});
      ws.send(JSON.stringify({id:key,method,params}));}),close:()=>ws.close()};
}
async function runBrowser(chrome, config, report){
  await fs.access(path.resolve(__dirname,'../dist/AI_Memory_Lifeboat_Offline.html'));
  const profile=await fs.mkdtemp(path.join(os.tmpdir(),'aml-r23-profile-'));
  const proc=spawn(chrome,[
    '--headless','--disable-background-networking','--disable-dev-shm-usage','--disable-extensions',
    '--disable-sync','--no-first-run','--no-default-browser-check','--no-sandbox',
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost',`--user-data-dir=${profile}`,
    '--remote-debugging-port=0','about:blank'],{stdio:['ignore','ignore','pipe']});
  let procError,stderr='',browser,page;
  proc.on('error',err=>{procError=err;});
  proc.stderr.setEncoding('utf8');proc.stderr.on('data',s=>{stderr=(stderr+s).slice(-3000);});
  try{
    const connection=await until(async()=>{
      if(procError||proc.exitCode!==null)throw Error(`CHROME_EXIT_${proc.exitCode??procError?.code}`);
      const s=(await fs.readFile(path.join(profile,'DevToolsActivePort'),'utf8')).trim().split('\n');
      return s.length===2?{port:s[0],path:s[1]}:null;
    },'CHROME_DEVTOOLS',15000);
    const host=`127.0.0.1:${connection.port}`;
    browser=await cdp(`ws://${host}${connection.path}`);
    const version=await browser.send('Browser.getVersion');report.environment.browser=version.product;
    const targets=await (await fetch(`http://${host}/json/list`,{signal:AbortSignal.timeout(7000)})).json();
    const inspect=targets.find(x=>x.type==='page');if(!inspect)throw Error('NO_PAGE');
    page=await cdp(inspect.webSocketDebuggerUrl);
    const outbound=[],errors=[];const allowed=url=>url===target||url==='about:blank'||url.startsWith('blob:')||url.startsWith('data:');
    page.on('Network.requestWillBeSent',x=>{if(!allowed(x.request.url))outbound.push('OUTBOUND_BLOCKED');});
    page.on('Network.webSocketCreated',x=>{if(!allowed(x.url))outbound.push('OUTBOUND_SOCKET');});
    page.on('Fetch.requestPaused',x=>page.send(allowed(x.request.url)?'Fetch.continueRequest':'Fetch.failRequest',
      allowed(x.request.url)?{requestId:x.requestId}:{requestId:x.requestId,errorReason:'BlockedByClient'}).catch(()=>errors.push('FETCH_HANDLER_ERROR')));
    page.on('Runtime.exceptionThrown',()=>errors.push('JS_RUNTIME_EXCEPTION'));
    page.on('Runtime.consoleAPICalled',x=>{if(['error','assert'].includes(x.type))errors.push('JS_CONSOLE_ERROR');});
    for(const method of ['Page.enable','Network.enable','Fetch.enable','Runtime.enable'])await page.send(method);
    const evaluate=async(fn,...args)=>{
      const r=await page.send('Runtime.evaluate',{expression:`(${fn})(...${JSON.stringify(args)})`,awaitPromise:true,returnByValue:true});
      if(r.exceptionDetails)throw Error('PAGE_EVALUATION_ERROR_'+String(r.exceptionDetails.text).slice(0,90));
      return r.result.value;
    };
    const fx=fixture(config.messages,config.fillers);report.fixture={messages:fx.messages,fillers:fx.fillers,
      bytes:fx.bytes,sha256:fx.sha256,source:'generated-from-checked-in-runner'};
    for(const vp of viewports){
      await page.send('Emulation.setDeviceMetricsOverride',{width:vp.width,height:vp.height,mobile:vp.mobile,deviceScaleFactor:1});
      await page.send('Emulation.setTouchEmulationEnabled',{enabled:vp.mobile});
      const rows=[];
      for(let i=0;i<config.warmup+config.runs;i++){
        const {errorText}=await page.send('Page.navigate',{url:target});if(errorText)throw Error('FILE_URL_NAVIGATION_'+errorText);
        await until(()=>evaluate(()=>document.readyState==='complete'&&Boolean(document.querySelector('#archiveFile'))),
          'OFFLINE_PAGE',12000);
        const result=await evaluate(async(original,replacement,messages,fillers)=>{
          const frame=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
          const $=id=>document.getElementById(id);
          const check=(ok,label)=>{if(!ok)throw Error('SYNTHETIC_ASSERT_'+label);};
          const upload=async(json)=>{
            const input=$('archiveFile'),dt=new DataTransfer();
            dt.items.add(new File([json],'conversations.json',{type:'application/json'}));
            input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
            const deadline=performance.now()+20000;
            while(!$('status').classList.contains('ok')){
              if($('status').classList.contains('error')||performance.now()>deadline)throw Error('SYNTHETIC_IMPORT_ERROR');
              await new Promise(r=>setTimeout(r,15));
            }
          };
          const measure=async(action,fn)=>{
            const from=performance.now();await fn();await frame();
            const ms=performance.now()-from;
            check(Number.isFinite(ms)&&ms>=0,'TIMER');return ms;
          };
          const results={};
          results.importToReadyMs=await measure('import',async()=>{
            await upload(original);check($('conversationList').querySelectorAll('button').length===Math.min(fillers+1,200),'IMPORTED_LIST');
            check($('resultCount').textContent.includes(String(fillers+1)),'IMPORTED_COUNT');
          });
          results.selectFirstWindowMs=await measure('select',()=>{
            const btn=$('conversationList').querySelector('button');check(Boolean(btn),'FIRST_CONVERSATION');btn.click();
            check($('conversationDetail').querySelectorAll('.message').length===700,'READER_700');
          });
          results.findRetainedMessageMs=await measure('find',()=>{
            $('readerQuery').value='R23_SEARCH_HIT';$('readerQuery').dispatchEvent(new Event('input',{bubbles:true}));
            $('readerFind').click();
            check($('readerWindowInfo').textContent.includes('701'), 'SEARCH_TARGET_WINDOW');
            check($('conversationDetail').querySelector('[aria-label="第 1110 則訊息"]')!==null,'SEARCH_1110');
          });
          results.crossWindowJumpMs=await measure('jump',()=>{
            $('readerJumpInput').value=String(messages);$('readerJumpInput').dispatchEvent(new Event('input',{bubbles:true}));
            $('readerJumpGo').click();
            check($('conversationDetail').querySelectorAll('.message').length===messages%700||
              (messages%700===0&&$('conversationDetail').querySelectorAll('.message').length===700),'JUMP_BOUND');
            check($('conversationDetail').querySelector(`[aria-label="第 ${messages} 則訊息"]`)!==null,'JUMP_LAST');
          });
          results.replaceSourceMs=await measure('replace',async()=>{
            await upload(replacement);
            check($('conversationDetail').querySelectorAll('.message').length===0,'REPLACEMENT_SCRUB');
            check($('downloadHtml').disabled,'REPLACEMENT_CONSENT');
            check($('conversationList').querySelectorAll('button').length===1,'REPLACEMENT_LIST');
          });
          await upload(original);
          results.listQueryMs=await measure('list-search',()=>{
            $('searchBox').value='Synthetic filler';$('searchBox').dispatchEvent(new Event('input',{bubbles:true}));
            check($('resultCount').textContent.includes(String(fillers)),'LIST_SEARCH_RESULT');
            check($('conversationList').querySelectorAll('button').length===Math.min(fillers,200),'LIST_SEARCH_BOUND');
          });
          results.clearMs=await measure('clear',()=>{
            $('clearBtn').click();
            check($('results').hidden,'CLEAR_RESULTS');
            check($('conversationDetail').querySelectorAll('.message').length===0,'CLEAR_MESSAGE_DOM');
            check($('conversationList').querySelectorAll('button').length===0,'CLEAR_LIST_DOM');
            check($('downloadHtml').disabled,'CLEAR_SENSITIVE_EXPORT');
          });
          return {timings:results,visibleMessageNodes:$('conversationDetail').querySelectorAll('.message').length,
            selectedAfterClear:Boolean($('conversationList').querySelector('[aria-current="true"]'))};
        },fx.original,fx.replacement,fx.messages,fx.fillers);
        if(!result||result.visibleMessageNodes!==0||result.selectedAfterClear)throw Error('SYNTHETIC_CLEAR_ASSERT');
        const heap=await page.send('Runtime.getHeapUsage').catch(()=>null);
        rows.push({iteration:i+1,warmup:i<config.warmup,measured:i>=config.warmup,
          timingsMs:result.timings,heapUsedAfterClearBytes:heap?.usedSize??null,
          domNodesAfterClear:result.visibleMessageNodes});
        if(errors.length||outbound.length)throw Error('PRIVACY_OR_RUNTIME_ERROR');
      }
      const measured=rows.filter(x=>x.measured);
      const aggregations=Object.fromEntries(Object.keys(measured[0].timingsMs).map(k=>[k,stats(measured.map(x=>x.timingsMs[k]))]));
      report.viewports.push({viewport:vp.name,emulated:vp.mobile,dimensions:{width:vp.width,height:vp.height},rows,summary:aggregations});
    }
    report.networkRequestsBlocked=outbound.length;report.javascriptErrors=errors.length;
  }catch(err){report.error={code:'BROWSER_OR_SYNTHETIC_EVIDENCE_FAILED',detail:String(err.message).slice(0,220),
    chromeStderrTail:stderr.slice(-1200)};throw err;
  }finally{
    page?.close();browser?.close();
    if(proc.pid&&proc.exitCode===null&&proc.signalCode===null){
      const end=once(proc,'exit');proc.kill();await Promise.race([end,delay(2000)]);
      if(proc.exitCode===null&&proc.signalCode===null){proc.kill('SIGKILL');await end;}
    }
    await fs.rm(profile,{recursive:true,force:true,maxRetries:3});
  }
}
async function main(){
  const args=options(process.argv.slice(2));if(args.help){console.log('node tools/profile_offline_performance.js --chrome PATH --output-dir DIR [--runs 5] [--warmup 1]');return;}
  const out=path.resolve(args['output-dir']||path.join(os.tmpdir(),'aml-r23-performance'));
  await fs.mkdir(out,{recursive:true});
  const report={schema:'aml.synthetic-performance.v1',mode:'research-only',productVersion:'0.11.1',
    instructions:'No release, optimization claim or human adoption from CI timings; compare only same fixture/browser/hardware.',
    environment:{node:process.version,platform:process.platform,arch:process.arch,
      logicalCores:os.cpus().length,cpuModel:os.cpus()[0]?.model,totalSystemMemoryBytes:os.totalmem()},
    configuration:{measuredRuns:args.runs,warmupRuns:args.warmup,documentReloadEachRun:true,
      coldDefinition:'new document navigation; Chrome process reused',
      metricDefinition:'performance.now user action through DOM-ready and two requestAnimationFrames; no network timings',
      tailDefinition:'nearest-rank p95; with five runs p95 equals largest sample',
      heapDefinition:'CDP sampled JS heap used after clearing, not peak and not process RSS'},viewports:[]};
  try{await runBrowser(args.chrome||process.env.CHROME_BIN||'google-chrome',args,report);}
  catch(e){process.exitCode=1;console.error('Profile failed:',String(e.message).slice(0,220));}
  const reportPath=path.join(out,'r23-synthetic-performance.json');
  await fs.writeFile(reportPath,JSON.stringify(report,null,2)+'\n','utf8');
  console.log('Synthetic research evidence written:',reportPath);
}
if(require.main===module)main().catch(err=>{console.error(err.message);process.exitCode=1;});
module.exports={fixture,stats,options};
