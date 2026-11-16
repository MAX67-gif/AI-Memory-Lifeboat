# AI Memory Lifeboat R21｜訊息序號跳轉與搜尋命中一致性（2026-11-16）

## A 階段：來源、缺陷、反證及裁決

權威基準：R20 v0.10.9 正式 Release，公開 main `ee2a5752997e8a00cdef3ecdec65d3c319ee6ada`，Git Tree `0d1935c0ba6c5daeee664062dbf311a6a06e067c`。原始程式以 R20 公開 FULL ZIP 直接重建，`npm run check` 基準 **247/247 PASS**。

使用 **1,402 則原創合成 ChatGPT 訊息**在 Chromium R20 本機內容中確實重現：

1. 搜尋兩處命中後，手動切換閱讀段落，`readerHitCursor = -1`；按「上一個命中」使用 `(cursor-1+count)%count`，會選到非預期第一個命中（正確應從未選取狀態跳至最後一個）。
2. 查詢內容修改時雖已重設命中陣列，但已在 DOM 上的 `data-reader-hit=true` 高亮標記仍存在，與「請重新尋找」提示不一致。
3. 長對話的既有有界 700 視窗已可往後閱讀，但沒有直接輸入**訊息序號**的方式，在已知序號時仍需手動翻頁或重新搜尋。

A 裁決：將兩項已重現錯誤列為 P0 修復；新增嚴格序號跳轉（UI-only）為 P1 使用體驗改善。**不改解析器、資料容量、比較核心、輸出權限與隱私宣告**。

## B 階段：輸入／輸出契約

- `readerMessageJump(value,total)`：僅接受符合 `^[1-9][0-9]*$` 的字串、長度不超過 9、總數為正安全整數；回傳 0-based 已保留訊息索引，否則 `null`。嚴禁 `Number('')`、`parseInt('1e3')` 等寬鬆轉型。
- `readerHitStep(count,cursor,delta)`：`delta` 僅 ±1；當 `cursor=-1`（手動換段後尚無作用中命中）時，下一個命中返回 0，上一個返回最後索引；其餘情境在已知結果集合內 wrap。空集合／非法值返回 `null`。
- 跳轉使用原有 `readerWindowForIndex` 和 `renderMessages`，**每次 DOM 渲染最多 700 則**，並聚焦至特定訊息 `section`；ARIA 只公告序號，不重新朗讀整段私密原文。
- 搜尋輸入改變時立即清除舊的 `data-reader-hit`，停用命中導覽並要求重新按「尋找」。
- 手動換段、選取另一個命中與更換來源時重置跳轉提示，避免過時數字殘留；更換選取、備份來源、清除，以及 R18 可見頁撤銷選取時清空全部瞬時搜尋/跳轉狀態。
- 僅限目前選取對話的已保留目前分支；**無法恢復截短尾段、其他分支、附件或已刪除對話**；不進行網路傳輸、localStorage、IndexedDB 或持久化。

## 必須保留的舊契約

R6 ZIP 128 MiB、JSON 64 MiB、32 分片；R10 原文 HTML 二次確認、R12 16 MiB 上限；R13／R14 截短未知，R15 每頁 200 對話，R16／R19 `aml.snapshot-diff.v1` 比對／四類 UNKNOWN，R17 鍵盤，R18 私密選取租約，R20 每段 700。舊 Release tags 和 workflows 不能覆寫。

## 驗收與失敗處理

- **RED**：R20 新增的 8 項 Node 測試為 1 通過／7 失敗；Chromium 實際重現上述前一個命中錯位、舊高亮殘留。
- **GREEN**：R21 8/8，完整 `npm run check`；Chromium 桌面 1280x900／手機 390x844，分段 700／700／2，序號 701／1110／1402、非法序號、搜尋命中及清除、R19 差異交錯、含原文確認、來源切換及 CSP 都必須通過。
- 沙盒隔離 Chromium 載入**同位元組單檔 HTML**，`file://` 的真實使用者裝置驗收未完成，不應冒充真人測試。
- 本輪只有工程結果，不宣稱完整帳戶保存、外部採用或 Codex for Open Source 核准。

## 發布與回滾

完整來源 Blob/SHA256 → Git Tree 與沙盒一致 → 新分支／PR → exact-head CI → 使用 expected_head_sha 合併 → main CI → 獨立 v0.11.0 pinned Release 三資產 → AML-only 私人 PR／main CI；TLS 不動。若失敗，保留 v0.10.9 作為已驗證回退基準，禁止強制推送或覆寫。
