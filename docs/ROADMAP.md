# Roadmap｜證據優先而非版本堆疊

**V0.1 (prior release):** supported ChatGPT ZIP/JSON, deterministic audit, local reading/export, synthetic security tests and docs. No claim of real adoption.

**Next Gate — real-world validation:** only with volunteered testers, ask them to process their own files locally and return sanitized observations (task completed, unsupported format, no transcript). Compare with official export + existing open-source viewers; record total user effort, repeat usage and critical issues. No automatic telemetry.

**R2 completed scope:** two user-selected export comparison and conservative ZIP path metadata review; synthetic tests only.

**V0.3 completed scope (synthetic engineering validation):** deterministic, content-free priority/action health cards and an optional capped ZIP attachment byte CRC32 check. Not a recovery guarantee or source authentication.

**V0.4 engineering scope:** add a one-click fictional demo and content-free optional pilot feedback export; both tested synthetically. External human trial results remain NOT_COLLECTED. **Next proof gate:** independently observe actual first-task completion and comprehension; improve accessibility and unsupported-export diagnostics only from real evidence. Consider larger ZIP streaming and additional vendor formats only after owned fixtures and clear technical evidence. No default cloud upload.

**Stop/pivot:** if users prefer existing readers, critical errors remain, or maintainers do not adopt checks, contribute improvements upstream rather than keep a redundant project.

**Codex for Open Source:** no acceptance probability claim; first collect verifiable use, external contributions and sustained maintainer activity. Application is separate from software quality and availability.

## R5 後的證據門檻

R5 已提供純文字可讀結果、簡單導航與自述回饋 v2。真人獨立試用仍為 `NOT_COLLECTED`；優先取得知情同意下的 5 位外部測試者、保留未完成與不理解限制的情況，再決定格式擴張。不可把自述結果直接當成獨立試驗成績或 OpenAI Codex for Open Source 入選證據。

## R6 sandbox scope and decision gate

OpenAI's documented numbered ChatGPT export variant is supported in a **bounded experimental ZIP path** with explicit fail-closed behavior. Before public release: verify this against synthetic ZIP adversarial cases plus real-browser controls; only independent opt-in users may assess true-export compatibility on their own devices. ZIP64, nested ZIPs, large archives beyond the existing caps, and alternate providers remain unsupported. Do not treat R6 engineering checks as external adoption.

## R7｜A/B First-Task Gateway

A：判斷主要障礙是新手從 GitHub 首次使用的繁瑣，而非缺乏其他 AI 格式。B：先以單一可攜 HTML 與中英文首次任務引導完成可測能力；不擅自打開 GitHub Pages 設定或宣稱正式 Release。B 工程合成測試不能取代 5 位自願一般使用者的 T1／T2；真實完成、回訪、競品同任務對照依舊 `NOT_COLLECTED`。後續功能需由這些外部結果決定。

## R8｜離線正式交付（2026-11-06）

首要消除下載及信任門檻：限 R8 version change 的 main push 對應公開 Release；PR 先全套 npm check，Release job 再二次檢查、精準 git archive、SHA256SUMS 和 ZIP CRC。發行失敗時維持公開 source 並誠實標示，禁止跳過 Action 或覆寫 tag。核心 ZIP/parser 不變。接下來優先試用者 5 人與競品公平任務測試，而非增加另一個格式。

## R9（2026-11-06）｜狀態可靠性，非新平台擴張

R9 針對既有 UI 跨來源切換、清除及檢查重試，消除先前結果的殘留風險，增加真實應用事件測試。保留 R8 的正式 Release 不覆寫，R9 以獨立審閱的單次發布流程取得 PR/CI/Release 證據。下個關卡依然是自願真人首用與現有 Viewer 公平對照；沒有外部證據不增加 Claude/Gemini/ZIP64。

## R10｜敏感檔案匯出確認

在一鍵離線工具已有可用下載的基礎上，R10 收斂於避免把含聊天內容的 HTML 誤認為安全摘要：加入本機確認、取消與來源切換撤銷，使用合成資料測試。此功能與使用者自行分享決定無關；無真人試用證據前不應把 R10 當 Codex for Open Source 競爭力提升證明。下一優先仍是五名知情同意的真實使用者首用測試與同任務競品對照；使用者原文不得上傳 GitHub。

R12 (2026-11-07): Prioritize a bounded, privacy-safe single-conversation HTML export to avoid oversized browser output. Verified synthetic RED-before-GREEN tests; actual cross-device volunteer work remains postponed. Future research candidate: report existing parser per-message text normalization truncation clearly without implying complete archive restoration. Do not expand AI providers or silent background upload.
