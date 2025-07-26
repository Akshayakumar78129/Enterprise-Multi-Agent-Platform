const { SalesTrendQueries } = require('../database/queries');

async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const queries = new SalesTrendQueries();
    const filters = req.method === 'POST' ? req.body : req.query;

    // Validate date range
    if (!filters.startDate || !filters.endDate) {
      return res.status(400).json({
        error: 'Start date and end date are required'
      });
    }

    // Fetch all required data in parallel
    const [mainData, kpis, seasonality, growthRates] = await Promise.all([
      queries.getMainData(filters),
      queries.getKPIData(filters),
      queries.getSeasonalityData(filters),
      queries.getGrowthRates(filters)
    ]);

    // Structure response
    const response = {
      success: true,
      data: {
        mainData,
        kpis: kpis[0], // KPI query returns a single row
        seasonality,
        growthRates,
        metadata: {
          timePeriod: filters.timePeriod || 'monthly',
          metric: filters.metric || 'revenue',
          dimension: filters.dimension,
          startDate: filters.startDate,
          endDate: filters.endDate
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(`Error in SalesTrendAnalyzer API:`, error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

module.exports = handler; 