const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');
const { authorizePermission } = require('../../middleware/auth/authMiddleware');
const { ApiSchema, QuerySchemas } = require('../../schemas/ApiSchema');
const { QueryBuilder, CommonQueries, DataTransformer } = require('../../utils/QueryBuilder');
const { ConnectorRegistry } = require('../../connectors/ConnectorRegistry');

/**
 * GET /api/v1/sales/product-performance
 * Product performance analysis with real sales data
 */
router.get('/product-performance', authorizePermission('read:sales'), async (req, res) => {
  try {
    logger.info('Product performance endpoint accessed', { 
      userId: req.user?.id, 
      query: req.query 
    });
    
    const validation = ApiSchema.validateQuery(req.query, QuerySchemas.productPerformance);
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
    
    // Use customer database since it contains sales transaction data
    const customerDb = ConnectorRegistry.get('customer-db');
    
    // Build product performance aggregation query
    const queryBuilder = new QueryBuilder()
      .useConnector(customerDb)
      .from('dbo_F_Sales_Transaction')
      .select([
        'Item Number as productId',
        'COUNT(*) as transactionCount',
        'SUM(Quantity) as totalQuantity',
        'SUM(Extended Price) as totalRevenue',
        'AVG(Extended Price) as avgTransactionValue',
        'AVG(Unit Price) as avgUnitPrice'
      ]);
    
    // Apply filters
    if (filters.productId) {
      queryBuilder.where({ 'Item Number': filters.productId });
    }
    
    if (filters.startDate && filters.endDate) {
      queryBuilder.dateRange('Txn Date', filters.startDate, filters.endDate);
    }
    
    if (filters.minRevenue) {
      queryBuilder.whereComparison('Extended Price', '>=', filters.minRevenue);
    }
    
    // Use raw SQL for GROUP BY since QueryBuilder doesn't have explicit support yet
    const rawQuery = {
      sql: `
        SELECT 
          "Item Number" as productId,
          COUNT(*) as transactionCount,
          SUM("Quantity") as totalQuantity,
          SUM("Extended Price") as totalRevenue,
          AVG("Extended Price") as avgTransactionValue,
          AVG("Unit Price") as avgUnitPrice,
          MIN("Txn Date") as firstSale,
          MAX("Txn Date") as lastSale
        FROM dbo_F_Sales_Transaction
        ${filters.startDate && filters.endDate ? 
          `WHERE "Txn Date" BETWEEN '${filters.startDate}' AND '${filters.endDate}'` : 
          ''
        }
        ${filters.productId ? 
          `${filters.startDate && filters.endDate ? 'AND' : 'WHERE'} "Item Number" = '${filters.productId}'` : 
          ''
        }
        GROUP BY "Item Number"
        ORDER BY totalRevenue DESC
        LIMIT ${filters.limit}
      `
    };
    
    const result = await customerDb.safeQuery(rawQuery);
    
    // Add calculated fields and transformations
    const enhancedRows = DataTransformer.addCalculatedFields(result.rows, {
      avgQuantityPerTransaction: (row) => 
        row.transactionCount > 0 ? (row.totalQuantity / row.transactionCount).toFixed(2) : 0,
      revenuePerUnit: (row) => 
        row.totalQuantity > 0 ? (row.totalRevenue / row.totalQuantity).toFixed(2) : 0,
      performanceCategory: (row) => {
        if (row.totalRevenue > 10000) return 'high-performer';
        if (row.totalRevenue > 5000) return 'medium-performer';
        return 'low-performer';
      },
      salesVelocity: (row) => {
        if (!row.firstSale || !row.lastSale) return 0;
        const daysDiff = Math.ceil((new Date(row.lastSale) - new Date(row.firstSale)) / (1000 * 60 * 60 * 24)) || 1;
        return (row.transactionCount / daysDiff * 30).toFixed(2); // Transactions per month
      }
    });
    
    // Format currency values
    const formattedRows = DataTransformer.formatNumericValues(enhancedRows, {
      totalRevenue: { type: 'currency', currency: 'USD' },
      avgTransactionValue: { type: 'currency', currency: 'USD' },
      avgUnitPrice: { type: 'currency', currency: 'USD' },
      revenuePerUnit: { type: 'currency', currency: 'USD' }
    });
    
    // Calculate summary statistics
    const summary = {
      totalProducts: result.rowCount,
      totalRevenue: formattedRows.reduce((sum, row) => 
        sum + parseFloat(row.totalRevenue.replace(/[$,]/g, '')), 0
      ),
      avgRevenuePerProduct: 0,
      topPerformer: formattedRows[0]?.productId || null
    };
    summary.avgRevenuePerProduct = summary.totalProducts > 0 ? 
      (summary.totalRevenue / summary.totalProducts).toFixed(2) : 0;
    
    const pagination = ApiSchema.createPagination(
      filters.page,
      filters.limit,
      result.rowCount
    );
    
    res.json(
      ApiSchema.createSuccessResponse(
        {
          products: formattedRows,
          summary: {
            ...summary,
            totalRevenue: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(summary.totalRevenue),
            avgRevenuePerProduct: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(summary.avgRevenuePerProduct)
          }
        },
        { executionTime: result.executionTime },
        pagination
      )
    );
    
  } catch (error) {
    logger.error('Product performance query failed:', error);
    res.status(500).json(
      ApiSchema.createErrorResponse(
        'Failed to retrieve product performance data',
        'QUERY_ERROR',
        { error: error.message }
      )
    );
  }
});

/**
 * GET /api/v1/sales/sales-trends
 * Sales trends analysis with time-based aggregation
 */
router.get('/sales-trends', authorizePermission('read:sales'), async (req, res) => {
  try {
    logger.info('Sales trends endpoint accessed', { userId: req.user?.id });
    
    const validation = ApiSchema.validateQuery(req.query, QuerySchemas.salesTrends);
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
    
    // Build time-based aggregation query based on granularity
    let dateFormat, groupBy;
    switch (filters.granularity) {
      case 'daily':
        dateFormat = "strftime('%Y-%m-%d', \"Txn Date\")";
        groupBy = "DATE(\"Txn Date\")";
        break;
      case 'weekly':
        dateFormat = "strftime('%Y-W%W', \"Txn Date\")";
        groupBy = "strftime('%Y-%W', \"Txn Date\")";
        break;
      case 'monthly':
        dateFormat = "strftime('%Y-%m', \"Txn Date\")";
        groupBy = "strftime('%Y-%m', \"Txn Date\")";
        break;
      case 'quarterly':
        dateFormat = "strftime('%Y-Q', \"Txn Date\") || CASE WHEN CAST(strftime('%m', \"Txn Date\") AS INTEGER) <= 3 THEN '1' WHEN CAST(strftime('%m', \"Txn Date\") AS INTEGER) <= 6 THEN '2' WHEN CAST(strftime('%m', \"Txn Date\") AS INTEGER) <= 9 THEN '3' ELSE '4' END";
        groupBy = "strftime('%Y', \"Txn Date\"), ((CAST(strftime('%m', \"Txn Date\") AS INTEGER) - 1) / 3)";
        break;
      default:
        dateFormat = "strftime('%Y-%m', \"Txn Date\")";
        groupBy = "strftime('%Y-%m', \"Txn Date\")";
    }
    
    const rawQuery = {
      sql: `
        SELECT 
          ${dateFormat} as period,
          COUNT(*) as transactionCount,
          SUM("Quantity") as totalUnits,
          SUM("Extended Price") as totalRevenue,
          AVG("Extended Price") as avgTransactionValue,
          COUNT(DISTINCT "Customer Key") as uniqueCustomers,
          COUNT(DISTINCT "Item Number") as uniqueProducts
        FROM dbo_F_Sales_Transaction
        ${filters.startDate && filters.endDate ? 
          `WHERE "Txn Date" BETWEEN '${filters.startDate}' AND '${filters.endDate}'` : 
          'WHERE "Txn Date" >= date("now", "-1 year")'
        }
        GROUP BY ${groupBy}
        ORDER BY period ASC
      `
    };
    
    const result = await customerDb.safeQuery(rawQuery);
    
    // Add calculated fields
    const enhancedRows = DataTransformer.addCalculatedFields(result.rows, {
      revenueGrowth: (row, index, rows) => {
        if (index === 0) return 0;
        const prevRevenue = rows[index - 1].totalRevenue;
        return prevRevenue > 0 ? 
          (((row.totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(2) : 0;
      },
      customerGrowth: (row, index, rows) => {
        if (index === 0) return 0;
        const prevCustomers = rows[index - 1].uniqueCustomers;
        return prevCustomers > 0 ? 
          (((row.uniqueCustomers - prevCustomers) / prevCustomers) * 100).toFixed(2) : 0;
      },
      averageOrderValue: (row) => 
        row.transactionCount > 0 ? (row.totalRevenue / row.transactionCount).toFixed(2) : 0
    });
    
    // Format currency values
    const formattedRows = DataTransformer.formatNumericValues(enhancedRows, {
      totalRevenue: { type: 'currency', currency: 'USD' },
      avgTransactionValue: { type: 'currency', currency: 'USD' },
      averageOrderValue: { type: 'currency', currency: 'USD' }
    });
    
    // Calculate trend summary
    const summary = {
      totalPeriods: result.rowCount,
      granularity: filters.granularity,
      overallRevenue: formattedRows.reduce((sum, row) => 
        sum + parseFloat(row.totalRevenue.replace(/[$,]/g, '')), 0
      ),
      avgRevenuePerPeriod: 0,
      totalTransactions: formattedRows.reduce((sum, row) => sum + row.transactionCount, 0),
      totalCustomers: Math.max(...formattedRows.map(row => row.uniqueCustomers)),
      overallGrowth: formattedRows.length >= 2 ? 
        formattedRows[formattedRows.length - 1].revenueGrowth : 0
    };
    summary.avgRevenuePerPeriod = summary.totalPeriods > 0 ? 
      (summary.overallRevenue / summary.totalPeriods).toFixed(2) : 0;
    
    res.json(
      ApiSchema.createSuccessResponse(
        {
          trends: formattedRows,
          summary: {
            ...summary,
            overallRevenue: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(summary.overallRevenue),
            avgRevenuePerPeriod: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(summary.avgRevenuePerPeriod)
          }
        },
        { executionTime: result.executionTime }
      )
    );
    
  } catch (error) {
    logger.error('Sales trends query failed:', error);
    res.status(500).json(
      ApiSchema.createErrorResponse(
        'Failed to retrieve sales trends',
        'QUERY_ERROR',
        { error: error.message }
      )
    );
  }
});

/**
 * GET /api/v1/sales/sales-performance
 * Overall sales performance metrics
 */
router.get('/sales-performance', authorizePermission('read:sales'), async (req, res) => {
  try {
    logger.info('Sales performance endpoint accessed', { userId: req.user?.id });
    
    const customerDb = ConnectorRegistry.get('customer-db');
    
    // Get comprehensive sales performance metrics
    const metricsQuery = {
      sql: `
        SELECT 
          COUNT(*) as totalTransactions,
          SUM("Extended Price") as totalRevenue,
          AVG("Extended Price") as avgTransactionValue,
          SUM("Quantity") as totalUnitsSold,
          COUNT(DISTINCT "Customer Key") as totalCustomers,
          COUNT(DISTINCT "Item Number") as totalProducts,
          MIN("Txn Date") as firstSaleDate,
          MAX("Txn Date") as lastSaleDate,
          (SELECT COUNT(*) FROM dbo_F_Sales_Transaction WHERE "Txn Date" >= date('now', '-30 days')) as last30DaysTransactions,
          (SELECT SUM("Extended Price") FROM dbo_F_Sales_Transaction WHERE "Txn Date" >= date('now', '-30 days')) as last30DaysRevenue,
          (SELECT COUNT(*) FROM dbo_F_Sales_Transaction WHERE "Txn Date" >= date('now', '-7 days')) as last7DaysTransactions,
          (SELECT SUM("Extended Price") FROM dbo_F_Sales_Transaction WHERE "Txn Date" >= date('now', '-7 days')) as last7DaysRevenue
        FROM dbo_F_Sales_Transaction
      `
    };
    
    const result = await customerDb.safeQuery(metricsQuery);
    const metrics = result.rows[0];
    
    // Calculate additional performance indicators
    const performanceMetrics = {
      ...metrics,
      avgRevenuePerCustomer: metrics.totalCustomers > 0 ? 
        (metrics.totalRevenue / metrics.totalCustomers).toFixed(2) : 0,
      avgRevenuePerProduct: metrics.totalProducts > 0 ? 
        (metrics.totalRevenue / metrics.totalProducts).toFixed(2) : 0,
      avgUnitsPerTransaction: metrics.totalTransactions > 0 ? 
        (metrics.totalUnitsSold / metrics.totalTransactions).toFixed(2) : 0,
      dailyAvgRevenue: (() => {
        if (!metrics.firstSaleDate || !metrics.lastSaleDate) return 0;
        const daysDiff = Math.ceil(
          (new Date(metrics.lastSaleDate) - new Date(metrics.firstSaleDate)) / (1000 * 60 * 60 * 24)
        ) || 1;
        return (metrics.totalRevenue / daysDiff).toFixed(2);
      })(),
      last30DaysGrowth: (() => {
        const prev30DaysRevenue = metrics.totalRevenue - (metrics.last30DaysRevenue || 0);
        return prev30DaysRevenue > 0 ? 
          (((metrics.last30DaysRevenue - prev30DaysRevenue) / prev30DaysRevenue) * 100).toFixed(2) : 0;
      })(),
      weekOverWeekGrowth: (() => {
        // This is a simplified calculation - in reality, you'd compare specific weeks
        const weeklyAvg = metrics.totalRevenue / 52; // Approximate weekly average
        const lastWeekRevenue = metrics.last7DaysRevenue || 0;
        return weeklyAvg > 0 ? 
          (((lastWeekRevenue - weeklyAvg) / weeklyAvg) * 100).toFixed(2) : 0;
      })()
    };
    
    // Format currency values
    const formattedMetrics = DataTransformer.formatNumericValues([performanceMetrics], {
      totalRevenue: { type: 'currency', currency: 'USD' },
      avgTransactionValue: { type: 'currency', currency: 'USD' },
      avgRevenuePerCustomer: { type: 'currency', currency: 'USD' },
      avgRevenuePerProduct: { type: 'currency', currency: 'USD' },
      dailyAvgRevenue: { type: 'currency', currency: 'USD' },
      last30DaysRevenue: { type: 'currency', currency: 'USD' },
      last7DaysRevenue: { type: 'currency', currency: 'USD' }
    })[0];
    
    // Performance indicators
    const indicators = {
      revenueHealth: formattedMetrics.last30DaysGrowth > 0 ? 'growing' : 
                    formattedMetrics.last30DaysGrowth < -10 ? 'declining' : 'stable',
      customerEngagement: metrics.avgTransactionValue > 100 ? 'high' : 
                         metrics.avgTransactionValue > 50 ? 'medium' : 'low',
      productDiversity: metrics.totalProducts > 1000 ? 'high' : 
                       metrics.totalProducts > 100 ? 'medium' : 'low'
    };
    
    res.json(
      ApiSchema.createSuccessResponse({
        metrics: formattedMetrics,
        indicators: indicators,
        summary: {
          overallPerformance: indicators.revenueHealth === 'growing' ? 'excellent' : 
                            indicators.revenueHealth === 'stable' ? 'good' : 'needs attention',
          keyStrengths: [
            indicators.customerEngagement === 'high' ? 'High customer engagement' : null,
            indicators.productDiversity === 'high' ? 'Diverse product portfolio' : null,
            formattedMetrics.last30DaysGrowth > 5 ? 'Strong recent growth' : null
          ].filter(Boolean),
          recommendations: [
            indicators.revenueHealth === 'declining' ? 'Focus on customer retention' : null,
            indicators.customerEngagement === 'low' ? 'Improve transaction value' : null,
            indicators.productDiversity === 'low' ? 'Expand product range' : null
          ].filter(Boolean)
        }
      }, { executionTime: result.executionTime })
    );
    
  } catch (error) {
    logger.error('Sales performance query failed:', error);
    res.status(500).json(
      ApiSchema.createErrorResponse(
        'Failed to retrieve sales performance metrics',
        'QUERY_ERROR',
        { error: error.message }
      )
    );
  }
});

/**
 * GET /api/v1/sales/top-customers
 * Top customers by revenue
 */
router.get('/top-customers', authorizePermission('read:sales'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const customerDb = ConnectorRegistry.get('customer-db');
    
    const result = await customerDb.safeQuery({
      sql: `
        SELECT 
          t."Customer Key" as customerId,
          c."Customer Name" as customerName,
          COUNT(t."Sales Txn Key") as transactionCount,
          SUM(t."Extended Price") as totalRevenue,
          AVG(t."Extended Price") as avgTransactionValue,
          SUM(t."Quantity") as totalQuantity,
          MIN(t."Txn Date") as firstPurchase,
          MAX(t."Txn Date") as lastPurchase
        FROM dbo_F_Sales_Transaction t
        LEFT JOIN dbo_D_Customer c ON t."Customer Key" = c."Customer Key"
        GROUP BY t."Customer Key", c."Customer Name"
        ORDER BY totalRevenue DESC
        LIMIT ${limit}
      `
    });
    
    const formattedRows = DataTransformer.formatNumericValues(result.rows, {
      totalRevenue: { type: 'currency', currency: 'USD' },
      avgTransactionValue: { type: 'currency', currency: 'USD' }
    });
    
    res.json(
      ApiSchema.createSuccessResponse({
        topCustomers: formattedRows,
        summary: {
          totalCustomers: result.rowCount,
          topCustomerRevenue: formattedRows[0]?.totalRevenue || '$0.00'
        }
      }, { executionTime: result.executionTime })
    );
    
  } catch (error) {
    logger.error('Top customers query failed:', error);
    res.status(500).json(
      ApiSchema.createErrorResponse(
        'Failed to retrieve top customers',
        'QUERY_ERROR',
        { error: error.message }
      )
    );
  }
});

// Health check for sales domain
router.get('/health', (req, res) => {
  try {
    const customerDb = ConnectorRegistry.get('customer-db');
    
    res.json(
      ApiSchema.createSuccessResponse({
        domain: 'sales',
        status: 'healthy',
        connector: customerDb.getInfo(),
        endpoints: {
          'product-performance': 'active',
          'sales-performance': 'active',
          'sales-trends': 'active',
          'top-customers': 'active'
        }
      })
    );
  } catch (error) {
    res.status(500).json(
      ApiSchema.createErrorResponse(
        'Sales domain health check failed',
        'HEALTH_CHECK_ERROR',
        { error: error.message }
      )
    );
  }
});

module.exports = router;