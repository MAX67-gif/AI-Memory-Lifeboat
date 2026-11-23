/* R23 reproducible startup triage: bounded wait, diagnostics, never skipped browser tests. MIT. */
'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {STARTUP_BUDGET_MS}=require('../tools/verify_reader_browser.js');
test('Chrome endpoint has a finite 25s budget and separate setup evidence',()=>{
 assert.equal(STARTUP_BUDGET_MS,25000);
 const code=fs.readFileSync(path.join(__dirname,'../tools/verify_reader_browser.js'),'utf8');
 assert.match(code,/startup\.polls\+\+/);
 assert.match(code,/startup\.state = 'CDP_CONNECTED'/);
 assert.match(code,/state: 'WAITING'/);
 assert.match(code,/state = processError \|\| browser\.exitCode !== null \? 'PROCESS_EXIT_OR_START_ERROR' : 'ENDPOINT_TIMEOUT'/);
 assert.match(code,/relaunches: 0/);
 assert.match(code,/if \(report\.setupError \|\| report\.viewports\.some/);
});
