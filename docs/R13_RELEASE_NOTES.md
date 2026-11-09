# AI Memory Lifeboat v0.10.2 — Visible Truncation Offline

- Explicit warnings when the supported current-path message text exceeds the existing 2,000,000 UTF-16 code-unit cap. Numeric coverage fields never contain conversation text.
- Same retained prefix no longer implies the omitted tails were equal: snapshot comparisons return INCONCLUSIVE_TEXT when relevant text was shortened.
- Reading, trusted health TXT/JSON and the downloaded conversation HTML disclose the limitation. Search remains limited to retained text.
- No size-limit increases, cloud calls, account access, telemetry or parser format expansion. Existing 16 MiB HTML cap and explicit download consent remain.
- Synthetic engineering evidence only. Keep the original official export; no full account recovery, external adoption or program acceptance claim.

Download the offline HTML, the exact-commit source ZIP and SHA256SUMS. Checksums verify release bytes, not original account completeness. Prior releases remain immutable.
