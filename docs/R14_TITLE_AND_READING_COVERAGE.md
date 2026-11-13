# R14 — Title and reading coverage / 標題截短與閱讀範圍

Version: 0.10.3 candidate, 2026-11-13. Publication requires normal feature PR, exact-head CI, merge/main CI, and actual Release asset verification. No remote success is implied by this file.

## Fixed caps and scope
Title cap remains 500 UTF-16 code units. UTF-16 units are not bytes, Unicode code points or user-perceived characters. A valid surrogate pair spanning the boundary is wholly omitted, so some retained titles have 499 units. Arbitrary ill-formed source strings and grapheme clusters are not repaired. Missing/non-string titles retain the established `Untitled conversation` fallback; length counters describe that effective title, not an inferred missing original.

Each parsed conversation gains `titleTruncated`, `sourceTitleCodeUnits`, `retainedTitleCodeUnits`, `omittedTitleCodeUnits`. These apply even when a current message path is unavailable. Invalid records are excluded from the title aggregate. Input JSON is never mutated; the full source title is not kept in the normalized model.

`aml.audit.v1` gains `title_limit_code_units=500`, `title_length_unit=UTF16_CODE_UNITS`, `title_truncation_scope=PARSED_CONVERSATION_TITLES_ONLY`, `truncated_titles`, `omitted_title_code_units`. Fixed warning: `CONVERSATION_TITLE_TRUNCATED`. No titles, discarded text, IDs, paths or filenames are added to reports.

## Comparison precedence
Existing missing/ambiguous ID, record only-in-one-input, invalid path and R13 message truncation rules stay first. Proven retained body/count change is `CURRENT_VIEW_CHANGED`. Proven retained title or timestamp change is `METADATA_ONLY_CHANGED` (not an assertion that all metadata was examined). Only when these comparisons are otherwise equal and either title is marked shortened, return the new `INCONCLUSIVE_TITLE`.

`aml.snapshot-diff.v1` retains all old strings and adds the new enum, count, `title_truncation_detected_in_inputs` and fixed `TRUNCATED_TITLES_NOT_FULLY_COMPARABLE` warning. A title-unknown result has REVIEW health significance even if only the older input had a long title. Downstream strict enum consumers must handle the added state as unknown, not equality. Metadata absent in legacy normalized objects keeps old behavior; without the new fields, old normalization cannot retroactively certify title completeness.

## Reading, reports and exports
`TITLE_TRUNCATED` health guidance and trusted TXT text disclose title scope without reflecting arbitrary labels. A selected conversation displays counts and fixed scope notices before the heading itself, so a long heading cannot hide them in the mobile reading pane. Exported chat HTML includes a bilingual `data-title-truncated` notice before the long heading, with wrap-safe escaped retained title only; R10 consent and R12 16 MiB actual HTML UTF-8 guard remain intact.

Reading remains limited to 700 messages. The header shows rendered/retained count, and a notice before the first message gives the undisplayed count. This UI cap does not remove parsed messages and is not reported as lost source text. Search scans all retained current-path messages; HTML contains all of them if it fits. This does not restore R13-shortened message tails, title tails, other branches, attachments, or missing platform data. The existing 200-item conversation list limit is unchanged.

## Validation and exclusions
Original synthetic inputs exercise 500/501 boundaries, source fallback, Unicode boundary, invalid records, old/new inputs, precedence, report privacy, HTML escaping, 700/701 displayed counts, search/export after700, and clear/source replacement. Human trials are deferred. Browser QA does not claim universal browser/OS/accessibility compliance.

Reference: ECMAScript String type (ECMA-262 2025, section 6.1.4) https://262.ecma-international.org/16.0/index.html#sec-ecmascript-language-types-string-type . No third-party code copied.
