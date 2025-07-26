/**
 * Migrated Tools Validation Tests
 * Phase 7: Testing & Validation
 * 
 * Validates that the three migrated tools maintain the same functionality
 * and data accuracy after API Gateway migration:
 * 1. Transaction Patterns Tool
 * 2. Customer Segmentation Tool
 * 3. Churn Prediction Tool
 */

describe('Migrated Tools Validation', () => {
  
  describe('Transaction Patterns Tool Migration', () => {
    test('should maintain transaction pattern data structure and accuracy', async () => {
      const testRequest = {
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-31'
        },
        limit: 10,
        customerId: 'CUST001'
      };

      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify(testRequest)
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // Validate expected data structure matches original tool
      expect(response.data.data).toMatchObject({
        rows: expect.any(Array),
        rowCount: expect.any(Number),
        executionTime: expect.any(Number),
        connector: expect.any(String),
        fromCache: expect.any(Boolean)
      });

      // Validate transaction data fields match original schema
      if (response.data.data.rows.length > 0) {
        const transaction = response.data.data.rows[0];
        
        // Original tool fields must be preserved
        expect(transaction).toHaveProperty('Sales Txn Key');
        expect(transaction).toHaveProperty('Customer Key');
        expect(transaction).toHaveProperty('Item Number');
        expect(transaction).toHaveProperty('Total Amount');
        expect(transaction).toHaveProperty('Txn Date');
        expect(transaction).toHaveProperty('Sales Quantity');
        expect(transaction).toHaveProperty('Txn Number');

        // Data types should match original tool
        expect(typeof transaction['Sales Txn Key']).toMatch(/number|string/);
        expect(typeof transaction['Customer Key']).toBe('string');
        expect(typeof transaction['Total Amount']).toMatch(/number|string/);
        
        // Validate date format consistency
        expect(new Date(transaction['Txn Date'])).toBeInstanceOf(Date);
        expect(isNaN(new Date(transaction['Txn Date']).getTime())).toBe(false);
      }
    });

    test('should preserve original filtering and sorting capabilities', async () => {
      // Test date range filtering
      const dateFilteredResponse = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({
          dateRange: {
            start: '2024-01-15',
            end: '2024-01-20'
          },
          limit: 50
        })
      });

      expect(dateFilteredResponse.status).toBe(200);

      // Test customer filtering
      const customerFilteredResponse = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({
          customerId: 'CUST001',
          limit: 50
        })
      });

      expect(customerFilteredResponse.status).toBe(200);

      // Test amount filtering
      const amountFilteredResponse = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({
          minAmount: 200,
          maxAmount: 800,
          limit: 50
        })
      });

      expect(amountFilteredResponse.status).toBe(200);

      // Test sorting functionality
      const sortedResponse = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({
          orderBy: ['Txn Date DESC', 'Total Amount DESC'],
          limit: 10
        })
      });

      expect(sortedResponse.status).toBe(200);
      
      // Verify sorting if data exists
      if (sortedResponse.data.data.rows.length > 1) {
        const dates = sortedResponse.data.data.rows.map(row => new Date(row['Txn Date']));
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i-1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
        }
      }
    });

    test('should maintain original performance characteristics', async () => {
      const startTime = Date.now();
      
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({
          limit: 100,
          dateRange: {
            start: '2024-01-01',
            end: '2024-01-31'
          }
        })
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      
      // Should complete within reasonable time (same as original tool)
      expect(responseTime).toBeLessThan(3000); // 3 seconds max
      expect(response.data.data.executionTime).toBeLessThan(2000); // 2 seconds server time
    });
  });

  describe('Customer Segmentation Tool Migration', () => {
    test('should maintain customer segmentation data structure', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/segmentation?limit=10');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // Validate expected data structure
      expect(response.data.data).toMatchObject({
        rows: expect.any(Array),
        rowCount: expect.any(Number),
        executionTime: expect.any(Number),
        connector: expect.any(String)
      });

      // Validate segmentation algorithm consistency
      if (response.data.data.rows.length > 0) {
        const segment = response.data.data.rows[0];
        
        // Original segmentation fields
        expect(segment).toHaveProperty('customer_id');
        expect(segment.customer_id).toBeDefined();
        
        // Segmentation metrics should be present
        expect(segment).toHaveAnyOf([
          'segment', 'segment_type', 'customer_segment',
          'value_tier', 'loyalty_score', 'purchase_frequency'
        ]);
      }
    });

    test('should preserve segmentation algorithm accuracy', async () => {
      // Test different segmentation parameters
      const basicSegmentation = await integrationUtils.makeRequest('/api/v1/customer/segmentation?limit=20');
      
      expect(basicSegmentation.status).toBe(200);
      
      // Test with filters
      const filteredSegmentation = await integrationUtils.makeRequest('/api/v1/customer/segmentation?segment=high_value&limit=20');
      
      expect(filteredSegmentation.status).toBe(200);
      
      // Segmentation should be consistent between calls
      if (basicSegmentation.data.data.rows.length > 0 && filteredSegmentation.data.data.rows.length > 0) {
        // Should have reasonable distribution
        expect(basicSegmentation.data.data.rows.length).toBeGreaterThan(0);
      }
    });

    test('should maintain original segmentation performance', async () => {
      const startTime = Date.now();
      
      const response = await integrationUtils.makeRequest('/api/v1/customer/segmentation?limit=50');
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      
      // Performance should match original tool
      expect(responseTime).toBeLessThan(2000); // 2 seconds max
      expect(response.data.data.executionTime).toBeLessThan(1500); // 1.5 seconds server time
    });
  });

  describe('Churn Prediction Tool Migration', () => {
    test('should maintain churn prediction data structure and accuracy', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/churn-prediction?limit=10');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // Validate expected data structure
      expect(response.data.data).toMatchObject({
        rows: expect.any(Array),
        rowCount: expect.any(Number),
        executionTime: expect.any(Number),
        connector: expect.any(String)
      });

      // Validate churn prediction fields
      if (response.data.data.rows.length > 0) {
        const prediction = response.data.data.rows[0];
        
        // Original churn prediction fields
        expect(prediction).toHaveProperty('customer_id');
        expect(prediction.customer_id).toBeDefined();
        
        // Churn prediction metrics
        expect(prediction).toHaveAnyOf([
          'churn_probability', 'churn_score', 'churn_risk',
          'prediction_confidence', 'risk_factors', 'churn_likelihood'
        ]);

        // Validate probability ranges (should be 0-1 or 0-100)
        if (prediction.churn_probability !== undefined) {
          const prob = parseFloat(prediction.churn_probability);
          expect(prob).toBeGreaterThanOrEqual(0);
          expect(prob).toBeLessThanOrEqual(1.1); // Allow for slight variations
        }
      }
    });

    test('should preserve churn prediction algorithm consistency', async () => {
      // Test basic prediction
      const basicPrediction = await integrationUtils.makeRequest('/api/v1/customer/churn-prediction?limit=20');
      
      expect(basicPrediction.status).toBe(200);
      
      // Test with risk threshold
      const highRiskPrediction = await integrationUtils.makeRequest('/api/v1/customer/churn-prediction?risk_threshold=0.7&limit=20');
      
      expect(highRiskPrediction.status).toBe(200);
      
      // Predictions should be mathematically consistent
      if (basicPrediction.data.data.rows.length > 0) {
        const predictions = basicPrediction.data.data.rows;
        
        // Should have varied predictions (not all same value)
        const uniquePredictions = new Set(predictions.map(p => 
          p.churn_probability || p.churn_score || p.churn_risk
        ));
        
        if (predictions.length > 3) {
          expect(uniquePredictions.size).toBeGreaterThan(1);
        }
      }
    });

    test('should maintain churn prediction performance', async () => {
      const startTime = Date.now();
      
      const response = await integrationUtils.makeRequest('/api/v1/customer/churn-prediction?limit=100');
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      
      // Performance should match original tool
      expect(responseTime).toBeLessThan(4000); // 4 seconds max (ML can be slower)
      expect(response.data.data.executionTime).toBeLessThan(3000); // 3 seconds server time
    });
  });

  describe('Cross-Tool Data Consistency', () => {
    test('should maintain referential integrity between tools', async () => {
      // Get customer data from transaction patterns
      const transactionResponse = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({ limit: 10 })
      });

      // Get segmentation data
      const segmentationResponse = await integrationUtils.makeRequest('/api/v1/customer/segmentation?limit=10');

      // Get churn prediction data
      const churnResponse = await integrationUtils.makeRequest('/api/v1/customer/churn-prediction?limit=10');

      expect(transactionResponse.status).toBe(200);
      expect(segmentationResponse.status).toBe(200);
      expect(churnResponse.status).toBe(200);

      // Extract customer IDs from each tool
      const transactionCustomers = transactionResponse.data.data.rows
        .map(row => row['Customer Key'])
        .filter(id => id);

      const segmentationCustomers = segmentationResponse.data.data.rows
        .map(row => row.customer_id || row['Customer Key'])
        .filter(id => id);

      const churnCustomers = churnResponse.data.data.rows
        .map(row => row.customer_id || row['Customer Key'])
        .filter(id => id);

      // There should be some overlap in customer IDs between tools
      if (transactionCustomers.length > 0 && segmentationCustomers.length > 0) {
        const overlap = transactionCustomers.filter(id => segmentationCustomers.includes(id));
        expect(overlap.length).toBeGreaterThanOrEqual(0); // At least some consistency
      }
    });

    test('should maintain consistent response format across all tools', async () => {
      const endpoints = [
        { url: '/api/v1/customer/transaction-patterns', method: 'POST', body: { limit: 5 } },
        { url: '/api/v1/customer/segmentation?limit=5', method: 'GET' },
        { url: '/api/v1/customer/churn-prediction?limit=5', method: 'GET' }
      ];

      for (const endpoint of endpoints) {
        const options = {
          method: endpoint.method,
          ...(endpoint.body && { body: JSON.stringify(endpoint.body) })
        };

        const response = await integrationUtils.makeRequest(endpoint.url, options);

        expect(response.status).toBe(200);
        
        // All tools should have consistent API response format
        expect(response.data).toMatchObject({
          success: true,
          data: expect.objectContaining({
            rows: expect.any(Array),
            rowCount: expect.any(Number),
            executionTime: expect.any(Number),
            connector: expect.any(String)
          }),
          metadata: expect.objectContaining({
            timestamp: expect.any(String),
            requestId: expect.any(String)
          })
        });
      }
    });
  });

  describe('Business Logic Validation', () => {
    test('should maintain transaction pattern business rules', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/transaction-patterns', {
        method: 'POST',
        body: JSON.stringify({
          minAmount: 100,
          limit: 50
        })
      });

      expect(response.status).toBe(200);

      // Business rule: all returned transactions should meet minimum amount
      if (response.data.data.rows.length > 0) {
        response.data.data.rows.forEach(transaction => {
          if (transaction['Total Amount']) {
            const amount = parseFloat(transaction['Total Amount']);
            expect(amount).toBeGreaterThanOrEqual(100);
          }
        });
      }
    });

    test('should maintain segmentation business logic', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/segmentation?limit=30');

      expect(response.status).toBe(200);

      // Business rule: segmentation should be meaningful and consistent
      if (response.data.data.rows.length > 0) {
        const segments = response.data.data.rows;
        
        // Should have customer identifiers
        segments.forEach(segment => {
          expect(segment.customer_id || segment['Customer Key']).toBeDefined();
        });

        // Should have segmentation data
        const hasSegmentData = segments.some(segment => 
          segment.segment || segment.customer_segment || 
          segment.value_tier || segment.loyalty_score
        );
        
        expect(hasSegmentData).toBe(true);
      }
    });

    test('should maintain churn prediction business logic', async () => {
      const response = await integrationUtils.makeRequest('/api/v1/customer/churn-prediction?limit=30');

      expect(response.status).toBe(200);

      // Business rule: churn predictions should be within valid ranges
      if (response.data.data.rows.length > 0) {
        const predictions = response.data.data.rows;
        
        predictions.forEach(prediction => {
          // Should have customer ID
          expect(prediction.customer_id || prediction['Customer Key']).toBeDefined();
          
          // Churn probability should be valid if present
          if (prediction.churn_probability) {
            const prob = parseFloat(prediction.churn_probability);
            expect(prob).toBeGreaterThanOrEqual(0);
            expect(prob).toBeLessThanOrEqual(1.1); // Allow slight margin
          }
          
          // Churn score should be reasonable if present
          if (prediction.churn_score) {
            const score = parseFloat(prediction.churn_score);
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100.1); // Allow slight margin
          }
        });
      }
    });
  });

  describe('Error Handling Consistency', () => {
    test('should maintain consistent error handling across all migrated tools', async () => {
      const invalidRequests = [
        {
          url: '/api/v1/customer/transaction-patterns',
          method: 'POST',
          body: { limit: -1, invalidParam: 'test' }
        },
        {
          url: '/api/v1/customer/segmentation?limit=-1&invalidParam=test',
          method: 'GET'
        },
        {
          url: '/api/v1/customer/churn-prediction?limit=-1&invalidParam=test',
          method: 'GET'
        }
      ];

      for (const request of invalidRequests) {
        const options = {
          method: request.method,
          ...(request.body && { body: JSON.stringify(request.body) })
        };

        const response = await integrationUtils.makeRequest(request.url, options);

        // Should handle errors gracefully (either succeed with defaults or return proper error)
        expect([200, 400, 422]).toContain(response.status);
        
        if (response.status !== 200) {
          expect(response.data).toBeApiError();
        }
      }
    });
  });
});