# Quick start｜三步開始

1. 在 GitHub 專案首頁使用 **Code → Download ZIP** 下載完整原始碼並解壓。以瀏覽器打開根目錄的 `index.html`。不要在 GitHub 文字原碼畫面期待直接執行。此版本未宣稱已啟用 Pages。
2. 點選首頁的「試用合成示範」，立即展示原創虛構的新舊匯出資料、健康指引與比較結果。想自行選擇假資料也可以使用 `examples/sample-conversations.json`。這是 100% 合成例子，不含任何真實對話。成功後再使用自己的官方匯出，參考 [OpenAI 官方說明](https://help.openai.com/en/articles/7260999-how-do-i-export-my-chatgpt-history-and-data)。
3. 查看讀取範圍，選對話、搜尋；可下載 JSON 檢查報告與**單篇** HTML。請保留最初的完整官方 ZIP。

## What it cannot do

It does **not** restore an AI account, import into a different provider, certify all attachments, or prove complete export coverage. Files containing real conversations are sensitive and must not be submitted to public GitHub Issues or PRs.


R3/R4：載入備份後先讀「下一步怎麼做？」卡片。若是 ZIP 且有明確附件相對路徑，可自行選擇「檢查可比對的 ZIP 附件」，結果只代表少量 ZIP 項目的 CRC32 是否符合。下載健康指引 JSON 不含對話原文；下載單篇 HTML 仍包含原文，請勿上傳公開網站。

R4 新增三題式選用回饋，下載 JSON 並不會自動送出。只有明確自願分享，才會在 GitHub Issues 留下資料；不要提交自己的聊天內容。參閱 [首次使用規格](FIRST_RESULT_PILOT.md)。

## R5｜三個結果捷徑

首次載入合成示範後，結果最上方可直接點選健康、比較、閱讀三個捷徑；可以在健康面板下載純文字摘要。這是示範，不是帳戶備份完成證明。五題本機回饋完全自願，不會自動上傳。

## R6｜ZIP 裡有多個編號的對話 JSON？

先選**整份原始 ZIP**，本工具會在 128 MiB ZIP 與 64 MiB 解壓 JSON 上限內，處理同一資料夾、從 `conversations-000.json` 開始的連續編號分片。只選其中一個編號 JSON 會標記「可能缺少其他分片」。ZIP 缺號或有衝突時，工具會拒絕整份匯入；不能宣稱已經讀完所有紀錄。

## R7｜下載單一離線 HTML（免解壓）

從 [單檔工具頁](../dist/AI_Memory_Lifeboat_Offline.html) 點選 GitHub「Download raw」，下載 `AI_Memory_Lifeboat_Offline.html` 並開啟，即可先以原創假資料體驗。點選「English」可以切換首次任務引導語言。**進階體檢仍主要是繁體中文**，目前無 Pages/Release 正式上線證據；不要誤認單檔通過測試等於整個帳戶已備份。

若 GitHub 檔案下載按鈕不可用，使用 Code → Download ZIP 及內含的 `index.html`。單檔沒有自動上傳、遠端模型、註冊、CDN、遙測；離線 HTML 以 SHA256 CSP 限制內嵌程式執行。使用者如有自己的官方匯出，應自行在瀏覽器內選擇、保留原 ZIP；不要將真實內容提交到 Issue。

## R8｜正式下載的驗收邊界

若 [v0.8.0 Release](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.8.0) 已有離線 HTML 和 SHA256SUMS，即可只下載 HTML 直接使用；若仍 404，不得宣稱 Release 完成，先使用版本庫內的 [單檔 HTML](../dist/AI_Memory_Lifeboat_Offline.html) → Download raw。校驗 SHA256 代表下載位元組與該次發行一致，不能證明使用者的匯出內容或帳戶完整。專案仍未宣稱 GitHub Pages 已上線。
