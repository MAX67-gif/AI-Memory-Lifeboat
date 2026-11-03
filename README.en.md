# AI Memory Lifeboat

[繁體中文](README.md) · [Getting started](docs/QUICK_START.md) · [Privacy](PRIVACY.md) · [Security](SECURITY.md) · [Pilot protocol](docs/FIRST_RESULT_PILOT.md)

**Open a supported ChatGPT export locally, examine readable conversation structures, search current branches, compare two snapshots, inspect limited ZIP attachment references, and download a content-free health guide.** No sign-in, uploads, tracking SDKs or third-party model API is required.

**v0.6.0 Preview (first sandbox validation: 2026-11-03; check GitHub main/PR/CI for source publication).** This is **not** a complete-account backup checker, cross-provider account migration service, or guarantee that original attachments have been exported. Keep the source ZIP or JSON.

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
