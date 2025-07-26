/**
 * Unit Tests for Rate Limiting Middleware
 * Phase 7: Testing & Validation
 */

const { rateLimitMiddleware } = require('../../../middleware/rate-limit/rateLimitMiddleware');

// Mock node-cache
jest.mock('node-cache');
const NodeCache = require('node-cache');

describe('Rate Limiting Middleware', () => {
  let mockReq, mockRes, mockNext, mockCache;
  
  beforeEach(() => {
    mockReq = {
      ip: '127.0.0.1',
      method: 'GET',
      url: '/api/v1/test',
      headers: {
        'user-agent': 'test-agent'
      },
      user: {
        userId: '123',
        type: 'jwt'
      }
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    // Mock cache instance
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      ttl: jest.fn()
    };
    
    NodeCache.mockImplementation(() => mockCache);
    
    // Reset mocks
    mockRes.status.mockClear();
    mockRes.json.mockClear();
    mockRes.header.mockClear();
    mockNext.mockClear();
    mockCache.get.mockClear();
    mockCache.set.mockClear();
  });

  describe('Basic Rate Limiting', () => {
    test('should allow requests under rate limit', () => {
      // Mock cache to return low request count
      mockCache.get.mockReturnValue(5);
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalled();
    });

    test('should block requests over general rate limit', () => {
      // Mock cache to return high request count
      mockCache.get.mockReturnValue(1001); // Over default limit of 1000
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Too many requests, please try again later',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        rateLimit: {
          limit: expect.any(Number),
          remaining: 0,
          reset: expect.any(Number),
          retryAfter: expect.any(Number)
        },
        metadata: {
          timestamp: expect.any(String)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should set rate limit headers on successful requests', () => {
      mockCache.get.mockReturnValue(10);
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.header).toHaveBeenCalledWith('X-RateLimit-Limit', expect.any(Number));
      expect(mockRes.header).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
      expect(mockRes.header).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Endpoint-Specific Rate Limiting', () => {
    test('should apply transaction patterns rate limit', () => {
      mockReq.url = '/api/v1/customer/transaction-patterns';
      mockCache.get.mockReturnValue(25); // Under transaction patterns limit of 30
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalled();
    });

    test('should block requests over transaction patterns limit', () => {
      mockReq.url = '/api/v1/customer/transaction-patterns';
      mockCache.get.mockReturnValue(35); // Over transaction patterns limit of 30
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should apply customer segmentation rate limit', () => {
      mockReq.url = '/api/v1/customer/segmentation';
      mockCache.get.mockReturnValue(15); // Under segmentation limit of 20
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    test('should apply churn prediction rate limit', () => {
      mockReq.url = '/api/v1/customer/churn-prediction';
      mockCache.get.mockReturnValue(10); // Under churn prediction limit of 15
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    test('should apply higher health check rate limit', () => {
      mockReq.url = '/health';
      mockCache.get.mockReturnValue(500); // Under health check limit of 1000
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('User-Based Rate Limiting', () => {
    test('should use user ID for authenticated requests', () => {
      mockReq.user = { userId: '123', type: 'jwt' };
      mockCache.get.mockReturnValue(5);
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      // Should use user-based key
      expect(mockCache.get).toHaveBeenCalledWith(
        expect.stringContaining('user:123')
      );
      expect(mockNext).toHaveBeenCalled();
    });

    test('should use IP address for unauthenticated requests', () => {
      delete mockReq.user;
      mockCache.get.mockReturnValue(5);
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      // Should use IP-based key
      expect(mockCache.get).toHaveBeenCalledWith(
        expect.stringContaining('ip:127.0.0.1')
      );
      expect(mockNext).toHaveBeenCalled();
    });

    test('should apply different limits for API key users', () => {
      mockReq.user = { type: 'api-key', key: 'test-key' };
      mockCache.get.mockReturnValue(5);
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockCache.get).toHaveBeenCalledWith(
        expect.stringContaining('apikey:test-key')
      );
      expect(mockNext).toHaveBeenCalled();
    });

    test('should bypass rate limiting for internal requests', () => {
      mockReq.user = { type: 'internal', ip: '127.0.0.1' };
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      // Should not check cache for internal requests
      expect(mockCache.get).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Rate Limit Key Generation', () => {
    test('should generate endpoint-specific keys', () => {
      mockReq.url = '/api/v1/customer/transaction-patterns';
      mockReq.user = { userId: '123' };
      mockCache.get.mockReturnValue(5);
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockCache.get).toHaveBeenCalledWith(
        'rl:transaction-patterns:user:123'
      );
    });

    test('should normalize endpoint names', () => {
      mockReq.url = '/api/v1/customer/churn-prediction?param=value';
      mockReq.user = { userId: '123' };
      mockCache.get.mockReturnValue(5);
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockCache.get).toHaveBeenCalledWith(
        'rl:churn-prediction:user:123'
      );
    });

    test('should handle unknown endpoints with general rate limit', () => {
      mockReq.url = '/api/v1/unknown/endpoint';
      mockReq.user = { userId: '123' };
      mockCache.get.mockReturnValue(5);
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockCache.get).toHaveBeenCalledWith(
        'rl:general:user:123'
      );
    });
  });

  describe('Time Window Management', () => {
    test('should increment counter within time window', () => {
      mockCache.get.mockReturnValue(10);
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockCache.set).toHaveBeenCalledWith(
        expect.any(String),
        11, // Incremented count
        expect.any(Number) // TTL
      );
      expect(mockNext).toHaveBeenCalled();
    });

    test('should initialize new counter when none exists', () => {
      mockCache.get.mockReturnValue(undefined);
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockCache.set).toHaveBeenCalledWith(
        expect.any(String),
        1, // Initial count
        expect.any(Number) // TTL
      );
      expect(mockNext).toHaveBeenCalled();
    });

    test('should set appropriate TTL for cache entries', () => {
      mockCache.get.mockReturnValue(5);
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockCache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Number),
        900 // 15 minutes in seconds
      );
    });
  });

  describe('Response Headers', () => {
    test('should include remaining requests in headers', () => {
      mockCache.get.mockReturnValue(10);
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.header).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        expect.any(Number)
      );
    });

    test('should include reset timestamp in headers', () => {
      mockCache.get.mockReturnValue(10);
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.header).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        expect.any(Number)
      );
    });

    test('should include retry-after header when rate limited', () => {
      mockCache.get.mockReturnValue(1001); // Over limit
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.header).toHaveBeenCalledWith(
        'Retry-After',
        expect.any(Number)
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle cache errors gracefully', () => {
      mockCache.get.mockImplementation(() => {
        throw new Error('Cache error');
      });
      
      // Should not throw error, should allow request
      expect(() => {
        rateLimitMiddleware(mockReq, mockRes, mockNext);
      }).not.toThrow();
      
      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle cache set errors gracefully', () => {
      mockCache.get.mockReturnValue(5);
      mockCache.set.mockImplementation(() => {
        throw new Error('Cache set error');
      });
      
      expect(() => {
        rateLimitMiddleware(mockReq, mockRes, mockNext);
      }).not.toThrow();
      
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Configuration', () => {
    test('should use environment-based rate limits', () => {
      const originalEnv = process.env.GENERAL_RATE_LIMIT_MAX;
      process.env.GENERAL_RATE_LIMIT_MAX = '500';
      
      mockCache.get.mockReturnValue(499);
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      
      // Test over the custom limit
      mockCache.get.mockReturnValue(501);
      mockNext.mockClear();
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockNext).not.toHaveBeenCalled();
      
      // Restore environment
      process.env.GENERAL_RATE_LIMIT_MAX = originalEnv;
    });

    test('should use default values when environment variables are missing', () => {
      const originalEnv = process.env.GENERAL_RATE_LIMIT_MAX;
      delete process.env.GENERAL_RATE_LIMIT_MAX;
      
      mockCache.get.mockReturnValue(999); // Under default limit of 1000
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      
      // Restore environment
      process.env.GENERAL_RATE_LIMIT_MAX = originalEnv;
    });
  });

  describe('Rate Limit Analytics', () => {
    test('should track rate limit violations', () => {
      mockCache.get.mockReturnValue(1001); // Over limit
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[RATE_LIMIT_VIOLATION]'),
        expect.objectContaining({
          ip: '127.0.0.1',
          userId: '123',
          endpoint: expect.any(String),
          requests: 1001
        })
      );
      
      consoleSpy.mockRestore();
    });

    test('should not log violations for allowed requests', () => {
      mockCache.get.mockReturnValue(5); // Under limit
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      rateLimitMiddleware(mockReq, mockRes, mockNext);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});