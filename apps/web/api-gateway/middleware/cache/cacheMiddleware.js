const Redis = require('ioredis');
const NodeCache = require('node-cache');
const crypto = require('crypto');
const logger = require('../../utils/logger');

/**
 * Cache Manager with Redis and in-memory fallback
 */
class CacheManager {
  constructor() {
    this.redisClient = null;
    this.memoryCache = new NodeCache({
      stdTTL: parseInt(process.env.MEMORY_CACHE_TTL) || 600, // 10 minutes default
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false // Don't clone objects for better performance
    });
    
    this.defaultTTL = parseInt(process.env.CACHE_TTL) || 3600; // 1 hour default
    this.keyPrefix = process.env.CACHE_KEY_PREFIX || 'api-gateway:';
    this.enableCompression = process.env.CACHE_COMPRESSION === 'true';
    this.redisAvailable = false;
    
    this.initializeRedis();
    this.setupMemoryCacheEvents();
  }
  
  /**
   * Initialize Redis connection
   */
  async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL;
      
      if (!redisUrl) {
        logger.info('No Redis URL provided, using memory cache only');
        return;
      }
      
      this.redisClient = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 5000,
        commandTimeout: 5000
      });
      
      // Set up Redis event listeners
      this.redisClient.on('connect', () => {
        logger.info('Redis connected successfully');
        this.redisAvailable = true;
      });
      
      this.redisClient.on('error', (error) => {
        logger.error('Redis connection error:', error);
        this.redisAvailable = false;
      });
      
      this.redisClient.on('close', () => {
        logger.warn('Redis connection closed, falling back to memory cache');
        this.redisAvailable = false;
      });
      
      this.redisClient.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });
      
      // Test connection
      await this.redisClient.ping();
      this.redisAvailable = true;
      
    } catch (error) {
      logger.warn('Failed to initialize Redis, using memory cache only:', error.message);
      this.redisAvailable = false;
    }
  }
  
  /**
   * Set up memory cache event listeners
   */
  setupMemoryCacheEvents() {
    this.memoryCache.on('set', (key, value) => {
      logger.debug('Memory cache SET', { key, size: this.getObjectSize(value) });
    });
    
    this.memoryCache.on('del', (key, value) => {
      logger.debug('Memory cache DEL', { key });
    });
    
    this.memoryCache.on('expired', (key, value) => {
      logger.debug('Memory cache EXPIRED', { key });
    });
  }
  
  /**
   * Generate cache key from request
   */
  generateCacheKey(req) {
    const keyData = {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.method === 'POST' ? req.body : undefined,
      userId: req.user?.id
    };
    
    const keyString = JSON.stringify(keyData);
    const hash = crypto.createHash('sha256').update(keyString).digest('hex');
    
    return `${this.keyPrefix}${hash}`;
  }
  
  /**
   * Get data from cache (Redis first, then memory)
   */
  async get(key) {
    try {
      // Try Redis first if available
      if (this.redisAvailable && this.redisClient) {
        const redisValue = await this.redisClient.get(key);
        if (redisValue) {
          logger.debug('Cache HIT (Redis)', { key });
          return JSON.parse(redisValue);
        }
      }
      
      // Fallback to memory cache
      const memoryValue = this.memoryCache.get(key);
      if (memoryValue) {
        logger.debug('Cache HIT (Memory)', { key });
        return memoryValue;
      }
      
      logger.debug('Cache MISS', { key });
      return null;
      
    } catch (error) {
      logger.error('Cache GET error:', error);
      return null;
    }
  }
  
  /**
   * Set data in cache (both Redis and memory)
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const serializedValue = JSON.stringify(value);
      
      // Set in Redis if available
      if (this.redisAvailable && this.redisClient) {
        await this.redisClient.setex(key, ttl, serializedValue);
        logger.debug('Cache SET (Redis)', { key, ttl, size: serializedValue.length });
      }
      
      // Always set in memory cache as backup
      this.memoryCache.set(key, value, ttl);
      logger.debug('Cache SET (Memory)', { key, ttl, size: this.getObjectSize(value) });
      
    } catch (error) {
      logger.error('Cache SET error:', error);
    }
  }
  
  /**
   * Delete from cache
   */
  async del(key) {
    try {
      // Delete from Redis
      if (this.redisAvailable && this.redisClient) {
        await this.redisClient.del(key);
      }
      
      // Delete from memory cache
      this.memoryCache.del(key);
      
      logger.debug('Cache DEL', { key });
      
    } catch (error) {
      logger.error('Cache DEL error:', error);
    }
  }
  
  /**
   * Clear all cache
   */
  async clear() {
    try {
      // Clear Redis
      if (this.redisAvailable && this.redisClient) {
        await this.redisClient.flushall();
      }
      
      // Clear memory cache
      this.memoryCache.flushAll();
      
      logger.info('Cache cleared');
      
    } catch (error) {
      logger.error('Cache CLEAR error:', error);
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    const memoryStats = this.memoryCache.getStats();
    
    return {
      redis: {
        available: this.redisAvailable,
        connected: this.redisClient?.status === 'ready'
      },
      memory: {
        keys: memoryStats.keys,
        hits: memoryStats.hits,
        misses: memoryStats.misses,
        hitRate: memoryStats.hits / (memoryStats.hits + memoryStats.misses) || 0
      },
      config: {
        defaultTTL: this.defaultTTL,
        keyPrefix: this.keyPrefix,
        compressionEnabled: this.enableCompression
      }
    };
  }
  
  /**
   * Get approximate object size in bytes
   */
  getObjectSize(obj) {
    return Buffer.byteLength(JSON.stringify(obj), 'utf8');
  }
  
  /**
   * Close connections
   */
  async close() {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
      }
      this.memoryCache.close();
      logger.info('Cache connections closed');
    } catch (error) {
      logger.error('Error closing cache connections:', error);
    }
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

/**
 * Cache configuration per route/endpoint
 */
const CACHE_CONFIGS = {
  // Customer endpoints
  'GET:/api/v1/customer/transaction-patterns': { ttl: 1800, enabled: true }, // 30 minutes
  'GET:/api/v1/customer/segmentation': { ttl: 3600, enabled: true }, // 1 hour
  'GET:/api/v1/customer/churn-prediction': { ttl: 7200, enabled: true }, // 2 hours
  'GET:/api/v1/customer/lifetime-value': { ttl: 3600, enabled: true },
  'GET:/api/v1/customer/behavior': { ttl: 1800, enabled: true },
  
  // Sales endpoints
  'GET:/api/v1/sales/product-performance': { ttl: 1800, enabled: true },
  'GET:/api/v1/sales/sales-performance': { ttl: 1800, enabled: true },
  'GET:/api/v1/sales/sales-trends': { ttl: 3600, enabled: true },
  'GET:/api/v1/sales/regional-sales': { ttl: 1800, enabled: true },
  
  // Inventory endpoints
  'GET:/api/v1/inventory/level-analyzer': { ttl: 900, enabled: true }, // 15 minutes
  'GET:/api/v1/inventory/holding-cost': { ttl: 3600, enabled: true },
  'GET:/api/v1/inventory/optimization': { ttl: 1800, enabled: true },
  
  // Finance endpoints
  'GET:/api/v1/finance/financial': { ttl: 3600, enabled: true },
  
  // Default for unlisted endpoints
  default: { ttl: 600, enabled: true } // 10 minutes
};

/**
 * Main caching middleware
 */
const cacheMiddleware = (req, res, next) => {
  // Only cache GET requests by default
  if (req.method !== 'GET') {
    return next();
  }
  
  const routeKey = `${req.method}:${req.path}`;
  const cacheConfig = CACHE_CONFIGS[routeKey] || CACHE_CONFIGS.default;
  
  // Skip caching if disabled for this route
  if (!cacheConfig.enabled) {
    return next();
  }
  
  // Skip caching if no-cache header is present
  if (req.headers['cache-control'] === 'no-cache') {
    return next();
  }
  
  const cacheKey = cacheManager.generateCacheKey(req);
  
  // Try to get cached response
  cacheManager.get(cacheKey)
    .then(cachedResponse => {
      if (cachedResponse) {
        // Add cache headers to response
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `public, max-age=${cacheConfig.ttl}`
        });
        
        return res.json({
          ...cachedResponse,
          metadata: {
            ...cachedResponse.metadata,
            cache: true,
            cacheKey: cacheKey
          }
        });
      }
      
      // No cache hit, proceed with request
      res.set('X-Cache', 'MISS');
      
      // Intercept response to cache it
      const originalSend = res.send;
      res.send = function(data) {
        try {
          const responseData = typeof data === 'string' ? JSON.parse(data) : data;
          
          // Only cache successful responses
          if (res.statusCode === 200 && responseData.success !== false) {
            cacheManager.set(cacheKey, responseData, cacheConfig.ttl)
              .catch(error => {
                logger.error('Failed to cache response:', error);
              });
          }
        } catch (error) {
          logger.error('Error processing response for caching:', error);
        }
        
        originalSend.call(this, data);
      };
      
      next();
    })
    .catch(error => {
      logger.error('Cache middleware error:', error);
      // Continue without cache on error
      next();
    });
};

/**
 * Cache invalidation middleware
 * Use this for POST/PUT/DELETE requests that should invalidate related cache
 */
const invalidateCacheMiddleware = (patterns = []) => {
  return async (req, res, next) => {
    // Store patterns to invalidate after request completes
    req.cacheInvalidationPatterns = patterns;
    
    // Intercept response to invalidate cache after successful operations
    const originalSend = res.send;
    res.send = function(data) {
      // Only invalidate on successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Invalidate cache patterns
        patterns.forEach(pattern => {
          invalidateCachePattern(pattern)
            .catch(error => {
              logger.error('Cache invalidation error:', error);
            });
        });
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Invalidate cache entries matching a pattern
 */
const invalidateCachePattern = async (pattern) => {
  try {
    // For Redis
    if (cacheManager.redisAvailable && cacheManager.redisClient) {
      const keys = await cacheManager.redisClient.keys(`${cacheManager.keyPrefix}*${pattern}*`);
      if (keys.length > 0) {
        await cacheManager.redisClient.del(...keys);
        logger.debug(`Invalidated ${keys.length} Redis cache entries matching pattern: ${pattern}`);
      }
    }
    
    // For memory cache (more limited pattern matching)
    const memoryKeys = cacheManager.memoryCache.keys();
    const matchingKeys = memoryKeys.filter(key => key.includes(pattern));
    
    matchingKeys.forEach(key => {
      cacheManager.memoryCache.del(key);
    });
    
    if (matchingKeys.length > 0) {
      logger.debug(`Invalidated ${matchingKeys.length} memory cache entries matching pattern: ${pattern}`);
    }
    
  } catch (error) {
    logger.error('Error invalidating cache pattern:', error);
  }
};

/**
 * Cache warming middleware
 * Pre-populate cache with frequently accessed data
 */
const warmCache = async (routes = []) => {
  logger.info('Starting cache warming...');
  
  for (const route of routes) {
    try {
      // This would typically make internal API calls to warm the cache
      // Implementation depends on specific warming strategy
      logger.info(`Warming cache for route: ${route}`);
    } catch (error) {
      logger.error(`Failed to warm cache for route ${route}:`, error);
    }
  }
  
  logger.info('Cache warming completed');
};

/**
 * Cache status endpoint middleware
 */
const cacheStatusMiddleware = (req, res) => {
  const stats = cacheManager.getStats();
  
  res.json({
    success: true,
    data: {
      cache: stats,
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = {
  cacheMiddleware,
  invalidateCacheMiddleware,
  invalidateCachePattern,
  warmCache,
  cacheStatusMiddleware,
  cacheManager,
  CACHE_CONFIGS
};