/**
 * Database utilities for Customer tools
 * Migrated from orchestration_agent/database/utils.js
 */

/**
 * Handle database errors with proper logging
 * @param {string} message - Error message
 * @param {Error} error - Error object
 * @param {Object} context - Additional context for debugging
 */
const handleError = (message, error, context = {}) => {
  console.error(`[DATABASE ERROR] ${message}:`, error.message);
  
  if (context && Object.keys(context).length > 0) {
    console.error('Error context:', JSON.stringify(context, null, 2));
  }
  
  // In production, we would log to a monitoring service here
  if (process.env.NODE_ENV === 'production') {
    // Log to monitoring service
    // logToMonitoring(message, error, context);
  }
};

/**
 * Sanitize SQL query parameters for logging
 * @param {Array|Object} params - Query parameters
 * @returns {Array|Object} Sanitized parameters
 */
const sanitizeParams = (params) => {
  if (!params) return params;
  
  // If it's an array, sanitize each element
  if (Array.isArray(params)) {
    return params.map(param => 
      typeof param === 'string' && param.length > 100 
        ? `${param.substring(0, 100)}...` 
        : param
    );
  }
  
  // If it's an object, sanitize each value
  if (typeof params === 'object') {
    const sanitized = {};
    for (const key in params) {
      const value = params[key];
      sanitized[key] = typeof value === 'string' && value.length > 100 
        ? `${value.substring(0, 100)}...` 
        : value;
    }
    return sanitized;
  }
  
  return params;
};

/**
 * Format SQL query for logging
 * @param {string} sql - SQL query
 * @param {Array|Object} params - Query parameters
 * @returns {string} Formatted query
 */
const formatQuery = (sql, params = []) => {
  const sanitizedParams = sanitizeParams(params);
  return `SQL: ${sql.replace(/\s+/g, ' ').trim()}\nParams: ${JSON.stringify(sanitizedParams)}`;
};

module.exports = {
  handleError,
  sanitizeParams,
  formatQuery
}; 