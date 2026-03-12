#!/usr/bin/env node

/**
 * check-background-artifacts.mjs
 * Checks if a run has background prompt trace artifacts.
 * Usage: node check-background-artifacts.mjs [path-to-trace.json]
 *
 * If no path given, searches for background-prompt-trace.json in:
 *   .data/blob/runs/*/background-prompt-trace.json (most recent)
 *   ./background-prompt-trace.json
 *
 * Exit 0 if all checks pass, 1 if any fail.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

let tracePath = process.argv[2];

// Auto-discover trace file if not specified
if (!tracePath) {
  const directPath = join(process.cwd(), 'background-prompt-trace.json');
  if (existsSync(directPath)) {
    tracePath = directPath;
  } else {
    // Search in .data/blob/runs/
    const runsDir = join(process.cwd(), '.data', 'blob', 'runs');
    if (existsSync(runsDir)) {
      const runs = readdirSync(runsDir)
        .map(name => ({ name, mtime: statSync(join(runsDir, name)).mtime }))
        .sort((a, b) => b.mtime - a.mtime);

      for (const run of runs) {
        const candidate = join(runsDir, run.name, 'background-prompt-trace.json');
        if (existsSync(candidate)) {
          tracePath = candidate;
          break;
        }
      }
    }
  }
}

if (!tracePath) {
  console.log('  FAIL  No background-prompt-trace.json found');
  process.exit(1);
}

console.log(`Checking: ${tracePath}\n`);

let failures = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  PASS  ${label}`);
  } else {
    console.log(`  FAIL  ${label}`);
    failures++;
  }
}

// Check file exists
check('background-prompt-trace.json exists', existsSync(tracePath));

if (!existsSync(tracePath)) {
  process.exit(1);
}

// Parse JSON
let trace;
try {
  trace = JSON.parse(readFileSync(tracePath, 'utf-8'));
  check('File is valid JSON', true);
} catch (e) {
  check('File is valid JSON', false);
  console.log(`\n${failures} check(s) failed.`);
  process.exit(1);
}

// Check required fields
check('imagePromptPackVersion is present',
  trace.imagePromptPackVersion != null && trace.imagePromptPackVersion !== '');

check('critiqueSummary exists',
  trace.critiqueSummary != null && typeof trace.critiqueSummary === 'object');

check('repairUsed flag is set',
  typeof trace.repairUsed === 'boolean');

console.log('');
if (failures === 0) {
  console.log('All checks passed.');
  process.exit(0);
} else {
  console.log(`${failures} check(s) failed.`);
  process.exit(1);
}
