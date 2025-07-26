/**
 * API Client Library for Enterprise Data Connector Integration
 * Provides standardized API communication with the API Gateway
 */

class ApiClient {
  constructor(baseUrl = '/api/v1') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Configuration
    this.timeout = 30000; // 30 seconds
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
    
    // Request cache for GET requests
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get authentication token
   * @returns {string|null} JWT token
   */
  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }
    return null;
  }

  /**
   * Get default headers with authentication
   * @returns {Object} Headers object
   */
  getHeaders(customHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...customHeaders };
    
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Create cache key for request
   * @param {string} url 
   * @param {Object} params 
   * @returns {string}
   */
  createCacheKey(url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${url}?${JSON.stringify(sortedParams)}`;
  }

  /**
   * Check if cached response is valid
   * @param {Object} cachedItem 
   * @returns {boolean}
   */
  isCacheValid(cachedItem) {
    return cachedItem && (Date.now() - cachedItem.timestamp) < this.cacheTimeout;
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms 
   * @returns {Promise}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make HTTP request with retry logic
   * @param {string} url 
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async makeRequest(url, options = {}) {
    const fullUrl = `${this.baseUrl}${url}`;
    const requestOptions = {
      ...options,
      headers: this.getHeaders(options.headers),
      signal: AbortSignal.timeout(this.timeout)
    };

    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`[ApiClient] ${options.method || 'GET'} ${fullUrl} (attempt ${attempt})`);
        
        const response = await fetch(fullUrl, requestOptions);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.errors?.[0]?.message || 
            `HTTP ${response.status}: ${response.statusText}`
          );
        }
        
        const data = await response.json();
        
        // Log successful request
        console.log(`[ApiClient] ✅ ${options.method || 'GET'} ${fullUrl} - ${response.status}`);
        
        return data;
        
      } catch (error) {
        lastError = error;
        console.error(`[ApiClient] ❌ Attempt ${attempt} failed:`, error.message);
        
        // Don't retry on authentication errors or client errors
        if (error.message.includes('401') || error.message.includes('403') || 
            error.message.includes('400') || error.name === 'AbortError') {
          break;
        }
        
        // Wait before retrying (except on last attempt)
        if (attempt < this.retryAttempts) {
          await this.sleep(this.retryDelay * attempt);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * GET request with caching support
   * @param {string} endpoint 
   * @param {Object} params 
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async get(endpoint, params = {}, options = {}) {
    // Check cache for GET requests
    const cacheKey = this.createCacheKey(endpoint, params);
    const cachedItem = this.cache.get(cacheKey);
    
    if (this.isCacheValid(cachedItem) && !options.bypassCache) {
      console.log(`[ApiClient] 📦 Cache hit for ${endpoint}`);
      return cachedItem.data;
    }

    // Build query string
    const queryString = Object.keys(params).length > 0 
      ? '?' + new URLSearchParams(params).toString()
      : '';
    
    const url = `${endpoint}${queryString}`;
    const data = await this.makeRequest(url, {
      method: 'GET',
      ...options
    });
    
    // Cache successful GET responses
    this.cache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    
    return data;
  }

  /**
   * POST request
   * @param {string} endpoint 
   * @param {Object} data 
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async post(endpoint, data = {}, options = {}) {
    return await this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * PUT request
   * @param {string} endpoint 
   * @param {Object} data 
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async put(endpoint, data = {}, options = {}) {
    return await this.makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * DELETE request
   * @param {string} endpoint 
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async delete(endpoint, options = {}) {
    return await this.makeRequest(endpoint, {
      method: 'DELETE',
      ...options
    });
  }

  /**
   * PATCH request
   * @param {string} endpoint 
   * @param {Object} data 
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async patch(endpoint, data = {}, options = {}) {
    return await this.makeRequest(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * Clear cache
   * @param {string} pattern - Optional pattern to match cache keys
   */
  clearCache(pattern = null) {
    if (pattern) {
      const keysToDelete = [];
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.cache.delete(key));
      console.log(`[ApiClient] 🧹 Cleared ${keysToDelete.length} cache entries matching "${pattern}"`);
    } else {
      this.cache.clear();
      console.log('[ApiClient] 🧹 Cleared all cache entries');
    }
  }

  /**
   * Health check endpoint
   * @returns {Promise<Object>}
   */
  async healthCheck() {
    return await this.get('/health');
  }
}

/**
 * Domain-specific API methods
 */
class DomainApiClient extends ApiClient {
  
  // Customer Domain Methods
  async getTransactionPatterns(filters = {}) {
    return await this.post('/customer/transaction-patterns', filters);
  }

  async getCustomerSegmentation(params = {}) {
    return await this.get('/customer/segmentation', params);
  }

  async getChurnPrediction(params = {}) {
    return await this.get('/customer/churn-prediction', params);
  }

  async getCustomerLifetimeValue(params = {}) {
    return await this.get('/customer/lifetime-value', params);
  }

  // Sales Domain Methods  
  async getProductPerformance(params = {}) {
    return await this.get('/sales/product-performance', params);
  }

  async getSalesTrends(params = {}) {
    return await this.get('/sales/sales-trends', params);
  }

  async getSalesPerformance(params = {}) {
    return await this.get('/sales/sales-performance', params);
  }

  async getTopCustomers(params = {}) {
    return await this.get('/sales/top-customers', params);
  }

  // Inventory Domain Methods
  async getInventoryLevels(params = {}) {
    return await this.get('/inventory/levels', params);
  }

  async getInventoryMovements(params = {}) {
    return await this.get('/inventory/movements', params);
  }

  async getInventoryForecasts(params = {}) {
    return await this.get('/inventory/forecasts', params);
  }

  async getInventoryAnalysis(params = {}) {
    return await this.get('/inventory/analysis', params);
  }

  // Finance Domain Methods
  async getFinancialReports(params = {}) {
    return await this.get('/finance/reports', params);
  }

  async getArAnalysis(params = {}) {
    return await this.get('/finance/ar-analysis', params);
  }

  async getProfitabilityAnalysis(params = {}) {
    return await this.get('/finance/profitability', params);
  }

  // Health Check Methods
  async getCustomerHealth() {
    return await this.get('/customer/health');
  }

  async getSalesHealth() {
    return await this.get('/sales/health');
  }

  async getInventoryHealth() {
    return await this.get('/inventory/health');
  }

  async getFinanceHealth() {
    return await this.get('/finance/health');
  }
}

/**
 * Error handling utility
 */
class ApiError extends Error {
  constructor(message, code, status, details) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Response validation utility
 */
class ResponseValidator {
  static validateApiResponse(response) {
    if (!response || typeof response !== 'object') {
      throw new ApiError('Invalid response format', 'INVALID_RESPONSE', 500);
    }

    if (response.success === false) {
      const error = response.errors?.[0];
      throw new ApiError(
        error?.message || 'API request failed',
        error?.code || 'API_ERROR',
        error?.status || 500,
        error?.details
      );
    }

    return response;
  }

  static extractData(response) {
    const validated = this.validateApiResponse(response);
    return validated.data;
  }

  static extractPagination(response) {
    const validated = this.validateApiResponse(response);
    return validated.pagination;
  }

  static extractMetadata(response) {
    const validated = this.validateApiResponse(response);
    return validated.metadata;
  }
}

// Export classes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ApiClient,
    DomainApiClient,
    ApiError,
    ResponseValidator
  };
}

// Browser globals
if (typeof window !== 'undefined') {
  window.ApiClient = ApiClient;
  window.DomainApiClient = DomainApiClient;
  window.ApiError = ApiError;
  window.ResponseValidator = ResponseValidator;
}