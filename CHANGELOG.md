## v0.5.0 Preview — 2026-11-02

- Added result-navigation anchors and a content-free plain-text first-result summary with strict trusted-only wording.
- Added voluntary five-choice v2 feedback without transmitting personal content or inferred adoption results; v1 remains unchanged for compatibility.
- Added negative security, accessibility and backward-compatibility tests. No real-user study or official Release claimed.

# Changelog

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
