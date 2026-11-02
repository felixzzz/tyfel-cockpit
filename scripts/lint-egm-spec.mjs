#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_SECTIONS = [
  'Context & Business Value',
  'Invariants & Calculation Rules',
  'Data Schema & Contracts',
  'Failure Modes & Edge Case Matrix',
  'Goldfish Adversarial Critique Log',
  'Implementation & Verification Plan'
];

const targetFile = process.argv[2];

if (!targetFile) {
  console.error('Usage: npm run egm:lint <path-to-spec-file>');
  process.exit(1);
}

const resolvedPath = path.resolve(process.cwd(), targetFile);
if (!fs.existsSync(resolvedPath)) {
  console.error(`❌ Error: File not found: ${resolvedPath}`);
  process.exit(1);
}

const content = fs.readFileSync(resolvedPath, 'utf8');
const missingSections = [];

for (const section of REQUIRED_SECTIONS) {
  if (!content.includes(section)) {
    missingSections.push(section);
  }
}

console.log(`\n🔍 Auditing EGM Spec: ${path.basename(resolvedPath)}`);
console.log('='.repeat(50));

if (missingSections.length > 0) {
  console.error('\n❌ EGM Spec Lint Failed! Missing required sections:');
  for (const s of missingSections) {
    console.error(`   - ${s}`);
  }
  console.error('\nPlease ensure your spec adheres to docs/plans/TEMPLATE-EGM-SPEC.md\n');
  process.exit(1);
}

console.log('✅ All required EGM sections are present.');
console.log('Ready for Phase 2: Goldfish Stress-Test!\n');
