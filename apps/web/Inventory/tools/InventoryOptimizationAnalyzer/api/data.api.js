const { InventoryOptimizationQueries } = require('../database/queries');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    console.log('API Request received with body:', req.body);
    
    let queries;
    try {
      queries = new InventoryOptimizationQueries();
      console.log('Database connection established');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      throw dbError;
    }
    const filters = req.body || {};

    // Parse filters - using dates that match our database (2025-05-11)
    const parsedFilters = {
      startDate: filters.startDate || '2025-01-01',
      endDate: filters.endDate || '2025-12-31',
      warehouseId: filters.warehouseId || 'all',
      category: filters.category || 'all',
      metric: filters.metric || 'health_score'
    };

    // Fetch all data in parallel
    const [
      kpiData,
      healthMatrix,
      costImpact,
      performanceTimeline,
      actionPriority,
      agingAnalysis,
      warehouses,
      categories
    ] = await Promise.all([
      queries.getKPIData(parsedFilters),
      queries.getHealthMatrixData(parsedFilters),
      queries.getCostImpactData(parsedFilters),
      queries.getPerformanceTimeline(parsedFilters),
      queries.getActionPriorityData(parsedFilters),
      queries.getAgingAnalysis(parsedFilters),
      queries.getWarehouses(),
      queries.getCategories()
    ]);

    console.log('KPI Data:', kpiData);
    console.log('Health Matrix count:', healthMatrix?.length);
    console.log('Categories:', categories);

    // Close database connection
    queries.close();

    // Structure response
    const response = {
      success: true,
      data: {
        kpis: {
          inventoryHealth: {
            value: kpiData?.inventory_health_score || 0,
            label: 'Inventory Health',
            unit: '%',
            trend: 'stable',
            description: 'Overall inventory health score'
          },
          totalValue: {
            value: kpiData?.total_inventory_value || 0,
            label: 'Total Inventory Value',
            unit: '$',
            trend: 'up',
            description: 'Total value of current inventory'
          },
          slowMoving: {
            value: kpiData?.slow_moving_percentage || 0,
            label: 'Slow-Moving Items',
            unit: '%',
            count: kpiData?.slow_moving_items || 0,
            trend: 'down',
            description: 'Percentage of slow-moving inventory'
          },
          stockoutRisk: {
            value: kpiData?.stockout_risk_items || 0,
            label: 'Stockout Risk',
            unit: 'items',
            trend: 'stable',
            description: 'Items at risk of stockout'
          },
          savingsOpportunity: {
            value: kpiData?.potential_savings || 0,
            label: 'Savings Opportunity',
            unit: '$',
            trend: 'up',
            description: 'Potential cost savings'
          }
        },
        healthMatrix: healthMatrix || [],
        costImpact: costImpact || [],
        performanceTimeline: performanceTimeline || [],
        actionPriority: actionPriority || [],
        agingAnalysis: agingAnalysis || [],
        filters: {
          warehouses: warehouses || [],
          categories: categories || []
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          filters: parsedFilters
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in InventoryOptimizationAnalyzer API:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

module.exports = handler;