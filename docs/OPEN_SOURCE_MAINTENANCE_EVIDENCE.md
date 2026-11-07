# AI Memory Lifeboat — OSS maintenance and verification evidence

> Public and reproducible evidence index. Last checked: 2026-11-07 (Asia/Taipei). This is **not** an adoption report, third-party audit, or endorsement by OpenAI.

## What this public project does

AI Memory Lifeboat is MIT-licensed, local-first browser software for inspecting **supported** ChatGPT data exports. An offline single HTML file enables import of bounded JSON/ZIP sources, including numbered conversation shards, current-branch reading/search, two-export comparison, scoped metadata health guidance, opt-in ZIP CRC32 checks, and explicit confirmation before exporting HTML containing private conversation text.

It **cannot** certify complete account backups, authenticate source attachments, recover missing server-side content, or restore an AI account. Advanced UI remains primarily Traditional Chinese; onboarding includes English. It neither requires an API token nor offers a hosted upload endpoint.

## Reproduce the published build and verification

- Public source: https://github.com/MAX67-gif/AI-Memory-Lifeboat
- Official release: https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.10.0
- Reviewed PR: https://github.com/MAX67-gif/AI-Memory-Lifeboat/pull/10
- Release source commit: `4b82623c20378b5b9c6c9cb1f9f711dd991a0b59`
- Public main verify: https://github.com/MAX67-gif/AI-Memory-Lifeboat/actions/runs/42190725204
- Release workflow: https://github.com/MAX67-gif/AI-Memory-Lifeboat/actions/runs/42190725127
- Automated Node test result in the cited main CI job: **126 tests passed, 0 failed**. These are synthetic and structural tests, not independent real-export compatibility or human adoption studies.

At the released source commit, run `npm run check` with Node.js 20 or newer. The check includes JavaScript syntax, the standalone-source parity check, the public package manifest and Node tests. Compare the official offline HTML and source ZIP with the release's `SHA256SUMS.txt`; SHA256 demonstrates matching release bytes, not complete account export coverage or absence of malware.

## Privacy and security maintenance responsibilities

1. Treat imported ZIP/JSON and all message text as untrusted. No third-party scripts, automatic uploads, user chat fixtures, or credentials in CI.
2. Make unsupported/ambiguous paths, invalid archives, duplicate/missing numbered shards and oversized inputs **fail closed**.
3. Keep content-free reports separate from exports containing user conversation text. The latter require explicit local confirmation, yet a user can still share a downloaded file.
4. Regression-test source switching, stale hidden DOM data, failed retry states, file clearing and intentional HTML export.
5. Verify feature-branch diffs, exact-head PR CI, merged main CI and immutable release assets. Preserve prior releases and security failure records.

Read [Security](../SECURITY.md), [Privacy](../PRIVACY.md), [Contributor guidance](../CONTRIBUTING.md), and [Source instructions](../AGENTS.md) for the current public boundaries.

## Evidence ledger: verified versus not verified

| Category | Evidence status |
| --- | --- |
| Public MIT source and repeatable releases | VERIFIED: repository, v0.8.0/v0.9.0/v0.10.0, SHA256 assets |
| Maintenance / PR / CI | VERIFIED: public commits, PRs, GitHub Actions, cited v0.10.0 main run |
| Synthetic ZIP/JSON privacy regression tests | VERIFIED for named scenarios, not blanket safety |
| Real people using their own ChatGPT exports | NOT VERIFIED / pilot deferred |
| External repositories depending on this tool | NOT VERIFIED |
| Broad usage, monthly users, downloads by unique persons | NOT VERIFIED |
| Codex for Open Source approval | NOT VERIFIED |
| Complete account recovery or restoration | NOT A FEATURE |

Stars, forks, release download counters and workflows are time-sensitive. Review them live on GitHub rather than citing numbers copied into static docs. Release downloads are **not** unique users, and a CI green check is **not** proof of real-world adoption.

## Current maintenance priorities (no unverified product expansion)

- Keep the R10 privacy and archive robustness regression suite reproducible.
- Accept and triage user reports only as sanitized, synthetic reproductions; real chat exports are never required in public issues.
- Improve accessibility and cross-browser compatibility based on verifiable failures.
- Conduct consent-based first-use studies and honest comparison with existing viewers later, when ready. Until then, report adoption as UNKNOWN, not zero proven users.
- For any use of Codex or API credits, scope requests to **public OSS code, synthetic fixtures, issue triage and CI/release checks**. Keep real user content and private Project Brain entirely out of prompts and hosted evaluation.

## 中文摘要（臺灣）

這份公開證據索引提供審查者核對專案是否持續維護、如何重跑測試、有哪些真實 Release、以及哪些能力仍無法證實。本專案不聲稱已得到外部採用或 Codex for Open Source 入選。使用者真人試用依維護規劃延後；**不得以 126 項合成測試冒充真人測試、不得把下載次數視為不重複使用者**。所有真實對話由使用者保存在本機，不納入 GitHub PR、Issue、AI 評測或 CI。
