# AI Memory Lifeboat

[繁體中文](README.md) · [Quick start](docs/QUICK_START.md) · [Privacy](PRIVACY.md) · [Security](SECURITY.md)

**Read and inspect a supported ChatGPT data export locally.** Import your own `conversations.json` or an official ZIP containing exactly one such file. Search visible messages along the current conversation path, download a metadata-only audit, or export one conversation path as standalone HTML.

**v0.1.0 Preview (2026-11-01).** This tool cannot establish that all account data was exported, that linked attachments actually exist, that non-text content is preserved, or that the resulting files can be imported into another AI platform. **Keep the original official export.**

## Start without installation

1. Download this repository as a ZIP via **Code → Download ZIP**, unpack it, and open `index.html`. We do not claim that a hosted GitHub Pages site is enabled.
2. Follow the [official ChatGPT export instructions](https://help.openai.com/en/articles/7260999-how-do-i-export-my-chatgpt-history-and-data), or try the wholly synthetic [example](examples/sample-conversations.json).
3. Choose a file, inspect the reported limitations, search the current paths, and export an audit or single-conversation HTML if needed.

No registration, external models, analytics SDKs, or application-side upload endpoints. The implementation uses local browser APIs. The web host and any browser extensions have their own privacy properties; read [PRIVACY.md](PRIVACY.md).

## Scope

- Supports the documented-in-this-project ChatGPT `mapping` / `parent` / `current_node` structure, STORE/DEFLATE ZIP, CRC checks and input limits.
- Explicitly counts off-path nodes and opaque parts instead of fabricating a flat history.
- Does not support all export formats, ZIP64, encrypted ZIP, restored account history, attachment restoration, or authenticated live integrations.
- Audit JSON contains counts and structural issue codes, not message texts. Exported conversation HTML **does** contain selected message texts and must be stored carefully.

Developers: Node.js 20+, `npm test` (no dependencies). See [format contract](docs/FORMAT_SUPPORT.md), [security model](docs/SECURITY_MODEL.md), [roadmap](docs/ROADMAP.md), [contributing](CONTRIBUTING.md).

MIT © 2026 MAX67-gif. Independent project, not affiliated with OpenAI or other platform providers. No real user data is committed.
