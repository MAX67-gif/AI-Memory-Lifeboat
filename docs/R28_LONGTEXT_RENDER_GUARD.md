# R28｜長文字 Chrome 排版阻塞：A 反證 → B 局部修復

2026-11-25 Asia/Taipei。產品候選 v0.11.4；R27 v0.11.3 已發行，其舊檔與 Tag 必須保持不可變。

## A．保留真實 RED 與找出問題

R26 研究公開 PR #27 的合成 `json-long`：240 則、每則 `R26_SYNTHETIC_LONG_` + 38,500 個 A，匯入成功、240 個 DOM `.message` 成功建立；其後 `Performance.getMetrics` 在真實 GitHub Chrome 三次超過 120 秒。R26 PR #27 保持 OPEN/FAILED，**不能冒稱已被本輪完整修復**。R27 CRC32 改善另有專屬證據，兩個問題不可混同。

此輪在同一沙盒 Chromium/Node，使用**相同產品 JS**、受控合成來源與 about:blank DOM/腳本注入（因本沙盒 `file://` 被管理政策阻擋）比較樣式：240×38,500 的基線約 2.55–2.64s/2rAF，實驗 `content-visibility:auto` 約 0.04–0.08s；240×64K 亦可匯入/選取；第 240 則搜尋命中焦點可見、完整原文 DOM 保留，清除時二次確認對話框與私密 DOM 撤銷。**這是本機排版對照，並非真正 file:// CSP 驗收，也不能直接宣稱使用者速度提高幾倍。**

另有 20、80、120、240 及 701 則 × 8,000、16,000、32,000、38,500、64,000 字的凍結合成矩陣子集合；所有源為原創假資料、SHA256 固定；沒有使用真人備份或任意程式來源。

## B．產品變更僅有一項排版策略

`style.css` 只在 `.conversation-detail .message` 啟用 `content-visibility:auto;contain-intrinsic-size:auto 160px`。這讓離屏卡片延後佈局，沒有刪 DOM、沒有改 `.textContent`、沒有截短、沒有隱藏資料檔、沒有改分段判讀；滾動/鍵盤聚焦時瀏覽器可將目標卡排版。`@media print` 恢復可見排版。無支援時 CSS 被忽略，維持原始功能。

保留 ZIP 128MiB / JSON 64MiB / 32 分片 / 單篇 HTML 輸出 16MiB、`200/80/700` 展開上限、current-path 與 UNKNOWN、R10 私密 HTML 需明確再次同意、清除/來源替換/選取失效立即撤銷資格、無出站資料與嚴格 CSP。CRC32 仍使用已驗證 R27 查表版本。

## GitHub 真正發布前的驗收門檻

1. 精確 PR HEAD：`npm run check` 所有 Node PASS、manifest/生成離線檔 CSP hash parity；R22/R25 原真實 Chrome 閱讀器 44/44 PASS；R24 兩組合成效能 PASS；R27 近 64MiB ZIP 與 CRC 對照 PASS。
2. 新版專屬 `tools/verify_longtext_r28.js` 必須以 GitHub 原生 Chrome `file://` 打開打包的單檔，測桌面 1280×900 / **模擬**手機 390×844：20×8K、80×16K、120×32K、240×38.5K、240×64K、701×8K，240×38.5K 重複三次。驗證相同 viewport、真實載入新文件、每段最多700、完整最後一則、跳轉/搜尋焦點、`Performance.getMetrics` 在有限 15s 有回應、私密下載同意開關、清除不留 DOM、出站0、JS例外0。獨立保留原始 JSON / baseline 反證，不把 baseline FAIL 當 PASS。
3. 只在全數 exact-head SUCCESS 後合併；主線原 CI 與專屬驗證再次 SUCCESS，專屬 pin `v0.11.4` 的 Release 發行工作流程才可用。獨立下載實際三附件、sha256sum/ZIP CRC 驗證。任何失敗則停在 PR，不宣稱正式發布。

**限制：** 此處的 `selectToFrameMs` 含瀏覽器兩幀及排版，不等於 CPU 佔用或物理 GPU 硬體時間。N 小不能推 SLA；模擬手機不等於實體手機，缺失的 R15 私人原父包也不能憑空補出。即使所有 Chrome 合成案例成功，R26 PR #27 舊失敗仍需保留歷史與根因未完全釐清的警告。
