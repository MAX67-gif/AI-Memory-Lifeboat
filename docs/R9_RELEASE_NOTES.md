# AI Memory Lifeboat v0.9.0 — State-Safe Offline

- **Safer data switching:** Old conversation titles, message text, comparison lists and hidden audit displays are scrubbed when a new archive is chosen, parsing fails, or the page is cleared.
- **No stale inspection results:** Switching an older comparison or retrying ZIP attachment CRC32 invalidates the previous result immediately. A failed retry cannot preserve the old positive claim.
- **Verified source:** `AI_Memory_Lifeboat_Offline.html` comes from the exact released commit; `AI_Memory_Lifeboat_Source_v0.9.0.zip` is a Git archive of that commit; checksums in `SHA256SUMS.txt`.
- **No cloud processing or accounts:** Local-first, no network API, no telemetry. The synthetic demo does not inspect personal accounts.
- **Important limits:** This is not complete-account backup certification, secure RAM erasure, or a malware scanner. Downloaded individual conversation HTML contains personal text. Keep your original official export.
- **Evidence:** Node/Chromium tests use synthetic fixtures; no independent human adoption, verified GitHub Pages hosting, or OpenAI Codex for Open Source acceptance is claimed.
