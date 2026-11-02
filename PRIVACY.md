# Privacy｜隱私說明（v0.3.0）

此工具的 JavaScript 在使用者的瀏覽器分頁內處理被主動選入的 ZIP/JSON。程式碼沒有 `fetch`、XHR、WebSocket、登入、分析 SDK、廣告或本專案控制的聊天內容傳輸端點。

- **不自動儲存：** 對話目前保存在分頁記憶體；按「清除」解除本頁引用。這不是保證瀏覽器/作業系統立即覆寫所有記憶體。
- **瀏覽與輸出：** JSON Audit 不含聊天文字；匯出的單篇 HTML **含有原始選定訊息文字**，由使用者自行保護。不要把含真實對話的 HTML／ZIP 貼到公開 GitHub Issue。
- **網頁來源：** 若透過 GitHub Pages 等網站瀏覽，本機需先下載頁面程式資產；網站供應商、裝置或瀏覽器擴充功能可能有獨立記錄／存取。下載後離線開啟可減少網頁請求。
- **第三方連結：** 點選 README/官方匯出指南的外部連結會開啟其他網站；不會由本工具附帶送出對話資料。
- **存取限制：** 此版本不讀取你的 AI 帳戶，無法得知平台端是否尚有其他內容。

如果將來加入雲端 AI 或代管，必須先更新本文件，提出明確同意、資料傳送範圍與可撤銷方式；不得默默改變現在的隱私承諾。

R2: the optional older snapshot is kept temporarily in browser memory for comparison; no localStorage/IndexedDB or network upload. The downloaded diff report contains counts, schema and fixed warnings only, but single-conversation HTML does contain conversation text. Clearing the page releases references; it does not securely erase browser RAM or previously downloaded files.

R3: 健康指引 JSON 僅包含固定文案、狀態碼與數量；不包含聊天內容、對話標題、ID 或附件路徑。選用 CRC32 檢查時，瀏覽器會重新讀取所選 ZIP，在記憶體內有限量解壓可比對項目以驗證 ZIP 內的檔案 CRC32 與宣告尺寸，不送往任何伺服器、不將附件寫入磁碟。檔案內容仍可能短暫留在瀏覽器 RAM；按清除不代表安全抹除已存在的下載檔或 RAM。
