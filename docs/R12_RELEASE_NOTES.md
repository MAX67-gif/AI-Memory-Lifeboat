# AI Memory Lifeboat v0.10.1 — Bounded Export Offline

This is a targeted R12 safety hotfix on the v0.10.0 product; it is not a new AI provider adapter or a change to the ChatGPT JSON/ZIP audit schema.

- Explicit cap for generating one content-bearing single-conversation HTML document: **16 MiB of actual UTF-8 HTML output**, including escaped HTML entities.
- Oversized output is refused **before any file is downloaded**, with a clear safe-language message. No partially generated HTML is downloaded. The original official ZIP is unchanged and should be retained.
- Earlier local confirmation before exporting private HTML still applies; private content and exception text are not echoed into error messages.
- Content-free health/Audit and comparison report downloads remain available without the new cap.
- Source and generated single-file offline HTML are reproducible; CI and published release artifacts use the pinned GitHub main Commit and SHA256SUMS.

Limitations: Existing underlying per-message preview normalization may shorten exceptionally long messages; this hotfix does not change or certify that older bound. It enforces an **additional output-creation bound** and never claims that all source content is preserved, that an account is restorable, or that adoption has been measured.

All fixtures are synthetic. Real-person usability work has been deferred by the project maintainer; No Codex for Open Source approval is claimed. No real chat content is used in public CI.
