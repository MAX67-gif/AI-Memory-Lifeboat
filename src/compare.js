/* AI Memory Lifeboat v0.3.0 — bounded, title-free snapshot comparison summary.
 * Difference of visible exported current paths only. NOT account deletion detection.
 * MIT (c) 2026 MAX67-gif.
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.AMLCompare=api;
})(typeof globalThis==='object'?globalThis:null,function(){'use strict';
  const SCHEMA='aml.snapshot-diff.v1';
  const STATUSES=Object.freeze(['ONLY_IN_NEW_EXPORT','NOT_IN_NEW_EXPORT','CURRENT_VIEW_CHANGED',
    'METADATA_ONLY_CHANGED','NO_DETECTED_CURRENT_VIEW_CHANGE','INCONCLUSIVE_PATH','INCONCLUSIVE_ID']);
  const validId=c=>c&&c.identityStatus==='STABLE_ID_PROVIDED'&&typeof c.id==='string'&&c.id.trim().length>0;
  function indexRows(rows){
    const map=new Map(),unknown=[];
    for(const row of rows){
      if(!validId(row)){unknown.push(row);continue;}
      const group=map.get(row.id)||[];group.push(row);map.set(row.id,group);
    }
    return {map,unknown};
  }
  function sameMessages(a,b){
    if(a.length!==b.length)return false;
    for(let i=0;i<a.length;i++){
      if(a[i].role!==b[i].role||a[i].text!==b[i].text||a[i].nonText!==b[i].nonText||
         a[i].created!==b[i].created)return false;
    }
    return true;
  }
  function compareSnapshots(older,newer){
    if(!older||!newer||!Array.isArray(older.conversations)||!Array.isArray(newer.conversations)||
      older.audit?.schema!=='aml.audit.v1'||newer.audit?.schema!=='aml.audit.v1')throw Error('INVALID_SNAPSHOT_PAIR');
    const o=indexRows(older.conversations),n=indexRows(newer.conversations),items=[];
    const counts=Object.fromEntries(STATUSES.map(s=>[s,0]));
    const add=(status,row)=>{counts[status]++;items.push({status,title:row?.title||'Unknown conversation'});};
    for(const row of [...o.unknown,...n.unknown]) add('INCONCLUSIVE_ID',row);
    const ids=new Set([...o.map.keys(),...n.map.keys()]);
    for(const id of ids){
      const a=o.map.get(id)||[],b=n.map.get(id)||[];
      if(a.length>1||b.length>1){add('INCONCLUSIVE_ID',b[0]||a[0]);continue;}
      const olderRow=a[0],newerRow=b[0];
      if(!olderRow){add('ONLY_IN_NEW_EXPORT',newerRow);continue;}
      if(!newerRow){add('NOT_IN_NEW_EXPORT',olderRow);continue;}
      if(olderRow.pathStatus!=='CURRENT_PATH_PRESENT'||newerRow.pathStatus!=='CURRENT_PATH_PRESENT'){
        add('INCONCLUSIVE_PATH',newerRow);continue;
      }
      const viewChanged=!sameMessages(olderRow.messages,newerRow.messages)||
        olderRow.messageNodes!==newerRow.messageNodes||
        olderRow.excludedNodes!==newerRow.excludedNodes||
        olderRow.referenceCount!==newerRow.referenceCount||
        olderRow.nonTextCount!==newerRow.nonTextCount;
      if(viewChanged){add('CURRENT_VIEW_CHANGED',newerRow);continue;}
      const metadataChanged=olderRow.title!==newerRow.title||olderRow.created!==newerRow.created||olderRow.updated!==newerRow.updated;
      add(metadataChanged?'METADATA_ONLY_CHANGED':'NO_DETECTED_CURRENT_VIEW_CHANGE',newerRow);
    }
    const summary={schema:SCHEMA,tool_version:'0.3.0',
      inputs:'USER_SELECTED_ORDER_NOT_VERIFIED',
      identity_scope:'ONLY_RECORDS_WITH_UNIQUE_EXPLICIT_CONVERSATION_ID',
      comparison_scope:'EXPORTED_CURRENT_PATH_TEXT_AND_COUNTS_PLUS_SELECTED_METADATA',
      account_completeness:'NOT_VERIFIABLE_FROM_EITHER_EXPORT',
      counts,total_display_items:items.length,
      input_summary:{older:{records:older.audit.input_records,invalid_records:older.audit.invalid_records,missing_paths:older.audit.missing_current_paths},
        newer:{records:newer.audit.input_records,invalid_records:newer.audit.invalid_records,missing_paths:newer.audit.missing_current_paths}},
      warnings:['NOT_IN_NEW_EXPORT_IS_NOT_PROOF_OF_ACCOUNT_DELETION',
        'EQUAL_CURRENT_VIEWS_DO_NOT_PROVE_OFF_PATH_OR_ATTACHMENT_EQUALITY',
        'DIFFERENT_ACCOUNTS_CANNOT_BE_DETECTED_RELIABLY',
        'EXPORT_CHRONOLOGY_IS_USER_ASSUMED_NOT_AUTHENTICATED'],
      contains_chat_text:false,contains_conversation_ids:false,contains_titles:false};
    return {summary,items};
  }
  return Object.freeze({SCHEMA,STATUSES,compareSnapshots});
});
