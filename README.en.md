## R28 v0.11.4 — Long-text reader performance guard (publication-gated)

The browser can stall when laying out hundreds of long, unbroken messages offscreen. R28 adds a scoped CSS progressive enhancement to defer **offscreen layout only**; original message text and all DOM nodes remain intact. Current-path rules, 700-message windows, native find/jump/focus, sensitive HTML confirmation and original size limits are preserved. Unsupported browsers fall back to their existing layout. Print rendering explicitly restores visible content. See [R28 evidence and safety contract](docs/R28_LONGTEXT_RENDER_GUARD.md). Synthetic Chrome testing does not certify human or physical-device behavior; verify the actual v0.11.4 Release before treating this as shipped.

---

## R27 v0.11.3 — CRC32 hot-path parity and performance (subject to GitHub Release gates)

A large synthetic ZIP exposed a repeatable long task. The new private 256-entry IEEE CRC32 lookup table preserves checksum values and fail-closed corruption behavior while reducing bitwise work. No change to offline-only CSP, private-export consent, ChatGPT current-path scope, parser limits, or prior immutable releases. See [R27 research and release contract](docs/R27_CRC_RESEARCH_AND_RELEASE.md). Check the actual [v0.11.3 Release](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.11.3) before treating this as a published product.

## R25 v0.11.2 candidate — bounded conversation page jump

Long conversation lists (200 per page) now support strict, IME-aware direct page navigation. Changing to a page that hides the selected conversation scrubs prior private reader content and revokes sensitive HTML export. Invalid entries do not change the page or consent. This remains local-only and does not certify account completeness, real-device accessibility, or verified adoption. [Security and behavior contract](docs/R25_LIST_PAGE_JUMP_AND_PRIVACY.md) | [Release notes](docs/R25_RELEASE_NOTES.md). Preserve v0.11.1.

---

## R23 synthetic performance evidence (product remains v0.11.1)

An opt-in [real-Chrome profiling harness](docs/R23_PERFORMANCE_EVIDENCE.md) now records raw interaction latency and sampled heap for a fixed 1,402-message synthetic current-path export, including import, selection, find, jump, source replacement, list filter, and clear. GitHub CI retains evidence without changing the shipped offline HTML, runtime dependencies, privacy/consent rules, product version or release tag. CI timing is not proof of real-user performance or adoption.

---

## R22 v0.11.1 — Input composition and visible keyboard focus

Enter while an input method is composing characters no longer triggers a search or message-number jump. Committed Enter and the native action buttons keep their existing behavior. Up/Down/Home/End keep the focused conversation visible within the current page, without selecting it or changing pages automatically. When reaching the first or last reader window disables the active page button, focus continues at that window's first message.

A repeatable **real-Chrome CI** checks the standalone file using generated 1,402-message fixtures: bounded windows, cross-window matches, query changes, same-ID source replacement, private-export consent and actual synthetic download content. Node/CDP tooling is development-only; the application remains a self-contained offline HTML file.

[Verify the v0.11.1 Release](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.11.1) against its three published assets and CI. The [v0.11.0 Release](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.11.0) remains available. Synthetic Chrome and mobile emulation do not certify human input methods, screen readers, real devices or account completeness. [R22 contract](docs/R22_KEYBOARD_CONTINUITY.md).

---

## R21 v0.11.0 — Message-number jump and reliable long-conversation navigation

Navigate a retained long conversation by entering a **1-based message number** (for example 701 or 1110) without first searching or repeatedly switching 700-message windows. Invalid and out-of-range inputs fail closed. R21 also fixes two issues reproduced on R20 in Chromium: after manually moving windows, “previous hit” could pick the wrong match; after editing a query, obsolete result highlights remained visible. Navigation moves keyboard focus to the selected retained message; only status/index is announced, not the whole private transcript.

Scope remains the **current selected conversation’s retained current-path text**. Nothing recovers omitted tails, other branches, attachments or deleted account information. Search terms/jump positions remain local and transient; source/selection changes revoke them. Content-bearing HTML still requires explicit confirmation and remains capped at 16 MiB; ZIP/JSON, comparison schemas and all prior privacy gates remain unchanged.

[Check the v0.11.0 Release](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.11.0) **only after PR CI, main CI and three official assets are verified**, otherwise use [v0.10.9](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.10.9). [Engineering contract](docs/R21_READER_NAVIGATION_CONTRACT.md). No independent real-world adoption or Codex OSS approval is claimed.

---

## R20 v0.10.9 — Bounded long-conversation navigation and find-in-conversation

R19 could search messages beyond the first 700, but the reader only rendered the first 700. R20 adds *previous/next 700-message window*, a clear retained-message position, and **local find + previous/next hit** that jumps to the corresponding retained message window. A wholly synthetic 1,402-message conversation is now browsable in 700/700/2 windows and searchable at messages 1,110 and 1,402. The browser still renders **at most 700 messages at once**.

The tool never restores omitted tails, branches outside the current path, non-text content or account data absent from the export. Private search terms/hit indices are transient and cleared on source or selection changes. Downloading a content-bearing HTML still requires explicit user confirmation and the 16 MiB output cap. JSON/ZIP, privacy, comparison and historical Release contracts are unchanged.

[Check the v0.10.9 GitHub Release](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.10.9) **only after PR, main CI and all three Release assets are verified**; otherwise use [v0.10.8](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.10.8). [R20 scope and security contract](docs/R20_BOUNDED_READER_AND_SEARCH.md). Independent adoption and Codex-for-OSS approval are unverified.

---

## R19 v0.10.8 — Offline comparison review workbench

The existing R18 comparison already paginates 80 results and conservatively counts four UNKNOWN causes. R19 adds *four separate UNKNOWN filters*, local-only title search, validated direct page navigation for long result sets, an explicit UNKNOWN count breakdown, and a **human-readable TXT guide containing fixed counts/instructions only** (no titles, IDs, transcript text or search queries). Counts themselves can be sensitive; review before sharing. Existing JSON summary semantics are unchanged.

[Check the v0.10.8 GitHub Release](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.10.8) only after exact-head CI, main CI and all three published assets pass; otherwise use [v0.10.7](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.10.7). No new AI provider, upload, tracking, restored deleted account data, or promise of completeness. [Design/limits](docs/R19_COMPARISON_REVIEW_WORKBENCH.md).

---

## R18 v0.10.7 — Visible-page selection and sensitive export gate

R17 retained the previous conversation's text and content-bearing export permission after navigating to a different 200-row list page. R18 revokes stale selection and consent whenever pagination, search or a risk filter hides the previously selected conversation; users must select an item visibly present in the current page before requesting a private HTML download again. Tested using a wholly synthetic 421-conversation fixture.

[Verify the v0.10.7 Release](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.10.7) after GitHub CI and three release assets exist, otherwise use the [verified v0.10.6](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.10.6). Unchanged: local processing, R17 keyboard navigation, data-format/size boundaries and the explicit sensitive-export confirmation. [R18 contract](docs/R18_VISIBLE_SELECTION_AND_EXPORT_GATE.md).

---

## R17 v0.10.6 candidate — keyboard focus continuity and bounded list navigation

R16 rebuilds the conversation list when a reader selects a row, detaching the focused button and dropping focus to the page body. R17 restores focus to the selected button, supports Up/Down/Home/End *within the current 200-row page*, and keeps Enter/Space as explicit selection actions. Paging remains manual. No change to supported input formats, privacy gates, consent, or local-only design.

[Check the v0.10.6 release](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.10.6) **only after PR, CI, and release assets are actually verified**; otherwise use the [verified v0.10.5 release](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.10.5). Advanced UI is still mostly Traditional Chinese; user adoption remains unverified. [Contract](docs/R17_KEYBOARD_FOCUS_NAVIGATION.md).

---

# AI Memory Lifeboat

## R16 v0.10.5 candidate — truth-centered comparison and local coverage filters

Four inconclusive states (ID, current path, shortened text, shortened title) now count toward the **Uncertain** headline. Browse all reviewable comparison results in bounded 80-row pages and filter by trustworthy categories; missing from the newer export is **not** proof of deletion. A local coverage radar and six conversation-risk filters work with search and the existing 200-row list pagination.

The [v0.10.5 Release](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.10.5) is authoritative only after actual GitHub CI and asset checks. Until then use [v0.10.4](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.10.4). No account completeness certification, hosted upload, extra provider or external human-adoption evidence. [Detailed contract](docs/R16_COMPARISON_TRUTH_CENTER.md).

---


## R15 v0.10.4 candidate — bounded navigation across every matched conversation

Instead of silently showing only the first 200 list rows, the app now offers **Previous / Next page** navigation (200 rows maximum per page), with an explicit page count. Search still spans all retained current-path conversations. Search changes, source replacement, and Clear reset the page; this does not change parser or archive limits.

The [v0.10.4 release](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.10.4) must be independently verified on GitHub before being called published. Until then, use the [v0.10.3 release](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.10.3). Advanced screens remain primarily Traditional Chinese, and human adoption remains unverified. [Paging contract](docs/R15_CONVERSATION_LIST_PAGING.md).

---


## R14 v0.10.3 candidate — title coverage and reading-window disclosure

**Not pushed or released yet. The verified release remains [v0.10.2](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.10.2).**

Titles retain the existing 500 UTF-16 code-unit cap, now with explicit coverage counters, surrogate-pair-safe cutting and fixed warnings. Identical retained title prefixes with unknown tails return `INCONCLUSIVE_TITLE`; proven body or metadata differences keep their original result.

The reading header shows rendered / retained message counts. Only the first 700 messages are expanded on screen; search and HTML still cover retained messages beyond this window, subject to the unchanged 16 MiB HTML limit. No higher caps, network APIs, or adoption claim. See [R14 contract](docs/R14_TITLE_AND_READING_COVERAGE.md).

---

## R13 v0.10.2 candidate: explicit retained-text coverage

A message longer than the existing **2,000,000 UTF-16 code-unit** limit is marked as shortened. Reading, health JSON/TXT and exported conversation HTML disclose omitted text; search only covers the retained prefix. Comparisons involving shortened messages are explicitly inconclusive, even when retained prefixes match. The boundary avoids splitting valid surrogate pairs; it is not a grapheme-count guarantee.

The [v0.10.2 release](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.10.2) is authoritative only after successful CI and asset verification; until then use [v0.10.1](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.10.1). See [R13 contract](docs/R13_TEXT_TRUNCATION.md). No account-completeness, memory-erasure or human-adoption claim.

## R12 safety hotfix — v0.10.1 (verify the GitHub Release)

An individual conversation HTML export exceeding **16 MiB of actual UTF-8 output** now fails closed and downloads nothing, rather than risk generating an oversized file. The existing private-text consent dialog and content-free reports remain unchanged. This is not full-account backup certification, and earlier per-message preview limits remain documented.

Verify v0.10.1 on [GitHub Releases](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases) before treating it as published; otherwise v0.10.0 remains the last verified release. [R12 engineering contract](docs/R12_BOUNDED_HTML_EXPORT.md). Real-person usability testing is deferred; no Codex for Open Source approval is claimed.

**Reviewers and contributors:** [Verifiable maintenance, tests, releases and evidence boundaries](docs/OPEN_SOURCE_MAINTENANCE_EVIDENCE.md). v0.10.0 is released; independent adoption is not yet verified, and tests cannot certify complete account backups.

## History: R10 v0.10.0 — deliberate consent for chat-text HTML exports

**Privacy change:** Content-free health and audit reports remain direct downloads. A **single-conversation HTML containing real chat text** now requires a deliberate in-app confirmation. Cancel, Escape, clear, or switching to another source revokes the pending export. This is a safeguard against accidental download, not a promise of full backup or secure deletion.

The [v0.10.0 Release](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.10.0) is authoritative only after the GitHub job succeeds and assets are verified. Until then, use the existing [v0.9.0 Release](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.9.0). Advanced UI is still primarily Traditional Chinese; external user adoption remains unverified. Read the [R10 privacy contract](docs/R10_SENSITIVE_EXPORT_CONSENT.md).

---

## History: R9 v0.9.0 — State-Safe Offline

**Fix:** Clearing or switching exports now scrubs previously rendered private chat titles, message text, comparison rows and prior health results from the hidden DOM. A new comparison or ZIP attachment CRC retry invalidates any earlier result before it begins. The existing bounded ChatGPT parsing and schema contracts remain unchanged.

**Release gate:** Use the [official v0.9.0 Release page](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.9.0) *only after its release assets are present and verified*. Until then, use the already verified [v0.8.0 Release](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.8.0). Download the HTML and open it locally; no login, AI API or server upload is required.

**Scope:** Clearing the page is not secure erasure of browser/OS memory or prior downloads. Exported single-chat HTML contains private text. No complete-account backup certification, verified real-user adoption or Codex for Open Source selection is claimed. [R9 test contract](docs/R9_UI_STATE_AND_PRIVACY.md).

---

## Previous offline download — R8 v0.8.0

**One HTML file, no installation.** Once the official GitHub Release succeeds, download `AI_Memory_Lifeboat_Offline.html` from the [v0.8.0 Release page](https://github.com/MAX67-gif/AI-Memory-Lifeboat/releases/tag/v0.8.0). `SHA256SUMS.txt` and an exact source ZIP are provided for verification. **If the Release page does not yet exist, the publication gate has not passed**; instead, open the [single-file source](dist/AI_Memory_Lifeboat_Offline.html) and choose **Download raw** on GitHub.

Open the HTML file in a browser and select **Try synthetic demo**. No account, Node.js, API token or upload is required. **Only the first-task guide is bilingual; advanced controls are primarily Traditional Chinese.** The inspector does not certify a complete ChatGPT backup. Keep the original export ZIP and do not share sensitive chat HTML outputs.


## Previous R7 milestone — offline first-task gateway

**[Get the single-file offline inspector](dist/AI_Memory_Lifeboat_Offline.html)**: open its GitHub file page, choose **Download raw**, then open the downloaded HTML in your browser. You do not need Node.js, an account, an API key, or your personal data to try the fictional sample. The same underlying inspector code is included in the file, along with a hash-based Content Security Policy (CSP).

A **bilingual English/Traditional Chinese first-task guide** is available. **The advanced inspection screens are still primarily Traditional Chinese**; this is not a claim of full English translation. Your official export is processed in your own browser tab; keep your original ZIP. The fictional sample **does not** validate any personal account.

If the direct HTML cannot be downloaded, use **Code → Download ZIP → extract → open index.html**. GitHub Pages and formal GitHub Releases are **not claimed to be enabled**. The previous v0.7.0 Preview is not evidence of independent adoption or OpenAI Codex for Open Source selection.

[繁體中文](README.md) · [Getting started](docs/QUICK_START.md) · [Privacy](PRIVACY.md) · [Security](SECURITY.md) · [Pilot protocol](docs/FIRST_RESULT_PILOT.md)

**Open a supported ChatGPT export locally, examine readable conversation structures, search current branches, compare two snapshots, inspect limited ZIP attachment references, and download a content-free health guide.** No sign-in, uploads, tracking SDKs or third-party model API is required.

**Historical R6 milestone: v0.6.0 (2026-11-03).** This is **not** a complete-account backup checker, cross-provider account migration service, or guarantee that original attachments have been exported. Keep the source ZIP or JSON.

## First use — no personal data required

1. Download this repo via **Code → Download ZIP** and unzip. Open the included `index.html` in your browser. A hosted site is not promised.
2. Press **試用合成示範** (Try synthetic demo). The tool loads two fictional export examples locally. Use the three guided result links for the health guidance, comparison and conversation search; you may download a content-free plain-text first-result summary. This is not a test of any real account.
3. To inspect your **own** export, obtain the official [ChatGPT export](https://help.openai.com/en/articles/7260999-how-do-i-export-my-chatgpt-history-and-data), choose the ZIP or `conversations.json` file (prefer the complete ZIP for numbered JSON shards), and read the reported limitations. Do not upload your export to GitHub issues.

## R4 first-user pilot

The browser offers an **optional five-choice local feedback receipt** (ease, clarity, likely reuse, self-reported first-task outcome and scope understanding). Exporting that receipt only downloads JSON to the user's own device. No feedback is automatically submitted, no conversation or filename enters the receipt, and the user decides whether to share it. A [GitHub issue form](https://github.com/MAX67-gif/AI-Memory-Lifeboat/issues/new?template=pilot-feedback.yml) is available for voluntary feedback; a GitHub account may be required and posting publicly exposes the reviewer's GitHub identity. Read the [pilot instructions](docs/FIRST_RESULT_PILOT.md) and [privacy contract](docs/PILOT_PRIVACY_CONTRACT.md).

The main functionality from v0.3.0 is retained: ChatGPT `mapping`/`parent`/`current_node` parsing, bounded STORE/DEFLATE ZIP support, current-path searching and HTML export, two-export comparisons, metadata-only attachment path assessment, and opt-in size-capped CRC32 checks. Unknown formats, off-branch text, original attachment completeness and account reconstruction remain unsupported.

All tests use **fictional synthetic fixtures**. Node.js 20+ is needed only for development (`npm test`, no dependencies). See [format limitations](docs/FORMAT_SUPPORT.md), [security model](docs/SECURITY_MODEL.md), [roadmap](docs/ROADMAP.md), and [contributing guide](CONTRIBUTING.md).

MIT © 2026 MAX67-gif. Independent, unaffiliated open-source prototype. No real-user pilot/adoption results have been verified yet; passing CI is not adoption evidence.

R5 adds human-readable, content-free `.txt` results and a self-reported feedback v2 schema while preserving the original v1 receipt generator. There is no remote telemetry or verified human-study outcome; see [R5 documentation](docs/R5_FIRST_RESULT_AND_PILOT_V2.md).

## R6: bounded numbered ChatGPT JSON shards

OpenAI documentation now notes that large exports can contain numbered conversation JSON files. This version recognizes consecutive, unique `conversations-000.json`, `conversations-001.json`, and so forth **inside one ZIP directory** (up to 32 shards), and preserves the earlier single-file path. Missing numbers, duplicates, mixed formats, invalid JSON, CRC failures, and size limits fail closed rather than silently ignoring conversations. A separately opened numbered JSON file is explicitly marked as **possibly incomplete**. Limits remain 128 MiB ZIP and 64 MiB total uncompressed conversation JSON. This is not proof of complete account data or successful account migration. See [R6 scope](docs/R6_NUMBERED_SHARDS_SUPPORT.md).

[Original synthetic numbered ZIP fixture](examples/synthetic-numbered-export.zip), never a real account export.


### R24 synthetic profiling methodology (no product release)

See [R24 phased Chrome performance evidence and fresh-document guard](docs/R24_PHASED_PERFORMANCE_EVIDENCE.md). The CI-only probe separates state-ready time from two-frame waiting and runs fixed 1,402/7,000-message synthetic profiles. No personal exports, telemetry, runtime modification, new product version, or claim about physical-device performance.
