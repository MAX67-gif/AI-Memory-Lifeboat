/* AI Memory Lifeboat v0.8.0 — user-triggered browser application only. MIT. */
(function(){'use strict';
  const $=id=>document.getElementById(id);
  const e={file:$('archiveFile'),status:$('status'),clear:$('clearBtn'),results:$('results'),metrics:$('metrics'),
    warnings:$('warningList'),warningCount:$('warningCount'),list:$('conversationList'),detail:$('conversationDetail'),
    search:$('searchBox'),resultCount:$('resultCount'),audit:$('downloadAudit'),html:$('downloadHtml'),
    olderFile:$('olderFile'),olderStatus:$('olderStatus'),comparePanel:$('comparePanel'),
    compareCounts:$('compareCounts'),compareList:$('compareList'),compareDownload:$('downloadComparison'),
    archiveAssessment:$('archiveAssessment'),healthSummary:$('healthSummary'),healthCards:$('healthCards'),
    downloadHealth:$('downloadHealth'),verifyAttachments:$('verifyAttachments'),attachmentVerifyStatus:$('attachmentVerifyStatus'),
    tryDemo:$('tryDemo'),demoBanner:$('demoBanner'),pilotPanel:$('pilotPanel'),pilotEase:$('pilotEase'),
    pilotClarity:$('pilotClarity'),pilotReuse:$('pilotReuse'),pilotTask:$('pilotTask'),pilotScope:$('pilotScope'),
    downloadPilot:$('downloadPilot'),pilotStatus:$('pilotStatus'),downloadFirstResult:$('downloadFirstResult')};
  const core=window.AMLCore, zip=window.AMLZip;
  let current=null, older=null, compared=null, selected=null, generation=0, comparisonGeneration=0;
  let currentFile=null, matchedAttachmentPaths=[], byteReport=null, healthReport=null;
  let demoActive=false;
  const MAX_JSON=64*1024*1024;
  const comparisonLabels={
    ONLY_IN_NEW_EXPORT:'只在新版匯出中出現',
    NOT_IN_NEW_EXPORT:'新版匯出沒有此紀錄（不代表帳戶已刪除）',
    CURRENT_VIEW_CHANGED:'目前分支或計數有差異',
    METADATA_ONLY_CHANGED:'僅已檢查的標題／時間欄位不同',
    NO_DETECTED_CURRENT_VIEW_CHANGE:'目前檢查範圍沒有發現差異',
    INCONCLUSIVE_PATH:'目前分支不可比較',
    INCONCLUSIVE_ID:'缺少可靠或唯一的對話 ID'
  };
  const explanations={
    INVALID_RECORDS_SKIPPED:'部分紀錄不是支援的對話資料結構，已排除。',
    SOME_CURRENT_PATHS_UNAVAILABLE:'部分對話缺少可核對的目前分支，無法閱讀其訊息。',
    BROKEN_PARENT_CHAIN:'至少一段對話的父節點鏈不完整。',
    OFF_PATH_NODES_NOT_IN_READING_VIEW:'分支以外的訊息節點不會顯示於主要閱讀頁面；請保留原始匯出檔。',
    ATTACHMENT_REFERENCES_NOT_PROOF_OF_SAVED_FILES:'發現附件參照，但不能因此證明檔案實體存在或可以還原。',
    NON_TEXT_PARTS_NOT_RENDERED:'部分圖片、語音或其他非文字內容沒有轉成可閱讀文字。',
    NUMBERED_JSON_SHARDS_RECOGNIZED_NOT_FULL_ACCOUNT_PROOF:'已辨識連號的 JSON 分片；這不能證明帳戶完整。',
    SINGLE_NUMBERED_JSON_MAY_OMIT_OTHER_PARTS:'只載入一個編號 JSON；可能尚有其他分片未讀取。'
  };
  const fileErrorHints=Object.freeze({
    ZIP_MISSING_JSON_SHARD:'編號 ZIP 有缺號，請重新取得完整匯出，不要自行拼接。',
    ZIP_DUPLICATE_JSON_SHARD:'編號 ZIP 內有重複分片，無法安全判定內容。',
    ZIP_MULTIPLE_SHARD_DIRECTORIES:'對話分片分布在不同資料夾，無法安全合併。',
    ZIP_AMBIGUOUS_JSON_SOURCES:'ZIP 同時出現單一與編號對話資料，無法安全選擇。',
    ZIP_TOO_MANY_JSON_SHARDS:'分片數量超出目前支援上限。',
    ZIP_JSON_SHARDS_TOO_LARGE:'分片解壓總量超出目前支援上限。',
    ZIP_EXPECTED_CONVERSATIONS_ARRAY:'某個分片不是目前支援的對話陣列格式。',
    ZIP_CRC_MISMATCH:'ZIP 內某個 JSON 的 CRC32 校驗不相符。',
    ZIP_UNSUPPORTED_SHARD_NAME:'對話檔使用尚未支援的編號格式，未進行猜測。',
    ZIP_CONVERSATIONS_JSON_MISSING:'ZIP 沒有找到目前支援的對話 JSON。'
  });
  function status(text,kind=''){e.status.textContent=text;e.status.className='status '+kind;}
  function download(data,name,type){
    const blob=new Blob([data],{type});const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function reset(){
    generation++;comparisonGeneration++;current=null;older=null;compared=null;selected=null;
    currentFile=null;matchedAttachmentPaths=[];byteReport=null;healthReport=null;demoActive=false;
    e.demoBanner.hidden=true;e.pilotPanel.hidden=true;
    for(const sel of [e.pilotEase,e.pilotClarity,e.pilotReuse,e.pilotTask,e.pilotScope])sel.value='NOT_TESTED';
    e.pilotStatus.textContent='沒有背景傳送或追蹤；不需要登入 GitHub 才能使用本工具。';
    e.verifyAttachments.disabled=true;e.attachmentVerifyStatus.textContent='請先載入 ZIP，才能進行選用檢查。';
    e.file.value='';e.olderFile.value='';e.olderFile.disabled=true;e.olderStatus.textContent='請先載入最新版匯出檔。';e.comparePanel.hidden=true;e.archiveAssessment.hidden=true;e.search.value='';e.list.replaceChildren();
    e.detail.textContent='';e.results.hidden=true;e.clear.disabled=true;e.html.disabled=true;
    status('已清除本頁載入的資料。');
  }
  function metric(label,value){
    const b=document.createElement('div');b.className='metric';
    const strong=document.createElement('strong');strong.textContent=Number(value).toLocaleString();
    const caption=document.createElement('span');caption.textContent=label;
    b.append(strong,caption);return b;
  }
  function renderHealth(){
    if(!current)return;
    healthReport=window.AMLHealth.evaluate(current.audit,{diff:compared?.summary||null,bytes:byteReport});
    const labels={ATTENTION:'已發現需要處理的問題',REVIEW:'需要人工核對的範圍',LIMITED_CHECK_OK:'已支援範圍未發現明顯問題'};
    e.healthSummary.textContent=labels[healthReport.overall]+'。僅限本工具已支援的檢查，不能證明完整備份。';
    e.healthSummary.dataset.state=healthReport.overall;
    e.healthCards.replaceChildren();
    for(const check of healthReport.checks){
      const box=document.createElement('article');box.className='health-card';box.dataset.priority=check.priority;
      const h=document.createElement('h4');h.textContent=check.title;
      const p=document.createElement('p');p.textContent=check.action;
      box.append(h,p);
      if(check.count!==undefined){const c=document.createElement('small');c.textContent=`本次觀察：${check.count} 項`;box.append(c);}
      e.healthCards.append(box);
    }
  }
  function renderAudit(){
    const a=current.audit;e.metrics.replaceChildren(
      metric('可解析對話',a.parsed_records),metric('目前分支文字訊息',a.active_visible_messages),
      metric('未顯示的分支節點',a.off_path_message_nodes),metric('可能的附件參照',a.attachment_reference_observations));
    e.warnings.replaceChildren();
    const items=[...a.warnings.map(x=>explanations[x]||x),
      ...a.issues.slice(0,20).map(x=>`${x.code} (${x.detail})`)];
    if (a.additional_issues_suppressed||a.issues.length>20) items.push('其他問題未全部顯示，請下載 JSON 檢查報告。');
    if (!items.length) items.push('指定範圍內沒有發現警告。這不是帳戶備份完整性認證。');
    for(const text of items){const li=document.createElement('li');li.textContent=text;e.warnings.append(li);}
    e.warningCount.textContent=`(${a.warnings.length} 類)`;
    renderHealth();
    const z=a.archive_path_assessment;
    e.archiveAssessment.hidden=!z;
    if(z){
      e.archiveAssessment.textContent=`ZIP 內非主對話 JSON 的檔案項目 ${z.non_conversations_file_entries} 個；附件參照 ${z.attachment_references_observed} 項，其中 ${z.matched_unique_paths} 項可精確對應到唯一 ZIP 路徑、${z.missing_explicit_paths} 項明確路徑不存在、${z.unverifiable_references} 項缺少可比對路徑、${z.unsafe_path_references} 項路徑不安全、${z.ambiguous_paths} 項路徑重複。僅比對 ZIP 目錄中宣告的檔名，未驗證其他檔案位元組、內容或可還原性。`;
    }
  }
  function renderMessages(c){
    e.detail.replaceChildren();
    const title=document.createElement('h3');title.textContent=c.title;
    const meta=document.createElement('p');meta.className='small-note';
    meta.textContent=`${core.formatTime(c.updated)} · ${c.visibleMessages} 則目前分支訊息`;
    e.detail.append(title,meta);
    if(c.pathStatus!=='CURRENT_PATH_PRESENT'||c.excludedNodes){
      const n=document.createElement('p');n.className='note';
      n.textContent=c.pathStatus!=='CURRENT_PATH_PRESENT'?'目前分支資料不可用；不會猜測內容順序。':`另有 ${c.excludedNodes} 個訊息節點不屬於目前分支，請保留原始備份。`;
      e.detail.append(n);
    }
    if(!c.messages.length){const p=document.createElement('p');p.textContent='此對話沒有可閱讀的目前分支文字訊息。';e.detail.append(p);}
    for(const msg of c.messages.slice(0,700)){
      const section=document.createElement('section');section.className='message';
      const role=document.createElement('strong');role.textContent=msg.role;
      const text=document.createElement('pre');text.textContent=msg.text||(msg.nonText?'[非文字內容尚未顯示]':'[空白訊息]');
      section.append(role,text);e.detail.append(section);
    }
    if(c.messages.length>700){const p=document.createElement('p');p.className='note';p.textContent='畫面只顯示前 700 則訊息；下載目前分支 HTML 可閱讀其餘文字。';e.detail.append(p);}
    e.html.disabled=false;
  }
  function selectConversation(i){selected=i;renderList();renderMessages(current.conversations[i]);}
  function renderList(){
    const query=e.search.value;const matched=core.searchConversations(current.conversations,query);
    e.resultCount.textContent=`符合 ${matched.length} 則（最多顯示 200 則）`;
    e.list.replaceChildren();
    if(!matched.length){const p=document.createElement('p');p.className='placeholder';p.textContent='沒有符合條件的目前分支內容。';e.list.append(p);return;}
    const idToIndex=new Map(current.conversations.map((c,i)=>[c,i]));
    for (const c of matched.slice(0,200)) {
      const i=idToIndex.get(c),button=document.createElement('button');button.type='button';
      button.className=i===selected?'selected':'';button.textContent=c.title;
      const sm=document.createElement('small');sm.textContent=`${c.visibleMessages} 則 · ${core.formatTime(c.updated)}`;
      button.append(sm);button.setAttribute('aria-current',i===selected?'true':'false');
      button.addEventListener('click',()=>selectConversation(i));e.list.append(button);
    }
  }
  async function parseSource(file){
    if(file.name.toLowerCase().endsWith('.json')){
      if(file.size>MAX_JSON)throw Error('JSON_TOO_LARGE');
      let raw;
      try{raw=JSON.parse((await file.text()).replace(/^\uFEFF/,''));}
      catch(_){throw Error('INVALID_JSON');}
      const parsed=core.parseChatGPTExport(raw);
      if(/^conversations-\d{3}\.json$/i.test(file.name)){
        parsed.audit.source_container='SINGLE_NUMBERED_JSON';
        parsed.audit.numbered_json_parts=1;
        parsed.audit.warnings.push('SINGLE_NUMBERED_JSON_MAY_OMIT_OTHER_PARTS');
      }
      return parsed;
    }
    if(file.name.toLowerCase().endsWith('.zip')){
      if(file.size>zip.MAX_ARCHIVE)throw Error('ZIP_ARCHIVE_TOO_LARGE');
      const opened=await zip.getConversationsJson(new Uint8Array(await file.arrayBuffer()));
      const parsed=core.parseChatGPTExport(opened.parsed,{zipEntryCount:opened.entryCount});
      parsed.audit.source_container=opened.sourceKind;
      parsed.audit.numbered_json_parts=opened.sourceFileCount;
      if(opened.sourceKind==='NUMBERED_JSON_SHARDS')parsed.audit.warnings.push('NUMBERED_JSON_SHARDS_RECOGNIZED_NOT_FULL_ACCOUNT_PROOF');
      parsed.audit.archive_path_assessment=core.assessArchiveReferences(opened.parsed,opened.entries);
      parsed._exactAttachmentPaths=core.listUniqueExactAttachmentPaths(opened.parsed,opened.entries);
      if(parsed.audit.archive_path_assessment.missing_explicit_paths)
        parsed.audit.warnings.push('ARCHIVE_REFERENCES_WITHOUT_MATCHING_PATH');
      return parsed;
    }
    throw Error('UNSUPPORTED_FILE_TYPE');
  }
  function renderComparison(){
    e.comparePanel.hidden=!compared;
    if(!compared)return;
    const c=compared.summary.counts;
    e.compareCounts.replaceChildren(
      metric('只在新版匯出出現',c.ONLY_IN_NEW_EXPORT),
      metric('新版匯出未見',c.NOT_IN_NEW_EXPORT),
      metric('目前分支有差異',c.CURRENT_VIEW_CHANGED),
      metric('無法確定',c.INCONCLUSIVE_PATH+c.INCONCLUSIVE_ID));
    e.compareList.replaceChildren();
    const relevant=compared.items.filter(x=>x.status!=='NO_DETECTED_CURRENT_VIEW_CHANGE');
    const fragment=document.createDocumentFragment();
    for(const item of relevant.slice(0,120)){
      const li=document.createElement('li');
      const label=document.createElement('strong');label.textContent=comparisonLabels[item.status]||item.status;
      const title=document.createElement('span');title.textContent=' · '+item.title;
      li.append(label,title);fragment.append(li);
    }
    if(relevant.length>120){const li=document.createElement('li');li.textContent=`僅顯示前 120 項，另有 ${relevant.length-120} 項未顯示。摘要報告不包含對話名稱。`;fragment.append(li);}
    if(!relevant.length){const li=document.createElement('li');li.textContent='目前檢查範圍沒有發現差異，並非兩份備份完全相同。';fragment.append(li);}
    e.compareList.append(fragment);renderHealth();
  }
  async function importFile(file){
    if(!file)return;
    demoActive=false;e.demoBanner.hidden=true;e.pilotPanel.hidden=true;
    // R5: never carry a demo/previous-export answer into a new source's optional feedback.
    for(const select of [e.pilotEase,e.pilotClarity,e.pilotReuse,e.pilotTask,e.pilotScope])select.value='NOT_TESTED';
    const rev=++generation;comparisonGeneration++;
    current=null;older=null;compared=null;selected=null;healthReport=null;byteReport=null;
    currentFile=null;matchedAttachmentPaths=[];e.verifyAttachments.disabled=true;
    e.attachmentVerifyStatus.textContent='尚未進行位元組檢查。';e.results.hidden=true;
    e.html.disabled=true;e.clear.disabled=false;e.olderFile.disabled=true;e.olderFile.value='';
    e.comparePanel.hidden=true;e.archiveAssessment.hidden=true;
    e.olderStatus.textContent='請先載入最新版匯出檔。';
    status('正在本機解析最新版匯出檔…');
    try{
      const parsed=await parseSource(file);
      if(rev!==generation)return;
      current=parsed;e.results.hidden=false;e.pilotPanel.hidden=false;e.search.value='';
      currentFile=file.name.toLowerCase().endsWith('.zip')?file:null;
      matchedAttachmentPaths=parsed._exactAttachmentPaths||[];delete parsed._exactAttachmentPaths;
      e.verifyAttachments.disabled=!currentFile||matchedAttachmentPaths.length===0;
      e.attachmentVerifyStatus.textContent=!currentFile?'JSON 單檔無法檢查 ZIP 附件。':!matchedAttachmentPaths.length?'沒有可安全且唯一比對的附件路徑；沒有自動猜測。':`找到 ${matchedAttachmentPaths.length} 個不同的明確附件路徑，可選擇執行限額 CRC32 檢查。`; 
      e.olderFile.disabled=false;e.olderStatus.textContent='可選擇較早匯出的檔案進行比較。';
      renderAudit();renderList();
      const shardInfo=parsed.audit.source_container==='NUMBERED_JSON_SHARDS'?`，共讀取 ${parsed.audit.numbered_json_parts} 個連續編號 JSON 分片`:parsed.audit.source_container==='SINGLE_NUMBERED_JSON'?'；這只是單一編號分片，可能還有其他未載入資料':'';
      status(`完成：已檢查 ${parsed.audit.input_records} 筆輸入紀錄${shardInfo}；僅驗證本次匯出內容的支援範圍。`,'ok');
    }catch(err){
      if(rev!==generation)return;
      current=null;currentFile=null;matchedAttachmentPaths=[];e.verifyAttachments.disabled=true;e.results.hidden=true;
      const code=String(err?.message||'UNKNOWN_ERROR').replace(/[^\w\s-]/g,'').slice(0,150);
      status(`無法解析：${fileErrorHints[code]||'來源格式或檔案內容無法在目前版本安全辨識。'}（${code}）。請保留官方原始匯出檔；沒有將部分結果當作成功。`,'error');
    }
  }
  async function importOlder(file){
    if(!file||!current||demoActive)return;
    const rev=++comparisonGeneration, sourceRev=generation;
    e.olderStatus.textContent='正在本機比較兩份匯出…';
    older=null;compared=null;e.comparePanel.hidden=true;
    try{
      const parsed=await parseSource(file);
      if(rev!==comparisonGeneration||sourceRev!==generation)return;
      older=parsed;compared=window.AMLCompare.compareSnapshots(parsed,current);
      renderComparison();e.olderStatus.textContent='比對完成：匯出日期與帳戶是否相同，均由使用者自行確認。';
    }catch(err){
      if(rev!==comparisonGeneration||sourceRev!==generation)return;
      e.comparePanel.hidden=true;compared=null;older=null;if(current)renderHealth();
      const code=String(err?.message||'UNKNOWN_ERROR').replace(/[^\w\s-]/g,'').slice(0,150);
      e.olderStatus.textContent=`舊版匯出無法解析：${code}。最新版閱讀不受影響。`;
    }
  }
  async function verifyAttachments(){
    if(!current||!currentFile||!matchedAttachmentPaths.length)return;
    const rev=generation;
    e.verifyAttachments.disabled=true;e.attachmentVerifyStatus.textContent='正在本機檢查有限的 ZIP 附件位元組…';
    try{
      const bytes=new Uint8Array(await currentFile.arrayBuffer());
      if(rev!==generation)return;
      const report=await zip.verifyMatchedAttachments(bytes,matchedAttachmentPaths);
      if(rev!==generation)return;
      byteReport=report;current.audit.attachment_byte_assessment=report;
      e.attachmentVerifyStatus.textContent=`檢查 ${report.checked_entries} 項，其中 CRC32 符合 ${report.bytes_crc32_verified} 項、失敗 ${report.failed_integrity} 項；因大小／格式／總量等限制跳過 ${report.skipped_size+report.skipped_budget+report.skipped_method+report.skipped_unsafe} 項。CRC 正確不代表原始附件完整或可信。`;
      renderHealth();
    }catch(err){
      if(rev!==generation)return;
      byteReport=null;
      const code=String(err?.message||'CHECK_UNAVAILABLE').replace(/[^A-Za-z0-9_-]/g,'').slice(0,90);
      e.attachmentVerifyStatus.textContent=`附件位元組檢查無法完成（${code}）；不能視為已驗證。`;
    }finally{if(rev===generation)e.verifyAttachments.disabled=false;}
  }
  function loadSyntheticDemo(){
    reset();
    const fixture=window.AMLDemo.getSnapshots();
    current=core.parseChatGPTExport(fixture.newer);
    older=core.parseChatGPTExport(fixture.older);
    compared=window.AMLCompare.compareSnapshots(older,current);
    current.audit.source_mode='SYNTHETIC_DEMO';
    demoActive=true;e.demoBanner.hidden=false;e.pilotPanel.hidden=false;e.results.hidden=false;
    e.clear.disabled=false;
    e.verifyAttachments.disabled=true;e.olderFile.disabled=true;
    e.attachmentVerifyStatus.textContent='示例為 JSON，沒有實際 ZIP 附件可檢查。';
    e.olderStatus.textContent='合成新舊版本已自動載入，請勿與真實帳戶資料混合比較。';
    renderAudit();renderList();renderComparison();
    status('合成示例已載入：不是帳戶備份檢查。可選取對話、搜尋文字和閱讀差異。','ok');
    e.results.scrollIntoView({block:'start',behavior:'auto'});
  }
  e.tryDemo.addEventListener('click',loadSyntheticDemo);
  e.downloadPilot.addEventListener('click',()=>{
    if(!current)return;
    const receipt=window.AMLPilotR5.createReceipt({ease:e.pilotEase.value,clarity:e.pilotClarity.value,reuse:e.pilotReuse.value,
      firstTask:e.pilotTask.value,understandsScope:e.pilotScope.value},demoActive?'SYNTHETIC_DEMO':'PERSONAL_EXPORT');
    download(JSON.stringify(receipt,null,2),'aml-pilot-feedback-v0.8.0.json','application/json;charset=utf-8');
    e.pilotStatus.textContent='僅已下載到你的裝置，沒有自動傳送。請自行檢查內容，分享與否由你決定。';
  });
  e.downloadFirstResult.addEventListener('click',()=>{
    if(healthReport)download(window.AMLFirstResult.format(healthReport,demoActive?'SYNTHETIC_DEMO':'PERSONAL_EXPORT'),
      'aml-first-result-v0.8.0.txt','text/plain;charset=utf-8');
  });
  e.verifyAttachments.addEventListener('click',()=>{void verifyAttachments();});
  e.downloadHealth.addEventListener('click',()=>{if(healthReport)download(JSON.stringify({...healthReport,source_mode:demoActive?'SYNTHETIC_DEMO':'PERSONAL_EXPORT'},null,2),'aml-health-v0.8.0.json','application/json;charset=utf-8');});
  const picker=document.querySelector('label[for="archiveFile"]');
  picker.addEventListener('keydown', ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();e.file.click();}});
  e.file.addEventListener('change',()=>{if(e.file.files?.[0])void importFile(e.file.files[0]);});
  e.olderFile.addEventListener('change',()=>{if(e.olderFile.files?.[0])void importOlder(e.olderFile.files[0]);});
  e.compareDownload.addEventListener('click',()=>{if(compared)download(JSON.stringify(compared.summary,null,2),'aml-diff-summary-v0.8.0.json','application/json;charset=utf-8');});
  e.clear.addEventListener('click',reset);
  e.search.addEventListener('input',()=>{if(current)renderList();});
  e.audit.addEventListener('click',()=>{if(current)download(JSON.stringify(current.audit,null,2),'aml-audit-v0.8.0.json','application/json;charset=utf-8');});
  e.html.addEventListener('click',()=>{if(current&&selected!==null){
    const c=current.conversations[selected];download(core.exportConversationHtml(c),'aml-conversation.html','text/html;charset=utf-8');
  }});
})();
