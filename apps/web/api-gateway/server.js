require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

// Import middleware
const { authenticateToken, authRoutes, auditLog } = require('./middleware/auth/authMiddleware');
const { cacheMiddleware } = require('./middleware/cache/cacheMiddleware');
const { rateLimitMiddleware } = require('./middleware/rate-limit/rateLimitMiddleware');

// Import routes
const customerRoutes = require('./routes/customer');
const salesRoutes = require('./routes/sales');
const inventoryRoutes = require('./routes/inventory');
const financeRoutes = require('./routes/finance');

// Import utilities
const logger = require('./utils/logger');
const { ConnectorRegistry } = require('./connectors/ConnectorRegistry');
const { initializeConnectors, createSampleData } = require('./utils/initializeConnectors');

const app = express();
const PORT = process.env.PORT || 3002;

// Configure Winston logger
logger.info('Starting API Gateway server...');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Rate limiting
app.use(rateLimitMiddleware);

// Authentication routes (no authentication required)
authRoutes(app);

// Health check endpoints
app.get('/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    version: require('./package.json').version,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    pid: process.pid
  });
});

// Detailed health check endpoint
app.get('/health/detailed', async (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const connectorStatuses = await ConnectorRegistry.healthCheck();
    
    // Check if all connectors are healthy
    const allConnectorsHealthy = Object.values(connectorStatuses).every(
      connector => connector.status === 'healthy'
    );
    
    const healthStatus = {
      status: allConnectorsHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: require('./package.json').version,
      environment: process.env.NODE_ENV || 'development',
      
      // System metrics
      system: {
        memory: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          heapUsedPercent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
          external: memoryUsage.external
        },
        cpu: process.cpuUsage(),
        platform: process.platform,
        architecture: process.arch,
        nodeVersion: process.version,
        pid: process.pid
      },
      
      // Component health
      components: {
        connectors: connectorStatuses,
        cache: {
          status: 'healthy', // This would be implemented based on cache availability
          type: process.env.REDIS_URL ? 'redis' : 'memory'
        },
        logging: {
          status: 'healthy',
          level: process.env.LOG_LEVEL || 'info'
        }
      },
      
      // Configuration status
      configuration: {
        port: process.env.PORT || 3002,
        corsOrigin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL,
        authEnabled: true,
        rateLimitEnabled: true,
        compressionEnabled: process.env.COMPRESSION_ENABLED !== 'false'
      }
    };
    
    res.json(healthStatus);
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Connector health check endpoint
app.get('/health/connectors', async (req, res) => {
  try {
    const connectorStatuses = await ConnectorRegistry.healthCheck();
    const healthyCount = Object.values(connectorStatuses).filter(
      connector => connector.status === 'healthy'
    ).length;
    const totalCount = Object.keys(connectorStatuses).length;
    
    res.json({
      status: healthyCount === totalCount ? 'healthy' : 'degraded',
      summary: {
        healthy: healthyCount,
        total: totalCount,
        healthPercent: totalCount > 0 ? Math.round((healthyCount / totalCount) * 100) : 100
      },
      connectors: connectorStatuses,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Connector health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Connector health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Cache health check endpoint
app.get('/health/cache', (req, res) => {
  try {
    // This would check Redis/cache health
    const cacheStatus = {
      status: 'healthy',
      type: process.env.REDIS_URL ? 'redis' : 'memory',
      config: {
        ttl: process.env.CACHE_TTL || 3600,
        memoryTtl: process.env.MEMORY_CACHE_TTL || 600,
        redisUrl: process.env.REDIS_URL ? 'configured' : 'not configured'
      }
    };
    
    res.json({
      status: 'healthy',
      cache: cacheStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Cache health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Cache health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        heapUsedPercent: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
        external: memoryUsage.external
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      system: {
        loadAverage: require('os').loadavg(),
        freeMemory: require('os').freemem(),
        totalMemory: require('os').totalmem(),
        platform: process.platform,
        uptime: require('os').uptime()
      }
    };
    
    res.json(metrics);
  } catch (error) {
    logger.error('Metrics collection failed:', error);
    res.status(500).json({
      error: 'Metrics collection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// API routes with authentication, caching, and audit logging
app.use('/api/v1/customer', authenticateToken, auditLog, cacheMiddleware, customerRoutes);
app.use('/api/v1/sales', authenticateToken, auditLog, cacheMiddleware, salesRoutes);
app.use('/api/v1/inventory', authenticateToken, auditLog, cacheMiddleware, inventoryRoutes);
app.use('/api/v1/finance', authenticateToken, auditLog, cacheMiddleware, financeRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('🔥 ERROR in', req.method, req.url, ':', error.stack || error.message || error);
  
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    headers: req.headers
  });

  const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  
  res.status(error.status || 500).json({
    success: false,
    error: {
      message: error.message || 'Internal server error',
      code: error.code || 'INTERNAL_ERROR',
      // Show stack trace in development
      ...(isDev && { stack: error.stack })
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND'
    },
    metadata: {
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    }
  });
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close all connector connections
    await ConnectorRegistry.disconnectAll();
    logger.info('All connectors disconnected successfully');
    
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Create sample data and initialize connectors
  createSampleData()
    .then(() => initializeConnectors())
    .then(() => ConnectorRegistry.initialize())
    .then(() => {
      logger.info('All connectors initialized successfully');
    })
    .catch((error) => {
      logger.error('Failed to initialize connectors:', error);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

module.exports = server;