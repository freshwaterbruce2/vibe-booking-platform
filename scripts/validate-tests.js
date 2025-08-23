#!/usr/bin/env node

/**
 * Test Validation Script for Vibe Booking E2E Tests
 * 
 * This script validates that all test files are properly structured
 * and can be discovered by Playwright.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testDir = path.join(__dirname, '..', 'tests', 'e2e');

// Expected test files
const expectedTestFiles = [
  'hero-section.spec.ts',
  'search-results.spec.ts', 
  'testimonials.spec.ts',
  'responsive-design.spec.ts',
  'conversion-elements.spec.ts',
  'booking-flow.spec.ts',
  'visual-regression.spec.ts'
];

// Test file validation patterns
const testPatterns = {
  imports: /import\s+{\s*test,\s*expect\s*}\s+from\s+['"]@playwright\/test['"];/,
  describe: /test\.describe\(/,
  testCases: /test\(/,
  beforeEach: /test\.beforeEach\(/,
  expectations: /await\s+expect\(/
};

console.log('🧪 Validating Vibe Booking E2E Test Suite...\n');

let allValid = true;

// Check if test directory exists
if (!fs.existsSync(testDir)) {
  console.error('❌ Test directory not found:', testDir);
  process.exit(1);
}

// Validate each expected test file
expectedTestFiles.forEach(filename => {
  const filepath = path.join(testDir, filename);
  
  console.log(`📄 Validating ${filename}...`);
  
  if (!fs.existsSync(filepath)) {
    console.error(`   ❌ File not found: ${filename}`);
    allValid = false;
    return;
  }
  
  const content = fs.readFileSync(filepath, 'utf8');
  
  // Check for proper Playwright imports
  if (!testPatterns.imports.test(content)) {
    console.error(`   ❌ Missing proper Playwright imports in ${filename}`);
    allValid = false;
  }
  
  // Check for test.describe blocks
  const describeMatches = content.match(/test\.describe\(/g);
  if (!describeMatches || describeMatches.length === 0) {
    console.error(`   ❌ No test.describe blocks found in ${filename}`);
    allValid = false;
  }
  
  // Check for test cases
  const testMatches = content.match(/test\(/g);
  if (!testMatches || testMatches.length === 0) {
    console.error(`   ❌ No test cases found in ${filename}`);
    allValid = false;
  }
  
  // Check for expectations
  const expectMatches = content.match(/await\s+expect\(/g);
  if (!expectMatches || expectMatches.length === 0) {
    console.error(`   ❌ No expectations found in ${filename}`);
    allValid = false;
  }
  
  if (testMatches && expectMatches) {
    console.log(`   ✅ Valid - ${describeMatches?.length || 0} describe blocks, ${testMatches.length} tests, ${expectMatches.length} expectations`);
  }
});

// Validate Playwright configuration
console.log('\n🔧 Validating Playwright configuration...');

const configPath = path.join(__dirname, '..', 'playwright.config.ts');
if (!fs.existsSync(configPath)) {
  console.error('❌ Playwright configuration not found');
  allValid = false;
} else {
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  // Check for essential configuration elements
  const configChecks = [
    { pattern: /testDir.*tests\/e2e/, name: 'testDir configuration' },
    { pattern: /baseURL.*localhost:5173/, name: 'baseURL configuration' },
    { pattern: /projects:/, name: 'projects configuration' },
    { pattern: /iPhone SE|Mobile Chrome|iPad|Desktop Large/, name: 'device projects' }
  ];
  
  configChecks.forEach(check => {
    if (check.pattern.test(configContent)) {
      console.log(`   ✅ ${check.name} found`);
    } else {
      console.error(`   ❌ ${check.name} missing`);
      allValid = false;
    }
  });
}

// Validate package.json test scripts
console.log('\n📦 Validating package.json test scripts...');

const packagePath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packagePath)) {
  console.error('❌ package.json not found');
  allValid = false;
} else {
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const scripts = packageContent.scripts || {};
  
  const expectedScripts = [
    'test:e2e',
    'test:e2e:mobile', 
    'test:e2e:desktop',
    'test:e2e:tablet',
    'test:e2e:conversion',
    'test:e2e:responsive',
    'test:visual'
  ];
  
  expectedScripts.forEach(script => {
    if (scripts[script]) {
      console.log(`   ✅ ${script} script found`);
    } else {
      console.error(`   ❌ ${script} script missing`);
      allValid = false;
    }
  });
}

// Summary
console.log('\n📊 Validation Summary:');
console.log(`   Test files: ${expectedTestFiles.length}`);
console.log(`   Configuration files: 2 (playwright.config.ts, package.json)`);
console.log(`   Total validation points: ${expectedTestFiles.length * 4 + 6}`);

if (allValid) {
  console.log('\n🎉 All tests are properly configured and ready to run!');
  console.log('\n🚀 Quick start commands:');
  console.log('   npm run test:e2e                 # Run all E2E tests');
  console.log('   npm run test:e2e:mobile          # Test mobile devices');
  console.log('   npm run test:e2e:conversion      # Test conversion elements');
  console.log('   npm run test:visual              # Run visual regression tests');
  console.log('\n📚 See TESTING.md for complete documentation.');
} else {
  console.error('\n❌ Test validation failed. Please fix the issues above.');
  process.exit(1);
}