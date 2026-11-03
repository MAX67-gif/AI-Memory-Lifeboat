# AI Memory Lifeboat R6｜編號對話 JSON 分片匯入與安全契約

**狀態：2026-11-03 沙盒驗證完成；公開原始碼請以 GitHub main／PR／CI 查核。獨立 GitHub Release 與真人官方匯出覆蓋率未驗證。**

## 為什麼新增
OpenAI 官方幫助中心說明：較大 ChatGPT 匯出可能有多個編號的對話 JSON。R4/R5 只辨識 `conversations.json`，會回報找不到或讓使用者額外處理。

來源：[官方跨帳戶匯出說明](https://help.openai.com/en/articles/9106926-transfer-exported-conversations-between-chatgpt-accounts)、[官方資料匯出說明](https://help.openai.com/en/articles/7260999-exporting-your-chatgpt-history-and-data)。

## R6 最小能力與接受條件

- 輸入：維持完整 ZIP 或單一 JSON，處理都在瀏覽器記憶體，沒有登入／遠端模型／追蹤 SDK。
- 完整 ZIP 可接受一個 `conversations.json`（舊格式），或者**一組**同目錄 `conversations-000.json`、`conversations-001.json`……（三位數、從零開始、無缺號無重複）。
- 上限：ZIP 最多 128 MiB；選中 JSON 解壓總量不超過 64 MiB；最多 32 個編號分片；合計不超過 30,000 對話，核心訊息節點上限 350,000 未放寬。
- 每個 JSON 必須是陣列，且 local header／central directory、CRC、解壓大小與 JSON 結構符合本版可用規則。
- 缺分片、重複、不同資料夾、混合單檔與分片、CRC 不合、超額、未知壓縮法：**拒絕整份匯入，沒有部分成功**。
- 單獨開啟 `conversations-NNN.json` 時仍可有限檢查，但**強制提示可能有其他尚未載入的分片**；不要回報全份 ZIP 的狀態。

## 開發者輸出契約

`aml.audit.v1` 採**加法**欄位 `source_container`（單檔、編號分片、單一編號 JSON）與 `numbered_json_parts` 數量。`aml.health.v1` 新增 `SINGLE_NUMBERED_JSON`（需人工核對）及 `MULTIPLE_NUMBERED_JSON`（資訊）狀態。既有報告欄位、v1/v2 試用回饋 schema 與 R3 CRC32 契約不變。報告不輸出實際分片路徑、聊天 ID 或原文。

## 測試與反證

僅使用自己產生的原創合成假資料測試：舊單檔、STORE、DEFLATE、兩分片逆序、同目錄、多目錄、缺號、重複、混用、超限、無效 JSON、CRC 損壞與 ID 重複。需同時測試 Chrome/Chromium 的 ZIP 選擇、結果面板、健康摘要與手機版面。

**不可誤用**：R6 即使完全通過合成測試，也不能證明 OpenAI 已完整匯出帳戶所有資料、分片之外無其他內容、附件完整，或能跨帳戶還原。遇到不支援變體時，仍應保留原始 ZIP，不應勉強自動修復。

## 可追溯的失敗條件

ZIP 錯誤碼包含 `MISSING_JSON_SHARD`、`DUPLICATE_JSON_SHARD`、`AMBIGUOUS_JSON_SOURCES`、`MULTIPLE_SHARD_DIRECTORIES`、`TOO_MANY_JSON_SHARDS`、`JSON_SHARDS_TOO_LARGE`、`EXPECTED_CONVERSATIONS_ARRAY`、`CRC_MISMATCH` 等。API/格式變動應用獨立測試案例驗證，不能只把限制加大或漏掉錯誤分片。
