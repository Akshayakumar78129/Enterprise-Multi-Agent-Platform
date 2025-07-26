/**
 * Connector Interface Definition
 * Defines the required methods and properties for all data connectors
 */

/**
 * Standard query configuration structure
 * @typedef {Object} QueryConfig
 * @property {string} table - Target table/collection name  
 * @property {Array<string>} fields - Fields to select
 * @property {Object} where - Where clause conditions
 * @property {Array<string>} orderBy - Order by clauses
 * @property {number} limit - Result limit
 * @property {number} offset - Result offset
 * @property {Object} aggregation - Aggregation operations
 * @property {Object} joins - Join operations
 */

/**
 * Standard response structure
 * @typedef {Object} StandardResponse
 * @property {boolean} success - Operation success status
 * @property {*} data - Response data
 * @property {Object} metadata - Response metadata
 * @property {string} metadata.timestamp - Response timestamp
 * @property {string} metadata.requestId - Unique request identifier
 * @property {string} metadata.source - Data source identifier
 * @property {boolean} metadata.cache - Whether response was cached
 * @property {Object} pagination - Pagination information (if applicable)
 * @property {Array} errors - Error information (if applicable)
 */

/**
 * Connector health status
 * @typedef {Object} HealthStatus
 * @property {string} status - Health status (healthy, degraded, unhealthy)
 * @property {string} message - Status message
 * @property {number} responseTime - Health check response time
 * @property {string} timestamp - Health check timestamp
 * @property {Object} details - Additional health details
 */

/**
 * Connector configuration
 * @typedef {Object} ConnectorConfig
 * @property {string} id - Unique connector identifier
 * @property {string} name - Human-readable connector name
 * @property {string} type - Connector type (database, api, file, stream)
 * @property {number} maxRetries - Maximum connection retry attempts
 * @property {number} retryDelay - Delay between retry attempts (ms)
 * @property {number} timeout - Query timeout (ms)
 * @property {Object} connection - Connection-specific configuration
 * @property {boolean} readOnly - Whether connector is read-only
 * @property {Object} cache - Cache configuration
 * @property {Object} security - Security configuration
 */

/**
 * Required connector interface methods
 */
const ConnectorInterface = {
  /**
   * Establish connection to data source
   * @returns {Promise<void>}
   * @throws {Error} Connection failure
   */
  connect: async function() {
    throw new Error('connect() method must be implemented');
  },
  
  /**
   * Execute query against data source
   * @param {QueryConfig} queryConfig - Query configuration
   * @returns {Promise<*>} Query result
   * @throws {Error} Query execution failure
   */
  query: async function(queryConfig) {
    throw new Error('query() method must be implemented');
  },
  
  /**
   * Close connection to data source
   * @returns {Promise<void>}
   * @throws {Error} Disconnection failure
   */
  disconnect: async function() {
    throw new Error('disconnect() method must be implemented');
  },
  
  /**
   * Check health/status of connection
   * @returns {Promise<HealthStatus>} Health status
   * @throws {Error} Health check failure
   */
  healthCheck: async function() {
    throw new Error('healthCheck() method must be implemented');
  },
  
  /**
   * Get schema information for data source
   * @returns {Object} Schema information
   * @throws {Error} Schema retrieval failure
   */
  getSchema: function() {
    throw new Error('getSchema() method must be implemented');
  }
};

/**
 * Optional connector interface methods
 */
const OptionalConnectorInterface = {
  /**
   * Test connection without establishing persistent connection
   * @returns {Promise<boolean>} Connection test result
   */
  testConnection: async function() {
    // Default implementation
    try {
      await this.connect();
      await this.disconnect();
      return true;
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Get connector capabilities
   * @returns {Object} Connector capabilities
   */
  getCapabilities: function() {
    return {
      supportsTransactions: false,
      supportsAggregation: false,
      supportsJoins: false,
      supportsStreaming: false,
      maxConnections: 1,
      supportedOperations: ['read']
    };
  },
  
  /**
   * Validate query configuration
   * @param {QueryConfig} queryConfig - Query to validate
   * @returns {boolean} Validation result
   * @throws {Error} Validation failure
   */
  validateQuery: function(queryConfig) {
    if (!queryConfig) {
      throw new Error('Query configuration is required');
    }
    return true;
  },
  
  /**
   * Transform query result to standard format
   * @param {*} rawResult - Raw query result
   * @param {QueryConfig} queryConfig - Original query configuration
   * @returns {StandardResponse} Transformed result
   */
  transformResult: function(rawResult, queryConfig) {
    return {
      success: true,
      data: rawResult,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: queryConfig.requestId || 'unknown',
        source: this.id || 'unknown',
        cache: false
      }
    };
  },
  
  /**
   * Clean up resources
   * @returns {Promise<void>}
   */
  cleanup: async function() {
    await this.disconnect();
  }
};

/**
 * Connector events that should be emitted
 */
const ConnectorEvents = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected', 
  CONNECTION_FAILED: 'connection-failed',
  QUERY_EXECUTED: 'query-executed',
  QUERY_FAILED: 'query-failed',
  HEALTH_CHECK: 'health-check',
  ERROR: 'error',
  CONFIG_UPDATED: 'config-updated'
};

/**
 * Connector states
 */
const ConnectorStates = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  RECONNECTING: 'reconnecting'
};

/**
 * Query operation types
 */
const QueryOperations = {
  SELECT: 'select',
  INSERT: 'insert',
  UPDATE: 'update',
  DELETE: 'delete',
  AGGREGATE: 'aggregate',
  BULK: 'bulk'
};

module.exports = {
  ConnectorInterface,
  OptionalConnectorInterface,
  ConnectorEvents,
  ConnectorStates,
  QueryOperations
};