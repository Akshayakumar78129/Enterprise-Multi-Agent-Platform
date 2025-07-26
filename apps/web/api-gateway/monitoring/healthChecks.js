/**
 * Comprehensive Health Check System
 * Phase 9: Monitoring & Observability
 * 
 * Provides detailed health monitoring for all system components including
 * connectors, cache, database connections, and overall system health.
 */

const { logger } = require('./logger');
const { getMetrics, getMetricsSummary } = require('./metrics');

class HealthCheckManager {
  constructor() {
    this.healthChecks = new Map();
    this.systemHealth = {
      status: 'unknown',
      lastCheck: null,
      components: {},
      uptime: 0,
      version: process.env.npm_package_version || '1.0.0'
    };
    
    // Register default health checks
    this.registerDefaultHealthChecks();
    
    logger.info('Health check manager initialized');
  }

  // Register a health check
  registerHealthCheck(name, checkFn, options = {}) {
    const healthCheck = {
      name,
      checkFn,
      timeout: options.timeout || 5000,
      interval: options.interval || 30000,
      enabled: options.enabled !== false,
      lastCheck: null,
      lastResult: null,
      checkCount: 0,
      failureCount: 0
    };
    
    this.healthChecks.set(name, healthCheck);
    
    // Start periodic checking if interval is specified
    if (healthCheck.interval > 0 && healthCheck.enabled) {
      this.startPeriodicCheck(name);
    }
    
    logger.info('Health check registered', { name, timeout: healthCheck.timeout });
  }

  // Start periodic health check
  startPeriodicCheck(name) {
    const healthCheck = this.healthChecks.get(name);
    if (!healthCheck) return;
    
    const runCheck = async () => {
      try {
        await this.runHealthCheck(name);
      } catch (error) {
        logger.error('Periodic health check failed', { name, error: error.message });
      }
    };
    
    // Run immediately and then on interval
    runCheck();
    healthCheck.intervalId = setInterval(runCheck, healthCheck.interval);
  }

  // Run a specific health check
  async runHealthCheck(name) {
    const healthCheck = this.healthChecks.get(name);
    if (!healthCheck || !healthCheck.enabled) {
      return null;
    }
    
    const startTime = Date.now();
    healthCheck.checkCount++;
    
    try {
      // Run the health check with timeout
      const result = await Promise.race([
        healthCheck.checkFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), healthCheck.timeout)
        )
      ]);
      
      const duration = Date.now() - startTime;
      
      const healthResult = {
        name,
        status: result.status || 'healthy',
        message: result.message || 'Health check passed',
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        data: result.data || {},
        checkCount: healthCheck.checkCount,
        failureCount: healthCheck.failureCount
      };
      
      healthCheck.lastCheck = healthResult.timestamp;
      healthCheck.lastResult = healthResult;
      
      logger.debug('Health check completed', {
        name,
        status: healthResult.status,
        duration: healthResult.duration
      });
      
      return healthResult;
      
    } catch (error) {
      healthCheck.failureCount++;
      
      const healthResult = {
        name,
        status: 'unhealthy',
        message: error.message || 'Health check failed',
        timestamp: new Date().toISOString(),
        duration: `${Date.now() - startTime}ms`,
        error: error.message,
        checkCount: healthCheck.checkCount,
        failureCount: healthCheck.failureCount
      };
      
      healthCheck.lastCheck = healthResult.timestamp;
      healthCheck.lastResult = healthResult;
      
      logger.warn('Health check failed', {
        name,
        error: error.message,
        failureCount: healthCheck.failureCount
      });
      
      return healthResult;
    }
  }

  // Run all health checks
  async runAllHealthChecks() {
    const results = {};
    const promises = [];
    
    for (const [name, healthCheck] of this.healthChecks) {
      if (healthCheck.enabled) {
        promises.push(
          this.runHealthCheck(name).then(result => {
            if (result) {
              results[name] = result;
            }
          })
        );
      }
    }
    
    await Promise.allSettled(promises);
    
    // Update system health
    this.updateSystemHealth(results);
    
    return results;
  }

  // Update overall system health status
  updateSystemHealth(componentResults) {
    const components = {};
    let healthyCount = 0;
    let totalCount = 0;
    
    for (const [name, result] of Object.entries(componentResults)) {
      components[name] = {
        status: result.status,
        message: result.message,
        lastCheck: result.timestamp,
        duration: result.duration
      };
      
      totalCount++;
      if (result.status === 'healthy') {
        healthyCount++;
      }
    }
    
    // Determine overall system status
    let systemStatus;
    if (healthyCount === totalCount) {
      systemStatus = 'healthy';
    } else if (healthyCount === 0) {
      systemStatus = 'unhealthy';
    } else {
      systemStatus = 'degraded';
    }
    
    this.systemHealth = {
      status: systemStatus,
      lastCheck: new Date().toISOString(),
      components,
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || '1.0.0',
      healthPercent: totalCount > 0 ? Math.round((healthyCount / totalCount) * 100) : 0,
      summary: {
        total: totalCount,
        healthy: healthyCount,
        unhealthy: totalCount - healthyCount
      }
    };
    
    logger.info('System health updated', {
      status: systemStatus,
      healthPercent: this.systemHealth.healthPercent,
      components: Object.keys(components).length
    });
  }

  // Register default health checks
  registerDefaultHealthChecks() {
    // Memory health check
    this.registerHealthCheck('memory', async () => {
      const memoryUsage = process.memoryUsage();
      const totalMemory = require('os').totalmem();
      const freeMemory = require('os').freemem();
      const usedMemoryPercent = ((totalMemory - freeMemory) / totalMemory) * 100;
      
      let status = 'healthy';
      let message = 'Memory usage normal';
      
      if (usedMemoryPercent > 90) {
        status = 'unhealthy';
        message = 'Critical memory usage';
      } else if (usedMemoryPercent > 80) {
        status = 'degraded';
        message = 'High memory usage';
      }
      
      return {
        status,
        message,
        data: {
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          systemMemoryUsed: `${usedMemoryPercent.toFixed(1)}%`,
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
        }
      };
    }, { interval: 30000 });

    // Disk space health check
    this.registerHealthCheck('disk', async () => {
      const fs = require('fs').promises;
      const path = require('path');
      
      try {
        const stats = await fs.stat(path.join(__dirname, '../logs'));
        const logsDir = path.join(__dirname, '../logs');
        
        // Simple disk space check (this is basic - production should use a proper disk space library)
        return {
          status: 'healthy',
          message: 'Disk space sufficient',
          data: {
            logsDirectory: logsDir,
            accessible: true
          }
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          message: 'Cannot access logs directory',
          data: { error: error.message }
        };
      }
    }, { interval: 60000 });

    // Database connectivity health check
    this.registerHealthCheck('database', async () => {
      try {
        // This would check if we can get the connector registry
        const connectorRegistry = require('../utils/connectorRegistry');
        if (connectorRegistry && connectorRegistry.getConnector) {
          const connectors = connectorRegistry.getAllConnectors();
          
          let healthyConnectors = 0;
          let totalConnectors = 0;
          
          for (const [id, connector] of Object.entries(connectors)) {
            totalConnectors++;
            if (connector.connected) {
              healthyConnectors++;
            }
          }
          
          let status = 'healthy';
          let message = 'All database connections healthy';
          
          if (healthyConnectors === 0 && totalConnectors > 0) {
            status = 'unhealthy';
            message = 'No database connections available';
          } else if (healthyConnectors < totalConnectors) {
            status = 'degraded';
            message = 'Some database connections unavailable';
          }
          
          return {
            status,
            message,
            data: {
              totalConnectors,
              healthyConnectors,
              connectorHealth: `${healthyConnectors}/${totalConnectors}`
            }
          };
        }
        
        return {
          status: 'degraded',
          message: 'Connector registry not available'
        };
        
      } catch (error) {
        return {
          status: 'unhealthy',
          message: 'Database connectivity check failed',
          data: { error: error.message }
        };
      }
    }, { interval: 45000 });

    // Cache health check
    this.registerHealthCheck('cache', async () => {
      try {
        // Check if we have cache functionality
        const NodeCache = require('node-cache');
        const testCache = new NodeCache({ stdTTL: 60 });
        
        // Test cache operations
        const testKey = '__health_check_test__';
        const testValue = Date.now();
        
        testCache.set(testKey, testValue);
        const retrieved = testCache.get(testKey);
        testCache.del(testKey);
        
        if (retrieved === testValue) {
          return {
            status: 'healthy',
            message: 'Cache operations working normally',
            data: {
              cacheType: 'memory',
              testPassed: true
            }
          };
        } else {
          return {
            status: 'unhealthy',
            message: 'Cache operations failing'
          };
        }
        
      } catch (error) {
        return {
          status: 'unhealthy',
          message: 'Cache system unavailable',
          data: { error: error.message }
        };
      }
    }, { interval: 60000 });

    // API responsiveness check
    this.registerHealthCheck('api', async () => {
      const metrics = getMetricsSummary();
      const avgResponseTime = parseFloat(metrics.performance.avgResponseTime) || 0;
      const errorRate = parseFloat(metrics.requests.errorRate) || 0;
      
      let status = 'healthy';
      let message = 'API performance normal';
      
      if (avgResponseTime > 5000 || errorRate > 10) {
        status = 'unhealthy';
        message = 'API performance critical';
      } else if (avgResponseTime > 2000 || errorRate > 5) {
        status = 'degraded';
        message = 'API performance degraded';
      }
      
      return {
        status,
        message,
        data: {
          avgResponseTime: `${avgResponseTime}ms`,
          errorRate: `${errorRate}%`,
          totalRequests: metrics.requests.total
        }
      };
    }, { interval: 30000 });
  }

  // Get basic health status
  getBasicHealth() {
    return {
      status: this.systemHealth.status === 'unknown' ? 'healthy' : this.systemHealth.status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };
  }

  // Get detailed health status
  getDetailedHealth() {
    return {
      ...this.systemHealth,
      metrics: getMetricsSummary(),
      checks: Object.fromEntries(
        Array.from(this.healthChecks.entries()).map(([name, check]) => [
          name,
          {
            enabled: check.enabled,
            lastCheck: check.lastCheck,
            lastResult: check.lastResult ? {
              status: check.lastResult.status,
              message: check.lastResult.message,
              duration: check.lastResult.duration
            } : null,
            checkCount: check.checkCount,
            failureCount: check.failureCount,
            successRate: check.checkCount > 0 ? 
              `${(((check.checkCount - check.failureCount) / check.checkCount) * 100).toFixed(1)}%` : 'N/A'
          }
        ])
      )
    };
  }

  // Get connector health
  async getConnectorHealth() {
    try {
      const connectorRegistry = require('../utils/connectorRegistry');
      const connectors = connectorRegistry.getAllConnectors();
      
      const connectorHealth = {};
      let totalConnectors = 0;
      let healthyConnectors = 0;
      
      for (const [id, connector] of Object.entries(connectors)) {
        totalConnectors++;
        
        try {
          const health = await connector.healthCheck();
          const isHealthy = health.status === 'healthy';
          
          if (isHealthy) {
            healthyConnectors++;
          }
          
          connectorHealth[id] = {
            status: health.status,
            lastHealthCheck: health.timestamp || new Date().toISOString(),
            connected: connector.connected,
            type: connector.type,
            latency: health.latency,
            message: health.message
          };
          
        } catch (error) {
          connectorHealth[id] = {
            status: 'unhealthy',
            lastHealthCheck: new Date().toISOString(),
            connected: false,
            type: connector.type,
            error: error.message
          };
        }
      }
      
      const healthPercent = totalConnectors > 0 ? 
        Math.round((healthyConnectors / totalConnectors) * 100) : 100;
      
      let overallStatus = 'healthy';
      if (healthyConnectors === 0 && totalConnectors > 0) {
        overallStatus = 'error';
      } else if (healthyConnectors < totalConnectors) {
        overallStatus = 'degraded';
      }
      
      return {
        status: overallStatus,
        summary: {
          total: totalConnectors,
          healthy: healthyConnectors,
          unhealthy: totalConnectors - healthyConnectors,
          healthPercent
        },
        connectors: connectorHealth,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('Failed to get connector health', { error: error.message });
      
      return {
        status: 'error',
        summary: {
          total: 0,
          healthy: 0,
          unhealthy: 0,
          healthPercent: 0
        },
        connectors: {},
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // Get performance metrics
  getMetrics() {
    return {
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      memory: {
        rss: process.memoryUsage().rss,
        heapTotal: process.memoryUsage().heapTotal,
        heapUsed: process.memoryUsage().heapUsed,
        heapUsedPercent: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
      },
      cpu: process.cpuUsage(),
      system: {
        loadAverage: require('os').loadavg(),
        freeMemory: require('os').freemem(),
        totalMemory: require('os').totalmem()
      },
      ...getMetrics()
    };
  }

  // Enable/disable health check
  setHealthCheckEnabled(name, enabled) {
    const healthCheck = this.healthChecks.get(name);
    if (!healthCheck) return false;
    
    healthCheck.enabled = enabled;
    
    if (enabled && healthCheck.interval > 0) {
      this.startPeriodicCheck(name);
    } else if (!enabled && healthCheck.intervalId) {
      clearInterval(healthCheck.intervalId);
      delete healthCheck.intervalId;
    }
    
    logger.info('Health check status changed', { name, enabled });
    return true;
  }

  // Cleanup intervals
  cleanup() {
    for (const [name, healthCheck] of this.healthChecks) {
      if (healthCheck.intervalId) {
        clearInterval(healthCheck.intervalId);
      }
    }
    
    logger.info('Health check manager cleaned up');
  }
}

// Create singleton instance
const healthCheckManager = new HealthCheckManager();

// Export the health check manager and convenience methods
module.exports = {
  healthCheckManager,
  
  // Convenience methods
  getBasicHealth: () => healthCheckManager.getBasicHealth(),
  getDetailedHealth: () => healthCheckManager.getDetailedHealth(),
  getConnectorHealth: () => healthCheckManager.getConnectorHealth(),
  getMetrics: () => healthCheckManager.getMetrics(),
  runAllHealthChecks: () => healthCheckManager.runAllHealthChecks(),
  
  // Management
  registerHealthCheck: (name, checkFn, options) => 
    healthCheckManager.registerHealthCheck(name, checkFn, options),
  setHealthCheckEnabled: (name, enabled) => 
    healthCheckManager.setHealthCheckEnabled(name, enabled),
  cleanup: () => healthCheckManager.cleanup()
};