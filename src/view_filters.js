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
  function filterComparison(items,group='ALL'){
    if(!Object.prototype.hasOwnProperty.call(DIFF_GROUPS,group))throw Error('INVALID_COMPARE_FILTER');
    const allowed=new Set(DIFF_GROUPS[group]);
    return (Array.isArray(items)?items:[]).filter(x=>x&&allowed.has(x.status));
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
  return Object.freeze({UNKNOWN,DIFF_GROUPS,RISK_GROUPS,countUnknown,routeComparison,filterComparison,page,filterConversations});
});
