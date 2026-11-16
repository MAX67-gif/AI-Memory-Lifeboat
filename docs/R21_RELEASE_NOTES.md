# AI Memory Lifeboat v0.11.0 — Safe Message Jump and Search State Repair

R21 makes bounded long-conversation reading more predictable. Readers can jump to a specific **1-based retained message number** without searching or repeatedly paging; invalid or out-of-range inputs are explicitly rejected. Search-hit navigation after manually changing windows now chooses the correct first/last match, and changing a query clears old hit highlights immediately.

Privacy remains local-only. No data is transmitted, retained outside page memory, or inserted into content-free reports. The reader renders a maximum of 700 messages per window. All preexisting ZIP/JSON, truncation uncertainty, private HTML confirmation, 16 MiB output, comparison and historical release contracts remain unchanged. Data not in the export, omitted message tails, other branches and non-text parts are not recovered.

These features have synthetic Node and Chromium engineering tests. They do not establish complete account backup, cross-device compatibility, human adoption or Codex for Open Source acceptance.
