/* AI Memory Lifeboat v0.10.4 — offline, content-free, human-readable first-result report. MIT.
 * Never reflect exported titles, paths, text, IDs, filenames, unknown issue details or metadata.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.AMLFirstResult=api;
})(typeof globalThis==='object'?globalThis:null,function(){'use strict';
 const VERSION='0.10.4';
 const SOURCE=Object.freeze({
   SYNTHETIC_DEMO:'合成示範（不代表你的帳戶已被檢查）',
   PERSONAL_EXPORT:'使用者自行選擇的匯出檔（不是帳戶完整性證明）'
 });
 const STATE=Object.freeze({
   ATTENTION:'已發現需要處理的問題',
   REVIEW:'有需要人工核對的範圍',
   LIMITED_CHECK_OK:'僅限已支援項目，尚未發現明顯問題'
 });
 // Trusted, literal strings only: do not echo report.checks[].title/action from input.
 const ACTIONS=Object.freeze({
   PRESERVE_SOURCE:['保留原始官方匯出','不要只保存本工具的閱讀用檔案；妥善備份原始 ZIP／JSON。'],
   INVALID_RECORDS:['部分紀錄無法解析','保留原始匯出，並查看本工具列出的格式限制。'],
   CURRENT_PATHS:['部分目前分支不可閱讀','無法可靠排序的訊息不會被拼接成假對話。'],
   ZIP_PATH_MISSING:['ZIP 有附件路徑缺漏','只核對明確路徑；請勿把缺漏視為完整附件備份。'],
   ZIP_PATH_AMBIGUOUS:['附件路徑不明確','重複、不安全或無法唯一對應的路徑需要人工核對。'],
   BYTE_FAILURE:['ZIP 位元組檢查失敗','已檢查的部分項目 CRC 或大小不一致，建議重新取得官方匯出。'],
   OFF_PATH:['部分其他對話分支未呈現','主要閱讀頁只顯示目前分支，原始匯出仍應保留。'],
   TITLE_TRUNCATED:['部分對話標題已截短','標題顯示、搜尋與 HTML 僅包含保留的前段；完整標題請查原始 ZIP／JSON。'],
   TEXT_TRUNCATED:['部分超長訊息已截短','閱讀、搜尋及 HTML 匯出只含保留部分；省略的尾段請查原始 ZIP／JSON。'],
   NON_TEXT:['部分非文字內容無法閱讀','圖片、音訊等不能保證轉為完整可閱讀內容。'],
   REFERENCE_LIMIT:['附件參照不等於附件已保存','有參照或路徑不代表原始附件已完整匯出。'],
   BYTE_LIMIT:['ZIP 位元組檢查範圍有限','大小、壓縮格式或安全限制以外的項目未驗證。'],
   JSON_LIMIT:['JSON 單檔無法核對 ZIP 附件','如要進行限定 ZIP 附件檢查，應使用自己的官方 ZIP。'],
   DIFF_LIMIT:['兩份匯出有差異或未知','新版匯出未出現某筆資料，不代表帳戶已刪除。'],
   SINGLE_NUMBERED_JSON:['只載入一個編號 JSON 分片','可能還有其他分片尚未讀取，不能宣稱完整備份。'],
   MULTIPLE_NUMBERED_JSON:['已辨識連續編號的 JSON 分片','這只確認目前 ZIP 中可讀分片，不是所有帳戶資料完整性的證明。'],
   NO_DETECTED_PROBLEMS:['已支援範圍未見明顯問題','此結果不是完整性認證或平台可還原性保證。']
 });
 function safeCount(x){return Number.isSafeInteger(x)&&x>=0&&x<=100000000?x:null;}
 function format(health,sourceMode){
   if(!health||health.schema!=='aml.health.v1'||!Array.isArray(health.checks)||health.checks.length>50||!(health.overall in STATE))
     throw new TypeError('INVALID_FIRST_RESULT_HEALTH');
   if(!Object.hasOwn(SOURCE,sourceMode))throw new TypeError('INVALID_FIRST_RESULT_SOURCE');
   const lines=[
     'AI Memory Lifeboat｜第一次備份體檢結果（純文字）',
     `工具版本：${VERSION}`,
     `資料來源：${SOURCE[sourceMode]}`,
     `檢查結論：${STATE[health.overall]}`,
     '',
     '請先知道：這只檢查匯出檔中已支援的結構與選用項目。',
     '無法證明帳戶資料全部匯出、原始附件真實完整或能還原至任何 AI 平台。',
     '請保存原始官方 ZIP／JSON。',
     '',
     '本次需要知道的事項：'
   ];
   let listed=0;
   for(const x of health.checks){
     if(!x||!Object.hasOwn(ACTIONS,x.code))continue;
     const [label,action]=ACTIONS[x.code];
     const n=safeCount(x.count);
     lines.push(`${++listed}. ${label}${n===null?'':`（觀察 ${n} 項）`}`);
     lines.push(`   ${action}`);
   }
   if(!listed)lines.push('沒有可列出的已支援項目；不能把結果當成完整性認證。');
   lines.push('','額外檢查：',
     `- 附件 CRC32：${health.byte_check_performed===true?'已進行有限檢查（不保證原附件真實）':'未進行或不適用'}`,
     `- 兩份快照比較：${health.comparison_performed===true?'已比較有支援的欄位（不能證明刪除）':'未進行或不適用'}`,
     '', '隱私：此純文字報告不含對話文字、標題、對話 ID、檔名、路徑或時間戳。',
     '以上為程式產生的檢查說明，不代表獨立真人審核，也不是保證。','');
   return lines.join('\n');
 }
 return Object.freeze({VERSION,format});
});
