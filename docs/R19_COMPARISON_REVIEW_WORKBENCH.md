# AI Memory Lifeboat R19｜差異審閱工作台工程與安全契約（2026-11-16）

## A — 原始碼證據、反證與裁決

從正式 R18 v0.10.7 Public FULL ZIP、Git Tree `d7d9e5b47daa3dbc80945d388822589112c721cb` 接續；217/217 Node 回歸通過。現有比較系統可逐頁讀取 80 筆、五種篩選及四類 UNKNOWN 合計，這些不是錯誤，無證據應修改正式結果判斷。

操作弱點：所有未知都集中 UNKNOWN 一組，缺少定位未知原因的獨立入口；241+ 的長列表只能反覆點下一頁，且不能從本機列表搜尋對話名稱；原差異 JSON 摘要雖不含標題，但非技術使用者難直接依分類知道下一步。

**A 裁決：B 階段提供讀取層與人工審閱指引，保留現有 Comparison Schema/Canonical 結果、無網路、無雲端、不修正假設性 bugs。**

## B — 具體功能與安全

1. `src/view_filters.js` 增加 `UNKNOWN_PATH`,`UNKNOWN_ID`,`UNKNOWN_TEXT`,`UNKNOWN_TITLE` 篩選，但 UNKNOWN 合併語意、順序與既有 ALL/NEW/NOT_SEEN/DIFFERENCES/METADATA 全部保留。
2. 差異名稱搜尋僅作用於 `compared.items` 的本機畫面，不進行標題模糊身份配對，不寫入摘要／TXT；保留全量 80 筆分頁，搜尋與類別疊加後重新計算頁數。
3. 直接跳頁的輸入必須是數字 1-based 整數字串，不能接受空白、`1e2`、小數、超範圍或隱式強制轉型；不改其他導航，只有三頁以上顯示跳頁。
4. `formatReviewGuide(summary)` 唯一輸入為 summary，輸出固定類別名稱、保守警語、經安全數值檢查的計數；不得反射 `.title/.items/.id/.warnings/.query` 或文字內容。TXT 由使用者手動下載，不自動上傳；分類數字仍可能敏感。
5. 每次替換新/舊備份、重新比較、解析失敗或 Clear，立即清除搜尋字串、跳頁內容、未知計數及舊差異 DOM，防止跨來源資料殘留。
6. SHA 來源、主源 `index.html` 與單檔 `dist`、CSP、原有 R6 ZIP/JSON 限額、R10 私密 HTML 同意、R12 16MiB 防截斷、R13/R14 未知路由、R15/R16 有界列表、R17/R18 鍵盤／匯出撤銷一律保留。

## 測試、失敗與已知限制

全部使用合成資料及 Node/Chromium 回歸；對 241+ 差異、四種 UNKNOWN、搜尋、跳頁、報告隱私、清空、換舊檔、跨頁等做反例。 `npm run check` 必須全數 PASS，另外驗證 Git Tree/完整 Release SHA。沙盒的隔離頁面測試不是實際使用者 `file://` 裝置測試。沒有真人或外部採用證據，不預測 Codex for Open Source 錄取結果。

## 回滾

新版本必須獨立 v0.10.8 Tag，保留全部 R8~R18 pinned Release。失敗時保留 v0.10.7 正式版，不降低 GitHub CI 安全守門、不強制推送或覆寫。
