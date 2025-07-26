const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');
const { authorizePermission } = require('../../middleware/auth/authMiddleware');
const { invalidateCacheMiddleware } = require('../../middleware/cache/cacheMiddleware');
const { ApiSchema, QuerySchemas } = require('../../schemas/ApiSchema');
const { QueryBuilder, CommonQueries, DataTransformer } = require('../../utils/QueryBuilder');
const { ConnectorRegistry } = require('../../connectors/ConnectorRegistry');

/**
 * GET /api/v1/customer/transaction-patterns
 * Real transaction patterns analysis with database queries
 */
router.get('/transaction-patterns', authorizePermission('read:customer'), async (req, res) => {
  try {
    logger.info('Transaction patterns endpoint accessed', { 
      userId: req.user?.id, 
      query: req.query 
    });
    
    // Validate query parameters
    const validation = ApiSchema.validateQuery(req.query, QuerySchemas.customerTransactionPatterns);
    if (!validation.isValid) {
      return res.status(400).json(
        ApiSchema.createErrorResponse(
          'Invalid query parameters',
          'VALIDATION_ERROR',
          { validationErrors: validation.errors },
          400
        )
      );
    }
    
    const filters = validation.validated;
    
    // Get customer database connector
    const customerDb = ConnectorRegistry.get('customer-db');
    
    // Build and execute query
    const queryBuilder = new QueryBuilder()
      .useConnector(customerDb)
      .from('dbo_F_Sales_Transaction')
      .select([
        'Sales Txn Key as transactionId',
        'Customer Key as customerId', 
        'Item Number as itemNumber',
        'Quantity as quantity',
        'Unit Price as unitPrice',
        'Extended Price as totalAmount',
        'Txn Date as transactionDate',
        'Posting Time as postingTime'
      ]);
    
    // Apply filters
    if (filters.customerId) {
      queryBuilder.where({ 'Customer Key': filters.customerId });
    }
    
    if (filters.startDate && filters.endDate) {
      queryBuilder.dateRange('Txn Date', filters.startDate, filters.endDate);
    }
    
    if (filters.minAmount) {
      queryBuilder.whereComparison('Extended Price', '>=', filters.minAmount);
    }
    
    if (filters.maxAmount) {
      queryBuilder.whereComparison('Extended Price', '<=', filters.maxAmount);
    }
    
    // Apply sorting and pagination
    queryBuilder
      .orderBy('Txn Date', 'DESC')
      .orderBy('Posting Time', 'DESC')
      .paginate(filters.page, filters.limit);
    
    // Add data transformations
    queryBuilder.transform(async (result) => {
      // Transform field names for API consistency
      const fieldMapping = {
        'Sales Txn Key': 'transactionId',
        'Customer Key': 'customerId',
        'Item Number': 'itemNumber',
        'Quantity': 'quantity',
        'Unit Price': 'unitPrice',
        'Extended Price': 'totalAmount',
        'Txn Date': 'transactionDate',
        'Posting Time': 'postingTime'
      };
      
      const transformedRows = DataTransformer.transformFieldNames(result.rows, fieldMapping);
      
      // Add calculated fields
      const enhancedRows = DataTransformer.addCalculatedFields(transformedRows, {
        averageItemPrice: row => row.quantity > 0 ? (row.totalAmount / row.quantity) : 0,
        transactionSize: row => {
          if (row.totalAmount < 50) return 'small';
          if (row.totalAmount < 200) return 'medium';
          return 'large';
        }
      });
      
      // Format currency values
      const formattedRows = DataTransformer.formatNumericValues(enhancedRows, {
        unitPrice: { type: 'currency', currency: 'USD' },
        totalAmount: { type: 'currency', currency: 'USD' },
        averageItemPrice: { type: 'currency', currency: 'USD' }
      });
      
      return { ...result, rows: formattedRows };
    });
    
    // Execute query
    const result = await queryBuilder.execute();
    
    // Create pagination info
    const pagination = ApiSchema.createPagination(
      filters.page,
      filters.limit,
      result.totalRows
    );
    
    // Send successful response
    res.json(
      ApiSchema.createSuccessResponse(
        {
          transactions: result.rows,
          summary: {
            totalTransactions: result.totalRows,
            currentPage: filters.page,
            transactionsOnPage: result.rowCount
          }
        },
        {
          executionTime: result.executionTime,
          fromCache: result.fromCache,
          connector: result.connector
        },
        pagination
      )
    );
    
  } catch (error) {
    logger.error('Transaction patterns query failed:', error);
    res.status(500).json(
      ApiSchema.createErrorResponse(
        'Failed to retrieve transaction patterns',
        'QUERY_ERROR',
        { error: error.message }
      )
    );
  }
});

/**
 * POST /api/v1/customer/transaction-patterns
 * Transaction patterns with complex filters
 */
router.post('/transaction-patterns', authorizePermission('read:customer'), async (req, res) => {
  try {
    const filters = { ...req.query, ...req.body };
    
    // Use the CommonQueries helper for complex queries
    const queryConfig = CommonQueries.buildTransactionPatternsQuery(filters);
    
    const customerDb = ConnectorRegistry.get('customer-db');
    const result = await customerDb.safeQuery(queryConfig);
    
    // Transform results
    const transformedRows = DataTransformer.transformFieldNames(result.rows, {
      'Sales Txn Key': 'transactionId',
      'Customer Key': 'customerId',
      'Item Number': 'itemNumber',
      'Quantity': 'quantity',
      'Unit Price': 'unitPrice',
      'Extended Price': 'totalAmount',
      'Txn Date': 'transactionDate',
      'Posting Time': 'postingTime'
    });
    
    const pagination = ApiSchema.createPagination(
      filters.page || 1,
      filters.limit || 1000,
      result.rowCount
    );
    
    res.json(
      ApiSchema.createSuccessResponse(
        { transactions: transformedRows },
        { executionTime: result.executionTime },
        pagination
      )
    );
    
  } catch (error) {
    logger.error('Transaction patterns POST query failed:', error);
    res.status(500).json(
      ApiSchema.createErrorResponse(
        'Failed to retrieve transaction patterns',
        'QUERY_ERROR',
        { error: error.message }
      )
    );
  }
});

/**
 * GET /api/v1/customer/segmentation
 * Customer segmentation analysis
 */
router.get('/segmentation', authorizePermission('read:customer'), async (req, res) => {
  try {
    logger.info('Customer segmentation endpoint accessed', { userId: req.user?.id });
    
    const validation = ApiSchema.validateQuery(req.query, QuerySchemas.customerSegmentation);
    if (!validation.isValid) {
      return res.status(400).json(
        ApiSchema.createErrorResponse(
          'Invalid query parameters',
          'VALIDATION_ERROR',
          { validationErrors: validation.errors },
          400
        )
      );
    }
    
    const filters = validation.validated;
    const customerDb = ConnectorRegistry.get('customer-db');
    
    // Build customer segmentation query
    const queryBuilder = new QueryBuilder()
      .useConnector(customerDb)
      .from('dbo_D_Customer')
      .select([
        'Customer Key as customerId',
        'Customer Name as customerName',
        'Customer Type as customerType',
        'Customer Status as status',
        'Registration Date as registrationDate'
      ])
      .paginate(filters.page, filters.limit)
      .orderBy('Customer Name', 'ASC');
    
    // Apply segmentation filters
    if (filters.segmentType === 'active') {
      queryBuilder.where({ 'Customer Status': 'Active' });
    }
    
    const result = await queryBuilder.execute();
    
    // Transform results
    const transformedRows = DataTransformer.transformFieldNames(result.rows, {
      'Customer Key': 'customerId',
      'Customer Name': 'customerName',
      'Customer Type': 'customerType',
      'Customer Status': 'status',
      'Registration Date': 'registrationDate'
    });
    
    const pagination = ApiSchema.createPagination(
      filters.page,
      filters.limit,
      result.totalRows
    );
    
    res.json(
      ApiSchema.createSuccessResponse(
        {
          customers: transformedRows,
          segmentType: filters.segmentType,
          summary: {
            totalCustomers: result.totalRows,
            currentPage: filters.page
          }
        },
        { executionTime: result.executionTime },
        pagination
      )
    );
    
  } catch (error) {
    logger.error('Customer segmentation query failed:', error);
    res.status(500).json(
      ApiSchema.createErrorResponse(
        'Failed to retrieve customer segmentation',
        'QUERY_ERROR',
        { error: error.message }
      )
    );
  }
});

/**
 * GET /api/v1/customer/churn-prediction
 * Churn prediction analysis (mock implementation with real data structure)
 */
router.get('/churn-prediction', authorizePermission('read:customer'), async (req, res) => {
  try {
    logger.info('Churn prediction endpoint accessed', { userId: req.user?.id });
    
    const validation = ApiSchema.validateQuery(req.query, QuerySchemas.churnPrediction);
    if (!validation.isValid) {
      return res.status(400).json(
        ApiSchema.createErrorResponse(
          'Invalid query parameters',
          'VALIDATION_ERROR',
          { validationErrors: validation.errors },
          400
        )
      );
    }
    
    const filters = validation.validated;
    const customerDb = ConnectorRegistry.get('customer-db');
    
    // Get customer data for churn analysis
    const queryBuilder = new QueryBuilder()
      .useConnector(customerDb)
      .from('dbo_D_Customer')
      .select([
        'Customer Key as customerId',
        'Customer Name as customerName',
        'Customer Status as status',
        'Registration Date as registrationDate'
      ])
      .paginate(filters.page, filters.limit);
    
    // Filter by risk level (mock implementation)
    if (filters.riskLevel !== 'all') {
      // In real implementation, this would be based on ML model predictions
      queryBuilder.where({ 'Customer Status': 'Active' });
    }
    
    const result = await queryBuilder.execute();
    
    // Transform field names first
    const transformedRows = DataTransformer.transformFieldNames(result.rows, {
      'Customer Key': 'customerId',
      'Customer Name': 'customerName',
      'Customer Status': 'status',
      'Registration Date': 'registrationDate'
    });
    
    // Add mock churn predictions  
    const enhancedRows = DataTransformer.addCalculatedFields(transformedRows, {
      churnRisk: (row) => {
        const customerKey = parseInt(row.customerId) || 1;
        const risk = (customerKey % 100) / 100;
        if (risk < 0.3) return 'low';
        if (risk < 0.7) return 'medium';
        return 'high';
      },
      churnProbability: (row) => {
        const customerKey = parseInt(row.customerId) || 1;
        return ((customerKey % 100) / 100).toFixed(2);
      },
      predictedChurnDate: (row) => {
        const customerKey = parseInt(row.customerId) || 1;
        const daysFromBase = 30 + (customerKey % 60);
        const baseDate = new Date('2022-01-01');
        baseDate.setDate(baseDate.getDate() + daysFromBase);
        return baseDate.toISOString().split('T')[0];
      }
    });
    
    // Filter by risk level after calculation
    let filteredRows = enhancedRows;
    if (filters.riskLevel !== 'all') {
      filteredRows = enhancedRows.filter(row => row.churnRisk === filters.riskLevel);
    }
    
    const pagination = ApiSchema.createPagination(
      filters.page,
      filters.limit,
      filteredRows.length
    );
    
    res.json(
      ApiSchema.createSuccessResponse(
        {
          predictions: filteredRows,
          riskLevel: filters.riskLevel,
          modelVersion: filters.modelVersion,
          summary: {
            totalPredictions: filteredRows.length,
            riskDistribution: {
              low: filteredRows.filter(r => r.churnRisk === 'low').length,
              medium: filteredRows.filter(r => r.churnRisk === 'medium').length,
              high: filteredRows.filter(r => r.churnRisk === 'high').length
            }
          }
        },
        { 
          executionTime: result.executionTime,
          note: 'This is a mock implementation with sample predictions'
        },
        pagination
      )
    );
    
  } catch (error) {
    logger.error('Churn prediction query failed:', error);
    res.status(500).json(
      ApiSchema.createErrorResponse(
        'Failed to retrieve churn predictions',
        'QUERY_ERROR',
        { error: error.message }
      )
    );
  }
});

/**
 * GET /api/v1/customer/lifetime-value
 * Customer lifetime value analysis
 */
router.get('/lifetime-value', authorizePermission('read:customer'), async (req, res) => {
  try {
    const customerDb = ConnectorRegistry.get('customer-db');
    
    // Get customer transaction aggregates
    const result = await customerDb.safeQuery({
      sql: `
        SELECT 
          c."Customer Key" as customerId,
          c."Customer Name" as customerName,
          COUNT(t."Sales Txn Key") as transactionCount,
          SUM(t."Extended Price") as totalSpent,
          AVG(t."Extended Price") as avgTransactionValue,
          MIN(t."Txn Date") as firstTransaction,
          MAX(t."Txn Date") as lastTransaction
        FROM dbo_D_Customer c
        LEFT JOIN dbo_F_Sales_Transaction t ON c."Customer Key" = t."Customer Key"
        GROUP BY c."Customer Key", c."Customer Name"
        ORDER BY totalSpent DESC
        LIMIT 100
      `
    });
    
    // Calculate CLV metrics
    const enhancedRows = DataTransformer.addCalculatedFields(result.rows, {
      estimatedLifetimeValue: (row) => {
        const monthlyValue = (row.totalSpent || 0) / Math.max(1, 
          Math.ceil((new Date() - new Date(row.firstTransaction)) / (30 * 24 * 60 * 60 * 1000))
        );
        return monthlyValue * 24; // Estimate 24 month LTV
      },
      customerSegment: (row) => {
        const totalSpent = row.totalSpent || 0;
        if (totalSpent > 5000) return 'premium';
        if (totalSpent > 1000) return 'standard';
        return 'basic';
      }
    });
    
    const formattedRows = DataTransformer.formatNumericValues(enhancedRows, {
      totalSpent: { type: 'currency', currency: 'USD' },
      avgTransactionValue: { type: 'currency', currency: 'USD' },
      estimatedLifetimeValue: { type: 'currency', currency: 'USD' }
    });
    
    res.json(
      ApiSchema.createSuccessResponse({
        customers: formattedRows,
        summary: {
          totalCustomers: result.rowCount,
          avgLifetimeValue: formattedRows.reduce((sum, row) => 
            sum + (parseFloat(row.estimatedLifetimeValue.replace(/[$,]/g, '')) || 0), 0
          ) / formattedRows.length
        }
      }, { executionTime: result.executionTime })
    );
    
  } catch (error) {
    logger.error('Customer lifetime value query failed:', error);
    res.status(500).json(
      ApiSchema.createErrorResponse(
        'Failed to retrieve customer lifetime value',
        'QUERY_ERROR',
        { error: error.message }
      )
    );
  }
});

// Health check for customer domain
router.get('/health', (req, res) => {
  try {
    const customerDb = ConnectorRegistry.get('customer-db');
    
    res.json(
      ApiSchema.createSuccessResponse({
        domain: 'customer',
        status: 'healthy',
        connector: customerDb.getInfo(),
        endpoints: {
          'transaction-patterns': 'active',
          'segmentation': 'active',
          'churn-prediction': 'active',
          'lifetime-value': 'active'
        }
      })
    );
  } catch (error) {
    res.status(500).json(
      ApiSchema.createErrorResponse(
        'Customer domain health check failed',
        'HEALTH_CHECK_ERROR',
        { error: error.message }
      )
    );
  }
});

module.exports = router;