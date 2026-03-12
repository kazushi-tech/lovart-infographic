#!/usr/bin/env node

/**
 * Guided Intent Wiring Check Script
 *
 * Checks if intent is properly wired from UI to output.
 * Run from project root.
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
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

function readFile(path) {
  try {
    return readFileSync(resolve(process.cwd(), path), 'utf-8');
  } catch {
    return null;
  }
}

function searchPattern(content, pattern) {
  if (!content) return false;
  return new RegExp(pattern, 'gi').test(content);
}

function extractPatterns(content, patterns) {
  if (!content) return {};
  const results = {};
  for (const [name, pattern] of Object.entries(patterns)) {
    const matches = content.match(new RegExp(pattern, 'gi'));
    results[name] = matches ? matches.length : 0;
  }
  return results;
}

// ---------------------------------------------------------------------------
// Check wiring at each point
// ---------------------------------------------------------------------------

const results = {
  timestamp: new Date().toISOString(),
  wiringPoints: []
};

// Point 1: Intent definition in guided-brief-options.ts
const guidedBriefOptions = readFile('lib/guided-brief-options.ts');
const hasIntentOptions = guidedBriefOptions?.includes('INTENT_OPTIONS');
const hasExpectedOutput = guidedBriefOptions?.includes('expectedOutput');
const hasSuggestedStyleId = guidedBriefOptions?.includes('suggestedStyleId');
const hasPageKindSequence = guidedBriefOptions?.includes('pageKindSequence');
const hasPromptContext = guidedBriefOptions?.includes('promptContext');

results.wiringPoints.push({
  point: 'Intent definition (guided-brief-options.ts)',
  status: hasIntentOptions ? 'OK' : 'MISSING',
  checks: {
    hasIntentOptions,
    hasExpectedOutput,
    hasSuggestedStyleId,
    hasPageKindSequence,
    hasPromptContext
  }
});

// Point 2: Intent UI in GuidedBriefForm.tsx
const guidedBriefForm = readFile('components/GuidedBriefForm.tsx');
const hasIntentSelector = guidedBriefForm?.includes('IntentSelector');
const hasExpectedOutputSummary = guidedBriefForm?.includes('ExpectedOutputSummary');
const intentImported = guidedBriefForm?.includes('INTENT_OPTIONS');

results.wiringPoints.push({
  point: 'Intent UI (GuidedBriefForm.tsx)',
  status: (hasIntentSelector && hasExpectedOutputSummary) ? 'OK' : 'PARTIAL',
  checks: {
    hasIntentSelector,
    hasExpectedOutputSummary,
    intentImported
  }
});

// Point 3: Intent saved in guided-submit
const guidedSubmitRoute = readFile('app/api/runs/[runId]/qa/guided-submit/route.ts');
const intentSavedToQA = guidedSubmitRoute?.includes('intent') &&
                        guidedSubmitRoute?.includes('category: \'content\'');
const intentOptionUsed = guidedSubmitRoute?.includes('intentOptionId');

results.wiringPoints.push({
  point: 'Intent saved (guided-submit route)',
  status: intentSavedToQA ? 'OK' : 'MISSING',
  checks: {
    intentSavedToQA,
    intentOptionUsed
  }
});

// Point 4: Intent extracted in step/route.ts
const stepRoute = readFile('app/api/runs/[runId]/step/route.ts');
const intentExtracted = stepRoute?.includes('intent');
const intentPassedToHybrid = stepRoute?.includes('buildHybridPrompts') &&
                           stepRoute?.search(/intent[^a-z]/i) !== -1;

results.wiringPoints.push({
  point: 'Intent extraction (step/route.ts)',
  status: intentExtracted ? 'OK' : 'MISSING',
  checks: {
    intentExtracted,
    intentPassedToHybrid
  }
});

// Point 5: Intent used in style-resolver.ts
const styleResolver = readFile('lib/style-resolver.ts');
const styleResolverChecksIntent = styleResolver?.includes('intent');

results.wiringPoints.push({
  point: 'Style resolution (style-resolver.ts)',
  status: styleResolverChecksIntent ? 'OK' : 'MISSING',
  checks: {
    styleResolverChecksIntent
  }
});

// Point 6: Intent used in pipeline-core.ts
const pipelineCore = readFile('lib/pipeline-core.ts');
const pipelineCoreChecksIntent = pipelineCore?.includes('intent');
const hasIntentSpecificPageKinds = pipelineCore?.includes('buildNarrativePageKindsForIntent');

results.wiringPoints.push({
  point: 'Prompt generation (pipeline-core.ts)',
  status: (pipelineCoreChecksIntent || hasIntentSpecificPageKinds) ? 'OK' : 'MISSING',
  checks: {
    pipelineCoreChecksIntent,
    hasIntentSpecificPageKinds
  }
});

// Point 7: Intent context in prompts
const hasExecutiveContext = pipelineCore?.includes('役員説明') || pipelineCore?.includes('executive');
const hasProposalContext = pipelineCore?.includes('提案') || pipelineCore?.includes('proposal');
const hasComparisonContext = pipelineCore?.includes('比較検討') || pipelineCore?.includes('comparison');
const hasPlanContext = pipelineCore?.includes('実行計画') || pipelineCore?.includes('plan');
const hasReportContext = pipelineCore?.includes('報告') || pipelineCore?.includes('report');

results.wiringPoints.push({
  point: 'Intent-specific prompt context',
  status: (hasExecutiveContext || hasProposalContext || hasComparisonContext || hasPlanContext || hasReportContext) ? 'PARTIAL' : 'MISSING',
  checks: {
    hasExecutiveContext,
    hasProposalContext,
    hasComparisonContext,
    hasPlanContext,
    hasReportContext
  }
});

// ---------------------------------------------------------------------------
// Calculate overall score
// ---------------------------------------------------------------------------

const totalPoints = results.wiringPoints.length;
const okPoints = results.wiringPoints.filter(p => p.status === 'OK').length;
const partialPoints = results.wiringPoints.filter(p => p.status === 'PARTIAL').length;
const missingPoints = results.wiringPoints.filter(p => p.status === 'MISSING').length;

results.score = {
  total: totalPoints,
  ok: okPoints,
  partial: partialPoints,
  missing: missingPoints,
  percentage: Math.round(((okPoints * 0.5 + partialPoints * 0.25) / totalPoints * 100)
};

results.recommendations = [];

if (missingPoints > 0) {
  results.recommendations.push('CRITICAL: Intent が downstream に渡されていない');
}
if (!styleResolverChecksIntent) {
  results.recommendations.push('HIGH: style-resolver.ts で intent を参照していない');
}
if (!pipelineCoreChecksIntent && !hasIntentSpecificPageKinds) {
  results.recommendations.push('HIGH: pipeline-core.ts で intent 固有ロジックがない');
}
if (!hasPageKindSequence) {
  results.recommendations.push('MEDIUM: guided-brief-options.ts に pageKindSequence がない');
}
if (!hasPromptContext) {
  results.recommendations.push('MEDIUM: guided-brief-options.ts に promptContext がない');
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const outputPath = resolve(process.cwd(), 'verify_output/intent-wiring-check.json');

try {
  exec('mkdir -p verify_output');
} catch (err) {
  // Directory may already exist
}

const output = JSON.stringify(results, null, 2);
// eslint-disable-next-line no-undef
writeFileSync(outputPath, output);

console.log('Intent wiring check saved to: ' + outputPath);
console.log('\n=== Summary ===');
console.log(`Total Points: ${results.score.total}`);
console.log(`OK: ${results.score.ok}`);
console.log(`Partial: ${results.score.partial}`);
console.log(`Missing: ${results.score.missing}`);
console.log(`Wiring Score: ${results.score.percentage}%`);

console.log('\n=== Wiring Points ===');
results.wiringPoints.forEach(point => {
  const statusIcon = point.status === 'OK' ? '✓' : point.status === 'PARTIAL' ? '~' : '✗';
  console.log(`  ${statusIcon} ${point.point}`);
  if (point.checks) {
    Object.entries(point.checks).forEach(([key, value]) => {
      const icon = value === true || value === 'OK' ? '✓' : value === 'MISSING' ? '✗' : '-';
      console.log(`    ${icon} ${key}: ${value}`);
    });
  }
});

if (results.recommendations.length > 0) {
  console.log('\n=== Recommendations ===');
  results.recommendations.forEach(rec => {
    console.log(`  • ${rec}`);
  });
}

console.log('\n=== Conclusion ===');
if (results.score.percentage >= 75) {
  console.log('✓ Intent is mostly wired to output');
} else if (results.score.percentage >= 50) {
  console.log('~ Intent is partially wired (missing key connections)');
} else {
  console.log('✗ Intent is not wired to output (saved only)');
}
