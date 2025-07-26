const BaseConnector = require('../base/BaseConnector');
const logger = require('../../utils/logger');

/**
 * SAP Enterprise Connector
 * Provides integration with SAP systems via OData API
 */
class SapConnector extends BaseConnector {
  constructor(config) {
    super('sap', config);
    
    // SAP specific configuration
    this.baseUrl = config.baseUrl || process.env.SAP_API_URL;
    this.username = config.username || process.env.SAP_USERNAME;
    this.password = config.password || process.env.SAP_PASSWORD;
    this.apiKey = config.apiKey || process.env.SAP_API_KEY;
    this.authType = config.authType || process.env.SAP_AUTH_TYPE || 'basic'; // basic, oauth, apikey
    this.odataVersion = config.odataVersion || '4.0';
    this.servicePath = config.servicePath || '/sap/opu/odata/sap/';
    
    // Authentication state
    this.accessToken = null;
    this.tokenExpiry = null;
    this.csrfToken = null;
    
    // Request configuration
    this.defaultHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };
    
    // Circuit breaker for external API calls
    this.circuitBreaker = {
      failures: 0,
      lastFailure: null,
      state: 'closed',
      threshold: 5,
      timeout: 60000
    };
  }

  /**
   * Connect to SAP system
   */
  async connect() {
    try {
      logger.info(`Connecting to SAP system: ${this.baseUrl}`);
      
      if (!this.baseUrl) {
        throw new Error('SAP base URL not configured');
      }

      // Authenticate based on auth type
      await this.authenticate();
      
      // Get CSRF token for write operations
      await this.getCsrfToken();
      
      this.connected = true;
      this.lastHealthCheck = Date.now();
      
      logger.info('✅ SAP connector connected successfully');
      this.emit('connected');
      
    } catch (error) {
      this.connected = false;
      logger.error(`❌ SAP connection failed: ${error.message}`);
      this.emit('connectionError', error);
      throw error;
    }
  }

  /**
   * Authenticate with SAP system
   */
  async authenticate() {
    try {
      switch (this.authType.toLowerCase()) {
        case 'basic':
          await this.basicAuthentication();
          break;
        case 'oauth':
          await this.oauthAuthentication();
          break;
        case 'apikey':
          await this.apiKeyAuthentication();
          break;
        default:
          throw new Error(`Unsupported SAP authentication type: ${this.authType}`);
      }
      
      logger.info('🔐 SAP authentication successful');
      
    } catch (error) {
      logger.error(`🔐 SAP authentication failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Basic authentication with username/password
   */
  async basicAuthentication() {
    if (!this.username || !this.password) {
      throw new Error('SAP username and password required for basic authentication');
    }
    
    // Test authentication with a simple service call
    const testUrl = `${this.baseUrl}${this.servicePath}`;
    const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        ...this.defaultHeaders,
        'Authorization': `Basic ${credentials}`
      }
    });

    if (!response.ok) {
      throw new Error(`Basic authentication failed: ${response.status} ${response.statusText}`);
    }

    this.defaultHeaders['Authorization'] = `Basic ${credentials}`;
  }

  /**
   * OAuth 2.0 authentication
   */
  async oauthAuthentication() {
    // Implementation would depend on specific SAP OAuth configuration
    throw new Error('OAuth authentication not yet implemented for SAP connector');
  }

  /**
   * API Key authentication
   */
  async apiKeyAuthentication() {
    if (!this.apiKey) {
      throw new Error('SAP API key required for API key authentication');
    }
    
    this.defaultHeaders['X-API-Key'] = this.apiKey;
  }

  /**
   * Get CSRF token for write operations
   */
  async getCsrfToken() {
    try {
      const csrfUrl = `${this.baseUrl}${this.servicePath}`;
      const response = await fetch(csrfUrl, {
        method: 'GET',
        headers: {
          ...this.defaultHeaders,
          'X-CSRF-Token': 'Fetch'
        }
      });

      if (response.ok) {
        this.csrfToken = response.headers.get('X-CSRF-Token');
        logger.debug('📋 SAP CSRF token obtained');
      }
      
    } catch (error) {
      logger.warn(`Failed to get SAP CSRF token: ${error.message}`);
    }
  }

  /**
   * Execute OData query
   */
  async query(entitySet, options = {}) {
    try {
      let queryUrl = `${this.baseUrl}${this.servicePath}${entitySet}`;
      const queryParams = new URLSearchParams();

      // Add OData query options
      if (options.$select) {
        queryParams.append('$select', options.$select);
      }
      if (options.$filter) {
        queryParams.append('$filter', options.$filter);
      }
      if (options.$orderby) {
        queryParams.append('$orderby', options.$orderby);
      }
      if (options.$top) {
        queryParams.append('$top', options.$top);
      }
      if (options.$skip) {
        queryParams.append('$skip', options.$skip);
      }
      if (options.$expand) {
        queryParams.append('$expand', options.$expand);
      }

      if (queryParams.toString()) {
        queryUrl += '?' + queryParams.toString();
      }

      const response = await this.makeApiCall(queryUrl, {
        method: 'GET',
        headers: this.defaultHeaders
      });

      return {
        value: response.value || response.d?.results || [response],
        count: response['@odata.count'] || response.d?.__count || null,
        nextLink: response['@odata.nextLink'] || response.d?.__next || null
      };
      
    } catch (error) {
      logger.error(`SAP OData query failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Safe query execution with error handling
   */
  async safeQuery(queryConfig) {
    const startTime = Date.now();
    
    try {
      let entitySet, options = {};
      
      if (typeof queryConfig === 'string') {
        entitySet = queryConfig;
      } else if (queryConfig.entitySet) {
        entitySet = queryConfig.entitySet;
        options = queryConfig.options || {};
      } else if (queryConfig.table) {
        entitySet = queryConfig.table;
        options = this.buildODataOptions(queryConfig);
      } else {
        throw new Error('Invalid query configuration for SAP connector');
      }
      
      logger.debug(`Executing SAP OData query: ${entitySet}`);
      
      const result = await this.query(entitySet, options);
      const executionTime = Date.now() - startTime;
      
      // Transform SAP response to standard format
      const standardResult = {
        rows: result.value,
        rowCount: result.value.length,
        totalRows: result.count || result.value.length,
        executionTime: executionTime,
        fromCache: false,
        connector: this.id,
        metadata: {
          nextLink: result.nextLink
        }
      };
      
      logger.debug(`SAP query completed: ${result.value.length} rows in ${executionTime}ms`);
      
      return standardResult;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`SAP query failed after ${executionTime}ms: ${error.message}`);
      
      this.updateCircuitBreaker(false);
      throw new Error(`SAP query failed: ${error.message}`);
    }
  }

  /**
   * Build OData options from query config
   */
  buildODataOptions(config) {
    const options = {};
    
    // Select fields
    if (config.fields && config.fields.length > 0) {
      options.$select = config.fields.join(',');
    }
    
    // Filter conditions
    if (config.where) {
      const filterConditions = [];
      for (const [field, value] of Object.entries(config.where)) {
        if (typeof value === 'object' && value.operator) {
          filterConditions.push(`${field} ${this.mapOperator(value.operator)} '${value.value}'`);
        } else {
          filterConditions.push(`${field} eq '${value}'`);
        }
      }
      if (filterConditions.length > 0) {
        options.$filter = filterConditions.join(' and ');
      }
    }
    
    // Order by
    if (config.orderBy && config.orderBy.length > 0) {
      options.$orderby = config.orderBy.join(',');
    }
    
    // Limit (top)
    if (config.limit) {
      options.$top = config.limit;
    }
    
    // Offset (skip)
    if (config.offset) {
      options.$skip = config.offset;
    }
    
    return options;
  }

  /**
   * Map SQL operators to OData operators
   */
  mapOperator(sqlOperator) {
    const operatorMap = {
      '=': 'eq',
      '!=': 'ne',
      '<>': 'ne',
      '>': 'gt',
      '>=': 'ge',
      '<': 'lt',
      '<=': 'le',
      'LIKE': 'contains'
    };
    
    return operatorMap[sqlOperator] || 'eq';
  }

  /**
   * Create entity in SAP
   */
  async create(entitySet, data) {
    try {
      const createUrl = `${this.baseUrl}${this.servicePath}${entitySet}`;
      const headers = { ...this.defaultHeaders };
      
      if (this.csrfToken) {
        headers['X-CSRF-Token'] = this.csrfToken;
      }

      const response = await this.makeApiCall(createUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      });

      return response;
      
    } catch (error) {
      logger.error(`SAP create operation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update entity in SAP
   */
  async update(entitySet, key, data) {
    try {
      const updateUrl = `${this.baseUrl}${this.servicePath}${entitySet}('${key}')`;
      const headers = { ...this.defaultHeaders };
      
      if (this.csrfToken) {
        headers['X-CSRF-Token'] = this.csrfToken;
      }

      await this.makeApiCall(updateUrl, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(data)
      });

      return { success: true, key: key };
      
    } catch (error) {
      logger.error(`SAP update operation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete entity from SAP
   */
  async delete(entitySet, key) {
    try {
      const deleteUrl = `${this.baseUrl}${this.servicePath}${entitySet}('${key}')`;
      const headers = { ...this.defaultHeaders };
      
      if (this.csrfToken) {
        headers['X-CSRF-Token'] = this.csrfToken;
      }

      await this.makeApiCall(deleteUrl, {
        method: 'DELETE',
        headers: headers
      });

      return { success: true, key: key };
      
    } catch (error) {
      logger.error(`SAP delete operation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Make API call with circuit breaker and retry logic
   */
  async makeApiCall(url, options = {}) {
    // Check circuit breaker
    if (this.circuitBreaker.state === 'open') {
      if (Date.now() - this.circuitBreaker.lastFailure < this.circuitBreaker.timeout) {
        throw new Error('Circuit breaker is open - SAP API unavailable');
      }
      this.circuitBreaker.state = 'half-open';
    }

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: options.headers || this.defaultHeaders,
        body: options.body,
        timeout: this.config.timeout || 30000
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`SAP API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      // Update circuit breaker on success
      this.updateCircuitBreaker(true);
      
      return data;
      
    } catch (error) {
      this.updateCircuitBreaker(false);
      throw error;
    }
  }

  /**
   * Update circuit breaker state
   */
  updateCircuitBreaker(success) {
    if (success) {
      this.circuitBreaker.failures = 0;
      this.circuitBreaker.state = 'closed';
    } else {
      this.circuitBreaker.failures++;
      this.circuitBreaker.lastFailure = Date.now();
      
      if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
        this.circuitBreaker.state = 'open';
        logger.warn('⚠️ SAP circuit breaker opened due to repeated failures');
      }
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      // Simple service document call to test connection
      const serviceUrl = `${this.baseUrl}${this.servicePath}`;
      await this.makeApiCall(serviceUrl, {
        method: 'GET',
        headers: this.defaultHeaders
      });
      
      this.lastHealthCheck = Date.now();
      return {
        status: 'healthy',
        latency: Date.now() - this.lastHealthCheck,
        circuitBreaker: this.circuitBreaker.state
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        circuitBreaker: this.circuitBreaker.state
      };
    }
  }

  /**
   * Get connector information
   */
  getInfo() {
    return {
      ...super.getInfo(),
      baseUrl: this.baseUrl,
      servicePath: this.servicePath,
      odataVersion: this.odataVersion,
      authType: this.authType,
      circuitBreakerState: this.circuitBreaker.state,
      circuitBreakerFailures: this.circuitBreaker.failures,
      hasCsrfToken: !!this.csrfToken
    };
  }

  /**
   * Disconnect from SAP system
   */
  async disconnect() {
    try {
      this.accessToken = null;
      this.tokenExpiry = null;
      this.csrfToken = null;
      this.connected = false;
      
      logger.info('🔌 SAP connector disconnected');
      this.emit('disconnected');
      
    } catch (error) {
      logger.error(`Error disconnecting from SAP: ${error.message}`);
      throw error;
    }
  }
}

module.exports = SapConnector;