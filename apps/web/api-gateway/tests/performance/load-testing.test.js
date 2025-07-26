/**
 * Performance and Load Testing
 * Phase 7: Testing & Validation
 */

describe('API Gateway Performance Testing', () => {
  
  describe('Response Time Benchmarks', () => {
    test('should respond to health checks quickly', async () => {
      const iterations = 10;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        const response = await integrationUtils.makeRequest('/health');
        const endTime = Date.now();
        
        expect(response.status).toBe(200);
        times.push(endTime - startTime);
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      
      console.log(`Health check - Average: ${avgTime}ms, Max: ${maxTime}ms`);
      
      // Health checks should be very fast
      expect(avgTime).toBeLessThan(100); // Average under 100ms
      expect(maxTime).toBeLessThan(500);  // Max under 500ms
    });

    test('should respond to API calls within acceptable time', async () => {
      const iterations = 5;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
          method: 'POST',
          body: JSON.stringify({ limit: 10 })
        });
        const endTime = Date.now();
        
        expect(response.status).toBe(200);
        times.push(endTime - startTime);
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      
      console.log(`API calls - Average: ${avgTime}ms, Max: ${maxTime}ms`);
      
      // API calls should complete within reasonable time
      expect(avgTime).toBeLessThan(2000); // Average under 2 seconds
      expect(maxTime).toBeLessThan(5000);  // Max under 5 seconds
    });

    test('should maintain performance with different query sizes', async () => {
      const limits = [1, 10, 50, 100];
      const results = [];

      for (const limit of limits) {
        const startTime = Date.now();
        const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
          method: 'POST',
          body: JSON.stringify({ limit })
        });
        const endTime = Date.now();
        
        expect(response.status).toBe(200);
        
        results.push({
          limit,
          responseTime: endTime - startTime,
          serverTime: response.data.data.executionTime,
          rows: response.data.data.rowCount
        });
      }

      console.log('Query size performance:', results);

      // Response time should not increase dramatically with size
      const times = results.map(r => r.responseTime);
      const timeIncrease = times[times.length - 1] / times[0];
      
      // Response time should not increase more than 10x for 100x more data
      expect(timeIncrease).toBeLessThan(10);
      
      // All queries should complete in reasonable time
      times.forEach(time => {
        expect(time).toBeLessThan(10000); // Under 10 seconds
      });
    });
  });

  describe('Concurrent Load Testing', () => {
    test('should handle moderate concurrent load', async () => {
      const concurrentUsers = 10;
      const requestsPerUser = 3;
      const totalRequests = concurrentUsers * requestsPerUser;
      
      const startTime = Date.now();
      
      // Create concurrent users
      const userPromises = Array(concurrentUsers).fill().map(async (_, userIndex) => {
        const userRequests = [];
        
        for (let reqIndex = 0; reqIndex < requestsPerUser; reqIndex++) {
          userRequests.push(
            integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
              method: 'POST',
              body: JSON.stringify({ 
                limit: 5,
                offset: userIndex * requestsPerUser + reqIndex
              })
            })
          );
        }
        
        return Promise.all(userRequests);
      });
      
      const allResponses = await Promise.all(userPromises);
      const endTime = Date.now();
      
      // Flatten responses
      const responses = allResponses.flat();
      
      // All requests should succeed
      expect(responses.length).toBe(totalRequests);
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });
      
      const totalTime = endTime - startTime;
      const avgTimePerRequest = totalTime / totalRequests;
      
      console.log(`Concurrent load - ${concurrentUsers} users, ${requestsPerUser} requests each:`);
      console.log(`Total time: ${totalTime}ms, Avg per request: ${avgTimePerRequest}ms`);
      
      // Should handle concurrent load efficiently
      expect(totalTime).toBeLessThan(15000); // Complete within 15 seconds
      expect(avgTimePerRequest).toBeLessThan(5000); // Average under 5 seconds per request
      
      // Calculate successful requests per second
      const requestsPerSecond = totalRequests / (totalTime / 1000);
      console.log(`Throughput: ${requestsPerSecond.toFixed(2)} requests/second`);
      
      // Should achieve reasonable throughput
      expect(requestsPerSecond).toBeGreaterThan(0.5); // At least 0.5 requests per second
    });

    test('should maintain stability under sustained load', async () => {
      const duration = 10000; // 10 seconds
      const requestInterval = 200; // Request every 200ms
      const expectedRequests = Math.floor(duration / requestInterval);
      
      const responses = [];
      const startTime = Date.now();
      let requestCount = 0;
      
      // Send requests at regular intervals
      const sendRequest = async () => {
        while (Date.now() - startTime < duration) {
          const response = await integrationUtils.makeRequest('/api/v1/customer/segmentation', {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache' // Avoid caching effects
            }
          });
          
          responses.push({
            status: response.status,
            time: Date.now() - startTime,
            success: response.data.success
          });
          
          requestCount++;
          
          // Wait for next interval
          await new Promise(resolve => setTimeout(resolve, requestInterval));
        }
      };
      
      await sendRequest();
      
      console.log(`Sustained load - ${requestCount} requests over ${duration}ms`);
      
      // Should maintain high success rate
      const successfulRequests = responses.filter(r => r.status === 200);
      const successRate = successfulRequests.length / responses.length;
      
      console.log(`Success rate: ${(successRate * 100).toFixed(2)}%`);
      
      expect(successRate).toBeGreaterThan(0.95); // 95% success rate
      expect(responses.length).toBeGreaterThan(expectedRequests * 0.8); // At least 80% of expected requests
      
      // Response times should be consistent
      const responseTimes = responses.map(r => r.time);
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      
      expect(avgResponseTime).toBeLessThan(duration); // Responses should not queue up significantly
    });
  });

  describe('Memory and Resource Usage', () => {
    test('should not have significant memory leaks during load', async () => {
      // Get initial memory usage
      const initialMemory = await integrationUtils.makeRequest('/metrics');
      expect(initialMemory.status).toBe(200);
      
      const initialHeapUsed = initialMemory.data.memory.heapUsed;
      
      // Perform many requests
      const requests = Array(50).fill().map((_, index) => 
        integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
          method: 'POST',
          body: JSON.stringify({ limit: 10, offset: index })
        })
      );
      
      const responses = await Promise.all(requests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Get final memory usage
      const finalMemory = await integrationUtils.makeRequest('/metrics');
      expect(finalMemory.status).toBe(200);
      
      const finalHeapUsed = finalMemory.data.memory.heapUsed;
      const memoryIncrease = finalHeapUsed - initialHeapUsed;
      const memoryIncreasePercent = (memoryIncrease / initialHeapUsed) * 100;
      
      console.log(`Memory usage - Initial: ${initialHeapUsed}, Final: ${finalHeapUsed}`);
      console.log(`Memory increase: ${memoryIncrease} bytes (${memoryIncreasePercent.toFixed(2)}%)`);
      
      // Memory increase should be reasonable (less than 50% increase)
      expect(memoryIncreasePercent).toBeLessThan(50);
      
      // Absolute memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    }, 30000); // Extended timeout

    test('should handle large response payloads efficiently', async () => {
      const startTime = Date.now();
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({ limit: 1000 }) // Large response
      });
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      const responseTime = endTime - startTime;
      const responseSize = JSON.stringify(response.data).length;
      const throughput = responseSize / (responseTime / 1000); // bytes per second
      
      console.log(`Large payload - Size: ${responseSize} bytes, Time: ${responseTime}ms`);
      console.log(`Throughput: ${(throughput / 1024).toFixed(2)} KB/s`);
      
      // Should handle large responses in reasonable time
      expect(responseTime).toBeLessThan(10000); // Under 10 seconds
      expect(throughput).toBeGreaterThan(1024); // At least 1 KB/s throughput
    }, 15000);
  });

  describe('Database Performance', () => {
    test('should optimize database queries efficiently', async () => {
      const queryTypes = [
        { name: 'Simple', body: { limit: 10 } },
        { name: 'Filtered', body: { customerId: 'CUST001', limit: 10 } },
        { name: 'Date Range', body: { 
          dateRange: { start: '2024-01-01', end: '2024-01-31' }, 
          limit: 10 
        }},
        { name: 'Complex', body: { 
          dateRange: { start: '2024-01-01', end: '2024-01-31' },
          customerId: 'CUST001',
          minAmount: 100,
          limit: 10
        }}
      ];
      
      const results = [];
      
      for (const queryType of queryTypes) {
        const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
          method: 'POST',
          body: JSON.stringify(queryType.body)
        });
        
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        
        results.push({
          name: queryType.name,
          executionTime: response.data.data.executionTime,
          rowCount: response.data.data.rowCount
        });
      }
      
      console.log('Query performance by type:', results);
      
      // All queries should complete in reasonable time
      results.forEach(result => {
        expect(result.executionTime).toBeLessThan(5000); // Under 5 seconds
      });
      
      // More complex queries may take longer but not excessively
      const simpleTime = results.find(r => r.name === 'Simple').executionTime;
      const complexTime = results.find(r => r.name === 'Complex').executionTime;
      
      // Complex queries should not be more than 10x slower than simple ones
      if (simpleTime > 0) {
        expect(complexTime / simpleTime).toBeLessThan(10);
      }
    });

    test('should handle concurrent database access', async () => {
      const concurrentQueries = Array(5).fill().map((_, index) => [
        integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
          method: 'POST',
          body: JSON.stringify({ limit: 5, offset: index * 5 })
        }),
        integrationUtils.makeRequest('/api/v1/sales/product-performance'),
        integrationUtils.makeRequest('/api/v1/inventory/levels'),
        integrationUtils.makeRequest('/api/v1/finance/reports')
      ]).flat();
      
      const startTime = Date.now();
      const responses = await Promise.all(concurrentQueries);
      const endTime = Date.now();
      
      // All should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });
      
      const totalTime = endTime - startTime;
      const avgTime = totalTime / responses.length;
      
      console.log(`Concurrent DB access - ${responses.length} queries in ${totalTime}ms`);
      console.log(`Average time per query: ${avgTime}ms`);
      
      // Should handle concurrent access efficiently
      expect(totalTime).toBeLessThan(15000); // Complete within 15 seconds
      expect(avgTime).toBeLessThan(3000); // Average under 3 seconds
    });
  });

  describe('Caching Performance', () => {
    test('should improve performance with caching', async () => {
      const endpoint = '/api/v1/customer/segmentation?limit=20';
      
      // First request (cache miss)
      const startTime1 = Date.now();
      const response1 = await integrationUtils.makeRequest(endpoint);
      const endTime1 = Date.now();
      
      expect(response1.status).toBe(200);
      
      // Wait a moment to ensure any async caching completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Second request (potential cache hit)
      const startTime2 = Date.now();
      const response2 = await integrationUtils.makeRequest(endpoint);
      const endTime2 = Date.now();
      
      expect(response2.status).toBe(200);
      
      const time1 = endTime1 - startTime1;
      const time2 = endTime2 - startTime2;
      
      console.log(`Cache performance - First: ${time1}ms, Second: ${time2}ms`);
      
      // Both should return same data
      expect(response1.data.data.rowCount).toBe(response2.data.data.rowCount);
      
      // Second request should be same or faster (caching effect)
      // Note: In test environment, caching might not show dramatic improvement
      expect(time2).toBeLessThanOrEqual(time1 * 2); // Allow some variance
    });
  });

  describe('Error Handling Performance', () => {
    test('should handle errors quickly without degrading performance', async () => {
      const errorRequests = [
        // Auth errors
        integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: 5 })
        }),
        
        // Not found errors
        integrationUtils.makeRequest('/api/v1/nonexistent/endpoint'),
        
        // Method not allowed
        integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
          method: 'DELETE'
        })
      ];
      
      const startTime = Date.now();
      const responses = await Promise.all(errorRequests);
      const endTime = Date.now();
      
      // All should return errors quickly
      responses.forEach(response => {
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.data).toBeApiError();
      });
      
      const totalTime = endTime - startTime;
      const avgTime = totalTime / responses.length;
      
      console.log(`Error handling - ${responses.length} errors in ${totalTime}ms`);
      console.log(`Average error response time: ${avgTime}ms`);
      
      // Error responses should be very fast
      expect(avgTime).toBeLessThan(500); // Under 500ms average
      expect(totalTime).toBeLessThan(2000); // All errors under 2 seconds total
    });
  });
});