# AI Memory Lifeboat v0.10.7 — R18: Current-page selection safety

When browsing hundreds of conversations, the previously selected conversation may be hidden after moving to another page while its text and sensitive HTML export remain enabled. R18 fixes this reproducible user-risk issue: only an explicitly selected conversation present in the **current visible page** retains reading/export permission. Page changes, searches and risk filters that hide the selection revoke the sensitive export confirmation and clear the prior reading panel.

- 421 entirely synthetic conversations used to test 200/200/21 paging, search, path-risk filters, keyboard navigation, explicit re-selection, and sensitive-download cancellation.
- No change to parsing, private-data handling, output formats, ZIP limits, snapshot uncertainty semantics or the R17 keyboard fix.
- R18 uses the same local-only offline HTML and strict hash-based CSP; no accounts, tokens, telemetry or cloud data upload.
- Engineering tests do not establish that a user's entire ChatGPT account was exported, nor do they establish real-world adoption or OpenAI program selection.
- Existing v0.10.6 release and immutable tag are preserved.
