const path = require('path');
const { ConnectorRegistry } = require('../connectors/ConnectorRegistry');
const SQLiteConnector = require('../connectors/database/SQLiteConnector');
const PostgreSQLConnector = require('../connectors/database/PostgreSQLConnector');
const RestApiConnector = require('../connectors/api/RestApiConnector');
const CsvConnector = require('../connectors/file/CsvConnector');
const ExcelConnector = require('../connectors/file/ExcelConnector');
const logger = require('./logger');

/**
 * Initialize and register all data connectors
 */
async function initializeConnectors() {
  logger.info('Initializing data connectors...');
  
  try {
    // 1. Register Customer Database (SQLite)
    const customerDbPath = path.resolve(__dirname, '../../Customer/database/customers.db');
    const customerConnector = new SQLiteConnector({
      id: 'customer-db',
      name: 'Customer Database',
      dbPath: customerDbPath,
      readOnly: true, // Read-only for safety
      maxConnections: 5
    });
    
    ConnectorRegistry.register('customer-db', customerConnector);
    logger.info('Customer database connector registered');
    
    // 2. Register Sales Database (SQLite)
    const salesDbPath = path.resolve(__dirname, '../../Sales/database/sales_agent.db');
    const salesConnector = new SQLiteConnector({
      id: 'sales-db',
      name: 'Sales Database',
      dbPath: salesDbPath,
      readOnly: true,
      maxConnections: 5
    });
    
    ConnectorRegistry.register('sales-db', salesConnector);
    logger.info('Sales database connector registered');
    
    // 3. Register Inventory Database (SQLite)
    const inventoryDbPath = path.resolve(__dirname, '../../Inventory/database/inventory.db');
    const inventoryConnector = new SQLiteConnector({
      id: 'inventory-db',
      name: 'Inventory Database',
      dbPath: inventoryDbPath,
      readOnly: true,
      maxConnections: 5
    });
    
    ConnectorRegistry.register('inventory-db', inventoryConnector);
    logger.info('Inventory database connector registered');
    
    // 4. Register PostgreSQL connector (if configured)
    if (process.env.POSTGRES_DATABASE) {
      const postgresConnector = new PostgreSQLConnector({
        id: 'postgres-enterprise',
        name: 'Enterprise PostgreSQL',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: process.env.POSTGRES_PORT || 5432,
        database: process.env.POSTGRES_DATABASE,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        ssl: process.env.POSTGRES_SSL === 'true',
        schema: process.env.POSTGRES_SCHEMA || 'public',
        readOnly: process.env.POSTGRES_READ_ONLY === 'true',
        maxConnections: parseInt(process.env.POSTGRES_MAX_CONNECTIONS) || 20
      });
      
      ConnectorRegistry.register('postgres-enterprise', postgresConnector);
      logger.info('Enterprise PostgreSQL connector registered');
    }
    
    // 5. Register Salesforce API connector (if configured)
    if (process.env.SALESFORCE_CLIENT_ID) {
      const salesforceConnector = new RestApiConnector({
        id: 'salesforce-api',
        name: 'Salesforce API',
        baseURL: process.env.SALESFORCE_BASE_URL || 'https://api.salesforce.com',
        auth: {
          type: 'oauth2',
          tokenUrl: `${process.env.SALESFORCE_BASE_URL || 'https://login.salesforce.com'}/services/oauth2/token`,
          clientId: process.env.SALESFORCE_CLIENT_ID,
          clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
          scope: 'api refresh_token'
        },
        healthPath: '/services/data/v57.0/limits',
        circuitBreaker: {
          enabled: true,
          threshold: 5,
          timeout: 60000
        },
        rateLimit: {
          maxRequests: 100,
          windowMs: 60000
        }
      });
      
      ConnectorRegistry.register('salesforce-api', salesforceConnector);
      logger.info('Salesforce API connector registered');
    }
    
    // 6. Register SAP API connector (if configured)
    if (process.env.SAP_API_URL) {
      const sapConnector = new RestApiConnector({
        id: 'sap-api',
        name: 'SAP API',
        baseURL: process.env.SAP_API_URL,
        auth: {
          type: process.env.SAP_AUTH_TYPE || 'basic',
          username: process.env.SAP_USERNAME,
          password: process.env.SAP_PASSWORD,
          key: process.env.SAP_API_KEY,
          header: process.env.SAP_API_KEY_HEADER || 'X-API-Key'
        },
        circuitBreaker: {
          enabled: true,
          threshold: 3,
          timeout: 30000
        }
      });
      
      ConnectorRegistry.register('sap-api', sapConnector);
      logger.info('SAP API connector registered');
    }
    
    // 7. Register CSV data connector (for data imports/exports)
    const csvDataPath = path.resolve(__dirname, '../data/exports');
    const csvConnector = new CsvConnector({
      id: 'csv-export',
      name: 'CSV Data Export',
      filePath: path.join(csvDataPath, 'data-export.csv'),
      headers: true,
      delimiter: ',',
      watchFile: false,
      archiveProcessed: true
    });
    
    ConnectorRegistry.register('csv-export', csvConnector);
    logger.info('CSV export connector registered');
    
    // 8. Register Excel connector (for reports)
    const excelReportsPath = path.resolve(__dirname, '../data/reports');
    const excelConnector = new ExcelConnector({
      id: 'excel-reports',
      name: 'Excel Reports',
      filePath: path.join(excelReportsPath, 'analytics-report.xlsx'),
      worksheet: 'Analytics',
      headers: true,
      readOnly: false,
      watchFile: false
    });
    
    ConnectorRegistry.register('excel-reports', excelConnector);
    logger.info('Excel reports connector registered');
    
    logger.info(`Successfully registered ${ConnectorRegistry.getAll().length} connectors`);
    
  } catch (error) {
    logger.error('Failed to initialize connectors:', error);
    throw error;
  }
}

/**
 * Test connectors with sample queries
 */
async function testConnectors() {
  logger.info('Testing connector connections...');
  
  const testResults = {};
  
  // Test each registered connector
  for (const connector of ConnectorRegistry.getAll()) {
    try {
      logger.info(`Testing connector: ${connector.name} (${connector.id})`);
      
      const connectorInstance = ConnectorRegistry.get(connector.id);
      
      // Test connection
      if (!connectorInstance.connected) {
        await connectorInstance.connectWithRetry();
      }
      
      // Test health check
      const healthResult = await connectorInstance.healthCheck();
      
      // Test basic query based on connector type
      let queryResult = null;
      try {
        queryResult = await testConnectorQuery(connectorInstance);
      } catch (queryError) {
        logger.warn(`Query test failed for ${connector.name}:`, queryError.message);
      }
      
      testResults[connector.id] = {
        name: connector.name,
        type: connector.type,
        connectionSuccess: true,
        health: healthResult,
        queryTest: queryResult ? 'success' : 'skipped',
        capabilities: connectorInstance.getCapabilities()
      };
      
      logger.info(`✅ ${connector.name} test passed`);
      
    } catch (error) {
      testResults[connector.id] = {
        name: connector.name,
        type: connector.type,
        connectionSuccess: false,
        error: error.message,
        queryTest: 'failed'
      };
      
      logger.error(`❌ ${connector.name} test failed:`, error.message);
    }
  }
  
  return testResults;
}

/**
 * Test connector with appropriate query based on type
 */
async function testConnectorQuery(connector) {
  switch (connector.type) {
    case 'sqlite':
      // Test with schema query
      return await connector.query({
        sql: "SELECT name FROM sqlite_master WHERE type='table' LIMIT 1"
      });
      
    case 'postgresql':
      // Test with schema query
      return await connector.query({
        sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 1"
      });
      
    case 'rest-api':
      // Test with GET request to base path or health endpoint
      return await connector.query({
        method: 'GET',
        path: connector.config.healthPath || '/',
        timeout: 5000
      });
      
    case 'csv':
      // Test with select query (will create empty file if doesn't exist)
      return await connector.query({
        operation: 'select',
        limit: 1
      });
      
    case 'excel':
      // Test with select query
      return await connector.query({
        operation: 'select',
        limit: 1
      });
      
    default:
      logger.warn(`No test query defined for connector type: ${connector.type}`);
      return null;
  }
}

/**
 * Create sample data for testing file connectors
 */
async function createSampleData() {
  const fs = require('fs');
  
  // Create directories
  const dataDir = path.resolve(__dirname, '../data');
  const exportDir = path.join(dataDir, 'exports');
  const reportsDir = path.join(dataDir, 'reports');
  
  [dataDir, exportDir, reportsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.debug(`Created directory: ${dir}`);
    }
  });
  
  // Create sample CSV data
  const csvPath = path.join(exportDir, 'data-export.csv');
  if (!fs.existsSync(csvPath)) {
    const csvData = [
      'id,name,category,value,date',
      '1,Sample Product A,Electronics,299.99,2024-01-15',
      '2,Sample Product B,Clothing,49.99,2024-01-16',
      '3,Sample Product C,Books,19.99,2024-01-17'
    ].join('\n');
    
    fs.writeFileSync(csvPath, csvData, 'utf8');
    logger.debug(`Created sample CSV: ${csvPath}`);
  }
  
  // Note: Excel file will be created automatically by the connector when first written to
}

/**
 * Get connector statistics
 */
function getConnectorStats() {
  const allConnectors = ConnectorRegistry.getAll();
  const stats = {
    total: allConnectors.length,
    byType: {},
    byStatus: {
      connected: 0,
      disconnected: 0
    }
  };
  
  allConnectors.forEach(connector => {
    // Count by type
    stats.byType[connector.type] = (stats.byType[connector.type] || 0) + 1;
    
    // Count by status
    if (connector.connected) {
      stats.byStatus.connected++;
    } else {
      stats.byStatus.disconnected++;
    }
  });
  
  return stats;
}

module.exports = {
  initializeConnectors,
  testConnectors,
  createSampleData,
  getConnectorStats
};