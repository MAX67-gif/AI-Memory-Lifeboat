# R3 備份健康指引與選用 ZIP 附件位元組檢查

版本：v0.3.0 Preview｜研究／工程驗證，不是備份完整性認證。

## 健康指引 `aml.health.v1`

匯入官方 ChatGPT 匯出的 `conversations.json` 或 ZIP 後，依已知結構檢查產生固定的下一步指引：`ATTENTION`（發現需要處理的問題）、`REVIEW`（有限範圍需人工核對）、`LIMITED_CHECK_OK`（已支援範圍未見問題）。三者均不是「帳戶完整備份」、「安全」或「可以還原」的證明。

輸出 JSON 只含固定 code、title、action、狀態與計數，不含用戶原文、對話名稱、對話 ID、附件名稱或路徑。結果屬一般備份提醒，不是專業鑑識。

當兩次匯出有差異，只顯示在兩份匯出資料之間觀察到的變動。`NOT_IN_NEW_EXPORT` **不是**刪除證據。

## 選用 CRC32 檢查 `aml.attachment-bytes.v1`

僅 ZIP 含有可識別且唯一的附件相對路徑時顯示可用。由使用者主動點選後，重新在瀏覽器記憶體讀取 ZIP，驗證最多 **24 項**、每項原始解壓內容 **4 MiB 以下**、累計 **16 MiB 以下**。支援 STORE／DEFLATE，檢查 ZIP local/central header、宣告大小和 CRC32。超過容量、未知壓縮、加密、不安全或重複路徑，不會被算成成功。

結果區分 `bytes_crc32_verified`（ZIP 內部 CRC 相符）、`failed_integrity`（ZIP 內部檢查失敗）、`skipped_size`／`skipped_budget`／`skipped_method`／`skipped_unsafe`。數量可能是零，不必為滿足測試而假造成功。

**嚴格限制：** CRC32 不具備密碼學來源認證能力；ZIP 項目 CRC32 相符也不能證明它與當初上傳的附件位元組相同、未經人為修改、全部附件已匯出，或可以還原任何帳戶。沒有讀取 ZIP 之外的檔案，也沒有主動傳送內容到伺服器。瀏覽器記憶體／磁碟空間限制仍存在。

## 使用者建議

1. 永遠保留官方原始 ZIP／JSON；不要只保存衍生的 HTML／JSON 報告。
2. 看到 ATTENTION，先保留原檔、避免認定已完整備份，視來源重新匯出或回報匿名合成測例。
3. 看到 REVIEW，依卡片分辨是未呈現分支、非文字內容、參照尚未驗證，或兩次匯出需要人工核對。
4. 使用選用 CRC32 檢查時，只用於判讀本次 ZIP 內少量對應項目的完整性；不能延伸為全備份成功。

## 開源工程契約與測試

- 純函式 `src/health.js` 僅吃 `aml.audit.v1`、選用 `aml.snapshot-diff.v1` 和 `aml.attachment-bytes.v1`。
- 核心掃描 `src/zip.js` 的 `verifyMatchedAttachments` 僅接收使用者明確檔案位元組與受限候選路徑，不會執行附件或將內容返回。
- `src/core.js` 的 `listUniqueExactAttachmentPaths` 只在瀏覽器內返回路徑給驗證器；下載報告不得輸出路徑。
- 測試檔案全是原創合成，不使用真人聊天紀錄。
