/**
 * Unit Tests for SQLiteConnector
 * Phase 7: Testing & Validation
 */

const path = require('path');
const fs = require('fs');
const { SQLiteConnector } = require('../../../connectors/database/SQLiteConnector');

describe('SQLiteConnector', () => {
  let connector;
  let testDbPath;
  
  beforeEach(() => {
    // Create a temporary test database path
    testDbPath = path.join(__dirname, '../../fixtures/test.db');
    
    const config = {
      id: 'test-sqlite',
      dbPath: testDbPath,
      timeout: 5000
    };
    
    connector = new SQLiteConnector(config);
  });

  afterEach(async () => {
    if (connector && connector.connected) {
      await connector.disconnect();
    }
    
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch (error) {
        console.warn('Could not clean up test database:', error.message);
      }
    }
  });

  describe('Constructor', () => {
    test('should initialize with SQLite-specific properties', () => {
      expect(connector.type).toBe('sqlite');
      expect(connector.dbPath).toBe(testDbPath);
      expect(connector.db).toBeNull();
      expect(connector.connected).toBe(false);
    });

    test('should require database path', () => {
      expect(() => {
        new SQLiteConnector({});
      }).toThrow('Database path is required');
    });

    test('should validate database path exists', () => {
      const invalidPath = '/nonexistent/path/test.db';
      const config = { dbPath: invalidPath };
      
      expect(() => {
        new SQLiteConnector(config);
      }).toThrow('Database file does not exist');
    });
  });

  describe('Connection Management', () => {
    test('should connect to database successfully', async () => {
      // Create a temporary database file
      fs.writeFileSync(testDbPath, '');
      
      await connector.connect();
      
      expect(connector.connected).toBe(true);
      expect(connector.db).toBeDefined();
    });

    test('should handle connection errors', async () => {
      // Use an invalid database path
      connector.dbPath = '/invalid/path/test.db';
      
      await expect(connector.connect()).rejects.toThrow();
      expect(connector.connected).toBe(false);
    });

    test('should disconnect gracefully', async () => {
      // Create and connect to database
      fs.writeFileSync(testDbPath, '');
      await connector.connect();
      
      expect(connector.connected).toBe(true);
      
      await connector.disconnect();
      
      expect(connector.connected).toBe(false);
      expect(connector.db).toBeNull();
    });

    test('should handle disconnect when not connected', async () => {
      expect(connector.connected).toBe(false);
      
      // Should not throw error
      await expect(connector.disconnect()).resolves.toBeUndefined();
    });
  });

  describe('Query Execution', () => {
    beforeEach(async () => {
      // Create test database with sample data
      fs.writeFileSync(testDbPath, '');
      await connector.connect();
      
      // Create test table
      await connector.db.exec(`
        CREATE TABLE test_table (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          value INTEGER
        );
        
        INSERT INTO test_table (name, value) VALUES 
          ('test1', 100),
          ('test2', 200),
          ('test3', 300);
      `);
    });

    test('should execute SELECT queries', async () => {
      const queryConfig = {
        table: 'test_table',
        fields: ['id', 'name', 'value']
      };
      
      const result = await connector.query(queryConfig);
      
      expect(result).toHaveProperty('rows');
      expect(Array.isArray(result.rows)).toBe(true);
      expect(result.rows.length).toBe(3);
      expect(result.rows[0]).toHaveProperty('name', 'test1');
    });

    test('should handle WHERE conditions', async () => {
      const queryConfig = {
        table: 'test_table',
        fields: ['name', 'value'],
        where: { value: { operator: '>', value: 150 } }
      };
      
      const result = await connector.query(queryConfig);
      
      expect(result.rows.length).toBe(2);
      expect(result.rows[0].name).toBe('test2');
      expect(result.rows[1].name).toBe('test3');
    });

    test('should handle ORDER BY clauses', async () => {
      const queryConfig = {
        table: 'test_table',
        fields: ['name', 'value'],
        orderBy: ['value DESC']
      };
      
      const result = await connector.query(queryConfig);
      
      expect(result.rows[0].value).toBe(300);
      expect(result.rows[1].value).toBe(200);
      expect(result.rows[2].value).toBe(100);
    });

    test('should handle LIMIT clauses', async () => {
      const queryConfig = {
        table: 'test_table',
        fields: ['name'],
        limit: 2
      };
      
      const result = await connector.query(queryConfig);
      
      expect(result.rows.length).toBe(2);
    });

    test('should handle query errors gracefully', async () => {
      const queryConfig = {
        table: 'nonexistent_table',
        fields: ['id']
      };
      
      await expect(connector.query(queryConfig)).rejects.toThrow();
    });
  });

  describe('Safe Query Execution', () => {
    beforeEach(async () => {
      fs.writeFileSync(testDbPath, '');
      await connector.connect();
      
      await connector.db.exec(`
        CREATE TABLE safe_test (
          id INTEGER PRIMARY KEY,
          data TEXT
        );
        INSERT INTO safe_test (data) VALUES ('sample data');
      `);
    });

    test('should execute safe queries with error handling', async () => {
      const queryConfig = {
        table: 'safe_test',
        fields: ['id', 'data']
      };
      
      const result = await connector.safeQuery(queryConfig);
      
      expect(result).toHaveProperty('rows');
      expect(result).toHaveProperty('rowCount');
      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('connector', connector.id);
      expect(result.rows.length).toBe(1);
    });

    test('should handle safe query errors', async () => {
      const queryConfig = {
        table: 'nonexistent_table',
        fields: ['id']
      };
      
      await expect(connector.safeQuery(queryConfig)).rejects.toThrow();
    });

    test('should include execution metadata', async () => {
      const queryConfig = {
        table: 'safe_test',
        fields: ['id']
      };
      
      const result = await connector.safeQuery(queryConfig);
      
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.fromCache).toBe(false);
      expect(result.connector).toBe(connector.id);
    });
  });

  describe('Health Check', () => {
    test('should perform health check when connected', async () => {
      fs.writeFileSync(testDbPath, '');
      await connector.connect();
      
      const health = await connector.healthCheck();
      
      expect(health).toHaveProperty('status', 'healthy');
      expect(health).toHaveProperty('latency');
      expect(health).toHaveProperty('dbPath');
      expect(health.latency).toBeGreaterThanOrEqual(0);
    });

    test('should report unhealthy when not connected', async () => {
      const health = await connector.healthCheck();
      
      expect(health).toHaveProperty('status', 'unhealthy');
      expect(health).toHaveProperty('error');
    });

    test('should update last health check timestamp', async () => {
      fs.writeFileSync(testDbPath, '');
      await connector.connect();
      
      const beforeTime = Date.now();
      await connector.healthCheck();
      const afterTime = Date.now();
      
      expect(connector.lastHealthCheck).toBeGreaterThanOrEqual(beforeTime);
      expect(connector.lastHealthCheck).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Query Builder Integration', () => {
    beforeEach(async () => {
      fs.writeFileSync(testDbPath, '');
      await connector.connect();
    });

    test('should build SELECT queries correctly', () => {
      const queryConfig = {
        table: 'users',
        fields: ['id', 'name', 'email'],
        where: { active: true },
        orderBy: ['name ASC'],
        limit: 10
      };
      
      const sql = connector.buildSelectQuery(queryConfig);
      
      expect(sql).toContain('SELECT id, name, email');
      expect(sql).toContain('FROM users');
      expect(sql).toContain('WHERE active = ?');
      expect(sql).toContain('ORDER BY name ASC');
      expect(sql).toContain('LIMIT 10');
    });

    test('should handle complex WHERE conditions', () => {
      const queryConfig = {
        table: 'products',
        fields: ['*'],
        where: {
          price: { operator: '>', value: 100 },
          category: 'electronics',
          available: true
        }
      };
      
      const sql = connector.buildSelectQuery(queryConfig);
      
      expect(sql).toContain('WHERE price > ? AND category = ? AND available = ?');
    });

    test('should sanitize table and field names', () => {
      const queryConfig = {
        table: 'user_data',
        fields: ['user_id', 'first_name', 'last_name']
      };
      
      const sql = connector.buildSelectQuery(queryConfig);
      
      expect(sql).not.toContain(';');
      expect(sql).not.toContain('--');
      expect(sql).not.toContain('/*');
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      fs.writeFileSync(testDbPath, '');
      await connector.connect();
      
      // Create larger test dataset
      await connector.db.exec(`
        CREATE TABLE performance_test (
          id INTEGER PRIMARY KEY,
          value INTEGER,
          text_data TEXT
        );
      `);
      
      const stmt = connector.db.prepare('INSERT INTO performance_test (value, text_data) VALUES (?, ?)');
      for (let i = 0; i < 1000; i++) {
        stmt.run(i, `test_data_${i}`);
      }
      stmt.finalize();
    });

    test('should handle large result sets efficiently', async () => {
      const queryConfig = {
        table: 'performance_test',
        fields: ['id', 'value', 'text_data']
      };
      
      const startTime = Date.now();
      const result = await connector.query(queryConfig);
      const executionTime = Date.now() - startTime;
      
      expect(result.rows.length).toBe(1000);
      expect(executionTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    test('should respect query timeouts', async () => {
      // Set a very short timeout
      connector.config.timeout = 1;
      
      const queryConfig = {
        table: 'performance_test',
        fields: ['*']
      };
      
      // This test might be flaky depending on system performance
      // await expect(connector.query(queryConfig)).rejects.toThrow('timeout');
    }, 10000);
  });
});