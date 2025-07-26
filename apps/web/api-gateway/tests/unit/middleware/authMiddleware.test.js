/**
 * Unit Tests for Authentication Middleware
 * Phase 7: Testing & Validation
 */

const { authenticateToken, auditLog } = require('../../../middleware/auth/authMiddleware');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('jsonwebtoken');

describe('Authentication Middleware', () => {
  let mockReq, mockRes, mockNext;
  
  beforeEach(() => {
    mockReq = {
      headers: {},
      ip: '127.0.0.1',
      method: 'GET',
      url: '/api/v1/test',
      body: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    // Reset mocks
    jwt.verify.mockClear();
    mockRes.status.mockClear();
    mockRes.json.mockClear();
    mockNext.mockClear();
  });

  describe('authenticateToken', () => {
    test('should accept valid JWT token in Authorization header', () => {
      const mockPayload = {
        userId: '123',
        username: 'testuser',
        role: 'user',
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };
      
      mockReq.headers.authorization = 'Bearer valid-jwt-token';
      jwt.verify.mockReturnValue(mockPayload);
      
      authenticateToken(mockReq, mockRes, mockNext);
      
      expect(jwt.verify).toHaveBeenCalledWith(
        'valid-jwt-token',
        process.env.JWT_SECRET || 'dev-jwt-secret-change-for-production-use-only'
      );
      expect(mockReq.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should accept valid API key in X-API-Key header', () => {
      mockReq.headers['x-api-key'] = 'dev-token';
      
      authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockReq.user).toEqual({
        type: 'api-key',
        key: 'dev-token',
        permissions: ['read', 'write']
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should reject request without authentication', () => {
      authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        },
        metadata: {
          timestamp: expect.any(String)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject malformed Authorization header', () => {
      mockReq.headers.authorization = 'InvalidFormat token';
      
      authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid token format',
          code: 'INVALID_TOKEN_FORMAT'
        },
        metadata: {
          timestamp: expect.any(String)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject invalid JWT token', () => {
      mockReq.headers.authorization = 'Bearer invalid-jwt-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        },
        metadata: {
          timestamp: expect.any(String)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject expired JWT token', () => {
      mockReq.headers.authorization = 'Bearer expired-jwt-token';
      jwt.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });
      
      authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Token expired',
          code: 'TOKEN_EXPIRED'
        },
        metadata: {
          timestamp: expect.any(String)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject invalid API key', () => {
      mockReq.headers['x-api-key'] = 'invalid-api-key';
      
      authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid API key',
          code: 'INVALID_API_KEY'
        },
        metadata: {
          timestamp: expect.any(String)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle internal server errors gracefully', () => {
      mockReq.headers.authorization = 'Bearer valid-jwt-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Internal error');
      });
      
      authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Authentication error',
          code: 'AUTHENTICATION_ERROR'
        },
        metadata: {
          timestamp: expect.any(String)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should allow requests from internal IPs without authentication', () => {
      mockReq.ip = '127.0.0.1'; // Internal IP
      
      authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockReq.user).toEqual({
        type: 'internal',
        ip: '127.0.0.1',
        permissions: ['read', 'write', 'admin']
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should extract user information from JWT payload', () => {
      const mockPayload = {
        userId: '123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['read', 'write', 'admin'],
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      
      mockReq.headers.authorization = 'Bearer valid-jwt-token';
      jwt.verify.mockReturnValue(mockPayload);
      
      authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockReq.user).toEqual(mockPayload);
      expect(mockReq.user.userId).toBe('123');
      expect(mockReq.user.role).toBe('admin');
      expect(mockReq.user.permissions).toContain('admin');
    });
  });

  describe('auditLog', () => {
    beforeEach(() => {
      mockReq.user = {
        userId: '123',
        username: 'testuser',
        type: 'jwt'
      };
      
      // Mock console methods
      console.log = jest.fn();
      console.error = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should log successful API requests', () => {
      mockRes.statusCode = 200;
      
      auditLog(mockReq, mockRes, mockNext);
      
      // Simulate response completion
      mockRes.emit('finish');
      
      expect(mockNext).toHaveBeenCalled();
      
      // Check that audit log was created
      setTimeout(() => {
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('[AUDIT]'),
          expect.objectContaining({
            timestamp: expect.any(String),
            userId: '123',
            username: 'testuser',
            method: 'GET',
            url: '/api/v1/test',
            ip: '127.0.0.1',
            statusCode: 200,
            success: true
          })
        );
      }, 100);
    });

    test('should log failed API requests', () => {
      mockRes.statusCode = 500;
      
      auditLog(mockReq, mockRes, mockNext);
      
      // Simulate response completion
      mockRes.emit('finish');
      
      expect(mockNext).toHaveBeenCalled();
      
      // Check that audit log was created
      setTimeout(() => {
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('[AUDIT]'),
          expect.objectContaining({
            statusCode: 500,
            success: false
          })
        );
      }, 100);
    });

    test('should include request body for POST requests (sanitized)', () => {
      mockReq.method = 'POST';
      mockReq.body = {
        username: 'testuser',
        password: 'secret123', // Should be sanitized
        data: 'important data'
      };
      
      auditLog(mockReq, mockRes, mockNext);
      
      // Simulate response completion
      mockRes.emit('finish');
      
      setTimeout(() => {
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('[AUDIT]'),
          expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({
              username: 'testuser',
              password: '[REDACTED]',
              data: 'important data'
            })
          })
        );
      }, 100);
    });

    test('should sanitize sensitive fields in request body', () => {
      mockReq.body = {
        token: 'secret-token',
        apiKey: 'secret-api-key',
        clientSecret: 'secret-client-secret',
        normalField: 'normal-value'
      };
      
      auditLog(mockReq, mockRes, mockNext);
      
      // Simulate response completion
      mockRes.emit('finish');
      
      setTimeout(() => {
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('[AUDIT]'),
          expect.objectContaining({
            body: expect.objectContaining({
              token: '[REDACTED]',
              apiKey: '[REDACTED]',
              clientSecret: '[REDACTED]',
              normalField: 'normal-value'
            })
          })
        );
      }, 100);
    });

    test('should measure response time', () => {
      const startTime = Date.now();
      
      auditLog(mockReq, mockRes, mockNext);
      
      // Simulate some processing time
      setTimeout(() => {
        mockRes.emit('finish');
        
        setTimeout(() => {
          expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('[AUDIT]'),
            expect.objectContaining({
              responseTime: expect.any(Number)
            })
          );
        }, 100);
      }, 50);
    });

    test('should handle requests without user context', () => {
      delete mockReq.user;
      
      auditLog(mockReq, mockRes, mockNext);
      
      // Simulate response completion
      mockRes.emit('finish');
      
      expect(mockNext).toHaveBeenCalled();
      
      setTimeout(() => {
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('[AUDIT]'),
          expect.objectContaining({
            userId: 'anonymous',
            username: 'anonymous'
          })
        );
      }, 100);
    });
  });

  describe('API Key Validation', () => {
    test('should validate API keys from environment', () => {
      const originalEnv = process.env.VALID_API_KEYS;
      process.env.VALID_API_KEYS = 'key1,key2,key3';
      
      mockReq.headers['x-api-key'] = 'key2';
      
      authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user.key).toBe('key2');
      
      // Restore environment
      process.env.VALID_API_KEYS = originalEnv;
    });

    test('should handle missing VALID_API_KEYS environment variable', () => {
      const originalEnv = process.env.VALID_API_KEYS;
      delete process.env.VALID_API_KEYS;
      
      mockReq.headers['x-api-key'] = 'some-key';
      
      authenticateToken(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      
      // Restore environment
      process.env.VALID_API_KEYS = originalEnv;
    });
  });

  describe('JWT Configuration', () => {
    test('should use custom JWT secret from environment', () => {
      const originalSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'custom-secret';
      
      mockReq.headers.authorization = 'Bearer valid-jwt-token';
      jwt.verify.mockReturnValue({ userId: '123' });
      
      authenticateToken(mockReq, mockRes, mockNext);
      
      expect(jwt.verify).toHaveBeenCalledWith('valid-jwt-token', 'custom-secret');
      
      // Restore environment
      process.env.JWT_SECRET = originalSecret;
    });

    test('should use default JWT secret if environment variable is missing', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      mockReq.headers.authorization = 'Bearer valid-jwt-token';
      jwt.verify.mockReturnValue({ userId: '123' });
      
      authenticateToken(mockReq, mockRes, mockNext);
      
      expect(jwt.verify).toHaveBeenCalledWith(
        'valid-jwt-token',
        'dev-jwt-secret-change-for-production-use-only'
      );
      
      // Restore environment
      process.env.JWT_SECRET = originalSecret;
    });
  });
});