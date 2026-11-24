# R26｜大型來源、32 分片與近 64 MiB JSON 的本機安全／效能反證

**產品固定：v0.11.2。** 本次只新增維護者主動執行的 **Node 原創合成產生器＋Chrome file:// 探針＋CI 與文件**，不修改正式產品 `src/`、`index.html`、`style.css`、`dist/`、格式限制、匯出授權或 Release。CI 和本機沙盒的原始跑分不可直接當成客戶可達效能。

## A｜需求與原始假設

前版 R24 僅以 293 KiB / 1,402 訊息與較大筆數但不含大字串的合成資料測量。這不能證明單一大 JSON、多 ZIP 分片或接近 64 MiB 上限時的操作安全性。R26 先測真正可讀的合法與非法輸入，不調整程式參數來讓特定案例過關。

三種預先凍結的正例：

| 原創來源 | 內部資料 | 測試目的 |
|---|---|---|
| `json-long` | 單一 JSON，240 則長文字訊息，約 9 MiB | 壓文字量與單篇閱讀、解析後記憶體、清除 |
| `zip-32` | 32 個 `conversations-000.json` … `031.json`，800 篇對話，每篇 6 則 | 驗證合法最大分片數與累計結果、每頁只顯示 200 則 |
| `zip-near-limit` | ZIP deflate-raw 裡約 **63.75 MiB** 單一 JSON、40 則大文字 | 極高壓但仍低於 64 MiB 的解壓、CRC、解析與可視化；不超出正式上限 |

反例：對 JSON 建立 **64 MiB +1 位元組** 的稀疏檔，必須拒絕；對 ZIP 建立 33 個連續分片，必須拒絕。**拒絕後舊對話文字、清單與正在等待使用者確認的含原文下載授權必須全部撤銷**；拒絕和清除不能自動記為「備份完整」。ZIP CRC32 不是密碼學真實性保證。

所有內容為固定字元與虛構 ID；實際 fixture bytes SHA256、大小、文件版本與環境保存在報告中，但 **fixture 檔本身不作 CI artifact、不存入 GitHub**。最大 64 MiB 輸入在 runner 的暫存目錄生成、測完刪除；任何使用者對話原文、個人檔案路徑和詢問字串不可進入報告。

## B｜驗證契約

`node tools/profile_import_boundaries_r26.js --chrome google-chrome --kind zip-32 --output-dir /tmp/aml-r26 --runs 3 --warmup 1`。每種來源在桌面 1280×900 與 **390×844 模擬 viewport** 獨立驗證；每 viewport 1 warmup、3 次測量，每次重新載入並核對新的 `loaderId`。使用 CDP `DOM.setFileInputFiles` 從真實合成檔觸發瀏覽器的本地匯入流程，而非在頁面塞入假通過狀態。

- 匯入成功：檢查 `.ok`、精確的對話數量、清單不逾 200、選取後可見訊息數量正確；抽查選取後需明確確認原文 HTML，不能默默下載。
- 負例：在原文下載的二次確認對話框已開啟時重新載入非法來源；驗證 `.error`、舊訊息節點與清單=0、結果隱藏、原文下載 disabled、對話框已關。
- 記錄輸入 change 到 `.ok` 狀態、兩畫格後 UI、`PerformanceObserver('longtask')` 可用與否／長任務數量，以及 `Runtime.getHeapUsage` 在讀取前／讀取後／選取後／清除後的樣本值。
- `maxSampledHeapUsedBytes` 只是 **四個時間點的最大樣本值**，**不是 JS heap 真正歷史峰值，更不是 Chrome 總 RSS**。不能宣稱已完成精確 peak RAM 量測；若需要真峰值，必須另做獨立 tracing／instrumentation 並標出多進程與共享記憶體偏差。
- CI 產物需保存 raw 逐次資料與 fixture SHA；N=3 nearest rank p95 = 最大值，不能宣稱典型 95 百分位；不同 runner、Chrome 版本及負載不可直接做改善率推論。
- 若沙盒瀏覽器政策阻擋 `file://`，標為 **ENV_BLOCKED**；不能當產品解析失敗。若 CI Chrome 初始化未到 DevTools endpoint，25 秒內 fail closed，保留 `startup` 診斷，絕不無限重啟。

## 停損／非二元決策

- **RESEARCH / NO_CHANGE：**全套合法/非法案例通過，只有環境抖動／合成跑分變化 → 不升正式產品，記錄 raw。
- **FIX：**在相同 commit + fixture + 資源條件可重現頁面卡住、敏感資料殘留、超過 DOM 預算或匯入錯誤 → 用 RED 反例→最小補丁→ Node + Chrome 原有 44 項 + R24 雙矩陣 + R26 三矩陣→ main 驗收；不得變更 UNKNOWN 或縮小既有保留文字來源。
- **DEFER：**真實手機、真人輸入法、讀屏與真實匯出完整性仍缺外部驗收，不得拿 CI 代替。
- **CANCEL：**要求雲端上傳、開放外部 CDN/API、擴大 128 MiB ZIP/64 MiB JSON/32 分片/16 MiB HTML、取消二次同意，均不在本輪範圍。

正式 R25／v0.11.2 Release 原位且 immutable；本輪僅研究基建，不新開公開 tag。完成後應同步私人 AML 專屬 Project Brain，TLS/Taiwan-LLM 共享根物件不得更動。
