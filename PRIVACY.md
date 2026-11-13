# Privacy｜隱私說明（v0.4.0）

此工具的 JavaScript 在使用者的瀏覽器分頁內處理被主動選入的 ZIP/JSON。程式碼沒有 `fetch`、XHR、WebSocket、登入、分析 SDK、廣告或本專案控制的聊天內容傳輸端點。

- **不自動儲存：** 對話目前保存在分頁記憶體；按「清除」解除本頁引用。這不是保證瀏覽器/作業系統立即覆寫所有記憶體。
- **瀏覽與輸出：** JSON Audit 不含聊天文字；匯出的單篇 HTML **含有原始選定訊息文字**，由使用者自行保護。不要把含真實對話的 HTML／ZIP 貼到公開 GitHub Issue。
- **網頁來源：** 若透過 GitHub Pages 等網站瀏覽，本機需先下載頁面程式資產；網站供應商、裝置或瀏覽器擴充功能可能有獨立記錄／存取。下載後離線開啟可減少網頁請求。
- **第三方連結：** 點選 README/官方匯出指南的外部連結會開啟其他網站；不會由本工具附帶送出對話資料。
- **存取限制：** 此版本不讀取你的 AI 帳戶，無法得知平台端是否尚有其他內容。

如果將來加入雲端 AI 或代管，必須先更新本文件，提出明確同意、資料傳送範圍與可撤銷方式；不得默默改變現在的隱私承諾。

R2: the optional older snapshot is kept temporarily in browser memory for comparison; no localStorage/IndexedDB or network upload. The downloaded diff report contains counts, schema and fixed warnings only, but single-conversation HTML does contain conversation text. Clearing the page releases references; it does not securely erase browser RAM or previously downloaded files.

R3: 健康指引 JSON 僅包含固定文案、狀態碼與數量；不包含聊天內容、對話標題、ID 或附件路徑。選用 CRC32 檢查時，瀏覽器會重新讀取所選 ZIP，在記憶體內有限量解壓可比對項目以驗證 ZIP 內的檔案 CRC32 與宣告尺寸，不送往任何伺服器、不將附件寫入磁碟。檔案內容仍可能短暫留在瀏覽器 RAM；按清除不代表安全抹除已存在的下載檔或 RAM。

R4: `src/demo.js` only includes original synthetic examples. The optional pilot receipt contains only three fixed-choice answers and a synthetic/personal source mode, with no arbitrary input strings, chat data, paths, titles, IDs, timestamps or automatic network submission. Downloading an opt-in JSON locally does not send anything to us. **If you manually post a GitHub Issue, your GitHub identity is public.** Never upload your real export to Issue or PR.

## R5 無內容結果與自願回饋

R5 純文字摘要只從固定白名單檢查碼和有限計數構成，不會匯入或反射任意原文、路徑與 ID。R5 五題回饋也只使用白名單選項，僅由使用者按下下載才建立本地 JSON，不包含使用者身分或自動追蹤資訊；自行送至 GitHub Issue 仍會公開 GitHub 帳號。下載的單篇 HTML **會包含對話本文**，不能誤當作無敏感內容文件。

## R7 單檔離線使用／首次任務

單一 HTML 內嵌原始碼和樣式，可在使用者裝置本機操作。**在 GitHub 下載檔案本身需要連網**，GitHub 與瀏覽器／外掛可有各自記錄；下載後本工具本身不執行對話傳輸。SHA256 CSP 是單檔內部執行限制，不是數位簽章或來源身分保證。體驗前先載入原創合成資料；如果使用者選擇真實匯出，會留在本機分頁記憶體，不自動提交。仍須妥善保護從工具下載的含聊天原文 HTML。

## R9｜換檔與清除的資料隔離

換檔、清除與解析失敗均會移除先前顯示在 DOM 的對話文字、標題、差異、健康指引；重新進行有限 CRC 時會先撤銷前次檢查的報告。以上只處理網頁程式可控制的內容與引用，**不能保證實體記憶體已安全抹除、其他分頁已清除或先前下載檔已刪除**。單篇 HTML 仍可能包含原文。

## R10｜有內容檔案的下載提醒與明確同意

單篇對話 HTML 仍包含標題、所選目前分支文字，是敏感檔案。按下載後須於本機確認視窗再次選擇；取消、Esc、清除資料與更換匯出檔都不會允許過期確認繼續下載。僅減少誤操作，**不能保證檔案安全、回收已下載內容或抹除 RAM**。不含聊天原文的健康報告、稽核 JSON/TXT 維持原本的直接本機下載。沒有背景傳輸或同意事件的自動記錄。

R12 (v0.10.1): A single-conversation HTML larger than 16 MiB after UTF-8 encoding and HTML escaping is refused before download. The failure message is fixed text only; no conversation content is logged or transmitted. This does not securely erase memory or downloaded files, and existing single-message normalization limits are unchanged.


## R13｜超長文字範圍（2026-11-09）

截短訊息會明確提示；搜尋與 HTML 只含保留文字，不把前綴相同當成來源完整相同。原始 ZIP/JSON、容量界線、內容匯出確認與本機處理原則不變。詳細加法欄位、未知比較狀態與測試邊界見 [R13_TEXT_TRUNCATION](docs/R13_TEXT_TRUNCATION.md)。

## R14 候選｜標題與閱讀範圍

保留既有上限，明確揭露標題截短與畫面700則範圍；未知標題尾段不等於沒有差異。真人試用延後，GitHub發布狀態另查實際PR／CI／Release。完整契約與限制見 [docs/R14_TITLE_AND_READING_COVERAGE.md](docs/R14_TITLE_AND_READING_COVERAGE.md)。

## R15（2026-11-13）｜有界清單分頁

對話清單新增上一頁／下一頁，每頁最多 200 筆；搜尋涵蓋全部已解析的目前分支內容，不因清單頁面而刪除任何資料。更換來源、清除及搜尋會重置頁次。此功能沒有傳輸資料、新增伺服器、擴張 ZIP／JSON 容量或帳戶完整性保證。詳見 [R15 分頁契約](docs/R15_CONVERSATION_LIST_PAGING.md)。


## R16（2026-11-13）｜本機比較結果與範圍真相

R16 將四種無法確定狀態正確計入比較摘要，提供每頁80筆的完整差異清單和類別篩選；對話清單新增本機範圍風險篩選，與原有搜尋及200筆分頁並用。範圍雷達只列本次已解析來源的已知限制數量，絕非完整度分數。所有內容只在記憶體內顯示，下載的比較 JSON 仍不含對話標題或原文；切換來源、清除或變更篩選將撤銷過期下載選取。沒有改解析器容量限制或外連設定。詳見 [R16 比較真相中心](docs/R16_COMPARISON_TRUTH_CENTER.md)。
