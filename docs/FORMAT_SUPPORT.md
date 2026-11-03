# Format support and verification contract｜格式與驗證邊界

Version: `aml.audit.v1` / App 0.6.0 Sandbox Preview; this document governs the **specific known structures we test**, not undocumented future platform formats.

Input: an array of ChatGPT conversation objects in `conversations.json`. Each supported row has `mapping` (node dictionary) and, for readable history, `current_node`; nodes form a parent chain and can contain `message.author.role`, `message.content.parts`, and timestamps. Strings or text-field parts are readable; other parts are counted as non-text. We display only `user` and `assistant` messages along the actual current parent chain. Deleted/unexported content cannot be reconstructed.

ZIP: a single `conversations.json` (root or subdirectory), **or** consecutive unique `conversations-NNN.json` shards in one directory, starting at `000`, up to 32 parts; never both. No path traversal; STORE or DEFLATE; CRC32 checked per selected JSON entry. Maximum archive 128 MiB, combined selected JSON uncompressed size 64 MiB, core conversation/node ceilings unchanged. ZIP64 and encrypted ZIP unsupported; unsupported ZIP features fail with reason codes. Other ZIP entries are *not* extracted or validated; presence of a named file does not establish that an attachment referenced by a conversation is intact.

Audit schema fields: `schema`, `tool_version`, `source_type`, `account_completeness`, `extraction_scope`, `input_records`, `parsed_records`, `invalid_records`, `total_message_nodes`, `active_visible_messages`, `off_path_message_nodes`, `missing_current_paths`, `attachment_reference_observations`, `non_text_parts_not_rendered`, `warnings`, `issues`, `additional_issues_suppressed`, `zip_entry_count`, `zip_entry_bytes_not_extracted`, `claims_not_made`.

`issues` contain only structure codes and numeric record indices; never copied chat text. `attachment_reference_observations` are heuristic observations, potentially double-counted if a reference appears both in metadata and content, **not a distinct file count**.

Status: `NOT_VERIFIABLE_FROM_EXPORT` for account completeness. No account-level completeness proof, no cross-platform import, no claims of exact fidelity for images/audio, branches, tool messages or attachments. Preserve the original official export.

R2 extensions: `aml.snapshot-diff.v1` (summary only), `aml.archive-path-assessment.v1` (ZIP metadata only). Details: [snapshot comparison](SNAPSHOT_COMPARISON.md) and [archive path assessment](ARCHIVE_PATH_ASSESSMENT.md). `aml.audit.v1` remains unchanged (append-only optional nested `archive_path_assessment`).


R3 adds independent, append-only sidecars `aml.health.v1` and `aml.attachment-bytes.v1`. `aml.audit.v1`, `aml.snapshot-diff.v1`, and `aml.archive-path-assessment.v1` retain previous field meanings. Optional `audit.attachment_byte_assessment` is a scope-limited addition, never a blanket file-integrity verdict. See [R3 guide](HEALTH_AND_BYTE_VERIFICATION.md).

R6 optional audit additions: `source_container` = `SINGLE_JSON` / `NUMBERED_JSON_SHARDS` / `SINGLE_NUMBERED_JSON`; `numbered_json_parts` is a count, **not** a content completeness proof. `health` gains two trusted-only guidance codes `SINGLE_NUMBERED_JSON` and `MULTIPLE_NUMBERED_JSON`. A ZIP that fails shard validation yields no partial success. See [R6 detailed contract](R6_NUMBERED_SHARDS_SUPPORT.md).
