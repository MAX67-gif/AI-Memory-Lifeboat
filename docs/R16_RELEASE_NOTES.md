# AI Memory Lifeboat v0.10.5 — Truth-Centered Offline Comparison

- **Accurate uncertainty counts:** UI now includes all four `INCONCLUSIVE_*` comparison states (ID, current path, truncated text, truncated title), with a fixed explanation about the scope.
- **Browse every review result:** the previous 120-row display-only limit is replaced by 80-row pages, with selectable categories (uncertain, changed, only newer, not seen in newer, metadata-only).
- **Local coverage radar and risk filters:** show fixed counts for known title/text truncation, unavailable paths and non-text limits; filter the conversation list for known risk categories while keeping search and 200-row list pagination.
- **Safer UI state:** a selection hidden by a new filter is cleared before a content-bearing HTML export can be requested. New imports, retries and reset revoke stale comparison filters and paging state.
- **No source semantics change:** existing ZIP/JSON parser caps, R13/R14 comparison enums, R10 explicit HTML consent, R12 16 MiB HTML limit and R15 conversation paging remain intact.
- **No new upload, login, telemetry, AI API or hosted account access.** Results are based only on the user's locally selected data; a partial or error-free result never proves a complete ChatGPT backup. Human validation is deferred and no Codex for Open Source acceptance is claimed.

Official distribution includes the single offline HTML, exact release-commit source ZIP and SHA256SUMS. Hashes establish release-byte consistency, not whole-account completeness.
