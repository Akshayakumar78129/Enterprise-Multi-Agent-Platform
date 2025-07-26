/**
 * Unit Tests for SalesforceConnector
 * Phase 7: Testing & Validation
 */

const { SalesforceConnector } = require('../../../connectors/api/SalesforceConnector');

// Mock fetch for testing
global.fetch = jest.fn();

describe('SalesforceConnector', () => {
  let connector;
  let mockConfig;
  
  beforeEach(() => {
    mockConfig = {
      id: 'test-salesforce',
      baseUrl: 'https://test.salesforce.com',
      clientId: 'test_client_id',
      clientSecret: 'test_client_secret',
      username: 'test@example.com',
      password: 'testpassword',
      securityToken: 'testsecuritytoken',
      apiVersion: '58.0'
    };
    
    connector = new SalesforceConnector(mockConfig);
    
    // Reset fetch mock
    fetch.mockClear();
  });

  afterEach(async () => {
    if (connector && connector.connected) {
      await connector.disconnect();
    }
  });

  describe('Constructor', () => {
    test('should initialize with Salesforce-specific properties', () => {
      expect(connector.type).toBe('salesforce');
      expect(connector.baseUrl).toBe(mockConfig.baseUrl);
      expect(connector.clientId).toBe(mockConfig.clientId);
      expect(connector.clientSecret).toBe(mockConfig.clientSecret);
      expect(connector.username).toBe(mockConfig.username);
      expect(connector.apiVersion).toBe(mockConfig.apiVersion);
      expect(connector.accessToken).toBeNull();
      expect(connector.instanceUrl).toBeNull();
    });

    test('should use default values for optional properties', () => {
      const minimalConfig = {
        clientId: 'test_client_id',
        clientSecret: 'test_client_secret'
      };
      
      const minimalConnector = new SalesforceConnector(minimalConfig);
      
      expect(minimalConnector.baseUrl).toBe('https://api.salesforce.com');
      expect(minimalConnector.apiVersion).toBe('58.0');
    });

    test('should initialize circuit breaker', () => {
      expect(connector.circuitBreaker).toBeDefined();
      expect(connector.circuitBreaker.state).toBe('closed');
      expect(connector.circuitBreaker.failures).toBe(0);
      expect(connector.circuitBreaker.threshold).toBe(5);
    });
  });

  describe('Authentication', () => {
    test('should authenticate successfully with valid credentials', async () => {
      const mockAuthResponse = {
        access_token: 'mock_access_token',
        instance_url: 'https://test.my.salesforce.com',
        expires_in: 3600
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockAuthResponse)
      });
      
      await connector.authenticate();
      
      expect(connector.accessToken).toBe('mock_access_token');
      expect(connector.instanceUrl).toBe('https://test.my.salesforce.com');
      expect(connector.tokenExpiry).toBeGreaterThan(Date.now());
    });

    test('should handle authentication failure', async () => {
      const mockErrorResponse = {
        error: 'invalid_grant',
        error_description: 'authentication failure'
      };
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockResolvedValue(mockErrorResponse)
      });
      
      await expect(connector.authenticate()).rejects.toThrow('Authentication failed: authentication failure');
    });

    test('should ensure authentication before API calls', async () => {
      // Mock expired token
      connector.accessToken = 'expired_token';
      connector.tokenExpiry = Date.now() - 1000; // Expired 1 second ago
      
      const mockAuthResponse = {
        access_token: 'new_access_token',
        instance_url: 'https://test.my.salesforce.com',
        expires_in: 3600
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockAuthResponse)
      });
      
      await connector.ensureAuthenticated();
      
      expect(connector.accessToken).toBe('new_access_token');
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Connection Management', () => {
    test('should connect successfully', async () => {
      const mockAuthResponse = {
        access_token: 'mock_access_token',
        instance_url: 'https://test.my.salesforce.com',
        expires_in: 3600
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockAuthResponse)
      });
      
      await connector.connect();
      
      expect(connector.connected).toBe(true);
      expect(connector.lastHealthCheck).toBeDefined();
    });

    test('should handle connection errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(connector.connect()).rejects.toThrow('Network error');
      expect(connector.connected).toBe(false);
    });

    test('should require credentials for connection', async () => {
      const invalidConnector = new SalesforceConnector({});
      
      await expect(invalidConnector.connect()).rejects.toThrow('Salesforce credentials not configured');
    });
  });

  describe('SOQL Query Execution', () => {
    beforeEach(async () => {
      // Mock successful authentication
      const mockAuthResponse = {
        access_token: 'mock_access_token',
        instance_url: 'https://test.my.salesforce.com',
        expires_in: 3600
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockAuthResponse)
      });
      
      await connector.connect();
      fetch.mockClear(); // Clear the auth call
    });

    test('should execute SOQL queries successfully', async () => {
      const mockQueryResponse = {
        totalSize: 2,
        done: true,
        records: [
          { Id: '001xx000003DHPh', Name: 'Test Account 1' },
          { Id: '001xx000003DHPi', Name: 'Test Account 2' }
        ]
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockQueryResponse)
      });
      
      const result = await connector.query('SELECT Id, Name FROM Account LIMIT 2');
      
      expect(result.rows).toEqual(mockQueryResponse.records);
      expect(result.totalSize).toBe(2);
      expect(result.done).toBe(true);
    });

    test('should build SOQL from configuration object', () => {
      const config = {
        table: 'Account',
        fields: ['Id', 'Name', 'BillingCity'],
        where: { Type: 'Customer' },
        orderBy: ['LastModifiedDate DESC'],
        limit: 100
      };
      
      const soql = connector.buildSOQL(config);
      
      expect(soql).toContain('SELECT Id, Name, BillingCity');
      expect(soql).toContain('FROM Account');
      expect(soql).toContain('WHERE Type = \'Customer\'');
      expect(soql).toContain('ORDER BY LastModifiedDate DESC');
      expect(soql).toContain('LIMIT 100');
    });

    test('should handle complex WHERE conditions', () => {
      const config = {
        table: 'Opportunity',
        fields: ['Id', 'Name', 'Amount'],
        where: {
          Amount: { operator: '>', value: '10000' },
          StageName: 'Closed Won'
        }
      };
      
      const soql = connector.buildSOQL(config);
      
      expect(soql).toContain('WHERE Amount > \'10000\' AND StageName = \'Closed Won\'');
    });

    test('should execute safe queries with error handling', async () => {
      const mockQueryResponse = {
        totalSize: 1,
        done: true,
        records: [{ Id: '001xx000003DHPh', Name: 'Test Account' }]
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockQueryResponse)
      });
      
      const queryConfig = {
        table: 'Account',
        fields: ['Id', 'Name']
      };
      
      const result = await connector.safeQuery(queryConfig);
      
      expect(result).toHaveProperty('rows');
      expect(result).toHaveProperty('rowCount', 1);
      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('connector', connector.id);
      expect(result.rows).toEqual(mockQueryResponse.records);
    });
  });

  describe('CRUD Operations', () => {
    beforeEach(async () => {
      // Mock successful authentication
      const mockAuthResponse = {
        access_token: 'mock_access_token',
        instance_url: 'https://test.my.salesforce.com',
        expires_in: 3600
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockAuthResponse)
      });
      
      await connector.connect();
      fetch.mockClear();
    });

    test('should create records successfully', async () => {
      const mockCreateResponse = {
        id: '001xx000003DHPh',
        success: true,
        errors: []
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockCreateResponse)
      });
      
      const recordData = { Name: 'Test Account', Type: 'Customer' };
      const result = await connector.create('Account', recordData);
      
      expect(result).toEqual(mockCreateResponse);
    });

    test('should update records successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({})
      });
      
      const recordData = { Name: 'Updated Account Name' };
      const result = await connector.update('Account', '001xx000003DHPh', recordData);
      
      expect(result).toEqual({ success: true, id: '001xx000003DHPh' });
    });

    test('should delete records successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({})
      });
      
      const result = await connector.delete('Account', '001xx000003DHPh');
      
      expect(result).toEqual({ success: true, id: '001xx000003DHPh' });
    });

    test('should handle CRUD operation errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockResolvedValue({ message: 'Required field missing' })
      });
      
      await expect(connector.create('Account', {})).rejects.toThrow('Salesforce API error: 400 - Required field missing');
    });
  });

  describe('Circuit Breaker', () => {
    beforeEach(async () => {
      // Mock successful authentication
      const mockAuthResponse = {
        access_token: 'mock_access_token',
        instance_url: 'https://test.my.salesforce.com',
        expires_in: 3600
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockAuthResponse)
      });
      
      await connector.connect();
      fetch.mockClear();
    });

    test('should track successful requests', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ records: [] })
      });
      
      await connector.query('SELECT Id FROM Account LIMIT 1');
      
      expect(connector.circuitBreaker.failures).toBe(0);
      expect(connector.circuitBreaker.state).toBe('closed');
    });

    test('should track failed requests', async () => {
      fetch.mockRejectedValue(new Error('Network error'));
      
      try {
        await connector.query('SELECT Id FROM Account LIMIT 1');
      } catch (error) {
        // Expected to fail
      }
      
      expect(connector.circuitBreaker.failures).toBe(1);
    });

    test('should open circuit breaker after threshold failures', async () => {
      fetch.mockRejectedValue(new Error('Network error'));
      
      // Trigger enough failures to open the circuit breaker
      for (let i = 0; i < 5; i++) {
        try {
          await connector.query('SELECT Id FROM Account LIMIT 1');
        } catch (error) {
          // Expected to fail
        }
      }
      
      expect(connector.circuitBreaker.state).toBe('open');
      expect(connector.circuitBreaker.failures).toBe(5);
    });
  });

  describe('Health Check', () => {
    test('should perform health check when connected', async () => {
      // Mock successful authentication
      const mockAuthResponse = {
        access_token: 'mock_access_token',
        instance_url: 'https://test.my.salesforce.com',
        expires_in: 3600
      };
      
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockAuthResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ records: [{ Id: '005xx000001X8Uz' }] })
        });
      
      await connector.connect();
      const health = await connector.healthCheck();
      
      expect(health).toHaveProperty('status', 'healthy');
      expect(health).toHaveProperty('latency');
      expect(health).toHaveProperty('circuitBreaker', 'closed');
    });

    test('should report unhealthy when authentication fails', async () => {
      fetch.mockRejectedValue(new Error('Authentication failed'));
      
      const health = await connector.healthCheck();
      
      expect(health).toHaveProperty('status', 'unhealthy');
      expect(health).toHaveProperty('error');
    });
  });

  describe('Disconnect', () => {
    test('should revoke token on disconnect', async () => {
      // Mock successful authentication
      const mockAuthResponse = {
        access_token: 'mock_access_token',
        instance_url: 'https://test.my.salesforce.com',
        expires_in: 3600
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockAuthResponse)
      });
      
      await connector.connect();
      
      // Mock successful token revocation
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({})
      });
      
      await connector.disconnect();
      
      expect(connector.accessToken).toBeNull();
      expect(connector.instanceUrl).toBeNull();
      expect(connector.connected).toBe(false);
      
      // Verify revoke endpoint was called
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/services/oauth2/revoke'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('token=mock_access_token')
        })
      );
    });

    test('should handle revocation errors gracefully', async () => {
      connector.accessToken = 'test_token';
      connector.baseUrl = 'https://test.salesforce.com';
      
      fetch.mockRejectedValue(new Error('Revocation failed'));
      
      // Should not throw error
      await expect(connector.disconnect()).resolves.toBeUndefined();
      
      expect(connector.accessToken).toBeNull();
      expect(connector.connected).toBe(false);
    });
  });
});