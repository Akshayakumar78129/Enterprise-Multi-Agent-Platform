const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const BaseConnector = require('../base/BaseConnector');
const logger = require('../../utils/logger');

/**
 * SQLite Database Connector
 * Provides connection and query capabilities for SQLite databases
 */
class SQLiteConnector extends BaseConnector {
  constructor(config) {
    super({
      ...config,
      type: 'sqlite',
      name: config.name || 'SQLite Database'
    });
    
    this.dbPath = config.dbPath;
    this.connection = null;
    this.readOnly = config.readOnly !== false; // Default to read-only
    this.connectionPool = [];
    this.maxConnections = config.maxConnections || 5;
    this.busyTimeout = config.busyTimeout || 30000; // 30 seconds
    this.journalMode = config.journalMode || 'WAL'; // Write-Ahead Logging for better performance
    
    if (!this.dbPath) {
      throw new Error('SQLite database path is required');
    }
    
    // Resolve relative paths
    this.dbPath = path.resolve(this.dbPath);
    
    logger.info(`SQLiteConnector initialized for database: ${this.dbPath}`);
  }
  
  /**
   * Establish connection to SQLite database
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        // Check if database file exists (for read operations)
        const fs = require('fs');
        if (!fs.existsSync(this.dbPath)) {
          throw new Error(`SQLite database file not found: ${this.dbPath}`);
        }
        
        // Determine open mode
        const openMode = this.readOnly 
          ? sqlite3.OPEN_READONLY 
          : sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;
        
        this.connection = new sqlite3.Database(this.dbPath, openMode, (err) => {
          if (err) {
            logger.error(`Failed to connect to SQLite database: ${err.message}`);
            return reject(err);
          }
          
          logger.info(`Connected to SQLite database: ${this.dbPath}`);
          
          // Configure database settings
          this.configureDatabaseSettings()
            .then(() => resolve())
            .catch(reject);
        });
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Configure database settings for optimal performance
   */
  async configureDatabaseSettings() {
    return new Promise((resolve, reject) => {
      const settings = [
        `PRAGMA busy_timeout = ${this.busyTimeout}`,
        `PRAGMA journal_mode = ${this.journalMode}`,
        'PRAGMA synchronous = NORMAL',
        'PRAGMA cache_size = 10000',
        'PRAGMA temp_store = MEMORY',
        'PRAGMA mmap_size = 268435456' // 256MB memory-mapped I/O
      ];
      
      let completed = 0;
      const total = settings.length;
      
      settings.forEach(setting => {
        this.connection.run(setting, (err) => {
          if (err) {
            logger.warn(`Failed to set SQLite setting: ${setting}`, err);
          }
          
          completed++;
          if (completed === total) {
            logger.debug('SQLite database settings configured');
            resolve();
          }
        });
      });
    });
  }
  
  /**
   * Execute query against SQLite database
   */
  async query(queryConfig) {
    if (!this.connection) {
      throw new Error('SQLite connection not established');
    }
    
    this.validateQueryConfig(queryConfig);
    
    const sql = this.buildSQLQuery(queryConfig);
    const params = this.extractParameters(queryConfig);
    
    logger.debug(`Executing SQLite query: ${sql}`, { params });
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      if (queryConfig.operation === 'select' || !queryConfig.operation) {
        // SELECT query - return all rows
        this.connection.all(sql, params, (err, rows) => {
          const executionTime = Date.now() - startTime;
          
          if (err) {
            logger.error(`SQLite query failed: ${err.message}`, { sql, params });
            return reject(err);
          }
          
          logger.debug(`SQLite query completed in ${executionTime}ms, returned ${rows.length} rows`);
          
          resolve({
            rows: rows,
            rowCount: rows.length,
            executionTime: executionTime,
            query: sql
          });
        });
      } else {
        // INSERT, UPDATE, DELETE - return changes info
        this.connection.run(sql, params, function(err) {
          const executionTime = Date.now() - startTime;
          
          if (err) {
            logger.error(`SQLite query failed: ${err.message}`, { sql, params });
            return reject(err);
          }
          
          logger.debug(`SQLite query completed in ${executionTime}ms, affected ${this.changes} rows`);
          
          resolve({
            rowCount: this.changes,
            lastID: this.lastID,
            executionTime: executionTime,
            query: sql
          });
        });
      }
    });
  }
  
  /**
   * Build SQL query from query configuration
   */
  buildSQLQuery(queryConfig) {
    if (queryConfig.sql) {
      // Raw SQL provided
      return queryConfig.sql;
    }
    
    const { table, fields, where, orderBy, limit, offset, operation } = queryConfig;
    
    if (!table) {
      throw new Error('Table name is required');
    }
    
    let sql = '';
    
    switch (operation || 'select') {
      case 'select':
        sql = this.buildSelectQuery(table, fields, where, orderBy, limit, offset);
        break;
      case 'insert':
        sql = this.buildInsertQuery(table, queryConfig.data);
        break;
      case 'update':
        sql = this.buildUpdateQuery(table, queryConfig.data, where);
        break;
      case 'delete':
        sql = this.buildDeleteQuery(table, where);
        break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
    
    return sql;
  }
  
  /**
   * Build SELECT query
   */
  buildSelectQuery(table, fields, where, orderBy, limit, offset) {
    let sql = 'SELECT ';
    
    // Fields
    if (fields && fields.length > 0) {
      sql += fields.map(field => `"${field}"`).join(', ');
    } else {
      sql += '*';
    }
    
    sql += ` FROM "${table}"`;
    
    // WHERE clause
    if (where) {
      sql += ' WHERE ' + this.buildWhereClause(where);
    }
    
    // ORDER BY clause
    if (orderBy && orderBy.length > 0) {
      sql += ' ORDER BY ' + orderBy.map(order => {
        if (typeof order === 'string') {
          const [field, direction] = order.split(' ');
          return `"${field}" ${direction || 'ASC'}`;
        } else {
          return `"${order}"`;
        }
      }).join(', ');
    }
    
    // LIMIT clause
    if (limit) {
      sql += ` LIMIT ${parseInt(limit)}`;
      
      if (offset) {
        sql += ` OFFSET ${parseInt(offset)}`;
      }
    }
    
    return sql;
  }
  
  /**
   * Build WHERE clause from conditions object
   */
  buildWhereClause(where) {
    const conditions = [];
    
    for (const [field, value] of Object.entries(where)) {
      if (value === null) {
        conditions.push(`"${field}" IS NULL`);
      } else if (Array.isArray(value)) {
        const placeholders = value.map(() => '?').join(', ');
        conditions.push(`"${field}" IN (${placeholders})`);
      } else if (typeof value === 'object' && value.operator) {
        // Complex condition: { operator: '>=', value: 100 }
        conditions.push(`"${field}" ${value.operator} ?`);
      } else {
        conditions.push(`"${field}" = ?`);
      }
    }
    
    return conditions.join(' AND ');
  }
  
  /**
   * Build INSERT query
   */
  buildInsertQuery(table, data) {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      throw new Error('Insert data is required');
    }
    
    const records = Array.isArray(data) ? data : [data];
    const fields = Object.keys(records[0]);
    
    const fieldList = fields.map(field => `"${field}"`).join(', ');
    const valuePlaceholders = fields.map(() => '?').join(', ');
    
    let sql = `INSERT INTO "${table}" (${fieldList}) VALUES `;
    
    const rowPlaceholders = records.map(() => `(${valuePlaceholders})`).join(', ');
    sql += rowPlaceholders;
    
    return sql;
  }
  
  /**
   * Build UPDATE query
   */
  buildUpdateQuery(table, data, where) {
    if (!data) {
      throw new Error('Update data is required');
    }
    
    const setFields = Object.keys(data).map(field => `"${field}" = ?`).join(', ');
    let sql = `UPDATE "${table}" SET ${setFields}`;
    
    if (where) {
      sql += ' WHERE ' + this.buildWhereClause(where);
    }
    
    return sql;
  }
  
  /**
   * Build DELETE query
   */
  buildDeleteQuery(table, where) {
    let sql = `DELETE FROM "${table}"`;
    
    if (where) {
      sql += ' WHERE ' + this.buildWhereClause(where);
    } else {
      throw new Error('DELETE queries must include WHERE clause for safety');
    }
    
    return sql;
  }
  
  /**
   * Extract parameters from query configuration
   */
  extractParameters(queryConfig) {
    const params = [];
    
    if (queryConfig.params) {
      return queryConfig.params;
    }
    
    const { where, data, operation } = queryConfig;
    
    // Add WHERE parameters
    if (where) {
      for (const value of Object.values(where)) {
        if (value !== null) {
          if (Array.isArray(value)) {
            params.push(...value);
          } else if (typeof value === 'object' && value.value !== undefined) {
            params.push(value.value);
          } else {
            params.push(value);
          }
        }
      }
    }
    
    // Add data parameters for INSERT/UPDATE
    if (data && (operation === 'insert' || operation === 'update')) {
      const records = Array.isArray(data) ? data : [data];
      
      if (operation === 'insert') {
        records.forEach(record => {
          params.push(...Object.values(record));
        });
      } else if (operation === 'update') {
        params.push(...Object.values(data));
      }
    }
    
    return params;
  }
  
  /**
   * Close database connection
   */
  async disconnect() {
    if (this.connection) {
      return new Promise((resolve, reject) => {
        this.connection.close((err) => {
          if (err) {
            logger.error(`Error closing SQLite connection: ${err.message}`);
            return reject(err);
          }
          
          this.connection = null;
          logger.info(`SQLite connection closed: ${this.dbPath}`);
          resolve();
        });
      });
    }
  }
  
  /**
   * Check health of SQLite connection
   */
  async healthCheck() {
    try {
      if (!this.connection) {
        return {
          status: 'unhealthy',
          message: 'No connection established',
          details: { dbPath: this.dbPath }
        };
      }
      
      // Test connection with a simple query
      const startTime = Date.now();
      await this.query({ sql: 'SELECT 1 as test' });
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        message: 'SQLite connection is healthy',
        responseTime: responseTime,
        details: {
          dbPath: this.dbPath,
          readOnly: this.readOnly,
          journalMode: this.journalMode
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message,
        details: { dbPath: this.dbPath }
      };
    }
  }
  
  /**
   * Get database schema information
   */
  getSchema() {
    return new Promise((resolve, reject) => {
      if (!this.connection) {
        return reject(new Error('No connection established'));
      }
      
      // Get table information
      this.connection.all(
        "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
        (err, tables) => {
          if (err) {
            return reject(err);
          }
          
          const schema = {
            database: this.dbPath,
            tables: {}
          };
          
          if (tables.length === 0) {
            return resolve(schema);
          }
          
          let completed = 0;
          
          tables.forEach(table => {
            // Get column information for each table
            this.connection.all(`PRAGMA table_info("${table.name}")`, (err, columns) => {
              if (err) {
                logger.warn(`Failed to get column info for table ${table.name}:`, err);
              } else {
                schema.tables[table.name] = {
                  createSQL: table.sql,
                  columns: columns.map(col => ({
                    name: col.name,
                    type: col.type,
                    nullable: !col.notnull,
                    defaultValue: col.dflt_value,
                    primaryKey: !!col.pk
                  }))
                };
              }
              
              completed++;
              if (completed === tables.length) {
                resolve(schema);
              }
            });
          });
        }
      );
    });
  }
  
  /**
   * Get public configuration (without sensitive data)
   */
  getPublicConfig() {
    return {
      dbPath: path.basename(this.dbPath), // Only show filename for security
      readOnly: this.readOnly,
      maxConnections: this.maxConnections,
      busyTimeout: this.busyTimeout,
      journalMode: this.journalMode
    };
  }
  
  /**
   * Validate query configuration
   */
  validateQueryConfig(queryConfig) {
    super.validateQueryConfig(queryConfig);
    
    // SQLite-specific validations
    if (queryConfig.operation && !['select', 'insert', 'update', 'delete'].includes(queryConfig.operation)) {
      throw new Error(`Unsupported operation for SQLite: ${queryConfig.operation}`);
    }
    
    // Enforce read-only mode
    if (this.readOnly && queryConfig.operation && queryConfig.operation !== 'select') {
      throw new Error('Write operations not allowed in read-only mode');
    }
    
    return true;
  }
  
  /**
   * Get connector capabilities
   */
  getCapabilities() {
    return {
      supportsTransactions: true,
      supportsAggregation: true,
      supportsJoins: true,
      supportsStreaming: false,
      maxConnections: this.maxConnections,
      supportedOperations: this.readOnly ? ['read'] : ['read', 'write'],
      supportedDataTypes: ['TEXT', 'INTEGER', 'REAL', 'BLOB', 'NULL'],
      supportedIndexes: true,
      supportedConstraints: ['PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK', 'NOT NULL']
    };
  }
}

module.exports = SQLiteConnector;