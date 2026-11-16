/* AML R16 view-only comparison and coverage routes. Offline, no source export or telemetry. MIT. */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.AMLViewFilters=api;
})(typeof globalThis==='object'?globalThis:null,function(){'use strict';
  const UNKNOWN=Object.freeze(['INCONCLUSIVE_PATH','INCONCLUSIVE_ID','INCONCLUSIVE_TEXT','INCONCLUSIVE_TITLE']);
  const DIFF_GROUPS=Object.freeze({
    ALL:['ONLY_IN_NEW_EXPORT','NOT_IN_NEW_EXPORT','CURRENT_VIEW_CHANGED','METADATA_ONLY_CHANGED',...UNKNOWN],
    DIFFERENCES:['CURRENT_VIEW_CHANGED'],
    NEW:['ONLY_IN_NEW_EXPORT'],
    NOT_SEEN:['NOT_IN_NEW_EXPORT'],
    UNKNOWN,
    UNKNOWN_PATH:['INCONCLUSIVE_PATH'],
    UNKNOWN_ID:['INCONCLUSIVE_ID'],
    UNKNOWN_TEXT:['INCONCLUSIVE_TEXT'],
    UNKNOWN_TITLE:['INCONCLUSIVE_TITLE'],
    METADATA:['METADATA_ONLY_CHANGED']
  });
  const RISK_GROUPS=Object.freeze(['ALL','TITLE_TRUNCATED','TEXT_TRUNCATED','PATH_UNAVAILABLE','OTHER_BRANCH','NON_TEXT']);
  const num=v=>Number.isSafeInteger(v)&&v>=0?v:0;
  function countUnknown(counts={}){return UNKNOWN.reduce((sum,k)=>sum+num(counts[k]),0);}
  function routeComparison(summary){
    const c=summary?.counts||{};
    if(countUnknown(c))return {code:'REVIEW_UNCERTAIN',message:'存在無法完整比較的對話，請先核對目前分支、ID 或截短內容。這不是完整備份認證。'};
    if(num(c.NOT_IN_NEW_EXPORT)||num(c.ONLY_IN_NEW_EXPORT)||num(c.CURRENT_VIEW_CHANGED))
      return {code:'REVIEW_DIFFERENCES',message:'有新增、新版未見或目前分支差異；新版未見不能當成帳戶已刪除。'};
    if(num(c.METADATA_ONLY_CHANGED))return {code:'REVIEW_METADATA',message:'僅觀察到已檢查中繼資料的差異；不代表原始內容全部相同。'};
    return {code:'NO_DETECTED_CHANGE_IN_SCOPE',message:'已支援的指定範圍沒有偵測到變化，不代表兩份匯出完全相同或帳戶完整。'};
  }
  // Local display-only search. Do not put names/queries in portable reports.
  function filterComparison(items,group='ALL',search=''){
    if(!Object.prototype.hasOwnProperty.call(DIFF_GROUPS,group))throw Error('INVALID_COMPARE_FILTER');
    if(typeof search!=='string')throw Error('INVALID_COMPARE_SEARCH');
    const allowed=new Set(DIFF_GROUPS[group]);
    const needle=search.slice(0,160).trim().toLocaleLowerCase();
    return (Array.isArray(items)?items:[]).filter(x=>x&&allowed.has(x.status)&&
      (!needle||String(x.title??'').toLocaleLowerCase().includes(needle)));
  }
  // Strict 1-based, bounded page index, no Number(''), prefix parsing or silent coercion.
  function jumpToPage(value,totalPages){
    if(typeof value!=='string'||!/^[1-9][0-9]*$/.test(value)||value.length>6||
       !Number.isSafeInteger(totalPages)||totalPages<1)return null;
    const n=Number(value);
    return Number.isSafeInteger(n)&&n<=totalPages?n-1:null;
  }
  // Whitelisted categorical counts only: NEVER interpolate imported titles, IDs, text, filenames or search terms.
  function formatReviewGuide(summary){
    const c=summary?.counts||{};
    const keys=['INCONCLUSIVE_PATH','INCONCLUSIVE_ID','INCONCLUSIVE_TEXT','INCONCLUSIVE_TITLE',
      'CURRENT_VIEW_CHANGED','ONLY_IN_NEW_EXPORT','NOT_IN_NEW_EXPORT','METADATA_ONLY_CHANGED'];
    const lines=['AI Memory Lifeboat｜差異審閱指引（R19）','',
      '僅就兩份使用者自行選定的匯出之已支援範圍整理；不能證明它們是同帳戶或正確時間順序。',
      '不能證明帳戶完整備份；新版未見不代表帳戶已刪除。','',
      '需人工優先核對的狀態（只含分類計數，不含標題、ID、對話內容或搜尋字串）：'];
    for(const k of keys)lines.push(`${k}: ${num(c[k])}`);
    lines.push('',`UNKNOWN 總數: ${countUnknown(c)}`,'');
    if(countUnknown(c))lines.push('下一步：先核對缺失分支／ID／文字截短／標題截短等未知原因；不要把未知當成相同。');
    else if(num(c.NOT_IN_NEW_EXPORT)||num(c.ONLY_IN_NEW_EXPORT)||num(c.CURRENT_VIEW_CHANGED))
      lines.push('下一步：核對新增、未見與目前分支差異；不要將未見解讀為已刪除。');
    else lines.push('下一步：已支援範圍沒有偵測到重大差異，仍須保留原始 ZIP／JSON 與檢查覆蓋限制。');
    lines.push('這份 TXT 只含分類統計與固定提示；分享前仍請自行確認是否願意揭露統計數量。','');
    return lines.join('\n');
  }
  function page(items,index,size){
    if(!Number.isSafeInteger(size)||size<1||size>500)throw Error('INVALID_PAGE_SIZE');
    if(!Number.isSafeInteger(index))throw Error('INVALID_PAGE_INDEX');
    const safe=Array.isArray(items)?items:[];
    const totalPages=Math.max(1,Math.ceil(safe.length/size));
    const current=Math.min(Math.max(0,index),totalPages-1);
    return {items:safe.slice(current*size,(current+1)*size),page:current,totalPages,total:safe.length};
  }
  function filterConversations(items,group='ALL'){
    if(!RISK_GROUPS.includes(group))throw Error('INVALID_CONVERSATION_FILTER');
    const all=Array.isArray(items)?items:[];
    if(group==='ALL')return all.slice();
    return all.filter(c=>{
      if(!c)return false;
      switch(group){
      case 'TITLE_TRUNCATED':return c.titleTruncated===true;
      case 'TEXT_TRUNCATED':return c.truncatedVisibleMessages>0||c.messages?.some(m=>m.textTruncated===true)===true;
      case 'PATH_UNAVAILABLE':return c.pathStatus!=='CURRENT_PATH_PRESENT';
      case 'OTHER_BRANCH':return c.excludedNodes>0;
      case 'NON_TEXT':return c.nonTextCount>0;
      default:return false;
      }
    });
  }
  // A sensitive export may only target the explicitly selected item still visible on this page.
  function selectionOnCurrentPage(conversations,selected,pageItems){
    return Array.isArray(conversations) && Number.isSafeInteger(selected) &&
      selected>=0 && selected<conversations.length && Array.isArray(pageItems) &&
      pageItems.includes(conversations[selected]);
  }
  function keyboardTargetIndex(key,index,count){
    if(!Number.isSafeInteger(index)||!Number.isSafeInteger(count)||count<1||index<0||index>=count)return null;
    switch(key){
      case 'ArrowDown':return Math.min(index+1,count-1);
      case 'ArrowUp':return Math.max(index-1,0);
      case 'Home':return 0;
      case 'End':return count-1;
      default:return null;
    }
  }
  // R20: Browse every retained message without rendering more than 700 at a time.
  // These windows only change presentation; they never widen original export parsing limits.
  function readerWindow(messages,index=0,size=700){
    if(!Number.isSafeInteger(size)||size<1||size>700)throw Error('READER_WINDOW_SIZE');
    if(!Number.isSafeInteger(index))throw Error('READER_WINDOW_INDEX');
    const all=Array.isArray(messages)?messages:[];
    const totalPages=Math.max(1,Math.ceil(all.length/size));
    const current=Math.min(Math.max(index,0),totalPages-1);
    const start=current*size;
    return {items:all.slice(start,start+size),page:current,totalPages,total:all.length,start};
  }
  // Search only retained text in the selected current-path messages. Never inspect hidden nodes.
  function readerSearchHits(messages,query){
    if(typeof query!=='string')throw Error('READER_SEARCH_INVALID');
    if(query.length>160)throw Error('READER_SEARCH_LENGTH');
    const needle=query.trim().toLocaleLowerCase();
    if(!needle)return [];
    const hits=[];
    const source=Array.isArray(messages)?messages:[];
    for(let i=0;i<source.length;i++){
      if(typeof source[i]?.text==='string'&&source[i].text.toLocaleLowerCase().includes(needle))hits.push(i);
    }
    return hits;
  }
  function readerWindowForIndex(index,count,size=700){
    if(!Number.isSafeInteger(index)||!Number.isSafeInteger(count)||index<0||index>=count||
      !Number.isSafeInteger(size)||size<1||size>700)return null;
    return Math.floor(index/size);
  }
  // R21: 1-based user message number to a retained 0-based index. Reject implicit coercion.
  function readerMessageJump(value,total){
    if(typeof value!=='string'||!/^[1-9][0-9]*$/.test(value)||value.length>9||
       !Number.isSafeInteger(total)||total<1)return null;
    const n=Number(value);
    return Number.isSafeInteger(n)&&n<=total?n-1:null;
  }
  // R21: after manual window movement (-1 cursor), "previous" means LAST hit,
  // and "next" means FIRST hit. All other indices wrap in a bounded list.
  function readerHitStep(count,cursor,direction){
    if(!Number.isSafeInteger(count)||count<1||!Number.isSafeInteger(cursor)||
       cursor< -1||cursor>=count||(direction!==1&&direction!==-1))return null;
    if(cursor===-1)return direction===1?0:count-1;
    return (cursor+direction+count)%count;
  }
  return Object.freeze({UNKNOWN,DIFF_GROUPS,RISK_GROUPS,countUnknown,safeCount:num,routeComparison,filterComparison,page,filterConversations,selectionOnCurrentPage,keyboardTargetIndex,jumpToPage,formatReviewGuide,readerWindow,readerSearchHits,readerWindowForIndex,readerMessageJump,readerHitStep});
});
