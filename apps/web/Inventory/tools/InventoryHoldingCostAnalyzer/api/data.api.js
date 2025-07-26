const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const { InventoryHoldingCostQueries } = require('../database/queries.js');

export default async function handler(req, res) {
  try {
    const { 
      dateRange, 
      category, 
      warehouseId,
      annualHoldingCostPercentage = 0.25,
      opportunityCostRate = 0.08
    } = req.body || req.query;
    
    // Initialize database queries class
    const queries = new InventoryHoldingCostQueries();
    
    // Prepare filters
    const filters = {
      annualHoldingCostPercentage: parseFloat(annualHoldingCostPercentage),
      opportunityCostRate: parseFloat(opportunityCostRate)
    };
    
    if (dateRange) {
      filters.dateRange = dateRange;
    }
    if (category) {
      filters.category = category;
    }
    if (warehouseId) {
      filters.warehouseId = warehouseId;
    }

    // Fetch all required data
    const [
      mainData,
      kpiData,
      costBreakdownData,
      excessiveCostItems,
      trendData,
      savingsOpportunities,
      filterOptions
    ] = await Promise.all([
      queries.getMainData(filters),
      queries.getKPIData(filters),
      queries.getCostBreakdownData(filters),
      queries.getExcessiveCostItems(filters),
      queries.getTrendData(filters),
      queries.getCostSavingOpportunities(filters),
      queries.getFilterOptions()
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        main: mainData,
        kpis: kpiData,
        costBreakdown: costBreakdownData,
        excessiveItems: excessiveCostItems,
        trends: trendData,
        savingsOpportunities: savingsOpportunities,
        filterOptions: filterOptions
      }
    });
  } catch (error) {
    console.error('Error fetching inventory holding cost data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch inventory holding cost data',
      error: error.message
    });
  }
} 