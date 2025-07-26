const { Pool, Client } = require('pg');
const BaseConnector = require('../base/BaseConnector');
const logger = require('../../utils/logger');

/**
 * PostgreSQL Database Connector
 * Provides connection and query capabilities for PostgreSQL databases
 */
class PostgreSQLConnector extends BaseConnector {
  constructor(config) {
    super({
      ...config,
      type: 'postgresql',
      name: config.name || 'PostgreSQL Database'
    });
    
    this.connectionConfig = {
      host: config.host || 'localhost',
      port: config.port || 5432,
      database: config.database,
      user: config.user || config.username,
      password: config.password,
      ssl: config.ssl || false,
      connectionTimeoutMillis: config.connectionTimeout || 5000,
      idleTimeoutMillis: config.idleTimeout || 30000,
      max: config.maxConnections || 20, // Maximum number of clients in the pool
      min: config.minConnections || 2,  // Minimum number of clients in the pool
      acquireTimeoutMillis: config.acquireTimeout || 60000,
      createTimeoutMillis: config.createTimeout || 30000,
      destroyTimeoutMillis: config.destroyTimeout || 5000,
      reapIntervalMillis: config.reapInterval || 1000,
      createRetryIntervalMillis: config.createRetryInterval || 200
    };
    
    this.pool = null;
    this.readOnly = config.readOnly || false;
    this.schema = config.schema || 'public';
    this.enableSSL = config.enableSSL || false;
    
    if (!this.connectionConfig.database || !this.connectionConfig.user) {
      throw new Error('PostgreSQL database name and user are required');
    }
    
    logger.info(`PostgreSQLConnector initialized for database: ${this.connectionConfig.database}@${this.connectionConfig.host}:${this.connectionConfig.port}`);
  }
  
  /**
   * Establish connection pool to PostgreSQL database
   */
  async connect() {
    try {
      // Configure SSL if enabled
      if (this.enableSSL) {
        this.connectionConfig.ssl = {
          rejectUnauthorized: false, // For development - should be true in production
          ca: process.env.POSTGRES_SSL_CA,
          key: process.env.POSTGRES_SSL_KEY,
          cert: process.env.POSTGRES_SSL_CERT
        };
      }
      
      this.pool = new Pool(this.connectionConfig);
      
      // Set up pool event listeners
      this.setupPoolEventListeners();
      
      // Test the connection
      const client = await this.pool.connect();
      try {
        const result = await client.query('SELECT NOW() as current_time, version() as version');
        logger.info(`Connected to PostgreSQL database: ${this.connectionConfig.database}`, {
          serverVersion: result.rows[0].version.split(' ')[1],
          currentTime: result.rows[0].current_time
        });
      } finally {
        client.release();
      }
      
      // Set default schema if specified
      if (this.schema !== 'public') {
        await this.setSearchPath();
      }
      
    } catch (error) {
      logger.error(`Failed to connect to PostgreSQL database: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Set up pool event listeners for monitoring
   */
  setupPoolEventListeners() {
    this.pool.on('connect', (client) => {
      logger.debug('New PostgreSQL client connected to database');
      this.emit('client-connected', { id: this.id, clientCount: this.pool.totalCount });
    });
    
    this.pool.on('acquire', (client) => {
      logger.debug('PostgreSQL client acquired from pool');
    });
    
    this.pool.on('remove', (client) => {
      logger.debug('PostgreSQL client removed from pool');
      this.emit('client-removed', { id: this.id, clientCount: this.pool.totalCount });
    });
    
    this.pool.on('error', (err, client) => {
      logger.error('PostgreSQL pool error:', err);
      this.emit('pool-error', { id: this.id, error: err.message });
    });
  }
  
  /**
   * Set search path for schema
   */
  async setSearchPath() {
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO "${this.schema}", public`);
      logger.debug(`Search path set to schema: ${this.schema}`);
    } finally {
      client.release();
    }
  }
  
  /**
   * Execute query against PostgreSQL database
   */
  async query(queryConfig) {
    if (!this.pool) {
      throw new Error('PostgreSQL connection pool not established');
    }
    
    this.validateQueryConfig(queryConfig);
    
    const sql = this.buildSQLQuery(queryConfig);
    const params = this.extractParameters(queryConfig);
    
    logger.debug(`Executing PostgreSQL query: ${sql}`, { params: params?.length });
    
    const client = await this.pool.connect();
    const startTime = Date.now();
    
    try {
      // Begin transaction if specified
      if (queryConfig.transaction) {
        await client.query('BEGIN');
      }
      
      const result = await client.query(sql, params);
      const executionTime = Date.now() - startTime;
      
      // Commit transaction if specified
      if (queryConfig.transaction) {
        await client.query('COMMIT');
      }
      
      logger.debug(`PostgreSQL query completed in ${executionTime}ms, affected ${result.rowCount} rows`);
      
      return {
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields,
        executionTime: executionTime,
        query: sql
      };
      
    } catch (error) {
      // Rollback transaction on error
      if (queryConfig.transaction) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          logger.error('PostgreSQL rollback failed:', rollbackError);
        }
      }
      
      logger.error(`PostgreSQL query failed: ${error.message}`, { sql, params });
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Execute multiple queries in a transaction
   */
  async transaction(queries) {
    if (!this.pool) {
      throw new Error('PostgreSQL connection pool not established');
    }
    
    const client = await this.pool.connect();
    const startTime = Date.now();
    
    try {
      await client.query('BEGIN');
      
      const results = [];
      
      for (const queryConfig of queries) {
        const sql = this.buildSQLQuery(queryConfig);
        const params = this.extractParameters(queryConfig);
        
        const result = await client.query(sql, params);
        results.push({
          rows: result.rows,
          rowCount: result.rowCount,
          fields: result.fields,
          query: sql
        });
      }
      
      await client.query('COMMIT');
      
      const executionTime = Date.now() - startTime;
      logger.debug(`PostgreSQL transaction completed in ${executionTime}ms, ${queries.length} queries executed`);
      
      return {
        results: results,
        totalExecutionTime: executionTime,
        queriesExecuted: queries.length
      };
      
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        logger.error('PostgreSQL transaction rollback failed:', rollbackError);
      }
      
      logger.error(`PostgreSQL transaction failed: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Build SQL query from query configuration
   */
  buildSQLQuery(queryConfig) {
    if (queryConfig.sql) {
      // Raw SQL provided
      return queryConfig.sql;
    }
    
    const { table, fields, where, orderBy, limit, offset, operation, joins } = queryConfig;
    
    if (!table) {
      throw new Error('Table name is required');
    }
    
    let sql = '';
    
    switch (operation || 'select') {
      case 'select':
        sql = this.buildSelectQuery(table, fields, where, orderBy, limit, offset, joins);
        break;
      case 'insert':
        sql = this.buildInsertQuery(table, queryConfig.data, queryConfig.returning);
        break;
      case 'update':
        sql = this.buildUpdateQuery(table, queryConfig.data, where, queryConfig.returning);
        break;
      case 'delete':
        sql = this.buildDeleteQuery(table, where, queryConfig.returning);
        break;
      case 'upsert':
        sql = this.buildUpsertQuery(table, queryConfig.data, queryConfig.conflictColumns);
        break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
    
    return sql;
  }
  
  /**
   * Build SELECT query with PostgreSQL-specific features
   */
  buildSelectQuery(table, fields, where, orderBy, limit, offset, joins) {
    let sql = 'SELECT ';
    
    // Fields
    if (fields && fields.length > 0) {
      sql += fields.map(field => this.escapeIdentifier(field)).join(', ');
    } else {
      sql += '*';
    }
    
    sql += ` FROM ${this.escapeIdentifier(table)}`;
    
    // JOIN clauses
    if (joins && joins.length > 0) {
      joins.forEach(join => {
        const joinType = join.type || 'INNER';
        sql += ` ${joinType} JOIN ${this.escapeIdentifier(join.table)} ON ${join.condition}`;
      });
    }
    
    // WHERE clause
    if (where) {
      sql += ' WHERE ' + this.buildWhereClause(where);
    }
    
    // ORDER BY clause
    if (orderBy && orderBy.length > 0) {
      sql += ' ORDER BY ' + orderBy.map(order => {
        if (typeof order === 'string') {
          return this.escapeIdentifier(order);
        } else {
          const [field, direction] = order.split(' ');
          return `${this.escapeIdentifier(field)} ${direction || 'ASC'}`;
        }
      }).join(', ');
    }
    
    // LIMIT clause
    if (limit) {
      sql += ` LIMIT ${parseInt(limit)}`;
    }
    
    // OFFSET clause
    if (offset) {
      sql += ` OFFSET ${parseInt(offset)}`;
    }
    
    return sql;
  }
  
  /**
   * Build INSERT query with RETURNING support
   */
  buildInsertQuery(table, data, returning) {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      throw new Error('Insert data is required');
    }
    
    const records = Array.isArray(data) ? data : [data];
    const fields = Object.keys(records[0]);
    
    const fieldList = fields.map(field => this.escapeIdentifier(field)).join(', ');
    
    let sql = `INSERT INTO ${this.escapeIdentifier(table)} (${fieldList}) VALUES `;
    
    const valuePlaceholders = records.map((_, index) => {
      const placeholders = fields.map((_, fieldIndex) => `$${index * fields.length + fieldIndex + 1}`);
      return `(${placeholders.join(', ')})`;
    }).join(', ');
    
    sql += valuePlaceholders;
    
    // RETURNING clause
    if (returning) {
      const returnFields = Array.isArray(returning) ? returning : [returning];
      sql += ` RETURNING ${returnFields.map(field => this.escapeIdentifier(field)).join(', ')}`;
    }
    
    return sql;
  }
  
  /**
   * Build UPSERT query (INSERT ... ON CONFLICT)
   */
  buildUpsertQuery(table, data, conflictColumns) {
    const insertSQL = this.buildInsertQuery(table, data);
    
    if (conflictColumns && conflictColumns.length > 0) {
      const conflictFields = conflictColumns.map(col => this.escapeIdentifier(col)).join(', ');
      const updateFields = Object.keys(data).map(field => 
        `${this.escapeIdentifier(field)} = EXCLUDED.${this.escapeIdentifier(field)}`
      ).join(', ');
      
      return `${insertSQL} ON CONFLICT (${conflictFields}) DO UPDATE SET ${updateFields}`;
    }
    
    return `${insertSQL} ON CONFLICT DO NOTHING`;
  }
  
  /**
   * Build WHERE clause with PostgreSQL-specific operators
   */
  buildWhereClause(where) {
    const conditions = [];
    let paramIndex = 1;
    
    for (const [field, value] of Object.entries(where)) {
      const escapedField = this.escapeIdentifier(field);
      
      if (value === null) {
        conditions.push(`${escapedField} IS NULL`);
      } else if (Array.isArray(value)) {
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        conditions.push(`${escapedField} IN (${placeholders})`);
      } else if (typeof value === 'object' && value.operator) {
        // Complex condition with operators
        if (value.operator === 'ILIKE' || value.operator === 'LIKE') {
          conditions.push(`${escapedField} ${value.operator} $${paramIndex++}`);
        } else if (value.operator === 'BETWEEN') {
          conditions.push(`${escapedField} BETWEEN $${paramIndex++} AND $${paramIndex++}`);
        } else {
          conditions.push(`${escapedField} ${value.operator} $${paramIndex++}`);
        }
      } else {
        conditions.push(`${escapedField} = $${paramIndex++}`);
      }
    }
    
    return conditions.join(' AND ');
  }
  
  /**
   * Escape PostgreSQL identifiers
   */
  escapeIdentifier(identifier) {
    return `"${identifier.replace(/"/g, '""')}"`;
  }
  
  /**
   * Extract and flatten parameters for PostgreSQL
   */
  extractParameters(queryConfig) {
    if (queryConfig.params) {
      return queryConfig.params;
    }
    
    const params = [];
    const { where, data, operation } = queryConfig;
    
    // Add data parameters first for INSERT/UPDATE
    if (data && (operation === 'insert' || operation === 'update' || operation === 'upsert')) {
      const records = Array.isArray(data) ? data : [data];
      
      if (operation === 'insert' || operation === 'upsert') {
        records.forEach(record => {
          params.push(...Object.values(record));
        });
      } else if (operation === 'update') {
        params.push(...Object.values(data));
      }
    }
    
    // Add WHERE parameters
    if (where) {
      for (const value of Object.values(where)) {
        if (value !== null) {
          if (Array.isArray(value)) {
            params.push(...value);
          } else if (typeof value === 'object' && value.value !== undefined) {
            if (value.operator === 'BETWEEN' && Array.isArray(value.value)) {
              params.push(...value.value);
            } else {
              params.push(value.value);
            }
          } else {
            params.push(value);
          }
        }
      }
    }
    
    return params;
  }
  
  /**
   * Close connection pool
   */
  async disconnect() {
    if (this.pool) {
      try {
        await this.pool.end();
        this.pool = null;
        logger.info(`PostgreSQL connection pool closed: ${this.connectionConfig.database}`);
      } catch (error) {
        logger.error(`Error closing PostgreSQL connection pool: ${error.message}`);
        throw error;
      }
    }
  }
  
  /**
   * Check health of PostgreSQL connection pool
   */
  async healthCheck() {
    try {
      if (!this.pool) {
        return {
          status: 'unhealthy',
          message: 'No connection pool established',
          details: { database: this.connectionConfig.database }
        };
      }
      
      const startTime = Date.now();
      const client = await this.pool.connect();
      
      try {
        await client.query('SELECT 1 as test');
        const responseTime = Date.now() - startTime;
        
        return {
          status: 'healthy',
          message: 'PostgreSQL connection pool is healthy',
          responseTime: responseTime,
          details: {
            database: this.connectionConfig.database,
            host: this.connectionConfig.host,
            port: this.connectionConfig.port,
            schema: this.schema,
            totalConnections: this.pool.totalCount,
            idleConnections: this.pool.idleCount,
            waitingConnections: this.pool.waitingCount
          }
        };
      } finally {
        client.release();
      }
      
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message,
        details: { database: this.connectionConfig.database }
      };
    }
  }
  
  /**
   * Get database schema information
   */
  async getSchema() {
    if (!this.pool) {
      throw new Error('No connection pool established');
    }
    
    const client = await this.pool.connect();
    
    try {
      // Get all tables in the schema
      const tablesResult = await client.query(`
        SELECT table_name, table_type 
        FROM information_schema.tables 
        WHERE table_schema = $1 
        ORDER BY table_name
      `, [this.schema]);
      
      const schema = {
        database: this.connectionConfig.database,
        schema: this.schema,
        tables: {}
      };
      
      // Get column information for each table
      for (const table of tablesResult.rows) {
        const columnsResult = await client.query(`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position
        `, [this.schema, table.table_name]);
        
        schema.tables[table.table_name] = {
          type: table.table_type,
          columns: columnsResult.rows.map(col => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            defaultValue: col.column_default,
            maxLength: col.character_maximum_length,
            precision: col.numeric_precision,
            scale: col.numeric_scale
          }))
        };
      }
      
      return schema;
      
    } finally {
      client.release();
    }
  }
  
  /**
   * Get public configuration
   */
  getPublicConfig() {
    return {
      host: this.connectionConfig.host,
      port: this.connectionConfig.port,
      database: this.connectionConfig.database,
      schema: this.schema,
      readOnly: this.readOnly,
      maxConnections: this.connectionConfig.max,
      minConnections: this.connectionConfig.min,
      ssl: !!this.connectionConfig.ssl
    };
  }
  
  /**
   * Get connector capabilities
   */
  getCapabilities() {
    return {
      supportsTransactions: true,
      supportsAggregation: true,
      supportsJoins: true,
      supportsStreaming: true,
      maxConnections: this.connectionConfig.max,
      supportedOperations: this.readOnly ? ['read'] : ['read', 'write'],
      supportedDataTypes: [
        'INTEGER', 'BIGINT', 'SMALLINT', 'DECIMAL', 'NUMERIC', 'REAL', 'DOUBLE PRECISION',
        'VARCHAR', 'CHAR', 'TEXT', 'BOOLEAN', 'DATE', 'TIME', 'TIMESTAMP', 'INTERVAL',
        'UUID', 'JSON', 'JSONB', 'ARRAY', 'BYTEA'
      ],
      supportedIndexes: true,
      supportedConstraints: ['PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK', 'NOT NULL', 'EXCLUDE'],
      additionalFeatures: ['UPSERT', 'RETURNING', 'CTE', 'WINDOW_FUNCTIONS', 'FULL_TEXT_SEARCH']
    };
  }
}

module.exports = PostgreSQLConnector;