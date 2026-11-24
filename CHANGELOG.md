## R26 research-only (2026-11-24; product remains v0.11.2)

- Add three deterministic synthetic offline import research profiles: ~9 MiB JSON long text, 32-shard ZIP with 800 conversations, and compressed near-64 MiB JSON ZIP. Add 33-shard / 64 MiB+1 invalid-source guards with privacy-state revocation checks.
- Add real Chrome file:// CDP `DOM.setFileInputFiles` research runner (fresh document per trial), action-to-ready timing, Long Tasks where supported, sampled JS heap high-water and bounded startup diagnostics. Each profile runs desktop and mobile viewport emulation.
- Capture raw research JSON and immutable fixture hashes in an independent three-case GitHub CI workflow. No shipped app source, offline HTML, v1 product data schema, release tag or privacy budget changes. See `docs/R26_BOUNDARY_RESEARCH_CONTRACT.md`.

## v0.11.2 — R25 direct conversation-page jump (2026-11-24; publication gated)

- Add strict, keyboard/IME-aware direct page navigation for long 200-item conversation lists; preserve current filtered search scope.
- Apply the original R18 visible-selection lease on any valid page change: clear offscreen private reader content and revoke pending sensitive export; invalid input cannot change selection.
- Reset jump error/input state on source replacement, clear, search and risk-filter changes; remain local-only and keep R6/R12/R15/R20 caps and R23/R24 research tools.
- Publish only as an immutable pinned v0.11.2 release after exact-head Node, real Chrome, merged-main CI and three genuine asset checks succeed. No actual-account or human-adoption proof.

## R24 research-only (2026-11-24; product remains v0.11.1)

- Separate state-ready latency from two-frame waiting in real Chrome synthetic research while preserving all prior R23 timing fields and v1 schema.
- Require a newly navigated Chrome loader before each trial so a stale prior document cannot be mistaken for a fresh run.
- Add independent baseline and heavier synthetic Chrome CI matrix with raw artifact per fixture; no shipped HTML, runtime source, consent, parser limit or release changes.
- Following a real GitHub stress-job SETUP failure before any import, add one-process, bounded 25s Chrome startup diagnostics with failure-state and exit evidence; no silent reruns. Preserve failure history and avoid attributing setup timeouts to application latency.
- Evidence interpretation and bounded non-benchmark claims: `docs/R24_PHASED_PERFORMANCE_EVIDENCE.md`.

## R23 research-only (2026-11-24; product remains v0.11.1)

- Add opt-in deterministic synthetic Chrome performance probe: import, selection, retained-message search, cross-window jump, source replacement, list search and clear; record raw per-run timings, medians, nearest-rank p95 and sampled heap.
- Keep browser profiler out of the shipped standalone HTML; no telemetry, parser/format budget, schema, consent, release tag, or runtime dependency change.
- CI publishes a research artifact, not benchmark promises, new release assets or verified human adoption. See `docs/R23_PERFORMANCE_EVIDENCE.md`.

## v0.11.1 — R22 (2026-11-24; remote publication gates apply)

- Fix premature search and message jumps during input-method composition, with normal committed Enter unchanged.
- Scroll bounded list focus into view during Arrow/Home/End navigation without implicit selection or cross-page navigation.
- Hand off focus to the first message when a reader paging button becomes disabled at the first/last window; enabled paging buttons keep focus.
- Add real Chrome file:// regression to pull requests and main, using generated desktop/mobile fixtures and checking actual synthetic HTML export contents.
- Preserve existing schemas, parser budgets, 700-message rendering, selection revocation and private-download confirmation.
- Keep all earlier Release publishers and tags immutable; new v0.11.1 has an independently pinned publisher.

## v0.11.0 — R21 (2026-11-16; pinned Release requires remote validation)

- **New:** Strict one-based **jump-to-retained-message-number** for long conversations; rejects blank, scientific notation, leading zeros, signed values and out-of-bounds input. Keyboard focus is moved to the selected message in its bounded window.
- **Fix:** After manually changing the 700-message window, pressing “previous hit” when no match is active now starts at the **last** hit; “next hit” starts at the **first**, preserving safe wrap-around.
- **Fix:** When a query changes, clear the stale highlight immediately instead of leaving a visibly active result from the prior search.
- **UX:** Clear old jump feedback when switching windows, selecting a different hit, replacing sources or clearing state. Compact responsive controls and limited ARIA status.
- **Security:** No new network, storage, source data, cloud provider, or private-report fields. Keep R20 700-message render cap, R10 consent, R12 16 MiB output cap, R18 current-page selection lease, R19 difference schema and R6 archive limits.
- **Evidence:** Synthetic negative tests, Chromium 1280x900 and 390x844 for 1402 retained messages, original R20 red regressions, updated source/offline CSP hash parity. This is engineering evidence only, not account-completeness or external-adoption proof.

## v0.10.9 — R20 bounded reading, focus-aware find, and privacy-safe source switching (2026-11-16)

- Correct the R14/R19 mismatch: all retained visible messages were searchable, but only the first 700 were readable on screen. Keep the 700-message render cap while letting readers navigate later windows explicitly.
- Find locally within the **selected current-path conversation** and jump to its retained message. Previous/next hit supports non-contiguous hits across windows; no automatic export or remote search.
- Reader toolbar shows scoped position and conservative search limitations. Invalid searches are rejected; non-text and omitted text remain out of scope.
- Wipe transient search and hit state whenever the source or selection changes, a filter hides the selection, or the user clears the app. Preserve R10 content-export consent and R12 16 MiB cap.
- Add synthetic red/green regression for 1,402 messages, Chromium desktop/mobile, and strict source/standalone CSP parity.
- **No change** to parser, stable export summary schemas, ZIP/JSON caps, R19 review features, telemetry, account restoration or historical pinned Release workflows.

## v0.10.8 — R19 (2026-11-16; CI and GitHub Release required for publication)

- Four separately selectable unknown comparison reasons: path, ID, truncated text and truncated title. Existing four-way conservative outcome counts and status semantics unchanged.
- Local-only comparison-title search and a strict, 1-based page jump for long 80-row result sets. Search and navigation state are erased on new source/older source/clear; none are exported in content-free summary.
- Visible cause count breakdown and a new human-readable local TXT review guide. Portable guide is constructed solely from whitelisted status numbers and fixed instructions, never from chat content, titles, IDs or queries.
- Preserve strict CSP, no telemetry, R18 sensitive selection lease, R17 keyboard support, all prior release workflows, source-format caps and JSON contract.

## v0.10.7 — R18 (2026-11-15; GitHub PR/CI/Release gate)

- Reproduce the previous-page selection leak with 421 synthetic conversations (200/200/21 pages).
- Revoke stale selection, detail DOM and content-bearing HTML export permission when page/filter/search makes a selection invisible.
- Keep explicitly reselected visible conversations and their native keyboard/consent flows unchanged.
- Add fail-closed selection tests; preserve parser schema, R17 navigation and all older pinned publisher workflows.

## v0.10.6 — R17 (2026-11-15; publication gated by PR/CI and real GitHub Release)

- Reproduce and fix keyboard focus loss when selecting a conversation after list re-render.
- Support ArrowUp, ArrowDown, Home and End focus navigation within the visible bounded list page; Enter/Space still select deliberately.
- Add accessible guidance and deterministic, synthetic regression checks; verify Chromium desktop/mobile and source/standalone CSP parity.
- Preserve R16 comparison truth routing, R10 sensitive HTML consent, R12 output caps, R15 bounded paging, and all prior release tags.

## v0.10.5 — R16 (2026-11-13; publication subject to PR/CI and actual Release)

- Complete four-way uncertainty headline in snapshot comparison, with conservative non-binary review guidance.
- Replace the 120-row unpaged diff display with category filters and 80-row local pagination.
- Add local conversation risk filters that combine with existing 200-row paging and full-source search, plus fixed-count coverage radar.
- Clear stale comparison filter, pager and selected private export when source or filter context changes.
- Preserve prior v1 JSON schemas, ZIP/parser limits, local-only behavior, HTML consent and immutable release workflows.

## v0.10.4 — R15 candidate (2026-11-13; release gated)

- Add local-only Previous / Next page navigation over all matched conversations, 200 DOM list buttons per page.
- Reset paging on search, source replacement and Clear; preserve selection/HTML consent boundaries.
- Keep search scope, ZIP/JSON caps, current-path rendering and v1 schemas unchanged.
- Synthetic Node and Chromium tests cover 200/201/401 boundaries and no stale private DOM.

## v0.10.3 — R14 official release (2026-11-13)

- Disclose shortened title coverage in parser/audit/health/TXT/HTML; protect valid surrogate pairs at the existing cap.
- Add conservative INCONCLUSIVE_TITLE without suppressing known body/metadata differences.
- Move 700-message range warning to the top; search/export still use all retained messages.
- Keep caps, schemas, previous enum strings, consent and local-only processing; human validation deferred.

## v0.10.2 — R13 (2026-11-09; release subject to CI)

- Declare retained/omitted UTF-16 text coverage without increasing message or archive limits.
- Warn in reading, content-free reports and chat-text HTML; preserve surrogate pairs at the cutoff.
- Treat truncated current-path comparisons as inconclusive; retain existing IDs, schema fields, consent and 16 MiB HTML guard.
- Synthetic regressions only; no adoption or account-completeness claims.

## R12 hotfix / v0.10.1 — 2026-11-07

- Bounded single-conversation HTML generation to 16 MiB actual escaped UTF-8 output; fail closed with a local, content-free error and no partial download.
- Preserve R10 explicit confirmation and R1–R11 import/audit/ZIP and content-free reporting semantics.
- Add red/green tests for oversized messages, entity expansion and the real export confirmation flow.
- Update deterministic standalone HTML, manifest, checksum and separately gated one-time release workflow.
- Human test results and Codex for Open Source approval are not claimed.

# Changelog

## v0.10.0 — 2026-11-06

- Add a keyboard-accessible, native HTML confirmation step before exporting single-conversation HTML containing chat text and titles.
- Cancel, Escape, clear, source switch and selected-conversation changes revoke any pending sensitive export; previously direct content-free reports remain one click.
- Preserve v0.9.0 source parsing, ZIP caps, comparison, user privacy, generated single-file CSP parity, and v1/v2 pilot schemas.
- Add red/green public DOM behavior tests and real-browser synthetic checks. No evidence of full account backup or independent real-user adoption is claimed.
- Publish only from canonical GitHub main using a separate pinned, non-overwriting R10 release workflow.

## v0.9.0 — 2026-11-06

- Scrub hidden DOM content and old result summaries on clear, source replacement, and invalid JSON/ZIP replacement.
- Revoke stale comparison output as soon as a different older export is selected, including while the new comparison is pending.
- Revoke previous ZIP CRC32 results before retry; a failed retry cannot leave the previous successful result in health JSON.
- Fix `.git` worktree file inclusion in the generated package manifest without altering original release history.
- Preserve ChatGPT parser/ZIP caps, R4/R5 pilot schema semantics, local-only CSP and R8 release immutability.
- Add 7 browser-app public DOM regression tests plus a separately pinned v0.9.0 one-time release workflow.
- Engineering success does **not** establish real-user adoption, a complete account backup, or selection by OpenAI.

## v0.7.0 Preview — 2026-11-03

- Deliver deterministic, dependency-free single-file offline inspector (`dist/AI_Memory_Lifeboat_Offline.html`); users can download one HTML from GitHub without extracting the entire source repository.
- Add bilingual zh-TW/en first-task gateway to the same inspector; do not claim full English advanced UI.
- Build hashed inline-script/style Content Security Policy without `unsafe-inline`, remote assets, telemetry or upload endpoints.
- Preserve R6 ZIP/JSON shard limits, both existing offline workflows and privacy-preserving v1/v2 pilot schemas.
- Test source/distribution parity and Chromium offline synthetic tasks; no claims of verified GitHub Pages, formal Release, real-user adoption, account completeness or Codex selection.

# Changelog

## v0.6.0 Preview — first sandbox validation 2026-11-03 (source publication requires GitHub CI)

- Add bounded recognition of consecutive numbered `conversations-NNN.json` shards inside a ZIP, preserving the single `conversations.json` workflow.
- Reject missing, duplicate, mixed, mismatched-directory, oversized and corrupted shards without silently dropping records.
- Warn when a user opens one numbered JSON outside its collection; indicate number of recognized shards without echoing paths in shareable reports.
- Add synthetic adversarial tests. No account completeness, attachment authenticity, external pilot/adoption or public Release is claimed.

## v0.5.0 Preview — 2026-11-02

- Added result-navigation anchors and a content-free plain-text first-result summary with strict trusted-only wording.
- Added voluntary five-choice v2 feedback without transmitting personal content or inferred adoption results; v1 remains unchanged for compatibility.
- Added negative security, accessibility and backward-compatibility tests. No real-user study or official Release claimed.


## v0.4.0 Preview — 2026-11-02

- Add a **one-click, entirely synthetic** first-use walkthrough for health guidance, local searching and two-export comparison; clearly label that it does not inspect any personal account.
- Add an optional 3-question **local-only feedback receipt** (`aml.pilot-feedback.v1`): strict enumerated values, no free text, filenames, IDs, device info or timestamps, and **no automatic submission**.
- Add bilingual onboarding, the first-user pilot protocol, privacy contract, GitHub voluntary issue form and synthetic negative/adversarial tests.
- Preserve R3 attachment byte checks, health guidance and R2 comparisons; no new provider credentials, network calls or hidden telemetry.
- **No verified human participation/adoption yet.** Synthetic and browser tests do not count as real-user evidence.

## v0.3.0 Preview — 2026-11-02

- Add deterministic, content-free `aml.health.v1` user guidance with attention/review/limited-scope statuses and clear next actions.
- Add optional on-demand, bounded CRC32/size checks for exact, unique ZIP attachment paths (`aml.attachment-bytes.v1`). Never treat CRC32 as authenticity or complete backup evidence.
- Keep R2 snapshot comparison, metadata-only path assessment, offline search, individual HTML export, privacy and legacy audit schemas.
- Add negative, privacy and ZIP-adversarial tests; no account restoration or cloud features.

## v0.2.0 Preview — 2026-11-01

- Added optional offline comparison of two user-selected ChatGPT exports. Never infer account deletion from a missing conversation ID.
- Added conservative ZIP central-directory vs explicit relative attachment-path assessment, without extracting attachment bytes or guessing by filenames.
- Added synthetic two-export fixtures, schema docs, privacy guards and browser-level checks.
- Retained existing v0.1.0 reading/searching/HTML export; no cloud AI, telemetry or account restoration.

## 0.1.0-preview — 2026-11-01

Initial offline-first proof of concept: ChatGPT `conversations.json`/ZIP import, bounded ZIP decompression and CRC, current-path graph reading, off-branch/non-text/attachment-reference warnings, local search, JSON audit and single-conversation HTML export. Bilingual getting-started documentation; MIT; test suite and GitHub Actions verification.

**Not a general backup solution:** no account completeness certification, non-text restoration, remote sync, model API, or live user-adoption evidence.

## v0.8.0 Preview / R8 — 2026-11-06

- New documented one-file offline Release channel, pinned main-only publisher, exact source ZIP and SHA256SUMS, refusal to overwrite any preexisting tag.
- Kept R7 bilingual onboarding and R6 parser semantics unchanged, built from the same sources.
- Additional synthetic checks for release workflow gates, assets, checksum references, and privacy/no external telemetry.
- **Do not infer** the official Release exists until GitHub Actions and assets are independently verified. No real-user data or external adoption measured.
