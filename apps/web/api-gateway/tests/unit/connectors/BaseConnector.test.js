/**
 * Unit Tests for BaseConnector
 * Phase 7: Testing & Validation
 */

const { BaseConnector } = require('../../../connectors/base/BaseConnector');

describe('BaseConnector', () => {
  let connector;
  
  beforeEach(() => {
    const config = {
      id: 'test-connector',
      name: 'Test Connector',
      timeout: 5000
    };
    connector = new BaseConnector('test', config);
  });

  afterEach(() => {
    if (connector && connector.connected) {
      connector.disconnect();
    }
  });

  describe('Constructor', () => {
    test('should initialize with correct properties', () => {
      expect(connector.id).toBe('test');
      expect(connector.type).toBe('test');
      expect(connector.config).toBeDefined();
      expect(connector.connected).toBe(false);
      expect(connector.lastHealthCheck).toBeNull();
    });

    test('should generate unique ID if not provided', () => {
      const connector1 = new BaseConnector('test', {});
      const connector2 = new BaseConnector('test', {});
      expect(connector1.id).not.toBe(connector2.id);
    });

    test('should set custom ID if provided', () => {
      const config = { id: 'custom-id' };
      const customConnector = new BaseConnector('test', config);
      expect(customConnector.id).toBe('custom-id');
    });
  });

  describe('Connection Management', () => {
    test('should implement connect method', async () => {
      // BaseConnector connect method should throw NotImplementedError
      await expect(connector.connect()).rejects.toThrow('connect method must be implemented');
    });

    test('should implement disconnect method', async () => {
      // BaseConnector disconnect method should throw NotImplementedError
      await expect(connector.disconnect()).rejects.toThrow('disconnect method must be implemented');
    });

    test('should track connection state', () => {
      expect(connector.isConnected()).toBe(false);
      connector.connected = true;
      expect(connector.isConnected()).toBe(true);
    });
  });

  describe('Query Methods', () => {
    test('should implement query method', async () => {
      const queryConfig = { table: 'test_table' };
      await expect(connector.query(queryConfig)).rejects.toThrow('query method must be implemented');
    });

    test('should implement safeQuery method', async () => {
      const queryConfig = { table: 'test_table' };
      await expect(connector.safeQuery(queryConfig)).rejects.toThrow('safeQuery method must be implemented');
    });
  });

  describe('Health Check', () => {
    test('should implement healthCheck method', async () => {
      await expect(connector.healthCheck()).rejects.toThrow('healthCheck method must be implemented');
    });

    test('should track last health check time', () => {
      expect(connector.lastHealthCheck).toBeNull();
      connector.lastHealthCheck = Date.now();
      expect(connector.lastHealthCheck).toBeDefined();
      expect(typeof connector.lastHealthCheck).toBe('number');
    });
  });

  describe('Configuration', () => {
    test('should provide connector information', () => {
      const info = connector.getInfo();
      expect(info).toHaveProperty('id');
      expect(info).toHaveProperty('type');
      expect(info).toHaveProperty('connected');
      expect(info).toHaveProperty('lastHealthCheck');
      expect(info.id).toBe(connector.id);
      expect(info.type).toBe(connector.type);
    });

    test('should validate configuration', () => {
      expect(() => {
        new BaseConnector('test', null);
      }).toThrow('Configuration is required');
    });
  });

  describe('Event Handling', () => {
    test('should be an EventEmitter', () => {
      expect(typeof connector.on).toBe('function');
      expect(typeof connector.emit).toBe('function');
      expect(typeof connector.removeListener).toBe('function');
    });

    test('should emit connection events', (done) => {
      connector.on('connected', () => {
        expect(true).toBe(true);
        done();
      });
      
      connector.emit('connected');
    });

    test('should emit error events', (done) => {
      const testError = new Error('Test error');
      
      connector.on('error', (error) => {
        expect(error).toBe(testError);
        done();
      });
      
      connector.emit('error', testError);
    });
  });

  describe('Error Handling', () => {
    test('should handle configuration errors gracefully', () => {
      expect(() => {
        new BaseConnector('', {});
      }).toThrow('Connector type is required');
    });

    test('should handle connection errors', async () => {
      // Mock a connection error
      connector.connect = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      await expect(connector.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('Timeout Handling', () => {
    test('should use default timeout if not configured', () => {
      const defaultConnector = new BaseConnector('test', {});
      expect(defaultConnector.config.timeout).toBe(30000); // 30 seconds default
    });

    test('should use custom timeout if configured', () => {
      const customConnector = new BaseConnector('test', { timeout: 5000 });
      expect(customConnector.config.timeout).toBe(5000);
    });
  });
});