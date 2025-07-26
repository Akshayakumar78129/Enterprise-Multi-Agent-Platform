/**
 * Intelligent Alerting System
 * Phase 9: Monitoring & Observability
 * 
 * Provides smart alerting for errors, performance issues, and system anomalies
 * with configurable thresholds, alert suppression, and multiple notification channels.
 */

const EventEmitter = require('events');
const { logger } = require('./logger');
const { getMetrics, getMetricsSummary } = require('./metrics');

class AlertingSystem extends EventEmitter {
  constructor() {
    super();
    
    // Alert rules configuration
    this.alertRules = new Map();
    this.alerts = new Map(); // Active alerts
    this.alertHistory = []; // Alert history
    this.suppressedAlerts = new Set(); // Suppressed alert types
    
    // Alert settings
    this.settings = {
      maxHistorySize: 1000,
      suppressionDuration: 300000, // 5 minutes
      escalationDelay: 900000, // 15 minutes
      batchingWindow: 60000, // 1 minute
      enabledChannels: ['log', 'webhook'] // Available: log, email, webhook, slack
    };
    
    // Alert channels
    this.channels = {
      log: this.logAlert.bind(this),
      webhook: this.sendWebhookAlert.bind(this),
      email: this.sendEmailAlert.bind(this),
      slack: this.sendSlackAlert.bind(this)
    };
    
    // Initialize default alert rules
    this.initializeDefaultRules();
    
    // Start alert processing
    this.startAlertProcessor();
    
    logger.info('Alerting system initialized');
  }

  // Initialize default alert rules
  initializeDefaultRules() {
    // High error rate alert
    this.addAlertRule('high_error_rate', {
      condition: (metrics) => {
        const errorRate = parseFloat(metrics.requests?.errorRate || 0);
        return errorRate > 10; // 10% error rate
      },
      severity: 'high',
      message: (metrics) => `High error rate detected: ${metrics.requests?.errorRate || 'N/A'}`,
      threshold: 10,
      cooldown: 300000 // 5 minutes
    });

    // Slow response time alert
    this.addAlertRule('slow_response_time', {
      condition: (metrics) => {
        const avgResponseTime = parseFloat(metrics.performance?.avgResponseTime || 0);
        return avgResponseTime > 3000; // 3 seconds
      },
      severity: 'medium',
      message: (metrics) => `Slow response time detected: ${metrics.performance?.avgResponseTime || 'N/A'}`,
      threshold: 3000,
      cooldown: 600000 // 10 minutes
    });

    // High memory usage alert
    this.addAlertRule('high_memory_usage', {
      condition: (metrics) => {
        const memoryPercent = parseFloat(metrics.system?.memoryUsage || 0);
        return memoryPercent > 85; // 85% memory usage
      },
      severity: 'high',
      message: (metrics) => `High memory usage detected: ${metrics.system?.memoryUsage || 'N/A'}`,
      threshold: 85,
      cooldown: 900000 // 15 minutes
    });

    // Connector health alert
    this.addAlertRule('connector_unhealthy', {
      condition: (metrics) => {
        const unhealthyConnectors = metrics.connectors?.unhealthy || 0;
        return unhealthyConnectors > 0;
      },
      severity: 'high',
      message: (metrics) => `Unhealthy connectors detected: ${metrics.connectors?.unhealthy || 0} out of ${metrics.connectors?.total || 0}`,
      threshold: 1,
      cooldown: 600000 // 10 minutes
    });

    // Database query performance alert
    this.addAlertRule('slow_database_queries', {
      condition: (metrics) => {
        const slowQueries = metrics.performance?.slowQueries || 0;
        return slowQueries > 5; // More than 5 slow queries
      },
      severity: 'medium',
      message: (metrics) => `Multiple slow database queries detected: ${metrics.performance?.slowQueries || 0}`,
      threshold: 5,
      cooldown: 1800000 // 30 minutes
    });

    // Cache hit ratio alert
    this.addAlertRule('low_cache_hit_ratio', {
      condition: (metrics) => {
        const cacheHitRatio = parseFloat(metrics.performance?.cacheHitRatio || 100);
        return cacheHitRatio < 50; // Less than 50% cache hit ratio
      },
      severity: 'low',
      message: (metrics) => `Low cache hit ratio detected: ${metrics.performance?.cacheHitRatio || 'N/A'}`,
      threshold: 50,
      cooldown: 1800000 // 30 minutes
    });

    // Authentication failure spike alert
    this.addAlertRule('auth_failure_spike', {
      condition: (metrics) => {
        // This would need to track auth failures over time
        return false; // Placeholder - would implement with proper tracking
      },
      severity: 'high',
      message: () => 'Authentication failure spike detected',
      threshold: 10,
      cooldown: 300000 // 5 minutes
    });

    logger.info('Default alert rules initialized', { 
      rulesCount: this.alertRules.size 
    });
  }

  // Add new alert rule
  addAlertRule(name, rule) {
    const alertRule = {
      name,
      condition: rule.condition,
      severity: rule.severity || 'medium',
      message: rule.message || (() => `Alert: ${name}`),
      threshold: rule.threshold,
      cooldown: rule.cooldown || 300000,
      enabled: rule.enabled !== false,
      lastTriggered: null,
      triggerCount: 0,
      suppressedUntil: null
    };

    this.alertRules.set(name, alertRule);
    
    logger.info('Alert rule added', { 
      name, 
      severity: alertRule.severity,
      threshold: alertRule.threshold 
    });
  }

  // Remove alert rule
  removeAlertRule(name) {
    const removed = this.alertRules.delete(name);
    if (removed) {
      logger.info('Alert rule removed', { name });
    }
    return removed;
  }

  // Enable/disable alert rule
  setAlertRuleEnabled(name, enabled) {
    const rule = this.alertRules.get(name);
    if (rule) {
      rule.enabled = enabled;
      logger.info('Alert rule status changed', { name, enabled });
      return true;
    }
    return false;
  }

  // Check all alert conditions
  async checkAlerts() {
    try {
      const metrics = getMetricsSummary();
      const triggeredAlerts = [];

      for (const [name, rule] of this.alertRules) {
        if (!rule.enabled) continue;

        // Check if rule is in cooldown
        if (rule.lastTriggered && 
            Date.now() - rule.lastTriggered < rule.cooldown) {
          continue;
        }

        // Check if alert is suppressed
        if (this.suppressedAlerts.has(name)) {
          continue;
        }

        try {
          // Evaluate condition
          if (rule.condition(metrics)) {
            const alert = this.createAlert(name, rule, metrics);
            triggeredAlerts.push(alert);
            rule.lastTriggered = Date.now();
            rule.triggerCount++;
          }
        } catch (error) {
          logger.error('Error evaluating alert rule', { 
            name, 
            error: error.message 
          });
        }
      }

      // Process triggered alerts
      for (const alert of triggeredAlerts) {
        await this.processAlert(alert);
      }

      return triggeredAlerts;

    } catch (error) {
      logger.error('Error checking alerts', { error: error.message });
      return [];
    }
  }

  // Create alert object
  createAlert(ruleName, rule, metrics) {
    const alertId = `${ruleName}_${Date.now()}`;
    
    const alert = {
      id: alertId,
      rule: ruleName,
      severity: rule.severity,
      message: typeof rule.message === 'function' ? 
        rule.message(metrics) : rule.message,
      timestamp: new Date().toISOString(),
      metrics: this.extractRelevantMetrics(metrics, ruleName),
      status: 'active',
      acknowledgedBy: null,
      acknowledgedAt: null,
      resolvedAt: null
    };

    // Store active alert
    this.alerts.set(alertId, alert);

    // Add to history
    this.addToHistory(alert);

    return alert;
  }

  // Extract relevant metrics for alert
  extractRelevantMetrics(metrics, ruleName) {
    const relevantMetrics = {
      timestamp: metrics.timestamp,
      uptime: metrics.uptime
    };

    // Include specific metrics based on alert type
    switch (ruleName) {
      case 'high_error_rate':
      case 'slow_response_time':
        relevantMetrics.requests = metrics.requests;
        relevantMetrics.performance = metrics.performance;
        break;
      case 'high_memory_usage':
        relevantMetrics.system = metrics.system;
        break;
      case 'connector_unhealthy':
        relevantMetrics.connectors = metrics.connectors;
        break;
      case 'slow_database_queries':
      case 'low_cache_hit_ratio':
        relevantMetrics.performance = metrics.performance;
        break;
      default:
        // Include all metrics for unknown alert types
        return metrics;
    }

    return relevantMetrics;
  }

  // Process alert through channels
  async processAlert(alert) {
    try {
      logger.warn('Alert triggered', {
        id: alert.id,
        rule: alert.rule,
        severity: alert.severity,
        message: alert.message
      });

      // Send through enabled channels
      const channelPromises = this.settings.enabledChannels.map(channel => {
        if (this.channels[channel]) {
          return this.channels[channel](alert).catch(error => {
            logger.error('Alert channel failed', { 
              channel, 
              alertId: alert.id, 
              error: error.message 
            });
          });
        }
      });

      await Promise.allSettled(channelPromises);

      // Emit alert event
      this.emit('alertTriggered', alert);

      // Auto-escalate if needed
      this.scheduleEscalation(alert);

    } catch (error) {
      logger.error('Error processing alert', { 
        alertId: alert.id, 
        error: error.message 
      });
    }
  }

  // Log alert channel
  async logAlert(alert) {
    const logLevel = this.getSeverityLogLevel(alert.severity);
    
    logger[logLevel]('ALERT', {
      alertId: alert.id,
      rule: alert.rule,
      severity: alert.severity,
      message: alert.message,
      timestamp: alert.timestamp,
      metrics: alert.metrics
    });
  }

  // Webhook alert channel
  async sendWebhookAlert(alert) {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const fetch = require('node-fetch');
      const payload = {
        alert: {
          id: alert.id,
          rule: alert.rule,
          severity: alert.severity,
          message: alert.message,
          timestamp: alert.timestamp
        },
        service: 'api-gateway',
        environment: process.env.NODE_ENV || 'development'
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }

      logger.info('Alert sent via webhook', { alertId: alert.id });

    } catch (error) {
      logger.error('Webhook alert failed', { 
        alertId: alert.id, 
        error: error.message 
      });
    }
  }

  // Email alert channel (placeholder)
  async sendEmailAlert(alert) {
    // Implementation would depend on email service (SendGrid, SES, etc.)
    logger.info('Email alert would be sent', { 
      alertId: alert.id,
      message: 'Email functionality not implemented' 
    });
  }

  // Slack alert channel (placeholder)
  async sendSlackAlert(alert) {
    // Implementation would depend on Slack webhook or API
    logger.info('Slack alert would be sent', { 
      alertId: alert.id,
      message: 'Slack functionality not implemented' 
    });
  }

  // Get log level for severity
  getSeverityLogLevel(severity) {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      case 'low':
        return 'info';
      default:
        return 'warn';
    }
  }

  // Schedule alert escalation
  scheduleEscalation(alert) {
    if (alert.severity === 'critical' || alert.severity === 'high') {
      setTimeout(() => {
        this.escalateAlert(alert.id);
      }, this.settings.escalationDelay);
    }
  }

  // Escalate alert
  escalateAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status !== 'active') return;

    // Check if alert is still active and not acknowledged
    if (!alert.acknowledgedBy) {
      logger.error('Alert escalated - no acknowledgment', {
        alertId,
        rule: alert.rule,
        severity: alert.severity,
        message: alert.message,
        age: Date.now() - new Date(alert.timestamp).getTime()
      });

      // Send escalated alert
      this.processAlert({
        ...alert,
        id: `${alertId}_escalated`,
        message: `ESCALATED: ${alert.message}`,
        severity: 'critical'
      });

      this.emit('alertEscalated', alert);
    }
  }

  // Acknowledge alert
  acknowledgeAlert(alertId, acknowledgedBy) {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date().toISOString();

    logger.info('Alert acknowledged', {
      alertId,
      acknowledgedBy,
      rule: alert.rule
    });

    this.emit('alertAcknowledged', alert);
    return true;
  }

  // Resolve alert
  resolveAlert(alertId, resolvedBy) {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = 'resolved';
    alert.resolvedAt = new Date().toISOString();

    // Remove from active alerts
    this.alerts.delete(alertId);

    logger.info('Alert resolved', {
      alertId,
      resolvedBy,
      rule: alert.rule,
      duration: Date.now() - new Date(alert.timestamp).getTime()
    });

    this.emit('alertResolved', alert);
    return true;
  }

  // Suppress alert type
  suppressAlertType(ruleName, duration = null) {
    this.suppressedAlerts.add(ruleName);
    
    if (duration) {
      setTimeout(() => {
        this.suppressedAlerts.delete(ruleName);
        logger.info('Alert suppression expired', { ruleName });
      }, duration);
    }

    logger.info('Alert type suppressed', { ruleName, duration });
  }

  // Remove alert suppression
  removeSuppression(ruleName) {
    const removed = this.suppressedAlerts.delete(ruleName);
    if (removed) {
      logger.info('Alert suppression removed', { ruleName });
    }
    return removed;
  }

  // Add alert to history
  addToHistory(alert) {
    this.alertHistory.unshift(alert);
    
    // Trim history if too large
    if (this.alertHistory.length > this.settings.maxHistorySize) {
      this.alertHistory = this.alertHistory.slice(0, this.settings.maxHistorySize);
    }
  }

  // Start periodic alert checking
  startAlertProcessor() {
    const checkInterval = 60000; // Check every minute
    
    const processAlerts = async () => {
      try {
        await this.checkAlerts();
      } catch (error) {
        logger.error('Alert processor error', { error: error.message });
      }
    };

    // Run immediately and then on interval
    processAlerts();
    this.processorInterval = setInterval(processAlerts, checkInterval);
    
    logger.info('Alert processor started', { intervalMs: checkInterval });
  }

  // Get alert statistics
  getAlertStats() {
    const stats = {
      active: this.alerts.size,
      rules: this.alertRules.size,
      suppressed: this.suppressedAlerts.size,
      historySize: this.alertHistory.length
    };

    // Count by severity
    const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const alert of this.alerts.values()) {
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
    }
    stats.bySeverity = bySeverity;

    // Recent activity (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    stats.recent24h = this.alertHistory.filter(alert => 
      new Date(alert.timestamp).getTime() > oneDayAgo
    ).length;

    return stats;
  }

  // Get active alerts
  getActiveAlerts() {
    return Array.from(this.alerts.values()).map(alert => ({
      id: alert.id,
      rule: alert.rule,
      severity: alert.severity,
      message: alert.message,
      timestamp: alert.timestamp,
      status: alert.status,
      acknowledgedBy: alert.acknowledgedBy,
      acknowledgedAt: alert.acknowledgedAt
    }));
  }

  // Get alert history
  getAlertHistory(limit = 100) {
    return this.alertHistory.slice(0, limit).map(alert => ({
      id: alert.id,
      rule: alert.rule,
      severity: alert.severity,
      message: alert.message,
      timestamp: alert.timestamp,
      status: alert.status
    }));
  }

  // Cleanup
  cleanup() {
    if (this.processorInterval) {
      clearInterval(this.processorInterval);
    }
    
    logger.info('Alerting system cleaned up');
  }
}

// Create singleton instance
const alertingSystem = new AlertingSystem();

// Export the alerting system and convenience methods
module.exports = {
  alertingSystem,
  
  // Convenience methods
  checkAlerts: () => alertingSystem.checkAlerts(),
  addAlertRule: (name, rule) => alertingSystem.addAlertRule(name, rule),
  removeAlertRule: (name) => alertingSystem.removeAlertRule(name),
  acknowledgeAlert: (alertId, user) => alertingSystem.acknowledgeAlert(alertId, user),
  resolveAlert: (alertId, user) => alertingSystem.resolveAlert(alertId, user),
  suppressAlertType: (ruleName, duration) => alertingSystem.suppressAlertType(ruleName, duration),
  
  // Getters
  getActiveAlerts: () => alertingSystem.getActiveAlerts(),
  getAlertHistory: (limit) => alertingSystem.getAlertHistory(limit),
  getAlertStats: () => alertingSystem.getAlertStats(),
  
  // Management
  cleanup: () => alertingSystem.cleanup()
};