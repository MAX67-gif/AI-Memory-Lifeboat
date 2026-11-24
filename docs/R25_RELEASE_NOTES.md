# AI Memory Lifeboat v0.11.2｜R25 對話清單直接跳頁

**正式發行條件：**只有 GitHub R25 exact-head、公開 main Node + 原生 Chrome、Pinned Release workflow 以及 ZIP/HTML/SHA 三件附件均成功後，才能宣稱正式發行。發行前本檔僅是候選內容。

- 超過兩頁時顯示嚴格驗證的對話清單跳頁：例如 30,000 筆合成對話，每頁 200 筆，可直接前往第 150 頁。非法、越界、浮點、科學記號、空格、前置零都拒絕；不會默默跳到錯誤頁。
- 與搜尋、風險篩選串聯；搜尋或篩選改變結果、換來源或清除後，跳頁狀態與錯誤狀態一併重置。
- 使用既有 R18 選取租約：跳頁導致先前選取對話不在本頁，必須清除舊原文 DOM、撤銷 HTML 下載權限，重新選取後再確認才能下載；非法跳頁不擅自取消合法選取。
- 支援繁中 IME 組字期間 Enter，不讓使用者選字被當作跳頁指令；合法 Enter 或前往按鈕才提交。
- 保留 R6 ZIP 128 MiB／JSON 64 MiB／32 shards、R12 HTML 16 MiB、R14 保留文字/UNKNOWN、R15 列表 200、R16 差異 80、R20 閱讀 700、R22 鍵盤焦點。
- 不新增帳戶憑證、遠端同步、遙測、資料外傳或使用者內容收集。真人採用、實體手機／讀屏仍未驗證；合成測試不代表完整帳戶備份。

發行附件固定 `AI_Memory_Lifeboat_Offline.html`、`AI_Memory_Lifeboat_Source_v0.11.2.zip`、`SHA256SUMS.txt`；歷史所有版本與 Release 不覆寫。
