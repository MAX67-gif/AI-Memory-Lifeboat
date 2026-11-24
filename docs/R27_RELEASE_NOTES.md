# AI Memory LifeBoat v0.11.3｜大 ZIP CRC32 效能優化與相容性驗證

這是從 v0.11.2 延伸的**內部 ZIP CRC32 計算優化**。使用固定原創合成資料研究發現，接近 64 MiB JSON 的 ZIP 匯入會造成約 2.6 秒長任務。此版以 256 項 IEEE CRC32 查表取代舊的每位元迴圈；輸出 CRC32 完全一致、故意毀損的 ZIP 仍拒絕。速度須以實際 GitHub Chrome／不同裝置環境各別實測，不能宣稱所有使用者都會有相同倍數的提升。

**延續既有功能與界線：**對話列表直接跳頁、IME 中文選字保護、每頁 200／差異 80／閱讀段 700、ZIP 128 MiB／JSON 64 MiB／最多 32 shards、單篇含原文 HTML 16 MiB 限額與二次確認、來源切換撤銷、離線 strict CSP、目前分支與 UNKNOWN 皆維持原意。沒有帳戶還原、全對話備份完整性認證、雲端同步或使用者資料上傳。

僅在原 SHA/parity/Node/Chrome/R24+R26 研究與獨立 Release publisher 成功後正式發布。舊 v0.11.2 與所有歷史 Release 不覆蓋。真人匯出、實體手機、螢幕閱讀器驗證仍待使用者重新啟動；Codex for Open Source 核准狀態未知。
