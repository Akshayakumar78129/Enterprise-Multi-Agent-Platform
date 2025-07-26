const { EventEmitter } = require('events');
const logger = require('../utils/logger');

/**
 * Central registry for managing all data connectors
 * Provides lifecycle management, health monitoring, and connector discovery
 */
class ConnectorRegistry extends EventEmitter {
  constructor() {
    super();
    this.connectors = new Map();
    this.healthCheckInterval = null;
    this.healthCheckFrequency = process.env.HEALTH_CHECK_FREQUENCY || 30000; // 30 seconds
    this.initialized = false;
    
    logger.info('ConnectorRegistry initialized');
  }
  
  /**
   * Register a new connector
   * @param {string} id - Unique connector identifier
   * @param {BaseConnector} connector - Connector instance
   */
  register(id, connector) {
    if (this.connectors.has(id)) {
      throw new Error(`Connector with id '${id}' is already registered`);
    }
    
    // Validate connector implements required interface
    this.validateConnector(connector);
    
    this.connectors.set(id, connector);
    
    // Set up event listeners
    this.setupConnectorEventListeners(id, connector);
    
    logger.info(`Connector '${id}' registered successfully`);
    this.emit('connector-registered', { id, connector: connector.getInfo() });
  }
  
  /**
   * Unregister a connector
   * @param {string} id - Connector identifier
   */
  async unregister(id) {
    const connector = this.connectors.get(id);
    if (!connector) {
      throw new Error(`Connector with id '${id}' not found`);
    }
    
    try {
      // Disconnect if connected
      if (connector.connected) {
        await connector.safeDisconnect();
      }
      
      // Remove event listeners
      connector.removeAllListeners();
      
      // Remove from registry
      this.connectors.delete(id);
      
      logger.info(`Connector '${id}' unregistered successfully`);
      this.emit('connector-unregistered', { id });
    } catch (error) {
      logger.error(`Error unregistering connector '${id}':`, error);
      throw error;
    }
  }
  
  /**
   * Get connector by ID
   * @param {string} id - Connector identifier
   * @returns {BaseConnector} Connector instance
   */
  get(id) {
    const connector = this.connectors.get(id);
    if (!connector) {
      throw new Error(`Connector with id '${id}' not found`);
    }
    return connector;
  }
  
  /**
   * Check if connector exists
   * @param {string} id - Connector identifier
   * @returns {boolean} Whether connector exists
   */
  has(id) {
    return this.connectors.has(id);
  }
  
  /**
   * Get all registered connectors
   * @returns {Array} Array of connector info objects
   */
  getAll() {
    const connectorList = [];
    for (const [id, connector] of this.connectors) {
      connectorList.push({
        id,
        ...connector.getInfo()
      });
    }
    return connectorList;
  }
  
  /**
   * Get connectors by type
   * @param {string} type - Connector type
   * @returns {Array} Array of matching connectors
   */
  getByType(type) {
    const matchingConnectors = [];
    for (const [id, connector] of this.connectors) {
      if (connector.type === type) {
        matchingConnectors.push({
          id,
          ...connector.getInfo()
        });
      }
    }
    return matchingConnectors;
  }
  
  /**
   * Initialize all registered connectors
   */
  async initialize() {
    if (this.initialized) {
      logger.warn('ConnectorRegistry already initialized');
      return;
    }
    
    logger.info('Initializing all connectors...');
    
    const initPromises = [];
    for (const [id, connector] of this.connectors) {
      initPromises.push(this.initializeConnector(id, connector));
    }
    
    try {
      await Promise.allSettled(initPromises);
      this.initialized = true;
      this.startHealthCheckMonitoring();
      
      logger.info('All connectors initialization completed');
      this.emit('registry-initialized');
    } catch (error) {
      logger.error('Failed to initialize connectors:', error);
      throw error;
    }
  }
  
  /**
   * Initialize a single connector
   * @param {string} id - Connector identifier
   * @param {BaseConnector} connector - Connector instance
   */
  async initializeConnector(id, connector) {
    try {
      logger.info(`Initializing connector '${id}'...`);
      await connector.connectWithRetry();
      logger.info(`Connector '${id}' initialized successfully`);
    } catch (error) {
      logger.error(`Failed to initialize connector '${id}':`, error);
      this.emit('connector-init-failed', { id, error });
      // Don't throw - allow other connectors to initialize
    }
  }
  
  /**
   * Disconnect all connectors
   */
  async disconnectAll() {
    logger.info('Disconnecting all connectors...');
    
    const disconnectPromises = [];
    for (const [id, connector] of this.connectors) {
      disconnectPromises.push(this.disconnectConnector(id, connector));
    }
    
    await Promise.allSettled(disconnectPromises);
    this.stopHealthCheckMonitoring();
    
    logger.info('All connectors disconnected');
    this.emit('all-disconnected');
  }
  
  /**
   * Disconnect a single connector
   * @param {string} id - Connector identifier
   * @param {BaseConnector} connector - Connector instance
   */
  async disconnectConnector(id, connector) {
    try {
      await connector.safeDisconnect();
      logger.info(`Connector '${id}' disconnected`);
    } catch (error) {
      logger.error(`Error disconnecting connector '${id}':`, error);
    }
  }
  
  /**
   * Perform health check on all connectors
   * @returns {Object} Health status for all connectors
   */
  async healthCheck() {
    const healthStatuses = {};
    
    for (const [id, connector] of this.connectors) {
      try {
        const startTime = Date.now();
        const status = await connector.healthCheck();
        const responseTime = Date.now() - startTime;
        
        healthStatuses[id] = {
          ...status,
          responseTime,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        healthStatuses[id] = {
          status: 'unhealthy',
          message: error.message,
          responseTime: null,
          timestamp: new Date().toISOString(),
          error: error.code || 'HEALTH_CHECK_FAILED'
        };
      }
    }
    
    return healthStatuses;
  }
  
  /**
   * Start automated health check monitoring
   */
  startHealthCheckMonitoring() {
    if (this.healthCheckInterval) {
      return; // Already running
    }
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        const healthStatuses = await this.healthCheck();
        this.emit('health-check-completed', healthStatuses);
        
        // Check for unhealthy connectors
        const unhealthyConnectors = Object.entries(healthStatuses)
          .filter(([id, status]) => status.status === 'unhealthy')
          .map(([id]) => id);
        
        if (unhealthyConnectors.length > 0) {
          logger.warn(`Unhealthy connectors detected: ${unhealthyConnectors.join(', ')}`);
          this.emit('unhealthy-connectors', unhealthyConnectors);
        }
      } catch (error) {
        logger.error('Health check monitoring error:', error);
      }
    }, this.healthCheckFrequency);
    
    logger.info(`Health check monitoring started (frequency: ${this.healthCheckFrequency}ms)`);
  }
  
  /**
   * Stop automated health check monitoring
   */
  stopHealthCheckMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.info('Health check monitoring stopped');
    }
  }
  
  /**
   * Validate that connector implements required interface
   * @param {BaseConnector} connector - Connector to validate
   */
  validateConnector(connector) {
    const requiredMethods = ['connect', 'query', 'disconnect', 'healthCheck', 'getSchema'];
    
    for (const method of requiredMethods) {
      if (typeof connector[method] !== 'function') {
        throw new Error(`Connector must implement ${method}() method`);
      }
    }
    
    // Check for required properties
    if (!connector.id) {
      throw new Error('Connector must have an id property');
    }
    
    if (!connector.type) {
      throw new Error('Connector must have a type property');
    }
  }
  
  /**
   * Set up event listeners for a connector
   * @param {string} id - Connector identifier
   * @param {BaseConnector} connector - Connector instance
   */
  setupConnectorEventListeners(id, connector) {
    connector.on('connected', (data) => {
      logger.info(`Connector '${id}' connected`);
      this.emit('connector-connected', { id, ...data });
    });
    
    connector.on('disconnected', (data) => {
      logger.info(`Connector '${id}' disconnected`);
      this.emit('connector-disconnected', { id, ...data });
    });
    
    connector.on('connection-failed', (data) => {
      logger.error(`Connector '${id}' connection failed`);
      this.emit('connector-connection-failed', { id, ...data });
    });
    
    connector.on('query-executed', (data) => {
      logger.debug(`Query executed on connector '${id}'`);
      this.emit('connector-query-executed', { id, ...data });
    });
    
    connector.on('query-failed', (data) => {
      logger.error(`Query failed on connector '${id}'`);
      this.emit('connector-query-failed', { id, ...data });
    });
    
    connector.on('error', (error) => {
      logger.error(`Connector '${id}' error:`, error);
      this.emit('connector-error', { id, error });
    });
  }
  
  /**
   * Get registry statistics
   * @returns {Object} Registry statistics
   */
  getStats() {
    const connectedCount = Array.from(this.connectors.values())
      .filter(connector => connector.connected).length;
    
    const typeStats = {};
    for (const connector of this.connectors.values()) {
      typeStats[connector.type] = (typeStats[connector.type] || 0) + 1;
    }
    
    return {
      totalConnectors: this.connectors.size,
      connectedConnectors: connectedCount,
      disconnectedConnectors: this.connectors.size - connectedCount,
      typeStats,
      initialized: this.initialized,
      healthCheckMonitoring: !!this.healthCheckInterval
    };
  }
}

// Create singleton instance
const registry = new ConnectorRegistry();

module.exports = {
  ConnectorRegistry: registry,
  ConnectorRegistryClass: ConnectorRegistry
};