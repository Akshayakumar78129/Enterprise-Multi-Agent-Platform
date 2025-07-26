const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const BaseConnector = require('../base/BaseConnector');
const logger = require('../../utils/logger');

/**
 * Excel File Connector
 * Provides read/write capabilities for Excel files (.xlsx, .xls)
 */
class ExcelConnector extends BaseConnector {
  constructor(config) {
    super({
      ...config,
      type: 'excel',
      name: config.name || 'Excel File'
    });
    
    this.filePath = config.filePath || config.path;
    this.worksheet = config.worksheet || config.sheet || 0; // Default to first sheet
    this.headers = config.headers !== false; // Default to true
    this.maxFileSize = config.maxFileSize || 100 * 1024 * 1024; // 100MB default
    this.readOnly = config.readOnly || false;
    this.dateFormat = config.dateFormat || 'YYYY-MM-DD';
    this.skipEmptyRows = config.skipEmptyRows !== false; // Default to true
    this.watchFile = config.watchFile || false;
    this.archiveProcessed = config.archiveProcessed || false;
    this.archiveDirectory = config.archiveDirectory || path.join(path.dirname(this.filePath), 'archive');
    
    this.workbook = null;
    this.cachedData = null;
    this.lastModified = null;
    this.schema = null;
    this.fileWatcher = null;
    
    if (!this.filePath) {
      throw new Error('Excel file path is required');
    }
    
    // Resolve relative paths
    this.filePath = path.resolve(this.filePath);
    
    logger.info(`ExcelConnector initialized for file: ${this.filePath}`);
  }
  
  /**
   * Initialize Excel file connection
   */
  async connect() {
    try {
      // Check if file exists
      if (fs.existsSync(this.filePath)) {
        const stats = fs.statSync(this.filePath);
        
        // Check file size
        if (stats.size > this.maxFileSize) {
          throw new Error(`Excel file too large: ${stats.size} bytes (max: ${this.maxFileSize})`);
        }
        
        this.lastModified = stats.mtime;
        
        // Load workbook
        await this.loadWorkbook();
        
        // Parse schema
        await this.parseSchema();
        
        logger.info(`Connected to Excel file: ${this.filePath} (${stats.size} bytes)`);
      } else if (!this.readOnly) {
        // File doesn't exist - will be created on write
        logger.info(`Excel file not found, will be created on write: ${this.filePath}`);
      } else {
        throw new Error(`Excel file not found: ${this.filePath}`);
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
      logger.error(`Failed to connect to Excel file: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load Excel workbook
   */
  async loadWorkbook() {
    try {
      this.workbook = XLSX.readFile(this.filePath, {
        type: 'file',
        cellDates: true,
        cellNF: false,
        cellText: false
      });
      
      logger.debug(`Excel workbook loaded with ${this.workbook.SheetNames.length} sheets`);
    } catch (error) {
      throw new Error(`Failed to load Excel workbook: ${error.message}`);
    }
  }
  
  /**
   * Set up file watcher for automatic updates
   */
  setupFileWatcher() {
    this.fileWatcher = fs.watch(this.filePath, (eventType, filename) => {
      if (eventType === 'change') {
        logger.debug(`Excel file changed: ${this.filePath}`);
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
   * Parse Excel schema from worksheet
   */
  async parseSchema() {
    if (!this.workbook) return;
    
    const worksheetName = this.getWorksheetName();
    const worksheet = this.workbook.Sheets[worksheetName];
    
    if (!worksheet) {
      throw new Error(`Worksheet '${worksheetName}' not found`);
    }
    
    // Get worksheet range
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    
    if (this.headers && range.e.r > 0) {
      // Read header row
      const headers = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
        const cell = worksheet[cellAddress];
        headers.push(cell ? cell.v : `Column${col + 1}`);
      }
      
      // Sample first data row for type inference
      const firstDataRow = {};
      if (range.e.r > range.s.r) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: range.s.r + 1, c: col });
          const cell = worksheet[cellAddress];
          firstDataRow[headers[col - range.s.c]] = cell ? cell.v : null;
        }
      }
      
      this.schema = {
        worksheet: worksheetName,
        range: worksheet['!ref'],
        columns: headers.map(header => ({
          name: header,
          type: this.inferDataType(firstDataRow[header])
        }))
      };
    } else {
      // No headers, use column letters
      const columnCount = range.e.c - range.s.c + 1;
      this.schema = {
        worksheet: worksheetName,
        range: worksheet['!ref'],
        columns: Array.from({ length: columnCount }, (_, index) => ({
          name: XLSX.utils.encode_col(index),
          type: 'string'
        }))
      };
    }
  }
  
  /**
   * Get worksheet name (handle both string and index)
   */
  getWorksheetName() {
    if (!this.workbook) {
      throw new Error('Workbook not loaded');
    }
    
    if (typeof this.worksheet === 'string') {
      return this.worksheet;
    } else if (typeof this.worksheet === 'number') {
      const sheetName = this.workbook.SheetNames[this.worksheet];
      if (!sheetName) {
        throw new Error(`Worksheet index ${this.worksheet} not found`);
      }
      return sheetName;
    } else {
      return this.workbook.SheetNames[0]; // Default to first sheet
    }
  }
  
  /**
   * Infer data type from sample value
   */
  inferDataType(value) {
    if (value === null || value === undefined) {
      return 'string';
    }
    
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'float';
    }
    
    if (typeof value === 'boolean') {
      return 'boolean';
    }
    
    if (value instanceof Date) {
      return 'date';
    }
    
    if (typeof value === 'string') {
      // Check for number strings
      if (!isNaN(value) && !isNaN(parseFloat(value))) {
        return value.includes('.') ? 'float' : 'integer';
      }
      
      // Check for date strings
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
        return 'date';
      }
    }
    
    return 'string';
  }
  
  /**
   * Execute query against Excel file
   */
  async query(queryConfig) {
    this.validateQueryConfig(queryConfig);
    
    const operation = queryConfig.operation || 'select';
    
    logger.debug(`Executing Excel query: ${operation}`);
    
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
          throw new Error(`Unsupported operation for Excel: ${operation}`);
      }
      
      const executionTime = Date.now() - startTime;
      
      logger.debug(`Excel query completed in ${executionTime}ms`);
      
      return {
        ...result,
        executionTime: executionTime,
        filePath: this.filePath,
        worksheet: this.getWorksheetName()
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`Excel query failed after ${executionTime}ms: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Select data from Excel worksheet
   */
  async selectData(queryConfig) {
    // Use cache if available and valid
    if (this.shouldUseCache()) {
      const filteredData = this.applyFilters(this.cachedData, queryConfig);
      return {
        rows: filteredData,
        rowCount: filteredData.length,
        fromCache: true
      };
    }
    
    // Reload workbook if needed
    if (!this.workbook && fs.existsSync(this.filePath)) {
      await this.loadWorkbook();
    }
    
    if (!this.workbook) {
      return {
        rows: [],
        rowCount: 0,
        totalRows: 0,
        fromCache: false
      };
    }
    
    const worksheetName = this.getWorksheetName();
    const worksheet = this.workbook.Sheets[worksheetName];
    
    if (!worksheet) {
      throw new Error(`Worksheet '${worksheetName}' not found`);
    }
    
    // Convert worksheet to JSON
    const jsonOptions = {
      header: this.headers ? 1 : undefined,
      defval: null,
      blankrows: !this.skipEmptyRows,
      raw: false,
      dateNF: this.dateFormat
    };
    
    const rows = XLSX.utils.sheet_to_json(worksheet, jsonOptions);
    
    // Cache the data
    this.cachedData = rows;
    
    // Apply filters, sorting, and limiting
    const filteredData = this.applyFilters(rows, queryConfig);
    
    return {
      rows: filteredData,
      rowCount: filteredData.length,
      totalRows: rows.length,
      fromCache: false
    };
  }
  
  /**
   * Insert data into Excel worksheet
   */
  async insertData(queryConfig) {
    if (this.readOnly) {
      throw new Error('Write operations not allowed in read-only mode');
    }
    
    const data = queryConfig.data;
    if (!data) {
      throw new Error('Insert data is required');
    }
    
    const records = Array.isArray(data) ? data : [data];
    
    // Load existing data
    const existingResult = await this.selectData({ operation: 'select' });
    const allRows = [...existingResult.rows, ...records];
    
    // Write back to Excel
    await this.writeAllData(allRows);
    
    return {
      rowCount: records.length,
      inserted: records.length
    };
  }
  
  /**
   * Update data in Excel worksheet
   */
  async updateData(queryConfig) {
    if (this.readOnly) {
      throw new Error('Write operations not allowed in read-only mode');
    }
    
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
    
    // Write back to Excel
    if (updatedCount > 0) {
      await this.writeAllData(rows);
    }
    
    return {
      rowCount: updatedCount,
      updated: updatedCount
    };
  }
  
  /**
   * Delete data from Excel worksheet
   */
  async deleteData(queryConfig) {
    if (this.readOnly) {
      throw new Error('Write operations not allowed in read-only mode');
    }
    
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
    
    // Write back to Excel
    if (deletedCount > 0) {
      await this.writeAllData(remainingRows);
    }
    
    return {
      rowCount: deletedCount,
      deleted: deletedCount
    };
  }
  
  /**
   * Write all data to Excel worksheet
   */
  async writeAllData(rows) {
    try {
      // Create new workbook if it doesn't exist
      if (!this.workbook) {
        this.workbook = XLSX.utils.book_new();
      }
      
      const worksheetName = this.getWorksheetName() || 'Sheet1';
      
      // Create worksheet from data
      const worksheet = XLSX.utils.json_to_sheet(rows, {
        header: this.headers ? Object.keys(rows[0] || {}) : undefined,
        skipHeader: !this.headers
      });
      
      // Set column widths (optional)
      const colWidths = [];
      if (rows.length > 0) {
        Object.keys(rows[0]).forEach(() => {
          colWidths.push({ wch: 15 }); // 15 characters wide
        });
      }
      worksheet['!cols'] = colWidths;
      
      // Update or add worksheet
      this.workbook.Sheets[worksheetName] = worksheet;
      
      // Add to sheet names if new
      if (!this.workbook.SheetNames.includes(worksheetName)) {
        this.workbook.SheetNames.push(worksheetName);
      }
      
      // Write file
      XLSX.writeFile(this.workbook, this.filePath, {
        bookType: 'xlsx',
        type: 'file'
      });
      
      this.clearCache();
      
      logger.debug(`Excel file written: ${this.filePath}`);
      
    } catch (error) {
      throw new Error(`Failed to write Excel file: ${error.message}`);
    }
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
    this.workbook = null;
    
    if (fs.existsSync(this.filePath)) {
      const stats = fs.statSync(this.filePath);
      this.lastModified = stats.mtime;
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
    
    logger.info(`Excel connector disconnected: ${this.filePath}`);
  }
  
  /**
   * Check health of Excel file connection
   */
  async healthCheck() {
    try {
      if (!fs.existsSync(this.filePath)) {
        return {
          status: this.readOnly ? 'unhealthy' : 'healthy',
          message: this.readOnly ? 'Excel file not found' : 'Excel file ready for creation',
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
      
      // Test write access if not read-only
      if (!this.readOnly) {
        fs.accessSync(this.filePath, fs.constants.W_OK);
      }
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        message: 'Excel file is accessible',
        responseTime: responseTime,
        details: {
          filePath: path.basename(this.filePath),
          exists: true,
          size: stats.size,
          lastModified: stats.mtime,
          readOnly: this.readOnly,
          worksheets: this.workbook?.SheetNames || []
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
   * Get Excel file schema
   */
  getSchema() {
    return {
      file: path.basename(this.filePath),
      path: this.filePath,
      worksheets: this.workbook?.SheetNames || [],
      currentWorksheet: this.getWorksheetName(),
      headers: this.headers,
      schema: this.schema
    };
  }
  
  /**
   * Get public configuration
   */
  getPublicConfig() {
    return {
      filePath: path.basename(this.filePath),
      worksheet: this.worksheet,
      headers: this.headers,
      readOnly: this.readOnly,
      watchFile: this.watchFile,
      maxFileSize: this.maxFileSize,
      dateFormat: this.dateFormat
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
      supportedOperations: this.readOnly ? ['read'] : ['read', 'write'],
      supportedDataTypes: ['string', 'integer', 'float', 'boolean', 'date'],
      supportedFormats: ['.xlsx', '.xls'],
      additionalFeatures: ['MULTIPLE_WORKSHEETS', 'FILE_WATCHING', 'CACHING']
    };
  }
}

module.exports = ExcelConnector;