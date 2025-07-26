import { RegionalSalesAnalyzerQueries } from "../../../Sales/tools/RegionalSalesAnalyzer/database/queries.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const queries = new RegionalSalesAnalyzerQueries();
    const filters = req.method === "POST" ? req.body : req.query;

    // Set default date range if not provided - use actual data range
    if (!filters.dateRange) {
      filters.dateRange = {
        start: '2017-01-01',
        end: '2021-12-31'
      };
    }

    // Fetch all required data in parallel for better performance
    const [
      regionalSalesData,
      countryLevelData,
      timeSeriesData,
      kpis,
      opportunityAnalysis,
      availableRegions
    ] = await Promise.all([
      queries.getRegionalSalesData(filters),
      queries.getCountryLevelData(filters),
      queries.getTimeSeriesData(filters),
      queries.getRegionalKPIs(filters),
      queries.getOpportunityAnalysis(filters),
      queries.getAvailableRegions()
    ]);

    // Process time series data for visualization
    const timeSeriesProcessed = processTimeSeriesForVisualization(timeSeriesData);

    // Calculate additional metrics for dashboard
    const totalRevenue = regionalSalesData.reduce((sum, region) => sum + (region.totalSales || 0), 0);
    const totalTransactions = regionalSalesData.reduce((sum, region) => sum + (region.transactionCount || 0), 0);
    const uniqueCountries = new Set(regionalSalesData.map(r => r.country)).size;
    const uniqueStates = new Set(regionalSalesData.map(r => r.state)).size;

    // Calculate concentration metrics
    const sortedRegions = [...regionalSalesData].sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0));
    const top5Revenue = sortedRegions.slice(0, 5).reduce((sum, region) => sum + (region.totalSales || 0), 0);
    const concentrationRatio = totalRevenue > 0 ? (top5Revenue / totalRevenue * 100).toFixed(2) : 0;

    // Identify growth opportunities
    const growthOpportunities = opportunityAnalysis.filter(region => 
      region.opportunityCategory === 'Growth Opportunity'
    ).length;

    // Enhanced KPIs with calculated metrics
    const enhancedKPIs = {
      ...kpis,
      totalRevenue,
      totalTransactions,
      uniqueCountries,
      uniqueStates,
      concentrationRatio: parseFloat(concentrationRatio),
      growthOpportunities,
      avgRevenuePerRegion: regionalSalesData.length > 0 ? (totalRevenue / regionalSalesData.length).toFixed(2) : 0
    };

    // Structure response
    const response = {
      success: true,
      data: {
        regionalSalesData,
        countryLevelData,
        timeSeriesData: timeSeriesProcessed,
        kpis: enhancedKPIs,
        opportunityAnalysis,
        availableRegions,
        metadata: {
          totalRegions: regionalSalesData.length,
          dateRange: filters.dateRange,
          appliedFilters: {
            country: filters.country || null,
            state: filters.state || null,
            aggregation: filters.aggregation || 'month'
          }
        }
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(`Error in Regional Sales Analyzer API:`, error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
}

function processTimeSeriesForVisualization(timeSeriesData) {
  if (!timeSeriesData || timeSeriesData.length === 0) {
    return {
      byPeriod: [],
      byRegion: [],
      summary: {
        totalPeriods: 0,
        totalRegions: 0,
        averageGrowth: 0
      }
    };
  }

  // Group by period for overall trend
  const byPeriod = timeSeriesData.reduce((acc, row) => {
    const existing = acc.find(p => p.period === row.period);
    if (existing) {
      existing.totalSales += row.totalSales || 0;
      existing.totalQuantity += row.totalQuantity || 0;
      existing.transactionCount += row.transactionCount || 0;
      existing.regionCount += 1;
    } else {
      acc.push({
        period: row.period,
        totalSales: row.totalSales || 0,
        totalQuantity: row.totalQuantity || 0,
        transactionCount: row.transactionCount || 0,
        regionCount: 1
      });
    }
    return acc;
  }, []).sort((a, b) => a.period.localeCompare(b.period));

  // Group by region for individual region trends
  const regionMap = new Map();
  timeSeriesData.forEach(row => {
    const regionKey = `${row.country}-${row.state}`;
    if (!regionMap.has(regionKey)) {
      regionMap.set(regionKey, {
        country: row.country,
        state: row.state,
        data: []
      });
    }
    regionMap.get(regionKey).data.push({
      period: row.period,
      totalSales: row.totalSales || 0,
      totalQuantity: row.totalQuantity || 0,
      transactionCount: row.transactionCount || 0
    });
  });

  const byRegion = Array.from(regionMap.values()).map(region => ({
    ...region,
    data: region.data.sort((a, b) => a.period.localeCompare(b.period))
  }));

  // Calculate growth rate for summary
  let averageGrowth = 0;
  if (byPeriod.length >= 2) {
    const firstPeriod = byPeriod[0].totalSales;
    const lastPeriod = byPeriod[byPeriod.length - 1].totalSales;
    if (firstPeriod > 0) {
      averageGrowth = ((lastPeriod - firstPeriod) / firstPeriod * 100).toFixed(2);
    }
  }

  return {
    byPeriod,
    byRegion,
    summary: {
      totalPeriods: byPeriod.length,
      totalRegions: byRegion.length,
      averageGrowth: parseFloat(averageGrowth)
    }
  };
} 