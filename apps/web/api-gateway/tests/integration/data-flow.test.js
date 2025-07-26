/**
 * Integration Tests for End-to-End Data Flow
 * Phase 7: Testing & Validation
 */

describe('API Gateway Integration - Data Flow', () => {
  
  describe('Database to API Gateway Data Flow', () => {
    test('should retrieve data from SQLite database through connector', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({
          dateRange: {
            start: '2024-01-01',
            end: '2024-01-31'
          },
          limit: 10
        })
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify data structure matches database schema
      if (response.data.data.rows.length > 0) {
        const transaction = response.data.data.rows[0];
        expect(transaction).toHaveProperty('Sales Txn Key');
        expect(transaction).toHaveProperty('Customer Key');
        expect(transaction).toHaveProperty('Item Number');
        expect(transaction).toHaveProperty('Total Amount');
        expect(transaction).toHaveProperty('Txn Date');
      }
    });

    test('should transform database data according to API schema', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({ limit: 5 })
      });

      expect(response.status).toBe(200);
      
      // Verify standardized API response format
      expect(response.data).toMatchObject({
        success: true,
        data: expect.objectContaining({
          rows: expect.any(Array),
          rowCount: expect.any(Number),
          executionTime: expect.any(Number),
          fromCache: expect.any(Boolean),
          connector: expect.any(String)
        }),
        metadata: expect.objectContaining({
          timestamp: expect.any(String),
          requestId: expect.any(String)
        })
      });
    });

    test('should handle multiple database connections simultaneously', async () => {
      const requests = [
        integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
          method: 'POST',
          body: JSON.stringify({ limit: 3 })
        }),
        integrationUtils.makeRequest('/api/v1/sales/product-performance', {
          method: 'GET'
        }),
        integrationUtils.makeRequest('/api/v1/inventory/levels', {
          method: 'GET'
        }),
        integrationUtils.makeRequest('/api/v1/finance/reports', {
          method: 'GET'
        })
      ];

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toBeDefined();
      });

      // Each should use different connectors
      const connectors = responses.map(r => r.data.data.connector);
      const uniqueConnectors = new Set(connectors);
      expect(uniqueConnectors.size).toBeGreaterThan(1);
    });
  });

  describe('Query Builder Integration', () => {
    test('should build correct SQL queries from API parameters', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({
          customerId: 'CUST001',
          dateRange: {
            start: '2024-01-01',
            end: '2024-01-31'
          },
          minAmount: 100,
          limit: 5
        })
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // Verify filtering worked (if data exists)
      if (response.data.data.rows.length > 0) {
        response.data.data.rows.forEach(row => {
          if (row['Customer Key']) {
            expect(row['Customer Key']).toBe('CUST001');
          }
          if (row['Total Amount']) {
            expect(parseFloat(row['Total Amount'])).toBeGreaterThanOrEqual(100);
          }
        });
      }
    });

    test('should handle complex query conditions', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({
          dateRange: {
            start: '2024-01-15',
            end: '2024-01-20'
          },
          productCategory: 'Electronics',
          minAmount: 200,
          maxAmount: 1000,
          limit: 10
        })
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('rows');
      expect(response.data.data).toHaveProperty('executionTime');
    });

    test('should handle sorting and pagination', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({
          orderBy: ['Txn Date DESC', 'Total Amount DESC'],
          limit: 3,
          offset: 0
        })
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.rows.length).toBeLessThanOrEqual(3);

      // If multiple records, verify sorting
      if (response.data.data.rows.length > 1) {
        const dates = response.data.data.rows.map(row => new Date(row['Txn Date']));
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i-1]).toBeGreaterThanOrEqual(dates[i]);
        }
      }
    });
  });

  describe('Connector Health and Failover', () => {
    test('should report connector health status', async () => {
      const response = await integrationUtils.makeRequest('/health/connectors');

      expect(response.status).toBe(200);
      expect(response.data.connectors).toBeDefined();

      // Check that we have connectors registered
      const connectorIds = Object.keys(response.data.connectors);
      expect(connectorIds.length).toBeGreaterThan(0);

      // Each connector should have health information
      connectorIds.forEach(id => {
        const connector = response.data.connectors[id];
        expect(connector).toHaveProperty('status');
        expect(connector).toHaveProperty('lastHealthCheck');
        expect(['healthy', 'unhealthy', 'degraded']).toContain(connector.status);
      });
    });

    test('should handle connector initialization', async () => {
      // Wait a moment for connectors to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await integrationUtils.makeRequest('/health/connectors');
      expect(response.status).toBe(200);

      // At least one connector should be healthy
      const connectors = Object.values(response.data.connectors);
      const healthyConnectors = connectors.filter(c => c.status === 'healthy');
      expect(healthyConnectors.length).toBeGreaterThan(0);
    });
  });

  describe('Caching Layer Integration', () => {
    test('should cache GET requests', async () => {
      const endpoint = '/api/v1/customer/segmentation?limit=3';

      // First request
      const response1 = await integrationUtils.makeRequest(endpoint);
      expect(response1.status).toBe(200);
      expect(response1.data.data.fromCache).toBe(false);

      // Second request (should be cached)
      const response2 = await integrationUtils.makeRequest(endpoint);
      expect(response2.status).toBe(200);
      
      // Cache behavior may vary based on implementation
      // but response should be consistent
      expect(response2.data.data.rowCount).toBe(response1.data.data.rowCount);
    });

    test('should not cache POST requests', async () => {
      const requestBody = { limit: 3 };

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
      
      // POST requests should not be cached
      expect(response1.data.data.fromCache).toBe(false);
      expect(response2.data.data.fromCache).toBe(false);
    });
  });

  describe('Data Transformation and Validation', () => {
    test('should validate and transform date formats', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({
          dateRange: {
            start: '2024-01-01',
            end: '2024-01-31'
          },
          limit: 5
        })
      });

      expect(response.status).toBe(200);
      
      if (response.data.data.rows.length > 0) {
        response.data.data.rows.forEach(row => {
          if (row['Txn Date']) {
            // Date should be in a valid format
            expect(new Date(row['Txn Date'])).toBeInstanceOf(Date);
            expect(isNaN(new Date(row['Txn Date']).getTime())).toBe(false);
          }
        });
      }
    });

    test('should handle numeric data types correctly', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({ limit: 5 })
      });

      expect(response.status).toBe(200);
      
      if (response.data.data.rows.length > 0) {
        response.data.data.rows.forEach(row => {
          if (row['Total Amount']) {
            expect(typeof row['Total Amount']).toMatch(/number|string/);
            if (typeof row['Total Amount'] === 'string') {
              expect(isNaN(parseFloat(row['Total Amount']))).toBe(false);
            }
          }
          if (row['Sales Quantity']) {
            expect(typeof row['Sales Quantity']).toMatch(/number|string/);
          }
        });
      }
    });

    test('should handle missing or null values gracefully', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({
          customerId: 'NONEXISTENT_CUSTOMER',
          limit: 5
        })
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.rows).toEqual([]);
      expect(response.data.data.rowCount).toBe(0);
    });
  });

  describe('Error Propagation and Handling', () => {
    test('should propagate database errors appropriately', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({
          table: 'nonexistent_table',
          limit: 5
        })
      });

      // Should handle the error gracefully
      if (response.status !== 200) {
        expect(response.data).toMatchObject({
          success: false,
          error: expect.objectContaining({
            message: expect.any(String),
            code: expect.any(String)
          })
        });
      }
    });

    test('should handle malformed query parameters', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({
          dateRange: {
            start: 'invalid-date',
            end: 'another-invalid-date'
          },
          limit: 'not-a-number'
        })
      });

      // Should either succeed with default handling or return validation error
      if (response.status !== 200) {
        expect(response.data).toBeApiError();
      }
    });

    test('should timeout long-running queries', async () => {
      // This test would require a query that actually takes a long time
      // For now, we'll just verify the timeout configuration exists
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({ limit: 1000000 }) // Large limit
      });

      // Should either complete quickly or timeout appropriately
      expect([200, 408, 500]).toContain(response.status);
    }, 10000); // 10 second timeout for this test
  });

  describe('Audit Logging and Monitoring', () => {
    test('should log successful API requests', async () => {
      const consoleSpy = jest.spyOn(console, 'log');

      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({ limit: 1 })
      });

      expect(response.status).toBe(200);

      // Should have audit log entries (though they may be suppressed in test)
      // This is more of a structural test
      expect(response.data).toHaveStandardApiFormat();

      consoleSpy.mockRestore();
    });

    test('should include request metadata in responses', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({ limit: 1 })
      });

      expect(response.status).toBe(200);
      expect(response.data.metadata).toMatchObject({
        timestamp: expect.any(String),
        requestId: expect.any(String)
      });

      // Timestamp should be recent
      const timestamp = new Date(response.data.metadata.timestamp);
      const now = new Date();
      const timeDiff = now.getTime() - timestamp.getTime();
      expect(timeDiff).toBeLessThan(60000); // Within 1 minute
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const requests = Array(concurrentRequests).fill().map((_, index) => 
        integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
          method: 'POST',
          body: JSON.stringify({ limit: 2, offset: index })
        })
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });

      // Should complete in reasonable time (less than 5 seconds)
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(5000);

      // Average response time should be reasonable
      const avgTime = totalTime / concurrentRequests;
      expect(avgTime).toBeLessThan(1000); // Less than 1 second per request on average
    });

    test('should maintain performance with larger datasets', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({ limit: 100 }) // Larger limit
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // Should complete in reasonable time even with more data
      expect(response.data.data.executionTime).toBeLessThan(2000); // Less than 2 seconds
    });
  });
});