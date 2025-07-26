const axios = require('axios');
const BaseConnector = require('../base/BaseConnector');
const logger = require('../../utils/logger');

/**
 * Generic REST API Connector
 * Provides standardized access to REST APIs with authentication, retry logic, and caching
 */
class RestApiConnector extends BaseConnector {
  constructor(config) {
    super({
      ...config,
      type: 'rest-api',
      name: config.name || 'REST API Service'
    });
    
    this.baseURL = config.baseURL || config.url;
    this.timeout = config.timeout || 30000; // 30 seconds
    this.headers = config.headers || {};
    this.authConfig = config.auth || {};
    this.rateLimitConfig = config.rateLimit || {};
    this.circuitBreakerConfig = config.circuitBreaker || {};
    this.transformConfig = config.transform || {};
    
    // Circuit breaker state
    this.circuitBreakerState = {
      failures: 0,
      nextAttempt: Date.now(),
      state: 'CLOSED' // CLOSED, OPEN, HALF_OPEN
    };
    
    // Rate limiting state
    this.rateLimitState = {
      requests: [],
      lastReset: Date.now()
    };
    
    this.axiosInstance = null;
    this.authToken = null;
    this.authExpiry = null;
    
    if (!this.baseURL) {
      throw new Error('Base URL is required for REST API connector');
    }
    
    logger.info(`RestApiConnector initialized for: ${this.baseURL}`);
  }
  
  /**
   * Initialize and configure axios instance
   */
  async connect() {
    try {
      this.axiosInstance = axios.create({
        baseURL: this.baseURL,
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'API-Gateway/1.0.0',
          ...this.headers
        }
      });
      
      // Set up request interceptors
      this.setupRequestInterceptors();
      
      // Set up response interceptors
      this.setupResponseInterceptors();
      
      // Authenticate if configuration provided
      if (this.authConfig.type) {
        await this.authenticate();
      }
      
      // Test connection
      await this.testConnection();
      
      logger.info(`Connected to REST API: ${this.baseURL}`);
      
    } catch (error) {
      logger.error(`Failed to connect to REST API: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Set up request interceptors for authentication and rate limiting
   */
  setupRequestInterceptors() {
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Check circuit breaker
        if (!this.checkCircuitBreaker()) {
          throw new Error('Circuit breaker is OPEN - service unavailable');
        }
        
        // Apply rate limiting
        await this.applyRateLimit();
        
        // Add authentication
        await this.addAuthentication(config);
        
        // Apply request transformations
        config = this.applyRequestTransform(config);
        
        logger.debug(`REST API request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('REST API request interceptor error:', error);
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Set up response interceptors for error handling and circuit breaker
   */
  setupResponseInterceptors() {
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Reset circuit breaker on success
        this.resetCircuitBreaker();
        
        // Apply response transformations
        response = this.applyResponseTransform(response);
        
        logger.debug(`REST API response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        const config = error.config;
        
        // Handle circuit breaker
        this.handleCircuitBreakerError();
        
        // Handle authentication errors
        if (error.response?.status === 401 && this.authConfig.type) {
          try {
            await this.authenticate();
            // Retry the request with new token
            return this.axiosInstance.request(config);
          } catch (authError) {
            logger.error('Authentication retry failed:', authError);
          }
        }
        
        // Handle rate limiting (429 Too Many Requests)
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          if (retryAfter && config._retryCount < 3) {
            config._retryCount = (config._retryCount || 0) + 1;
            const delay = parseInt(retryAfter) * 1000;
            
            logger.warn(`Rate limited, retrying after ${delay}ms`);
            await this.sleep(delay);
            return this.axiosInstance.request(config);
          }
        }
        
        logger.error(`REST API error: ${error.response?.status} ${error.message}`);
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Authenticate with the API service
   */
  async authenticate() {
    try {
      const { type, ...authData } = this.authConfig;
      
      switch (type) {
        case 'bearer':
          this.authToken = authData.token;
          break;
          
        case 'oauth2':
          this.authToken = await this.authenticateOAuth2(authData);
          break;
          
        case 'api-key':
          // API key is set in headers, no token needed
          this.headers[authData.header || 'X-API-Key'] = authData.key;
          break;
          
        case 'basic':
          const credentials = Buffer.from(`${authData.username}:${authData.password}`).toString('base64');
          this.headers['Authorization'] = `Basic ${credentials}`;
          break;
          
        default:
          throw new Error(`Unsupported authentication type: ${type}`);
      }
      
      logger.debug(`Authentication completed: ${type}`);
      
    } catch (error) {
      logger.error(`Authentication failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * OAuth2 authentication flow
   */
  async authenticateOAuth2(authData) {
    try {
      const response = await axios.post(authData.tokenUrl, {
        grant_type: 'client_credentials',
        client_id: authData.clientId,
        client_secret: authData.clientSecret,
        scope: authData.scope
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const tokenData = response.data;
      this.authExpiry = Date.now() + (tokenData.expires_in * 1000);
      
      return tokenData.access_token;
      
    } catch (error) {
      throw new Error(`OAuth2 authentication failed: ${error.message}`);
    }
  }
  
  /**
   * Add authentication to request config
   */
  async addAuthentication(config) {
    if (this.authToken) {
      // Check if token needs refresh for OAuth2
      if (this.authConfig.type === 'oauth2' && this.authExpiry && Date.now() >= this.authExpiry) {
        await this.authenticate();
      }
      
      config.headers['Authorization'] = `Bearer ${this.authToken}`;
    }
  }
  
  /**
   * Test API connection
   */
  async testConnection() {
    try {
      // Try a simple GET request to the base URL or health endpoint
      const testPath = this.config.healthPath || '/health' || '/';
      await this.axiosInstance.get(testPath);
    } catch (error) {
      // If health endpoint fails, try root path
      if (error.response?.status === 404 && this.config.healthPath) {
        await this.axiosInstance.get('/');
      } else {
        throw error;
      }
    }
  }
  
  /**
   * Execute query against REST API
   */
  async query(queryConfig) {
    if (!this.axiosInstance) {
      throw new Error('REST API connection not established');
    }
    
    this.validateQueryConfig(queryConfig);
    
    const requestConfig = this.buildRequestConfig(queryConfig);
    
    logger.debug(`Executing REST API request: ${requestConfig.method} ${requestConfig.url}`);
    
    const startTime = Date.now();
    
    try {
      const response = await this.axiosInstance.request(requestConfig);
      const executionTime = Date.now() - startTime;
      
      logger.debug(`REST API request completed in ${executionTime}ms`);
      
      return {
        data: response.data,
        status: response.status,
        headers: response.headers,
        executionTime: executionTime,
        request: {
          method: requestConfig.method,
          url: requestConfig.url,
          params: requestConfig.params,
          data: requestConfig.data
        }
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      logger.error(`REST API request failed after ${executionTime}ms: ${error.message}`);
      
      throw {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        executionTime: executionTime,
        request: requestConfig
      };
    }
  }
  
  /**
   * Build axios request configuration from query config
   */
  buildRequestConfig(queryConfig) {
    const {
      method = 'GET',
      path = '/',
      params = {},
      data,
      headers = {},
      timeout
    } = queryConfig;
    
    return {
      method: method.toUpperCase(),
      url: path,
      params: params,
      data: data,
      headers: {
        ...this.headers,
        ...headers
      },
      timeout: timeout || this.timeout
    };
  }
  
  /**
   * Apply rate limiting
   */
  async applyRateLimit() {
    if (!this.rateLimitConfig.maxRequests) {
      return; // No rate limiting configured
    }
    
    const now = Date.now();
    const windowMs = this.rateLimitConfig.windowMs || 60000; // 1 minute default
    
    // Clean old requests outside the window
    this.rateLimitState.requests = this.rateLimitState.requests.filter(
      timestamp => now - timestamp < windowMs
    );
    
    // Check if we've hit the limit
    if (this.rateLimitState.requests.length >= this.rateLimitConfig.maxRequests) {
      const oldestRequest = Math.min(...this.rateLimitState.requests);
      const waitTime = windowMs - (now - oldestRequest);
      
      logger.warn(`Rate limit reached, waiting ${waitTime}ms`);
      await this.sleep(waitTime);
    }
    
    // Add current request
    this.rateLimitState.requests.push(now);
  }
  
  /**
   * Check circuit breaker state
   */
  checkCircuitBreaker() {
    if (!this.circuitBreakerConfig.enabled) {
      return true; // Circuit breaker disabled
    }
    
    const now = Date.now();
    
    switch (this.circuitBreakerState.state) {
      case 'OPEN':
        if (now >= this.circuitBreakerState.nextAttempt) {
          this.circuitBreakerState.state = 'HALF_OPEN';
          return true;
        }
        return false;
        
      case 'HALF_OPEN':
      case 'CLOSED':
        return true;
        
      default:
        return true;
    }
  }
  
  /**
   * Handle circuit breaker on error
   */
  handleCircuitBreakerError() {
    if (!this.circuitBreakerConfig.enabled) {
      return;
    }
    
    this.circuitBreakerState.failures++;
    
    const threshold = this.circuitBreakerConfig.threshold || 5;
    const timeout = this.circuitBreakerConfig.timeout || 60000; // 1 minute
    
    if (this.circuitBreakerState.failures >= threshold) {
      this.circuitBreakerState.state = 'OPEN';
      this.circuitBreakerState.nextAttempt = Date.now() + timeout;
      
      logger.warn(`Circuit breaker opened after ${this.circuitBreakerState.failures} failures`);
    }
  }
  
  /**
   * Reset circuit breaker on success
   */
  resetCircuitBreaker() {
    if (this.circuitBreakerState.failures > 0) {
      this.circuitBreakerState.failures = 0;
      this.circuitBreakerState.state = 'CLOSED';
      logger.debug('Circuit breaker reset');
    }
  }
  
  /**
   * Apply request transformations
   */
  applyRequestTransform(config) {
    if (this.transformConfig.request) {
      const transform = this.transformConfig.request;
      
      // Apply field mapping
      if (transform.fieldMapping && config.data) {
        const transformedData = {};
        for (const [source, target] of Object.entries(transform.fieldMapping)) {
          if (config.data[source] !== undefined) {
            transformedData[target] = config.data[source];
          }
        }
        config.data = { ...config.data, ...transformedData };
      }
      
      // Apply custom transformer function
      if (transform.transformer && typeof transform.transformer === 'function') {
        config = transform.transformer(config);
      }
    }
    
    return config;
  }
  
  /**
   * Apply response transformations
   */
  applyResponseTransform(response) {
    if (this.transformConfig.response) {
      const transform = this.transformConfig.response;
      
      // Extract data from nested structure
      if (transform.dataPath) {
        const path = transform.dataPath.split('.');
        let data = response.data;
        for (const key of path) {
          data = data?.[key];
        }
        response.data = data;
      }
      
      // Apply field mapping
      if (transform.fieldMapping && Array.isArray(response.data)) {
        response.data = response.data.map(item => {
          const transformedItem = { ...item };
          for (const [source, target] of Object.entries(transform.fieldMapping)) {
            if (item[source] !== undefined) {
              transformedItem[target] = item[source];
              if (source !== target) {
                delete transformedItem[source];
              }
            }
          }
          return transformedItem;
        });
      }
      
      // Apply custom transformer function
      if (transform.transformer && typeof transform.transformer === 'function') {
        response = transform.transformer(response);
      }
    }
    
    return response;
  }
  
  /**
   * Close connection (cleanup)
   */
  async disconnect() {
    this.axiosInstance = null;
    this.authToken = null;
    this.authExpiry = null;
    
    logger.info(`REST API connector disconnected: ${this.baseURL}`);
  }
  
  /**
   * Check health of REST API connection
   */
  async healthCheck() {
    try {
      if (!this.axiosInstance) {
        return {
          status: 'unhealthy',
          message: 'No connection established',
          details: { baseURL: this.baseURL }
        };
      }
      
      const startTime = Date.now();
      const healthPath = this.config.healthPath || '/health';
      
      try {
        await this.axiosInstance.get(healthPath, { timeout: 5000 });
      } catch (error) {
        // If health endpoint fails, try root path
        if (error.response?.status === 404) {
          await this.axiosInstance.get('/', { timeout: 5000 });
        } else {
          throw error;
        }
      }
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        message: 'REST API connection is healthy',
        responseTime: responseTime,
        details: {
          baseURL: this.baseURL,
          circuitBreakerState: this.circuitBreakerState.state,
          authConfigured: !!this.authConfig.type,
          rateLimitEnabled: !!this.rateLimitConfig.maxRequests
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message,
        details: { baseURL: this.baseURL }
      };
    }
  }
  
  /**
   * Get API schema/documentation (if available)
   */
  async getSchema() {
    try {
      // Try common API documentation endpoints
      const docEndpoints = [
        '/swagger.json',
        '/api-docs',
        '/openapi.json',
        '/schema',
        this.config.schemaPath
      ].filter(Boolean);
      
      for (const endpoint of docEndpoints) {
        try {
          const response = await this.axiosInstance.get(endpoint);
          return {
            source: endpoint,
            schema: response.data,
            baseURL: this.baseURL
          };
        } catch (error) {
          continue; // Try next endpoint
        }
      }
      
      // Return basic info if no schema found
      return {
        source: 'basic',
        schema: {
          baseURL: this.baseURL,
          authType: this.authConfig.type,
          timeout: this.timeout
        }
      };
      
    } catch (error) {
      throw new Error(`Failed to retrieve API schema: ${error.message}`);
    }
  }
  
  /**
   * Get public configuration
   */
  getPublicConfig() {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      authType: this.authConfig.type,
      rateLimitEnabled: !!this.rateLimitConfig.maxRequests,
      circuitBreakerEnabled: !!this.circuitBreakerConfig.enabled,
      transformationsEnabled: !!(this.transformConfig.request || this.transformConfig.response)
    };
  }
  
  /**
   * Get connector capabilities
   */
  getCapabilities() {
    return {
      supportsTransactions: false,
      supportsAggregation: false,
      supportsJoins: false,
      supportsStreaming: false,
      maxConnections: 1,
      supportedOperations: ['read', 'write'],
      supportedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      authenticationTypes: ['bearer', 'oauth2', 'api-key', 'basic'],
      additionalFeatures: ['CIRCUIT_BREAKER', 'RATE_LIMITING', 'DATA_TRANSFORMATION', 'AUTO_RETRY']
    };
  }
  
  /**
   * Validate query configuration for REST API
   */
  validateQueryConfig(queryConfig) {
    super.validateQueryConfig(queryConfig);
    
    if (queryConfig.method && !['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(queryConfig.method.toUpperCase())) {
      throw new Error(`Unsupported HTTP method: ${queryConfig.method}`);
    }
    
    return true;
  }
}

module.exports = RestApiConnector;