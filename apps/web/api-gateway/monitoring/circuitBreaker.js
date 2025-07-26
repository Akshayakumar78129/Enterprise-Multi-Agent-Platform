/**
 * Circuit Breaker and Dependency Monitoring System
 * Phase 9: Monitoring & Observability
 * 
 * Implements circuit breaker pattern for dependency resilience, monitors
 * external service health, and provides automatic failure recovery.
 */

const EventEmitter = require('events');
const { logger } = require('./logger');
const { recordSecurityEvent } = require('./metrics');

// Circuit breaker states
const STATES = {
  CLOSED: 'closed',     // Normal operation
  OPEN: 'open',         // Failing fast
  HALF_OPEN: 'half-open' // Testing recovery
};

class CircuitBreaker extends EventEmitter {
  constructor(name, options = {}) {
    super();
    
    this.name = name;
    this.state = STATES.CLOSED;
    
    // Configuration
    this.config = {
      failureThreshold: options.failureThreshold || 5,
      recoveryTimeout: options.recoveryTimeout || 60000, // 1 minute
      monitoringPeriod: options.monitoringPeriod || 60000, // 1 minute
      halfOpenMaxCalls: options.halfOpenMaxCalls || 3,
      timeout: options.timeout || 30000, // 30 seconds
      volumeThreshold: options.volumeThreshold || 10, // Minimum calls before circuit can open
      errorThresholdPercentage: options.errorThresholdPercentage || 50 // 50% error rate
    };
    
    // Statistics
    this.stats = {
      totalCalls: 0,
      successCalls: 0,
      failureCalls: 0,
      timeoutCalls: 0,
      rejectedCalls: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      stateTransitions: []
    };
    
    // Sliding window for failure tracking
    this.callHistory = [];
    this.maxHistorySize = 100;
    
    // State management
    this.nextAttempt = 0;
    this.halfOpenCallCount = 0;
    
    // Recovery timer
    this.recoveryTimer = null;
    
    logger.info('Circuit breaker created', {
      name: this.name,
      failureThreshold: this.config.failureThreshold,
      recoveryTimeout: this.config.recoveryTimeout
    });
  }

  // Execute a function with circuit breaker protection
  async execute(fn, fallback = null) {
    const callId = `${this.name}_${Date.now()}_${Math.random()}`;
    
    // Check if circuit is open
    if (this.state === STATES.OPEN) {
      if (Date.now() < this.nextAttempt) {
        this.stats.rejectedCalls++;
        const error = new Error(`Circuit breaker is OPEN for ${this.name}`);
        error.code = 'CIRCUIT_BREAKER_OPEN';
        
        logger.warn('Call rejected by circuit breaker', {
          name: this.name,
          state: this.state,
          callId
        });
        
        // Try fallback if available
        if (fallback && typeof fallback === 'function') {
          try {
            return await fallback();
          } catch (fallbackError) {
            logger.error('Fallback function failed', {
              name: this.name,
              error: fallbackError.message
            });
            throw error; // Throw original circuit breaker error
          }
        }
        
        throw error;
      } else {
        // Transition to half-open
        this.transitionTo(STATES.HALF_OPEN);
      }
    }
    
    // In half-open state, limit the number of calls
    if (this.state === STATES.HALF_OPEN) {
      if (this.halfOpenCallCount >= this.config.halfOpenMaxCalls) {
        this.stats.rejectedCalls++;
        const error = new Error(`Circuit breaker is HALF-OPEN and at call limit for ${this.name}`);
        error.code = 'CIRCUIT_BREAKER_HALF_OPEN_LIMIT';
        throw error;
      }
      this.halfOpenCallCount++;
    }
    
    // Execute the function
    const startTime = Date.now();
    this.stats.totalCalls++;
    
    try {
      // Apply timeout
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), this.config.timeout)
        )
      ]);
      
      // Record success
      this.onSuccess(callId, Date.now() - startTime);
      return result;
      
    } catch (error) {
      // Record failure
      this.onFailure(callId, error, Date.now() - startTime);
      
      // Try fallback if available
      if (fallback && typeof fallback === 'function') {
        try {
          logger.info('Executing fallback function', { name: this.name, callId });
          return await fallback();
        } catch (fallbackError) {
          logger.error('Fallback function failed', {
            name: this.name,
            error: fallbackError.message
          });
        }
      }
      
      throw error;
    }
  }

  // Handle successful call
  onSuccess(callId, duration) {
    this.stats.successCalls++;
    this.stats.lastSuccessTime = Date.now();
    
    // Add to call history
    this.addToHistory('success', duration);
    
    logger.debug('Circuit breaker call succeeded', {
      name: this.name,
      callId,
      duration: `${duration}ms`,
      state: this.state
    });
    
    // In half-open state, check if we should close the circuit
    if (this.state === STATES.HALF_OPEN) {
      if (this.halfOpenCallCount >= this.config.halfOpenMaxCalls) {
        // All half-open calls succeeded, close the circuit
        this.transitionTo(STATES.CLOSED);
        this.halfOpenCallCount = 0;
      }
    }
    
    this.emit('success', { callId, duration, state: this.state });
  }

  // Handle failed call
  onFailure(callId, error, duration) {
    this.stats.failureCalls++;
    this.stats.lastFailureTime = Date.now();
    
    // Check if it's a timeout
    if (error.message.includes('timeout')) {
      this.stats.timeoutCalls++;
    }
    
    // Add to call history
    this.addToHistory('failure', duration, error.message);
    
    logger.warn('Circuit breaker call failed', {
      name: this.name,
      callId,
      duration: `${duration}ms`,
      error: error.message,
      state: this.state
    });
    
    // Check if we should open the circuit
    this.checkForStateTransition();
    
    this.emit('failure', { callId, error: error.message, duration, state: this.state });
  }

  // Add call result to history
  addToHistory(result, duration, error = null) {
    const historyEntry = {
      timestamp: Date.now(),
      result,
      duration,
      error
    };
    
    this.callHistory.unshift(historyEntry);
    
    // Trim history if too large
    if (this.callHistory.length > this.maxHistorySize) {
      this.callHistory = this.callHistory.slice(0, this.maxHistorySize);
    }
  }

  // Check if circuit should transition states
  checkForStateTransition() {
    if (this.state === STATES.CLOSED || this.state === STATES.HALF_OPEN) {
      const recentCalls = this.getRecentCalls();
      
      // Need minimum volume to consider opening
      if (recentCalls.length < this.config.volumeThreshold) {
        return;
      }
      
      const failures = recentCalls.filter(call => call.result === 'failure').length;
      const errorRate = (failures / recentCalls.length) * 100;
      
      // Open circuit if error rate exceeds threshold
      if (errorRate >= this.config.errorThresholdPercentage) {
        this.transitionTo(STATES.OPEN);
      }
    }
  }

  // Get recent calls within monitoring period
  getRecentCalls() {
    const cutoffTime = Date.now() - this.config.monitoringPeriod;
    return this.callHistory.filter(call => call.timestamp >= cutoffTime);
  }

  // Transition to new state
  transitionTo(newState) {
    const previousState = this.state;
    this.state = newState;
    
    // Record state transition
    const transition = {
      from: previousState,
      to: newState,
      timestamp: Date.now(),
      reason: this.getTransitionReason(previousState, newState)
    };
    
    this.stats.stateTransitions.push(transition);
    
    logger.info('Circuit breaker state transition', {
      name: this.name,
      from: previousState,
      to: newState,
      reason: transition.reason
    });
    
    // Handle state-specific logic
    switch (newState) {
      case STATES.OPEN:
        this.nextAttempt = Date.now() + this.config.recoveryTimeout;
        this.scheduleRecoveryAttempt();
        recordSecurityEvent('circuit_breaker_opened', {
          circuitBreaker: this.name,
          errorRate: this.getErrorRate()
        });
        break;
        
      case STATES.HALF_OPEN:
        this.halfOpenCallCount = 0;
        break;
        
      case STATES.CLOSED:
        this.nextAttempt = 0;
        this.halfOpenCallCount = 0;
        if (this.recoveryTimer) {
          clearTimeout(this.recoveryTimer);
          this.recoveryTimer = null;
        }
        break;
    }
    
    this.emit('stateChange', {
      name: this.name,
      from: previousState,
      to: newState,
      reason: transition.reason
    });
  }

  // Get reason for state transition
  getTransitionReason(from, to) {
    if (from === STATES.CLOSED && to === STATES.OPEN) {
      return `Error rate (${this.getErrorRate()}%) exceeded threshold (${this.config.errorThresholdPercentage}%)`;
    } else if (from === STATES.OPEN && to === STATES.HALF_OPEN) {
      return 'Recovery timeout reached';
    } else if (from === STATES.HALF_OPEN && to === STATES.CLOSED) {
      return 'Half-open test calls succeeded';
    } else if (from === STATES.HALF_OPEN && to === STATES.OPEN) {
      return 'Half-open test calls failed';
    }
    return 'Unknown';
  }

  // Schedule recovery attempt
  scheduleRecoveryAttempt() {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
    }
    
    this.recoveryTimer = setTimeout(() => {
      if (this.state === STATES.OPEN) {
        this.transitionTo(STATES.HALF_OPEN);
      }
    }, this.config.recoveryTimeout);
  }

  // Get current error rate
  getErrorRate() {
    const recentCalls = this.getRecentCalls();
    if (recentCalls.length === 0) return 0;
    
    const failures = recentCalls.filter(call => call.result === 'failure').length;
    return Math.round((failures / recentCalls.length) * 100);
  }

  // Get circuit breaker status
  getStatus() {
    const recentCalls = this.getRecentCalls();
    
    return {
      name: this.name,
      state: this.state,
      config: this.config,
      stats: {
        ...this.stats,
        errorRate: this.getErrorRate(),
        recentCallsCount: recentCalls.length,
        nextAttemptIn: this.state === STATES.OPEN ? 
          Math.max(0, this.nextAttempt - Date.now()) : 0
      },
      health: this.getHealthStatus()
    };
  }

  // Get health status
  getHealthStatus() {
    switch (this.state) {
      case STATES.CLOSED:
        return this.getErrorRate() < 10 ? 'healthy' : 'degraded';
      case STATES.HALF_OPEN:
        return 'degraded';
      case STATES.OPEN:
        return 'unhealthy';
      default:
        return 'unknown';
    }
  }

  // Reset circuit breaker
  reset() {
    this.state = STATES.CLOSED;
    this.stats = {
      totalCalls: 0,
      successCalls: 0,
      failureCalls: 0,
      timeoutCalls: 0,
      rejectedCalls: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      stateTransitions: []
    };
    this.callHistory = [];
    this.nextAttempt = 0;
    this.halfOpenCallCount = 0;
    
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }
    
    logger.info('Circuit breaker reset', { name: this.name });
  }

  // Cleanup
  cleanup() {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
    }
    
    logger.info('Circuit breaker cleaned up', { name: this.name });
  }
}

class CircuitBreakerManager {
  constructor() {
    this.circuitBreakers = new Map();
    this.defaultConfig = {
      failureThreshold: 5,
      recoveryTimeout: 60000,
      monitoringPeriod: 60000,
      halfOpenMaxCalls: 3,
      timeout: 30000,
      volumeThreshold: 10,
      errorThresholdPercentage: 50
    };
    
    logger.info('Circuit breaker manager initialized');
  }

  // Create or get circuit breaker
  getCircuitBreaker(name, config = {}) {
    if (!this.circuitBreakers.has(name)) {
      const circuitBreaker = new CircuitBreaker(name, {
        ...this.defaultConfig,
        ...config
      });
      
      // Listen to circuit breaker events
      circuitBreaker.on('stateChange', (event) => {
        logger.info('Circuit breaker state changed', event);
      });
      
      this.circuitBreakers.set(name, circuitBreaker);
    }
    
    return this.circuitBreakers.get(name);
  }

  // Execute function with circuit breaker
  async execute(name, fn, options = {}) {
    const circuitBreaker = this.getCircuitBreaker(name, options.config);
    return circuitBreaker.execute(fn, options.fallback);
  }

  // Get all circuit breakers status
  getAllStatus() {
    const status = {};
    
    for (const [name, circuitBreaker] of this.circuitBreakers) {
      status[name] = circuitBreaker.getStatus();
    }
    
    return status;
  }

  // Get summary statistics
  getSummary() {
    const summary = {
      total: this.circuitBreakers.size,
      byState: { closed: 0, open: 0, 'half-open': 0 },
      byHealth: { healthy: 0, degraded: 0, unhealthy: 0 }
    };
    
    for (const circuitBreaker of this.circuitBreakers.values()) {
      const status = circuitBreaker.getStatus();
      summary.byState[status.state]++;
      summary.byHealth[status.health]++;
    }
    
    return summary;
  }

  // Reset circuit breaker
  reset(name) {
    const circuitBreaker = this.circuitBreakers.get(name);
    if (circuitBreaker) {
      circuitBreaker.reset();
      return true;
    }
    return false;
  }

  // Reset all circuit breakers
  resetAll() {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.reset();
    }
    
    logger.info('All circuit breakers reset', { 
      count: this.circuitBreakers.size 
    });
  }

  // Remove circuit breaker
  remove(name) {
    const circuitBreaker = this.circuitBreakers.get(name);
    if (circuitBreaker) {
      circuitBreaker.cleanup();
      this.circuitBreakers.delete(name);
      logger.info('Circuit breaker removed', { name });
      return true;
    }
    return false;
  }

  // Cleanup all circuit breakers
  cleanup() {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.cleanup();
    }
    
    this.circuitBreakers.clear();
    logger.info('All circuit breakers cleaned up');
  }
}

// Dependency monitor for external services
class DependencyMonitor {
  constructor() {
    this.dependencies = new Map();
    this.monitoringInterval = null;
    this.monitoringPeriod = 30000; // 30 seconds
    
    this.startMonitoring();
    
    logger.info('Dependency monitor initialized');
  }

  // Register a dependency
  registerDependency(name, config) {
    const dependency = {
      name,
      url: config.url,
      timeout: config.timeout || 10000,
      critical: config.critical !== false,
      healthCheck: config.healthCheck || this.defaultHealthCheck(config.url),
      circuitBreaker: config.circuitBreaker !== false,
      lastCheck: null,
      status: 'unknown',
      responseTime: null,
      errorMessage: null,
      checkCount: 0,
      successCount: 0,
      failureCount: 0
    };
    
    this.dependencies.set(name, dependency);
    
    // Create circuit breaker if enabled
    if (dependency.circuitBreaker) {
      const circuitBreakerManager = require('./circuitBreaker').circuitBreakerManager;
      circuitBreakerManager.getCircuitBreaker(`dependency_${name}`, {
        timeout: dependency.timeout
      });
    }
    
    logger.info('Dependency registered', {
      name,
      url: config.url,
      critical: dependency.critical
    });
  }

  // Default health check implementation
  defaultHealthCheck(url) {
    return async () => {
      const fetch = require('node-fetch');
      const response = await fetch(url, {
        method: 'GET',
        timeout: 10000
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return { status: 'healthy', responseTime: 0 };
    };
  }

  // Check single dependency
  async checkDependency(name) {
    const dependency = this.dependencies.get(name);
    if (!dependency) return null;
    
    const startTime = Date.now();
    dependency.checkCount++;
    dependency.lastCheck = new Date().toISOString();
    
    try {
      const result = await Promise.race([
        dependency.healthCheck(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), dependency.timeout)
        )
      ]);
      
      const responseTime = Date.now() - startTime;
      dependency.status = 'healthy';
      dependency.responseTime = responseTime;
      dependency.errorMessage = null;
      dependency.successCount++;
      
      logger.debug('Dependency health check passed', {
        name,
        responseTime: `${responseTime}ms`
      });
      
      return {
        name,
        status: 'healthy',
        responseTime,
        lastCheck: dependency.lastCheck
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      dependency.status = 'unhealthy';
      dependency.responseTime = responseTime;
      dependency.errorMessage = error.message;
      dependency.failureCount++;
      
      logger.warn('Dependency health check failed', {
        name,
        error: error.message,
        responseTime: `${responseTime}ms`
      });
      
      return {
        name,
        status: 'unhealthy',
        error: error.message,
        responseTime,
        lastCheck: dependency.lastCheck
      };
    }
  }

  // Check all dependencies
  async checkAllDependencies() {
    const results = [];
    
    for (const name of this.dependencies.keys()) {
      try {
        const result = await this.checkDependency(name);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        logger.error('Error checking dependency', {
          name,
          error: error.message
        });
      }
    }
    
    return results;
  }

  // Get dependency status
  getDependencyStatus(name) {
    const dependency = this.dependencies.get(name);
    if (!dependency) return null;
    
    return {
      name: dependency.name,
      url: dependency.url,
      status: dependency.status,
      critical: dependency.critical,
      lastCheck: dependency.lastCheck,
      responseTime: dependency.responseTime,
      errorMessage: dependency.errorMessage,
      stats: {
        checkCount: dependency.checkCount,
        successCount: dependency.successCount,
        failureCount: dependency.failureCount,
        successRate: dependency.checkCount > 0 ? 
          Math.round((dependency.successCount / dependency.checkCount) * 100) : 0
      }
    };
  }

  // Get all dependencies status
  getAllDependenciesStatus() {
    const status = {};
    
    for (const name of this.dependencies.keys()) {
      status[name] = this.getDependencyStatus(name);
    }
    
    return status;
  }

  // Get dependencies summary
  getDependenciesSummary() {
    const dependencies = Array.from(this.dependencies.values());
    
    return {
      total: dependencies.length,
      healthy: dependencies.filter(d => d.status === 'healthy').length,
      unhealthy: dependencies.filter(d => d.status === 'unhealthy').length,
      unknown: dependencies.filter(d => d.status === 'unknown').length,
      critical: dependencies.filter(d => d.critical).length,
      criticalUnhealthy: dependencies.filter(d => d.critical && d.status === 'unhealthy').length
    };
  }

  // Start monitoring
  startMonitoring() {
    if (this.monitoringInterval) return;
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkAllDependencies();
      } catch (error) {
        logger.error('Dependency monitoring error', {
          error: error.message
        });
      }
    }, this.monitoringPeriod);
    
    logger.info('Dependency monitoring started', {
      intervalMs: this.monitoringPeriod
    });
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Dependency monitoring stopped');
    }
  }

  // Cleanup
  cleanup() {
    this.stopMonitoring();
    this.dependencies.clear();
    logger.info('Dependency monitor cleaned up');
  }
}

// Create singleton instances
const circuitBreakerManager = new CircuitBreakerManager();
const dependencyMonitor = new DependencyMonitor();

// Export the circuit breaker and dependency monitoring
module.exports = {
  CircuitBreaker,
  circuitBreakerManager,
  dependencyMonitor,
  
  // Convenience methods
  execute: (name, fn, options) => circuitBreakerManager.execute(name, fn, options),
  getCircuitBreaker: (name, config) => circuitBreakerManager.getCircuitBreaker(name, config),
  getAllCircuitBreakerStatus: () => circuitBreakerManager.getAllStatus(),
  getCircuitBreakerSummary: () => circuitBreakerManager.getSummary(),
  
  // Dependency monitoring
  registerDependency: (name, config) => dependencyMonitor.registerDependency(name, config),
  checkDependency: (name) => dependencyMonitor.checkDependency(name),
  getDependencyStatus: (name) => dependencyMonitor.getDependencyStatus(name),
  getAllDependenciesStatus: () => dependencyMonitor.getAllDependenciesStatus(),
  getDependenciesSummary: () => dependencyMonitor.getDependenciesSummary(),
  
  // Management
  cleanup: () => {
    circuitBreakerManager.cleanup();
    dependencyMonitor.cleanup();
  }
};