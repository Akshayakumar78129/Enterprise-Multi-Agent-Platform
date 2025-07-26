/**
 * Performance Metrics Collection System
 * Phase 9: Monitoring & Observability
 * 
 * Collects, aggregates, and exposes performance metrics for the API Gateway
 * including request/response times, database performance, connector health,
 * and system resource utilization.
 */

const EventEmitter = require('events');
const os = require('os');
const { logger } = require('./logger');

class MetricsCollector extends EventEmitter {
  constructor() {
    super();
    
    // Metrics storage
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byStatusCode: {},
        byEndpoint: {},
        byMethod: {}
      },
      
      performance: {
        responseTime: {
          count: 0,
          total: 0,
          min: Infinity,
          max: 0,
          avg: 0,
          percentiles: {
            p50: 0,
            p90: 0,
            p95: 0,
            p99: 0
          }
        },
        
        databaseQueries: {
          count: 0,
          totalTime: 0,
          avgTime: 0,
          slowQueries: 0,
          byConnector: {}
        },
        
        connectorHealth: {
          total: 0,
          healthy: 0,
          unhealthy: 0,
          degraded: 0,
          lastCheck: null
        }
      },
      
      system: {
        uptime: 0,
        memory: {
          used: 0,
          total: 0,
          percentage: 0,
          heapUsed: 0,
          heapTotal: 0
        },
        cpu: {
          usage: 0,
          loadAverage: []
        },
        gc: {
          collections: 0,
          duration: 0
        }
      },
      
      security: {
        authenticationAttempts: 0,
        authenticationFailures: 0,
        rateLimitHits: 0,
        blockedRequests: 0
      },
      
      business: {
        dataVolume: {
          totalRecords: 0,
          byDataSource: {}
        },
        cacheHitRatio: 0,
        errorRate: 0
      }
    };
    
    // Response time tracking for percentiles
    this.responseTimeSamples = [];
    this.maxSamples = 10000;
    
    // Start periodic system metrics collection
    this.startSystemMetricsCollection();
    
    // Start metrics cleanup
    this.startMetricsCleanup();
    
    logger.info('Metrics collector initialized');
  }

  // Record HTTP request metrics
  recordRequest(req, res, responseTime) {
    try {
      const method = req.method;
      const statusCode = res.statusCode;
      const endpoint = this.normalizeEndpoint(req.path);
      
      // Update request counters
      this.metrics.requests.total++;
      
      if (statusCode >= 200 && statusCode < 400) {
        this.metrics.requests.successful++;
      } else {
        this.metrics.requests.failed++;
      }
      
      // Track by status code
      this.metrics.requests.byStatusCode[statusCode] = 
        (this.metrics.requests.byStatusCode[statusCode] || 0) + 1;
      
      // Track by endpoint
      this.metrics.requests.byEndpoint[endpoint] = 
        (this.metrics.requests.byEndpoint[endpoint] || 0) + 1;
      
      // Track by method
      this.metrics.requests.byMethod[method] = 
        (this.metrics.requests.byMethod[method] || 0) + 1;
      
      // Record response time
      this.recordResponseTime(responseTime);
      
      // Calculate error rate
      this.updateErrorRate();
      
      this.emit('requestRecorded', { method, statusCode, endpoint, responseTime });
      
    } catch (error) {
      logger.error('Error recording request metrics', { error: error.message });
    }
  }

  // Record response time metrics
  recordResponseTime(responseTime) {
    const perfMetrics = this.metrics.performance.responseTime;
    
    perfMetrics.count++;
    perfMetrics.total += responseTime;
    perfMetrics.min = Math.min(perfMetrics.min, responseTime);
    perfMetrics.max = Math.max(perfMetrics.max, responseTime);
    perfMetrics.avg = perfMetrics.total / perfMetrics.count;
    
    // Store sample for percentile calculation
    this.responseTimeSamples.push(responseTime);
    
    // Keep samples within limit
    if (this.responseTimeSamples.length > this.maxSamples) {
      this.responseTimeSamples = this.responseTimeSamples.slice(-this.maxSamples);
    }
    
    // Update percentiles
    this.updateResponseTimePercentiles();
  }

  // Calculate response time percentiles
  updateResponseTimePercentiles() {
    if (this.responseTimeSamples.length === 0) return;
    
    const sorted = [...this.responseTimeSamples].sort((a, b) => a - b);
    const len = sorted.length;
    
    this.metrics.performance.responseTime.percentiles = {
      p50: this.getPercentile(sorted, 0.5),
      p90: this.getPercentile(sorted, 0.9),
      p95: this.getPercentile(sorted, 0.95),
      p99: this.getPercentile(sorted, 0.99)
    };
  }

  // Get percentile value
  getPercentile(sortedArray, percentile) {
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  // Record database query metrics
  recordDatabaseQuery(connector, queryTime, rowCount = null) {
    try {
      const dbMetrics = this.metrics.performance.databaseQueries;
      
      dbMetrics.count++;
      dbMetrics.totalTime += queryTime;
      dbMetrics.avgTime = dbMetrics.totalTime / dbMetrics.count;
      
      // Track slow queries (>2 seconds)
      if (queryTime > 2000) {
        dbMetrics.slowQueries++;
      }
      
      // Track by connector
      if (!dbMetrics.byConnector[connector]) {
        dbMetrics.byConnector[connector] = {
          count: 0,
          totalTime: 0,
          avgTime: 0,
          slowQueries: 0
        };
      }
      
      const connectorMetrics = dbMetrics.byConnector[connector];
      connectorMetrics.count++;
      connectorMetrics.totalTime += queryTime;
      connectorMetrics.avgTime = connectorMetrics.totalTime / connectorMetrics.count;
      
      if (queryTime > 2000) {
        connectorMetrics.slowQueries++;
      }
      
      // Update business metrics
      if (rowCount !== null) {
        this.metrics.business.dataVolume.totalRecords += rowCount;
        
        if (!this.metrics.business.dataVolume.byDataSource[connector]) {
          this.metrics.business.dataVolume.byDataSource[connector] = 0;
        }
        this.metrics.business.dataVolume.byDataSource[connector] += rowCount;
      }
      
      this.emit('databaseQueryRecorded', { connector, queryTime, rowCount });
      
    } catch (error) {
      logger.error('Error recording database metrics', { error: error.message });
    }
  }

  // Record connector health status
  recordConnectorHealth(connectorId, status) {
    try {
      const healthMetrics = this.metrics.performance.connectorHealth;
      
      // Reset counters for fresh calculation
      healthMetrics.total = 0;
      healthMetrics.healthy = 0;
      healthMetrics.unhealthy = 0;
      healthMetrics.degraded = 0;
      
      // This would be called with overall health summary
      if (typeof status === 'object' && status.summary) {
        healthMetrics.total = status.summary.total;
        healthMetrics.healthy = status.summary.healthy;
        healthMetrics.unhealthy = status.summary.unhealthy;
        healthMetrics.degraded = status.summary.degraded;
      } else {
        // Single connector status update
        healthMetrics.total++;
        switch (status) {
          case 'healthy':
            healthMetrics.healthy++;
            break;
          case 'unhealthy':
            healthMetrics.unhealthy++;
            break;
          case 'degraded':
            healthMetrics.degraded++;
            break;
        }
      }
      
      healthMetrics.lastCheck = new Date().toISOString();
      
      this.emit('connectorHealthRecorded', { connectorId, status });
      
    } catch (error) {
      logger.error('Error recording connector health', { error: error.message });
    }
  }

  // Record security events
  recordSecurityEvent(eventType, metadata = {}) {
    try {
      const securityMetrics = this.metrics.security;
      
      switch (eventType) {
        case 'authentication_attempt':
          securityMetrics.authenticationAttempts++;
          break;
        case 'authentication_failure':
          securityMetrics.authenticationFailures++;
          break;
        case 'rate_limit_hit':
          securityMetrics.rateLimitHits++;
          break;
        case 'request_blocked':
          securityMetrics.blockedRequests++;
          break;
      }
      
      this.emit('securityEventRecorded', { eventType, metadata });
      
    } catch (error) {
      logger.error('Error recording security event', { error: error.message });
    }
  }

  // Record cache hit/miss
  recordCacheEvent(hit) {
    try {
      // Simple cache hit ratio calculation
      const currentHits = this.cacheHits || 0;
      const currentTotal = this.cacheTotal || 0;
      
      if (hit) {
        this.cacheHits = currentHits + 1;
      }
      this.cacheTotal = currentTotal + 1;
      
      this.metrics.business.cacheHitRatio = this.cacheTotal > 0 ? 
        (this.cacheHits / this.cacheTotal) * 100 : 0;
      
      this.emit('cacheEventRecorded', { hit });
      
    } catch (error) {
      logger.error('Error recording cache event', { error: error.message });
    }
  }

  // Start system metrics collection
  startSystemMetricsCollection() {
    const collectSystemMetrics = () => {
      try {
        const memoryUsage = process.memoryUsage();
        const systemMemory = {
          total: os.totalmem(),
          free: os.freemem()
        };
        
        this.metrics.system = {
          uptime: Math.floor(process.uptime()),
          memory: {
            used: systemMemory.total - systemMemory.free,
            total: systemMemory.total,
            percentage: ((systemMemory.total - systemMemory.free) / systemMemory.total) * 100,
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal
          },
          cpu: {
            usage: process.cpuUsage(),
            loadAverage: os.loadavg()
          }
        };
        
        this.emit('systemMetricsCollected', this.metrics.system);
        
      } catch (error) {
        logger.error('Error collecting system metrics', { error: error.message });
      }
    };
    
    // Collect immediately and then every 30 seconds
    collectSystemMetrics();
    this.systemMetricsInterval = setInterval(collectSystemMetrics, 30000);
  }

  // Start metrics cleanup (reset certain metrics periodically)
  startMetricsCleanup() {
    const cleanup = () => {
      try {
        // Reset response time samples if they get too large
        if (this.responseTimeSamples.length > this.maxSamples) {
          this.responseTimeSamples = this.responseTimeSamples.slice(-this.maxSamples / 2);
          this.updateResponseTimePercentiles();
        }
        
        // Log current metrics summary
        logger.info('Metrics summary', {
          totalRequests: this.metrics.requests.total,
          successfulRequests: this.metrics.requests.successful,
          failedRequests: this.metrics.requests.failed,
          avgResponseTime: Math.round(this.metrics.performance.responseTime.avg),
          errorRate: this.metrics.business.errorRate,
          cacheHitRatio: Math.round(this.metrics.business.cacheHitRatio)
        });
        
      } catch (error) {
        logger.error('Error during metrics cleanup', { error: error.message });
      }
    };
    
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(cleanup, 5 * 60 * 1000);
  }

  // Update error rate
  updateErrorRate() {
    const total = this.metrics.requests.total;
    const failed = this.metrics.requests.failed;
    this.metrics.business.errorRate = total > 0 ? (failed / total) * 100 : 0;
  }

  // Normalize endpoint for grouping
  normalizeEndpoint(path) {
    // Replace IDs and parameters with placeholders
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid')
      .replace(/\?.*$/, '');
  }

  // Get all metrics
  getAllMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      collectionUptime: Math.floor(process.uptime())
    };
  }

  // Get metrics summary
  getMetricsSummary() {
    const now = new Date().toISOString();
    
    return {
      timestamp: now,
      uptime: Math.floor(process.uptime()),
      requests: {
        total: this.metrics.requests.total,
        successful: this.metrics.requests.successful,
        failed: this.metrics.requests.failed,
        errorRate: `${this.metrics.business.errorRate.toFixed(2)}%`
      },
      performance: {
        avgResponseTime: `${Math.round(this.metrics.performance.responseTime.avg)}ms`,
        p95ResponseTime: `${Math.round(this.metrics.performance.responseTime.percentiles.p95)}ms`,
        slowQueries: this.metrics.performance.databaseQueries.slowQueries,
        cacheHitRatio: `${Math.round(this.metrics.business.cacheHitRatio)}%`
      },
      system: {
        memoryUsage: `${Math.round(this.metrics.system.memory.percentage)}%`,
        heapUsed: `${Math.round(this.metrics.system.memory.heapUsed / 1024 / 1024)}MB`,
        uptime: `${Math.floor(this.metrics.system.uptime / 60)}m`
      },
      connectors: {
        total: this.metrics.performance.connectorHealth.total,
        healthy: this.metrics.performance.connectorHealth.healthy,
        unhealthy: this.metrics.performance.connectorHealth.unhealthy
      }
    };
  }

  // Reset all metrics
  resetMetrics() {
    logger.info('Resetting all metrics');
    
    // Reset counters but preserve structure
    this.metrics.requests = {
      total: 0,
      successful: 0,
      failed: 0,
      byStatusCode: {},
      byEndpoint: {},
      byMethod: {}
    };
    
    this.metrics.performance.responseTime = {
      count: 0,
      total: 0,
      min: Infinity,
      max: 0,
      avg: 0,
      percentiles: { p50: 0, p90: 0, p95: 0, p99: 0 }
    };
    
    this.responseTimeSamples = [];
    this.cacheHits = 0;
    this.cacheTotal = 0;
    
    this.emit('metricsReset');
  }

  // Cleanup intervals on shutdown
  cleanup() {
    if (this.systemMetricsInterval) {
      clearInterval(this.systemMetricsInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    logger.info('Metrics collector cleaned up');
  }
}

// Create singleton instance
const metricsCollector = new MetricsCollector();

// Export the metrics collector and convenience methods
module.exports = {
  metricsCollector,
  
  // Convenience methods
  recordRequest: (req, res, responseTime) => metricsCollector.recordRequest(req, res, responseTime),
  recordDatabaseQuery: (connector, queryTime, rowCount) => metricsCollector.recordDatabaseQuery(connector, queryTime, rowCount),
  recordConnectorHealth: (connectorId, status) => metricsCollector.recordConnectorHealth(connectorId, status),
  recordSecurityEvent: (eventType, metadata) => metricsCollector.recordSecurityEvent(eventType, metadata),
  recordCacheEvent: (hit) => metricsCollector.recordCacheEvent(hit),
  
  // Getters
  getMetrics: () => metricsCollector.getAllMetrics(),
  getMetricsSummary: () => metricsCollector.getMetricsSummary(),
  
  // Management
  resetMetrics: () => metricsCollector.resetMetrics(),
  cleanup: () => metricsCollector.cleanup()
};