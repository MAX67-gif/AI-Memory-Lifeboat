# Format support and verification contract｜格式與驗證邊界

Version: `aml.audit.v1` / App 0.6.0 Sandbox Preview; this document governs the **specific known structures we test**, not undocumented future platform formats.

Input: an array of ChatGPT conversation objects in `conversations.json`. Each supported row has `mapping` (node dictionary) and, for readable history, `current_node`; nodes form a parent chain and can contain `message.author.role`, `message.content.parts`, and timestamps. Strings or text-field parts are readable; other parts are counted as non-text. We display only `user` and `assistant` messages along the actual current parent chain. Deleted/unexported content cannot be reconstructed.

ZIP: a single `conversations.json` (root or subdirectory), **or** consecutive unique `conversations-NNN.json` shards in one directory, starting at `000`, up to 32 parts; never both. No path traversal; STORE or DEFLATE; CRC32 checked per selected JSON entry. Maximum archive 128 MiB, combined selected JSON uncompressed size 64 MiB, core conversation/node ceilings unchanged. ZIP64 and encrypted ZIP unsupported; unsupported ZIP features fail with reason codes. Other ZIP entries are *not* extracted or validated; presence of a named file does not establish that an attachment referenced by a conversation is intact.

Audit schema fields: `schema`, `tool_version`, `source_type`, `account_completeness`, `extraction_scope`, `input_records`, `parsed_records`, `invalid_records`, `total_message_nodes`, `active_visible_messages`, `off_path_message_nodes`, `missing_current_paths`, `attachment_reference_observations`, `non_text_parts_not_rendered`, `warnings`, `issues`, `additional_issues_suppressed`, `zip_entry_count`, `zip_entry_bytes_not_extracted`, `claims_not_made`.

`issues` contain only structure codes and numeric record indices; never copied chat text. `attachment_reference_observations` are heuristic observations, potentially double-counted if a reference appears both in metadata and content, **not a distinct file count**.

Status: `NOT_VERIFIABLE_FROM_EXPORT` for account completeness. No account-level completeness proof, no cross-platform import, no claims of exact fidelity for images/audio, branches, tool messages or attachments. Preserve the original official export.

R2 extensions: `aml.snapshot-diff.v1` (summary only), `aml.archive-path-assessment.v1` (ZIP metadata only). Details: [snapshot comparison](SNAPSHOT_COMPARISON.md) and [archive path assessment](ARCHIVE_PATH_ASSESSMENT.md). `aml.audit.v1` remains unchanged (append-only optional nested `archive_path_assessment`).


R3 adds independent, append-only sidecars `aml.health.v1` and `aml.attachment-bytes.v1`. `aml.audit.v1`, `aml.snapshot-diff.v1`, and `aml.archive-path-assessment.v1` retain previous field meanings. Optional `audit.attachment_byte_assessment` is a scope-limited addition, never a blanket file-integrity verdict. See [R3 guide](HEALTH_AND_BYTE_VERIFICATION.md).

R6 optional audit additions: `source_container` = `SINGLE_JSON` / `NUMBERED_JSON_SHARDS` / `SINGLE_NUMBERED_JSON`; `numbered_json_parts` is a count, **not** a content completeness proof. `health` gains two trusted-only guidance codes `SINGLE_NUMBERED_JSON` and `MULTIPLE_NUMBERED_JSON`. A ZIP that fails shard validation yields no partial success. See [R6 detailed contract](R6_NUMBERED_SHARDS_SUPPORT.md).

## R7 檔案分發與格式相容

R7 新增的是**分發形式**而不是新的匯入格式；單檔 HTML 與原多檔 `index.html` 共用相同 `AMLCore`／`AMLZip`／`AMLCompare`／`AMLHealth`。R6 既有 JSON/ZIP、連號分片、容量、安全拒絕、附件 CRC 與 v1/v2 回饋資料契約保持不變。單一 HTML 內建 hash-based CSP，可在本機使用，仍不能證明全部帳戶資料完整。


## R13｜超長文字範圍（2026-11-09）

截短訊息會明確提示；搜尋與 HTML 只含保留文字，不把前綴相同當成來源完整相同。原始 ZIP/JSON、容量界線、內容匯出確認與本機處理原則不變。詳細加法欄位、未知比較狀態與測試邊界見 [R13_TEXT_TRUNCATION](R13_TEXT_TRUNCATION.md)。

## R14 候選｜標題與閱讀範圍

保留既有上限，明確揭露標題截短與畫面700則範圍；未知標題尾段不等於沒有差異。真人試用延後，GitHub發布狀態另查實際PR／CI／Release。完整契約與限制見 [R14_TITLE_AND_READING_COVERAGE.md](R14_TITLE_AND_READING_COVERAGE.md)。

## R15（2026-11-13）｜有界清單分頁

對話清單新增上一頁／下一頁，每頁最多 200 筆；搜尋涵蓋全部已解析的目前分支內容，不因清單頁面而刪除任何資料。更換來源、清除及搜尋會重置頁次。此功能沒有傳輸資料、新增伺服器、擴張 ZIP／JSON 容量或帳戶完整性保證。詳見 [R15 分頁契約](R15_CONVERSATION_LIST_PAGING.md)。
