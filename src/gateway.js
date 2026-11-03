/* AI Memory Lifeboat v0.7.0 — bilingual first-task gateway, local UI only. MIT.
 * Does not claim complete English coverage of advanced results.
 * All sample results are derived from the existing synthetic demo parser.
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.AMLGateway=api;
})(typeof globalThis==='object'?globalThis:null,function(){'use strict';
  const host=typeof globalThis==='object'?globalThis:null;
  const translations=Object.freeze({
    'zh-Hant':Object.freeze({
      title:'先試一次，不必準備私人資料', language:'English', demoButton:'試用合成示範', demoTitle:'第一次使用？先看合成範例', description:'使用原創合成對話，在這台裝置體驗備份檢查。這不是你的帳戶，也不會證明任何真實備份完整。',
      stepOne:'① 點選「試用合成示範」，不必下載帳戶資料。',
      stepTwo:'② 檢查可讀對話與限制，試著找出範例內容。',
      stepThree:'③ 真正要檢查自己的備份時，請使用下方本機檔案選擇器並保留原始 ZIP。',
      honesty:'這份網頁的首次使用引導提供英文；進階體檢介面目前以繁體中文為主，並非完整英文版。',
      find:'搜尋合成示範中的 umbrella',jump:'查看詳細體檢（繁體中文）',
      success:n=>`已載入 ${n} 則原創合成對話。這不是你的帳戶資料，也不是完整備份認證。你可以搜尋 umbrella，或繼續閱讀繁體中文的詳細結果。`,
      missing:'示範尚未成功載入，沒有宣稱已檢查任何資料。'
    }),
    en:Object.freeze({
      title:'Try one task, with no personal data',language:'繁體中文',demoButton:'Try synthetic demo',demoTitle:'First time? Try fictional examples',
      description:'Explore a local backup inspection using fictional conversations. This is NOT your account and does not prove any real backup is complete.',
      stepOne:'① Press “Try synthetic demo” below. No account export is required.',
      stepTwo:'② Find a sample conversation and read what the inspection can—and cannot—verify.',
      stepThree:'③ To inspect your own official export, choose a local ZIP/JSON below and keep the original archive.',
      honesty:'English is supported for this first-task guide only. The advanced inspector interface remains primarily in Traditional Chinese; this is not a fully translated English UI.',
      find:'Find “umbrella” in sample',jump:'View detailed results (Traditional Chinese)',
      success:n=>`${n} fictional conversations loaded using the existing inspector. This is NOT an inspection of your account or proof of full backup. Try “umbrella” below, or explore the advanced results (in Traditional Chinese).`,
      missing:'The synthetic demo did not load; no inspection was claimed.'
    })
  });
  function validLanguage(code){return code==='en'?'en':'zh-Hant';}
  function describe(lang,count,loaded){const t=translations[validLanguage(lang)];return loaded?t.success(Math.max(0,Math.trunc(Number(count)||0))):t.missing;}
  function wire(doc){
    const by=id=>doc.getElementById(id);
    const panel=by('firstTaskGateway'), toggle=by('gatewayLanguage'), demo=by('tryDemo'), outcome=by('gatewayOutcome');
    if(!panel||!toggle||!demo||!outcome)return false;
    let language='zh-Hant',last=null;
    const nodes={title:by('gatewayTitle'),description:by('gatewayDescription'),stepOne:by('gatewayStepOne'),
      stepTwo:by('gatewayStepTwo'),stepThree:by('gatewayStepThree'),honesty:by('gatewayHonesty'),
      find:by('gatewayFindExample'),jump:by('gatewayJump'),outcome:by('gatewayOutcomeText')};
    function render(){
      const t=translations[language];panel.lang=language;toggle.textContent=t.language;
      toggle.setAttribute('aria-pressed',String(language==='en'));
      demo.textContent=t.demoButton;by('firstUseTitle').textContent=t.demoTitle;
      for(const key of ['title','description','stepOne','stepTwo','stepThree','honesty','find','jump'])nodes[key].textContent=t[key];
      if(last)nodes.outcome.textContent=describe(language,last.count,last.loaded);
    }
    toggle.addEventListener('click',()=>{language=language==='en'?'zh-Hant':'en';render();});
    // The existing app handler is registered first, and loads the sample synchronously.
    demo.addEventListener('click',()=>{
      const loaded=by('results')&&!by('results').hidden&&by('demoBanner')&&!by('demoBanner').hidden;
      let count=0;
      if(loaded){
        try{count=host.AMLCore.parseChatGPTExport(host.AMLDemo.getSnapshots().newer).audit.parsed_records;}
        catch(_){count=0;}
      }
      last={loaded:Boolean(loaded&&count>0),count};
      outcome.hidden=false;nodes.outcome.textContent=describe(language,count,last.loaded);
      nodes.find.disabled=!last.loaded;
    });
    nodes.find.addEventListener('click',()=>{
      if(!last?.loaded||by('results').hidden)return;
      const search=by('searchBox');search.value='umbrella';
      search.dispatchEvent(new host.Event('input',{bubbles:true}));
      search.scrollIntoView({block:'center',behavior:'auto'});
      search.focus({preventScroll:true});
    });
    function resetOutcome(){last=null;outcome.hidden=true;nodes.outcome.textContent='';}
    by('archiveFile').addEventListener('change',resetOutcome);
    by('clearBtn').addEventListener('click',resetOutcome);
    render();return true;
  }
  return Object.freeze({translations,describe,wire});
});
if(typeof document!=='undefined'&&typeof window!=='undefined')window.AMLGateway.wire(document);
