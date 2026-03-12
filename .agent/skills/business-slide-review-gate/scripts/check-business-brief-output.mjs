#!/usr/bin/env node

/**
 * Business Brief Output Check Script
 *
 * Reviews generated slide output against business brief quality standards.
 * Run from project root with --run-id parameter.
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// Parse arguments
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
let runId = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--run-id' || args[i] === '-r') {
    runId = args[i + 1];
    i++; // skip next arg
  }
}

if (!runId) {
  console.error('Usage: node check-business-brief-output.mjs --run-id <run-id>');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function exec(cmd, cwd = process.cwd()) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', shell: true }).trim();
  } catch (err) {
    return null;
  }
}

function readFile(path) {
  try {
    return readFileSync(resolve(process.cwd(), path), 'utf-8');
  } catch {
    return null;
  }
}

function parseJSON(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Load artifacts
// ---------------------------------------------------------------------------

const userId = 'local'; // For local verification
const artifactsDir = resolve(process.cwd(), '.data', 'blob', userId, runId);

const slideSpecsPath = resolve(artifactsDir, 'slide-specs.json');
const qualityGatePath = resolve(artifactsDir, 'quality-gate.json');

const slideSpecsJson = readFile(slideSpecsPath);
const qualityGateJson = readFile(qualityGatePath);

const slideSpecs = parseJSON(slideSpecsJson);
const qualityGate = parseJSON(qualityGateJson);

if (!slideSpecs) {
  console.error('ERROR: slide-specs.json not found or invalid');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Review functions
// ---------------------------------------------------------------------------

function reviewCover(spec) {
  const issues = [];
  const warnings = [];

  // Headline length
  if (spec.headline) {
    const cjkCount = (spec.headline.match(/[\u3000-\u9FFF\uF900-\uFAFF]/g) || []).length;
    const maxLen = cjkCount > spec.headline.length * 0.5 ? 40 : 60;
    if (spec.headline.length > maxLen) {
      warnings.push({ field: 'headline-length', expected: `<= ${maxLen}`, actual: spec.headline.length });
    }
  }

  // Subheadline support
  if (!spec.subheadline) {
    warnings.push({ field: 'cover-support', expected: 'subheadline or KPI', actual: 'missing' });
  }

  // KPI support
  const hasKPIs = spec.kpis && spec.kpis.length > 0;
  if (!spec.subheadline && !hasKPIs) {
    warnings.push({ field: 'cover-support', expected: 'subheadline or KPI', actual: 'neither present' });
  }

  return { issues, warnings };
}

function reviewExecutiveSummary(spec) {
  const issues = [];
  const warnings = [];

  // Takeaways
  const hasTakeaways = spec.takeaways && spec.takeaways.length > 0;
  if (!hasTakeaways) {
    warnings.push({ field: 'summary-takeaway', expected: '>= 1 takeaway', actual: 0 });
  }

  // Data support
  const hasKPIs = spec.kpis && spec.kpis.length > 0;
  const hasFacts = spec.facts && spec.facts.length > 0;
  if (!hasKPIs && !hasFacts) {
    warnings.push({ field: 'data-support', expected: 'KPIs or facts', actual: 'missing' });
  }

  return { issues, warnings };
}

function reviewComparison(spec) {
  const issues = [];
  const warnings = [];

  // Row count
  const rowCount = spec.comparisonRows ? spec.comparisonRows.length : 0;
  if (rowCount < 2) {
    warnings.push({ field: 'comparison-structure', expected: '>= 2 rows', actual: rowCount });
  }

  return { issues, warnings };
}

function reviewRoadmap(spec) {
  const issues = [];
  const warnings = [];

  // Phases
  const phaseCount = spec.roadmapPhases ? spec.roadmapPhases.length : 0;
  if (phaseCount < 3) {
    warnings.push({ field: 'roadmap-phases', expected: '>= 3 phases', actual: phaseCount });
  }

  return { issues, warnings };
}

function reviewDecisionCTA(spec) {
  const issues = [];
  const warnings = [];

  // CTA presence
  if (!spec.ctaTitle || !spec.ctaBody) {
    warnings.push({ field: 'decision-action-clarity', expected: 'ctaTitle and ctaBody', actual: 'missing' });
  }

  return { issues, warnings };
}

// ---------------------------------------------------------------------------
// Main review logic
// ---------------------------------------------------------------------------

const results = {
  timestamp: new Date().toISOString(),
  runId,
  slideCount: slideSpecs.length,
  slides: []
};

for (let i = 0; i < slideSpecs.length; i++) {
  const spec = slideSpecs[i];
  const slideReview = {
    index: i,
    pageKind: spec.pageKind,
    slideType: spec.slideType,
    headline: spec.headline
  };

  switch (spec.pageKind) {
    case 'cover':
      Object.assign(slideReview, reviewCover(spec));
      break;
    case 'executive-summary':
      Object.assign(slideReview, reviewExecutiveSummary(spec));
      break;
    case 'comparison':
      Object.assign(slideReview, reviewComparison(spec));
      break;
    case 'roadmap':
      Object.assign(slideReview, reviewRoadmap(spec));
      break;
    case 'decision-cta':
      Object.assign(slideReview, reviewDecisionCTA(spec));
      break;
    default:
      slideReview.issues = [];
      slideReview.warnings = [];
  }

  results.slides.push(slideReview);
}

// Aggregate warnings
const allWarnings = results.slides.flatMap(s => s.warnings || []);
const allIssues = results.slides.flatMap(s => s.warnings || []); // errors from quality gate

// Merge with quality gate warnings if available
if (qualityGate && qualityGate.warnings) {
  allWarnings.push(...qualityGate.warnings);
}
if (qualityGate && qualityGate.issues) {
  allIssues.push(...qualityGate.issues);
}

results.summary = {
  totalSlides: slideSpecs.length,
  totalWarnings: allWarnings.length,
  totalIssues: allIssues.length,
  pass: allIssues.length === 0,
  grade: calculateGrade(allWarnings.length, slideSpecs.length)
};

function calculateGrade(warningCount, slideCount) {
  if (warningCount === 0) {
    if (slideCount >= 5) return 'Excellent (Business-ready)';
    return 'Good';
  }
  if (warningCount <= 2) return 'Good';
  if (warningCount <= 4) return 'Acceptable';
  return 'Needs Improvement';
}

// Count warnings by type
const warningByField = {};
allWarnings.forEach(w => {
  warningByField[w.field] = (warningByField[w.field] || 0) + 1;
});

results.warningSummary = Object.entries(warningByField)
  .map(([field, count]) => `${field}: ${count}`)
  .join(', ');

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const outputPath = resolve(process.cwd(), 'verify_output/business-brief-review.json');

try {
  exec('mkdir -p verify_output');
} catch (err) {
  // Directory may already exist
}

writeFileSync(outputPath, JSON.stringify(results, null, 2));

console.log('Business brief review saved to: ' + outputPath);
console.log('\n=== Summary ===');
console.log(`Total Slides: ${results.summary.totalSlides}`);
console.log(`Warnings: ${results.summary.totalWarnings}`);
console.log(`Issues: ${results.summary.totalIssues}`);
console.log(`Grade: ${results.summary.grade}`);

console.log('\n=== Warning Breakdown ===');
if (results.warningSummary) {
  console.log(results.warningSummary);
} else {
  console.log('No warnings');
}

console.log('\n=== Slide Details ===');
results.slides.forEach(slide => {
  const kindIcon = slide.pageKind ? ` [${slide.pageKind}]` : ' [?]';
  console.log(`Slide ${slide.index}${kindIcon}: ${slide.headline || '(no headline)'}`);

  if (slide.warnings && slide.warnings.length > 0) {
    slide.warnings.forEach(w => {
      console.log(`  ~ ${w.field}: ${w.expected} (actual: ${w.actual})`);
    });
  }
});

console.log('\n=== Grade Criteria ===');
console.log('Excellent: No warnings, 5+ slides');
console.log('Good: <= 2 warnings');
console.log('Acceptable: <= 4 warnings');
console.log('Needs Improvement: > 4 warnings');
