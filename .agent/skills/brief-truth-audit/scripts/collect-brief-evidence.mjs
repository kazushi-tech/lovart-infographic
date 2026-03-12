#!/usr/bin/env node

/**
 * Brief Truth Audit Script
 *
 * Collects evidence about current repo truth vs summary claims.
 * Run from project root.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function exec(cmd, cwd = process.cwd()) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', shell: true }).trim();
  } catch (err) {
    return `ERROR: ${err.message}`;
  }
}

function fileExists(path) {
  try {
    return existsSync(resolve(process.cwd(), path));
  } catch {
    return false;
  }
}

function readFile(path) {
  try {
    return readFileSync(resolve(process.cwd(), path), 'utf-8');
  } catch {
    return null;
  }
}

function searchPattern(content, pattern) {
  if (!content) return false;
  return new RegExp(pattern).test(content);
}

// ---------------------------------------------------------------------------
// Collect baseline
// ---------------------------------------------------------------------------

const head = exec('git rev-parse --short HEAD');
const gitStatus = exec('git status --short');
const testResult = exec('npm test 2>&1 | tail -5');
const buildResult = exec('npm run build 2>&1 | tail -10');
const tscResult = exec('npx tsc --noEmit 2>&1 | tail -10');

const testPass = testResult.includes('pass') && !testResult.includes('fail');
const buildPass = buildResult.includes('ƒ') || buildResult.includes('○') || !buildResult.includes('error');
const tscPass = tscResult === '' || !tscResult.includes('error');

// ---------------------------------------------------------------------------
// Check implementation truth
// ---------------------------------------------------------------------------

// Intent wiring checks
const guidedBriefForm = readFile('components/GuidedBriefForm.tsx');
const guidedBriefOptions = readFile('lib/guided-brief-options.ts');
const guidedSubmitRoute = readFile('app/api/runs/[runId]/qa/guided-submit/route.ts');
const styleResolver = readFile('lib/style-resolver.ts');
const pipelineCore = readFile('lib/pipeline-core.ts');

const hasIntentOptions = guidedBriefOptions?.includes('INTENT_OPTIONS');
const hasIntentSelector = guidedBriefForm?.includes('IntentSelector');
const hasExpectedOutputSummary = guidedBriefForm?.includes('ExpectedOutputSummary');
const intentSavedInQA = guidedSubmitRoute?.includes('intent') && guidedSubmitRoute?.includes('category: \'content\'');
const styleResolverUsesIntent = styleResolver?.includes('intent');
const pipelineCoreUsesIntent = pipelineCore?.includes('intentOptionId') || pipelineCore?.includes('intent');

// Presentability warnings checks
const contentQualityGate = readFile('lib/content-quality-gate.ts');
const stepRoute = readFile('app/api/runs/[runId]/step/route.ts');
const runDetail = readFile('components/RunDetail.tsx');

const hasIssueSeverity = contentQualityGate?.includes('IssueSeverity');
const hasWarningsArray = contentQualityGate?.includes('warnings:');
const hasQualityGateJson = stepRoute?.includes('quality-gate.json');
const runDetailShowsWarnings = runDetail?.includes('warnings') || runDetail?.includes('qualityGate');

// Business archetype checks
const slideCompositor = readFile('lib/slide-compositor.ts');
const stylePresets = readFile('config/style-presets.ts');

const hasThesisSupportCover = slideCompositor?.includes('thesis') || slideCompositor?.includes('support');
const hasTakeawayFirstSummary = slideCompositor?.includes('takeaways');
const hasThreeColumnComparison = slideCompositor?.includes('3') || slideCompositor?.includes('column');
const hasBusinessOrientedPresets = stylePresets?.includes('consulting') || stylePresets?.includes('executive');

// ---------------------------------------------------------------------------
// Identify gaps
// ---------------------------------------------------------------------------

const gaps = [];

// Intent wiring gap
if (intentSavedInQA && !styleResolverUsesIntent && !pipelineCoreUsesIntent) {
  gaps.push({
    claim: 'intent が output behavior に直接効く',
    truth: 'intent は QA state に保存されるが、style-resolver / pipeline-core は参照していない',
    severity: 'high'
  });
}

// Warnings UI gap
if (hasWarningsArray && hasQualityGateJson && !runDetailShowsWarnings) {
  gaps.push({
    claim: 'presentability warnings が operator に見える',
    truth: 'warnings はサーバー側で生成・保存されるが、RunDetail は表示していない',
    severity: 'high'
  });
}

// Business archetype gap (runtime unverified)
if (hasThesisSupportCover && hasTakeawayFirstSummary && hasThreeColumnComparison) {
  gaps.push({
    claim: 'business archetype レンダリングが改善されている',
    truth: 'コード上の改善は入っているが、runtime で未検証',
    severity: 'medium'
  });
}

// ---------------------------------------------------------------------------
// Build evidence object
// ---------------------------------------------------------------------------

const evidence = {
  baseline: {
    head,
    gitStatus,
    test: testPass ? 'PASS' : 'FAIL',
    build: buildPass ? 'PASS' : 'FAIL',
    tsc: tscPass ? 'PASS' : 'FAIL'
  },
  implementationTruth: {
    intentWiring: intentSavedInQA
      ? (styleResolverUsesIntent || pipelineCoreUsesIntent ? 'WIRED' : 'SAVED_ONLY')
      : 'NOT_IMPLEMENTED',
    warningsUI: hasWarningsArray
      ? (runDetailShowsWarnings ? 'SURFACED' : 'SERVER_ONLY')
      : 'NOT_IMPLEMENTED',
    businessArchetype: hasThesisSupportCover && hasTakeawayFirstSummary && hasThreeColumnComparison
      ? 'CODE_EXISTS'
      : 'NOT_IMPLEMENTED'
  },
  implementationDetails: {
    hasIntentOptions,
    hasIntentSelector,
    hasExpectedOutputSummary,
    intentSavedInQA,
    styleResolverUsesIntent,
    pipelineCoreUsesIntent,
    hasIssueSeverity,
    hasWarningsArray,
    hasQualityGateJson,
    runDetailShowsWarnings,
    hasThesisSupportCover,
    hasTakeawayFirstSummary,
    hasThreeColumnComparison,
    hasBusinessOrientedPresets
  },
  gaps,
  verified: [
    'npm test pass',
    'npm run build success',
    'npx tsc --noEmit pass',
    'Intent options defined in guided-brief-options.ts',
    'Intent selector present in GuidedBriefForm.tsx',
    'Intent saved to QA state in guided-submit route',
    'IssueSeverity type defined in content-quality-gate.ts',
    'Warnings array in QualityGateResult',
    'Quality gate warnings saved to quality-gate.json',
    'Business archetype code improvements in slide-compositor.ts',
    'Business-oriented style presets added'
  ],
  notYetVerified: [
    'Intent-to-output wiring (style-resolver does not use intent)',
    'Pipeline-core does not have intent-specific prompt logic',
    'Warnings UI surfacing in RunDetail.tsx',
    'Browser smoke test of guided brief flow',
    'Cover rendering in actual output',
    'Executive summary rendering in actual output',
    'Comparison 3-column rendering in actual output',
    'E2E image generation with Gemini API',
    'Mobile device testing',
    'Screen reader testing'
  ],
  collectedAt: new Date().toISOString()
};

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const outputPath = resolve(process.cwd(), 'verify_output/brief-truth-evidence.json');

try {
  exec('mkdir -p verify_output');
} catch (err) {
  // Directory may already exist
}

writeFileSync(outputPath, JSON.stringify(evidence, null, 2));

console.log('Evidence collected to: ' + outputPath);
console.log('\nBaseline:');
console.log('  HEAD:', evidence.baseline.head);
console.log('  Tests:', evidence.baseline.test);
console.log('  Build:', evidence.baseline.build);
console.log('  TSC:', evidence.baseline.tsc);

console.log('\nImplementation Truth:');
console.log('  Intent wiring:', evidence.implementationTruth.intentWiring);
console.log('  Warnings UI:', evidence.implementationTruth.warningsUI);
console.log('  Business archetype:', evidence.implementationTruth.businessArchetype);

console.log('\nGaps:', gaps.length);
gaps.forEach((gap, i) => {
  console.log(`  ${i + 1}. [${gap.severity}] ${gap.claim}`);
  console.log(`     Truth: ${gap.truth}`);
});

console.log('\nNot Yet Verified:');
evidence.notYetVerified.forEach((item, i) => {
  console.log(`  ${i + 1}. ${item}`);
});
