'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../src/core.js');
const health=require('../src/health.js');
const first=require('../src/first_result.js');
const compare=require('../src/compare.js');
const LIMIT=2_000_000;
const row=(parts)=>[{id:'synthetic-r13-id',title:'Synthetic R13 example',current_node:'n',mapping:{n:{parent:null,message:{author:{role:'user'},content:{parts}}}}}];
const parse=parts=>core.parseChatGPTExport(row(parts));

test('R13: a shortened current-path message declares omitted UTF-16 units without leaking text',()=>{
 const p=parse(['A'.repeat(LIMIT)+'PRIVATE_TAIL']);
 const m=p.conversations[0].messages[0];
 assert.equal(m.textTruncated,true);
 assert.equal(m.sourceTextCodeUnits,LIMIT+12);
 assert.equal(m.retainedTextCodeUnits,LIMIT);
 assert.equal(m.omittedTextCodeUnits,12);
 assert.equal(p.audit.truncated_visible_messages,1);
 assert.equal(p.audit.truncated_conversations,1);
 assert.equal(p.audit.omitted_text_code_units,12);
 assert.equal(p.audit.text_length_unit,'UTF16_CODE_UNITS');
 assert.ok(p.audit.warnings.includes('VISIBLE_MESSAGE_TEXT_TRUNCATED'));
 assert.doesNotMatch(JSON.stringify(p.audit),/PRIVATE_TAIL|synthetic-r13-id|Synthetic R13 example/);
});

test('R13: health and trusted TXT report require review for shortened visible text',()=>{
 const p=parse(['A'.repeat(LIMIT)+'PRIVATE_TAIL']);
 const h=health.evaluate(p.audit);
 assert.equal(h.overall,'REVIEW');
 assert.ok(h.checks.some(x=>x.code==='TEXT_TRUNCATED'&&x.count===1));
 assert.ok(!h.checks.some(x=>x.code==='NO_DETECTED_PROBLEMS'));
 const txt=first.format(h,'PERSONAL_EXPORT');
 assert.match(txt,/截短/);
 assert.doesNotMatch(JSON.stringify(h)+txt,/PRIVATE_TAIL|synthetic-r13-id|Synthetic R13 example/);
});

test('R13: identical retained prefixes with different omitted tails are inconclusive',()=>{
 const prefix='A'.repeat(LIMIT);
 const older=parse([prefix+'OLD_PRIVATE_SUFFIX']);
 const newer=parse([prefix+'NEW_PRIVATE_SUFFIX']);
 const d=compare.compareSnapshots(older,newer);
 assert.equal(d.items[0].status,'INCONCLUSIVE_TEXT');
 assert.equal(d.summary.counts.INCONCLUSIVE_TEXT,1);
 assert.equal(d.summary.counts.NO_DETECTED_CURRENT_VIEW_CHANGE,0);
 assert.equal(d.summary.text_truncation_detected_in_inputs,true);
 assert.ok(d.summary.warnings.includes('TRUNCATED_TEXT_NOT_FULLY_COMPARABLE'));
 assert.doesNotMatch(JSON.stringify(d.summary),/PRIVATE_SUFFIX|synthetic-r13-id|Synthetic R13 example/);
});

test('R13: the downloaded conversation warns at each shortened message',()=>{
 const p=parse(['A'.repeat(LIMIT)+'PRIVATE_TAIL']);
 const html=core.exportConversationHtml(p.conversations[0]);
 assert.match(html,/Text shortened/);
 assert.match(html,/data-text-truncated="true"/);
 assert.doesNotMatch(html,/PRIVATE_TAIL/);
 assert.ok(Buffer.byteLength(html)<16*1024*1024);
 const ordinary=core.exportConversationHtml(parse(['short sample']).conversations[0]);
 assert.doesNotMatch(ordinary,/data-text-truncated="true"/);
});

test('R13: empty, short and exact-limit text remain complete within the supported reading scope',()=>{
 for(const s of ['', '普通的中文範例', 'A'.repeat(LIMIT)]){
  const p=parse([s]), m=p.conversations[0].messages[0];
  assert.equal(m.text,s);assert.equal(m.textTruncated,false);
  assert.equal(m.sourceTextCodeUnits,s.length);assert.equal(m.omittedTextCodeUnits,0);
  assert.equal(p.audit.truncated_visible_messages,0);
  assert.ok(!p.audit.warnings.includes('VISIBLE_MESSAGE_TEXT_TRUNCATED'));
 }
});

test('R13: joined string and object.text parts count newline separators in the same bounded message',()=>{
 const p=parse(['A'.repeat(LIMIT-2),{text:'BCDE'},{image_asset_pointer:'fictional-image'}]);
 const m=p.conversations[0].messages[0];
 assert.equal(m.text,'A'.repeat(LIMIT-2)+'\nB');
 assert.equal(m.sourceTextCodeUnits,LIMIT+3);assert.equal(m.omittedTextCodeUnits,3);
 assert.equal(m.nonText,1);
});

test('R13: fallback content.text is marked as shortened, and the input remains unchanged',()=>{
 const raw=row([]);raw[0].mapping.n.message.content={text:'X'.repeat(LIMIT+9)};
 const p=core.parseChatGPTExport(raw);
 assert.equal(p.audit.omitted_text_code_units,9);
 assert.equal(raw[0].mapping.n.message.content.text.length,LIMIT+9);
});

test('R13: valid surrogate pairs are never cut in half at the UTF-16 boundary',()=>{
 const p=parse(['A'.repeat(LIMIT-1)+'😀Z']);const m=p.conversations[0].messages[0];
 assert.equal(m.text,'A'.repeat(LIMIT-1));
 assert.equal(m.retainedTextCodeUnits,LIMIT-1);assert.equal(m.omittedTextCodeUnits,3);
 assert.equal(parse(['A'.repeat(LIMIT-2)+'😀']).conversations[0].messages[0].textTruncated,false);
});

test('R13: off-path text is not counted twice or presented as visible-message truncation',()=>{
 const raw=row(['short']);
 raw[0].mapping.off={parent:null,message:{author:{role:'assistant'},content:{parts:['Z'.repeat(LIMIT+2)]}}};
 const p=core.parseChatGPTExport(raw);
 assert.equal(p.audit.truncated_visible_messages,0);assert.equal(p.audit.omitted_text_code_units,0);
 assert.equal(p.audit.off_path_message_nodes,1);
});

test('R13: multiple long visible messages aggregate once and exclude hidden roles',()=>{
 const raw=row(['A'.repeat(LIMIT+7)]);
 raw[0].mapping.b={parent:'n',message:{author:{role:'assistant'},content:{parts:['B'.repeat(LIMIT+3)]}}};
 raw[0].mapping.s={parent:'b',message:{author:{role:'system'},content:{parts:['C'.repeat(LIMIT+5)]}}};
 raw[0].current_node='s';
 const p=core.parseChatGPTExport(raw);
 assert.equal(p.audit.truncated_visible_messages,2);assert.equal(p.audit.truncated_conversations,1);
 assert.equal(p.audit.omitted_text_code_units,10);
 assert.equal(p.audit.text_truncation_scope,'VISIBLE_USER_ASSISTANT_CURRENT_PATH_ONLY');
});

test('R13: searching cannot find an omitted tail, while an ordinary snapshot retains its prior status',()=>{
 const p=parse(['A'.repeat(LIMIT)+'UNIQUE_PRIVATE_TAIL']);
 assert.equal(core.searchConversations(p.conversations,'UNIQUE_PRIVATE_TAIL').length,0);
 const ordinary=parse(['ordinary text']);
 const d=compare.compareSnapshots(ordinary,ordinary);
 assert.equal(d.items[0].status,'NO_DETECTED_CURRENT_VIEW_CHANGE');
 assert.equal(d.summary.counts.INCONCLUSIVE_TEXT,0);
 assert.equal(d.summary.text_truncation_detected_in_inputs,false);
});

test('R13: truncation in the older input alone still triggers inconclusive comparison and health review',()=>{
 const old=parse(['A'.repeat(LIMIT)+'tail']), now=parse(['A'.repeat(LIMIT)]);
 const d=compare.compareSnapshots(old,now).summary;
 assert.equal(d.counts.INCONCLUSIVE_TEXT,1);
 assert.equal(health.evaluate(now.audit,{diff:d}).overall,'REVIEW');
});

test('R13: a synthetic hostile title or content is not echoed in audit, health, TXT or comparison summary',()=>{
 const raw=row(['A'.repeat(LIMIT)+'<script>SECRET_TAIL</script>']);
 raw[0].title='SECRET_TITLE';raw[0].id='SECRET_ID';
 const p=core.parseChatGPTExport(raw),h=health.evaluate(p.audit);
 assert.doesNotMatch(JSON.stringify([p.audit,h,compare.compareSnapshots(p,p).summary])+first.format(h,'PERSONAL_EXPORT'),/SECRET_|<script>/);
});
