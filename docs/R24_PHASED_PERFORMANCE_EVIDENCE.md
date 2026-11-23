# R24｜離線長對話效能分階段量測與新頁面守門（研究專用）

**產品不升版：**正式發行仍為 R22 / v0.11.1。本輪只更動開發測試工具與 GitHub Actions；不更動 `src/`、離線 HTML、匯入限制、JSON schema、個資處理、匯出同意或發布工作流程。

## A：既有證據的反證

R23 GitHub Chrome 合成研究（固定 1,402 訊息＋200 篇）許多結果為約 33.3ms。因量測含連續兩個 `requestAnimationFrame`，結果含固定畫格排程等待，不能解讀為 33.3ms 純解析或 JavaScript CPU 耗時。N=5 的 nearest-rank p95 = 當次最大值，不能作為廣泛用戶 SLA；JS heap after clear 也不是記憶體峰值。

另一個測試可信度風險是連續對同一 `file://` URL 執行 `Page.navigate` 時，若只查 `document.readyState` 與 DOM 元素，有可能把上一輪尚未離開的頁面當成新頁面。R23 CI PASS 不代表此情境已反證。

## B：最小可驗收改進

1. **分階段計時**：保留既有 `rows[].timingsMs` 和 `summary`（操作開始到兩幀後，語意不變）；額外記錄 `rows[].phaseTimingsMs[action]` 的 `actionToStateReadyMs`、`frameWaitMs`、`actionToFrameMs`。前者包含操作函式與必要非同步 UI 狀態等待，不等於純 CPU；後者等於舊指標；中者為兩幀排程時間，不等於 paint workload。新 `phaseSummary[action][phase]` 皆記 N、median、nearest-rank p95、min、max。
2. **新文件判定**：每次 `Page.navigate` 前清除已觀察 loader，強制取得 `nav.loaderId`，必須觀察到對應 `Page.frameNavigated`，並確認新頁 DOM 完成後才開始量測。缺失或逾時直接 FAIL，不准回用舊頁面或重啟偷過。
3. **兩組固定情境**：原始基準 1,402 訊息＋200 fillers；較重壓力 7,000 訊息＋1,200 fillers；各自在真實 GitHub Chrome 跑桌面 1280×900／模擬手機 390×844，每 viewport 1 warmup + 5 measured；獨立 CI matrix／原始 JSON／錯誤證據附件，避免不同大小資料互相覆蓋。
4. **原安全邊界**：不用真實個人對話、不得對外發請求、不得新加執行期依賴；原正式版 HTML 原 bytes 不變。

## 驗證及不能宣稱的事情

- 每個 matrix job 先 `npm run check`，驗證 Node、單檔 CSP／檔案 manifest parity；主線既有 reader-browser CI 38 項必須另行 PASS。
- CI 原始報告需要含 `environment`、`fixture` SHA、`rows[].phaseTimingsMs`、`phaseSummary`、`networkRequestsBlocked=0`、`javascriptErrors=0`。出站請求或 JS exception 即 FAIL。
- 7,000/1,200 情境**不是** 64MiB JSON、128MiB ZIP、32 shards 的極限測試；任何壓測結果不能證明容量上限、實體手機速度、真人採用、螢幕閱讀器、完整帳號備份或峰值 RAM。
- 如果 stress 相對 baseline 顯著變慢，先同一 commit 與同一 fixture 多次重跑，再分析實際操作節點；不以一次負載或跨 VM 差異直接改產品核心。
- R23 `v1` 研究報告 schema 與舊欄位保留，新欄位均為追加式；外部消費者應忽略未知欄位。產品 JSON 契約完全不變。

**發布閘門：**只在 GitHub PR exact-head 的 Node、reader-browser、baseline/stress 四個工作全部 SUCCESS 後合併，合併後再次查 main；未達標就保持 PR，不發新版。
