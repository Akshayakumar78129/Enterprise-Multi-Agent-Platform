const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');
const BaseConnector = require('../base/BaseConnector');
const logger = require('../../utils/logger');

/**
 * CSV File Connector
 * Provides read/write capabilities for CSV files with streaming support
 */
class CsvConnector extends BaseConnector {
  constructor(config) {
    super({
      ...config,
      type: 'csv',
      name: config.name || 'CSV File'
    });
    
    this.filePath = config.filePath || config.path;
    this.delimiter = config.delimiter || ',';
    this.quote = config.quote || '"';
    this.escape = config.escape || '"';
    this.headers = config.headers !== false; // Default to true
    this.encoding = config.encoding || 'utf8';
    this.skipEmptyLines = config.skipEmptyLines !== false; // Default to true
    this.skipLinesWithError = config.skipLinesWithError || false;
    this.maxFileSize = config.maxFileSize || 100 * 1024 * 1024; // 100MB default
    this.watchFile = config.watchFile || false;
    this.archiveProcessed = config.archiveProcessed || false;
    this.archiveDirectory = config.archiveDirectory || path.join(path.dirname(this.filePath), 'archive');
    
    this.fileWatcher = null;
    this.cachedData = null;
    this.lastModified = null;
    this.schema = null;
    
    if (!this.filePath) {
      throw new Error('CSV file path is required');
    }
    
    // Resolve relative paths
    this.filePath = path.resolve(this.filePath);
    
    logger.info(`CsvConnector initialized for file: ${this.filePath}`);
  }
  
  /**
   * Initialize CSV file connection
   */
  async connect() {
    try {
      // Check if file exists for read operations
      if (fs.existsSync(this.filePath)) {
        const stats = fs.statSync(this.filePath);
        
        // Check file size
        if (stats.size > this.maxFileSize) {
          throw new Error(`CSV file too large: ${stats.size} bytes (max: ${this.maxFileSize})`);
        }
        
        this.lastModified = stats.mtime;
        
        // Parse headers to determine schema
        await this.parseSchema();
        
        logger.info(`Connected to CSV file: ${this.filePath} (${stats.size} bytes)`);
      } else {
        // File doesn't exist - will be created on write
        logger.info(`CSV file not found, will be created on write: ${this.filePath}`);
      }
      
      // Set up file watching if enabled
      if (this.watchFile && fs.existsSync(this.filePath)) {
        this.setupFileWatcher();
      }
      
      // Create archive directory if needed
      if (this.archiveProcessed && !fs.existsSync(this.archiveDirectory)) {
        fs.mkdirSync(this.archiveDirectory, { recursive: true });
      }
      
    } catch (error) {
      logger.error(`Failed to connect to CSV file: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Set up file watcher for automatic updates
   */
  setupFileWatcher() {
    this.fileWatcher = fs.watch(this.filePath, (eventType, filename) => {
      if (eventType === 'change') {
        logger.debug(`CSV file changed: ${this.filePath}`);
        this.clearCache();
        this.emit('file-changed', { 
          id: this.id, 
          filePath: this.filePath, 
          eventType 
        });
      }
    });
    
    logger.debug(`File watcher set up for: ${this.filePath}`);
  }
  
  /**
   * Parse CSV schema from headers
   */
  async parseSchema() {
    if (!fs.existsSync(this.filePath)) {
      return;
    }
    
    return new Promise((resolve, reject) => {
      const parser = parse({
        delimiter: this.delimiter,
        quote: this.quote,
        escape: this.escape,
        columns: this.headers,
        skip_empty_lines: this.skipEmptyLines,
        skip_records_with_error: this.skipLinesWithError,
        to_line: this.headers ? 2 : 1 // Read headers + one data row
      });
      
      const rows = [];
      
      parser.on('readable', function() {
        let record;
        while ((record = parser.read()) !== null) {
          rows.push(record);
        }
      });
      
      parser.on('error', reject);
      
      parser.on('end', () => {
        if (rows.length > 0) {
          const firstRow = rows[0];
          
          if (this.headers && typeof firstRow === 'object') {
            // Headers are column names
            this.schema = {
              columns: Object.keys(firstRow).map(column => ({
                name: column,
                type: this.inferDataType(rows.length > 1 ? rows[1][column] : null)
              }))
            };
          } else {
            // No headers, use column indices
            const columnCount = Array.isArray(firstRow) ? firstRow.length : 1;
            this.schema = {
              columns: Array.from({ length: columnCount }, (_, index) => ({
                name: `column_${index}`,
                type: this.inferDataType(firstRow[index])
              }))
            };
          }
        }
        
        resolve();
      });
      
      // Read file and pipe to parser
      fs.createReadStream(this.filePath, { encoding: this.encoding })
        .pipe(parser);
    });
  }
  
  /**
   * Infer data type from sample value
   */
  inferDataType(value) {
    if (value === null || value === undefined || value === '') {
      return 'string';
    }
    
    // Check for number
    if (!isNaN(value) && !isNaN(parseFloat(value))) {
      return value.includes('.') ? 'float' : 'integer';
    }
    
    // Check for boolean
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
      return 'boolean';
    }
    
    // Check for date (basic ISO format)
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return 'date';
    }
    
    return 'string';
  }
  
  /**
   * Execute query against CSV file
   */
  async query(queryConfig) {
    this.validateQueryConfig(queryConfig);
    
    const operation = queryConfig.operation || 'select';
    
    logger.debug(`Executing CSV query: ${operation}`);
    
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (operation) {
        case 'select':
          result = await this.selectData(queryConfig);
          break;
        case 'insert':
          result = await this.insertData(queryConfig);
          break;
        case 'update':
          result = await this.updateData(queryConfig);
          break;
        case 'delete':
          result = await this.deleteData(queryConfig);
          break;
        default:
          throw new Error(`Unsupported operation for CSV: ${operation}`);
      }
      
      const executionTime = Date.now() - startTime;
      
      logger.debug(`CSV query completed in ${executionTime}ms`);
      
      return {
        ...result,
        executionTime: executionTime,
        filePath: this.filePath
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`CSV query failed after ${executionTime}ms: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Select data from CSV file
   */
  async selectData(queryConfig) {
    // Check cache first
    if (this.shouldUseCache()) {
      const filteredData = this.applyFilters(this.cachedData, queryConfig);
      return {
        rows: filteredData,
        rowCount: filteredData.length,
        fromCache: true
      };
    }
    
    return new Promise((resolve, reject) => {
      const parser = parse({
        delimiter: this.delimiter,
        quote: this.quote,
        escape: this.escape,
        columns: this.headers,
        skip_empty_lines: this.skipEmptyLines,
        skip_records_with_error: this.skipLinesWithError
      });
      
      const rows = [];
      
      parser.on('readable', function() {
        let record;
        while ((record = parser.read()) !== null) {
          rows.push(record);
        }
      });
      
      parser.on('error', reject);
      
      parser.on('end', () => {
        // Cache the data
        this.cachedData = rows;
        
        // Apply filters, sorting, and limiting
        const filteredData = this.applyFilters(rows, queryConfig);
        
        resolve({
          rows: filteredData,
          rowCount: filteredData.length,
          totalRows: rows.length,
          fromCache: false
        });
      });
      
      // Read file and pipe to parser
      if (fs.existsSync(this.filePath)) {
        fs.createReadStream(this.filePath, { encoding: this.encoding })
          .pipe(parser);
      } else {
        resolve({
          rows: [],
          rowCount: 0,
          totalRows: 0,
          fromCache: false
        });
      }
    });
  }
  
  /**
   * Insert data into CSV file
   */
  async insertData(queryConfig) {
    const data = queryConfig.data;
    if (!data) {
      throw new Error('Insert data is required');
    }
    
    const records = Array.isArray(data) ? data : [data];
    
    return new Promise((resolve, reject) => {
      const stringifier = stringify({
        delimiter: this.delimiter,
        quote: this.quote,
        escape: this.escape,
        header: !fs.existsSync(this.filePath) && this.headers,
        columns: this.headers ? Object.keys(records[0]) : undefined
      });
      
      const writeStream = fs.createWriteStream(this.filePath, { 
        flags: 'a', // Append mode
        encoding: this.encoding 
      });
      
      let recordCount = 0;
      
      stringifier.on('error', reject);
      writeStream.on('error', reject);
      
      writeStream.on('finish', () => {
        this.clearCache();
        resolve({
          rowCount: recordCount,
          inserted: recordCount
        });
      });
      
      stringifier.pipe(writeStream);
      
      // Write records
      records.forEach(record => {
        stringifier.write(record);
        recordCount++;
      });
      
      stringifier.end();
    });
  }
  
  /**
   * Update data in CSV file (requires rewriting entire file)
   */
  async updateData(queryConfig) {
    const updateData = queryConfig.data;
    const where = queryConfig.where;
    
    if (!updateData) {
      throw new Error('Update data is required');
    }
    
    // Read all data first
    const selectResult = await this.selectData({ operation: 'select' });
    let rows = selectResult.rows;
    let updatedCount = 0;
    
    // Apply updates
    rows = rows.map(row => {
      if (this.matchesFilter(row, where)) {
        updatedCount++;
        return { ...row, ...updateData };
      }
      return row;
    });
    
    // Write back to file
    if (updatedCount > 0) {
      await this.writeAllData(rows);
    }
    
    return {
      rowCount: updatedCount,
      updated: updatedCount
    };
  }
  
  /**
   * Delete data from CSV file (requires rewriting entire file)
   */
  async deleteData(queryConfig) {
    const where = queryConfig.where;
    
    if (!where) {
      throw new Error('DELETE queries must include WHERE clause for safety');
    }
    
    // Read all data first
    const selectResult = await this.selectData({ operation: 'select' });
    const originalRows = selectResult.rows;
    
    // Filter out matching rows
    const remainingRows = originalRows.filter(row => !this.matchesFilter(row, where));
    const deletedCount = originalRows.length - remainingRows.length;
    
    // Write back to file
    if (deletedCount > 0) {
      await this.writeAllData(remainingRows);
    }
    
    return {
      rowCount: deletedCount,
      deleted: deletedCount
    };
  }
  
  /**
   * Write all data to CSV file (overwrites existing file)
   */
  async writeAllData(rows) {
    return new Promise((resolve, reject) => {
      const stringifier = stringify({
        delimiter: this.delimiter,
        quote: this.quote,
        escape: this.escape,
        header: this.headers,
        columns: this.headers && rows.length > 0 ? Object.keys(rows[0]) : undefined
      });
      
      const writeStream = fs.createWriteStream(this.filePath, { 
        encoding: this.encoding 
      });
      
      stringifier.on('error', reject);
      writeStream.on('error', reject);
      
      writeStream.on('finish', () => {
        this.clearCache();
        resolve();
      });
      
      stringifier.pipe(writeStream);
      
      // Write all rows
      rows.forEach(row => {
        stringifier.write(row);
      });
      
      stringifier.end();
    });
  }
  
  /**
   * Apply filters, sorting, and pagination to data
   */
  applyFilters(rows, queryConfig) {
    let filteredRows = [...rows];
    
    // Apply WHERE filters
    if (queryConfig.where) {
      filteredRows = filteredRows.filter(row => this.matchesFilter(row, queryConfig.where));
    }
    
    // Apply field selection
    if (queryConfig.fields && queryConfig.fields.length > 0) {
      filteredRows = filteredRows.map(row => {
        const selectedRow = {};
        queryConfig.fields.forEach(field => {
          if (row.hasOwnProperty(field)) {
            selectedRow[field] = row[field];
          }
        });
        return selectedRow;
      });
    }
    
    // Apply sorting
    if (queryConfig.orderBy && queryConfig.orderBy.length > 0) {
      filteredRows.sort((a, b) => {
        for (const orderField of queryConfig.orderBy) {
          let field, direction = 'ASC';
          
          if (typeof orderField === 'string') {
            const parts = orderField.split(' ');
            field = parts[0];
            direction = parts[1] || 'ASC';
          } else {
            field = orderField.field;
            direction = orderField.direction || 'ASC';
          }
          
          const aVal = a[field];
          const bVal = b[field];
          
          if (aVal < bVal) return direction === 'ASC' ? -1 : 1;
          if (aVal > bVal) return direction === 'ASC' ? 1 : -1;
        }
        return 0;
      });
    }
    
    // Apply pagination
    if (queryConfig.offset) {
      filteredRows = filteredRows.slice(queryConfig.offset);
    }
    
    if (queryConfig.limit) {
      filteredRows = filteredRows.slice(0, queryConfig.limit);
    }
    
    return filteredRows;
  }
  
  /**
   * Check if a row matches the filter criteria
   */
  matchesFilter(row, where) {
    if (!where) return true;
    
    for (const [field, condition] of Object.entries(where)) {
      const rowValue = row[field];
      
      if (condition === null) {
        if (rowValue !== null && rowValue !== undefined && rowValue !== '') {
          return false;
        }
      } else if (Array.isArray(condition)) {
        if (!condition.includes(rowValue)) {
          return false;
        }
      } else if (typeof condition === 'object' && condition.operator) {
        if (!this.evaluateCondition(rowValue, condition.operator, condition.value)) {
          return false;
        }
      } else {
        if (rowValue !== condition) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Evaluate condition with operator
   */
  evaluateCondition(value, operator, conditionValue) {
    switch (operator) {
      case '=':
      case '==':
        return value == conditionValue;
      case '!=':
      case '<>':
        return value != conditionValue;
      case '>':
        return value > conditionValue;
      case '>=':
        return value >= conditionValue;
      case '<':
        return value < conditionValue;
      case '<=':
        return value <= conditionValue;
      case 'LIKE':
        return value.toString().includes(conditionValue.toString());
      case 'ILIKE':
        return value.toString().toLowerCase().includes(conditionValue.toString().toLowerCase());
      default:
        return false;
    }
  }
  
  /**
   * Check if cached data should be used
   */
  shouldUseCache() {
    if (!this.cachedData) return false;
    
    if (!fs.existsSync(this.filePath)) return true;
    
    const stats = fs.statSync(this.filePath);
    return this.lastModified && stats.mtime <= this.lastModified;
  }
  
  /**
   * Clear cached data
   */
  clearCache() {
    this.cachedData = null;
    if (fs.existsSync(this.filePath)) {
      const stats = fs.statSync(this.filePath);
      this.lastModified = stats.mtime;
    }
  }
  
  /**
   * Archive processed file
   */
  async archiveFile() {
    if (!this.archiveProcessed || !fs.existsSync(this.filePath)) {
      return;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.basename(this.filePath, path.extname(this.filePath));
    const extension = path.extname(this.filePath);
    const archivePath = path.join(this.archiveDirectory, `${filename}_${timestamp}${extension}`);
    
    try {
      fs.copyFileSync(this.filePath, archivePath);
      logger.info(`CSV file archived: ${archivePath}`);
    } catch (error) {
      logger.error(`Failed to archive CSV file: ${error.message}`);
    }
  }
  
  /**
   * Close connection and cleanup
   */
  async disconnect() {
    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = null;
    }
    
    this.clearCache();
    
    logger.info(`CSV connector disconnected: ${this.filePath}`);
  }
  
  /**
   * Check health of CSV file connection
   */
  async healthCheck() {
    try {
      if (!fs.existsSync(this.filePath)) {
        return {
          status: 'healthy',
          message: 'CSV file ready for creation',
          details: { 
            filePath: path.basename(this.filePath),
            exists: false 
          }
        };
      }
      
      const stats = fs.statSync(this.filePath);
      
      // Test read access
      const startTime = Date.now();
      fs.accessSync(this.filePath, fs.constants.R_OK);
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        message: 'CSV file is accessible',
        responseTime: responseTime,
        details: {
          filePath: path.basename(this.filePath),
          exists: true,
          size: stats.size,
          lastModified: stats.mtime,
          schema: this.schema
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message,
        details: { filePath: path.basename(this.filePath) }
      };
    }
  }
  
  /**
   * Get CSV file schema
   */
  getSchema() {
    return {
      file: path.basename(this.filePath),
      path: this.filePath,
      delimiter: this.delimiter,
      headers: this.headers,
      encoding: this.encoding,
      schema: this.schema
    };
  }
  
  /**
   * Get public configuration
   */
  getPublicConfig() {
    return {
      filePath: path.basename(this.filePath),
      delimiter: this.delimiter,
      headers: this.headers,
      encoding: this.encoding,
      watchFile: this.watchFile,
      maxFileSize: this.maxFileSize
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
      supportsStreaming: true,
      maxConnections: 1,
      supportedOperations: ['read', 'write'],
      supportedDataTypes: ['string', 'integer', 'float', 'boolean', 'date'],
      additionalFeatures: ['FILE_WATCHING', 'CACHING', 'ARCHIVING']
    };
  }
}

module.exports = CsvConnector;