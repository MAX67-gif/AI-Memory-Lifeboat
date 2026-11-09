# R13｜截短文字可見性與保守比較契約

## 範圍
既有單訊息上限 2,000,000 UTF-16 code units 保留。這是 JavaScript 字串的長度單位，不是 UTF-8 bytes、字數或完整 grapheme。僅在已核對 current-path 的 user/assistant 可見訊息計數；其他分支、隱藏角色、附件、標題的 500 單位上限及平台未匯出內容仍未完整檢查。

多個 string／object.text parts 依原邏輯以 newline 連接。只建立有限前綴並計算來源長度，避免再次建立無界 joined 字串。若界線恰好切開合法 surrogate pair，少留一個 UTF-16 單位，保持該 pair 不被分割；不保證不拆開複合 emoji 或結合字元。

## 加法式輸出
Schema 名稱保持 `aml.audit.v1`、`aml.health.v1`、`aml.snapshot-diff.v1`；pilot v1/v2 原始生成器不變。新版 tool_version 如實標為 0.10.2。

每則可見訊息新增：`textTruncated`、`sourceTextCodeUnits`、`retainedTextCodeUnits`、`omittedTextCodeUnits`。對話新增 `truncatedVisibleMessages`、`omittedTextCodeUnits`。
Audit 新增 `text_limit_code_units`、`text_length_unit=UTF16_CODE_UNITS`、`text_truncation_scope=VISIBLE_USER_ASSISTANT_CURRENT_PATH_ONLY`、`truncated_visible_messages`、`truncated_conversations`、`omitted_text_code_units` 與固定警告 `VISIBLE_MESSAGE_TEXT_TRUNCATED`。只包含計數/固定代碼，不包含原文、ID、標題、檔名或路徑。

Health 新增 `TEXT_TRUNCATED`，優先級 REVIEW；有截短內容時不顯示 LIMITED_CHECK_OK。TXT formatter 只映射固定白名單字句，拒絕反射外來文案。

比較狀態新增 `INCONCLUSIVE_TEXT`，適用兩個唯一明確 ID 且路徑有效的紀錄，只要任何一側可見文字被截短就不對省略尾段推論相同/不同。既有 ID 不明、路徑無效與只在一份匯出出現的判斷優先；原有 enum 字串不刪改。摘要新增 `text_truncation_detected_in_inputs` 與固定警告 `TRUNCATED_TEXT_NOT_FULLY_COMPARABLE`。下游需容忍新增狀態；未支援者應回報 unknown，不視為無差異。

## 閱讀、搜尋、HTML
每則截短訊息在畫面和下載 HTML 顯示固定警告。搜尋只查保留前綴；找不到尾段不是資料不存在。700 則畫面呈現限制不變；HTML 可含其餘保留訊息，但不含已略去的尾段。仍須 R10 明確同意，且 16 MiB 實際 HTML UTF-8 bytes 上限維持，超限完全拒絕。

## 驗收與邊界
測試涵蓋 exact-limit/overflow、multi-parts newline、fallback text、surrogate pair、off-path、hidden roles、兩份快照省略尾段差異、來源切換與清除、報告無原文、R12 HTML cap。皆為原創合成資料，不代表真實帳戶完整或真人採用。保留原始官方 ZIP／JSON。
