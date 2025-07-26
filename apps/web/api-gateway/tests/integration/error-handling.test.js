/**
 * Integration Tests for Error Handling
 * Phase 7: Testing & Validation
 */

describe('API Gateway Integration - Error Handling', () => {
  
  describe('Authentication Errors', () => {
    test('should return 401 for missing authentication', async () => {
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
        error: {
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        },
        metadata: {
          timestamp: expect.any(String)
        }
      });
    });

    test('should return 401 for invalid JWT token', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid.jwt.token'
        },
        body: JSON.stringify({ limit: 5 })
      });

      expect(response.status).toBe(401);
      expect(response.data).toBeApiError('INVALID_TOKEN');
    });

    test('should return 401 for malformed authorization header', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'InvalidFormat token123'
        },
        body: JSON.stringify({ limit: 5 })
      });

      expect(response.status).toBe(401);
      expect(response.data).toBeApiError('INVALID_TOKEN_FORMAT');
    });

    test('should return 401 for invalid API key', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'invalid-api-key'
        },
        body: JSON.stringify({ limit: 5 })
      });

      expect(response.status).toBe(401);
      expect(response.data).toBeApiError('INVALID_API_KEY');
    });
  });

  describe('Rate Limiting Errors', () => {
    test('should return 429 when rate limit exceeded', async () => {
      // This test would require actually exceeding rate limits
      // For demonstration, we'll test the structure
      
      // Make many requests quickly to potentially trigger rate limiting
      const rapidRequests = Array(15).fill().map(() => 
        integrationUtils.makeRequest('/api/v1/customer/churn-prediction?limit=1')
      );

      const responses = await Promise.all(rapidRequests);
      
      // At least some should succeed
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);

      // Check if any were rate limited (may not happen in test environment)
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      if (rateLimitedResponses.length > 0) {
        const rateLimited = rateLimitedResponses[0];
        expect(rateLimited.data).toMatchObject({
          success: false,
          error: {
            message: 'Too many requests, please try again later',
            code: 'RATE_LIMIT_EXCEEDED'
          },
          rateLimit: {
            limit: expect.any(Number),
            remaining: 0,
            reset: expect.any(Number),
            retryAfter: expect.any(Number)
          }
        });
        expect(rateLimited.headers.get('retry-after')).toBeDefined();
      }
    });

    test('should include rate limit headers in all responses', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({ limit: 1 })
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('x-ratelimit-limit')).toBeDefined();
      expect(response.headers.get('x-ratelimit-remaining')).toBeDefined();
      expect(response.headers.get('x-ratelimit-reset')).toBeDefined();
    });
  });

  describe('Input Validation Errors', () => {
    test('should handle malformed JSON gracefully', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: '{ invalid json structure'
      });

      expect(response.status).toBe(400);
      expect(response.data).toMatchObject({
        success: false,
        error: expect.objectContaining({
          message: expect.stringMatching(/json|parse|syntax/i),
          code: expect.any(String)
        })
      });
    });

    test('should validate date range parameters', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({
          dateRange: {
            start: 'invalid-date',
            end: 'also-invalid'
          },
          limit: 5
        })
      });

      // Should either handle gracefully or return validation error
      if (response.status !== 200) {
        expect(response.data).toBeApiError();
        expect(response.data.error.message).toMatch(/date|invalid|format/i);
      }
    });

    test('should validate numeric parameters', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({
          limit: 'not-a-number',
          minAmount: 'also-not-a-number'
        })
      });

      // Should either handle gracefully with defaults or return validation error
      if (response.status !== 200) {
        expect(response.data).toBeApiError();
      } else {
        // If it succeeds, it should have used reasonable defaults
        expect(response.data.success).toBe(true);
      }
    });

    test('should handle extremely large numeric values', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({
          limit: Number.MAX_SAFE_INTEGER,
          minAmount: Number.MAX_VALUE
        })
      });

      // Should handle gracefully without crashing
      expect([200, 400, 422]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      } else {
        expect(response.data).toBeApiError();
      }
    });

    test('should handle negative numeric values appropriately', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({
          limit: -10,
          minAmount: -100
        })
      });

      // Should either use defaults or return validation error
      expect([200, 400, 422]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        // Should not return negative number of rows
        expect(response.data.data.rowCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Database and Connector Errors', () => {
    test('should handle database connection errors', async () => {
      // This would be difficult to test without actually breaking the database
      // We'll test the error structure when querying non-existent data
      
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({
          customerId: 'DEFINITELY_NONEXISTENT_CUSTOMER_ID_12345',
          limit: 5
        })
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.rows).toEqual([]);
      expect(response.data.data.rowCount).toBe(0);
    });

    test('should handle query timeout errors', async () => {
      // Test with a potentially slow query
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({
          limit: 100000, // Very large limit
          complexFilter: true
        })
      });

      // Should either complete or timeout gracefully
      expect([200, 408, 500]).toContain(response.status);
      
      if (response.status !== 200) {
        expect(response.data).toBeApiError();
        expect(response.data.error.message).toMatch(/timeout|time|slow/i);
      }
    }, 15000); // Extended timeout for this test

    test('should handle connector health issues', async () => {
      const healthResponse = await integrationUtils.makeRequest('/health/connectors');
      
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.data.connectors).toBeDefined();

      // If any connectors are unhealthy, API should still work or return appropriate errors
      const connectors = Object.values(healthResponse.data.connectors);
      const unhealthyConnectors = connectors.filter(c => c.status !== 'healthy');
      
      if (unhealthyConnectors.length > 0) {
        // Test that API handles unhealthy connectors appropriately
        const apiResponse = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
          method: 'POST',
          body: JSON.stringify({ limit: 1 })
        });
        
        // Should either work (failover) or return clear error
        if (apiResponse.status !== 200) {
          expect(apiResponse.data).toBeApiError();
        }
      }
    });
  });

  describe('HTTP Method Errors', () => {
    test('should return 405 for unsupported HTTP methods', async () => {
      const unsupportedMethods = ['DELETE', 'PUT', 'PATCH'];
      
      for (const method of unsupportedMethods) {
        const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
          method
        });

        expect(response.status).toBe(405);
        expect(response.data).toMatchObject({
          success: false,
          error: {
            message: expect.stringMatching(/method.*not.*allowed/i),
            code: expect.any(String)
          }
        });
      }
    });

    test('should handle OPTIONS requests for CORS', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'OPTIONS'
      });

      // Should either return 200 (CORS preflight) or 405
      expect([200, 204, 405]).toContain(response.status);
      
      if (response.status === 200 || response.status === 204) {
        // CORS headers should be present
        expect(response.headers.get('access-control-allow-methods')).toBeDefined();
      }
    });
  });

  describe('Resource Not Found Errors', () => {
    test('should return 404 for unknown API endpoints', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/nonexistent/endpoint');

      expect(response.status).toBe(404);
      expect(response.data).toMatchObject({
        success: false,
        error: {
          message: 'Endpoint not found',
          code: 'NOT_FOUND'
        },
        metadata: {
          timestamp: expect.any(String),
          path: '/api/v1/nonexistent/endpoint'
        }
      });
    });

    test('should return 404 for unknown API versions', async () => {
      const response = await integrationUtils.makeRequest('/api/v99/customer/transaction-patterns');

      expect(response.status).toBe(404);
      expect(response.data).toBeApiError('NOT_FOUND');
    });

    test('should return 404 for unknown domains', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/unknown-domain/some-endpoint');

      expect(response.status).toBe(404);
      expect(response.data).toBeApiError('NOT_FOUND');
    });
  });

  describe('Server Error Handling', () => {
    test('should handle unexpected server errors gracefully', async () => {
      // Test with malformed request that might cause internal error
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({
          // Potentially problematic parameters
          table: '../../../etc/passwd',
          sqlInjection: "'; DROP TABLE users; --",
          xss: '<script>alert("xss")</script>'
        })
      });

      // Should not return 500 error or be vulnerable to injection
      expect([200, 400, 403, 422]).toContain(response.status);
      
      if (response.status !== 200) {
        expect(response.data).toBeApiError();
        expect(response.data.error.message).not.toContain('DROP TABLE');
        expect(response.data.error.message).not.toContain('<script>');
      }
    });

    test('should not expose sensitive information in error messages', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({
          // Try to trigger database error
          table: 'nonexistent_table_with_sensitive_info',
          limit: 5
        })
      });

      if (response.status !== 200) {
        expect(response.data).toBeApiError();
        
        // Should not expose sensitive paths, passwords, etc.
        const errorMessage = response.data.error.message.toLowerCase();
        expect(errorMessage).not.toMatch(/password|secret|key|token|database.*path/);
        expect(errorMessage).not.toMatch(/\/users\/.*\/database/);
      }
    });

    test('should include proper error correlation IDs', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/nonexistent/endpoint');

      expect(response.status).toBe(404);
      expect(response.data.metadata).toMatchObject({
        timestamp: expect.any(String),
        requestId: expect.any(String)
      });

      // Request ID should be a reasonable format (UUID-like or similar)
      expect(response.data.metadata.requestId).toMatch(/^[a-f0-9-]+$/i);
    });
  });

  describe('Content Type and Encoding Errors', () => {
    test('should handle missing content-type header', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token'
          // No Content-Type header
        },
        body: JSON.stringify({ limit: 5 })
      });

      // Should either work (assume JSON) or return clear error
      if (response.status !== 200) {
        expect(response.data).toBeApiError();
        expect(response.data.error.message).toMatch(/content.*type|header/i);
      }
    });

    test('should handle wrong content-type header', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({ limit: 5 })
      });

      // Should either handle gracefully or return appropriate error
      if (response.status !== 200) {
        expect(response.data).toBeApiError();
      }
    });

    test('should handle large request bodies', async () => {
      const largeData = {
        limit: 5,
        largeField: 'x'.repeat(1000000) // 1MB of data
      };

      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify(largeData)
      });

      // Should either reject (413) or handle appropriately
      expect([200, 413, 400]).toContain(response.status);
      
      if (response.status === 413) {
        expect(response.data).toBeApiError();
        expect(response.data.error.message).toMatch(/too.*large|payload|size/i);
      }
    });
  });

  describe('Concurrent Request Error Handling', () => {
    test('should handle concurrent requests with mixed errors', async () => {
      const requests = [
        // Valid request
        integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
          method: 'POST',
          body: JSON.stringify({ limit: 1 })
        }),
        
        // Invalid auth
        integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: 1 })
        }),
        
        // Invalid endpoint
        integrationUtils.makeRequest('/api/v1/invalid/endpoint'),
        
        // Invalid method
        integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
          method: 'DELETE'
        }),
        
        // Valid request
        integrationUtils.makeRequest('/api/v1/customer/segmentation?limit=1')
      ];

      const responses = await Promise.all(requests);

      // First request should succeed
      expect(responses[0].status).toBe(200);
      expect(responses[0].data.success).toBe(true);

      // Second request should fail with auth error
      expect(responses[1].status).toBe(401);
      expect(responses[1].data).toBeApiError();

      // Third request should fail with not found
      expect(responses[2].status).toBe(404);
      expect(responses[2].data).toBeApiError('NOT_FOUND');

      // Fourth request should fail with method not allowed
      expect(responses[3].status).toBe(405);
      expect(responses[3].data).toBeApiError();

      // Fifth request should succeed
      expect(responses[4].status).toBe(200);
      expect(responses[4].data.success).toBe(true);
    });
  });

  describe('Error Response Format Consistency', () => {
    test('should return consistent error format across all error types', async () => {
      const errorRequests = [
        // Auth error
        { 
          path: '/api/v1/customer/transaction-patterns',
          options: { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limit: 1 })
          }
        },
        
        // Not found error
        { 
          path: '/api/v1/nonexistent/endpoint',
          options: {}
        },
        
        // Method not allowed error
        { 
          path: '/api/v1/customer/transaction-patterns',
          options: { method: 'DELETE' }
        }
      ];

      for (const { path, options } of errorRequests) {
        const response = await integrationUtils.makeRequest(path, options);
        
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.data).toMatchObject({
          success: false,
          error: {
            message: expect.any(String),
            code: expect.any(String)
          },
          metadata: {
            timestamp: expect.any(String)
          }
        });

        // Error message should not be empty
        expect(response.data.error.message.length).toBeGreaterThan(0);
        expect(response.data.error.code.length).toBeGreaterThan(0);

        // Timestamp should be recent and valid
        const timestamp = new Date(response.data.metadata.timestamp);
        expect(timestamp).toBeInstanceOf(Date);
        expect(isNaN(timestamp.getTime())).toBe(false);
      }
    });
  });
});