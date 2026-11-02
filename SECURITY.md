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
