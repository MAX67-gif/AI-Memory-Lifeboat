# Security model｜威脅模型與權限

**Trust boundary:** uploaded JSON/ZIP is fully untrusted. The app must never run embedded scripts, navigate archive URLs, or inject user text as HTML. Parsed text is rendered with `textContent`; exported HTML escapes input and adds a restrictive CSP.

**ZIP checks:** EOCD and central-directory bounds, maximum archive size and entry count, safe paths, explicit supported compression, maximum target expansion, target CRC32 and UTF-8 JSON parse. This is not a malware scanner. Unsupported ZIP64/encryption and unknown formats return a reason, rather than pretend to pass.

**Privacy:** local browser processing; no external code, API, telemetry or account login. Downloaded single-conversation HTML contains user content; audit JSON deliberately contains only counts, status codes and record indices. The raw source export remains necessary.

**Availability:** huge JSON and many branches are intentionally bounded; inaccessible or malformed exports fail closed. Future work may use Web Workers and streaming processing after independent benchmarks.

**Proof boundary:** synthetic fixtures and CI prove only tested behavior, not compatibility with all current vendor exports or safe restoration. Real export smoke tests require the user's explicit consent and remain local; never upload private exports to public CI.

R2: no backend or model processing; diff summaries exclude user text/IDs/titles and file names. ZIP matching is strict relative-path metadata, NOT byte integrity. Two large exports may exceed device memory; fail closed rather than silently dropping records.

### R20 長對話分段與搜尋邊界

訊息視窗只是目前分支已保留文字的局部 DOM 呈現。切換 700 訊息的視窗不會執行 ZIP 內的腳本、改變解析器上限或擴大原文匯出權限。搜尋只在使用者點選「尋找」時掃描目前選取對話之已保留訊息；允許查找更多段落，不代表可恢復被截短的尾段、非文字或其它分支。選取或來源改變要撤銷該次搜尋結果；含原文 HTML 仍保持明確確認與 16 MiB 上限。長清單 DOM 不設 aria-live 廣播整段訊息，僅讓工具列狀態單獨公告。

### R21（2026-11-16）｜有界長對話序號跳轉與搜尋狀態

使用已保留的目前分支文字時，新的「跳至第 N 則訊息」只接受嚴格正整數；跳轉定位不會一次渲染超過 700 則。手動換段後上一個／下一個命中以未選取狀態的明確首／尾規則處理；修改查詢會清除舊高亮和命中資格，不得將前次關鍵字或訊息序號寫進報告、localStorage、URL 或網路。請保留 R18 可見頁選取租約、R10 私密下載二次確認、R12 16MiB、R19 UNKNOWN 語意。詳細 SOP 見 `docs/R21_READER_NAVIGATION_CONTRACT.md`。
