/* Real Chrome regression of the public offline reader. Generated fixtures only. MIT. */
'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const { pathToFileURL } = require('node:url');
const { parseArgs } = require('node:util');

const standalone = path.resolve(__dirname, '../dist/AI_Memory_Lifeboat_Offline.html');
const fileUrl = pathToFileURL(standalone).href;
const viewports = [
  { name: 'desktop', width: 1280, height: 900, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true }
];

function conversation(id, title, count) {
  const mapping = {};
  for (let number = 1; number <= count; number++) {
    const marker = number === 1110 ? ' 合成命中標記' : '';
    mapping[`m${number}`] = {
      id: `m${number}`,
      parent: number === 1 ? null : `m${number - 1}`,
      children: number === count ? [] : [`m${number + 1}`],
      message: {
        author: { role: number % 2 ? 'user' : 'assistant' },
        content: { content_type: 'text', parts: [`${title} · Synthetic message ${number}${marker}`] }
      }
    };
  }
  return { id, title, current_node: `m${count}`, mapping };
}

const primaryTitle = 'Synthetic original reader';
const replacementTitle = 'Synthetic replacement reader';
const original = JSON.stringify([
  conversation('synthetic-shared-id', primaryTitle, 1402),
  ...Array.from({ length: 200 }, (_, index) => conversation(`synthetic-filler-${index}`, `Synthetic filler ${index + 1}`, 1))
]);
const replacement = JSON.stringify([conversation('synthetic-shared-id', replacementTitle, 1)]);

async function until(check, description, timeout = 8000) {
  const start = Date.now();
  let lastError;
  while (Date.now() - start < timeout) {
    try {
      const result = await check();
      if (result) return result;
    } catch (error) {
      lastError = error;
    }
    await delay(50);
  }
  throw new Error(`Timed out waiting for ${description}`, { cause: lastError });
}

async function connect(url) {
  const socket = new WebSocket(url);
  const handlers = new Map();
  const pending = new Map();
  let nextId = 0;
  const openTimeout = setTimeout(() => socket.close(), 5000);
  try {
    await Promise.race([
      once(socket, 'open'),
      once(socket, 'error').then(() => { throw new Error(`CDP WebSocket failed: ${url}`); }),
      once(socket, 'close').then(() => { throw new Error(`CDP WebSocket closed before opening: ${url}`); })
    ]);
  } finally {
    clearTimeout(openTimeout);
  }
  socket.addEventListener('message', ({ data }) => {
    const event = JSON.parse(data);
    if (event.id) {
      const reply = pending.get(event.id);
      if (reply) reply(event);
      return;
    }
    for (const handler of handlers.get(event.method) || []) handler(event.params);
  });
  socket.addEventListener('close', () => {
    for (const reply of pending.values()) reply({ error: { message: 'CDP connection closed' } });
  });
  return {
    on(method, handler) {
      if (!handlers.has(method)) handlers.set(method, []);
      handlers.get(method).push(handler);
    },
    send(method, params = {}) {
      const id = ++nextId;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`CDP command timed out: ${method}`));
        }, 10000);
        pending.set(id, ({ result, error }) => {
          clearTimeout(timer);
          pending.delete(id);
          if (error) reject(new Error(`${method}: ${error.message}`));
          else resolve(result);
        });
        try {
          socket.send(JSON.stringify({ id, method, params }));
        } catch (error) {
          pending.get(id)({ error });
        }
      });
    },
    close: () => socket.close()
  };
}

function browserChecks(page, downloads, errors, outbound, report, output) {
  async function evaluate(fn, ...args) {
    const expression = `(${fn})(...${JSON.stringify(args)})`;
    const { result, exceptionDetails } = await page.send('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true
    });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
    return result.value;
  }
  const click = selector => evaluate(selector => document.querySelector(selector).click(), selector);
  const focus = selector => evaluate(selector => document.querySelector(selector).focus(), selector);
  const tick = () => evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)))));
  const input = (selector, value) => evaluate((selector, value) => {
    const element = document.querySelector(selector);
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, selector, value);
  const enter = async (key = 'Enter', keyCode = 13) => {
    for (const type of ['rawKeyDown', 'keyUp']) {
      await page.send('Input.dispatchKeyEvent', { type, key, code: key, windowsVirtualKeyCode: keyCode });
    }
    await tick();
  };
  const focusState = () => evaluate(() => ({
    tag: document.activeElement.tagName,
    id: document.activeElement.id,
    disabled: document.activeElement.matches(':disabled,[aria-disabled="true"]'),
    name: document.activeElement.getAttribute('aria-label'),
    hit: document.activeElement.matches('[data-reader-hit="true"]')
  }));
  const visibleMessages = () => evaluate(() => {
    const messages = [...document.querySelectorAll('#conversationDetail .message')];
    return [messages.length, messages[0]?.getAttribute('aria-label'), messages.at(-1)?.getAttribute('aria-label')];
  });
  const expectWindow = async (count, first, last) => {
    assert.deepEqual(await visibleMessages(), [count, `第 ${first} 則訊息`, `第 ${last} 則訊息`]);
  };
  const upload = async (fixture, successful = true) => {
    await evaluate(fixture => {
      const element = document.querySelector('#archiveFile');
      const transfer = new DataTransfer();
      transfer.items.add(new File([fixture], 'conversations.json', { type: 'application/json' }));
      element.files = transfer.files;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }, fixture);
    await until(() => evaluate(successful => document.querySelector('#status').classList.contains(successful ? 'ok' : 'error'), successful), 'file status');
  };
  const select = title => evaluate(title => {
    const button = [...document.querySelectorAll('#conversationList button')].find(element => element.textContent.startsWith(title));
    if (!button) throw new Error(`Conversation button not found for ${title}`);
    button.click();
  }, title);
  const startOriginal = async () => {
    await upload(original);
    await select(primaryTitle);
    await expectWindow(700, 1, 700);
  };
  const assertReset = async oldTitle => {
    const state = await evaluate(() => ({
      detail: document.querySelector('#conversationDetail').textContent,
      selected: Boolean(document.querySelector('#conversationList [aria-current="true"]')),
      search: document.querySelector('#readerQuery').value,
      jump: document.querySelector('#readerJumpInput').value,
      hitStatus: document.querySelector('#readerHitInfo').textContent,
      jumpStatus: document.querySelector('#readerJumpStatus').textContent,
      readerHidden: document.querySelector('#readerTools').hidden,
      downloadDisabled: document.querySelector('#downloadHtml').disabled,
      dialogOpen: document.querySelector('#htmlExportConfirm').open
    }));
    assert.ok(!state.detail.includes(oldTitle), 'Previous source or selection remains in detail DOM');
    assert.deepEqual({ ...state, detail: undefined }, {
      detail: undefined, selected: false, search: '', jump: '', hitStatus: '', jumpStatus: '',
      readerHidden: true, downloadDisabled: true, dialogOpen: false
    });
  };
  const dialogOpen = () => evaluate(() => document.querySelector('#htmlExportConfirm').open);
  const confirm = '#confirmHtmlExport';
  const screenshot = async name => {
    const { data } = await page.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    await fs.writeFile(path.join(output, `${report.viewport.name}-${name}.png`), Buffer.from(data, 'base64'));
  };
  async function test(name, run) {
    const start = Date.now();
    try {
      await run();
      report.cases.push({ name, status: 'PASS', durationMs: Date.now() - start });
      console.log(`${report.viewport.name} PASS ${name}`);
    } catch (error) {
      report.cases.push({ name, status: 'FAIL', durationMs: Date.now() - start, error: error.message });
      console.error(`${report.viewport.name} FAIL ${name}: ${error.message}`);
      await screenshot(`failure-${name}`).catch(err => console.error(`Could not save failure screenshot: ${err.message}`));
    }
  }
  return async () => {
    await test('message-windows', async () => {
      await startOriginal();
      await click('#readerNext');
      await expectWindow(700, 701, 1400);
      await click('#readerNext');
      await expectWindow(2, 1401, 1402);
      await evaluate(() => document.querySelector('#readerTools').scrollIntoView({ block: 'start' }));
      await tick();
      await screenshot('final-window');
    });

    await test('message-jump', async () => {
      await startOriginal();
      for (const [value, window, label] of [
        ['701', [700, 701, 1400], '第 701 則訊息'], ['1402', [2, 1401, 1402], '第 1402 則訊息']
      ]) {
        await input('#readerJumpInput', value);
        await focus('#readerJumpInput');
        await enter();
        await expectWindow(...window);
        assert.equal((await focusState()).name, label);
      }
      for (const invalid of ['0', '01', '1e3', '1403']) {
        await input('#readerJumpInput', invalid);
        await focus('#readerJumpInput');
        await enter();
        assert.equal(await evaluate(() => document.querySelector('#readerJumpInput').getAttribute('aria-invalid')), 'true', invalid);
        assert.equal((await focusState()).id, 'readerJumpInput', invalid);
        await expectWindow(2, 1401, 1402);
      }
    });

    for (const [kind, selector, value] of [
      ['search', '#readerQuery', '合成命中標記'], ['jump', '#readerJumpInput', '1402']
    ]) {
      for (const [flag, composing, keyCode] of [['is-composing', true, 13], ['229', false, 229]]) {
        await test(`ime-${kind}-${flag}`, async () => {
          await startOriginal();
          await input(selector, value);
          await focus(selector);
          const observed = await evaluate((selector, composing, keyCode) => {
            const target = document.querySelector(selector);
            const event = new KeyboardEvent('keydown', { key: 'Enter', isComposing: composing, bubbles: true, cancelable: true });
            // Chromium's synthetic constructor does not consistently populate the legacy keyCode.
            Object.defineProperty(event, 'keyCode', { value: keyCode });
            target.dispatchEvent(event);
            return {
              canceled: event.defaultPrevented,
              focusStayed: document.activeElement === target,
              highlighted: Boolean(document.querySelector('#conversationDetail [data-reader-hit="true"]'))
            };
          }, selector, composing, keyCode);
          assert.deepEqual(observed, { canceled: false, focusStayed: true, highlighted: false });
          await expectWindow(700, 1, 700);
        });
      }
    }

    await test('normal-search-enter', async () => {
      await startOriginal();
      await input('#readerQuery', '合成命中標記');
      await focus('#readerQuery');
      await enter();
      const active = await focusState();
      assert.equal(active.name, '第 1110 則訊息');
      assert.equal(active.hit, true);
      await expectWindow(700, 701, 1400);
    });

    for (const [name, button, opposite, terminal] of [
      ['next-to-last-focus', '#readerNext', '#readerPrev', [2, 1401, 1402]],
      ['prev-to-first-focus', '#readerPrev', '#readerNext', [700, 1, 700]]
    ]) {
      await test(name, async () => {
        await startOriginal();
        if (button === '#readerPrev') {
          await click('#readerNext');
          await click('#readerNext');
        }
        await focus(button);
        await enter();
        await expectWindow(700, 701, 1400);
        assert.equal((await focusState()).id, button.slice(1), 'Enabled page button lost focus before reaching the boundary');
        await enter();
        await expectWindow(...terminal);
        const active = await focusState();
        assert.ok(active.tag !== 'BODY' && !active.disabled, `Focus was lost at reader boundary: ${JSON.stringify(active)}`);
        assert.equal(await evaluate(selector => document.querySelector(selector).disabled, opposite), false);
        assert.equal(await evaluate(selector => document.querySelector(selector).disabled, button), true);
      });
    }

    await test('end-scrolls-selected-list-focus-into-view', async () => {
      await startOriginal();
      await focus('#conversationList button:first-of-type');
      await enter('End', 35);
      const state = await evaluate(() => {
        const list = document.querySelector('#conversationList');
        const buttons = [...list.querySelectorAll('button')];
        const target = document.activeElement;
        const pane = list.getBoundingClientRect();
        const row = target.getBoundingClientRect();
        return {
          count: buttons.length,
          focusPosition: buttons.indexOf(target) + 1,
          visible: row.bottom > Math.max(pane.top, 0) && row.top < Math.min(pane.bottom, innerHeight),
          oldSelection: document.querySelector('#conversationDetail h3').textContent
        };
      });
      assert.deepEqual(state, { count: 200, focusPosition: 200, visible: true, oldSelection: primaryTitle });
    });

    await test('same-id-source-replacement', async () => {
      await startOriginal();
      await input('#readerQuery', '合成命中標記');
      await click('#readerFind');
      await input('#readerJumpInput', '900');
      await upload(replacement);
      await assertReset(primaryTitle);
      assert.ok(!(await evaluate(() => document.querySelector('#results').textContent)).includes(primaryTitle));
      await select(replacementTitle);
      await expectWindow(1, 1, 1);
      assert.equal(await evaluate(() => document.querySelector('#conversationDetail h3').textContent), replacementTitle);
    });

    await test('off-page-selection-revoked', async () => {
      await startOriginal();
      // Keep the selected conversation on page one irrespective of source display order.
      assert.ok(await evaluate(() => Boolean(document.querySelector('#conversationList [aria-current="true"]'))));
      await input('#readerQuery', 'synthetic');
      await input('#readerJumpInput', '701');
      await click('#listNext');
      await assertReset(primaryTitle);
      assert.equal(await evaluate(() => document.querySelectorAll('#conversationList button').length), 1);
    });

    await test('html-export-requires-confirmation', async () => {
      await startOriginal();
      const before = downloads.length;
      await click('#downloadHtml');
      assert.equal(await dialogOpen(), true);
      await click('#cancelHtmlExport');
      assert.equal(await dialogOpen(), false);
      // Invoke the stale control explicitly. A closed modal cannot be clicked by a user.
      await click(confirm);
      await delay(200);
      assert.equal(downloads.length, before, 'Opening or canceling the dialog initiated a download');
      await click('#downloadHtml');
      assert.equal(await dialogOpen(), true);
      await click(confirm);
      await until(() => downloads.length > before, 'confirmed synthetic download');
      assert.equal(downloads.length, before + 1);
      assert.equal(downloads[before].suggestedFilename, 'aml-conversation.html');
    });

    await test('source-change-revokes-old-confirmation', async () => {
      await startOriginal();
      const before = downloads.length;
      await click('#downloadHtml');
      assert.equal(await dialogOpen(), true);
      await upload(replacement);
      await assertReset(primaryTitle);
      await select(replacementTitle);
      await click(confirm);
      await delay(200);
      assert.equal(downloads.length, before, 'Old confirmation initiated a download after replacement');
    });

    await test('failed-source-clears-private-dom', async () => {
      await startOriginal();
      await input('#readerQuery', '合成命中標記');
      await click('#readerFind');
      await input('#readerJumpInput', '1402');
      await click('#downloadHtml');
      await upload('{ Invalid synthetic JSON', false);
      await assertReset(primaryTitle);
      assert.equal(await evaluate(() => document.querySelector('#results').hidden), true);
      assert.equal(await evaluate(() => document.querySelector('#conversationList').childElementCount), 0);
      assert.ok(!(await evaluate(() => document.querySelector('#results').textContent)).includes(primaryTitle));
    });

    await test('page-makes-no-outbound-requests', async () => {
      assert.deepEqual([...outbound], []);
    });
    await test('page-has-no-console-errors', async () => {
      assert.deepEqual(errors, []);
    });
  };
}

async function verify(chrome, output, report) {
  await fs.access(standalone);
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'aml-reader-browser-'));
  const browser = spawn(chrome, [
    '--headless', '--disable-background-networking', '--disable-dev-shm-usage', '--disable-extensions', '--disable-sync',
    '--no-first-run', '--no-default-browser-check', '--no-sandbox',
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost',
    `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let processError;
  let stderr = '';
  browser.on('error', error => { processError = error; });
  browser.stderr.setEncoding('utf8');
  browser.stderr.on('data', text => { stderr = (stderr + text).slice(-4000); });
  let browserConnection;
  let page;
  try {
    let connection;
    try {
      connection = await until(async () => {
        if (processError || browser.exitCode !== null) return { failed: true };
        const [port, socketPath] = (await fs.readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).trim().split('\n');
        return port && socketPath ? { port, socketPath } : null;
      }, 'Chrome DevTools endpoint', 12000);
    } catch (error) {
      throw new Error(`${error.message}; Chrome stderr: ${stderr}`);
    }
    if (connection.failed) throw new Error(`Chrome could not start: ${processError?.message || `exit ${browser.exitCode}`}; ${stderr}`);
    const endpoint = `127.0.0.1:${connection.port}`;
    browserConnection = await connect(`ws://${endpoint}${connection.socketPath}`);
    report.browser = (await browserConnection.send('Browser.getVersion')).product;
    const downloads = [];
    browserConnection.on('Browser.downloadWillBegin', event => downloads.push(event));
    await browserConnection.send('Browser.setDownloadBehavior', {
      behavior: 'allow', downloadPath: path.join(profile, 'synthetic-downloads'), eventsEnabled: true
    });
    const targets = await (await fetch(`http://${endpoint}/json/list`, { signal: AbortSignal.timeout(5000) })).json();
    const target = targets.find(item => item.type === 'page');
    if (!target) throw new Error('Chrome has no inspectable page');
    page = await connect(target.webSocketDebuggerUrl);
    const outbound = new Set();
    const errors = [];
    const allowed = url => url === fileUrl || url.startsWith('blob:') || url.startsWith('data:') || url === 'about:blank';
    const record = url => { if (!allowed(url)) outbound.add(url); };
    page.on('Network.requestWillBeSent', ({ request }) => record(request.url));
    page.on('Network.webSocketCreated', ({ url }) => record(url));
    page.on('Fetch.requestPaused', ({ requestId, request }) => {
      const permit = allowed(request.url);
      if (!permit) record(request.url);
      const command = permit ? page.send('Fetch.continueRequest', { requestId }) : page.send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
      command.catch(error => errors.push(error.message));
    });
    page.on('Runtime.exceptionThrown', ({ exceptionDetails }) => {
      errors.push(exceptionDetails.exception?.description || exceptionDetails.text);
    });
    page.on('Runtime.consoleAPICalled', ({ type, args }) => {
      if (type === 'error' || type === 'assert') errors.push(args.map(arg => arg.value ?? arg.description).join(' '));
    });
    page.on('Log.entryAdded', ({ entry }) => {
      if (entry.level === 'error') errors.push(entry.text);
    });
    await page.send('Page.enable');
    await page.send('Network.enable');
    await page.send('Fetch.enable');
    await page.send('Runtime.enable');
    await page.send('Log.enable');

    for (const viewport of viewports) {
      const results = { viewport, cases: [] };
      report.viewports.push(results);
      try {
        outbound.clear();
        errors.length = 0;
        const { name, ...metrics } = viewport;
        await page.send('Emulation.setDeviceMetricsOverride', { ...metrics, deviceScaleFactor: 1 });
        await page.send('Emulation.setTouchEmulationEnabled', { enabled: viewport.mobile });
        const { errorText } = await page.send('Page.navigate', { url: fileUrl });
        if (errorText) throw new Error(errorText);
        await until(async () => {
          const { result } = await page.send('Runtime.evaluate', {
            expression: `location.href === ${JSON.stringify(fileUrl)} && document.readyState === 'complete' && document.querySelector('#archiveFile') !== null`,
            returnByValue: true
          });
          return result.value;
        }, `${name} standalone to load`);
        await browserChecks(page, downloads, errors, outbound, results, output)();
      } catch (error) {
        results.cases.push({ name: 'viewport-setup', status: 'FAIL', error: error.message });
        console.error(`${viewport.name} FAIL viewport-setup: ${error.message}`);
      }
    }
  } finally {
    page?.close();
    browserConnection?.close();
    if (browser.pid && browser.exitCode === null && browser.signalCode === null) {
      const exited = once(browser, 'exit');
      browser.kill();
      await Promise.race([exited, delay(2000)]);
      if (browser.exitCode === null && browser.signalCode === null) {
        browser.kill('SIGKILL');
        await exited;
      }
    }
    await fs.rm(profile, { recursive: true, force: true, maxRetries: 3 });
  }
}

async function main() {
  const { values } = parseArgs({ options: {
    chrome: { type: 'string' }, 'output-dir': { type: 'string' }, help: { type: 'boolean' }
  } });
  if (values.help) {
    console.log('Usage: node tools/verify_reader_browser.js [--chrome PATH] [--output-dir DIR]');
    return;
  }
  const output = values['output-dir'] ? path.resolve(values['output-dir']) : await fs.mkdtemp(path.join(os.tmpdir(), 'aml-reader-evidence-'));
  await fs.mkdir(output, { recursive: true });
  const report = { fixture: 'synthetic-only', entrypoint: 'file:// standalone', browser: null, viewports: [] };
  try {
    await verify(values.chrome || process.env.CHROME_BIN || 'google-chrome', output, report);
  } catch (error) {
    report.setupError = error.message;
    console.error(`FAIL browser setup: ${error.message}`);
  }
  await fs.writeFile(path.join(output, 'reader-browser.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`Reader browser evidence: ${output}`);
  if (report.setupError || report.viewports.some(viewport => viewport.cases.some(test => test.status === 'FAIL'))) process.exitCode = 1;
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
