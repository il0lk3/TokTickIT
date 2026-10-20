#!/usr/bin/env node

/**
 * verify-traceability.js
 * Automatically verifies that all Acceptance Criteria and Business Rules in specification.md
 * are mapped to test suites in tests.md, and that every test file path exists on disk.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const specPath = path.join(ROOT, 'docs/lab-04/specification.md');
const testMatrixPath = path.join(ROOT, 'docs/lab-04/tests.md');

if (!fs.existsSync(specPath) || !fs.existsSync(testMatrixPath)) {
  console.error('Error: specification.md or tests.md not found.');
  process.exit(1);
}

const specContent = fs.readFileSync(specPath, 'utf8');
const testMatrixContent = fs.readFileSync(testMatrixPath, 'utf8');

// 1. Extract AC-XX and BR-XX from specification.md
const acRegex = /AC-\d+/g;
const brRegex = /BR-\d+/g;

const specACs = new Set(specContent.match(acRegex) || []);
const specBRs = new Set(specContent.match(brRegex) || []);

console.log(`Found ${specACs.size} unique ACs and ${specBRs.size} unique BRs in specification.md`);

// 2. Verify all ACs and BRs appear in tests.md
const missingACs = [];
for (const ac of specACs) {
  if (!testMatrixContent.includes(ac)) {
    missingACs.push(ac);
  }
}

const missingBRs = [];
for (const br of specBRs) {
  if (!testMatrixContent.includes(br)) {
    missingBRs.push(br);
  }
}

if (missingACs.length > 0) {
  console.error(`Traceability Failure: Missing AC references in tests.md: ${missingACs.join(', ')}`);
}

if (missingBRs.length > 0) {
  console.error(`Traceability Failure: Missing BR references in tests.md: ${missingBRs.join(', ')}`);
}

// 3. Extract and verify test file paths referenced in tests.md table
const fileRegex = /`((?:server|client|e2e)\/[^`]+)`/g;
let match;
const testFiles = new Set();
while ((match = fileRegex.exec(testMatrixContent)) !== null) {
  const filePath = match[1];
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js')) {
    testFiles.add(filePath);
  }
}

console.log(`Verifying ${testFiles.size} referenced test files on disk...`);
const missingFiles = [];
for (const relPath of testFiles) {
  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) {
    missingFiles.push(relPath);
  }
}

if (missingFiles.length > 0) {
  console.error(`Traceability Failure: Test files referenced in tests.md do not exist on disk:\n  ${missingFiles.join('\n  ')}`);
}

if (missingACs.length === 0 && missingBRs.length === 0 && missingFiles.length === 0) {
  console.log('Traceability Verification Passed: 100% of ACs, BRs, and test file paths verified successfully.');
  process.exit(0);
} else {
  process.exit(1);
}
