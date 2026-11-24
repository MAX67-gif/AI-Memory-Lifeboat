# R27｜CRC32 熱路徑驗證與可回退修復證據

正式產品版本候選 `v0.11.3`。R26 的 3 次×2 viewport 63.75 MiB 合成 ZIP 真實 Chrome 實測，匯入至狀態 ready 中位數約 2.66 秒，觀察到約 2.6 秒 Long Task。此現象可重現，但應分清壓縮、解壓、CRC、JSON.parse 和 DOM；**不可憑單次總耗時認定全由 CRC 造成**。

## A｜獨立原始碼熱點隔離

在固定 66,846,698 bytes 的原創資料，比對舊 `crc32` 的逐位元 8 次迴圈與查表式 IEEE CRC32：**完全相同 CRC32 `128265700`**。同一沙盒 Node 22 的 CRC-only 範例：舊約 `2808 ms`、新查表／索引式約 `159 ms`；同一合成 ZIP 新建兩個獨立 Node 程序，舊 `getConversationsJson` 約 `3151–3779 ms`、新約 `503–724 ms`。僅是此環境中、相同資料的實驗結果，尚需正式 GitHub Chrome 跨版本再次驗證，不宣稱每個使用者都會有相同加速倍數。

## B｜最小修正與不變契約

只把 `src/zip.js` 的 CRC32 換為**私有 256 項 IEEE CRC32 lookup table**。輸入為 bytes，輸出仍為未帶符號 32-bit CRC32；保留舊版對 `Uint8Array`、`Buffer`、普通陣列、其它 iterable 的支援。不改 ZIP central/local header 確認、CRC mismatch 拒絕、DEFLATE 方法、ZIP64 拒絕及單一 JSON／多分片容量。

嚴格保留：ZIP 128 MiB、JSON 64 MiB、編號分片 32、原文 HTML 16 MiB；清單 200、比對 80、閱讀段 700；R10 含原文下載二次確認與 R18 選取頁租約；R13/R14 截短 UNKNOWN；strict CSP `connect-src 'none'`；沒有雲端、API、使用者原文或遙測。發布版只能從 GitHub main 的 pinned v0.11.3 publisher 發行，舊 v0.11.2 tag/Release 附件永遠保留。

## 反證與回歸

1. `tests/test_r27_crc_parity.js` 以 `123456789` 公知 CRC32、固定種子的 0..262144 bytes、普通 array／iterable、63.75 MiB 巨型合法 JSON 比對舊算法；檢查刻意竄改 ZIP central CRC 時仍 **ZIP_CRC_MISMATCH**。
2. `npm run check`：Node／CRC 反證、既有原始碼與離線 CSP／Manifest 一致性全部通過；獨立驗證 Chrome reader 44 項、R24 兩組與 **R26 已確認成功的近 64 MiB ZIP（含非法來源撤銷）**。R26 另一個 9 MiB／240 則長文字 JSON 目前有可重現的 CDP stall，**本輪不宣稱它通過，也不把它混入 v0.11.3 發行通過條件**；詳 `docs/R26_JSON_LONG_UNRESOLVED.md` 與未合併 PR #27。
3. `tools/bench_crc_r27.js` 用同一份 synthetic source、交替測舊/新，保留逐次值、版本、環境；沒有硬性速度閘門，避免 CI VM jitter 造成 false FAIL。
4. 只有精確 PR-head 和合併後 main 成功、Release CI 三附件實際出現並 SHA256/ZIP CRC 驗證，才可宣稱正式發布。R26 研究中 `json-long` CDP `Runtime.getHeapUsage` 逾時必須另行追溯，不因 CRC 改善被抹去。

## 改版裁決

若 Node/Chrome 功能回歸或 CRC parity 有任何 mismatch → **BLOCK / NO RELEASE**。如只有 Chrome 開機或 CDP 工具出錯 → ENV / DIAGNOSE，不得偽稱 app PASS；若性能改善可重播、所有資料安全回歸全通過 → **PROMOTE v0.11.3**。實體手機、真人 IME、讀屏、使用者匯出完整性仍沒有獨立驗證。
