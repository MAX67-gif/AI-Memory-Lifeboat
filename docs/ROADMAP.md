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
