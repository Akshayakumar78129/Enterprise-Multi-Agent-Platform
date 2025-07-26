/**
 * Integration Tests for API Endpoints
 * Phase 7: Testing & Validation
 */

describe('API Gateway Integration - Endpoints', () => {
  
  describe('Health Check Endpoints', () => {
    test('GET /health should return basic health status', async () => {
      const response = await integrationUtils.makeRequest('/health');
      
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        memory: expect.objectContaining({
          rss: expect.any(String),
          heapTotal: expect.any(String),
          heapUsed: expect.any(String)
        }),
        version: expect.any(String),
        environment: 'test'
      });
    });

    test('GET /health/detailed should return comprehensive health status', async () => {
      const response = await integrationUtils.makeRequest('/health/detailed');
      
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        status: expect.stringMatching(/^(healthy|degraded)$/),
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String),
        system: expect.objectContaining({
          memory: expect.any(Object),
          cpu: expect.any(Object),
          platform: expect.any(String)
        }),
        components: expect.objectContaining({
          connectors: expect.any(Object),
          cache: expect.any(Object),
          logging: expect.any(Object)
        }),
        configuration: expect.objectContaining({
          port: expect.any(Number),
          authEnabled: true,
          rateLimitEnabled: true
        })
      });
    });

    test('GET /health/connectors should return connector status', async () => {
      const response = await integrationUtils.makeRequest('/health/connectors');
      
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        status: expect.stringMatching(/^(healthy|degraded|error)$/),
        summary: expect.objectContaining({
          healthy: expect.any(Number),
          total: expect.any(Number),
          healthPercent: expect.any(Number)
        }),
        connectors: expect.any(Object),
        timestamp: expect.any(String)
      });
    });

    test('GET /metrics should return performance metrics', async () => {
      const response = await integrationUtils.makeRequest('/metrics');
      
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        memory: expect.objectContaining({
          rss: expect.any(Number),
          heapTotal: expect.any(Number),
          heapUsed: expect.any(Number),
          heapUsedPercent: expect.any(Number)
        }),
        cpu: expect.objectContaining({
          user: expect.any(Number),
          system: expect.any(Number)
        }),
        system: expect.objectContaining({
          loadAverage: expect.any(Array),
          freeMemory: expect.any(Number),
          totalMemory: expect.any(Number)
        })
      });
    });
  });

  describe('Customer Domain Endpoints', () => {
    test('POST /api/v1/customer/transaction-patterns should return transaction data', async () => {
      const requestBody = {
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-31'
        },
        limit: 10
      };

      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        success: true,
        data: expect.objectContaining({
          rows: expect.any(Array),
          rowCount: expect.any(Number),
          executionTime: expect.any(Number),
          connector: expect.any(String)
        }),
        metadata: expect.objectContaining({
          timestamp: expect.any(String)
        })
      });

      // Verify data structure
      if (response.data.data.rows.length > 0) {
        const firstRow = response.data.data.rows[0];
        expect(firstRow).toHaveProperty('Sales Txn Key');
        expect(firstRow).toHaveProperty('Customer Key');
        expect(firstRow).toHaveProperty('Total Amount');
      }
    });

    test('GET /api/v1/customer/segmentation should return segmentation data', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/segmentation?limit=5');

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        success: true,
        data: expect.objectContaining({
          rows: expect.any(Array),
          rowCount: expect.any(Number),
          executionTime: expect.any(Number)
        })
      });
    });

    test('GET /api/v1/customer/churn-prediction should return churn data', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/churn-prediction?limit=5');

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        success: true,
        data: expect.objectContaining({
          rows: expect.any(Array),
          rowCount: expect.any(Number),
          executionTime: expect.any(Number)
        })
      });
    });
  });

  describe('Sales Domain Endpoints', () => {
    test('GET /api/v1/sales/product-performance should return sales data', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/sales/product-performance?limit=5');

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        success: true,
        data: expect.objectContaining({
          rows: expect.any(Array),
          rowCount: expect.any(Number),
          executionTime: expect.any(Number)
        })
      });
    });

    test('GET /api/v1/sales/sales-trends should return trend data', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/sales/sales-trends?period=monthly');

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        success: true,
        data: expect.any(Object)
      });
    });
  });

  describe('Inventory Domain Endpoints', () => {
    test('GET /api/v1/inventory/levels should return inventory data', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/inventory/levels?limit=5');

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        success: true,
        data: expect.objectContaining({
          rows: expect.any(Array),
          rowCount: expect.any(Number),
          executionTime: expect.any(Number)
        })
      });
    });

    test('GET /api/v1/inventory/movements should return movement data', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/inventory/movements?days=30');

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        success: true,
        data: expect.any(Object)
      });
    });
  });

  describe('Finance Domain Endpoints', () => {
    test('GET /api/v1/finance/reports should return financial data', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/finance/reports?type=summary');

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        success: true,
        data: expect.objectContaining({
          rows: expect.any(Array),
          rowCount: expect.any(Number),
          executionTime: expect.any(Number)
        })
      });
    });
  });

  describe('Authentication and Authorization', () => {
    test('should reject requests without authentication', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // No Authorization header
        },
        body: JSON.stringify({ limit: 5 })
      });

      expect(response.status).toBe(401);
      expect(response.data).toMatchObject({
        success: false,
        error: expect.objectContaining({
          message: expect.any(String),
          code: expect.any(String)
        })
      });
    });

    test('should reject requests with invalid token', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token'
        },
        body: JSON.stringify({ limit: 5 })
      });

      expect(response.status).toBe(401);
      expect(response.data).toBeApiError('INVALID_TOKEN');
    });

    test('should accept valid API key', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'dev-token'
        },
        body: JSON.stringify({ limit: 5 })
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveStandardApiFormat();
    });
  });

  describe('Rate Limiting', () => {
    test('should include rate limit headers in responses', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({ limit: 1 })
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('x-ratelimit-limit')).toBeDefined();
      expect(response.headers.get('x-ratelimit-remaining')).toBeDefined();
      expect(response.headers.get('x-ratelimit-reset')).toBeDefined();
    });

    test('should track requests per endpoint', async () => {
      // Make multiple requests to the same endpoint
      const requests = Array(5).fill().map(() => 
        integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
          method: 'POST',
          body: JSON.stringify({ limit: 1 })
        })
      );

      const responses = await Promise.all(requests);

      // All should succeed (under rate limit)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Rate limit remaining should decrease
      const firstRemaining = parseInt(responses[0].headers.get('x-ratelimit-remaining'));
      const lastRemaining = parseInt(responses[4].headers.get('x-ratelimit-remaining'));
      
      expect(lastRemaining).toBeLessThan(firstRemaining);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON requests gracefully', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: 'invalid json{'
      });

      expect(response.status).toBe(400);
      expect(response.data).toBeApiError();
    });

    test('should handle missing required parameters', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({}) // Empty body
      });

      // Should still work but might return empty results
      expect([200, 400]).toContain(response.status);
    });

    test('should handle database connection errors gracefully', async () => {
      // This test would require temporarily breaking database connection
      // For now, we'll test that the endpoint responds appropriately
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({ 
          table: 'nonexistent_table',
          limit: 5 
        })
      });

      // Should either succeed with empty results or return appropriate error
      expect([200, 400, 404, 500]).toContain(response.status);
      
      if (response.status !== 200) {
        expect(response.data).toBeApiError();
      }
    });

    test('should return 404 for unknown endpoints', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/unknown/endpoint');

      expect(response.status).toBe(404);
      expect(response.data).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'NOT_FOUND'
        })
      });
    });

    test('should return 405 for unsupported HTTP methods', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'DELETE'
      });

      expect(response.status).toBe(405);
    });
  });

  describe('Response Format Consistency', () => {
    test('should return consistent response format across all endpoints', async () => {
      const endpoints = [
        '/api/v1/customer/transaction-patterns',
        '/api/v1/customer/segmentation',
        '/api/v1/sales/product-performance',
        '/api/v1/inventory/levels',
        '/api/v1/finance/reports'
      ];

      for (const endpoint of endpoints) {
        const method = endpoint.includes('transaction-patterns') ? 'POST' : 'GET';
        const body = method === 'POST' ? JSON.stringify({ limit: 1 }) : undefined;

        const response = await integrationUtils.makeRequest(endpoint, {
          method,
          ...(body && { body })
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveStandardApiFormat();
        expect(response.data).toMatchObject({
          success: true,
          data: expect.any(Object),
          metadata: expect.objectContaining({
            timestamp: expect.any(String)
          })
        });
      }
    });

    test('should include execution metadata in all responses', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({ limit: 5 })
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toMatchObject({
        executionTime: expect.any(Number),
        connector: expect.any(String),
        rowCount: expect.any(Number)
      });

      // Execution time should be reasonable (< 5 seconds for test)
      expect(response.data.data.executionTime).toBeLessThan(5000);
    });
  });

  describe('Data Integrity', () => {
    test('should return consistent data for identical requests', async () => {
      const requestBody = { 
        dateRange: { start: '2024-01-01', end: '2024-01-31' },
        limit: 5 
      };

      const response1 = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const response2 = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      
      // Data should be identical (unless cache is involved)
      expect(response1.data.data.rowCount).toBe(response2.data.data.rowCount);
    });

    test('should respect query parameters and filters', async () => {
      // Test with different limits
      const response1 = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({ limit: 2 })
      });

      const response2 = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({ limit: 3 })
      });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Should respect the limit parameter
      expect(response1.data.data.rows.length).toBeLessThanOrEqual(2);
      expect(response2.data.data.rows.length).toBeLessThanOrEqual(3);
    });
  });
});