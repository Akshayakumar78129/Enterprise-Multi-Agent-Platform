# Connector Development Guide

## Overview

The API Gateway uses a pluggable connector architecture that allows integration with various data sources including databases, REST APIs, file systems, and streaming services. This guide provides comprehensive instructions for developing custom connectors.

## Connector Architecture

### Base Connector Interface

All connectors must extend the `BaseConnector` class and implement the required interface methods:

```javascript
// api-gateway/connectors/base/BaseConnector.js
class BaseConnector {
  constructor(config) {
    this.config = config;
    this.name = config.name;
    this.type = config.type;
    this.connected = false;
    this.lastHealthCheck = null;
    this.healthStatus = 'unknown';
  }

  // Required methods to implement
  async connect() {
    throw new Error('connect() method must be implemented');
  }

  async disconnect() {
    throw new Error('disconnect() method must be implemented');
  }

  async query(queryConfig) {
    throw new Error('query() method must be implemented');
  }

  async healthCheck() {
    throw new Error('healthCheck() method must be implemented');
  }

  getSchema() {
    throw new Error('getSchema() method must be implemented');
  }

  // Optional methods with default implementations
  async initialize() {
    return this.connect();
  }

  async cleanup() {
    return this.disconnect();
  }

  validateQuery(queryConfig) {
    return { valid: true };
  }

  transformResponse(data) {
    return data;
  }
}
```

## Creating a New Connector

### Step 1: Choose Connector Type

Determine which category your connector fits into:

- **Database Connectors** (`/connectors/database/`): SQL/NoSQL databases
- **API Connectors** (`/connectors/api/`): REST/GraphQL APIs
- **File Connectors** (`/connectors/file/`): CSV, Excel, JSON files
- **Stream Connectors** (`/connectors/stream/`): Real-time data streams

### Step 2: Create Connector Class

Create a new file in the appropriate directory:

```javascript
// Example: api-gateway/connectors/database/CustomDatabaseConnector.js
const BaseConnector = require('../base/BaseConnector');
const { logger } = require('../../monitoring');

class CustomDatabaseConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.connectionPool = null;
    this.queryTimeout = config.queryTimeout || 30000;
    this.maxRetries = config.maxRetries || 3;
  }

  async connect() {
    try {
      logger.info(`Connecting to ${this.name}`, {
        connector: this.name,
        type: this.type,
        host: this.config.host
      });

      // Initialize your connection here
      this.connectionPool = await this.createConnectionPool();
      this.connected = true;
      this.healthStatus = 'healthy';

      logger.info(`Successfully connected to ${this.name}`);
      return { success: true, connected: true };

    } catch (error) {
      this.connected = false;
      this.healthStatus = 'unhealthy';
      logger.error(`Failed to connect to ${this.name}`, {
        error: error.message,
        connector: this.name
      });
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connectionPool) {
        await this.connectionPool.end();
        this.connectionPool = null;
      }
      this.connected = false;
      logger.info(`Disconnected from ${this.name}`);
    } catch (error) {
      logger.error(`Error disconnecting from ${this.name}`, {
        error: error.message
      });
    }
  }

  async query(queryConfig) {
    if (!this.connected) {
      throw new Error(`Connector ${this.name} is not connected`);
    }

    const startTime = Date.now();
    let attempt = 0;

    while (attempt < this.maxRetries) {
      try {
        // Validate query
        const validation = this.validateQuery(queryConfig);
        if (!validation.valid) {
          throw new Error(`Invalid query: ${validation.error}`);
        }

        // Execute query with timeout
        const result = await Promise.race([
          this.executeQuery(queryConfig),
          this.timeoutPromise(this.queryTimeout)
        ]);

        const executionTime = Date.now() - startTime;

        logger.info(`Query executed successfully`, {
          connector: this.name,
          executionTime,
          rowCount: result.rowCount || result.length || 0
        });

        return this.transformResponse({
          rows: result.rows || result,
          rowCount: result.rowCount || result.length || 0,
          executionTime,
          connector: this.name,
          fromCache: false
        });

      } catch (error) {
        attempt++;
        logger.warn(`Query attempt ${attempt} failed`, {
          connector: this.name,
          error: error.message,
          attempt,
          maxRetries: this.maxRetries
        });

        if (attempt >= this.maxRetries) {
          const executionTime = Date.now() - startTime;
          logger.error(`Query failed after ${attempt} attempts`, {
            connector: this.name,
            error: error.message,
            executionTime
          });
          throw error;
        }

        // Wait before retry (exponential backoff)
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
  }

  async healthCheck() {
    try {
      const startTime = Date.now();
      
      // Perform a simple test query or connection check
      await this.testConnection();
      
      const responseTime = Date.now() - startTime;
      this.lastHealthCheck = new Date().toISOString();
      this.healthStatus = 'healthy';

      return {
        status: 'healthy',
        lastCheck: this.lastHealthCheck,
        responseTime,
        connected: this.connected,
        details: 'Connection test successful'
      };

    } catch (error) {
      this.healthStatus = 'unhealthy';
      this.lastHealthCheck = new Date().toISOString();

      logger.error(`Health check failed for ${this.name}`, {
        error: error.message
      });

      return {
        status: 'unhealthy',
        lastCheck: this.lastHealthCheck,
        connected: false,
        error: error.message
      };
    }
  }

  getSchema() {
    return {
      name: this.name,
      type: this.type,
      version: '1.0.0',
      description: 'Custom database connector',
      capabilities: [
        'query',
        'healthCheck',
        'connectionPooling'
      ],
      supportedOperations: [
        'SELECT',
        'INSERT',
        'UPDATE',
        'DELETE'
      ],
      configuration: {
        required: ['host', 'database', 'username', 'password'],
        optional: ['port', 'queryTimeout', 'maxRetries', 'poolSize']
      }
    };
  }

  // Helper methods
  async createConnectionPool() {
    // Implement connection pool creation
    // This is specific to your database type
  }

  async executeQuery(queryConfig) {
    // Implement actual query execution
    // Return standardized result format
  }

  async testConnection() {
    // Implement simple connection test
    // e.g., SELECT 1 for SQL databases
  }

  timeoutPromise(timeout) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), timeout);
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  validateQuery(queryConfig) {
    // Implement query validation logic
    if (!queryConfig) {
      return { valid: false, error: 'Query configuration is required' };
    }

    if (queryConfig.table && typeof queryConfig.table !== 'string') {
      return { valid: false, error: 'Table name must be a string' };
    }

    return { valid: true };
  }

  transformResponse(data) {
    // Transform response to standard format
    return {
      success: true,
      data: data,
      metadata: {
        timestamp: new Date().toISOString(),
        connector: this.name,
        type: this.type
      }
    };
  }
}

module.exports = CustomDatabaseConnector;
```

### Step 3: Register Your Connector

Add your connector to the connector registry:

```javascript
// api-gateway/connectors/ConnectorRegistry.js
const CustomDatabaseConnector = require('./database/CustomDatabaseConnector');

class ConnectorRegistry {
  constructor() {
    this.connectors = new Map();
    this.types = new Map();
  }

  registerConnector(name, ConnectorClass, config) {
    try {
      const connector = new ConnectorClass(config);
      this.connectors.set(name, connector);
      this.types.set(name, ConnectorClass);
      
      logger.info(`Registered connector: ${name}`, {
        type: connector.type,
        capabilities: connector.getSchema().capabilities
      });

    } catch (error) {
      logger.error(`Failed to register connector: ${name}`, {
        error: error.message
      });
      throw error;
    }
  }

  // Usage example
  init() {
    // Register your custom connector
    this.registerConnector('my-custom-db', CustomDatabaseConnector, {
      name: 'my-custom-db',
      type: 'database',
      host: process.env.CUSTOM_DB_HOST,
      database: process.env.CUSTOM_DB_NAME,
      username: process.env.CUSTOM_DB_USER,
      password: process.env.CUSTOM_DB_PASS,
      queryTimeout: 30000,
      maxRetries: 3
    });
  }
}
```

## Connector Types and Examples

### Database Connector Example

```javascript
// PostgreSQL Connector Example
class PostgreSQLConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.pool = null;
  }

  async connect() {
    const { Pool } = require('pg');
    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port || 5432,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      max: this.config.poolSize || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await this.pool.connect();
    client.release();
    
    this.connected = true;
    return { success: true };
  }

  async executeQuery(queryConfig) {
    const { table, fields, where, orderBy, limit, offset } = queryConfig;
    
    let sql = `SELECT ${fields ? fields.join(', ') : '*'} FROM ${table}`;
    const params = [];
    let paramIndex = 1;

    if (where) {
      const { clause, values } = this.buildWhereClause(where, paramIndex);
      sql += ` WHERE ${clause}`;
      params.push(...values);
    }

    if (orderBy) {
      sql += ` ORDER BY ${orderBy.join(', ')}`;
    }

    if (limit) {
      sql += ` LIMIT $${paramIndex++}`;
      params.push(limit);
    }

    if (offset) {
      sql += ` OFFSET $${paramIndex++}`;
      params.push(offset);
    }

    const result = await this.pool.query(sql, params);
    return result;
  }
}
```

### REST API Connector Example

```javascript
// REST API Connector Example
const axios = require('axios');

class RestApiConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.client = null;
    this.authToken = null;
  }

  async connect() {
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'API-Gateway-Connector/1.0'
      }
    });

    // Set up interceptors
    this.client.interceptors.request.use(
      config => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    // Authenticate
    await this.authenticate();
    this.connected = true;
    return { success: true };
  }

  async query(queryConfig) {
    const { endpoint, method = 'GET', params, data } = queryConfig;
    
    const response = await this.client.request({
      url: endpoint,
      method,
      params,
      data
    });

    return {
      rows: response.data,
      rowCount: Array.isArray(response.data) ? response.data.length : 1,
      statusCode: response.status,
      headers: response.headers
    };
  }

  async authenticate() {
    if (this.config.authType === 'oauth') {
      const response = await this.client.post('/oauth/token', {
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      });
      this.authToken = response.data.access_token;
    }
  }
}
```

### File Connector Example

```javascript
// CSV File Connector Example
const fs = require('fs').promises;
const csv = require('csv-parser');

class CsvConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.filePath = config.filePath;
    this.delimiter = config.delimiter || ',';
    this.hasHeader = config.hasHeader !== false;
  }

  async connect() {
    try {
      await fs.access(this.filePath);
      this.connected = true;
      return { success: true };
    } catch (error) {
      throw new Error(`Cannot access file: ${this.filePath}`);
    }
  }

  async query(queryConfig) {
    const { filters, limit, offset = 0 } = queryConfig;
    const results = [];

    return new Promise((resolve, reject) => {
      let rowCount = 0;
      let skipped = 0;

      require('fs').createReadStream(this.filePath)
        .pipe(csv({ separator: this.delimiter }))
        .on('data', (row) => {
          if (skipped < offset) {
            skipped++;
            return;
          }

          if (this.matchesFilters(row, filters)) {
            results.push(row);
            rowCount++;

            if (limit && rowCount >= limit) {
              resolve({
                rows: results,
                rowCount: results.length
              });
            }
          }
        })
        .on('end', () => {
          resolve({
            rows: results,
            rowCount: results.length
          });
        })
        .on('error', reject);
    });
  }

  matchesFilters(row, filters) {
    if (!filters) return true;

    return Object.entries(filters).every(([field, value]) => {
      if (typeof value === 'object' && value.operator) {
        return this.applyOperator(row[field], value.operator, value.value);
      }
      return row[field] === value;
    });
  }
}
```

## Configuration Management

### Environment Variables

Define connector-specific environment variables:

```bash
# Database Connector
CUSTOM_DB_HOST=localhost
CUSTOM_DB_PORT=5432
CUSTOM_DB_NAME=mydb
CUSTOM_DB_USER=user
CUSTOM_DB_PASS=password
CUSTOM_DB_POOL_SIZE=20
CUSTOM_DB_TIMEOUT=30000

# API Connector
API_BASE_URL=https://api.example.com
API_CLIENT_ID=your_client_id
API_CLIENT_SECRET=your_client_secret
API_TIMEOUT=60000

# File Connector
FILE_PATH=/data/files/
FILE_WATCH_ENABLED=true
FILE_ENCODING=utf8
```

### Configuration Schema

```javascript
// Define configuration schema for validation
const configSchema = {
  database: {
    required: ['host', 'database', 'username', 'password'],
    optional: {
      port: { type: 'number', default: 5432 },
      poolSize: { type: 'number', default: 10 },
      timeout: { type: 'number', default: 30000 },
      ssl: { type: 'boolean', default: false }
    }
  },
  api: {
    required: ['baseUrl'],
    optional: {
      timeout: { type: 'number', default: 30000 },
      retries: { type: 'number', default: 3 },
      authType: { type: 'string', enum: ['none', 'basic', 'bearer', 'oauth'] }
    }
  },
  file: {
    required: ['filePath'],
    optional: {
      encoding: { type: 'string', default: 'utf8' },
      delimiter: { type: 'string', default: ',' },
      hasHeader: { type: 'boolean', default: true }
    }
  }
};
```

## Testing Your Connector

### Unit Tests

```javascript
// tests/connectors/CustomDatabaseConnector.test.js
const CustomDatabaseConnector = require('../../connectors/database/CustomDatabaseConnector');

describe('CustomDatabaseConnector', () => {
  let connector;

  beforeEach(() => {
    connector = new CustomDatabaseConnector({
      name: 'test-db',
      type: 'database',
      host: 'localhost',
      database: 'testdb',
      username: 'test',
      password: 'test'
    });
  });

  describe('connect', () => {
    it('should connect successfully with valid config', async () => {
      const result = await connector.connect();
      expect(result.success).toBe(true);
      expect(connector.connected).toBe(true);
    });

    it('should throw error with invalid config', async () => {
      connector.config.host = 'invalid-host';
      await expect(connector.connect()).rejects.toThrow();
    });
  });

  describe('query', () => {
    beforeEach(async () => {
      await connector.connect();
    });

    it('should execute simple query', async () => {
      const result = await connector.query({
        table: 'users',
        fields: ['id', 'name'],
        limit: 10
      });

      expect(result.success).toBe(true);
      expect(result.data.rows).toBeDefined();
      expect(result.data.connector).toBe('test-db');
    });

    it('should validate query parameters', async () => {
      await expect(connector.query({})).rejects.toThrow('Invalid query');
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when connected', async () => {
      await connector.connect();
      const health = await connector.healthCheck();
      
      expect(health.status).toBe('healthy');
      expect(health.connected).toBe(true);
    });
  });
});
```

### Integration Tests

```javascript
// tests/integration/connector-integration.test.js
describe('Connector Integration', () => {
  it('should register and use custom connector', async () => {
    const registry = new ConnectorRegistry();
    
    // Register connector
    registry.registerConnector('test-custom', CustomDatabaseConnector, {
      name: 'test-custom',
      type: 'database',
      // ... config
    });

    // Get connector
    const connector = registry.get('test-custom');
    expect(connector).toBeInstanceOf(CustomDatabaseConnector);

    // Test connection
    await connector.connect();
    expect(connector.connected).toBe(true);

    // Test query
    const result = await connector.query({ table: 'test_table' });
    expect(result.success).toBe(true);
  });
});
```

## Error Handling and Logging

### Error Types

Define standard error types for consistent error handling:

```javascript
class ConnectorError extends Error {
  constructor(message, code, connector, details = {}) {
    super(message);
    this.name = 'ConnectorError';
    this.code = code;
    this.connector = connector;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

class ConnectionError extends ConnectorError {
  constructor(message, connector, details) {
    super(message, 'CONNECTION_ERROR', connector, details);
    this.name = 'ConnectionError';
  }
}

class QueryError extends ConnectorError {
  constructor(message, connector, query, details) {
    super(message, 'QUERY_ERROR', connector, { query, ...details });
    this.name = 'QueryError';
  }
}
```

### Logging Best Practices

```javascript
// Structured logging with context
logger.info('Query executed', {
  connector: this.name,
  table: queryConfig.table,
  executionTime: responseTime,
  rowCount: result.length,
  cached: false,
  requestId: context.requestId
});

logger.error('Connection failed', {
  connector: this.name,
  error: error.message,
  errorCode: error.code,
  host: this.config.host,
  retryAttempt: attempt,
  stack: error.stack
});
```

## Performance Optimization

### Connection Pooling

```javascript
class PooledConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.pool = null;
    this.poolConfig = {
      min: config.poolMin || 2,
      max: config.poolMax || 10,
      acquireTimeoutMillis: config.acquireTimeout || 30000,
      createTimeoutMillis: config.createTimeout || 30000,
      idleTimeoutMillis: config.idleTimeout || 600000
    };
  }

  async getConnection() {
    return await this.pool.acquire();
  }

  async releaseConnection(connection) {
    await this.pool.release(connection);
  }
}
```

### Query Caching

```javascript
const NodeCache = require('node-cache');

class CachedConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.cache = new NodeCache({
      stdTTL: config.cacheTTL || 300, // 5 minutes
      checkperiod: 60 // Check for expired keys every minute
    });
  }

  async query(queryConfig) {
    const cacheKey = this.generateCacheKey(queryConfig);
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return {
        ...cached,
        fromCache: true
      };
    }

    const result = await this.executeQuery(queryConfig);
    this.cache.set(cacheKey, result);
    
    return {
      ...result,
      fromCache: false
    };
  }

  generateCacheKey(queryConfig) {
    return require('crypto')
      .createHash('md5')
      .update(JSON.stringify(queryConfig))
      .digest('hex');
  }
}
```

## Monitoring Integration

### Metrics Collection

```javascript
const { metricsCollector } = require('../../monitoring');

class MonitoredConnector extends BaseConnector {
  async query(queryConfig) {
    const startTime = Date.now();
    const labels = {
      connector: this.name,
      operation: 'query',
      table: queryConfig.table
    };

    try {
      const result = await this.executeQuery(queryConfig);
      const duration = Date.now() - startTime;
      
      // Record successful query
      metricsCollector.recordConnectorQuery(this.name, 'success', duration);
      metricsCollector.incrementCounter('connector_queries_total', labels);
      metricsCollector.recordHistogram('connector_query_duration', duration, labels);
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Record failed query
      metricsCollector.recordConnectorQuery(this.name, 'error', duration);
      metricsCollector.incrementCounter('connector_queries_total', 
        { ...labels, status: 'error', error: error.name }
      );
      
      throw error;
    }
  }
}
```

### Health Check Integration

```javascript
const { healthCheckManager } = require('../../monitoring');

// Register connector health check
healthCheckManager.registerConnectorHealthCheck(this.name, async () => {
  return await this.healthCheck();
});
```

## Deployment and Distribution

### NPM Package Structure

```
my-custom-connector/
├── package.json
├── README.md
├── src/
│   ├── index.js
│   ├── connector.js
│   └── config/
│       └── schema.js
├── tests/
│   ├── unit/
│   └── integration/
└── docs/
    ├── README.md
    └── examples/
```

### Package.json Example

```json
{
  "name": "@company/api-gateway-custom-connector",
  "version": "1.0.0",
  "description": "Custom connector for API Gateway",
  "main": "src/index.js",
  "keywords": ["api-gateway", "connector", "database"],
  "dependencies": {
    "@company/api-gateway-base": "^1.0.0"
  },
  "peerDependencies": {
    "winston": "^3.0.0"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

## Best Practices

### Security

1. **Secure Configuration**: Never hardcode credentials
2. **Input Validation**: Validate all query parameters
3. **SQL Injection Prevention**: Use parameterized queries
4. **Access Control**: Implement proper authentication
5. **Audit Logging**: Log all data access attempts

### Performance

1. **Connection Pooling**: Reuse database connections
2. **Query Optimization**: Optimize database queries
3. **Caching**: Cache frequently accessed data
4. **Timeout Handling**: Implement proper timeouts
5. **Resource Cleanup**: Clean up resources properly

### Reliability

1. **Error Handling**: Comprehensive error handling
2. **Retry Logic**: Implement exponential backoff
3. **Circuit Breakers**: Prevent cascade failures
4. **Health Checks**: Regular health monitoring
5. **Graceful Degradation**: Fallback mechanisms

### Maintainability

1. **Documentation**: Comprehensive documentation
2. **Testing**: Unit and integration tests
3. **Logging**: Structured logging with context
4. **Monitoring**: Performance and health metrics
5. **Versioning**: Semantic versioning for releases

## Example: Complete E-commerce Connector

```javascript
// Example: Shopify Connector
class ShopifyConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.shop = config.shop;
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || '2023-01';
  }

  async connect() {
    this.client = axios.create({
      baseURL: `https://${this.shop}.myshopify.com/admin/api/${this.apiVersion}`,
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json'
      }
    });

    // Test connection
    await this.client.get('/shop.json');
    this.connected = true;
    return { success: true };
  }

  async query(queryConfig) {
    const { resource, filters, fields, limit } = queryConfig;
    
    const params = {
      limit: limit || 50,
      fields: fields?.join(','),
      ...filters
    };

    const response = await this.client.get(`/${resource}.json`, { params });
    
    return {
      rows: response.data[resource] || [],
      rowCount: response.data[resource]?.length || 0,
      metadata: {
        rateLimitRemaining: response.headers['x-shopify-shop-api-call-limit'],
        shop: this.shop
      }
    };
  }

  getSchema() {
    return {
      name: this.name,
      type: 'api',
      version: '1.0.0',
      description: 'Shopify e-commerce platform connector',
      capabilities: ['query', 'healthCheck', 'rateLimiting'],
      supportedResources: [
        'products', 'orders', 'customers', 'inventory_levels'
      ],
      rateLimits: {
        requests: 40,
        window: 'per_app_per_shop'
      }
    };
  }
}
```

This guide provides a comprehensive foundation for developing custom connectors. Follow the patterns and best practices outlined here to create robust, scalable, and maintainable connectors for your API Gateway.