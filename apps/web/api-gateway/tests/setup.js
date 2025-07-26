/**
 * Jest Test Setup Configuration
 * Phase 7: Testing & Validation
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.VALID_API_KEYS = 'dev-token,test-token,frontend-api-key';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
process.env.DATABASE_TYPE = 'sqlite';
process.env.CACHE_TTL = '300';
process.env.GENERAL_RATE_LIMIT_MAX = '1000';
process.env.GENERAL_RATE_LIMIT_WINDOW = '900000';

// Global test utilities
global.testUtils = {
  /**
   * Create a mock request object
   */
  createMockRequest: (overrides = {}) => ({
    headers: {},
    method: 'GET',
    url: '/api/v1/test',
    body: {},
    query: {},
    params: {},
    ip: '127.0.0.1',
    user: null,
    ...overrides
  }),

  /**
   * Create a mock response object
   */
  createMockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
      statusCode: 200,
      locals: {}
    };
    
    // Add event emitter functionality for testing middleware
    const EventEmitter = require('events');
    Object.setPrototypeOf(res, EventEmitter.prototype);
    EventEmitter.call(res);
    
    return res;
  },

  /**
   * Create a mock next function
   */
  createMockNext: () => jest.fn(),

  /**
   * Create a mock database connector
   */
  createMockConnector: (type = 'test', overrides = {}) => ({
    id: `mock-${type}-connector`,
    type,
    connected: false,
    lastHealthCheck: null,
    config: { timeout: 5000 },
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    safeQuery: jest.fn().mockResolvedValue({ 
      rows: [], 
      rowCount: 0, 
      executionTime: 100,
      connector: `mock-${type}-connector`
    }),
    healthCheck: jest.fn().mockResolvedValue({ 
      status: 'healthy', 
      latency: 10 
    }),
    isConnected: jest.fn().mockReturnValue(false),
    getInfo: jest.fn().mockReturnValue({
      id: `mock-${type}-connector`,
      type,
      connected: false,
      lastHealthCheck: null
    }),
    ...overrides
  }),

  /**
   * Create a mock JWT payload
   */
  createMockJWTPayload: (overrides = {}) => ({
    userId: '123',
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
    permissions: ['read'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides
  }),

  /**
   * Create test database file
   */
  createTestDatabase: async (path) => {
    const fs = require('fs').promises;
    const sqlite3 = require('sqlite3');
    const { open } = require('sqlite');
    
    // Ensure directory exists
    const dir = require('path').dirname(path);
    await fs.mkdir(dir, { recursive: true });
    
    // Create database file
    const db = await open({
      filename: path,
      driver: sqlite3.Database
    });
    
    // Create test table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS test_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        value INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      INSERT OR IGNORE INTO test_table (id, name, value) VALUES 
        (1, 'test1', 100),
        (2, 'test2', 200),
        (3, 'test3', 300);
    `);
    
    await db.close();
    return path;
  },

  /**
   * Clean up test database
   */
  cleanupTestDatabase: async (path) => {
    const fs = require('fs').promises;
    try {
      await fs.unlink(path);
    } catch (error) {
      // Ignore if file doesn't exist
      if (error.code !== 'ENOENT') {
        console.warn('Could not clean up test database:', error.message);
      }
    }
  },

  /**
   * Wait for a specified amount of time
   */
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Assert that an object matches expected properties
   */
  expectToMatchObject: (actual, expected) => {
    expect(actual).toEqual(expect.objectContaining(expected));
  },

  /**
   * Create a promise that resolves/rejects after a delay
   */
  createDelayedPromise: (resolveValue, delay = 100, shouldReject = false) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldReject) {
          reject(new Error(resolveValue || 'Test error'));
        } else {
          resolve(resolveValue);
        }
      }, delay);
    });
  }
};

// Global test matchers
expect.extend({
  /**
   * Check if a response has the standard API Gateway format
   */
  toHaveStandardApiFormat(received) {
    const pass = (
      typeof received === 'object' &&
      received !== null &&
      typeof received.success === 'boolean' &&
      received.metadata &&
      typeof received.metadata.timestamp === 'string'
    );

    if (pass) {
      return {
        message: () => `Expected ${JSON.stringify(received)} not to have standard API format`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected ${JSON.stringify(received)} to have standard API format with success, metadata.timestamp`,
        pass: false
      };
    }
  },

  /**
   * Check if a response indicates an error
   */
  toBeApiError(received, expectedCode) {
    const pass = (
      typeof received === 'object' &&
      received !== null &&
      received.success === false &&
      received.error &&
      typeof received.error.message === 'string' &&
      typeof received.error.code === 'string' &&
      (!expectedCode || received.error.code === expectedCode)
    );

    if (pass) {
      return {
        message: () => `Expected ${JSON.stringify(received)} not to be an API error${expectedCode ? ` with code ${expectedCode}` : ''}`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected ${JSON.stringify(received)} to be an API error${expectedCode ? ` with code ${expectedCode}` : ''}`,
        pass: false
      };
    }
  },

  /**
   * Check if a value is within a range
   */
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `Expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false
      };
    }
  },

  /**
   * Check if an object has any of the specified properties
   */
  toHaveAnyOf(received, properties) {
    const hasAny = properties.some(prop => received.hasOwnProperty(prop));
    
    if (hasAny) {
      return {
        message: () => `Expected ${JSON.stringify(received)} not to have any of ${properties.join(', ')}`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected ${JSON.stringify(received)} to have at least one of ${properties.join(', ')}`,
        pass: false
      };
    }
  }
});

// Console override for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn((...args) => {
    if (process.env.VERBOSE_TESTS === 'true') {
      originalConsole.log(...args);
    }
  }),
  info: jest.fn((...args) => {
    if (process.env.VERBOSE_TESTS === 'true') {
      originalConsole.info(...args);
    }
  }),
  warn: originalConsole.warn,
  error: originalConsole.error,
  debug: jest.fn((...args) => {
    if (process.env.VERBOSE_TESTS === 'true') {
      originalConsole.debug(...args);
    }
  })
};

// Global beforeEach to reset mocks
beforeEach(() => {
  jest.clearAllMocks();
});

// Global afterEach for cleanup
afterEach(() => {
  // Clean up any global state
  if (global.testCleanup) {
    global.testCleanup();
    global.testCleanup = null;
  }
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in test environment, just log
});

// Export setup utilities for use in specific test files
module.exports = global.testUtils;