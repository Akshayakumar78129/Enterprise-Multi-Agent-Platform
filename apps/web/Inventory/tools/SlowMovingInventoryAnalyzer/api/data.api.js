const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const { SlowMovingInventoryQueries } = require('../database/queries.js');

module.exports = async function handler(req, res) {
  try {
    const {
      dateRange,
      category,
      warehouseId,
      turnoverThreshold = 4.0,
      daysThreshold = 90,
      page = 1,
      pageSize = 50
    } = req.body || req.query || {};

    const queries = new SlowMovingInventoryQueries();

    const filters = {
      dateRange: dateRange ? dateRange : undefined,
      category: category ? category : undefined,
      warehouseId: warehouseId ? warehouseId : undefined,
      turnoverThreshold: parseFloat(turnoverThreshold),
      daysThreshold: parseInt(daysThreshold, 10)
    };

    // Fetch data in parallel using queries.js methods
    const [
      mainData,
      kpiData,
      turnoverData,
      agingData,
      financialData,
      itemsData,
      filterOptions
    ] = await Promise.all([
      queries.getMainData(filters),
      queries.getKPIData(filters),
      queries.getTurnoverAnalysisData(filters),
      queries.getAgingAnalysisData(filters),
      queries.getFinancialImpactData(filters),
      queries.getItemLevelData(filters),
      queries.getFilterOptions()
    ]);

    // Basic pagination for item list
    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.max(1, parseInt(pageSize, 10) || 50);
    const start = (p - 1) * ps;
    const pagedItems = itemsData.slice(start, start + ps);

    res.status(200).json({
      status: 'success',
      data: {
        main: mainData,
        kpis: kpiData,
        turnover: turnoverData,
        aging: agingData,
        financial: financialData,
        items: pagedItems,
        itemsMeta: {
          total: itemsData.length,
          page: p,
          pageSize: ps
        },
        filterOptions
      }
    });
  } catch (error) {
    console.error('Error fetching slow-moving inventory data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch slow-moving inventory data',
      error: error.message
    });
  }
};

