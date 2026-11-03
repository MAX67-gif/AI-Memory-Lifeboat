# R4｜自願試用回饋的資料契約

- Schema：`aml.pilot-feedback.v1`。
- 來源代碼：`SYNTHETIC_DEMO` 或 `PERSONAL_EXPORT`。本欄描述工具當下來源類型，不辨認使用者或帳戶。
- 回饋僅含 `ease`、`clarity`、`reuse` 三個**白名單**枚舉；未填即 `NOT_TESTED`。
- 額外常數為 `tool_version`、`account_completeness=NOT_VERIFIABLE_FROM_EXPORT`、`sharing=USER_DOWNLOAD_ONLY_NOT_SUBMITTED` 與固定隱私旗標。
- 禁止內容：對話內容、標題、ID、路徑、檔名、雜湊、Email、IP、UA、裝置、地點、時間戳、自由填寫內容及附件資料。
- 產生與下載在瀏覽器本地完成，不會自動傳輸。下載後仍由使用者自行審查並決定是否分享；GitHub Issue 會顯示 GitHub 身分，不得稱為匿名。
- 回饋不得被默認成產品已被採用；只有真實且經同意的外部回饋可以進入帶證據的採用帳本。

本契約不代表其他下載檔案都是內容無關：**單篇 HTML 含有完整當前分支文字，應私下保存**；既有 audit/health 可能含計數與固定診斷文案，不應冒充全帳戶完整證明。

## R5 v2（加法、不取代 v1）

新增 `firstTask`、`understandsScope` 兩個固定選項欄位，保持使用者自行下載、檢查與分享；新增 `evidence_status=SELF_REPORTED_NOT_INDEPENDENT_HUMAN_VERIFICATION`。詳見 [R5 文檔](R5_FIRST_RESULT_AND_PILOT_V2.md)。
