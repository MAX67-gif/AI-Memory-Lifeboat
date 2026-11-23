# R22 / v0.11.1 — 中文輸入與可見鍵盤焦點

## 可重現問題

R21 的 264 項既有 Node 測試通過，仍有三類操作缺陷：組字 Enter 會提前啟動對話內搜尋／訊息序號跳轉；在 200 筆對話清單按 End，焦點雖移到最後一筆，畫面卻未捲至該列；鍵盤操作翻到第一／最後一段時，原按鈕變為停用，焦點掉回 BODY。均由純合成資料在真實 Chrome 重現，並保留失敗的 PR CI 紀錄。

## 操作契約

- `isComposing=true` 或 legacy `keyCode=229` 的 Enter 交由輸入法處理：不 preventDefault、不搜尋、不跳轉、不移焦。
- 選字完成後的正常 Enter 和「尋找／跳轉」原生按鈕維持原有操作。
- ↑／↓／Home／End 只移動當頁最多 200 筆清單焦點；移動後使該列進入可見範圍。Enter／空白仍是明確選取，不自動跨頁。
- 翻段按鈕還可繼續使用時保留焦點；抵達首尾而使目前按鈕停用時，焦點移到新段第一則訊息。重複 Enter 不會意外啟動反方向翻頁。
- 每段最多 700 則，1,402 則仍為 700／700／2。只使用已保留的目前分支文字。
- 改查詢清除舊命中；換對話、來源、讀取失敗、清除及當頁選取失效時撤銷搜尋、跳轉與舊私密下載確認。相同對話 ID 不能讓舊來源取得新來源的確認權限。

## 真實瀏覽器回歸

`tools/verify_reader_browser.js` 使用 Node 22 內建 WebSocket/CDP，直接開啟生成的 `file://` 單檔。開發測試需另有 Chrome；產品本身仍無額外安裝、伺服器或 npm 相依套件。

```sh
node tools/verify_reader_browser.js --chrome /path/to/chrome --output-dir /tmp/aml-reader-evidence
```

`reader-browser.yml` 在 PR 與 main 自動執行桌面 1280×900、手機 390×844 的合成場景，保存每項結果與必要截圖。缺少 Chrome、腳本錯誤或測項失敗均回報失敗，不跳過成成功。驗收涵蓋有界閱讀、組字與普通 Enter、命中跨段、改查詢、換對話、同 ID 換來源、私密下載的取消／新確認／實際 Blob 內容、失敗後清除、出站請求及頁面錯誤。

本輪沙盒沒有可執行的 Chromium，官方下載回 403；實際瀏覽器證據來自 GitHub CI，不能冒稱本機沙盒瀏覽器、真人輸入法、真實手機或螢幕閱讀器聽測通過。手機是 Chrome viewport/touch emulation。

## 相容、安全與發行

保留 ZIP 128 MiB、JSON 64 MiB、32 分片、HTML 16 MiB、R10 二次確認、R13/R14 截短未知、R15 200 列、R16/R19 80 筆差異與四類 UNKNOWN、R18 可見頁選取、R20 700 訊息。Schema 與解析器語意維持，未加入網路、持久化或遙測。

新 v0.11.1 使用獨立 pinned 發行流程，完成 exact-head Node/Chrome、main 與正式三附件 SHA256/ZIP 驗證才視為發布；舊標籤及發行流程保持不可變。回退可使用原 v0.11.0 Release，不強制推送或覆寫歷史。
