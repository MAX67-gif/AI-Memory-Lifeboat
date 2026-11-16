# AI Memory Lifeboat R20｜長對話分段閱讀與訊息命中定位工程契約

日期：2026-11-16，基準 R19 v0.10.8 正式 Git Tree `2c70f27500f03956ff4b1e096619bb7506fc90e9`。

## A｜可驗證的實際缺口

R14 起原解析、全對話搜尋與單篇 HTML 仍可涵蓋第 700 則以後的已保留目前分支訊息，但畫面固定 `.slice(0,700)`，使用者即使搜尋到關鍵字，也只能閱讀前 700 則。R20 用 1,402 則原創合成 ChatGPT 資料在正式 R19 同位元組 standalone 上重現：首次顯示 700 則、第 1,110 則測試字串不可見。這是「搜尋結果可到達性」問題，不是 parser 遺失、完整備份或其它 AI 平台缺陷。

**裁決：**不更動 R19 Comparison Schema，不提高 ZIP/JSON/message/HTML 容量，不引入 API、帳號或遙測。只增加**已保留訊息的分段閱讀與當篇搜尋定位**，保持原來每次 700 則 DOM 上限。

## B｜輸入、輸出與狀態契約

- `readerWindow(messages,page,700)` 回傳 `{items,page,totalPages,total,start}`，大小不可大於 700，非法頁碼 fail closed 或夾限；多段合併須可對到全部保留訊息，不能偷漏最後一段。
- `readerSearchHits(messages,query)` 僅在使用者主動按「尋找」後掃描目前被選取對話的 `.messages[].text` 保留部分；長度最多 160 個 JS code units，空白/不合法查詢安全回報；不掃描非目前分支、被截短尾段、原始附件或其它對話。
- 找到的訊息使用原有渲染安全路徑 `.textContent`；絕不把對話字串寫成 `innerHTML`、連到外部 API、放在 URL/儲存區或寫入健康/差異審閱 TXT、JSON。
- 前後段／前後命中可移動焦點至單則保留訊息，不能自動執行 HTML 下載，也不繞過既有二次確認；單段最多 700 訊息節點。
- 明確更換選取、匯入新來源、清除，以及 R18 判定選取已離開目前清單時，撤銷搜尋字串、命中索引、閱讀 DOM 與 R10 匯出暫存確認。
- 所有版本號、README 中英、ChangeLog、權限說明、相容文件、strict CSP standalone、Manifest、Sha、PR exact-head／main CI 及獨立 pinned Release 同步。

## 不變的禁止事項

不得聲稱輸出檔包含帳戶全部資料或被刪除對話；R6 32 ZIP 分片 / 64 MiB JSON / 128 MiB ZIP、R10 含原文確認、R12 16 MiB HTML、R13/R14 截斷、R15 200 對話清單分頁、R16-R19 comparison UNKNOWN 語意全部維持。無真人採用或 Codex for Open Source 核准的獨立證據。

## 驗收與回滾

RED：R19 6 個 R20 新測試均失敗，Chromium 合成 1,402 則中第 1,110 則不可見。GREEN：所有新測試通過、full `npm run check` PASS，Chromium 1280x900／390x844 驗證 700/700/2、命中 1110/1402、來源切換、完整保留 HTML 二次確認、R19 比對交錯、Clear 和 0 出站請求。由於沙盒政策 `file://` 導覽封鎖，使用相同 standalone HTML 於隔離頁面測試，不能當成真人裝置驗證。

後續出現重大回歸，保留 v0.10.8 原 Release 不覆寫；先診斷反證，再決定 rollback/hotfix。
