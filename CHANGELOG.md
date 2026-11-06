# Changelog

## v0.10.0 — 2026-11-06

- Add a keyboard-accessible, native HTML confirmation step before exporting single-conversation HTML containing chat text and titles.
- Cancel, Escape, clear, source switch and selected-conversation changes revoke any pending sensitive export; previously direct content-free reports remain one click.
- Preserve v0.9.0 source parsing, ZIP caps, comparison, user privacy, generated single-file CSP parity, and v1/v2 pilot schemas.
- Add red/green public DOM behavior tests and real-browser synthetic checks. No evidence of full account backup or independent real-user adoption is claimed.
- Publish only from canonical GitHub main using a separate pinned, non-overwriting R10 release workflow.

## v0.9.0 — 2026-11-06

- Scrub hidden DOM content and old result summaries on clear, source replacement, and invalid JSON/ZIP replacement.
- Revoke stale comparison output as soon as a different older export is selected, including while the new comparison is pending.
- Revoke previous ZIP CRC32 results before retry; a failed retry cannot leave the previous successful result in health JSON.
- Fix `.git` worktree file inclusion in the generated package manifest without altering original release history.
- Preserve ChatGPT parser/ZIP caps, R4/R5 pilot schema semantics, local-only CSP and R8 release immutability.
- Add 7 browser-app public DOM regression tests plus a separately pinned v0.9.0 one-time release workflow.
- Engineering success does **not** establish real-user adoption, a complete account backup, or selection by OpenAI.

## v0.7.0 Preview — 2026-11-03

- Deliver deterministic, dependency-free single-file offline inspector (`dist/AI_Memory_Lifeboat_Offline.html`); users can download one HTML from GitHub without extracting the entire source repository.
- Add bilingual zh-TW/en first-task gateway to the same inspector; do not claim full English advanced UI.
- Build hashed inline-script/style Content Security Policy without `unsafe-inline`, remote assets, telemetry or upload endpoints.
- Preserve R6 ZIP/JSON shard limits, both existing offline workflows and privacy-preserving v1/v2 pilot schemas.
- Test source/distribution parity and Chromium offline synthetic tasks; no claims of verified GitHub Pages, formal Release, real-user adoption, account completeness or Codex selection.

# Changelog

## v0.6.0 Preview — first sandbox validation 2026-11-03 (source publication requires GitHub CI)

- Add bounded recognition of consecutive numbered `conversations-NNN.json` shards inside a ZIP, preserving the single `conversations.json` workflow.
- Reject missing, duplicate, mixed, mismatched-directory, oversized and corrupted shards without silently dropping records.
- Warn when a user opens one numbered JSON outside its collection; indicate number of recognized shards without echoing paths in shareable reports.
- Add synthetic adversarial tests. No account completeness, attachment authenticity, external pilot/adoption or public Release is claimed.

## v0.5.0 Preview — 2026-11-02

- Added result-navigation anchors and a content-free plain-text first-result summary with strict trusted-only wording.
- Added voluntary five-choice v2 feedback without transmitting personal content or inferred adoption results; v1 remains unchanged for compatibility.
- Added negative security, accessibility and backward-compatibility tests. No real-user study or official Release claimed.


## v0.4.0 Preview — 2026-11-02

- Add a **one-click, entirely synthetic** first-use walkthrough for health guidance, local searching and two-export comparison; clearly label that it does not inspect any personal account.
- Add an optional 3-question **local-only feedback receipt** (`aml.pilot-feedback.v1`): strict enumerated values, no free text, filenames, IDs, device info or timestamps, and **no automatic submission**.
- Add bilingual onboarding, the first-user pilot protocol, privacy contract, GitHub voluntary issue form and synthetic negative/adversarial tests.
- Preserve R3 attachment byte checks, health guidance and R2 comparisons; no new provider credentials, network calls or hidden telemetry.
- **No verified human participation/adoption yet.** Synthetic and browser tests do not count as real-user evidence.

## v0.3.0 Preview — 2026-11-02

- Add deterministic, content-free `aml.health.v1` user guidance with attention/review/limited-scope statuses and clear next actions.
- Add optional on-demand, bounded CRC32/size checks for exact, unique ZIP attachment paths (`aml.attachment-bytes.v1`). Never treat CRC32 as authenticity or complete backup evidence.
- Keep R2 snapshot comparison, metadata-only path assessment, offline search, individual HTML export, privacy and legacy audit schemas.
- Add negative, privacy and ZIP-adversarial tests; no account restoration or cloud features.

## v0.2.0 Preview — 2026-11-01

- Added optional offline comparison of two user-selected ChatGPT exports. Never infer account deletion from a missing conversation ID.
- Added conservative ZIP central-directory vs explicit relative attachment-path assessment, without extracting attachment bytes or guessing by filenames.
- Added synthetic two-export fixtures, schema docs, privacy guards and browser-level checks.
- Retained existing v0.1.0 reading/searching/HTML export; no cloud AI, telemetry or account restoration.

## 0.1.0-preview — 2026-11-01

Initial offline-first proof of concept: ChatGPT `conversations.json`/ZIP import, bounded ZIP decompression and CRC, current-path graph reading, off-branch/non-text/attachment-reference warnings, local search, JSON audit and single-conversation HTML export. Bilingual getting-started documentation; MIT; test suite and GitHub Actions verification.

**Not a general backup solution:** no account completeness certification, non-text restoration, remote sync, model API, or live user-adoption evidence.

## v0.8.0 Preview / R8 — 2026-11-06

- New documented one-file offline Release channel, pinned main-only publisher, exact source ZIP and SHA256SUMS, refusal to overwrite any preexisting tag.
- Kept R7 bilingual onboarding and R6 parser semantics unchanged, built from the same sources.
- Additional synthetic checks for release workflow gates, assets, checksum references, and privacy/no external telemetry.
- **Do not infer** the official Release exists until GitHub Actions and assets are independently verified. No real-user data or external adoption measured.
