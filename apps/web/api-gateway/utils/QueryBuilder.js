const logger = require('./logger');

/**
 * Unified Query Builder for cross-connector data access
 * Provides standardized query interface across different data sources
 */
class QueryBuilder {
  constructor() {
    this.query = {};
    this.connector = null;
    this.transformations = [];
  }
  
  /**
   * Set the target connector
   * @param {BaseConnector} connector - Target connector instance
   * @returns {QueryBuilder} Builder instance for chaining
   */
  useConnector(connector) {
    this.connector = connector;
    return this;
  }
  
  /**
   * Set the target table/collection/endpoint
   * @param {string} table - Table/collection/endpoint name
   * @returns {QueryBuilder} Builder instance for chaining
   */
  from(table) {
    this.query.table = table;
    return this;
  }
  
  /**
   * Select specific fields
   * @param {Array<string>|string} fields - Fields to select
   * @returns {QueryBuilder} Builder instance for chaining
   */
  select(fields) {
    if (typeof fields === 'string') {
      fields = fields.split(',').map(f => f.trim());
    }
    this.query.fields = fields;
    return this;
  }
  
  /**
   * Add WHERE conditions
   * @param {Object|string} conditions - Where conditions
   * @returns {QueryBuilder} Builder instance for chaining
   */
  where(conditions) {
    if (!this.query.where) {
      this.query.where = {};
    }
    
    if (typeof conditions === 'object') {
      Object.assign(this.query.where, conditions);
    } else if (typeof conditions === 'string') {
      // Parse simple string conditions like "status = 'active'"
      this.query.rawWhere = conditions;
    }
    
    return this;
  }
  
  /**
   * Add date range filter
   * @param {string} field - Date field name
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @returns {QueryBuilder} Builder instance for chaining
   */
  dateRange(field, startDate, endDate) {
    if (!this.query.where) {
      this.query.where = {};
    }
    
    this.query.where[field] = {
      operator: 'BETWEEN',
      value: [startDate, endDate]
    };
    
    return this;
  }
  
  /**
   * Add IN condition
   * @param {string} field - Field name
   * @param {Array} values - Array of values
   * @returns {QueryBuilder} Builder instance for chaining
   */
  whereIn(field, values) {
    if (!this.query.where) {
      this.query.where = {};
    }
    
    this.query.where[field] = values;
    return this;
  }
  
  /**
   * Add comparison condition
   * @param {string} field - Field name
   * @param {string} operator - Comparison operator (>, <, >=, <=, !=)
   * @param {*} value - Comparison value
   * @returns {QueryBuilder} Builder instance for chaining
   */
  whereComparison(field, operator, value) {
    if (!this.query.where) {
      this.query.where = {};
    }
    
    this.query.where[field] = {
      operator: operator,
      value: value
    };
    
    return this;
  }
  
  /**
   * Add LIKE condition
   * @param {string} field - Field name
   * @param {string} pattern - Search pattern
   * @param {boolean} caseSensitive - Case sensitive search
   * @returns {QueryBuilder} Builder instance for chaining
   */
  whereLike(field, pattern, caseSensitive = false) {
    if (!this.query.where) {
      this.query.where = {};
    }
    
    this.query.where[field] = {
      operator: caseSensitive ? 'LIKE' : 'ILIKE',
      value: pattern
    };
    
    return this;
  }
  
  /**
   * Add ORDER BY clause
   * @param {string} field - Field to order by
   * @param {string} direction - Order direction (ASC, DESC)
   * @returns {QueryBuilder} Builder instance for chaining
   */
  orderBy(field, direction = 'ASC') {
    if (!this.query.orderBy) {
      this.query.orderBy = [];
    }
    
    this.query.orderBy.push(`${field} ${direction.toUpperCase()}`);
    return this;
  }
  
  /**
   * Set LIMIT
   * @param {number} limit - Maximum number of records
   * @returns {QueryBuilder} Builder instance for chaining
   */
  limit(limit) {
    this.query.limit = parseInt(limit);
    return this;
  }
  
  /**
   * Set OFFSET
   * @param {number} offset - Number of records to skip
   * @returns {QueryBuilder} Builder instance for chaining
   */
  offset(offset) {
    this.query.offset = parseInt(offset);
    return this;
  }
  
  /**
   * Add pagination
   * @param {number} page - Page number (1-based)
   * @param {number} pageSize - Items per page
   * @returns {QueryBuilder} Builder instance for chaining
   */
  paginate(page, pageSize) {
    this.query.limit = parseInt(pageSize);
    this.query.offset = (parseInt(page) - 1) * parseInt(pageSize);
    return this;
  }
  
  /**
   * Add data transformation
   * @param {Function} transformer - Transformation function
   * @returns {QueryBuilder} Builder instance for chaining
   */
  transform(transformer) {
    this.transformations.push(transformer);
    return this;
  }
  
  /**
   * Execute the query
   * @returns {Promise<Object>} Query result
   */
  async execute() {
    if (!this.connector) {
      throw new Error('No connector specified');
    }
    
    try {
      logger.debug('Executing query:', {
        connector: this.connector.id,
        query: this.query
      });
      
      const startTime = Date.now();
      let result = await this.connector.safeQuery(this.query);
      const executionTime = Date.now() - startTime;
      
      // Apply transformations
      if (this.transformations.length > 0) {
        for (const transformer of this.transformations) {
          result = await transformer(result);
        }
      }
      
      // Standardize result format
      const standardizedResult = {
        rows: result.rows || result.data || result,
        rowCount: result.rowCount || result.rows?.length || 0,
        totalRows: result.totalRows || result.rowCount || result.rows?.length || 0,
        executionTime: result.executionTime || executionTime,
        fromCache: result.fromCache || false,
        connector: this.connector.id,
        query: this.query
      };
      
      logger.debug('Query executed successfully:', {
        connector: this.connector.id,
        rowCount: standardizedResult.rowCount,
        executionTime: standardizedResult.executionTime
      });
      
      return standardizedResult;
      
    } catch (error) {
      logger.error('Query execution failed:', {
        connector: this.connector.id,
        query: this.query,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Get query configuration without executing
   * @returns {Object} Query configuration
   */
  getQuery() {
    return { ...this.query };
  }
  
  /**
   * Reset the query builder
   * @returns {QueryBuilder} Builder instance for chaining
   */
  reset() {
    this.query = {};
    this.transformations = [];
    return this;
  }
  
  /**
   * Clone the query builder
   * @returns {QueryBuilder} New builder instance with same configuration
   */
  clone() {
    const cloned = new QueryBuilder();
    cloned.query = { ...this.query };
    cloned.connector = this.connector;
    cloned.transformations = [...this.transformations];
    return cloned;
  }
}

/**
 * Predefined query builders for common use cases
 */
class CommonQueries {
  /**
   * Build transaction patterns query
   * @param {Object} filters - Query filters
   * @returns {Object} Query configuration
   */
  static buildTransactionPatternsQuery(filters = {}) {
    const query = {
      table: 'dbo_F_Sales_Transaction',
      fields: [
        'Sales Txn Key',
        'Customer Key', 
        'Item Number',
        'Quantity',
        'Unit Price',
        'Extended Price',
        'Txn Date',
        'Posting Time'
      ],
      operation: 'select'
    };
    
    // Add filters
    if (filters.customerId) {
      query.where = { ...query.where, 'Customer Key': filters.customerId };
    }
    
    if (filters.startDate && filters.endDate) {
      query.where = {
        ...query.where,
        'Txn Date': {
          operator: 'BETWEEN',
          value: [filters.startDate, filters.endDate]
        }
      };
    }
    
    if (filters.minAmount) {
      query.where = {
        ...query.where,
        'Extended Price': {
          operator: '>=',
          value: parseFloat(filters.minAmount)
        }
      };
    }
    
    if (filters.maxAmount) {
      query.where = {
        ...query.where,
        'Extended Price': {
          operator: '<=',
          value: parseFloat(filters.maxAmount)
        }
      };
    }
    
    // Add sorting
    query.orderBy = ['Txn Date DESC', 'Posting Time DESC'];
    
    // Add pagination
    query.limit = parseInt(filters.limit) || 1000;
    if (filters.offset) {
      query.offset = parseInt(filters.offset);
    }
    
    return query;
  }
  
  /**
   * Build customer segmentation query
   * @param {Object} filters - Query filters
   * @returns {Object} Query configuration
   */
  static buildCustomerSegmentationQuery(filters = {}) {
    const query = {
      table: 'dbo_D_Customer',
      fields: [
        'Customer Key',
        'Customer Name',
        'Customer Type',
        'Customer Status',
        'Registration Date'
      ],
      operation: 'select'
    };
    
    // Add segment-specific filters
    if (filters.segmentType) {
      // This would be enhanced based on actual segmentation logic
      if (filters.segmentType === 'active') {
        query.where = { 'Customer Status': 'Active' };
      }
    }
    
    // Add pagination
    query.limit = parseInt(filters.limit) || 500;
    if (filters.offset) {
      query.offset = parseInt(filters.offset);
    }
    
    query.orderBy = ['Customer Name ASC'];
    
    return query;
  }
  
  /**
   * Build product performance query
   * @param {Object} filters - Query filters
   * @returns {Object} Query configuration
   */
  static buildProductPerformanceQuery(filters = {}) {
    const query = {
      // This would join multiple tables in a real implementation
      table: 'dbo_F_Sales_Transaction',
      fields: [
        'Item Number',
        'SUM(Quantity) as Total_Quantity',
        'SUM(Extended Price) as Total_Revenue',
        'COUNT(*) as Transaction_Count'
      ],
      operation: 'select'
    };
    
    // Add product filters
    if (filters.productId) {
      query.where = { 'Item Number': filters.productId };
    }
    
    if (filters.startDate && filters.endDate) {
      query.where = {
        ...query.where,
        'Txn Date': {
          operator: 'BETWEEN',
          value: [filters.startDate, filters.endDate]
        }
      };
    }
    
    // Group by product
    query.groupBy = ['Item Number'];
    query.orderBy = ['Total_Revenue DESC'];
    query.limit = parseInt(filters.limit) || 100;
    
    return query;
  }
  
  /**
   * Build inventory levels query
   * @param {Object} filters - Query filters
   * @returns {Object} Query configuration
   */
  static buildInventoryLevelsQuery(filters = {}) {
    // This would be implemented based on actual inventory schema
    const query = {
      table: 'inventory_items', // Placeholder table name
      fields: [
        'item_id',
        'item_name',
        'current_stock',
        'reserved_stock',
        'available_stock',
        'reorder_level',
        'last_updated'
      ],
      operation: 'select'
    };
    
    // Add low stock filter
    if (filters.lowStockOnly) {
      query.where = {
        'available_stock': {
          operator: '<=',
          value: 'reorder_level' // This would need special handling
        }
      };
    }
    
    if (filters.category) {
      query.where = { ...query.where, 'category': filters.category };
    }
    
    query.orderBy = ['available_stock ASC'];
    query.limit = parseInt(filters.limit) || 500;
    
    return query;
  }
}

/**
 * Data transformation utilities
 */
class DataTransformer {
  /**
   * Transform database field names to API field names
   * @param {Array} rows - Database rows
   * @param {Object} fieldMapping - Field name mapping
   * @returns {Array} Transformed rows
   */
  static transformFieldNames(rows, fieldMapping) {
    return rows.map(row => {
      const transformedRow = {};
      
      Object.entries(row).forEach(([dbField, value]) => {
        const apiField = fieldMapping[dbField] || dbField;
        transformedRow[apiField] = value;
      });
      
      return transformedRow;
    });
  }
  
  /**
   * Add calculated fields to result rows
   * @param {Array} rows - Result rows
   * @param {Object} calculatedFields - Calculated field definitions
   * @returns {Array} Enhanced rows
   */
  static addCalculatedFields(rows, calculatedFields) {
    return rows.map(row => {
      const enhancedRow = { ...row };
      
      Object.entries(calculatedFields).forEach(([fieldName, calculation]) => {
        if (typeof calculation === 'function') {
          enhancedRow[fieldName] = calculation(row);
        } else if (typeof calculation === 'string') {
          // Simple expression evaluation (unsafe - would need proper parser in production)
          try {
            enhancedRow[fieldName] = eval(calculation.replace(/\{(\w+)\}/g, (match, field) => {
              return row[field] || 0;
            }));
          } catch (error) {
            enhancedRow[fieldName] = null;
          }
        }
      });
      
      return enhancedRow;
    });
  }
  
  /**
   * Format numeric values
   * @param {Array} rows - Result rows
   * @param {Object} formatConfig - Format configuration
   * @returns {Array} Formatted rows
   */
  static formatNumericValues(rows, formatConfig) {
    return rows.map(row => {
      const formattedRow = { ...row };
      
      Object.entries(formatConfig).forEach(([field, format]) => {
        if (row[field] !== null && row[field] !== undefined) {
          const value = parseFloat(row[field]);
          
          if (!isNaN(value)) {
            switch (format.type) {
              case 'currency':
                formattedRow[field] = new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: format.currency || 'USD'
                }).format(value);
                break;
                
              case 'percentage':
                formattedRow[field] = (value * 100).toFixed(format.decimals || 2) + '%';
                break;
                
              case 'decimal':
                formattedRow[field] = value.toFixed(format.decimals || 2);
                break;
                
              default:
                formattedRow[field] = value;
            }
          }
        }
      });
      
      return formattedRow;
    });
  }
  
  /**
   * Aggregate data by specified grouping
   * @param {Array} rows - Result rows
   * @param {string} groupBy - Field to group by
   * @param {Object} aggregations - Aggregation functions
   * @returns {Array} Aggregated rows
   */
  static aggregateData(rows, groupBy, aggregations) {
    const groups = {};
    
    // Group rows
    rows.forEach(row => {
      const groupKey = row[groupBy];
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(row);
    });
    
    // Apply aggregations
    return Object.entries(groups).map(([groupKey, groupRows]) => {
      const result = { [groupBy]: groupKey };
      
      Object.entries(aggregations).forEach(([field, aggFunc]) => {
        const values = groupRows.map(row => parseFloat(row[field]) || 0);
        
        switch (aggFunc) {
          case 'sum':
            result[field] = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            result[field] = values.reduce((a, b) => a + b, 0) / values.length;
            break;
          case 'min':
            result[field] = Math.min(...values);
            break;
          case 'max':
            result[field] = Math.max(...values);
            break;
          case 'count':
            result[field] = groupRows.length;
            break;
        }
      });
      
      return result;
    });
  }
}

module.exports = {
  QueryBuilder,
  CommonQueries,
  DataTransformer
};