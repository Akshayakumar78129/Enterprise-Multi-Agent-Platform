const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const logger = require('../../utils/logger');

/**
 * Redis store for rate limiting (if Redis is available)
 */
class RedisRateLimitStore {
  constructor() {
    this.redisClient = null;
    this.connected = false;
    this.prefix = process.env.RATE_LIMIT_PREFIX || 'rl:';
    
    this.initializeRedis();
  }
  
  async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL;
      
      if (!redisUrl) {
        logger.info('No Redis URL provided for rate limiting, using memory store');
        return;
      }
      
      this.redisClient = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });
      
      this.redisClient.on('connect', () => {
        this.connected = true;
        logger.info('Redis rate limit store connected');
      });
      
      this.redisClient.on('error', (error) => {
        this.connected = false;
        logger.error('Redis rate limit store error:', error);
      });
      
      await this.redisClient.ping();
      this.connected = true;
      
    } catch (error) {
      logger.warn('Failed to initialize Redis rate limit store:', error.message);
    }
  }
  
  async incr(key, windowMs) {
    if (!this.connected || !this.redisClient) {
      throw new Error('Redis not available');
    }
    
    const fullKey = `${this.prefix}${key}`;
    const ttl = Math.ceil(windowMs / 1000);
    
    const pipeline = this.redisClient.pipeline();
    pipeline.incr(fullKey);
    pipeline.expire(fullKey, ttl);
    
    const results = await pipeline.exec();
    const count = results[0][1];
    
    return {
      totalHits: count,
      remainingHits: Math.max(0, count),
      resetTime: new Date(Date.now() + windowMs)
    };
  }
  
  async decrement(key) {
    if (!this.connected || !this.redisClient) {
      return;
    }
    
    const fullKey = `${this.prefix}${key}`;
    await this.redisClient.decr(fullKey);
  }
  
  async resetKey(key) {
    if (!this.connected || !this.redisClient) {
      return;
    }
    
    const fullKey = `${this.prefix}${key}`;
    await this.redisClient.del(fullKey);
  }
}

// Create Redis store instance
const redisStore = new RedisRateLimitStore();

/**
 * Custom key generator for rate limiting
 */
const keyGenerator = (req) => {
  // Use user ID if authenticated, otherwise use IP
  const userKey = req.user?.id || req.ip;
  const route = req.route?.path || req.path;
  
  return `${userKey}:${route}`;
};

/**
 * Custom handler for rate limit exceeded
 */
const rateLimitHandler = (req, res) => {
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    user: req.user?.id,
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent')
  });
  
  res.status(429).json({
    success: false,
    error: {
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: req.rateLimit?.resetTime
    },
    metadata: {
      timestamp: new Date().toISOString(),
      limit: req.rateLimit?.limit,
      remaining: req.rateLimit?.remaining,
      resetTime: req.rateLimit?.resetTime
    }
  });
};

/**
 * Skip rate limiting for certain conditions
 */
const skipRateLimit = (req) => {
  // Skip for health checks
  if (req.path === '/health' || req.path.startsWith('/health/')) {
    return true;
  }
  
  // Skip for internal services with valid API key
  if (req.user?.type === 'service') {
    return true;
  }
  
  // Skip for admin users in development
  if (process.env.NODE_ENV === 'development' && req.user?.roles?.includes('admin')) {
    return true;
  }
  
  // Skip if bypass header is present (for internal testing)
  if (req.headers['x-bypass-rate-limit'] && process.env.NODE_ENV === 'development') {
    return true;
  }
  
  return false;
};

/**
 * General API rate limiter
 * Applies to all API routes
 */
const generalRateLimit = rateLimit({
  windowMs: parseInt(process.env.GENERAL_RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.GENERAL_RATE_LIMIT_MAX) || 1000, // 1000 requests per window
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipRateLimit,
  store: redisStore.connected ? redisStore : undefined
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later',
  keyGenerator: (req) => req.ip, // Use IP only for auth attempts
  handler: rateLimitHandler,
  skipSuccessfulRequests: true, // Don't count successful auth attempts
  store: redisStore.connected ? redisStore : undefined
});

/**
 * Heavy computation rate limiter
 * For endpoints that perform expensive operations
 */
const heavyComputationRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many computation requests, please try again later',
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipRateLimit,
  store: redisStore.connected ? redisStore : undefined
});

/**
 * Per-user rate limiter
 * Different limits based on user roles
 */
const createUserRoleRateLimit = (roleLimits) => {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: (req) => {
      if (!req.user) return 60; // Default for unauthenticated
      
      const userRoles = req.user.roles || [];
      
      // Find the highest limit from user's roles
      let maxLimit = 60; // Default
      
      for (const role of userRoles) {
        if (roleLimits[role] && roleLimits[role] > maxLimit) {
          maxLimit = roleLimits[role];
        }
      }
      
      return maxLimit;
    },
    keyGenerator: (req) => req.user?.id || req.ip,
    handler: rateLimitHandler,
    skip: skipRateLimit,
    store: redisStore.connected ? redisStore : undefined
  });
};

/**
 * Default user role limits
 */
const userRoleRateLimit = createUserRoleRateLimit({
  admin: 1000,    // 1000 requests per minute
  analyst: 300,   // 300 requests per minute  
  viewer: 100,    // 100 requests per minute
  customer_analyst: 200,
  sales_analyst: 200,
  inventory_analyst: 200,
  finance_analyst: 200
});

/**
 * IP-based rate limiter
 * Applies regardless of authentication
 */
const ipRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // 2000 requests per IP per window
  keyGenerator: (req) => req.ip,
  handler: rateLimitHandler,
  skip: (req) => {
    // Skip for known internal IPs
    const internalIPs = (process.env.INTERNAL_IPS || '').split(',');
    return internalIPs.includes(req.ip);
  },
  store: redisStore.connected ? redisStore : undefined
});

/**
 * Burst protection rate limiter
 * Very short window to prevent sudden bursts
 */
const burstProtectionRateLimit = rateLimit({
  windowMs: 1000, // 1 second
  max: 20, // 20 requests per second
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipRateLimit,
  store: redisStore.connected ? redisStore : undefined
});

/**
 * Route-specific rate limiters
 */
const routeRateLimits = {
  // Authentication routes
  '/api/v1/auth/login': authRateLimit,
  '/api/v1/auth/register': authRateLimit,
  '/api/v1/auth/forgot-password': authRateLimit,
  
  // Heavy computation routes (ML models, complex analytics)
  '/api/v1/customer/churn-prediction': heavyComputationRateLimit,
  '/api/v1/customer/lifetime-value': heavyComputationRateLimit,
  '/api/v1/sales/demand-forecast': heavyComputationRateLimit,
  '/api/v1/inventory/optimization': heavyComputationRateLimit
};

/**
 * Main rate limiting middleware factory
 */
const createRateLimitMiddleware = () => {
  return (req, res, next) => {
    // Apply burst protection first
    burstProtectionRateLimit(req, res, (err) => {
      if (err) return next(err);
      if (res.headersSent) return; // Burst limit exceeded
      
      // Apply IP-based rate limiting
      ipRateLimit(req, res, (err) => {
        if (err) return next(err);
        if (res.headersSent) return; // IP limit exceeded
        
        // Apply user role-based rate limiting
        userRoleRateLimit(req, res, (err) => {
          if (err) return next(err);
          if (res.headersSent) return; // User limit exceeded
          
          // Apply route-specific rate limiting if exists
          const routeRateLimit = routeRateLimits[req.path];
          if (routeRateLimit) {
            routeRateLimit(req, res, (err) => {
              if (err) return next(err);
              if (res.headersSent) return; // Route limit exceeded
              
              // Apply general rate limiting
              generalRateLimit(req, res, next);
            });
          } else {
            // Apply general rate limiting
            generalRateLimit(req, res, next);
          }
        });
      });
    });
  };
};

/**
 * Rate limit status middleware
 */
const rateLimitStatusMiddleware = (req, res) => {
  const stats = {
    redisConnected: redisStore.connected,
    rateLimitingActive: true,
    config: {
      generalWindow: parseInt(process.env.GENERAL_RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
      generalMax: parseInt(process.env.GENERAL_RATE_LIMIT_MAX) || 1000,
      authMax: 5,
      heavyComputationMax: 10,
      burstMax: 20
    },
    userLimits: {
      admin: 1000,
      analyst: 300,
      viewer: 100
    }
  };
  
  res.json({
    success: true,
    data: stats,
    metadata: {
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Rate limit reset middleware (admin only)
 */
const resetRateLimitMiddleware = async (req, res) => {
  try {
    const { key, type } = req.body;
    
    if (!req.user?.roles?.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required',
          code: 'ADMIN_REQUIRED'
        }
      });
    }
    
    if (type === 'user' && key) {
      await redisStore.resetKey(key);
      logger.info(`Rate limit reset for user: ${key}`, { adminUser: req.user.id });
    } else if (type === 'ip' && key) {
      await redisStore.resetKey(key);
      logger.info(`Rate limit reset for IP: ${key}`, { adminUser: req.user.id });
    }
    
    res.json({
      success: true,
      data: {
        message: `Rate limit reset for ${type}: ${key}`
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Rate limit reset error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to reset rate limit',
        code: 'RESET_FAILED'
      }
    });
  }
};

module.exports = {
  rateLimitMiddleware: createRateLimitMiddleware(),
  generalRateLimit,
  authRateLimit,
  heavyComputationRateLimit,
  userRoleRateLimit,
  ipRateLimit,
  burstProtectionRateLimit,
  routeRateLimits,
  rateLimitStatusMiddleware,
  resetRateLimitMiddleware,
  redisStore
};