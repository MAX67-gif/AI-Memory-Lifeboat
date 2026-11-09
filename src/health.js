/* AI Memory Lifeboat v0.10.2 — evidence-limited, content-free health guidance.
 * MIT (c) 2026 MAX67-gif. Never certify full-account completeness.
 */
(function(root, factory){
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.AMLHealth = api;
})(typeof globalThis === 'object' ? globalThis : null, function(){ 'use strict';
  const SCHEMA='aml.health.v1';
  const VERSION='0.10.2';
  const levels=Object.freeze(['ATTENTION','REVIEW','LIMITED_CHECK_OK']);
  const nonneg=x=>Number.isSafeInteger(x)&&x>=0?x:0;
  // Every heading and action comes from code. Never reflect source/filename/ID/title in a shareable report.
  const labels=Object.freeze({
    PRESERVE_SOURCE:['保留官方原始匯出','請把原始官方 ZIP／JSON 妥善備份。閱讀用 HTML 和檢查報告不能還原帳戶。'],
    INVALID_RECORDS:['部分對話紀錄無法解析','本次有紀錄被略過。請保留原檔，並用官方匯出重新取得或向開發者回報不含私密資料的合成案例。'],
    CURRENT_PATHS:['部分對話的目前分支無法閱讀','部分父節點路徑缺漏或不完整；不能猜測訊息順序，請檢查原始匯出並保留所有版本。'],
    ZIP_PATH_MISSING:['ZIP 內有明確附件路徑未找到','此結果僅適用已認得的明確路徑。先保留原始 ZIP，不要將本工具輸出的閱讀檔當成附件備份。'],
    ZIP_PATH_AMBIGUOUS:['附件路徑不唯一或不安全','相同名稱可能對應多個項目，或參照路徑不安全；沒有把它們算成找到的檔案。'],
    BYTE_FAILURE:['部分 ZIP 項目位元組驗證未通過','檢查到 CRC 或檔案結構不一致；不要直接把該項目視為可用，建議向來源重新匯出。'],
    OFF_PATH:['其他對話分支未納入閱讀內容','閱讀畫面只顯示目前分支，其他訊息節點仍可能存在於原始匯出資料中。'],
    TEXT_TRUNCATED:['部分超長訊息已截短','閱讀、搜尋與 HTML 匯出只含保留的文字；省略的尾段仍需查看原始 ZIP／JSON，不要只保存閱讀檔。'],
    NON_TEXT:['部分非文字內容無法呈現','圖片、音訊或其他資料未完整轉成文字。請保留原始官方匯出檔。'],
    REFERENCE_LIMIT:['附件參照不等於附件已備份','即使找得到路徑或 CRC 正確，也無法證明上傳的原始附件、完整內容或帳戶資料已保存。'],
    BYTE_LIMIT:['位元組驗證只有部分覆蓋','僅檢查明確且唯一的 ZIP 路徑中符合容量與格式限制的項目；跳過項目保持未知。'],
    JSON_LIMIT:['JSON 無法核對 ZIP 內附件','目前載入的是 JSON 單檔。要檢查 ZIP 的附件路徑與位元組，請選擇自己的官方 ZIP。'],
    DIFF_LIMIT:['兩次匯出出現差異或無法比對','新版未見不等於帳戶已刪除；匯出先後與帳戶是否相同仍需自行確認。'],
    SINGLE_NUMBERED_JSON:['只載入一個編號 JSON 分片','這不是完整分片集合；請選擇包含所有分片的官方 ZIP，並妥善保留來源檔。'],
    MULTIPLE_NUMBERED_JSON:['已讀取連續編號的 JSON 分片','只代表此 ZIP 中識別到的分片已解析，不代表帳戶完整或附件已保存。'],
    NO_DETECTED_PROBLEMS:['已支援範圍暫無明顯結構異常','這只是局部檢查沒有發現上述問題，不代表完整備份、安全認證或平台可還原。'],
  });
  function evaluate(audit, options={}){
    if (!audit || audit.schema!=='aml.audit.v1') throw new TypeError('HEALTH_INVALID_AUDIT');
    const a=audit;
    const z=a.archive_path_assessment && a.archive_path_assessment.schema==='aml.archive-path-assessment.v1'?a.archive_path_assessment:null;
    const b=options.bytes && options.bytes.schema==='aml.attachment-bytes.v1'?options.bytes:null;
    const d=options.diff && options.diff.schema==='aml.snapshot-diff.v1'?options.diff:null;
    const checks=[];
    const add=(code,priority,count=null)=>{const [title,action]=labels[code];checks.push({code,priority,title,action,...(count===null?{}:{count})});};
    add('PRESERVE_SOURCE','ESSENTIAL');
    if(a.source_container==='SINGLE_NUMBERED_JSON')add('SINGLE_NUMBERED_JSON','REVIEW',1);
    if(a.source_container==='NUMBERED_JSON_SHARDS')add('MULTIPLE_NUMBERED_JSON','INFORMATION',nonneg(a.numbered_json_parts));
    if (nonneg(a.invalid_records))add('INVALID_RECORDS','ATTENTION',nonneg(a.invalid_records));
    if (nonneg(a.missing_current_paths))add('CURRENT_PATHS','ATTENTION',nonneg(a.missing_current_paths));
    if (z && nonneg(z.missing_explicit_paths))add('ZIP_PATH_MISSING','ATTENTION',nonneg(z.missing_explicit_paths));
    if (z && (nonneg(z.ambiguous_paths)+nonneg(z.unsafe_path_references)))add('ZIP_PATH_AMBIGUOUS','REVIEW',nonneg(z.ambiguous_paths)+nonneg(z.unsafe_path_references));
    if (b && nonneg(b.failed_integrity))add('BYTE_FAILURE','ATTENTION',nonneg(b.failed_integrity));
    if (nonneg(a.truncated_visible_messages))add('TEXT_TRUNCATED','REVIEW',nonneg(a.truncated_visible_messages));
    if (nonneg(a.off_path_message_nodes))add('OFF_PATH','REVIEW',nonneg(a.off_path_message_nodes));
    if (nonneg(a.non_text_parts_not_rendered))add('NON_TEXT','REVIEW',nonneg(a.non_text_parts_not_rendered));
    if (nonneg(a.attachment_reference_observations))add('REFERENCE_LIMIT','REVIEW',nonneg(a.attachment_reference_observations));
    if (b && (nonneg(b.skipped_size)+nonneg(b.skipped_budget)+nonneg(b.skipped_method)+nonneg(b.skipped_unsafe)))
      add('BYTE_LIMIT','REVIEW',nonneg(b.skipped_size)+nonneg(b.skipped_budget)+nonneg(b.skipped_method)+nonneg(b.skipped_unsafe));
    if (!z)add('JSON_LIMIT','INFORMATION');
    if (d) {
      const c=d.counts||{};
      const total=['NOT_IN_NEW_EXPORT','ONLY_IN_NEW_EXPORT','CURRENT_VIEW_CHANGED','METADATA_ONLY_CHANGED','INCONCLUSIVE_PATH','INCONCLUSIVE_ID','INCONCLUSIVE_TEXT'].reduce((sum,k)=>sum+nonneg(c[k]),0);
      if(total)add('DIFF_LIMIT','REVIEW',total);
    }
    const serious=checks.some(c=>c.priority==='ATTENTION');
    const review=checks.some(c=>c.priority==='REVIEW');
    const overall=serious?'ATTENTION':review?'REVIEW':'LIMITED_CHECK_OK';
    if(overall==='LIMITED_CHECK_OK')add('NO_DETECTED_PROBLEMS','INFORMATION');
    return {
      schema:SCHEMA,tool_version:VERSION,overall,
      overall_meaning:overall==='ATTENTION'?'EXPORTED_DATA_HAS_DETECTED_PROBLEMS':overall==='REVIEW'?'KNOWN_GAPS_REQUIRE_HUMAN_REVIEW':'NO_KNOWN_PROBLEM_IN_SUPPORTED_CHECKS_ONLY',
      coverage:'EXPORTED_KNOWN_CHATGPT_CONVERSATIONS_CURRENT_PATH_AND_OPTIONAL_ZIP_CHECKS',
      account_completeness:'NOT_VERIFIABLE_FROM_EXPORT',
      privacy:{contains_chat_text:false,contains_conversation_ids:false,contains_titles:false,contains_file_paths:false},
      checks,limitations:['NOT_FULL_ACCOUNT_BACKUP_CERTIFICATION','NOT_PLATFORM_RESTORATION','CRC32_IS_NOT_SOURCE_AUTHENTICITY'],
      byte_check_performed:!!b,comparison_performed:!!d
    };
  }
  return Object.freeze({SCHEMA,VERSION,levels,evaluate});
});
