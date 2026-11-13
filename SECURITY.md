# Security Policy｜安全政策

**v0.3.0 Preview**：這是本機匯出內容閱讀工具，並非數位鑑識、帳戶備份完整性或惡意 ZIP 清除服務。

- 僅在瀏覽器處理使用者主動提供的檔案；沒有執行 ZIP 內的程式、模板或 HTML。
- ZIP 只取出符合預期的 `conversations.json`，限制檔案與解壓大小、拒絕路徑穿越、未知壓縮方法、ZIP64 與加密檔；對 JSON 檢查 CRC32。
- 頁面使用限制性 CSP；對話文字以 `textContent` 顯示，匯出 HTML 轉義使用者文字。
- 不支援的情境回報錯誤或未知，不將錯誤 ZIP 判定為帳戶遺失內容。
- 若要回報漏洞，避免在公開 Issue 留下真實對話、API Key 或 Token；請先提供**不含私密資訊的最小合成重現案例**。

已知限制：大型匯出可能耗費記憶體；少量 ZIP 結構與格式變體未支援；無法證實 ZIP 中附件可用；HTML 成品包含聊天文字，需妥善保存。

R2: ZIP entry names are metadata only; ambiguous/unsafe relative paths fail closed and are not treated as recovered attachments. Do not rely on the comparison to prove missing content was deleted or identical content was fully backed up. The two archives may exhaust memory within the stated per-file limits; never execute their contents.

R3 新增選用的 ZIP 明確路徑附件 CRC32 位元組檢查：只檢查 ZIP 中唯一的檔案項目，每項最多 4 MiB、總計 16 MiB、最多 24 項；拒絕未知壓縮、加密與不安全／重複路徑。資料只在記憶體處理、不執行、不預覽附件。CRC32 並非加密驗證或原始檔來源證明；沒有比對來源 SHA 或驗證所有附件。ZIP 加載可能占用記憶體，不適合所有裝置／容量。

## R4 synthetic first-use and pilot consent

The demo is fully embedded fictional data; CSP `connect-src 'none'` remains. The downloaded pilot receipt is generated from a strict whitelist of three choices; no user-entered free text, content, filenames or identifiers. No automatic telemetry or submission was added. Users who voluntarily post GitHub Issues expose their account identity to GitHub readers. All real exports remain local to the browser.

## R5 無內容結果與自願回饋

R5 純文字摘要只從固定白名單檢查碼和有限計數構成，不會匯入或反射任意原文、路徑與 ID。R5 五題回饋也只使用白名單選項，僅由使用者按下下載才建立本地 JSON，不包含使用者身分或自動追蹤資訊；自行送至 GitHub Issue 仍會公開 GitHub 帳號。下載的單篇 HTML **會包含對話本文**，不能誤當作無敏感內容文件。

## R6 numbered-part safety boundary (2026-11-03, sandbox)

No nested ZIP extraction, no auto-repair, no partial ZIP success. A set of numbered shards must be unique, contiguous from `000`, in one directory, and mutually exclusive with classic `conversations.json`. All selected JSON entries must pass exact local-header checks, DEFLATE/STORE restrictions, UTF-8/JSON validation and ZIP CRC32, within the existing 128 MiB archive and 64 MiB total uncompressed JSON budget; max 32 shards and 30,000 rows. Neither the ZIP file names nor source content are reflected into shareable health guidance. Users must keep the original export; passing these scoped checks does not prove full provider account data.

## R7 單檔分發 CSP／安全保護

`tools/build_standalone.js` 每次讀取原始碼與樣式，產生固定內容的單一 HTML；每個內嵌 JavaScript 與 CSS 各計算 **SHA256 CSP hash**。完整單檔仍用 `default-src 'none'`、`connect-src 'none'`、`form-action 'none'`，沒有 CDN、遠端模型、登入或任意 ZIP 程式碼執行。CI 必須比對所有來源檔與分發單檔的一致性（`npm run build:check`）；合成瀏覽器驗證非外部審計，也不等於部署網站 CSP 已測。

English first-task guide 只保證首次任務文字，進階檢查仍主要是繁體中文。GitHub File 頁面與 raw 下載屬 GitHub 平台網路流程，不能寫成完全沒有任何網路請求。未經使用者同意，本版不開 GitHub Pages 設定。

## R9｜狀態撤銷與測試邊界

R9 新增真實程式 UI 事件序列測試：切換來源、載入失敗、清除、舊版本再次比較、附件 CRC 再檢查失敗及執行中取消。修正隱藏 DOM 留有先前內容及前次檢查結果錯誤沿用問題。不更動 ZIP 解壓規則、單一對話 HTML 的敏感內容性質或 CSP 禁止外連規則。合成測試不是完整帳戶證明。

## R10｜含原文的單篇 HTML 匯出確認

從離線閱讀器下載單篇 HTML 前，瀏覽器會顯示原文敏感提醒，必須再次明確按下確認；取消、Esc、清除及來源切換均撤銷先前的確認。這是減少意外匯出的操作安全防護，**不能阻止使用者主動分享**；下載後的 HTML 含所選對話文字及標題，仍需個人妥善管理。既有健康 JSON/TXT 與稽核報告不含聊天原文，仍可直接下載；無網路 API、模型或遙測。

R12: protect against oversized content-bearing HTML generation (max 16 MiB actual UTF-8 escaped output, no partial export). Keep consent, CSP, local-only processing and bounded ZIP parsing unchanged. This is not a guarantee of memory safety under every browser or that every original message has been rendered.


## R13｜超長文字範圍（2026-11-09）

截短訊息會明確提示；搜尋與 HTML 只含保留文字，不把前綴相同當成來源完整相同。原始 ZIP/JSON、容量界線、內容匯出確認與本機處理原則不變。詳細加法欄位、未知比較狀態與測試邊界見 [R13_TEXT_TRUNCATION](docs/R13_TEXT_TRUNCATION.md)。

## R14 候選｜標題與閱讀範圍

保留既有上限，明確揭露標題截短與畫面700則範圍；未知標題尾段不等於沒有差異。真人試用延後，GitHub發布狀態另查實際PR／CI／Release。完整契約與限制見 [docs/R14_TITLE_AND_READING_COVERAGE.md](docs/R14_TITLE_AND_READING_COVERAGE.md)。

## R15（2026-11-13）｜有界清單分頁

對話清單新增上一頁／下一頁，每頁最多 200 筆；搜尋涵蓋全部已解析的目前分支內容，不因清單頁面而刪除任何資料。更換來源、清除及搜尋會重置頁次。此功能沒有傳輸資料、新增伺服器、擴張 ZIP／JSON 容量或帳戶完整性保證。詳見 [R15 分頁契約](docs/R15_CONVERSATION_LIST_PAGING.md)。


## R16（2026-11-13）｜本機比較結果與範圍真相

R16 將四種無法確定狀態正確計入比較摘要，提供每頁80筆的完整差異清單和類別篩選；對話清單新增本機範圍風險篩選，與原有搜尋及200筆分頁並用。範圍雷達只列本次已解析來源的已知限制數量，絕非完整度分數。所有內容只在記憶體內顯示，下載的比較 JSON 仍不含對話標題或原文；切換來源、清除或變更篩選將撤銷過期下載選取。沒有改解析器容量限制或外連設定。詳見 [R16 比較真相中心](docs/R16_COMPARISON_TRUTH_CENTER.md)。
