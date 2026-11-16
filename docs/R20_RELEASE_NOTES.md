# AI Memory Lifeboat v0.10.9 — Bounded Long-Conversation Reader

R19 could find retained messages after message 700, but the reader only displayed the first 700. R20 adds local reader windows (up to 700 visible messages each), explicit previous/next navigation and a separate find-in-conversation field with next/previous hit controls. The matched message can be reached on screen without expanding the entire conversation into DOM at once.

- Search works only in the selected conversation's **retained current-path text**, not omitted tails, attachments or alternate branches.
- Reader queries and hit indices are ephemeral and cleared on source changes, selecting another conversation or clearing. No telemetry, remote search, accounts or persistent storage.
- The optional single-conversation HTML still contains retained conversation text and requires explicit confirmation and the existing 16 MiB output limit.
- JSON/ZIP importer caps, `aml.snapshot-diff.v1`, R19 UNKNOWN filters, diff reports, historical releases and CSP boundaries are unchanged.
- Synthetic regression: 1,402 messages with matches at 1,110 and 1,402, two Chromium viewport suites, source/standalone hash parity. No independent real-user validation, account-completeness guarantee or Codex-for-OSS approval is claimed.
