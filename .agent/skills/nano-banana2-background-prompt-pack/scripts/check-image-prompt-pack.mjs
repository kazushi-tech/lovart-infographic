#!/usr/bin/env node

/**
 * check-image-prompt-pack.mjs
 * Verifies the background image prompt pack is complete.
 * Exit 0 if all checks pass, 1 if any fail.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const PACK_ROOT = join(process.cwd(), 'prompts', 'backgrounds', 'nano-banana2');

const REQUIRED_PAGE_KINDS = [
  'cover.md',
  'executive-summary.md',
  'problem-analysis.md',
  'comparison.md',
  'roadmap.md',
  'deep-dive.md',
  'decision-cta.md',
];

const REQUIRED_STYLE_FAMILIES = [
  'conservative-ir.md',
  'consulting-editorial.md',
  'operational-blueprint.md',
];

let failures = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  PASS  ${label}`);
  } else {
    console.log(`  FAIL  ${label}`);
    failures++;
  }
}

function fileExistsAndNonEmpty(filePath) {
  if (!existsSync(filePath)) return false;
  const content = readFileSync(filePath, 'utf-8').trim();
  return content.length > 0;
}

function dirHasAtLeastOneFile(dirPath) {
  if (!existsSync(dirPath)) return false;
  const files = readdirSync(dirPath).filter(f => f.endsWith('.md'));
  return files.length > 0;
}

console.log(`Checking prompt pack at: ${PACK_ROOT}\n`);

// VERSION.json
const versionPath = join(PACK_ROOT, 'VERSION.json');
check('VERSION.json exists', existsSync(versionPath));
if (existsSync(versionPath)) {
  let validJson = false;
  try {
    JSON.parse(readFileSync(versionPath, 'utf-8'));
    validJson = true;
  } catch (_) {}
  check('VERSION.json is valid JSON', validJson);
}

// master-system.md
check('master-system.md exists and non-empty',
  fileExistsAndNonEmpty(join(PACK_ROOT, 'master-system.md')));

// Page kinds
console.log('');
for (const pk of REQUIRED_PAGE_KINDS) {
  check(`page-kinds/${pk} exists`,
    existsSync(join(PACK_ROOT, 'page-kinds', pk)));
}

// Style families
console.log('');
for (const sf of REQUIRED_STYLE_FAMILIES) {
  check(`style-families/${sf} exists`,
    existsSync(join(PACK_ROOT, 'style-families', sf)));
}

// Motifs (at least 1)
console.log('');
check('motifs/ has at least 1 file',
  dirHasAtLeastOneFile(join(PACK_ROOT, 'motifs')));

// Few-shots (at least 1)
check('few-shots/ has at least 1 file',
  dirHasAtLeastOneFile(join(PACK_ROOT, 'few-shots')));

console.log('');
if (failures === 0) {
  console.log('All checks passed.');
  process.exit(0);
} else {
  console.log(`${failures} check(s) failed.`);
  process.exit(1);
}
