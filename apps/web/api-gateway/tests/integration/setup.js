/**
 * Integration Test Setup
 * Phase 7: Testing & Validation
 */

const path = require('path');
const fs = require('fs').promises;

// Integration test environment setup
process.env.NODE_ENV = 'test';
process.env.PORT = '3002'; // Different port for integration tests
process.env.LOG_LEVEL = 'error';
process.env.DATABASE_TYPE = 'sqlite';

// Create test database paths
const testDataDir = path.join(__dirname, '../fixtures');
const testDbs = {
  customer: path.join(testDataDir, 'test_customers.db'),
  sales: path.join(testDataDir, 'test_sales.db'),
  inventory: path.join(testDataDir, 'test_inventory.db'),
  finance: path.join(testDataDir, 'test_finance.db')
};

// Update environment with test database paths
process.env.DATABASE_PATH = testDbs.customer;
process.env.SALES_DATABASE_PATH = testDbs.sales;
process.env.INVENTORY_DATABASE_PATH = testDbs.inventory;
process.env.FINANCE_DATABASE_PATH = testDbs.finance;

// Global integration test utilities
global.integrationUtils = {
  testDbs,
  
  /**
   * Set up test databases with sample data
   */
  setupTestDatabases: async () => {
    const sqlite3 = require('sqlite3');
    const { open } = require('sqlite');
    
    // Ensure test data directory exists
    await fs.mkdir(testDataDir, { recursive: true });
    
    // Customer database
    const customerDb = await open({
      filename: testDbs.customer,
      driver: sqlite3.Database
    });
    
    await customerDb.exec(`
      CREATE TABLE IF NOT EXISTS dbo_F_Sales_Transaction (
        [Sales Txn Key] INTEGER PRIMARY KEY,
        [Customer Key] TEXT,
        [Item Number] TEXT,
        [Txn Date] TEXT,
        [Posting Time] TEXT,
        [Total Amount] REAL,
        [Sales Quantity] INTEGER,
        [Txn Number] TEXT
      );
      
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY,
        customer_id TEXT UNIQUE,
        customer_name TEXT,
        email TEXT,
        created_at TEXT
      );
      
      -- Sample transaction data
      INSERT OR REPLACE INTO dbo_F_Sales_Transaction VALUES 
        (1, 'CUST001', 'ITEM001', '2024-01-15', '10:30:00', 299.99, 2, 'TXN001'),
        (2, 'CUST002', 'ITEM002', '2024-01-16', '14:45:00', 599.99, 1, 'TXN002'),
        (3, 'CUST001', 'ITEM003', '2024-01-17', '09:15:00', 149.99, 3, 'TXN003'),
        (4, 'CUST003', 'ITEM001', '2024-01-18', '16:20:00', 199.99, 1, 'TXN004'),
        (5, 'CUST002', 'ITEM004', '2024-01-19', '11:10:00', 799.99, 1, 'TXN005');
      
      -- Sample customer data
      INSERT OR REPLACE INTO customers VALUES 
        (1, 'CUST001', 'John Doe', 'john@example.com', '2023-01-01'),
        (2, 'CUST002', 'Jane Smith', 'jane@example.com', '2023-02-01'),
        (3, 'CUST003', 'Bob Johnson', 'bob@example.com', '2023-03-01');
    `);
    
    await customerDb.close();
    
    // Sales database
    const salesDb = await open({
      filename: testDbs.sales,
      driver: sqlite3.Database
    });
    
    await salesDb.exec(`
      CREATE TABLE IF NOT EXISTS sales_data (
        id INTEGER PRIMARY KEY,
        product_id TEXT,
        product_name TEXT,
        sales_amount REAL,
        sales_date TEXT,
        region TEXT
      );
      
      INSERT OR REPLACE INTO sales_data VALUES 
        (1, 'PROD001', 'Product A', 1500.00, '2024-01-15', 'North'),
        (2, 'PROD002', 'Product B', 2300.00, '2024-01-16', 'South'),
        (3, 'PROD003', 'Product C', 800.00, '2024-01-17', 'East'),
        (4, 'PROD001', 'Product A', 1200.00, '2024-01-18', 'West'),
        (5, 'PROD002', 'Product B', 1800.00, '2024-01-19', 'North');
    `);
    
    await salesDb.close();
    
    // Inventory database
    const inventoryDb = await open({
      filename: testDbs.inventory,
      driver: sqlite3.Database
    });
    
    await inventoryDb.exec(`
      CREATE TABLE IF NOT EXISTS inventory_levels (
        id INTEGER PRIMARY KEY,
        product_id TEXT,
        product_name TEXT,
        current_stock INTEGER,
        reorder_level INTEGER,
        warehouse_location TEXT
      );
      
      INSERT OR REPLACE INTO inventory_levels VALUES 
        (1, 'PROD001', 'Product A', 150, 50, 'WH001'),
        (2, 'PROD002', 'Product B', 75, 25, 'WH001'),
        (3, 'PROD003', 'Product C', 200, 100, 'WH002'),
        (4, 'PROD004', 'Product D', 30, 20, 'WH002'),
        (5, 'PROD005', 'Product E', 90, 40, 'WH003');
    `);
    
    await inventoryDb.close();
    
    // Finance database
    const financeDb = await open({
      filename: testDbs.finance,
      driver: sqlite3.Database
    });
    
    await financeDb.exec(`
      CREATE TABLE IF NOT EXISTS financial_data (
        id INTEGER PRIMARY KEY,
        account_id TEXT,
        account_name TEXT,
        balance REAL,
        account_type TEXT,
        last_updated TEXT
      );
      
      INSERT OR REPLACE INTO financial_data VALUES 
        (1, 'ACC001', 'Revenue Account', 50000.00, 'Revenue', '2024-01-19'),
        (2, 'ACC002', 'Expense Account', -15000.00, 'Expense', '2024-01-19'),
        (3, 'ACC003', 'Asset Account', 100000.00, 'Asset', '2024-01-19'),
        (4, 'ACC004', 'Liability Account', -25000.00, 'Liability', '2024-01-19');
    `);
    
    await financeDb.close();
    
    console.log('✅ Test databases created successfully');
  },
  
  /**
   * Clean up test databases
   */
  cleanupTestDatabases: async () => {
    for (const dbPath of Object.values(testDbs)) {
      try {
        await fs.unlink(dbPath);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.warn(`Could not clean up ${dbPath}:`, error.message);
        }
      }
    }
    
    try {
      await fs.rmdir(testDataDir);
    } catch (error) {
      // Directory might not be empty or might not exist
    }
  },
  
  /**
   * Start test server
   */
  startTestServer: async () => {
    // Import server after environment is set up
    const server = require('../../server');
    
    return new Promise((resolve, reject) => {
      const testServer = server.listen(3002, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log('✅ Test server started on port 3002');
          resolve(testServer);
        }
      });
      
      // Store reference for cleanup
      global.testServer = testServer;
    });
  },
  
  /**
   * Stop test server
   */
  stopTestServer: async () => {
    if (global.testServer) {
      return new Promise((resolve) => {
        global.testServer.close(() => {
          console.log('✅ Test server stopped');
          global.testServer = null;
          resolve();
        });
      });
    }
  },
  
  /**
   * Make HTTP request to test server
   */
  makeRequest: async (path, options = {}) => {
    const fetch = require('node-fetch');
    const url = `http://localhost:3002${path}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    };
    
    const requestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {})
      }
    };
    
    const response = await fetch(url, requestOptions);
    const data = await response.json();
    
    return {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: response.headers,
      data
    };
  },
  
  /**
   * Wait for server to be ready
   */
  waitForServer: async (maxAttempts = 10, delay = 500) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await integrationUtils.makeRequest('/health');
        if (response.ok) {
          return true;
        }
      } catch (error) {
        // Server not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    throw new Error('Server did not become ready within timeout');
  }
};

// Global setup for all integration tests
beforeAll(async () => {
  console.log('🚀 Setting up integration test environment...');
  
  try {
    // Set up test databases
    await global.integrationUtils.setupTestDatabases();
    
    // Start test server
    await global.integrationUtils.startTestServer();
    
    // Wait for server to be ready
    await global.integrationUtils.waitForServer();
    
    console.log('✅ Integration test environment ready');
  } catch (error) {
    console.error('❌ Failed to set up integration test environment:', error);
    throw error;
  }
}, 30000); // 30 second timeout for setup

// Global cleanup for all integration tests
afterAll(async () => {
  console.log('🧹 Cleaning up integration test environment...');
  
  try {
    // Stop test server
    await global.integrationUtils.stopTestServer();
    
    // Clean up test databases
    await global.integrationUtils.cleanupTestDatabases();
    
    console.log('✅ Integration test environment cleaned up');
  } catch (error) {
    console.error('❌ Failed to clean up integration test environment:', error);
  }
}, 10000); // 10 second timeout for cleanup

module.exports = global.integrationUtils;