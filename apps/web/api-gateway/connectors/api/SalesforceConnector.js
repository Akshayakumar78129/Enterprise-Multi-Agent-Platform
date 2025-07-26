const BaseConnector = require('../base/BaseConnector');
const logger = require('../../utils/logger');

/**
 * Salesforce CRM Connector
 * Provides enterprise integration with Salesforce REST API
 */
class SalesforceConnector extends BaseConnector {
  constructor(config) {
    super('salesforce', config);
    
    // Salesforce specific configuration
    this.baseUrl = config.baseUrl || process.env.SALESFORCE_BASE_URL || 'https://api.salesforce.com';
    this.clientId = config.clientId || process.env.SALESFORCE_CLIENT_ID;
    this.clientSecret = config.clientSecret || process.env.SALESFORCE_CLIENT_SECRET;
    this.username = config.username || process.env.SALESFORCE_USERNAME;
    this.password = config.password || process.env.SALESFORCE_PASSWORD;
    this.securityToken = config.securityToken || process.env.SALESFORCE_SECURITY_TOKEN;
    this.apiVersion = config.apiVersion || '58.0';
    
    // Authentication state
    this.accessToken = null;
    this.instanceUrl = null;
    this.tokenExpiry = null;
    
    // Circuit breaker for external API calls
    this.circuitBreaker = {
      failures: 0,
      lastFailure: null,
      state: 'closed', // closed, open, half-open
      threshold: 5,
      timeout: 60000 // 1 minute
    };
  }

  /**
   * Connect to Salesforce API
   */
  async connect() {
    try {
      logger.info(`Connecting to Salesforce API: ${this.baseUrl}`);
      
      if (!this.clientId || !this.clientSecret) {
        throw new Error('Salesforce credentials not configured');
      }

      // Authenticate using OAuth 2.0 Client Credentials flow
      await this.authenticate();
      
      this.connected = true;
      this.lastHealthCheck = Date.now();
      
      logger.info('✅ Salesforce connector connected successfully');
      this.emit('connected');
      
    } catch (error) {
      this.connected = false;
      logger.error(`❌ Salesforce connection failed: ${error.message}`);
      this.emit('connectionError', error);
      throw error;
    }
  }

  /**
   * Authenticate with Salesforce OAuth 2.0
   */
  async authenticate() {
    try {
      const authUrl = `${this.baseUrl}/services/oauth2/token`;
      const authData = new URLSearchParams({
        grant_type: 'password',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        username: this.username,
        password: this.password + (this.securityToken || '')
      });

      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: authData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Authentication failed: ${errorData.error_description || response.statusText}`);
      }

      const authResult = await response.json();
      
      this.accessToken = authResult.access_token;
      this.instanceUrl = authResult.instance_url;
      this.tokenExpiry = Date.now() + (authResult.expires_in || 3600) * 1000;
      
      logger.info('🔐 Salesforce authentication successful');
      
    } catch (error) {
      logger.error(`🔐 Salesforce authentication failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if token is valid and refresh if needed
   */
  async ensureAuthenticated() {
    if (!this.accessToken || Date.now() >= this.tokenExpiry - 60000) { // Refresh 1 minute before expiry
      await this.authenticate();
    }
  }

  /**
   * Execute SOQL query
   */
  async query(soqlQuery) {
    await this.ensureAuthenticated();
    
    try {
      const queryUrl = `${this.instanceUrl}/services/data/v${this.apiVersion}/query`;
      const response = await this.makeApiCall(queryUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json'
        },
        params: { q: soqlQuery }
      });

      return {
        rows: response.records || [],
        totalSize: response.totalSize || 0,
        done: response.done || true,
        nextRecordsUrl: response.nextRecordsUrl || null
      };
      
    } catch (error) {
      logger.error(`Salesforce query failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Safe query execution with error handling
   */
  async safeQuery(queryConfig) {
    const startTime = Date.now();
    
    try {
      let soqlQuery;
      
      if (typeof queryConfig === 'string') {
        soqlQuery = queryConfig;
      } else if (queryConfig.soql) {
        soqlQuery = queryConfig.soql;
      } else {
        // Build SOQL from query config
        soqlQuery = this.buildSOQL(queryConfig);
      }
      
      logger.debug(`Executing Salesforce SOQL: ${soqlQuery}`);
      
      const result = await this.query(soqlQuery);
      const executionTime = Date.now() - startTime;
      
      // Transform Salesforce response to standard format
      const standardResult = {
        rows: result.rows,
        rowCount: result.rows.length,
        totalRows: result.totalSize,
        executionTime: executionTime,
        fromCache: false,
        connector: this.id,
        metadata: {
          done: result.done,
          nextRecordsUrl: result.nextRecordsUrl
        }
      };
      
      logger.debug(`Salesforce query completed: ${result.rows.length} rows in ${executionTime}ms`);
      
      return standardResult;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`Salesforce query failed after ${executionTime}ms: ${error.message}`);
      
      // Update circuit breaker
      this.updateCircuitBreaker(false);
      
      throw new Error(`Salesforce query failed: ${error.message}`);
    }
  }

  /**
   * Build SOQL query from config object
   */
  buildSOQL(config) {
    let soql = 'SELECT ';
    
    // Fields
    if (config.fields && config.fields.length > 0) {
      soql += config.fields.join(', ');
    } else {
      soql += '*'; // Not recommended for Salesforce, but fallback
    }
    
    // FROM clause
    soql += ` FROM ${config.table || config.object}`;
    
    // WHERE clause
    if (config.where) {
      const whereConditions = [];
      for (const [field, value] of Object.entries(config.where)) {
        if (typeof value === 'object' && value.operator) {
          whereConditions.push(`${field} ${value.operator} '${value.value}'`);
        } else {
          whereConditions.push(`${field} = '${value}'`);
        }
      }
      if (whereConditions.length > 0) {
        soql += ' WHERE ' + whereConditions.join(' AND ');
      }
    }
    
    // ORDER BY clause
    if (config.orderBy && config.orderBy.length > 0) {
      soql += ' ORDER BY ' + config.orderBy.join(', ');
    }
    
    // LIMIT clause
    if (config.limit) {
      soql += ` LIMIT ${config.limit}`;
    }
    
    // OFFSET clause
    if (config.offset) {
      soql += ` OFFSET ${config.offset}`;
    }
    
    return soql;
  }

  /**
   * Create record in Salesforce
   */
  async create(sobject, data) {
    await this.ensureAuthenticated();
    
    try {
      const createUrl = `${this.instanceUrl}/services/data/v${this.apiVersion}/sobjects/${sobject}`;
      const response = await this.makeApiCall(createUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      return response;
      
    } catch (error) {
      logger.error(`Salesforce create failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update record in Salesforce
   */
  async update(sobject, id, data) {
    await this.ensureAuthenticated();
    
    try {
      const updateUrl = `${this.instanceUrl}/services/data/v${this.apiVersion}/sobjects/${sobject}/${id}`;
      await this.makeApiCall(updateUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      return { success: true, id: id };
      
    } catch (error) {
      logger.error(`Salesforce update failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete record from Salesforce
   */
  async delete(sobject, id) {
    await this.ensureAuthenticated();
    
    try {
      const deleteUrl = `${this.instanceUrl}/services/data/v${this.apiVersion}/sobjects/${sobject}/${id}`;
      await this.makeApiCall(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return { success: true, id: id };
      
    } catch (error) {
      logger.error(`Salesforce delete failed: ${error.message}`);
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
        throw new Error('Circuit breaker is open - Salesforce API unavailable');
      }
      this.circuitBreaker.state = 'half-open';
    }

    try {
      // Add query parameters if provided
      if (options.params) {
        const urlObj = new URL(url);
        Object.entries(options.params).forEach(([key, value]) => {
          urlObj.searchParams.append(key, value);
        });
        url = urlObj.toString();
      }

      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body,
        timeout: this.config.timeout || 30000
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Salesforce API error: ${response.status} - ${errorData.message || response.statusText}`);
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
        logger.warn('⚠️ Salesforce circuit breaker opened due to repeated failures');
      }
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      await this.ensureAuthenticated();
      
      // Simple query to test connection
      await this.query('SELECT Id FROM User LIMIT 1');
      
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
      instanceUrl: this.instanceUrl,
      apiVersion: this.apiVersion,
      tokenExpiry: this.tokenExpiry,
      circuitBreakerState: this.circuitBreaker.state,
      circuitBreakerFailures: this.circuitBreaker.failures
    };
  }

  /**
   * Disconnect from Salesforce
   */
  async disconnect() {
    try {
      // Revoke access token if available
      if (this.accessToken && this.baseUrl) {
        try {
          await fetch(`${this.baseUrl}/services/oauth2/revoke`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `token=${this.accessToken}`
          });
        } catch (error) {
          logger.warn(`Failed to revoke Salesforce token: ${error.message}`);
        }
      }
      
      this.accessToken = null;
      this.instanceUrl = null;
      this.tokenExpiry = null;
      this.connected = false;
      
      logger.info('🔌 Salesforce connector disconnected');
      this.emit('disconnected');
      
    } catch (error) {
      logger.error(`Error disconnecting from Salesforce: ${error.message}`);
      throw error;
    }
  }
}

module.exports = SalesforceConnector;