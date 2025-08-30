const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');
const { authorizePermission } = require('../../middleware/auth/authMiddleware');
const { ApiSchema, QuerySchemas } = require('../../schemas/ApiSchema');
const { QueryBuilder, CommonQueries, DataTransformer } = require('../../utils/QueryBuilder');
const { ConnectorRegistry } = require('../../connectors/ConnectorRegistry');
const arAgingRouter = require('./ar-aging');

/**
 * GET /api/v1/finance/reports
 * Financial reports and statements
 */
router.get('/reports', authorizePermission('read:finance'), async (req, res) => {
  try {
    logger.info('Financial reports endpoint accessed', { 
      userId: req.user?.id, 
      query: req.query 
    });
    
    const validation = ApiSchema.validateQuery(req.query, QuerySchemas.financialReports);
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
    
    // Generate financial reports based on sales transaction data
    let reportQuery;
    
    switch (filters.reportType) {
      case 'income':
        reportQuery = {
          sql: `
            SELECT 
              strftime('%Y-%m', "Txn Date") as period,
              SUM("Extended Price") as revenue,
              COUNT(*) as transactionCount,
              AVG("Extended Price") as avgTransactionValue,
              SUM("Quantity") as unitsSold
            FROM dbo_F_Sales_Transaction
            ${filters.startDate && filters.endDate ? 
              `WHERE "Txn Date" BETWEEN '${filters.startDate}' AND '${filters.endDate}'` : 
              'WHERE "Txn Date" >= date("now", "-12 months")'
            }
            GROUP BY strftime('%Y-%m', "Txn Date")
            ORDER BY period DESC
            LIMIT ${filters.limit}
          `
        };
        break;
        
      case 'balance':
        reportQuery = {
          sql: `
            SELECT 
              'current_assets' as category,
              SUM("Extended Price") as amount,
              'Current period sales value' as description
            FROM dbo_F_Sales_Transaction
            WHERE "Txn Date" >= date('now', '-30 days')
            UNION ALL
            SELECT 
              'accounts_receivable' as category,
              SUM("Extended Price") * 0.15 as amount,
              'Estimated outstanding receivables' as description
            FROM dbo_F_Sales_Transaction
            WHERE "Txn Date" >= date('now', '-90 days')
            UNION ALL
            SELECT 
              'revenue' as category,
              SUM("Extended Price") as amount,
              'Total revenue (last 12 months)' as description
            FROM dbo_F_Sales_Transaction
            WHERE "Txn Date" >= date('now', '-12 months')
            ORDER BY category
          `
        };
        break;
        
      case 'cashflow':
        reportQuery = {
          sql: `
            SELECT 
              strftime('%Y-%m', "Txn Date") as period,
              SUM("Extended Price") as cashInflow,
              SUM("Extended Price") * 0.7 as estimatedCashOutflow,
              SUM("Extended Price") * 0.3 as netCashFlow,
              COUNT(DISTINCT "Customer Key") as activeCustomers
            FROM dbo_F_Sales_Transaction
            ${filters.startDate && filters.endDate ? 
              `WHERE "Txn Date" BETWEEN '${filters.startDate}' AND '${filters.endDate}'` : 
              'WHERE "Txn Date" >= date("now", "-6 months")'
            }
            GROUP BY strftime('%Y-%m', "Txn Date")
            ORDER BY period DESC
            LIMIT ${filters.limit}
          `
        };
        break;
        
      default: // summary
        reportQuery = {
          sql: `
            SELECT 
              SUM("Extended Price") as totalRevenue,
              COUNT(*) as totalTransactions,
              COUNT(DISTINCT "Customer Key") as totalCustomers,
              COUNT(DISTINCT "Item Number") as totalProducts,
              AVG("Extended Price") as avgTransactionValue,
              MIN("Txn Date") as oldestTransaction,
              MAX("Txn Date") as newestTransaction,
              SUM(CASE WHEN "Txn Date" >= date('now', '-30 days') THEN "Extended Price" ELSE 0 END) as last30DaysRevenue,
              SUM(CASE WHEN "Txn Date" >= date('now', '-90 days') THEN "Extended Price" ELSE 0 END) as last90DaysRevenue
            FROM dbo_F_Sales_Transaction
          `
        };
    }
    
    const result = await customerDb.safeQuery(reportQuery);
    
    // Process results based on report type
    let processedData;
    
    if (filters.reportType === 'summary') {
      const metrics = result.rows[0];
      
      // Calculate additional financial metrics
      processedData = DataTransformer.addCalculatedFields([metrics], {
        monthlyGrowthRate: (row) => {
          if (row.last90DaysRevenue > 0 && row.last30DaysRevenue > 0) {
            const monthlyAvg90Days = row.last90DaysRevenue / 3;
            return (((row.last30DaysRevenue - monthlyAvg90Days) / monthlyAvg90Days) * 100).toFixed(2);
          }
          return 0;
        },
        customerLifetimeValue: (row) => 
          row.totalCustomers > 0 ? (row.totalRevenue / row.totalCustomers).toFixed(2) : 0,
        dailyRevenue: (row) => {
          if (!row.oldestTransaction || !row.newestTransaction) return 0;
          const daysDiff = Math.ceil(
            (new Date(row.newestTransaction) - new Date(row.oldestTransaction)) / (1000 * 60 * 60 * 24)
          ) || 1;
          return (row.totalRevenue / daysDiff).toFixed(2);
        },
        revenuePerProduct: (row) => 
          row.totalProducts > 0 ? (row.totalRevenue / row.totalProducts).toFixed(2) : 0
      });
      
    } else {
      // For time-series reports, add calculated fields
      processedData = DataTransformer.addCalculatedFields(result.rows, {
        profitMargin: (row) => {
          // Mock profit margin calculation
          const revenue = row.revenue || row.cashInflow || row.amount || 0;
          return revenue > 0 ? ((revenue * 0.25) / revenue * 100).toFixed(2) : 0;
        },
        growthRate: (row, index, rows) => {
          if (index === rows.length - 1) return 0; // No previous period for oldest record
          const currentValue = row.revenue || row.cashInflow || row.amount || 0;
          const previousValue = rows[index + 1]?.revenue || rows[index + 1]?.cashInflow || rows[index + 1]?.amount || 0;
          return previousValue > 0 ? (((currentValue - previousValue) / previousValue) * 100).toFixed(2) : 0;
        }
      });
    }
    
    // Format currency values
    const currencyFields = filters.reportType === 'summary' ? 
      {
        totalRevenue: { type: 'currency', currency: 'USD' },
        avgTransactionValue: { type: 'currency', currency: 'USD' },
        last30DaysRevenue: { type: 'currency', currency: 'USD' },
        last90DaysRevenue: { type: 'currency', currency: 'USD' },
        customerLifetimeValue: { type: 'currency', currency: 'USD' },
        dailyRevenue: { type: 'currency', currency: 'USD' },
        revenuePerProduct: { type: 'currency', currency: 'USD' }
      } : 
      {
        revenue: { type: 'currency', currency: 'USD' },
        cashInflow: { type: 'currency', currency: 'USD' },
        estimatedCashOutflow: { type: 'currency', currency: 'USD' },
        netCashFlow: { type: 'currency', currency: 'USD' },
        amount: { type: 'currency', currency: 'USD' },
        avgTransactionValue: { type: 'currency', currency: 'USD' }
      };
    
    const formattedData = DataTransformer.formatNumericValues(processedData, currencyFields);
    
    // Generate financial insights
    const insights = filters.reportType === 'summary' ? {
      performance: formattedData[0]?.monthlyGrowthRate > 0 ? 'growing' : 'declining',
      customerValue: parseFloat(formattedData[0]?.customerLifetimeValue?.replace(/[$,]/g, '') || 0) > 1000 ? 'high' : 'medium',
      recommendations: [
        parseFloat(formattedData[0]?.monthlyGrowthRate || 0) < 0 ? 'Focus on customer retention and acquisition' : null,
        parseFloat(formattedData[0]?.avgTransactionValue?.replace(/[$,]/g, '') || 0) < 100 ? 'Work on increasing average transaction value' : null,
        'Consider expanding into high-performing product categories'
      ].filter(Boolean)
    } : null;
    
    const pagination = ApiSchema.createPagination(
      filters.page,
      filters.limit,
      result.rowCount
    );
    
    res.json(
      ApiSchema.createSuccessResponse(
        {
          reportType: filters.reportType,
          data: formattedData,
          insights: insights,
          summary: {
            reportPeriod: filters.startDate && filters.endDate ? 
              `${filters.startDate} to ${filters.endDate}` : 'Last 12 months',
            generatedAt: new Date().toISOString(),
            dataQuality: 'high'
          }
        },
        { executionTime: result.executionTime },
        pagination
      )
    );
    
  } catch (error) {
    logger.error('Financial reports query failed:', error);
    res.status(500).json(
      ApiSchema.createErrorResponse(
        'Failed to retrieve financial reports',
        'QUERY_ERROR',
        { error: error.message }
      )
    );
  }
});

/**
 * GET /api/v1/finance/ar-analysis
 * Accounts Receivable analysis
 */
router.get('/ar-analysis', authorizePermission('read:finance'), async (req, res) => {
  try {
    logger.info('AR analysis endpoint accessed', { userId: req.user?.id });
    
    const validation = ApiSchema.validateQuery(req.query, {
      fields: {
        ...ApiSchema.commonSchemas.pagination.fields,
        ...ApiSchema.commonSchemas.dateRange.fields,
        agingPeriods: { type: 'boolean', default: true }
      }
    });
    
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
    
    // AR Analysis based on sales transactions
    const arQuery = {
      sql: `
        SELECT 
          c."Customer Key" as customerId,
          c."Customer Name" as customerName,
          SUM(ar."Amount Due") as totalAmountDue,
          SUM(ar."Amount Paid") as totalAmountPaid,
          (SUM(ar."Amount Due") - SUM(ar."Amount Paid")) as outstandingBalance,
          AVG(julianday('now') - julianday(ar."Due Date")) as avgDaysOverdue,
          COUNT(*) as invoiceCount,
          MIN(ar."Invoice Date") as oldestInvoiceDate,
          MAX(ar."Due Date") as latestDueDate
        FROM dbo_D_Customer c
        LEFT JOIN dbo_F_AR_Detail ar ON c."Customer Key" = ar."Customer Key"
        WHERE ar."Amount Due" > ar."Amount Paid"
        GROUP BY c."Customer Key", c."Customer Name"
        HAVING outstandingBalance > 0
        ORDER BY outstandingBalance DESC
        LIMIT ${filters.limit}
      `
    };
    
    const result = await customerDb.safeQuery(arQuery);
    
    // Add calculated fields for AR analysis
    const enhancedRows = DataTransformer.addCalculatedFields(result.rows, {
      riskCategory: (row) => {
        const daysOverdue = Math.max(0, row.avgDaysOverdue || 0);
        if (daysOverdue > 90) return 'high-risk';
        if (daysOverdue > 30) return 'medium-risk';
        return 'low-risk';
      },
      collectionPriority: (row) => {
        const balance = row.outstandingBalance || 0;
        const daysOverdue = Math.max(0, row.avgDaysOverdue || 0);
        
        if (balance > 10000 && daysOverdue > 60) return 'critical';
        if (balance > 5000 && daysOverdue > 30) return 'high';
        if (daysOverdue > 30) return 'medium';
        return 'low';
      },
      paymentTrend: (row) => {
        // Mock payment trend based on amount paid vs due
        const paymentRatio = row.totalAmountDue > 0 ? 
          (row.totalAmountPaid / row.totalAmountDue) : 0;
        
        if (paymentRatio > 0.8) return 'good';
        if (paymentRatio > 0.5) return 'fair';
        return 'poor';
      },
      estimatedCollectionDate: (row) => {
        const daysOverdue = Math.max(0, row.avgDaysOverdue || 0);
        const additionalDays = daysOverdue > 60 ? 45 : 15; // Estimate collection time
        const collectionDate = new Date();
        collectionDate.setDate(collectionDate.getDate() + additionalDays);
        return collectionDate.toISOString().split('T')[0];
      }
    });
    
    // Format currency values
    const formattedRows = DataTransformer.formatNumericValues(enhancedRows, {
      totalAmountDue: { type: 'currency', currency: 'USD' },
      totalAmountPaid: { type: 'currency', currency: 'USD' },
      outstandingBalance: { type: 'currency', currency: 'USD' }
    });
    
    // Calculate AR summary metrics
    const summary = {
      totalCustomersWithAR: result.rowCount,
      totalOutstanding: formattedRows.reduce((sum, row) => 
        sum + parseFloat(row.outstandingBalance.replace(/[$,]/g, '')), 0
      ),
      avgDaysOverdue: formattedRows.reduce((sum, row) => 
        sum + (row.avgDaysOverdue || 0), 0
      ) / Math.max(1, result.rowCount),
      riskDistribution: {
        low: formattedRows.filter(r => r.riskCategory === 'low-risk').length,
        medium: formattedRows.filter(r => r.riskCategory === 'medium-risk').length,
        high: formattedRows.filter(r => r.riskCategory === 'high-risk').length
      },
      criticalAccounts: formattedRows.filter(r => r.collectionPriority === 'critical').length
    };
    
    const pagination = ApiSchema.createPagination(
      filters.page,
      filters.limit,
      result.rowCount
    );
    
    res.json(
      ApiSchema.createSuccessResponse(
        {
          receivables: formattedRows,
          summary: {
            ...summary,
            totalOutstanding: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(summary.totalOutstanding),
            avgDaysOverdue: Math.round(summary.avgDaysOverdue),
            collectionEfficiency: summary.criticalAccounts === 0 ? 'excellent' : 
                                 summary.criticalAccounts < 3 ? 'good' : 'needs-improvement'
          },
          recommendations: [
            summary.criticalAccounts > 0 ? `Address ${summary.criticalAccounts} critical collection accounts` : null,
            summary.avgDaysOverdue > 45 ? 'Implement more aggressive collection procedures' : null,
            summary.riskDistribution.high > 0 ? 'Consider credit limit reviews for high-risk customers' : null
          ].filter(Boolean)
        },
        { executionTime: result.executionTime },
        pagination
      )
    );
    
  } catch (error) {
    logger.error('AR analysis query failed:', error);
    res.status(500).json(
      ApiSchema.createErrorResponse(
        'Failed to retrieve AR analysis',
        'QUERY_ERROR',
        { error: error.message }
      )
    );
  }
});

/**
 * GET /api/v1/finance/profitability
 * Profitability analysis across products and customers
 */
router.get('/profitability', authorizePermission('read:finance'), async (req, res) => {
  try {
    logger.info('Profitability analysis endpoint accessed', { userId: req.user?.id });
    
    const validation = ApiSchema.validateQuery(req.query, {
      fields: {
        ...ApiSchema.commonSchemas.pagination.fields,
        analysisType: { 
          type: 'string', 
          enum: ['product', 'customer', 'overall'],
          default: 'overall'
        },
        includeMargins: { type: 'boolean', default: true }
      }
    });
    
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
    
    let profitabilityQuery;
    
    if (filters.analysisType === 'product') {
      profitabilityQuery = {
        sql: `
          SELECT 
            "Item Number" as productId,
            COUNT(*) as transactionCount,
            SUM("Quantity") as totalQuantity,
            SUM("Extended Price") as totalRevenue,
            AVG("Unit Price") as avgUnitPrice,
            SUM("Extended Price") / SUM("Quantity") as avgRevenuePerUnit
          FROM dbo_F_Sales_Transaction
          GROUP BY "Item Number"
          ORDER BY totalRevenue DESC
          LIMIT ${filters.limit}
        `
      };
    } else if (filters.analysisType === 'customer') {
      profitabilityQuery = {
        sql: `
          SELECT 
            t."Customer Key" as customerId,
            c."Customer Name" as customerName,
            COUNT(t."Sales Txn Key") as transactionCount,
            SUM(t."Extended Price") as totalRevenue,
            AVG(t."Extended Price") as avgTransactionValue,
            SUM(t."Quantity") as totalQuantity
          FROM dbo_F_Sales_Transaction t
          LEFT JOIN dbo_D_Customer c ON t."Customer Key" = c."Customer Key"
          GROUP BY t."Customer Key", c."Customer Name"
          ORDER BY totalRevenue DESC
          LIMIT ${filters.limit}
        `
      };
    } else {
      profitabilityQuery = {
        sql: `
          SELECT 
            strftime('%Y-%m', "Txn Date") as period,
            SUM("Extended Price") as totalRevenue,
            COUNT(*) as transactionCount,
            COUNT(DISTINCT "Customer Key") as uniqueCustomers,
            COUNT(DISTINCT "Item Number") as uniqueProducts,
            AVG("Extended Price") as avgTransactionValue
          FROM dbo_F_Sales_Transaction
          WHERE "Txn Date" >= date('now', '-12 months')
          GROUP BY strftime('%Y-%m', "Txn Date")
          ORDER BY period DESC
          LIMIT ${filters.limit}
        `
      };
    }
    
    const result = await customerDb.safeQuery(profitabilityQuery);
    
    // Add profitability calculations
    const enhancedRows = DataTransformer.addCalculatedFields(result.rows, {
      estimatedCost: (row) => {
        const revenue = row.totalRevenue || row.avgTransactionValue || 0;
        return (revenue * 0.65).toFixed(2); // Mock 35% gross margin
      },
      grossProfit: (row) => {
        const revenue = row.totalRevenue || row.avgTransactionValue || 0;
        const cost = revenue * 0.65;
        return (revenue - cost).toFixed(2);
      },
      grossMargin: (row) => {
        const revenue = row.totalRevenue || row.avgTransactionValue || 0;
        return revenue > 0 ? ((revenue * 0.35) / revenue * 100).toFixed(1) : 0;
      },
      profitabilityScore: (row) => {
        const revenue = row.totalRevenue || row.avgTransactionValue || 0;
        const margin = revenue > 0 ? ((revenue * 0.35) / revenue * 100) : 0;
        const volume = row.transactionCount || 1;
        
        // Weighted score based on revenue and margin
        const revenueScore = Math.min(100, (revenue / 1000) * 10);
        const marginScore = margin;
        const volumeScore = Math.min(100, volume * 2);
        
        return ((revenueScore * 0.5) + (marginScore * 0.3) + (volumeScore * 0.2)).toFixed(1);
      },
      profitabilityTier: (row) => {
        const revenue = row.totalRevenue || row.avgTransactionValue || 0;
        const margin = revenue > 0 ? ((revenue * 0.35) / revenue * 100) : 0;
        
        if (revenue > 10000 && margin > 30) return 'premium';
        if (revenue > 5000 && margin > 25) return 'high';
        if (revenue > 1000 && margin > 20) return 'medium';
        return 'low';
      }
    });
    
    // Format currency values
    const formattedRows = DataTransformer.formatNumericValues(enhancedRows, {
      totalRevenue: { type: 'currency', currency: 'USD' },
      avgTransactionValue: { type: 'currency', currency: 'USD' },
      avgUnitPrice: { type: 'currency', currency: 'USD' },
      avgRevenuePerUnit: { type: 'currency', currency: 'USD' },
      estimatedCost: { type: 'currency', currency: 'USD' },
      grossProfit: { type: 'currency', currency: 'USD' }
    });
    
    // Calculate profitability summary
    const summary = {
      totalEntities: result.rowCount,
      analysisType: filters.analysisType,
      totalRevenue: formattedRows.reduce((sum, row) => 
        sum + parseFloat((row.totalRevenue || row.avgTransactionValue || '$0').replace(/[$,]/g, '')), 0
      ),
      totalProfit: formattedRows.reduce((sum, row) => 
        sum + parseFloat(row.grossProfit.replace(/[$,]/g, '')), 0
      ),
      avgMargin: formattedRows.reduce((sum, row) => 
        sum + parseFloat(row.grossMargin), 0
      ) / Math.max(1, result.rowCount),
      tierDistribution: {
        premium: formattedRows.filter(r => r.profitabilityTier === 'premium').length,
        high: formattedRows.filter(r => r.profitabilityTier === 'high').length,
        medium: formattedRows.filter(r => r.profitabilityTier === 'medium').length,
        low: formattedRows.filter(r => r.profitabilityTier === 'low').length
      }
    };
    
    const pagination = ApiSchema.createPagination(
      filters.page,
      filters.limit,
      result.rowCount
    );
    
    res.json(
      ApiSchema.createSuccessResponse(
        {
          profitability: formattedRows,
          summary: {
            ...summary,
            totalRevenue: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(summary.totalRevenue),
            totalProfit: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(summary.totalProfit),
            avgMargin: summary.avgMargin.toFixed(1) + '%',
            overallHealth: summary.avgMargin > 30 ? 'excellent' : 
                          summary.avgMargin > 20 ? 'good' : 'needs-improvement'
          },
          insights: {
            topPerformers: formattedRows.slice(0, 3).map(row => ({
              id: row.productId || row.customerId || row.period,
              name: row.customerName || row.productId || row.period,
              revenue: row.totalRevenue || row.avgTransactionValue,
              margin: row.grossMargin + '%'
            })),
            recommendations: [
              summary.tierDistribution.low > summary.tierDistribution.premium ? 
                'Focus on improving low-tier profitability' : null,
              summary.avgMargin < 25 ? 'Review pricing strategy to improve margins' : null,
              'Consider expanding high-performing segments'
            ].filter(Boolean)
          }
        },
        { executionTime: result.executionTime },
        pagination
      )
    );
    
  } catch (error) {
    logger.error('Profitability analysis query failed:', error);
    res.status(500).json(
      ApiSchema.createErrorResponse(
        'Failed to retrieve profitability analysis',
        'QUERY_ERROR',
        { error: error.message }
      )
    );
  }
});

/**
 * GET /api/v1/finance/cash-flow
 * Cash flow analysis data
 */
router.get('/cash-flow', async (req, res) => {
  try {
    const cashFlowApi = require('../../../Finance/tools/cash_flow_analysis/api/data.api');
    await cashFlowApi.getCashFlowData(req, res);
  } catch (error) {
    logger.error('Cash flow data query failed:', error);
    res.status(500).json(
      ApiSchema.createErrorResponse(
        'Failed to retrieve cash flow data',
        'QUERY_ERROR',
        { error: error.message }
      )
    );
  }
});

/**
 * GET /api/v1/finance/cash-flow/waterfall
 * Cash flow waterfall analysis
 */
router.get('/cash-flow/waterfall', async (req, res) => {
  try {
    const cashFlowApi = require('../../../Finance/tools/cash_flow_analysis/api/data.api');
    await cashFlowApi.getWaterfallData(req, res);
  } catch (error) {
    logger.error('Cash flow waterfall query failed:', error);
    res.status(500).json(
      ApiSchema.createErrorResponse(
        'Failed to retrieve waterfall data',
        'QUERY_ERROR',
        { error: error.message }
      )
    );
  }
});

/**
 * GET /api/v1/finance/cash-flow/scenarios
 * Cash flow scenario analysis
 */
router.get('/cash-flow/scenarios', async (req, res) => {
  try {
    const cashFlowApi = require('../../../Finance/tools/cash_flow_analysis/api/data.api');
    await cashFlowApi.getScenarioAnalysis(req, res);
  } catch (error) {
    logger.error('Cash flow scenarios query failed:', error);
    res.status(500).json(
      ApiSchema.createErrorResponse(
        'Failed to retrieve scenario analysis',
        'QUERY_ERROR',
        { error: error.message }
      )
    );
  }
});

/**
 * GET /api/v1/finance/cash-flow/variance
 * Cash flow variance analysis
 */
router.get('/cash-flow/variance', async (req, res) => {
  try {
    const cashFlowApi = require('../../../Finance/tools/cash_flow_analysis/api/data.api');
    await cashFlowApi.getVarianceAnalysis(req, res);
  } catch (error) {
    logger.error('Cash flow variance query failed:', error);
    res.status(500).json(
      ApiSchema.createErrorResponse(
        'Failed to retrieve variance analysis',
        'QUERY_ERROR',
        { error: error.message }
      )
    );
  }
});

// Health check for finance domain
router.get('/health', (req, res) => {
  try {
    const customerDb = ConnectorRegistry.get('customer-db');
    
    res.json(
      ApiSchema.createSuccessResponse({
        domain: 'finance',
        status: 'healthy',
        connector: customerDb.getInfo(),
        endpoints: {
          'reports': 'active',
          'ar-analysis': 'active',
          'profitability': 'active',
          'cash-flow': 'active',
          'cash-flow/waterfall': 'active',
          'cash-flow/scenarios': 'active',
          'cash-flow/variance': 'active'
        }
      })
    );
  } catch (error) {
    res.status(500).json(
      ApiSchema.createErrorResponse(
        'Finance domain health check failed',
        'HEALTH_CHECK_ERROR',
        { error: error.message }
      )
    );
  }
});

// Mount AR aging routes
router.use('/ar-aging', arAgingRouter);

module.exports = router;