# AI Memory Lifeboat｜AI 對話救生艇

[English](README.en.md) · [使用說明](docs/QUICK_START.md) · [隱私](PRIVACY.md) · [安全](SECURITY.md) · [限制與資料契約](docs/FORMAT_SUPPORT.md)

**匯入自己的 ChatGPT 官方資料匯出 ZIP 或 `conversations.json`，在瀏覽器本機檢查可讀的對話、搜尋目前分支、比較兩次匯出、檢查 ZIP 中明確附件路徑、下載檢查報告及單篇 HTML。** 免費、MIT 開源、無帳號、無第三方模型與分析 SDK。

> **v0.2.0 Preview（2026-11-01）。** 這不是完整備份認證：無法證明帳戶所有資料或附件均已匯出、不能還原原平台的對話、記憶、檔案或工具狀態。保留原始官方 ZIP；不要只保留本工具輸出的 HTML。

## 三步開始

1. 從 [GitHub 專案頁](https://github.com/MAX67-gif/AI-Memory-Lifeboat) 選 **Code → Download ZIP**，解壓後開啟根目錄 `index.html`。（專案尚未宣稱 GitHub Pages 已啟用。）
2. 透過 [ChatGPT 官方資料匯出教學](https://help.openai.com/en/articles/7260999-how-do-i-export-my-chatgpt-history-and-data) 取得自己的 ZIP，或準備其中的 `conversations.json`。將檔案選入工具。
3. 查看檢查結果；想比對時再載入較早的匯出檔，查看新增、未見與變動。搜尋對話；需要時下載 **不包含原文的 JSON 檢查報告／差異摘要**或**單篇目前分支 HTML**。

[用合成範例練習](examples/sample-conversations.json) · [新版合成資料](examples/sample-newer.json) · [舊版合成資料](examples/sample-older.json)：此檔全為專案原創假資料，無真實使用者對話。

## V0.2.0 已實作

| 內容 | 目前支持 | 未支持或限制 |
| --- | --- | --- |
| 來源 | ChatGPT `conversations.json` 的已知 mapping/parent/current_node 結構、含單一目標 JSON 的 ZIP | Claude/Gemini 匯入、其他未知結構、ZIP64、加密 ZIP |
| 分支 | 沿 `current_node` 的 parent 鏈顯示目前分支，統計其他訊息節點 | 不在閱讀畫面合併其他分支；絕不假造分支順序 |
| 非文字／附件 | 計數參照與非文字片段並提醒 | 無法確保附件可用、無影像/音訊還原 |
| 雙快照比對 | 依明確且唯一的 ID 比對兩份已匯出資料的目前分支、標題與計數 | 不能證明資料刪除、帳戶相同、所有分支完整或附件位元組一致 |
| ZIP 路徑 | 明確的相對路徑與 ZIP 中唯一檔案項目比對 | 不猜檔名；不驗證其他附件位元組、CRC 或可還原性 |
| 搜尋 | 目前分支的標題與可讀文字，本機執行 | 不搜尋其他分支或非文字內容 |
| 匯出 | 不含聊天原文的 Audit JSON、單篇目前分支 HTML | 不能用這些檔案還原 ChatGPT 帳戶 |
| 大小 | ZIP 最多 128 MiB、其中目標 JSON 最多 64 MiB；JSON 單檔 64 MiB | 大量大型附件的匯出包可能不適用 |

程式以本機瀏覽器執行，沒有網路 API 呼叫，也沒有內建上傳後端。載入網站本身、GitHub Pages 或瀏覽器擴充功能仍可能有各自的網路及權限行為，請閱讀 [PRIVACY](PRIVACY.md)。

## 工程與維護

- Node 20+，不需要 `npm install`：`npm test`、`npm run check`。
- 純函式解析器：`src/core.js`；限額 ZIP 解包：`src/zip.js`；介面：`src/app.js`。
- GitHub Actions：每個 PR 的 `verify` 項目。測試資料**只含合成資料**。
- 參閱 [兩次匯出比對說明](docs/SNAPSHOT_COMPARISON.md)、[附件路徑覆蓋限制](docs/ARCHIVE_PATH_ASSESSMENT.md) 與 [安全模型](docs/SECURITY_MODEL.md)、[範圍與驗收](docs/PRODUCT_SCOPE.md)、[路線圖](docs/ROADMAP.md) 與 [貢獻指南](CONTRIBUTING.md)。

## 協作與誠實標示

需求、真實採用、外部案例與文字品質需另行收集證據；本 Repo 的 CI PASS **不等於**匯出格式長期相容、所有資料可救回或任何開源計畫審核通過。

MIT © 2026 MAX67-gif；第三方平台名稱屬各自權利人，本工具非官方產品，亦非相關 AI 服務商授權的匯入／移轉工具。

**R2 使用建議：** 先用原創合成新舊資料練習，比對完成後保留官方原始 ZIP。差異摘要不包含對話名稱或原文；單篇 HTML 則包含所選對話文字，請勿公開分享。
