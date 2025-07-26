const { v4: uuidv4 } = require('uuid');

/**
 * Unified API Schema for standardized responses across all endpoints
 */
class ApiSchema {
  /**
   * Create a standardized success response
   * @param {*} data - The response data
   * @param {Object} metadata - Additional metadata
   * @param {Object} pagination - Pagination information
   * @returns {Object} Standardized response
   */
  static createSuccessResponse(data, metadata = {}, pagination = null) {
    return {
      success: true,
      data: data,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: metadata.requestId || uuidv4(),
        source: metadata.source || 'api-gateway',
        cache: metadata.cache || false,
        executionTime: metadata.executionTime || null,
        version: '1.0.0',
        ...metadata
      },
      pagination: pagination,
      errors: null
    };
  }
  
  /**
   * Create a standardized error response
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} details - Additional error details
   * @param {number} status - HTTP status code
   * @returns {Object} Standardized error response
   */
  static createErrorResponse(message, code = 'INTERNAL_ERROR', details = {}, status = 500) {
    return {
      success: false,
      data: null,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: details.requestId || uuidv4(),
        source: 'api-gateway',
        cache: false,
        version: '1.0.0'
      },
      pagination: null,
      errors: [{
        message: message,
        code: code,
        status: status,
        details: details
      }]
    };
  }
  
  /**
   * Create pagination object
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @param {number} total - Total items
   * @param {number} totalPages - Total pages
   * @returns {Object} Pagination object
   */
  static createPagination(page, limit, total, totalPages = null) {
    const calculatedTotalPages = totalPages || Math.ceil(total / limit);
    
    return {
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
      totalItems: parseInt(total),
      totalPages: calculatedTotalPages,
      hasNextPage: page < calculatedTotalPages,
      hasPreviousPage: page > 1,
      nextPage: page < calculatedTotalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null
    };
  }
  
  /**
   * Validate query parameters
   * @param {Object} query - Query parameters
   * @param {Object} schema - Validation schema
   * @returns {Object} Validation result
   */
  static validateQuery(query, schema) {
    const errors = [];
    const validated = {};
    
    // Check required fields
    if (schema.required) {
      schema.required.forEach(field => {
        if (!query[field]) {
          errors.push({
            field: field,
            message: `${field} is required`,
            code: 'REQUIRED_FIELD_MISSING'
          });
        }
      });
    }
    
    // Validate field types and constraints
    if (schema.fields) {
      Object.entries(schema.fields).forEach(([field, config]) => {
        const value = query[field];
        
        if (value !== undefined && value !== null) {
          const validationResult = this.validateField(field, value, config);
          if (validationResult.error) {
            errors.push(validationResult.error);
          } else {
            validated[field] = validationResult.value;
          }
        } else if (config.default !== undefined) {
          validated[field] = config.default;
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors,
      validated: validated
    };
  }
  
  /**
   * Validate individual field
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @param {Object} config - Field configuration
   * @returns {Object} Validation result
   */
  static validateField(field, value, config) {
    try {
      let processedValue = value;
      
      // Type conversion
      switch (config.type) {
        case 'integer':
          processedValue = parseInt(value);
          if (isNaN(processedValue)) {
            return {
              error: {
                field: field,
                message: `${field} must be a valid integer`,
                code: 'INVALID_TYPE'
              }
            };
          }
          break;
          
        case 'float':
          processedValue = parseFloat(value);
          if (isNaN(processedValue)) {
            return {
              error: {
                field: field,
                message: `${field} must be a valid number`,
                code: 'INVALID_TYPE'
              }
            };
          }
          break;
          
        case 'boolean':
          if (typeof value === 'string') {
            processedValue = value.toLowerCase() === 'true';
          } else {
            processedValue = Boolean(value);
          }
          break;
          
        case 'date':
          processedValue = new Date(value);
          if (isNaN(processedValue.getTime())) {
            return {
              error: {
                field: field,
                message: `${field} must be a valid date`,
                code: 'INVALID_DATE'
              }
            };
          }
          break;
          
        case 'array':
          if (typeof value === 'string') {
            try {
              processedValue = JSON.parse(value);
            } catch (e) {
              processedValue = value.split(',').map(v => v.trim());
            }
          }
          if (!Array.isArray(processedValue)) {
            return {
              error: {
                field: field,
                message: `${field} must be an array`,
                code: 'INVALID_TYPE'
              }
            };
          }
          break;
      }
      
      // Range validation
      if (config.min !== undefined && processedValue < config.min) {
        return {
          error: {
            field: field,
            message: `${field} must be at least ${config.min}`,
            code: 'VALUE_TOO_SMALL'
          }
        };
      }
      
      if (config.max !== undefined && processedValue > config.max) {
        return {
          error: {
            field: field,
            message: `${field} must be at most ${config.max}`,
            code: 'VALUE_TOO_LARGE'
          }
        };
      }
      
      // Length validation for strings
      if (typeof processedValue === 'string') {
        if (config.minLength && processedValue.length < config.minLength) {
          return {
            error: {
              field: field,
              message: `${field} must be at least ${config.minLength} characters`,
              code: 'STRING_TOO_SHORT'
            }
          };
        }
        
        if (config.maxLength && processedValue.length > config.maxLength) {
          return {
            error: {
              field: field,
              message: `${field} must be at most ${config.maxLength} characters`,
              code: 'STRING_TOO_LONG'
            }
          };
        }
      }
      
      // Enum validation
      if (config.enum && !config.enum.includes(processedValue)) {
        return {
          error: {
            field: field,
            message: `${field} must be one of: ${config.enum.join(', ')}`,
            code: 'INVALID_ENUM_VALUE'
          }
        };
      }
      
      return { value: processedValue };
      
    } catch (error) {
      return {
        error: {
          field: field,
          message: `Invalid value for ${field}: ${error.message}`,
          code: 'VALIDATION_ERROR'
        }
      };
    }
  }
  
  /**
   * Common query parameter schemas
   */
  static get commonSchemas() {
    return {
      pagination: {
        fields: {
          page: { type: 'integer', default: 1, min: 1 },
          limit: { type: 'integer', default: 100, min: 1, max: 1000 },
          offset: { type: 'integer', default: 0, min: 0 }
        }
      },
      
      dateRange: {
        fields: {
          startDate: { type: 'date' },
          endDate: { type: 'date' },
          dateField: { type: 'string', default: 'created_at' }
        }
      },
      
      sorting: {
        fields: {
          sortBy: { type: 'string' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
          orderBy: { type: 'array' }
        }
      },
      
      filtering: {
        fields: {
          filters: { type: 'string' }, // JSON string
          search: { type: 'string', maxLength: 255 },
          category: { type: 'string' },
          status: { type: 'string' }
        }
      }
    };
  }
}

/**
 * Predefined query schemas for different endpoints
 */
const QuerySchemas = {
  // Customer domain schemas
  customerTransactionPatterns: {
    fields: {
      ...ApiSchema.commonSchemas.pagination.fields,
      ...ApiSchema.commonSchemas.dateRange.fields,
      ...ApiSchema.commonSchemas.sorting.fields,
      customerId: { type: 'string' },
      minAmount: { type: 'float', min: 0 },
      maxAmount: { type: 'float', min: 0 },
      productCategory: { type: 'string' },
      paymentMethod: { type: 'string' }
    }
  },
  
  customerSegmentation: {
    fields: {
      ...ApiSchema.commonSchemas.pagination.fields,
      segmentType: { 
        type: 'string', 
        enum: ['value', 'behavior', 'demographic', 'lifecycle'],
        default: 'value'
      },
      includeMetrics: { type: 'boolean', default: true }
    }
  },
  
  churnPrediction: {
    fields: {
      ...ApiSchema.commonSchemas.pagination.fields,
      riskLevel: { 
        type: 'string', 
        enum: ['low', 'medium', 'high', 'all'],
        default: 'all'
      },
      modelVersion: { type: 'string', default: 'latest' },
      includeFeatures: { type: 'boolean', default: false }
    }
  },
  
  // Sales domain schemas
  productPerformance: {
    fields: {
      ...ApiSchema.commonSchemas.pagination.fields,
      ...ApiSchema.commonSchemas.dateRange.fields,
      productId: { type: 'string' },
      category: { type: 'string' },
      minRevenue: { type: 'float', min: 0 },
      includeMetrics: { type: 'boolean', default: true }
    }
  },
  
  salesTrends: {
    fields: {
      ...ApiSchema.commonSchemas.dateRange.fields,
      granularity: { 
        type: 'string', 
        enum: ['daily', 'weekly', 'monthly', 'quarterly'],
        default: 'monthly'
      },
      metrics: { type: 'array', default: ['revenue', 'units', 'transactions'] }
    }
  },
  
  // Inventory domain schemas
  inventoryLevels: {
    fields: {
      ...ApiSchema.commonSchemas.pagination.fields,
      warehouseId: { type: 'string' },
      lowStockThreshold: { type: 'integer', min: 0 },
      category: { type: 'string' },
      includeForecasts: { type: 'boolean', default: false }
    }
  },
  
  // Finance domain schemas
  financialReports: {
    fields: {
      ...ApiSchema.commonSchemas.pagination.fields,
      ...ApiSchema.commonSchemas.dateRange.fields,
      reportType: { 
        type: 'string', 
        enum: ['income', 'balance', 'cashflow', 'summary'],
        default: 'summary'
      },
      includeComparisons: { type: 'boolean', default: true }
    }
  }
};

module.exports = {
  ApiSchema,
  QuerySchemas
};