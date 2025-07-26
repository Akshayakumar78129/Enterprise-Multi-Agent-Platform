const { EventEmitter } = require('events');
const logger = require('../../utils/logger');

/**
 * Abstract base class for all data connectors
 * Provides common interface and functionality for enterprise data sources
 */
class BaseConnector extends EventEmitter {
  constructor(config) {
    super();
    
    if (this.constructor === BaseConnector) {
      throw new Error('BaseConnector is abstract and cannot be instantiated directly');
    }
    
    this.config = config || {};
    this.id = this.config.id || this.generateId();
    this.name = this.config.name || 'Unnamed Connector';
    this.type = this.config.type || 'unknown';
    this.connected = false;
    this.connectionPool = null;
    this.lastHealthCheck = null;
    this.connectionAttempts = 0;
    this.maxRetries = this.config.maxRetries || 3;
    this.retryDelay = this.config.retryDelay || 1000;
    
    // Bind methods to maintain context
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.query = this.query.bind(this);
    this.healthCheck = this.healthCheck.bind(this);
    
    logger.info(`Connector ${this.name} (${this.id}) initialized`);
  }
  
  /**
   * Generate unique ID for connector instance
   */
  generateId() {
    return `${this.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Abstract method: Establish connection to data source
   * Must be implemented by concrete connector classes
   */
  async connect() {
    throw new Error('connect() method must be implemented by concrete connector class');
  }
  
  /**
   * Abstract method: Execute query against data source
   * Must be implemented by concrete connector classes
   * @param {Object} queryConfig - Query configuration object
   */
  async query(queryConfig) {
    throw new Error('query() method must be implemented by concrete connector class');
  }
  
  /**
   * Abstract method: Close connection to data source
   * Must be implemented by concrete connector classes
   */
  async disconnect() {
    throw new Error('disconnect() method must be implemented by concrete connector class');
  }
  
  /**
   * Abstract method: Check health/status of connection
   * Must be implemented by concrete connector classes
   */
  async healthCheck() {
    throw new Error('healthCheck() method must be implemented by concrete connector class');
  }
  
  /**
   * Abstract method: Get schema information for data source
   * Must be implemented by concrete connector classes
   */
  getSchema() {
    throw new Error('getSchema() method must be implemented by concrete connector class');
  }
  
  /**
   * Connect with retry logic
   */
  async connectWithRetry() {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.connectionAttempts = attempt;
        await this.connect();
        this.connected = true;
        this.emit('connected', { id: this.id, attempt });
        logger.info(`Connector ${this.name} connected successfully on attempt ${attempt}`);
        return;
      } catch (error) {
        logger.error(`Connector ${this.name} connection attempt ${attempt} failed:`, error);
        
        if (attempt === this.maxRetries) {
          this.emit('connection-failed', { id: this.id, error, attempts: attempt });
          throw new Error(`Failed to connect after ${this.maxRetries} attempts: ${error.message}`);
        }
        
        // Wait before retry
        await this.sleep(this.retryDelay * attempt);
      }
    }
  }
  
  /**
   * Safe query execution with error handling
   */
  async safeQuery(queryConfig) {
    if (!this.connected) {
      throw new Error(`Connector ${this.name} is not connected`);
    }
    
    try {
      const startTime = Date.now();
      const result = await this.query(queryConfig);
      const executionTime = Date.now() - startTime;
      
      this.emit('query-executed', {
        id: this.id,
        queryConfig,
        executionTime,
        resultCount: Array.isArray(result) ? result.length : 1
      });
      
      logger.debug(`Query executed on ${this.name} in ${executionTime}ms`);
      return result;
    } catch (error) {
      this.emit('query-failed', { id: this.id, queryConfig, error });
      logger.error(`Query failed on ${this.name}:`, error);
      throw error;
    }
  }
  
  /**
   * Safe disconnect with cleanup
   */
  async safeDisconnect() {
    try {
      if (this.connected) {
        await this.disconnect();
        this.connected = false;
        this.emit('disconnected', { id: this.id });
        logger.info(`Connector ${this.name} disconnected successfully`);
      }
    } catch (error) {
      logger.error(`Error disconnecting ${this.name}:`, error);
      throw error;
    }
  }
  
  /**
   * Validate query configuration
   */
  validateQueryConfig(queryConfig) {
    if (!queryConfig) {
      throw new Error('Query configuration is required');
    }
    
    // Basic validation - can be overridden by concrete classes
    if (typeof queryConfig !== 'object') {
      throw new Error('Query configuration must be an object');
    }
    
    return true;
  }
  
  /**
   * Get connector information
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      connected: this.connected,
      connectionAttempts: this.connectionAttempts,
      lastHealthCheck: this.lastHealthCheck,
      config: {
        maxRetries: this.maxRetries,
        retryDelay: this.retryDelay,
        ...this.getPublicConfig()
      }
    };
  }
  
  /**
   * Get public configuration (without sensitive data)
   * Override in concrete classes to expose specific config
   */
  getPublicConfig() {
    return {};
  }
  
  /**
   * Utility method for async sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Set configuration after initialization
   */
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.emit('config-updated', { id: this.id, config: this.config });
  }
  
  /**
   * Handle cleanup on destruction
   */
  async destroy() {
    try {
      await this.safeDisconnect();
      this.removeAllListeners();
      logger.info(`Connector ${this.name} destroyed`);
    } catch (error) {
      logger.error(`Error destroying connector ${this.name}:`, error);
    }
  }
}

module.exports = BaseConnector;