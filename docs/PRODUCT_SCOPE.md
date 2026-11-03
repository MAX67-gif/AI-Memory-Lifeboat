# Product scope and acceptance｜MVP

**Primary task:** An ordinary person with a supported official ChatGPT export can inspect basic structural warnings, search their current-path text, and save a readable single-conversation HTML without installing a code environment.

**Chosen variant:** Local static web interface (no account, no backend) + deterministic parser; not a second ChatGPT client, not a cloud backup service.

**Alternative A:** generic all-provider converter — rejected for V0.1 (format claims/long-term upkeep unproven). **Alternative B:** cloud sync with AI summaries — rejected (privacy, costs, consent, API lock-in). **Alternative C:** local export verifier — accepted (testable, bounded, re-usable).

**Acceptance:** synthetic valid JSON and store/deflate ZIP load; wrong structures, broken chains, cycles, zip-slip, bad CRC and invalid JSON signal failures; content-free audit; HTML escaping; clear privacy; desktop/mobile screen reads; public GitHub PR and CI evidence separate from real-user adoption.

**Non-goals:** account restoration, all-media export, missing message recovery, deduced branch reconstruction, live authentication, automatic cloud AI, Telegram/Discord bots, paid sync, upload of private datasets or fabricated usage metrics.

## R7 First-Task Gateway 範圍

完整工具可產生單一離線 HTML：來源為同版 `index.html`、`style.css`、`src/*.js`，不使用第三方代碼。預設無聊天資料且可一鍵載入合成示範。首次任務支援 English／繁體中文兩種引導；其他 UI 以繁中為主，絕不宣稱完全英文化。單檔可檢查自己明確選取的官方匯出，受 R6 所有限制約束。GitHub Pages/Release 是否可用，須以實際 GitHub 狀態另查，不能推定。
