/* R14 behavior contracts, original synthetic data only. MIT. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../src/core.js'),compare=require('../src/compare.js');
const health=require('../src/health.js'),first=require('../src/first_result.js');
const row=(title,text='SYNTHETIC_BODY')=>[{id:'SYNTHETIC_ID',title,create_time:1,update_time:2,current_node:'n',mapping:{n:{parent:null,message:{author:{role:'user'},content:{parts:[text]}}}}}];
const parse=(title,text)=>core.parseChatGPTExport(row(title,text));

test('R14: long titles disclose numeric coverage and preserve raw input',()=>{
 const raw=row('T'.repeat(500)+'PRIVATE_TAIL');const p=core.parseChatGPTExport(raw),c=p.conversations[0];
 assert.equal(c.title,'T'.repeat(500));assert.equal(c.titleTruncated,true);
 assert.equal(c.sourceTitleCodeUnits,512);assert.equal(c.retainedTitleCodeUnits,500);assert.equal(c.omittedTitleCodeUnits,12);
 assert.equal(raw[0].title,'T'.repeat(500)+'PRIVATE_TAIL');
 assert.equal(p.audit.truncated_titles,1);assert.equal(p.audit.omitted_title_code_units,12);
 assert.equal(p.audit.title_limit_code_units,500);assert.equal(p.audit.title_length_unit,'UTF16_CODE_UNITS');
 assert.equal(p.audit.title_truncation_scope,'PARSED_CONVERSATION_TITLES_ONLY');
 assert.ok(p.audit.warnings.includes('CONVERSATION_TITLE_TRUNCATED'));
 assert.doesNotMatch(JSON.stringify(p.audit),/SYNTHETIC_ID|PRIVATE_TAIL|TTTT/);
});

test('R14: title cutoff does not split a valid surrogate pair',()=>{
 const c=parse('T'.repeat(499)+'😀Z').conversations[0];
 assert.equal(c.title,'T'.repeat(499));assert.equal(c.retainedTitleCodeUnits,499);assert.equal(c.omittedTitleCodeUnits,3);
 const exact=parse('T'.repeat(498)+'😀').conversations[0];
 assert.equal(exact.title.length,500);assert.equal(exact.titleTruncated,false);
});

test('R14: titles at/below 500 units and non-string fallback keep prior rendering',()=>{
 for(const title of ['', 'short', '界'.repeat(500),null,undefined,17,{},['not title']]){
  const p=parse(title),c=p.conversations[0],expected=typeof title==='string'?title:'Untitled conversation';
  assert.equal(c.title,expected);assert.equal(c.titleTruncated,false);assert.equal(c.sourceTitleCodeUnits,expected.length);
  assert.equal(c.omittedTitleCodeUnits,0);assert.equal(p.audit.truncated_titles,0);
  assert.ok(!p.audit.warnings.includes('CONVERSATION_TITLE_TRUNCATED'));
 }
});

test('R14: title metadata is independent of path availability and invalid rows are excluded',()=>{
 const raw=row('A'.repeat(501));delete raw[0].current_node;
 raw.push(...row('B'.repeat(504)),{title:'X'.repeat(900)});raw[1].id='other';
 const p=core.parseChatGPTExport(raw);
 assert.equal(p.audit.truncated_titles,2);assert.equal(p.audit.omitted_title_code_units,5);
 assert.equal(p.audit.invalid_records,1);assert.equal(p.conversations[0].pathStatus,'CURRENT_PATH_UNAVAILABLE');
});

test('R14: equal retained titles never imply equal discarded tails',()=>{
 const a=parse('A'.repeat(500)+'PRIVATE_A'),b=parse('A'.repeat(500)+'PRIVATE_B');
 const d=compare.compareSnapshots(a,b);
 assert.equal(d.items[0].status,'INCONCLUSIVE_TITLE');assert.equal(d.summary.counts.INCONCLUSIVE_TITLE,1);
 assert.equal(d.summary.title_truncation_detected_in_inputs,true);
 assert.ok(d.summary.warnings.includes('TRUNCATED_TITLES_NOT_FULLY_COMPARABLE'));
 assert.doesNotMatch(JSON.stringify(d.summary),/PRIVATE_A|PRIVATE_B|SYNTHETIC_ID|AAAA/);
});

test('R14: known body and metadata differences take precedence over title uncertainty',()=>{
 const title='A'.repeat(501),a=parse(title);
 assert.equal(compare.compareSnapshots(a,parse(title,'changed body')).items[0].status,'CURRENT_VIEW_CHANGED');
 assert.equal(compare.compareSnapshots(a,parse('B'.repeat(501))).items[0].status,'METADATA_ONLY_CHANGED');
 const raw=row(title);raw[0].update_time=3;
 assert.equal(compare.compareSnapshots(a,core.parseChatGPTExport(raw)).items[0].status,'METADATA_ONLY_CHANGED');
 assert.equal(compare.compareSnapshots(parse('A'.repeat(500)),a).items[0].status,'INCONCLUSIVE_TITLE');
 assert.equal(compare.compareSnapshots(a,parse('A'.repeat(500))).items[0].status,'INCONCLUSIVE_TITLE');
 const ordinary=parse('short');assert.equal(compare.compareSnapshots(ordinary,ordinary).items[0].status,'NO_DETECTED_CURRENT_VIEW_CHANGE');
 assert.equal(compare.compareSnapshots(ordinary,ordinary).summary.title_truncation_detected_in_inputs,false);
});

test('R14: ID, path and message-truncation uncertainty retain their prior precedence',()=>{
 const title='A'.repeat(501),a=parse(title);
 const missing=row(title);delete missing[0].id;
 assert.ok(compare.compareSnapshots(a,core.parseChatGPTExport(missing)).items.some(i=>i.status==='INCONCLUSIVE_ID'));
 const invalid=row(title);invalid[0].current_node='missing';
 assert.equal(compare.compareSnapshots(a,core.parseChatGPTExport(invalid)).items[0].status,'INCONCLUSIVE_PATH');
 assert.equal(compare.compareSnapshots(a,parse(title,'M'.repeat(2_000_001))).items[0].status,'INCONCLUSIVE_TEXT');
 const other=row(title);other[0].id='new-id';
 assert.ok(compare.compareSnapshots(a,core.parseChatGPTExport(other)).items.some(i=>i.status==='ONLY_IN_NEW_EXPORT'));
});

test('R14: shortened titles produce fixed health and text guidance without leaking titles',()=>{
 const p=parse('SECRET_TITLE_'.repeat(50)),h=health.evaluate(p.audit);
 assert.equal(h.overall,'REVIEW');assert.ok(h.checks.some(c=>c.code==='TITLE_TRUNCATED'&&c.count===1));
 const report=first.format(h,'PERSONAL_EXPORT');assert.match(report,/標題.*截短/);
 assert.doesNotMatch(JSON.stringify(h)+report,/SECRET_TITLE_|SYNTHETIC_ID/);
 const short=parse('S'.repeat(500)),d=compare.compareSnapshots(parse('S'.repeat(501)),short);
 assert.ok(health.evaluate(short.audit,{diff:d.summary}).checks.some(c=>c.code==='DIFF_LIMIT'));
 const hostile={...h,checks:[{code:'TITLE_TRUNCATED',title:'SECRET_UNTRUSTED',action:'SECRET_UNTRUSTED',count:1}]};
 assert.doesNotMatch(first.format(hostile,'PERSONAL_EXPORT'),/SECRET_UNTRUSTED/);
});

test('R14: exported HTML discloses title truncation without restoring or injecting omitted text',()=>{
 const p=parse('<script>SECRET</script>'.repeat(25)+'OMITTED_UNIQUE'),c=p.conversations[0];
 const html=core.exportConversationHtml(c);
 assert.match(html,/data-title-truncated="true"/);assert.match(html,/Title shortened/);
 assert.doesNotMatch(html,/<script>|OMITTED_UNIQUE/);assert.match(html,/&lt;script&gt;/);
 assert.doesNotMatch(core.exportConversationHtml(parse('short').conversations[0]),/data-title-truncated="true"/);
});

test('R14: search excludes omitted title tail and includes retained message text',()=>{
 const p=parse('A'.repeat(500)+'ONLY_TITLE_TAIL','FINDABLE_BODY');
 assert.equal(core.searchConversations(p.conversations,'ONLY_TITLE_TAIL').length,0);
 assert.equal(core.searchConversations(p.conversations,'FINDABLE_BODY').length,1);
});

test('R14: messages beyond the screen limit remain in parsed data, search and HTML',()=>{
 const raw=row('701 messages');for(let i=1;i<701;i++)raw[0].mapping['n'+i]={parent:i===1?'n':'n'+(i-1),message:{author:{role:'assistant'},content:{parts:['MESSAGE_'+i]}}};
 raw[0].current_node='n700';const p=core.parseChatGPTExport(raw),c=p.conversations[0];
 assert.equal(c.messages.length,701);assert.equal(c.visibleMessages,701);
 assert.equal(core.searchConversations(p.conversations,'MESSAGE_700').length,1);
 assert.match(core.exportConversationHtml(c),/MESSAGE_700/);assert.equal(p.audit.truncated_visible_messages,0);
});

test('R14: already ill-formed source titles are not silently repaired or mislabelled as cutoff',()=>{
 const p=parse('prefix\uD83D'),c=p.conversations[0];
 assert.equal(c.title,'prefix\uD83D');assert.equal(c.titleTruncated,false);
 // Protection prevents a new broken pair at the boundary, not arbitrary source validation.
});

test('R14: exported title limitation is before the long heading, and titles are wrap-safe',()=>{
 const html=core.exportConversationHtml(parse('A'.repeat(501)).conversations[0]);
 assert.ok(html.indexOf('data-title-truncated="true"')<html.indexOf('<h1>'));
 assert.match(html,/body\{[^}]*overflow-wrap:anywhere/);
});
