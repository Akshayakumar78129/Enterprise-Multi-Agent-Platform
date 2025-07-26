/**
 * Jest Configuration for API Gateway Testing
 * Phase 7: Testing & Validation
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Root directory for tests
  rootDir: '.',
  
  // Test directories
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'connectors/**/*.js',
    'middleware/**/*.js',
    'routes/**/*.js',
    'utils/**/*.js',
    'schemas/**/*.js',
    'server.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!ecosystem.config.js'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    './connectors/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './middleware/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  
  // Module directories
  moduleDirectories: [
    'node_modules',
    '<rootDir>'
  ],
  
  // Transform configuration
  transform: {},
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Parallel test execution
  maxWorkers: '50%',
  
  // Test result reporting (simplified for basic setup)
  reporters: [
    'default'
  ],
  
  // Global variables
  globals: {
    NODE_ENV: 'test'
  },
  
  // Module name mapping for aliases (correct property name)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@connectors/(.*)$': '<rootDir>/connectors/$1',
    '^@middleware/(.*)$': '<rootDir>/middleware/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1'
  },
  
  // Files to ignore
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/logs/',
    '<rootDir>/data/'
  ],
  
  // Watch mode configuration
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/logs/',
    '<rootDir>/data/',
    '<rootDir>/test-results/'
  ],
  
  // Notification configuration
  notify: true,
  notifyMode: 'failure-change',
  
  // Bail configuration - stop after first test failure in CI
  bail: process.env.CI ? 1 : 0,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Collect test results
  collectCoverageFrom: [
    'connectors/**/*.js',
    'middleware/**/*.js',
    'routes/**/*.js',
    'utils/**/*.js',
    'schemas/**/*.js',
    'server.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!jest.config.js'
  ],
  
  // Mock configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Snapshot configuration
  updateSnapshot: process.env.UPDATE_SNAPSHOTS === 'true',
  
  // Test suites (simplified configuration)
  // Individual test runs can be specified via command line
};