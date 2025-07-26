/**
 * Request Tracing and Monitoring System
 * Phase 9: Monitoring & Observability
 * 
 * Provides distributed request tracing, performance monitoring, and correlation
 * tracking across the entire API Gateway infrastructure.
 */

const { v4: uuidv4 } = require('uuid');
const { logger, performanceMonitor } = require('./logger');
const { recordRequest, recordDatabaseQuery } = require('./metrics');

class TracingSystem {
  constructor() {
    this.activeTraces = new Map();
    this.traceHistory = [];
    this.maxHistorySize = 10000;
    this.maxTraceAge = 24 * 60 * 60 * 1000; // 24 hours
    
    // Trace configuration
    this.config = {
      samplingRate: parseFloat(process.env.TRACE_SAMPLING_RATE) || 1.0, // 100% by default
      enableDatabaseTracing: process.env.ENABLE_DB_TRACING !== 'false',
      enableExternalTracing: process.env.ENABLE_EXTERNAL_TRACING !== 'false',
      maxSpansPerTrace: 1000,
      traceTimeout: 5 * 60 * 1000 // 5 minutes
    };
    
    // Start trace cleanup
    this.startTraceCleanup();
    
    logger.info('Tracing system initialized', {
      samplingRate: this.config.samplingRate,
      enableDatabaseTracing: this.config.enableDatabaseTracing
    });
  }

  // Start a new trace
  startTrace(operationName, metadata = {}) {
    const traceId = uuidv4();
    const spanId = uuidv4();
    
    // Check sampling rate
    if (Math.random() > this.config.samplingRate) {
      return null; // Skip tracing for this request
    }
    
    const trace = {
      traceId,
      operationName,
      startTime: process.hrtime.bigint(),
      timestamp: new Date().toISOString(),
      status: 'active',
      spans: new Map(),
      metadata: {
        ...metadata,
        service: 'api-gateway',
        version: process.env.npm_package_version || '1.0.0'
      },
      rootSpan: {
        spanId,
        parentId: null,
        operationName,
        startTime: process.hrtime.bigint(),
        timestamp: new Date().toISOString(),
        tags: {},
        logs: [],
        status: 'active'
      }
    };
    
    // Add root span to spans map
    trace.spans.set(spanId, trace.rootSpan);
    
    // Store active trace
    this.activeTraces.set(traceId, trace);
    
    logger.debug('Trace started', {
      traceId,
      operationName,
      spanId
    });
    
    return {
      traceId,
      spanId,
      trace: this.createTraceContext(trace, spanId)
    };
  }

  // Create a trace context object
  createTraceContext(trace, currentSpanId) {
    return {
      traceId: trace.traceId,
      spanId: currentSpanId,
      
      // Start a child span
      startSpan: (operationName, metadata = {}) => {
        return this.startSpan(trace.traceId, currentSpanId, operationName, metadata);
      },
      
      // Finish the current span
      finishSpan: (spanId = null, metadata = {}) => {
        return this.finishSpan(trace.traceId, spanId || currentSpanId, metadata);
      },
      
      // Add tags to current span
      setTag: (key, value) => {
        return this.setSpanTag(trace.traceId, currentSpanId, key, value);
      },
      
      // Add log entry to current span
      logEvent: (message, data = {}) => {
        return this.logSpanEvent(trace.traceId, currentSpanId, message, data);
      },
      
      // Get trace information
      getTrace: () => this.getTrace(trace.traceId),
      
      // Finish the entire trace
      finish: (metadata = {}) => {
        return this.finishTrace(trace.traceId, metadata);
      }
    };
  }

  // Start a child span
  startSpan(traceId, parentSpanId, operationName, metadata = {}) {
    const trace = this.activeTraces.get(traceId);
    if (!trace) {
      logger.warn('Cannot start span - trace not found', { traceId, parentSpanId });
      return null;
    }
    
    const spanId = uuidv4();
    const span = {
      spanId,
      parentId: parentSpanId,
      operationName,
      startTime: process.hrtime.bigint(),
      timestamp: new Date().toISOString(),
      tags: { ...metadata },
      logs: [],
      status: 'active'
    };
    
    // Check span limit
    if (trace.spans.size >= this.config.maxSpansPerTrace) {
      logger.warn('Span limit reached for trace', { 
        traceId, 
        spanCount: trace.spans.size 
      });
      return null;
    }
    
    trace.spans.set(spanId, span);
    
    logger.debug('Span started', {
      traceId,
      spanId,
      parentId: parentSpanId,
      operationName
    });
    
    return {
      spanId,
      context: this.createTraceContext(trace, spanId)
    };
  }

  // Finish a span
  finishSpan(traceId, spanId, metadata = {}) {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return false;
    
    const span = trace.spans.get(spanId);
    if (!span || span.status !== 'active') return false;
    
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - span.startTime) / 1000000; // Convert to milliseconds
    
    span.endTime = endTime;
    span.duration = Math.round(duration);
    span.status = 'finished';
    span.finishedAt = new Date().toISOString();
    
    // Add metadata
    Object.assign(span.tags, metadata);
    
    logger.debug('Span finished', {
      traceId,
      spanId,
      operationName: span.operationName,
      duration: `${span.duration}ms`
    });
    
    return true;
  }

  // Set tag on span
  setSpanTag(traceId, spanId, key, value) {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return false;
    
    const span = trace.spans.get(spanId);
    if (!span) return false;
    
    span.tags[key] = value;
    return true;
  }

  // Log event on span
  logSpanEvent(traceId, spanId, message, data = {}) {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return false;
    
    const span = trace.spans.get(spanId);
    if (!span) return false;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      data
    };
    
    span.logs.push(logEntry);
    
    logger.debug('Span log added', {
      traceId,
      spanId,
      message
    });
    
    return true;
  }

  // Finish entire trace
  finishTrace(traceId, metadata = {}) {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return false;
    
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - trace.startTime) / 1000000;
    
    trace.endTime = endTime;
    trace.duration = Math.round(duration);
    trace.status = 'finished';
    trace.finishedAt = new Date().toISOString();
    
    // Add metadata
    Object.assign(trace.metadata, metadata);
    
    // Finish any remaining active spans
    for (const [spanId, span] of trace.spans) {
      if (span.status === 'active') {
        this.finishSpan(traceId, spanId, { autoFinished: true });
      }
    }
    
    // Move to history
    this.moveTraceToHistory(trace);
    
    // Remove from active traces
    this.activeTraces.delete(traceId);
    
    logger.info('Trace finished', {
      traceId,
      operationName: trace.operationName,
      duration: `${trace.duration}ms`,
      spanCount: trace.spans.size
    });
    
    return trace;
  }

  // Move trace to history
  moveTraceToHistory(trace) {
    // Convert spans Map to object for serialization
    const historyTrace = {
      ...trace,
      spans: Object.fromEntries(trace.spans)
    };
    
    this.traceHistory.unshift(historyTrace);
    
    // Trim history if too large
    if (this.traceHistory.length > this.maxHistorySize) {
      this.traceHistory = this.traceHistory.slice(0, this.maxHistorySize);
    }
  }

  // Get trace by ID
  getTrace(traceId) {
    // Check active traces first
    let trace = this.activeTraces.get(traceId);
    if (trace) {
      return {
        ...trace,
        spans: Object.fromEntries(trace.spans)
      };
    }
    
    // Check history
    trace = this.traceHistory.find(t => t.traceId === traceId);
    return trace || null;
  }

  // Get active traces
  getActiveTraces() {
    return Array.from(this.activeTraces.values()).map(trace => ({
      traceId: trace.traceId,
      operationName: trace.operationName,
      startTime: trace.timestamp,
      duration: trace.duration || Date.now() - new Date(trace.timestamp).getTime(),
      spanCount: trace.spans.size,
      status: trace.status
    }));
  }

  // Get trace history
  getTraceHistory(limit = 100, filter = {}) {
    let traces = this.traceHistory.slice(0, limit);
    
    // Apply filters
    if (filter.operationName) {
      traces = traces.filter(t => t.operationName.includes(filter.operationName));
    }
    
    if (filter.minDuration) {
      traces = traces.filter(t => t.duration >= filter.minDuration);
    }
    
    if (filter.maxDuration) {
      traces = traces.filter(t => t.duration <= filter.maxDuration);
    }
    
    if (filter.since) {
      const sinceTime = new Date(filter.since).getTime();
      traces = traces.filter(t => new Date(t.timestamp).getTime() >= sinceTime);
    }
    
    return traces.map(trace => ({
      traceId: trace.traceId,
      operationName: trace.operationName,
      timestamp: trace.timestamp,
      duration: trace.duration,
      spanCount: Object.keys(trace.spans).length,
      status: trace.status,
      metadata: trace.metadata
    }));
  }

  // Get trace statistics
  getTraceStats() {
    const stats = {
      active: this.activeTraces.size,
      total: this.traceHistory.length,
      samplingRate: this.config.samplingRate
    };
    
    // Calculate duration statistics
    const durations = this.traceHistory.map(t => t.duration).filter(d => d);
    if (durations.length > 0) {
      durations.sort((a, b) => a - b);
      stats.performance = {
        avgDuration: Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length),
        minDuration: durations[0],
        maxDuration: durations[durations.length - 1],
        p50: durations[Math.floor(durations.length * 0.5)],
        p90: durations[Math.floor(durations.length * 0.9)],
        p95: durations[Math.floor(durations.length * 0.95)],
        p99: durations[Math.floor(durations.length * 0.99)]
      };
    }
    
    // Operation name statistics
    const operationCounts = {};
    this.traceHistory.forEach(trace => {
      operationCounts[trace.operationName] = (operationCounts[trace.operationName] || 0) + 1;
    });
    stats.byOperation = operationCounts;
    
    return stats;
  }

  // Middleware for Express integration
  middleware() {
    return (req, res, next) => {
      // Generate correlation ID if not present
      if (!req.headers['x-correlation-id']) {
        req.headers['x-correlation-id'] = uuidv4();
      }
      
      const correlationId = req.headers['x-correlation-id'];
      req.correlationId = correlationId;
      
      // Start trace
      const traceResult = this.startTrace(`${req.method} ${req.path}`, {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        correlationId
      });
      
      if (traceResult) {
        req.trace = traceResult.trace;
        req.traceId = traceResult.traceId;
        req.spanId = traceResult.spanId;
        
        // Set response header
        res.set('X-Trace-Id', traceResult.traceId);
      }
      
      // Set correlation header
      res.set('X-Correlation-Id', correlationId);
      
      // Hook into response finish
      const originalEnd = res.end;
      const startTime = Date.now();
      
      res.end = function(...args) {
        const responseTime = Date.now() - startTime;
        
        // Record metrics
        recordRequest(req, res, responseTime);
        
        // Finish trace
        if (req.trace) {
          req.trace.setTag('http.status_code', res.statusCode);
          req.trace.setTag('http.response_time', responseTime);
          req.trace.setTag('http.response_size', res.get('content-length'));
          
          if (res.statusCode >= 400) {
            req.trace.setTag('error', true);
            req.trace.logEvent('HTTP Error', {
              statusCode: res.statusCode,
              statusText: res.statusMessage
            });
          }
          
          req.trace.finish({
            responseTime,
            statusCode: res.statusCode,
            success: res.statusCode < 400
          });
        }
        
        originalEnd.apply(this, args);
      };
      
      next();
    };
  }

  // Database query tracing decorator
  traceDatabaseQuery(connector, originalQuery) {
    return async function tracedQuery(...args) {
      const trace = this.currentTrace; // Would be set in request context
      if (!trace || !this.config.enableDatabaseTracing) {
        return originalQuery.apply(this, args);
      }
      
      const spanResult = trace.startSpan('database.query', {
        'db.type': 'sqlite',
        'db.connector': connector,
        'db.statement': args[0]?.substring(0, 200) // Truncate long queries
      });
      
      const startTime = Date.now();
      
      try {
        const result = await originalQuery.apply(this, args);
        const duration = Date.now() - startTime;
        
        if (spanResult) {
          spanResult.context.setTag('db.rows_affected', result.rowCount || result.length);
          spanResult.context.setTag('db.duration', duration);
          spanResult.context.finishSpan();
        }
        
        // Record database metrics
        recordDatabaseQuery(connector, duration, result.rowCount || result.length);
        
        return result;
        
      } catch (error) {
        if (spanResult) {
          spanResult.context.setTag('error', true);
          spanResult.context.logEvent('Database Error', {
            error: error.message,
            code: error.code
          });
          spanResult.context.finishSpan();
        }
        
        throw error;
      }
    };
  }

  // External HTTP request tracing
  traceExternalRequest(url, options = {}) {
    return {
      headers: {
        ...options.headers,
        'X-Trace-Id': options.traceId,
        'X-Correlation-Id': options.correlationId
      }
    };
  }

  // Start trace cleanup
  startTraceCleanup() {
    const cleanup = () => {
      const now = Date.now();
      let cleanedCount = 0;
      
      // Clean up old active traces
      for (const [traceId, trace] of this.activeTraces) {
        const traceAge = now - new Date(trace.timestamp).getTime();
        if (traceAge > this.config.traceTimeout) {
          this.finishTrace(traceId, { 
            timeout: true,
            reason: 'trace_timeout'
          });
          cleanedCount++;
        }
      }
      
      // Clean up old history
      const cutoffTime = now - this.maxTraceAge;
      const originalLength = this.traceHistory.length;
      this.traceHistory = this.traceHistory.filter(
        trace => new Date(trace.timestamp).getTime() > cutoffTime
      );
      
      const historyCleanedCount = originalLength - this.traceHistory.length;
      
      if (cleanedCount > 0 || historyCleanedCount > 0) {
        logger.info('Trace cleanup completed', {
          activeTracesTimedOut: cleanedCount,
          historyTracesRemoved: historyCleanedCount,
          activeTraces: this.activeTraces.size,
          historySize: this.traceHistory.length
        });
      }
    };
    
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(cleanup, 5 * 60 * 1000);
  }

  // Cleanup
  cleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Finish all active traces
    for (const traceId of this.activeTraces.keys()) {
      this.finishTrace(traceId, { reason: 'shutdown' });
    }
    
    logger.info('Tracing system cleaned up');
  }
}

// Create singleton instance
const tracingSystem = new TracingSystem();

// Export the tracing system and convenience methods
module.exports = {
  tracingSystem,
  
  // Convenience methods
  startTrace: (operationName, metadata) => tracingSystem.startTrace(operationName, metadata),
  getTrace: (traceId) => tracingSystem.getTrace(traceId),
  getActiveTraces: () => tracingSystem.getActiveTraces(),
  getTraceHistory: (limit, filter) => tracingSystem.getTraceHistory(limit, filter),
  getTraceStats: () => tracingSystem.getTraceStats(),
  
  // Middleware
  middleware: () => tracingSystem.middleware(),
  
  // Decorators
  traceDatabaseQuery: (connector, query) => tracingSystem.traceDatabaseQuery(connector, query),
  traceExternalRequest: (url, options) => tracingSystem.traceExternalRequest(url, options),
  
  // Management
  cleanup: () => tracingSystem.cleanup()
};