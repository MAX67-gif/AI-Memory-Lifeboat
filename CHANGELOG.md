# CHANGELOG

## v0.2.0 Preview — 2026-11-01

- Added optional offline comparison of two user-selected ChatGPT exports. Never infer account deletion from a missing conversation ID.
- Added conservative ZIP central-directory vs explicit relative attachment-path assessment, without extracting attachment bytes or guessing by filenames.
- Added synthetic two-export fixtures, schema docs, privacy guards and browser-level checks.
- Retained existing v0.1.0 reading/searching/HTML export; no cloud AI, telemetry or account restoration.

# Changelog

## 0.1.0-preview — 2026-11-01

Initial offline-first proof of concept: ChatGPT `conversations.json`/ZIP import, bounded ZIP decompression and CRC, current-path graph reading, off-branch/non-text/attachment-reference warnings, local search, JSON audit and single-conversation HTML export. Bilingual getting-started documentation; MIT; test suite and GitHub Actions verification.

**Not a general backup solution:** no account completeness certification, non-text restoration, remote sync, model API, or live user-adoption evidence.
