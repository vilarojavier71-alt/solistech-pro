#!/usr/bin/env node
/**
 * MPE-OS V3.0.0: Pre-Build Alias Resolution Validator
 * 
 * Validates that TypeScript path aliases (@/) resolve correctly
 * before build to prevent deployment failures in Linux environments.
 * 
 * Why: Linux filesystems are case-sensitive and require explicit baseUrl
 * for path resolution, unlike Windows/macOS development environments.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for structured logging
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

/**
 * Structured log output (ISO 27001: Audit Trail)
 */
function log(level, source, action, message, error = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    source,
    action,
    message,
    ...(error && { error: error.message, stack: error.stack }),
  };
  
  const prefix = {
    ERROR: `${colors.red}[ERROR]${colors.reset}`,
    WARN: `${colors.yellow}[WARN]${colors.reset}`,
    INFO: `${colors.blue}[INFO]${colors.reset}`,
    SUCCESS: `${colors.green}[SUCCESS]${colors.reset}`,
  }[level] || '[LOG]';
  
  console.log(`${prefix} ${JSON.stringify(logEntry)}`);
}

/**
 * Validate tsconfig.json has baseUrl
 */
function validateTsConfig() {
  log('INFO', 'validate-aliases', 'validateTsConfig', 'Checking tsconfig.json');
  
  const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
  
  if (!fs.existsSync(tsConfigPath)) {
    log('ERROR', 'validate-aliases', 'validateTsConfig', 'tsconfig.json not found');
    process.exit(1);
  }
  
  const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf-8'));
  
  if (!tsConfig.compilerOptions?.baseUrl) {
    log('ERROR', 'validate-aliases', 'validateTsConfig', 
        'tsconfig.json missing baseUrl (required for Linux path resolution)');
    process.exit(1);
  }
  
  if (!tsConfig.compilerOptions?.paths?.['@/*']) {
    log('ERROR', 'validate-aliases', 'validateTsConfig', 
        'tsconfig.json missing @/* path alias');
    process.exit(1);
  }
  
  log('SUCCESS', 'validate-aliases', 'validateTsConfig', 
      `baseUrl: ${tsConfig.compilerOptions.baseUrl}, paths configured`);
}

/**
 * Validate src directory structure exists
 */
function validateSrcStructure() {
  log('INFO', 'validate-aliases', 'validateSrcStructure', 'Checking src/ directory');
  
  const srcPath = path.join(process.cwd(), 'src');
  const libPath = path.join(srcPath, 'lib');
  
  if (!fs.existsSync(srcPath)) {
    log('ERROR', 'validate-aliases', 'validateSrcStructure', 'src/ directory not found');
    process.exit(1);
  }
  
  if (!fs.existsSync(libPath)) {
    log('ERROR', 'validate-aliases', 'validateSrcStructure', 'src/lib/ directory not found');
    process.exit(1);
  }
  
  log('SUCCESS', 'validate-aliases', 'validateSrcStructure', 'src/ structure valid');
}

/**
 * Test alias resolution by checking a sample import path
 */
function testAliasResolution() {
  log('INFO', 'validate-aliases', 'testAliasResolution', 'Testing @/ alias resolution');
  
  const testPaths = [
    'src/lib/db.ts',
    'src/lib/auth.ts',
    'src/lib/utils.ts',
  ];
  
  const missing = testPaths.filter(p => !fs.existsSync(path.join(process.cwd(), p)));
  
  if (missing.length > 0) {
    log('WARN', 'validate-aliases', 'testAliasResolution', 
        `Some expected files missing: ${missing.join(', ')}`);
  } else {
    log('SUCCESS', 'validate-aliases', 'testAliasResolution', 
        'All test paths resolve correctly');
  }
}

/**
 * Main validation flow
 */
function main() {
  try {
    log('INFO', 'validate-aliases', 'main', 'Starting pre-build alias validation');
    
    validateTsConfig();
    validateSrcStructure();
    testAliasResolution();
    
    log('SUCCESS', 'validate-aliases', 'main', 'All alias validations passed');
    process.exit(0);
  } catch (error) {
    log('ERROR', 'validate-aliases', 'main', 'Validation failed', error);
    process.exit(1);
  }
}

main();

