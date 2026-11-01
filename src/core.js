/* AI Memory Lifeboat v0.1.0 — pure, offline, dependency-free parser.
 * Copyright (c) 2026 MAX67-gif. MIT.
 * Never equate an export with a complete account backup.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.AMLCore = api;
})(typeof globalThis === 'object' ? globalThis : null, function () {
  'use strict';
  const SCHEMA = 'aml.audit.v1';
  const VERSION = '0.1.0';
  const MAX_CONVERSATIONS = 30000;
  const MAX_NODES = 350000;
  const MAX_TEXT = 2_000_000;
  const MAX_ISSUES = 150;
  const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const safeString = (x, fallback = '') => typeof x === 'string' ? x : fallback;
  const nonNegNumber = x => Number.isFinite(x) && x >= 0 ? x : null;
  const textLimit = s => s.length > MAX_TEXT ? s.slice(0, MAX_TEXT) : s;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  }
  function createIssues() {
    const items = []; let suppressed = 0;
    return {
      add(code, detail) { if (items.length < MAX_ISSUES) items.push({code, detail}); else suppressed++; },
      result() { return {items, suppressed}; }
    };
  }
  function normalizeText(message) {
    const content = object(message?.content) ? message.content : {};
    const parts = Array.isArray(content.parts) ? content.parts : [];
    let nonText = 0;
    const result = [];
    for (const part of parts) {
      if (typeof part === 'string') result.push(part);
      else if (object(part) && typeof part.text === 'string') result.push(part.text);
      else if (part !== null && part !== undefined) nonText++;
    }
    if (!parts.length && typeof content.text === 'string') result.push(content.text);
    if (!result.length && content.content_type && content.content_type !== 'text') nonText++;
    return {text: textLimit(result.join('\n')), nonText};
  }
  function countReferences(message) {
    // Count possible attachment references ONLY. Do not infer uploaded file presence.
    let count = 0;
    const attachments = message?.metadata?.attachments;
    if (Array.isArray(attachments)) count += attachments.length;
    for (const part of (Array.isArray(message?.content?.parts) ? message.content.parts : [])) {
      if (!object(part)) continue;
      if (typeof part.asset_pointer === 'string' ||
          typeof part.image_asset_pointer === 'string' ||
          typeof part.audio_asset_pointer === 'string' ||
          typeof part.file_id === 'string') count++;
    }
    return count;
  }
  function parseChatGPTExport(raw, opts = {}) {
    if (!Array.isArray(raw)) throw new Error('EXPECTED_CHATGPT_CONVERSATIONS_ARRAY');
    if (raw.length > MAX_CONVERSATIONS) throw new Error('TOO_MANY_CONVERSATIONS');
    const issues = createIssues();
    const conversations = [];
    let totalNodes = 0, totalMessageNodes = 0, branchExcluded = 0;
    let nonTextParts = 0, attachmentReferences = 0, missingPaths = 0, invalidRecords = 0;
    let missingParent = 0;
    const seenConversationIds = new Set();
    for (let i = 0; i < raw.length; i++) {
      const row = raw[i];
      if (!object(row) || !object(row.mapping)) {
        invalidRecords++;
        issues.add('INVALID_RECORD', `index=${i}; no valid mapping`);
        continue;
      }
      const mapping = row.mapping;
      const ids = Object.keys(mapping);
      totalNodes += ids.length;
      if (totalNodes > MAX_NODES) throw new Error('TOO_MANY_MESSAGE_NODES');
      const id = safeString(row.id, `index-${i}`);
      if (seenConversationIds.has(id)) issues.add('DUPLICATE_CONVERSATION_ID', `index=${i}`);
      seenConversationIds.add(id);
      let messageCount = 0, refs = 0, opaque = 0;
      for (const node of Object.values(mapping)) {
        if (!object(node) || !object(node.message)) continue;
        messageCount++;
        refs += countReferences(node.message);
        opaque += normalizeText(node.message).nonText;
      }
      totalMessageNodes += messageCount;
      attachmentReferences += refs;
      nonTextParts += opaque;
      const path = [];
      const visited = new Set();
      let cursor = typeof row.current_node === 'string' ? row.current_node : '';
      let pathValid = !!cursor;
      if (!cursor) issues.add('NO_CURRENT_NODE', `index=${i}`);
      while (cursor) {
        if (visited.has(cursor)) {
          pathValid = false;
          issues.add('PARENT_CYCLE', `index=${i}`);
          break;
        }
        visited.add(cursor);
        const node = mapping[cursor];
        if (!object(node)) {
          pathValid = false;
          missingParent++;
          issues.add('MISSING_PARENT_OR_NODE', `index=${i}`);
          break;
        }
        path.push(node);
        cursor = typeof node.parent === 'string' ? node.parent : '';
        if (visited.size > ids.length + 1) {
          pathValid = false; issues.add('PATH_LIMIT', `index=${i}`); break;
        }
      }
      const active = [];
      if (pathValid) {
        for (const node of path.reverse()) {
          const msg = node.message;
          if (!object(msg)) continue;
          const role = safeString(msg.author?.role, 'unknown');
          const payload = normalizeText(msg);
          if (role === 'user' || role === 'assistant') {
            active.push({role, text: payload.text, nonText: payload.nonText,
              created: nonNegNumber(msg.create_time)});
          }
        }
      } else missingPaths++;
      const activeNodes = pathValid ? path.filter(n => object(n.message)).length : 0;
      const excluded = Math.max(0, messageCount - activeNodes);
      branchExcluded += excluded;
      const title = textLimit(safeString(row.title, 'Untitled conversation')).slice(0, 500);
      const createTime = nonNegNumber(row.create_time);
      const updateTime = nonNegNumber(row.update_time);
      conversations.push({id, title, created:createTime, updated:updateTime,
        messageNodes:messageCount, visibleMessages:active.length, excludedNodes:excluded,
        pathStatus:pathValid?'CURRENT_PATH_PRESENT':'CURRENT_PATH_UNAVAILABLE',
        referenceCount:refs, nonTextCount:opaque, messages:active});
    }
    const warnings = [];
    if (invalidRecords) warnings.push('INVALID_RECORDS_SKIPPED');
    if (missingPaths) warnings.push('SOME_CURRENT_PATHS_UNAVAILABLE');
    if (missingParent) warnings.push('BROKEN_PARENT_CHAIN');
    if (branchExcluded) warnings.push('OFF_PATH_NODES_NOT_IN_READING_VIEW');
    if (attachmentReferences) warnings.push('ATTACHMENT_REFERENCES_NOT_PROOF_OF_SAVED_FILES');
    if (nonTextParts) warnings.push('NON_TEXT_PARTS_NOT_RENDERED');
    const audit = {
      schema: SCHEMA, tool_version: VERSION, source_type:'CHATGPT_CONVERSATIONS_JSON',
      account_completeness:'NOT_VERIFIABLE_FROM_EXPORT',
      extraction_scope:'CONVERSATIONS_MAPPING_CURRENT_PATH_ONLY',
      input_records:raw.length, parsed_records:conversations.length, invalid_records:invalidRecords,
      total_message_nodes:totalMessageNodes, active_visible_messages:conversations.reduce((n,c)=>n+c.visibleMessages,0),
      off_path_message_nodes:branchExcluded, missing_current_paths:missingPaths,
      attachment_reference_observations:attachmentReferences, non_text_parts_not_rendered:nonTextParts,
      warnings, issues:issues.result().items, additional_issues_suppressed:issues.result().suppressed,
      zip_entry_count: Number.isInteger(opts.zipEntryCount) ? opts.zipEntryCount : null,
      zip_entry_bytes_not_extracted: opts.zipEntryCount !== undefined,
      claims_not_made:['all_account_data_exported','all_attachments_present','all_conversation_branches_rendered','platform_restore_possible']
    };
    return {audit, conversations};
  }
  function searchConversations(items, query) {
    const q = String(query||'').trim().toLocaleLowerCase();
    if (!q) return items;
    return items.filter(c => c.title.toLocaleLowerCase().includes(q) ||
      c.messages.some(m => m.text.toLocaleLowerCase().includes(q)));
  }
  function formatTime(s) {
    if (!Number.isFinite(s) || s < 0 || s > 1e12) return 'Unknown';
    const date = new Date(s * 1000);
    return Number.isNaN(date.getTime()) ? 'Unknown' : date.toISOString().replace('T',' ').slice(0,16)+' UTC';
  }
  function exportConversationHtml(c) {
    if (!c || !Array.isArray(c.messages)) throw new TypeError('INVALID_CONVERSATION');
    const messages = c.messages.map(m => `<section><h2>${escapeHtml(m.role)}</h2><pre>${escapeHtml(m.text || (m.nonText ? '[Non-text content not rendered]' : '[Empty text]'))}</pre></section>`).join('\n');
    return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
      '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'">'+
      `<title>${escapeHtml(c.title)}</title><style>body{font:16px/1.6 system-ui;max-width:800px;margin:36px auto;padding:0 20px;color:#222}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;background:#f5f5f5;padding:16px;border-radius:8px}section{border-top:1px solid #ddd}small{color:#555}</style></head><body><h1>${escapeHtml(c.title)}</h1>`+
      `<p><small>AI Memory Lifeboat ${VERSION} · ${escapeHtml(c.pathStatus)} · ${escapeHtml(formatTime(c.updated))}</small></p>`+
      '<p><strong>Partial reading view:</strong> only the exported current path is shown. Off-path branches, non-text data and unexported account content are NOT certified as preserved.</p>'+messages+'</body></html>';
  }
  return Object.freeze({VERSION,SCHEMA,parseChatGPTExport,searchConversations,exportConversationHtml,formatTime,escapeHtml});
});
