# AI Memory Lifeboat｜AI 對話救生艇

## 最新：R9 v0.9.0｜狀態安全修正與正式離線下載

**主要修正：**清除或切換備份來源時，立即從隱藏畫面移除先前的對話標題、訊息、差異清單與健康結果；重新比較或重驗附件時，先撤銷前次結果，避免失敗後仍顯示過期結論。R6 ZIP／JSON 解析與資料格式契約沒有擴張。

**正式下載入口（需以 GitHub Release 實際發布成功為準）：** [R9 v0.9.0 Release](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.9.0) → `AI_Memory_Lifeboat_Offline.html`。如未出現，請繼續使用已確認的 [v0.8.0 正式 Release](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.8.0)，不要相信不存在的下載頁。兩個版本都不需登入或 API Token；下載後在自己的瀏覽器開啟，保留原始官方 ZIP。

**安全邊界：**清除是移除本頁的程式引用與畫面內容，**不代表覆寫瀏覽器記憶體或刪除先前下載的檔案**。單篇 HTML 含對話原文，不能當成無敏感內容的報告。檢查通過不代表全部帳戶或附件已完整匯出。沒有真人採用或 Codex for Open Source 入選證據。詳見 [R9 修正驗收](docs/R9_UI_STATE_AND_PRIVACY.md)。

---

## 最新版下載｜R8 v0.8.0 離線版

**目標：只下載一個 HTML 就能試用。** GitHub 正式 Release 完成後，可從 [R8 離線下載頁](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.8.0) 選擇 `AI_Memory_Lifeboat_Offline.html`，下載後在瀏覽器直接開啟；另附 `SHA256SUMS.txt` 校驗下載檔與公開完整原始碼 ZIP。**若上述 Release 頁尚未出現，表示發布流程尚未成功，請勿把它當作已上線**；請改從 [公開版本的單檔 HTML](dist/AI_Memory_Lifeboat_Offline.html) 使用 GitHub 的 **Download raw**。

不需要帳號、API Token、Node.js、伺服器，先點選「試用合成示範」。進階介面目前主要為繁體中文，只有首次使用引導提供英文。工具不證明帳戶完整性，個人的官方匯出檔不會自動上傳；請保留來源 ZIP。沒有任何真人採用或 OpenAI Codex for Open Source 入選保證。


## 前版里程碑｜R7 離線單檔（不需安裝或解壓整個專案）

**[取得單一 HTML 工具：AI_Memory_Lifeboat_Offline.html](dist/AI_Memory_Lifeboat_Offline.html)**：開啟檔案頁後，選 **Download raw（下載原始檔）**，儲存後以瀏覽器開啟。這份約 100 KB 的完整工具已內嵌與本 Repo 同源的 JavaScript、CSS 與 SHA256 型 CSP，**不需 Node、帳號、API Token、伺服器或個人資料就能先體驗合成示範**。開啟後可切換英文／繁中「首次任務引導」。進階檢查畫面目前仍以繁中為主，並非完整英文版。

如果無法下載單檔，既有 **Code → Download ZIP → 解壓 → index.html** 路徑仍保留。GitHub Pages 與正式 GitHub Release 尚未經核對啟用；本段不提供虛構的託管網址。**所有示範為原創假資料，備份檢查不能證明帳戶完整。**

**R7 歷史工程預覽：v0.7.0（R7 B）**。已驗證的原始碼與測試以公開 GitHub Commit／CI 為準，不將使用者試用或 OpenAI 開源計畫申請結果視為已完成。

[English](README.en.md) · [使用說明](docs/QUICK_START.md) · [隱私](PRIVACY.md) · [安全](SECURITY.md) · [限制與資料契約](docs/FORMAT_SUPPORT.md)

**匯入自己的 ChatGPT 官方資料匯出 ZIP、`conversations.json`，或 ZIP 中連續編號的 `conversations-000.json` 等分片，在瀏覽器本機檢查可讀的對話、搜尋目前分支、比較兩次匯出、檢查 ZIP 中明確附件路徑、選擇性檢查小型附件 CRC32、查看下一步健康指引，下載檢查報告及單篇 HTML。** 免費、MIT 開源、無帳號、無第三方模型與分析 SDK。

> **R6 歷史里程碑（v0.6.0；2026-11-03）。** 這不是完整備份認證：無法證明帳戶所有資料或附件均已匯出、不能還原原平台的對話、記憶、檔案或工具狀態。保留原始官方 ZIP；不要只保留本工具輸出的 HTML。

## 三步開始

**首次體驗：**解壓、開啟 `index.html`，先按「試用合成示範」，再按三個導覽捷徑；可下載不含聊天內容的純文字健康摘要。不必提供自己的聊天資料；合成示範不算真人採用或帳戶驗證。詳細見 [R5 第一次結果與自願回饋](docs/R5_FIRST_RESULT_AND_PILOT_V2.md)。

1. 從 [GitHub 專案頁](https://github.com/MAX67-gif/AI-Memory-Lifeboat) 選 **Code → Download ZIP**，解壓後開啟根目錄 `index.html`。（專案尚未宣稱 GitHub Pages 已啟用。）
2. 透過 [ChatGPT 官方資料匯出教學](https://help.openai.com/en/articles/7260999-how-do-i-export-my-chatgpt-history-and-data) 取得自己的 ZIP，或準備其中的 `conversations.json`。若你的 ZIP 包含 `conversations-000.json` 等編號分片，請保留**整份 ZIP** 一次匯入，不要只挑其中一個檔案。將檔案選入工具。
3. 查看健康指引和已檢查的範圍；ZIP 來源有明確附件路徑時可選擇執行有限 CRC32 檢查。想比對時再載入較早的匯出檔，查看新增、未見與變動。搜尋對話；需要時下載 **不包含原文的 JSON 檢查報告／差異摘要**或**單篇目前分支 HTML**。

[用合成範例練習](examples/sample-conversations.json) · [新版合成資料](examples/sample-newer.json) · [舊版合成資料](examples/sample-older.json)：此檔全為專案原創假資料，無真實使用者對話。

## 延續自 R6 的功能範圍

| 內容 | 目前支持 | 未支持或限制 |
| --- | --- | --- |
| 來源 | ChatGPT `conversations.json` 與 ZIP 內連續編號 JSON（含已知 mapping/parent/current_node 結構） | Claude/Gemini 匯入、其他未知結構、ZIP64、加密 ZIP |
| 分支 | 沿 `current_node` 的 parent 鏈顯示目前分支，統計其他訊息節點 | 不在閱讀畫面合併其他分支；絕不假造分支順序 |
| 非文字／附件 | 計數參照與非文字片段並提醒 | 無法確保附件可用、無影像/音訊還原 |
| 雙快照比對 | 依明確且唯一的 ID 比對兩份已匯出資料的目前分支、標題與計數 | 不能證明資料刪除、帳戶相同、所有分支完整或附件位元組一致 |
| ZIP 路徑 | 明確的相對路徑與 ZIP 中唯一檔案項目比對 | 不猜檔名；路徑存在不等於內容完整 |
| 選用 CRC32 | 明確且唯一的 ZIP 附件路徑中，最多 24 個項目／每項 4 MiB／合計 16 MiB，檢查 ZIP 內部 CRC32 與尺寸 | 不證明來源附件相同；不核對全部檔案；CRC32 非加密安全驗證 |
| 健康指引 | 從結構警告、路徑、選用位元組檢查和快照差異產生固定指引；可下載不含原文的 JSON 或純文字摘要 TXT | 不是完整性、安全或可還原性證書 |
| 合成試用 | 首頁一鍵載入兩份原創合成對話，展示健康指引、差異與搜尋 | 絕非個人帳戶體檢或真人使用紀錄 |
| 自願回饋 | 本機下載 5 道固定選項的 v2 JSON；沒有自動傳送、未收集原文；保留 v1 格式相容 | 實際提交須由使用者自行決定，且先檢查檔案 |
| 搜尋 | 目前分支的標題與可讀文字，本機執行 | 不搜尋其他分支或非文字內容 |
| 匯出 | 不含聊天原文的 Audit JSON、單篇目前分支 HTML | 不能用這些檔案還原 ChatGPT 帳戶 |
| 大小 | ZIP 最多 128 MiB，單檔或編號分片合計解壓 JSON 最多 64 MiB；最多 32 份分片；JSON 單檔 64 MiB | 大量大型附件的匯出包可能不適用 |

程式以本機瀏覽器執行，沒有網路 API 呼叫，也沒有內建上傳後端。載入網站本身、GitHub Pages 或瀏覽器擴充功能仍可能有各自的網路及權限行為，請閱讀 [PRIVACY](PRIVACY.md)。

## 工程與維護

- Node 20+，不需要 `npm install`：`npm test`、`npm run check`。
- 純函式解析器：`src/core.js`；限額 ZIP 檢查：`src/zip.js`；健康指引：`src/health.js`；合成示範：`src/demo.js`；回饋白名單：`src/pilot.js`（既有 v1）、`src/pilot_r5.js`（v2）、`src/first_result.js`（純文字摘要）；介面：`src/app.js`。
- **R5**：加上結果導覽、純文字健康摘要、5 題可選擇的自述回饋（非真人完成證據）；詳見 [R5 使用與研究邊界](docs/R5_FIRST_RESULT_AND_PILOT_V2.md)。
- GitHub Actions：每個 PR 的 `verify` 項目。測試資料**只含合成資料**。
- 參閱 [R3 健康指引與限額 CRC32 檢查](docs/HEALTH_AND_BYTE_VERIFICATION.md)、[兩次匯出比對說明](docs/SNAPSHOT_COMPARISON.md)、[附件路徑覆蓋限制](docs/ARCHIVE_PATH_ASSESSMENT.md) 與 [安全模型](docs/SECURITY_MODEL.md)、[範圍與驗收](docs/PRODUCT_SCOPE.md)、[路線圖](docs/ROADMAP.md) 與 [貢獻指南](CONTRIBUTING.md)、[無個資回饋契約](docs/PILOT_PRIVACY_CONTRACT.md)。

## 協作與誠實標示

需求、真實採用、外部案例與文字品質需另行收集證據；本 Repo 的 CI PASS **不等於**匯出格式長期相容、所有資料可救回或任何開源計畫審核通過。

MIT © 2026 MAX67-gif；第三方平台名稱屬各自權利人，本工具非官方產品，亦非相關 AI 服務商授權的匯入／移轉工具。

**使用建議：** 先用原創合成新舊資料練習，比對完成後保留官方原始 ZIP。差異摘要不包含對話名稱或原文；單篇 HTML 則包含所選對話文字，請勿公開分享。

## R6｜已編號分片的有界離線匯入

OpenAI 官方文件明示較大的匯出可能包含多個編號對話 JSON。R6 在既有單一 `conversations.json` 之外，新增 ZIP 內 **同一目錄、從 000 開始、連號且不重複** 的 `conversations-NNN.json`（最長三位，最多 32 份），將所有合法分片一併檢查。超出 64 MiB 解壓 JSON 合計或 128 MiB ZIP 的資料會明確拒絕，**不會只讀第一份偷偷少算**。

只匯入**一個**編號 JSON 時，健康指引會標「尚未確認其他分片」。格式錯誤、缺號、重複、混用單檔與分片、CRC 錯誤均回報無法匯入。此功能沒有增加任何雲端 API、追蹤 SDK 或上傳機制；不代表所有真正的大型匯出都在容量範圍內。

本版的公開原始碼交付須以 GitHub main、PR 與 CI 的實際結果確認；獨立 GitHub Release、Pages、真人正式資料覆蓋率均需另外驗證。詳見 [R6 多分片匯入與安全邊界](docs/R6_NUMBERED_SHARDS_SUPPORT.md)。

[下載原創編號 ZIP 測試範例](examples/synthetic-numbered-export.zip)；該檔完全虛構，僅供確認 R6 匯入操作，不代表任何真實資料。
