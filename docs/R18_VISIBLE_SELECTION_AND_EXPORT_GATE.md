# AI Memory Lifeboat R18｜跨頁選取保護與含原文下載資格

版本：0.10.7；2026-11-15；權威來源：R17 v0.10.6 正式 Release 與 main Git Tree。

## A 階段反證與決策

用 421 筆**全合成** ChatGPT 對話建立 200／200／21 三頁，R17 在第一頁選取對話，按下一頁後列表中不再有 `aria-current=true`，右側仍顯示上一頁原文，含原文 HTML 下載按鈕仍可使用。這可能讓使用者誤判匯出的是當前頁的對話。原有測試 206／206 通過並未覆蓋這個跨操作序列。

A 裁決：不增加其他 AI 平台、不提高 ZIP／JSON／HTML 限額、不新增網路與遙測；僅修復 **visible-page selection lease（目前可見頁選取資格）**。

## B 階段唯一行為契約

- 只要選取對話仍實際存在於**目前頁面**之中，原有內容與明確確認下載不受干擾。
- 換頁、搜尋或風險篩選使選取對話離開目前頁面，立即撤銷 `pendingSensitiveExport`、設置 `selected=null`、停用含原文 HTML 按鈕，從 DOM 清空上一個對話的閱讀細節並提供明確提示。
- 不依賴相同標題／ID 猜測選取目標；使用本次解析出的對話物件參照核對。新備份會重設所有相關狀態。
- 空結果、非法索引、非現存物件與錯誤型別採 `false`，不默認為仍允許匯出。
- 換頁後重新明確選取當頁對話，才重新開放含原文下載且仍必須通過 R10 二次確認。
- 保留 R17 ↑／↓／Home／End 鍵盤導覽，R15 每頁最多 200 筆，R16 比對四類不確定狀態及差異 80 筆分頁；沒有跨頁自動選取。

## 驗收與風險

Node Red/Green 與完整 `npm run check`；完全合成 421 筆 Browser Chromium（桌面 1280px／手機 390px），測量換頁、篩選、搜尋、空結果、重新選取、確認下載和清除的權限。重新建立 deterministic standalone 和 SHA256 Manifest；公開 PR exact-head CI 與 Release、私人 Project Brain 封存分開驗收。

不聲稱真人採用、完整帳戶備份、`file://` 真實使用者裝置驗收，Codex OSS 仍只有使用者回報送件。

## 回滾與相容

保留 v0.10.6 舊 Release；本輪不刪舊 Schema，不增加伺服器或修改 TLS 私人資料。如果 R18 CI 或 Release 失敗，舊版保持正式版，新版僅為候選。
