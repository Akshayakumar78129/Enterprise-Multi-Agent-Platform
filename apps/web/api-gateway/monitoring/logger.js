/**
 * Enhanced Logging System for API Gateway
 * Phase 9: Monitoring & Observability
 * 
 * Provides structured logging with multiple transports, performance metrics,
 * and comprehensive error tracking for enterprise-grade observability.
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log levels with priorities
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

// Log level colors for console output
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'grey'
};

winston.addColors(logColors);

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    // Add request correlation ID if available
    const correlationId = meta.correlationId || meta.requestId || 'N/A';
    
    // Format message with metadata
    const metaString = Object.keys(meta).length ? 
      `\n${JSON.stringify(meta, null, 2)}` : '';
    
    return `${timestamp} [${level.toUpperCase()}] [${correlationId}] ${message}${metaString}`;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:SSS' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const correlationId = meta.correlationId || meta.requestId || '';
    const correlationStr = correlationId ? `[${correlationId}] ` : '';
    return `${timestamp} ${level}: ${correlationStr}${message}`;
  })
);

// Create winston logger instance
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'api-gateway',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Error logs - separate file for critical issues
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 10,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Combined logs - all log levels
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 100 * 1024 * 1024, // 100MB
      maxFiles: 5,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // HTTP access logs
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'http',
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 10,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Performance logs
    new winston.transports.File({
      filename: path.join(logsDir, 'performance.log'),
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 5,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],

  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 3
    })
  ],

  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 3
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'debug'
  }));
}

// Performance monitoring utilities
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTimes = new Map();
  }

  // Start timing an operation
  startTimer(operationId, metadata = {}) {
    this.startTimes.set(operationId, {
      start: process.hrtime.bigint(),
      metadata
    });
    
    logger.debug('Operation started', {
      operationId,
      ...metadata
    });
  }

  // End timing and log performance
  endTimer(operationId, additionalMetadata = {}) {
    const timerData = this.startTimes.get(operationId);
    if (!timerData) {
      logger.warn('Timer not found for operation', { operationId });
      return null;
    }

    const end = process.hrtime.bigint();
    const duration = Number(end - timerData.start) / 1000000; // Convert to milliseconds

    const performanceData = {
      operationId,
      duration: `${duration.toFixed(2)}ms`,
      durationMs: Math.round(duration),
      ...timerData.metadata,
      ...additionalMetadata
    };

    // Log to performance file
    logger.log('performance', 'Operation completed', performanceData);

    // Log to appropriate level based on duration
    if (duration > 5000) {
      logger.error('Slow operation detected', performanceData);
    } else if (duration > 2000) {
      logger.warn('Performance warning', performanceData);
    } else {
      logger.info('Operation completed', performanceData);
    }

    // Store metrics for analysis
    this.updateMetrics(operationId, duration);

    this.startTimes.delete(operationId);
    return performanceData;
  }

  // Update performance metrics
  updateMetrics(operationId, duration) {
    if (!this.metrics.has(operationId)) {
      this.metrics.set(operationId, {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        avgTime: 0
      });
    }

    const metric = this.metrics.get(operationId);
    metric.count++;
    metric.totalTime += duration;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);
    metric.avgTime = metric.totalTime / metric.count;

    this.metrics.set(operationId, metric);
  }

  // Get performance summary
  getMetrics(operationId = null) {
    if (operationId) {
      return this.metrics.get(operationId) || null;
    }
    return Object.fromEntries(this.metrics);
  }

  // Reset metrics
  resetMetrics(operationId = null) {
    if (operationId) {
      this.metrics.delete(operationId);
    } else {
      this.metrics.clear();
    }
  }
}

// Request correlation utilities
class RequestTracker {
  constructor() {
    this.activeRequests = new Map();
  }

  // Start tracking a request
  startRequest(requestId, metadata = {}) {
    this.activeRequests.set(requestId, {
      startTime: Date.now(),
      ...metadata
    });

    logger.http('Request started', {
      requestId,
      ...metadata
    });
  }

  // End request tracking
  endRequest(requestId, statusCode = 200, additionalMetadata = {}) {
    const requestData = this.activeRequests.get(requestId);
    if (!requestData) {
      logger.warn('Request tracking data not found', { requestId });
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - requestData.startTime;

    const logData = {
      requestId,
      statusCode,
      duration: `${duration}ms`,
      durationMs: duration,
      ...requestData,
      ...additionalMetadata
    };

    // Log based on status code and duration
    if (statusCode >= 500) {
      logger.error('Request failed with server error', logData);
    } else if (statusCode >= 400) {
      logger.warn('Request failed with client error', logData);
    } else if (duration > 3000) {
      logger.warn('Slow request detected', logData);
    } else {
      logger.http('Request completed', logData);
    }

    this.activeRequests.delete(requestId);
    return logData;
  }

  // Get active requests
  getActiveRequests() {
    return Array.from(this.activeRequests.entries()).map(([requestId, data]) => ({
      requestId,
      duration: Date.now() - data.startTime,
      ...data
    }));
  }
}

// Structured logging helper methods
const LoggerHelpers = {
  // Log API requests
  logApiRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      requestId: req.requestId,
      userId: req.user?.id,
      contentLength: res.get('content-length')
    };

    if (res.statusCode >= 400) {
      logger.warn('API request failed', logData);
    } else {
      logger.http('API request completed', logData);
    }
  },

  // Log database operations
  logDatabaseOperation(operation, connector, query, duration, rowCount = null) {
    const logData = {
      operation,
      connector,
      query: query?.substring(0, 200) + (query?.length > 200 ? '...' : ''),
      duration: `${duration}ms`,
      durationMs: Math.round(duration),
      rowCount
    };

    if (duration > 2000) {
      logger.warn('Slow database query', logData);
    } else {
      logger.info('Database operation completed', logData);
    }
  },

  // Log connector events
  logConnectorEvent(connectorId, event, metadata = {}) {
    logger.info('Connector event', {
      connectorId,
      event,
      ...metadata
    });
  },

  // Log security events
  logSecurityEvent(event, severity = 'info', metadata = {}) {
    const logData = {
      securityEvent: event,
      severity,
      timestamp: new Date().toISOString(),
      ...metadata
    };

    if (severity === 'critical' || severity === 'high') {
      logger.error('Security event', logData);
    } else if (severity === 'medium') {
      logger.warn('Security event', logData);
    } else {
      logger.info('Security event', logData);
    }
  },

  // Log business events
  logBusinessEvent(event, metadata = {}) {
    logger.info('Business event', {
      businessEvent: event,
      ...metadata
    });
  }
};

// Create singleton instances
const performanceMonitor = new PerformanceMonitor();
const requestTracker = new RequestTracker();

// Export the enhanced logger and utilities
module.exports = {
  logger,
  performanceMonitor,
  requestTracker,
  LoggerHelpers,
  
  // Convenience methods
  info: (message, metadata = {}) => logger.info(message, metadata),
  warn: (message, metadata = {}) => logger.warn(message, metadata),
  error: (message, metadata = {}) => logger.error(message, metadata),
  debug: (message, metadata = {}) => logger.debug(message, metadata),
  http: (message, metadata = {}) => logger.http(message, metadata),

  // Performance timing helpers
  time: (operationId, metadata = {}) => performanceMonitor.startTimer(operationId, metadata),
  timeEnd: (operationId, metadata = {}) => performanceMonitor.endTimer(operationId, metadata),

  // Request tracking helpers
  startRequest: (requestId, metadata = {}) => requestTracker.startRequest(requestId, metadata),
  endRequest: (requestId, statusCode, metadata = {}) => requestTracker.endRequest(requestId, statusCode, metadata),

  // Get runtime statistics
  getStats: () => ({
    performance: performanceMonitor.getMetrics(),
    activeRequests: requestTracker.getActiveRequests(),
    logLevel: logger.level,
    transports: logger.transports.length
  })
};