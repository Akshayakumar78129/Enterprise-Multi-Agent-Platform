const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const { InventoryLevelQueries } = require('../../../Inventory/tools/InventoryLevelAnalyzer/database/queries.js');

export default async function handler(req, res) {
  try {
    const { dateRange, category, warehouseId } = req.body || req.query;
    
    // Initialize database queries class
    const queries = new InventoryLevelQueries();
    
    // Prepare filters
    const filters = {};
    if (dateRange) {
      filters.time_period = dateRange;
    }
    if (category) {
      filters.category = category;
    }
    if (warehouseId) {
      filters.warehouse_id = warehouseId;
    }

    // Fetch all required data
    const [
      inventoryData,
      salesData,
      kpiData,
      healthMatrixData,
      stockoutRiskData,
      distributionData,
      itemAnalyzerData,
      trendData
    ] = await Promise.all([
      queries.getInventoryData(filters),
      queries.getSalesData(filters),
      queries.getKPIData(filters),
      queries.getVisualizationData('healthMatrix', filters),
      queries.getVisualizationData('stockoutRisk', filters),
      queries.getVisualizationData('inventoryDistribution', filters),
      queries.getVisualizationData('itemAnalyzer', filters),
      queries.getVisualizationData('trendAnalyzer', filters)
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        inventory: inventoryData,
        sales: salesData,
        kpis: kpiData,
        visualizations: {
          healthMatrix: healthMatrixData,
          stockoutRisk: stockoutRiskData,
          distribution: distributionData,
          itemAnalyzer: itemAnalyzerData,
          trends: trendData
        }
      }
    });
  } catch (error) {
    console.error('Error fetching inventory level data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch inventory level data',
      error: error.message
    });
  }
} 