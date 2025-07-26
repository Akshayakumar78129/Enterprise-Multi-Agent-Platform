const { SalesTrendQueries } = require('../../../Sales/tools/SalesTrendAnalyzer/database/queries');

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const queries = new SalesTrendQueries();
    const filters = req.method === 'POST' ? req.body : req.query;

    // Provide default date range covering actual data in database (2017-2021)
    const defaultFilters = {
      startDate: '2017-01-01',
      endDate: '2021-12-31',
      timePeriod: 'monthly',
      metric: 'revenue',
      dimension: null,
      topN: 5,
      ...filters
    };

    // Fetch all required data in parallel
    const [mainData, kpis, seasonality, growthRates] = await Promise.all([
      queries.getMainData(defaultFilters),
      queries.getKPIData(defaultFilters),
      queries.getSeasonalityData(defaultFilters),
      queries.getGrowthRates(defaultFilters)
    ]);

    // Structure response
    const response = {
      success: true,
      data: {
        mainData,
        kpis,
        seasonality,
        growthRates,
        metadata: {
          timePeriod: defaultFilters.timePeriod,
          metric: defaultFilters.metric,
          dimension: defaultFilters.dimension,
          startDate: defaultFilters.startDate,
          endDate: defaultFilters.endDate
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