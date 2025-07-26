/**
 * Monitoring System Integration
 * Phase 9: Monitoring & Observability
 * 
 * Centralizes all monitoring components and provides a unified interface
 * for logging, metrics, health checks, alerting, tracing, and circuit breakers.
 */

const { logger, performanceMonitor, requestTracker, LoggerHelpers } = require('./logger');
const { metricsCollector, getMetrics, getMetricsSummary } = require('./metrics');
const { healthCheckManager, getBasicHealth, getDetailedHealth, getConnectorHealth } = require('./healthChecks');
const { alertingSystem, getActiveAlerts, getAlertHistory, getAlertStats } = require('./alerting');
const { tracingSystem, startTrace, getTraceHistory, getTraceStats, middleware: tracingMiddleware } = require('./tracing');
const { circuitBreakerManager, dependencyMonitor, getAllCircuitBreakerStatus, getDependenciesSummary } = require('./circuitBreaker');

class MonitoringSystem {
  constructor() {
    this.initialized = false;
    this.startTime = Date.now();
    
    // Component status
    this.components = {
      logger: 'active',
      metrics: 'active',
      healthChecks: 'active',
      alerting: 'active',
      tracing: 'active',
      circuitBreakers: 'active',
      dependencyMonitor: 'active'
    };
    
    logger.info('Monitoring system integration initialized');
  }

  // Initialize monitoring system
  async initialize(config = {}) {
    try {
      // Apply configuration
      this.config = {
        enableTracing: config.enableTracing !== false,
        enableAlerting: config.enableAlerting !== false,
        enableCircuitBreakers: config.enableCircuitBreakers !== false,
        enableDependencyMonitoring: config.enableDependencyMonitoring !== false,
        ...config
      };

      // Register default dependencies if provided
      if (this.config.dependencies) {
        for (const [name, depConfig] of Object.entries(this.config.dependencies)) {
          dependencyMonitor.registerDependency(name, depConfig);
        }
      }

      // Set up component integrations
      this.setupComponentIntegrations();

      this.initialized = true;
      
      logger.info('Monitoring system fully initialized', {
        components: Object.keys(this.components).length,
        enabledFeatures: Object.entries(this.config)
          .filter(([key, value]) => key.startsWith('enable') && value)
          .map(([key]) => key.replace('enable', '').toLowerCase())
      });

      return true;

    } catch (error) {
      logger.error('Failed to initialize monitoring system', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Set up integrations between components
  setupComponentIntegrations() {
    // Connect metrics to alerting
    metricsCollector.on('requestRecorded', (data) => {
      // Trigger alert checking periodically
      if (Math.random() < 0.01) { // 1% sampling rate
        alertingSystem.checkAlerts().catch(err => 
          logger.error('Alert check failed', { error: err.message })
        );
      }
    });

    // Connect health checks to metrics
    healthCheckManager.healthCheckManager.on('healthCheckCompleted', (result) => {
      metricsCollector.recordConnectorHealth(result.name, result.status);
    });

    // Connect circuit breakers to alerting
    circuitBreakerManager.circuitBreakers?.forEach?.(circuitBreaker => {
      circuitBreaker.on('stateChange', (event) => {
        if (event.to === 'open') {
          // Circuit breaker opened - could trigger alert
          logger.warn('Circuit breaker opened', event);
        }
      });
    });

    logger.debug('Component integrations set up');
  }

  // Get comprehensive system status
  async getSystemStatus() {
    const status = {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      initialized: this.initialized,
      components: this.components
    };

    try {
      // Basic health
      status.health = getBasicHealth();
      
      // Metrics summary
      status.metrics = getMetricsSummary();
      
      // Active alerts
      status.alerts = {
        active: getActiveAlerts().length,
        stats: getAlertStats()
      };
      
      // Circuit breakers
      status.circuitBreakers = {
        summary: circuitBreakerManager.getSummary(),
        count: Object.keys(getAllCircuitBreakerStatus()).length
      };
      
      // Dependencies
      status.dependencies = getDependenciesSummary();
      
      // Tracing
      status.tracing = {
        active: tracingSystem.getActiveTraces().length,
        stats: getTraceStats()
      };

      // Overall system health determination
      status.overallHealth = this.determineOverallHealth(status);

    } catch (error) {
      logger.error('Error getting system status', { error: error.message });
      status.error = error.message;
      status.overallHealth = 'unhealthy';
    }

    return status;
  }

  // Determine overall system health
  determineOverallHealth(status) {
    const healthChecks = [
      status.health?.status === 'healthy',
      status.metrics?.requests?.errorRate ? parseFloat(status.metrics.requests.errorRate) < 10 : true,
      status.alerts?.active < 5,
      status.dependencies?.criticalUnhealthy === 0,
      status.circuitBreakers?.summary?.byHealth?.unhealthy === 0
    ];

    const healthyChecks = healthChecks.filter(Boolean).length;
    const totalChecks = healthChecks.length;

    if (healthyChecks === totalChecks) {
      return 'healthy';
    } else if (healthyChecks >= totalChecks * 0.7) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  // Get monitoring dashboard data
  async getDashboardData() {
    try {
      const [
        systemStatus,
        detailedHealth,
        connectorHealth,
        metrics,
        activeAlerts,
        alertHistory,
        traceHistory,
        circuitBreakerStatus,
        dependenciesStatus
      ] = await Promise.all([
        this.getSystemStatus(),
        getDetailedHealth(),
        getConnectorHealth(),
        getMetrics(),
        getActiveAlerts(),
        getAlertHistory(50),
        getTraceHistory(100),
        getAllCircuitBreakerStatus(),
        dependencyMonitor.getAllDependenciesStatus()
      ]);

      return {
        system: systemStatus,
        health: {
          basic: systemStatus.health,
          detailed: detailedHealth,
          connectors: connectorHealth
        },
        metrics,
        alerts: {
          active: activeAlerts,
          history: alertHistory,
          stats: getAlertStats()
        },
        tracing: {
          active: tracingSystem.getActiveTraces(),
          history: traceHistory,
          stats: getTraceStats()
        },
        circuitBreakers: circuitBreakerStatus,
        dependencies: dependenciesStatus,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error getting dashboard data', { error: error.message });
      throw error;
    }
  }

  // Express middleware factory
  createMiddleware() {
    const middlewares = [];

    // Add tracing middleware if enabled
    if (this.config.enableTracing) {
      middlewares.push(tracingMiddleware());
    }

    // Add request ID middleware
    middlewares.push((req, res, next) => {
      if (!req.headers['x-request-id']) {
        req.headers['x-request-id'] = require('uuid').v4();
      }
      req.requestId = req.headers['x-request-id'];
      res.set('X-Request-Id', req.requestId);
      next();
    });

    // Add performance monitoring middleware
    middlewares.push((req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        
        // Record metrics
        metricsCollector.recordRequest(req, res, responseTime);
        
        // Log request
        LoggerHelpers.logApiRequest(req, res, responseTime);
      });
      
      next();
    });

    return middlewares;
  }

  // Create monitoring routes
  createRoutes(router) {
    // Basic health check
    router.get('/health', async (req, res) => {
      try {
        const health = getBasicHealth();
        res.status(health.status === 'healthy' ? 200 : 503).json(health);
      } catch (error) {
        logger.error('Health check failed', { error: error.message });
        res.status(500).json({
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Detailed health check
    router.get('/health/detailed', async (req, res) => {
      try {
        const health = await getDetailedHealth();
        res.json(health);
      } catch (error) {
        logger.error('Detailed health check failed', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    // Connector health
    router.get('/health/connectors', async (req, res) => {
      try {
        const connectorHealth = await getConnectorHealth();
        res.json(connectorHealth);
      } catch (error) {
        logger.error('Connector health check failed', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    // Performance metrics
    router.get('/metrics', async (req, res) => {
      try {
        const metrics = getMetrics();
        res.json(metrics);
      } catch (error) {
        logger.error('Metrics retrieval failed', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    // Metrics summary
    router.get('/metrics/summary', async (req, res) => {
      try {
        const summary = getMetricsSummary();
        res.json(summary);
      } catch (error) {
        logger.error('Metrics summary failed', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    // Active alerts
    router.get('/alerts', async (req, res) => {
      try {
        const alerts = getActiveAlerts();
        res.json({ alerts, count: alerts.length });
      } catch (error) {
        logger.error('Alert retrieval failed', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    // Alert history
    router.get('/alerts/history', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 100;
        const history = getAlertHistory(limit);
        res.json({ history, count: history.length });
      } catch (error) {
        logger.error('Alert history retrieval failed', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    // Trace history
    router.get('/traces', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 100;
        const filter = {
          operationName: req.query.operation,
          minDuration: req.query.minDuration ? parseInt(req.query.minDuration) : undefined,
          maxDuration: req.query.maxDuration ? parseInt(req.query.maxDuration) : undefined,
          since: req.query.since
        };
        
        const traces = getTraceHistory(limit, filter);
        res.json({ traces, count: traces.length });
      } catch (error) {
        logger.error('Trace retrieval failed', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    // Get specific trace
    router.get('/traces/:traceId', async (req, res) => {
      try {
        const trace = tracingSystem.getTrace(req.params.traceId);
        if (!trace) {
          return res.status(404).json({ error: 'Trace not found' });
        }
        res.json(trace);
      } catch (error) {
        logger.error('Trace retrieval failed', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    // Circuit breaker status
    router.get('/circuit-breakers', async (req, res) => {
      try {
        const status = getAllCircuitBreakerStatus();
        const summary = circuitBreakerManager.getSummary();
        res.json({ circuitBreakers: status, summary });
      } catch (error) {
        logger.error('Circuit breaker status failed', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    // Dependencies status
    router.get('/dependencies', async (req, res) => {
      try {
        const status = dependencyMonitor.getAllDependenciesStatus();
        const summary = getDependenciesSummary();
        res.json({ dependencies: status, summary });
      } catch (error) {
        logger.error('Dependencies status failed', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    // System status
    router.get('/status', async (req, res) => {
      try {
        const status = await this.getSystemStatus();
        res.json(status);
      } catch (error) {
        logger.error('System status failed', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    // Dashboard data
    router.get('/dashboard', async (req, res) => {
      try {
        const dashboardData = await this.getDashboardData();
        res.json(dashboardData);
      } catch (error) {
        logger.error('Dashboard data failed', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    logger.info('Monitoring routes created');
  }

  // Shutdown monitoring system
  async shutdown() {
    try {
      logger.info('Shutting down monitoring system...');

      // Cleanup all components
      await Promise.all([
        healthCheckManager.cleanup(),
        metricsCollector.cleanup(),
        alertingSystem.cleanup(),
        tracingSystem.cleanup(),
        circuitBreakerManager.cleanup(),
        dependencyMonitor.cleanup()
      ]);

      this.components = Object.fromEntries(
        Object.keys(this.components).map(key => [key, 'inactive'])
      );

      logger.info('Monitoring system shutdown complete');

    } catch (error) {
      logger.error('Error during monitoring system shutdown', {
        error: error.message
      });
    }
  }
}

// Create singleton instance
const monitoringSystem = new MonitoringSystem();

// Export the monitoring system and all components
module.exports = {
  // Main monitoring system
  monitoringSystem,
  
  // Individual components
  logger,
  metricsCollector,
  healthCheckManager,
  alertingSystem,
  tracingSystem,
  circuitBreakerManager,
  dependencyMonitor,
  
  // Convenience methods
  initialize: (config) => monitoringSystem.initialize(config),
  getSystemStatus: () => monitoringSystem.getSystemStatus(),
  getDashboardData: () => monitoringSystem.getDashboardData(),
  createMiddleware: () => monitoringSystem.createMiddleware(),
  createRoutes: (router) => monitoringSystem.createRoutes(router),
  shutdown: () => monitoringSystem.shutdown(),
  
  // Component methods
  getBasicHealth,
  getDetailedHealth,
  getConnectorHealth,
  getMetrics,
  getMetricsSummary,
  getActiveAlerts,
  getAlertHistory,
  getTraceHistory,
  getAllCircuitBreakerStatus,
  getDependenciesSummary,
  
  // Utilities
  LoggerHelpers,
  performanceMonitor,
  requestTracker
};