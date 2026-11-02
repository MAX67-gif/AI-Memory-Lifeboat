# R2 ZIP 路徑覆蓋檢查｜僅為保守的 Metadata Review

Schema `aml.archive-path-assessment.v1`，不代表內容完整性認證。

工具將 ZIP 目錄中列出的檔案路徑與已知訊息結構中的 `metadata.attachments[*].path` / `relative_path` 及含有資產參照的 `content.parts[*].path` / `relative_path` 做**完全一致的相對路徑比對**。同名 basename、不完整路徑、`file-service://`、僅有 file ID 的參照，不會猜成 ZIP 內的某個檔案。

結果欄位：

- `matched_unique_paths`：明確路徑對應唯一 ZIP 目錄項目；**未核對檔案內容／CRC**，不是附件證明。
- `missing_explicit_paths`：明確且安全的路徑在 ZIP 目錄找不到。
- `unverifiable_references`：沒有可移植的明確路徑，不能判斷。
- `ambiguous_paths`：ZIP 中同一路徑重複，不能挑一個就當作正確。
- `unsafe_path_references`：不安全或非相對的路徑，不拿來比對。

其他 ZIP 檔案完全不解壓、不開啟、不解析、不執行；它們可能是非附件，也可能不是完整原件。`conversations.json` 本身會檢查 CRC32，這不能延伸為整份 ZIP 內容完整證明。

Audit JSON 只輸出數量和狀態，不包含照片名稱、對話原文、對話 ID、私有路徑。資料來源仍可能包含未支援欄位，請保留原始備份。


R3 新增選用的附件 CRC32 位元組檢查（`aml.attachment-bytes.v1`），與本頁 R2 路徑檢查是**不同證據級別**。只有已比對唯一且安全的相對路徑才可進入最多 24 項／每項 4 MiB／合計 16 MiB 的限額掃描。CRC32 成功不能證明上傳原始附件同一內容或全部附件存在。完整說明見 [R3 健康指引](HEALTH_AND_BYTE_VERIFICATION.md)。
