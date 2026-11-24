# AI Memory Lifeboat v0.11.4 — Long-text reading responsiveness

This release improves offline reading when a retained current-path conversation contains many long messages. Offscreen messages defer expensive layout; messages remain in the DOM with their original retained text. Searching, explicit focus navigation, 700-message windows and content-bearing HTML export still follow the same security and consent rules.

- **No external uploads, telemetry, cloud restore, or provider expansion.**
- **Original importer contract unchanged:** ZIP 128 MiB, JSON 64 MiB, 32 numbered shards, 16 MiB private HTML limit.
- **Progressive browser enhancement:** unsupported CSS falls back to prior layout; print view restores visible content.
- **Verification required:** precise GitHub PR/main Node + Chrome synthetic suites, R28 dedicated real `file://` fixture, the R27 near-limit/CRC gates, and three actual Release attachments with SHA/CRC validation.
- **Limitations:** synthetic tests and emulated mobile are not human trial data or proof of account completeness. R26 historical 120-second Chrome CDP failures remain archived; this small layout change does not prove all Chrome performance faults are eliminated.

Retain the original account export and previous v0.11.3 Release. The offline HTML never transmits your conversation data.
