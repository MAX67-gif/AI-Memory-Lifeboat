# R23｜真實 Chrome 合成效能證據規格（研究，不是新產品 Release）

**產品基線：R22 / v0.11.1。** 目的不是製造一個跑分，而是補上可重現的「使用者操作到畫面可用」延遲。`tools/profile_offline_performance.js` 僅是 GitHub CI／維護者主動執行的開發工具，**不是離線 HTML 的執行依賴**，也不會將資料寄送出去。R23 保持既有產品版本不變。

## 可重現輸入與環境

- 原創虛構 ChatGPT `mapping`：預設一篇 **1,402 則**目前分支＋200 篇單則對話，與一篇相同 ID、單訊息的虛構替換來源。固定生成順序、內容與原始 JSON SHA-256，從程式原始碼可重建。
- Node.js 22 使用原生 WebSocket 與 CDP；無 npm 執行期套件。真實 headless Chrome 以 `file://` 開啟經 hash CSP 驗證的單檔 HTML；桌面 1280×900 與**模擬手機 viewport** 390×844。非實體手機、真人輸入法、讀屏或 CJK 字型驗收。
- 每個 viewport **1 次暖機＋5 次量測**；每一輪重新載入文檔但重用 Chrome 進程。這是「fresh document／warm browser」，**不是重新開機後冷啟動**。
- 記錄 Chrome 版本、Node、CPU 型號、CPU 邏輯核心、系統 RAM、fixture SHA、各操作逐次毫秒、樣本數、p50、最近名次 p95、最大／最小；`Runtime.getHeapUsage` 的清除後 JS heap 只為抽樣，不得冒稱峰值 RAM。

## 使用者實際動線

1. 匯入完成→本機解析成功、200 列清單與總筆數可用（`importToReadyMs`）。
2. 明確選取→第一段最多 700 則可見（`selectFirstWindowMs`）。
3. 於保留的目前分支搜尋第 1,110 則虛構標記（`findRetainedMessageMs`）。
4. 跳至最後第 N 則，仍至多 700 節點（`crossWindowJumpMs`）。
5. 保留已選內容時更換同 ID 來源，原私密 DOM 與下載資格撤銷（`replaceSourceMs`）。
6. 重新匯入後搜尋另外 200 筆合成標題，仍每頁最多 200（`listQueryMs`）。
7. 清除後已無訊息節點、清單按鈕、可下載私密 HTML（`clearMs`）。

以上每一步以 `performance.now()` 計算到 UI 同步檢查及雙 `requestAnimationFrame`，包含本機解析與更新 DOM 的時間，不包括外部/CDP 通訊等待。失敗、不支援操作、額外出站要求、JS 例外均判為**無法產出 PASS 效能數據**。禁止在報告中儲存使用者真實對話、路徑、原文、搜尋字串、帳號或自動遙測。

## 執行與決策

執行：`node tools/profile_offline_performance.js --chrome google-chrome --output-dir /tmp/aml-r23 --runs 5 --warmup 1`。另可試 `--messages 2804 --fillers 450`（固定壓力情境，僅自願的獨立研究，不拿兩種規模硬比）。專案的 `npm run check`、原 Chrome 38 項 regression **仍須獨立通過**，研究報告不是其替身。

**解讀標準：** N=5 的 nearest-rank p95 就是本次最大值，統計精度有限；跨 GitHub runner、不同 Chrome、CPU、負載、虛擬化環境不可直接歸因；初次建立基準不等於發現效能改善。發現延遲高或不同輪差異，先固定同 SHA/fixture/資源多次重跑，定位操作與可見卡頓，提出反例與失敗錄影／DOM 佐證；只有重現且危及實際操作才建 FIX PR。環境無法啟動（例如瀏覽器安全政策阻止 `file://`）記為 **ENV_BLOCKED**，不可寫成產品 FAIL 或 benchmark PASS。

**安全界線：** 原 R6 ZIP 128 MiB / JSON 64 MiB / 32 shards、R12 原文 HTML 16 MiB、200/80/700 顯示、R18 可見選取租約、R10 私密匯出同意、R13/14 UNKNOWN 全部維持。CI 跑分不驗證真人採用、真實匯出完整性、耗電或行動裝置效能；此輪不升版本號、不改任何正式 release/tag。

## 合併後主線 Chrome 啟動診斷（2026-11-24）

Public PR #23 exact-head 的 Node／reader-browser／synthetic-performance 三項都 PASS；合併 `9f515556919b9a976931bf04a34a7e3dec9053c5` 後，Node 及新效能流程 PASS，但原 reader-browser workflow `45283293386` 出現啟動器 12 秒內未提供 Chrome `DevToolsActivePort` 的 SETUP FAIL。原始 stderr 只有多條 D-Bus 地址解析錯誤，不足以認定 D-Bus 就是根因。這類症狀此前 R22 Release 也出現過，不能歸咎於產品頁面；失敗時**沒有跑到任何瀏覽器產品用例**。

後續在既有 runner 加入啟動階段的獨立等待統計／狀態碼／輪詢次數與固定 **25 秒上限**，保留單次進程、不偷偷 retry、不關閉回歸案例。修補 PR 通過後仍須驗證 main 工作流程；若持續逾時，保留實際 CI 反證，另診斷 Chrome runner，而不是再無條件加時間。研究階段保持 `v0.11.1`，沒有新版 Release。
