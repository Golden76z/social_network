#!/usr/bin/env node

/**
 * Test Runner Script
 * 
 * This script runs different types of tests and provides detailed output
 * to help identify issues in the codebase.
 */

import { execSync } from 'child_process';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command: string, description: string): boolean {
  log(`\n${colors.cyan}${colors.bright}Running: ${description}${colors.reset}`);
  log(`${colors.blue}Command: ${command}${colors.reset}\n`);
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    log(`${colors.green}✅ ${description} completed successfully${colors.reset}`);
    return true;
  } catch (error) {
    log(`${colors.red}❌ ${description} failed${colors.reset}`);
    return false;
  }
}

function main() {
  log(`${colors.bright}${colors.magenta}🧪 Social Network Test Suite${colors.reset}`);
  log(`${colors.yellow}Running comprehensive tests to detect issues...${colors.reset}\n`);

  const tests = [
    {
      command: 'npm run test -- --testPathPattern="auth" --verbose',
      description: 'Authentication Tests',
    },
    {
      command: 'npm run test -- --testPathPattern="api" --verbose',
      description: 'API Client Tests',
    },
    {
      command: 'npm run test -- --testPathPattern="components" --verbose',
      description: 'Component Tests',
    },
    {
      command: 'npm run test -- --testPathPattern="integration" --verbose',
      description: 'Integration Tests',
    },
    {
      command: 'npm run test -- --testPathPattern="utils" --verbose',
      description: 'Utility Tests',
    },
    {
      command: 'npm run test -- --testPathPattern="pages" --verbose',
      description: 'Page Tests',
    },
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    if (runCommand(test.command, test.description)) {
      passedTests++;
    }
  }

  // Run all tests together
  log(`\n${colors.cyan}${colors.bright}Running All Tests Together${colors.reset}`);
  const allTestsPassed = runCommand('npm run test', 'Complete Test Suite');

  // Summary
  log(`\n${colors.bright}${colors.magenta}📊 Test Summary${colors.reset}`);
  log(`${colors.green}Passed: ${passedTests}/${totalTests} test suites${colors.reset}`);
  
  if (allTestsPassed) {
    log(`${colors.green}${colors.bright}🎉 All tests passed!${colors.reset}`);
  } else {
    log(`${colors.red}${colors.bright}⚠️  Some tests failed. Check the output above for details.${colors.reset}`);
  }

  // Additional checks
  log(`\n${colors.cyan}${colors.bright}🔍 Additional Checks${colors.reset}`);
  
  runCommand('npm run lint', 'ESLint Check');
  runCommand('npm run build', 'Build Check');

  log(`\n${colors.yellow}💡 Tips:${colors.reset}`);
  log(`${colors.reset}- Use 'npm run test:watch' for continuous testing${colors.reset}`);
  log(`${colors.reset}- Use 'npm run test -- --coverage' for coverage report${colors.reset}`);
  log(`${colors.reset}- Use 'npm run test -- --testNamePattern="specific test"' for specific tests${colors.reset}`);
}

if (require.main === module) {
  main();
}
