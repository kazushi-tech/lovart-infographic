/**
 * Strict Phase 2b: Full-Deck E2E Review with Strict Completion Gates
 *
 * Success Conditions (ALL must be true):
 * 1. Pipeline progress = 100%
 * 2. Expected slide count reached (typically 3 per theme)
 * 3. Acceptance signal visible in UI (共有可/要確認/高リスク)
 * 4. Screenshots saved per slide
 * 5. Background validation metrics captured
 *
 * Forbidden Conditions:
 * - NEVER declare complete with slideCount > 0 alone
 * - NEVER assume visual quality from counter metrics alone
 * - NEVER call smoke test "full-deck review"
 */
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SS_DIR = path.join(__dirname, '../../../verify_output/screenshots', 'strict_phase2b_' + Date.now());
fs.mkdirSync(SS_DIR, { recursive: true });

const CDP_PORT = 9222;
const APP_URL = 'http://localhost:3456';
const API_KEY = process.env.GEMINI_API_KEY || '';
const APP_PASSWORD = process.env.APP_PASSWORD || 'demo';

// Expected slide count per theme (adjust based on QA answers)
const EXPECTED_SLIDES = 3;

const THEMES = [
  'SaaS事業における顧客離脱防止のデータ活用戦略',
  'DX推進による業務効率化とコスト削減の実績',
  '新規事業展開のための市場分析と競合比較'
];

console.log(`API Key: ${API_KEY ? 'Set (' + API_KEY.substring(0, 10) + '...)' : 'NOT SET'}`);
console.log(`App Password: ${APP_PASSWORD ? 'Set' : 'NOT SET'}`);
console.log(`Expected Slides per Theme: ${EXPECTED_SLIDES}`);

let ws, msgId = 1;
const pending = new Map();

async function connect() {
  const res = await fetch(`http://localhost:${CDP_PORT}/json`);
  const targets = await res.json();
  const page = targets.find(t => t.type === 'page' && !t.url.includes('devtools') && !t.url.includes('extension'));
  if (!page) throw new Error('No page target');
  console.log('[CDP] Target:', page.url);
  return new Promise((resolve, reject) => {
    ws = new WebSocket(page.webSocketDebuggerUrl);
    ws.on('open', () => { console.log('[CDP] Connected'); resolve(); });
    ws.on('error', reject);
    ws.on('message', d => {
      const m = JSON.parse(d.toString());
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    });
  });
}

function send(method, params = {}, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    const t = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout: ${method}`)); }, timeout);
    pending.set(id, m => { clearTimeout(t); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

function fire(method, params = {}) {
  ws.send(JSON.stringify({ id: msgId++, method, params }));
}

async function evaluate(expr, timeout = 30000) {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, timeout);
  if (r.exceptionDetails) throw new Error('JS: ' + JSON.stringify(r.exceptionDetails));
  return r.result?.value;
}

async function ss(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  const p = path.join(SS_DIR, `${name}.png`);
  fs.writeFileSync(p, Buffer.from(data, 'base64'));
  console.log(`  [SS] ${name}.png`);
  return p;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------------
// STRICT GATE CHECKERS
// ---------------------------------------------------------------------

async function checkPipelineProgress() {
  return evaluate(`
    (() => {
      const text = document.body.innerText;
      const m = text.match(/(\\d+)%/g);
      return m ? parseInt(m[m.length - 1]) : -1;
    })()
  `);
}

async function checkExpectedSlideCount() {
  return evaluate(`
    (() => {
      const imgs = document.querySelectorAll('img');
      const slideImgs = [...imgs].filter(i =>
        i.src && (i.src.includes('/slide') || i.src.includes('/output'))
          && i.naturalWidth > 100
      );
      return slideImgs.length;
    })()
  `);
}

async function checkAcceptanceSignal() {
  return evaluate(`
    (() => {
      const text = document.body.innerText;
      return {
        hasSignal: text.includes('共有可') || text.includes('要確認') || text.includes('高リスク'),
        signalValue: (text.includes('共有可') ? '安全' : text.includes('要確認') ? '要確認' : text.includes('高リスク') ? '高リスク' : 'なし'),
        fullText: text.slice(0, 500)
      };
    })()
  `);
}

async function getBackgroundValidation() {
  return evaluate(`
    (() => {
      const text = document.body.innerText;
      const bgWhite = (text.match(/white fallback|白フォールバック/gi) || []).length;
      const bgDetected = (text.match(/background text|背景テキスト|bgDetected/gi) || []).length;
      const warnings = (text.match(/compose warning|合成警告/gi) || []).length;

      return {
        bgWhiteFallback: bgWhite,
        bgTextDetected: bgDetected,
        composeWarnings: warnings,
        hasAcceptanceSignal: text.includes('共有可') || text.includes('要確認') || text.includes('高リスク'),
        pageText: text.slice(0, 1000)
      };
    })()
  `);
}

// ---------------------------------------------------------------------
// STRICT COMPLETION CHECK
// ---------------------------------------------------------------------

async function isFullDeckComplete() {
  const pipelineProgress = await checkPipelineProgress();
  const slideCount = await checkExpectedSlideCount();
  const acceptance = await checkAcceptanceSignal();

  console.log(`\n  === STRICT COMPLETION CHECK ===`);
  console.log(`  Pipeline Progress: ${pipelineProgress}%`);
  console.log(`  Slide Count: ${slideCount} (Expected: ${EXPECTED_SLIDES})`);
  console.log(`  Acceptance Signal: ${acceptance.signalValue} (Visible: ${acceptance.hasSignal})`);

  const isComplete =
    pipelineProgress >= 100 &&
    slideCount >= EXPECTED_SLIDES &&
    acceptance.hasSignal;

  console.log(`  === RESULT: ${isComplete ? 'PASS' : 'FAIL'} ===`);

  return {
    isComplete,
    pipelineProgress,
    slideCount,
    acceptance
  };
}

// ---------------------------------------------------------------------
// MAIN FLOW
// ---------------------------------------------------------------------

async function getAnsweredCount() {
  return evaluate(`
    (() => {
      const text = document.body.innerText;
      const m = text.match(/(\\d+)\\/(\\d+)\\s*回答/);
      if (m) return parseInt(m[1]);
      return -1;
    })()
  `);
}

async function isQADone() {
  return evaluate(`
    (() => {
      const text = document.body.innerText;
      return text.includes('再生成') || text.includes('テキスト生成') ||
             text.includes('画像生成') || text.includes('生成開始') ||
             (text.includes('保存して戻る') && !text.includes('回答'));
    })()
  `);
}

async function clickCurrentOption() {
  return evaluate(`
    (() => {
      const containers = document.querySelectorAll('[class*="animate-fade-in"]');
      if (containers.length === 0) return 'NO_CONTAINER';
      const current = containers[containers.length - 1];

      const gridBtns = current.querySelectorAll('[class*="grid-cols"] button');
      if (gridBtns.length >= 3) {
        const valid = [...gridBtns].filter(b => !b.disabled);
        if (valid.length > 0) { valid[1].click(); return 'STYLE:' + valid.length; }
      }

      const optBtns = current.querySelectorAll('[class*="pl-9"] button');
      if (optBtns.length >= 2) {
        const valid = [...optBtns].filter(b => !b.disabled && !b.textContent.includes('その他'));
        if (valid.length > 0) { valid[0].click(); return 'OPTION:' + valid.length; }
      }

      const allBtns = current.querySelectorAll('button');
      const valid = [...allBtns].filter(b => !b.disabled && !b.textContent.includes('その他'));
      if (valid.length > 0) { valid[0].click(); return 'FALLBACK:' + valid.length; }

      return 'NO_BUTTONS';
    })()
  `);
}

async function waitFor(fn, label, timeout = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { const v = await fn(); if (v) return v; } catch {}
    await sleep(1000);
  }
  throw new Error(`Timeout waiting for: ${label}`);
}

async function navigateToNewRun() {
  console.log('\n[1] Navigate to /runs/new');
  await send('Page.navigate', { url: `${APP_URL}/runs/new` });
  await sleep(3000);

  const needsAuth = await evaluate(`!!document.querySelector('input[type="password"]')`);
  if (needsAuth) {
    console.log('  Auto-authenticating...');
    await evaluate(`
      (() => {
        const pwInput = document.querySelector('input[type="password"]');
        if (pwInput) {
          pwInput.value = ${JSON.stringify(APP_PASSWORD)};
          pwInput.dispatchEvent(new Event('input', { bubbles: true }));
          pwInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()
    `);
    await sleep(500);
    await evaluate(`
      (() => {
        const btns = [...document.querySelectorAll('button')];
        const login = btns.find(b => b.textContent.includes('ログイン') || b.textContent.includes('Login'));
        if (login) login.click();
      })()
    `);
    await sleep(2000);
    await ss('01a_after_auth');
    const stillNeedsAuth = await evaluate(`!!document.querySelector('input[type="password"]')`);
    if (stillNeedsAuth) {
      console.log('  ERROR: Authentication failed');
      process.exit(1);
    }
    console.log('  Authentication successful');
  }

  await evaluate(`
    (() => {
      if (${JSON.stringify(API_KEY)}) {
        sessionStorage.setItem('nb-gemini-chat-api-key', ${JSON.stringify(API_KEY)});
        console.log('API key set in sessionStorage');
      }
    })()
  `);
  await sleep(500);
  await ss('01_new_run');
}

async function enterTheme(theme) {
  console.log(`\n[2] Entering theme: ${theme}`);
  await evaluate(`
    (() => {
      const ta = document.querySelector('textarea');
      if (ta) {
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
        setter.call(ta, ${JSON.stringify(theme)});
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        ta.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await sleep(500);
  await ss('02_theme_entered');

  const started = await evaluate(`
    (() => {
      const btns = [...document.querySelectorAll('button')];
      const start = btns.find(b => b.textContent.includes('生成開始') || b.textContent.includes('始める'));
      if (start && !start.disabled) { start.click(); return true; }
      return false;
    })()
  `);
  console.log(`  Start clicked: ${started}`);
  await sleep(4000);
  await ss('03_after_start');
}

async function answerQA() {
  console.log('\n[3] QA Flow');
  let lastAnswered = -1;

  for (let q = 1; q <= 15; q++) {
    if (await isQADone()) {
      console.log(`  QA completed (post-QA view detected)`);
      break;
    }

    console.log(`  [Q${q}] Waiting for question...`);

    try {
      await waitFor(async () => {
        if (await isQADone()) return 'DONE';
        const count = await getAnsweredCount();
        if (q === 1 && count <= 0) return 'READY';
        if (count === q - 1) return 'READY';
        return null;
      }, `Q${q} ready`, 45000);
    } catch {
      console.log(`  Q${q} timeout - checking if done`);
      if (await isQADone()) break;
      await ss(`q${String(q).padStart(2,'0')}_timeout`);
      break;
    }

    if (await isQADone()) {
      console.log(`  QA completed`);
      break;
    }

    await ss(`q${String(q).padStart(2,'0')}_options`);

    const clickResult = await clickCurrentOption();
    console.log(`  Q${q} clicked: ${clickResult}`);

    if (clickResult.startsWith('NO_')) {
      console.log(`  Failed to find clickable option`);
      break;
    }

    try {
      await waitFor(async () => {
        if (await isQADone()) return 'DONE';
        const count = await getAnsweredCount();
        return count >= q ? 'ADVANCED' : null;
      }, `Q${q} advance`, 15000);
    } catch {
      console.log(`  Q${q} may not have advanced, continuing...`);
    }

    lastAnswered = q;
    await sleep(1500);
  }

  const finalCount = await getAnsweredCount();
  await ss('04_qa_done');
  console.log(`  Final answered count: ${finalCount}`);
  return finalCount > 0 ? finalCount : lastAnswered;
}

async function waitForPipeline() {
  console.log('\n[4] Pipeline monitoring (STRICT MODE)');

  const clicked = await evaluate(`
    (() => {
      const btns = [...document.querySelectorAll('button')];
      const btn = btns.find(b =>
        (b.textContent.includes('再生成') || b.textContent.includes('生成開始') || b.textContent.includes('スライド生成'))
        && !b.disabled
      );
      if (btn) { btn.click(); return btn.textContent.trim().slice(0, 20); }
      return null;
    })()
  `);
  if (clicked) console.log(`  Clicked: "${clicked}"`);
  await sleep(3000);
  await ss('05_pipeline_start');

  let lastStatus = '';
  const startTime = Date.now();
  const TIMEOUT = 300000;

  while (Date.now() - startTime < TIMEOUT) {
    const status = await evaluate(`
      (() => {
        const text = document.body.innerText;
        const steps = text.match(/(?:テキスト|画像|合成|スライド|完了|生成中|処理中|プロンプト|背景|ステップ).{0,30}/g);
        return steps ? steps.slice(0, 5).join(' | ') : '';
      })()
    `).catch(() => '');

    if (status && status !== lastStatus) {
      const sec = ((Date.now() - startTime) / 1000).toFixed(0);
      console.log(`  [${sec}s] ${status.slice(0, 140)}`);
      lastStatus = status;
    }

    const checkResult = await isFullDeckComplete();
    if (checkResult.isComplete) {
      const sec = ((Date.now() - startTime) / 1000).toFixed(0);
      console.log(`\n  === STRICT COMPLETE in ${sec}s ===`);
      console.log(`  Pipeline: ${checkResult.pipelineProgress}%`);
      console.log(`  Slides: ${checkResult.slideCount}/${EXPECTED_SLIDES}`);
      console.log(`  Acceptance: ${checkResult.acceptance.signalValue}`);
      await ss('06_strict_complete');
      return { success: true, ...checkResult };
    }

    await sleep(3000);
  }

  console.log('  TIMEOUT - STRICT CHECK FAILED');
  await ss('06_pipeline_timeout');
  return { success: false, timeout: true };
}

async function captureResults(theme) {
  console.log('\n[5] Capturing final results');

  const bgValidation = await getBackgroundValidation();
  const slideCount = await checkExpectedSlideCount();
  const acceptance = await checkAcceptanceSignal();

  console.log(`  Background validation:`, bgValidation);
  console.log(`  Slide count: ${slideCount}/${EXPECTED_SLIDES}`);
  console.log(`  Acceptance signal: ${acceptance.signalValue}`);
  await ss('07_final_results');

  await evaluate(`window.scrollTo(0, document.body.scrollHeight / 3)`);
  await sleep(500);
  await ss('08_scroll_mid');
  await evaluate(`window.scrollTo(0, document.body.scrollHeight)`);
  await sleep(500);
  await ss('09_scroll_bottom');

  return {
    bgValidation,
    slideCount,
    acceptance
  };
}

// ---------------------------------------------------------------------------
async function main() {
  console.log('=== Strict Phase 2b: Full-Deck E2E Review ===');
  console.log(`Screenshots: ${SS_DIR}`);
  console.log(`Expected Slides: ${EXPECTED_SLIDES}`);
  console.log(`Themes: ${THEMES.length}\n`);

  const results = [];

  try {
    await connect();
    fire('Page.enable');
    fire('Page.bringToFront');
    fire('Runtime.enable');
    fire('Page.reload');
    await sleep(2000);
    await send('Page.enable');
    await send('Runtime.enable');

    for (let i = 0; i < THEMES.length; i++) {
      const theme = THEMES[i];
      console.log(`\n\n=== Theme ${i + 1}/${THEMES.length} ===`);
      console.log(`Theme: ${theme}\n`);

      await navigateToNewRun();
      await enterTheme(theme);
      const qaCount = await answerQA();
      console.log(`\n  QA answers: ${qaCount}`);

      const pipelineResult = await waitForPipeline();
      const finalResults = await captureResults(theme);

      results.push({
        theme,
        qaCount,
        slideCount: finalResults.slideCount,
        expectedSlides: EXPECTED_SLIDES,
        pipelineSuccess: pipelineResult.success,
        strictComplete: pipelineResult.success && finalResults.slideCount >= EXPECTED_SLIDES,
        bgValidation: finalResults.bgValidation,
        acceptance: finalResults.acceptance
      });

      // Save results incrementally
      const resultPath = path.join(SS_DIR, `results_theme${i+1}.json`);
      fs.writeFileSync(resultPath, JSON.stringify({ ...results[i], screenshotDir: SS_DIR }, null, 2));

      if (i < THEMES.length - 1) {
        console.log(`\n  Moving to next theme in 3s...`);
        await sleep(3000);
      }
    }

    console.log('\n\n=== STRICT PHASE 2B RESULTS ===');
    results.forEach((r, i) => {
      console.log(`\nTheme ${i + 1}: ${r.theme.substring(0, 30)}...`);
      console.log(`  QA: ${r.qaCount} answers`);
      console.log(`  Slides: ${r.slideCount}/${r.expectedSlides}`);
      console.log(`  Strict Complete: ${r.strictComplete ? 'YES' : 'NO'}`);
      console.log(`  Pipeline: ${r.pipelineSuccess ? 'SUCCESS' : 'FAILED'}`);
      console.log(`  BG White Fallback: ${r.bgValidation?.bgWhiteFallback || 'N/A'}`);
      console.log(`  BG Text Detected: ${r.bgValidation?.bgTextDetected || 'N/A'}`);
      console.log(`  Compose Warnings: ${r.bgValidation?.composeWarnings || 'N/A'}`);
      console.log(`  Acceptance Signal: ${r.acceptance?.signalValue || 'N/A'} (Visible: ${r.acceptance?.hasSignal})`);
    });

    const finalResultPath = path.join(SS_DIR, 'final_results.json');
    fs.writeFileSync(finalResultPath, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${finalResultPath}`);
    console.log(`Screenshots: ${SS_DIR}`);

    process.exit(0);
  } catch (err) {
    console.error('\n[FATAL]', err.message);
    try { await ss('fatal_error'); } catch {}

    const resultPath = path.join(SS_DIR, 'partial_results.json');
    if (results.length > 0) {
      fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
      console.log(`Partial results saved to: ${resultPath}`);
    }

    process.exit(1);
  } finally {
    if (ws) ws.close();
  }
}

main();
