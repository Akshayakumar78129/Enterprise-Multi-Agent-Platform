const { CashFlowAnalysisQueries } = require('../database/queries');

// Simple in-memory cache with 5-minute TTL
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(filters) {
  return JSON.stringify(filters);
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    console.log('Cash Flow API Request received with body:', req.body);
    
    let queries;
    try {
      queries = new CashFlowAnalysisQueries();
      console.log('Database connection established');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      throw dbError;
    }

    const filters = req.body || {};

    // Parse filters with default values - use last 3 months of 2021 for performance
    const parsedFilters = {
      startDate: filters.startDate || '2021-10-01',
      endDate: filters.endDate || '2021-12-30',
      companyCode: filters.companyCode || 'all',
      forecastHorizon: filters.forecastHorizon || '12',
      scenario: filters.scenario || 'base'
    };

    console.log('Parsed filters:', parsedFilters);
    
    // Check cache
    const cacheKey = getCacheKey(parsedFilters);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Returning cached data');
      return res.status(200).json(cached.data);
    }

    // Fetch all data in parallel for performance
    const [
      kpiData,
      fcfValueBridge,
      liquidityTimeline,
      capitalAllocation,
      cashFlowForecast,
      varianceAnalysis,
      companyCodes,
      glCategories
    ] = await Promise.all([
      queries.getKPIData(parsedFilters),
      queries.getFCFValueBridgeData(parsedFilters),
      queries.getLiquidityTimelineData(parsedFilters),
      queries.getCapitalAllocationData(parsedFilters),
      queries.getCashFlowForecastData(parsedFilters),
      queries.getCashFlowVarianceData(parsedFilters),
      queries.getCompanyCodes(),
      queries.getGLCategories()
    ]);

    console.log('KPI Data:', kpiData);
    console.log('FCF Value Bridge count:', fcfValueBridge?.length);
    console.log('Company Codes:', companyCodes);

    // Close database connection
    queries.close();

    // Calculate additional derived metrics from real data
    const fcfYield = kpiData?.free_cash_flow && kpiData?.revenue_amount 
      ? (kpiData.free_cash_flow / kpiData.revenue_amount) * 100 
      : 0;

    const cashROIC = kpiData?.operating_cash_flow && (kpiData?.revenue_amount - kpiData?.cogs_amount)
      ? (kpiData.operating_cash_flow / (kpiData.revenue_amount - kpiData.cogs_amount)) * 100
      : 0;
      
    const ebitdaMargin = kpiData?.ebitda && kpiData?.revenue_amount
      ? (kpiData.ebitda / kpiData.revenue_amount) * 100
      : 0;
      
    const cashConversionQuality = kpiData?.operating_cash_flow && kpiData?.ebitda
      ? (kpiData.operating_cash_flow / kpiData.ebitda) * 100
      : 0;
      
    const liquidityCoverage = kpiData?.operating_cash_flow 
      ? Math.abs(kpiData.operating_cash_flow / 30) / (kpiData?.operating_cash_outflow / 365)
      : 0;

    // Structure response following the inventory pattern
    const response = {
      success: true,
      data: {
        kpis: {
          freeCashFlow: {
            value: Math.round(kpiData?.free_cash_flow || 0),
            label: 'Free Cash Flow',
            unit: '$',
            trend: (kpiData?.free_cash_flow || 0) > 0 ? 'up' : 'down',
            description: 'Operating Cash Flow minus CapEx',
            formatted: '$' + ((kpiData?.free_cash_flow || 0) / 1000000).toFixed(2) + 'M',
            status: (kpiData?.free_cash_flow || 0) > 0 ? 'positive' : 'negative'
          },
          fcfYield: {
            value: kpiData?.revenue_amount > 0 ? Math.round(fcfYield * 100) / 100 : 0,
            label: 'FCF Yield',
            unit: '%',
            trend: 'up',
            description: 'Free Cash Flow as % of Revenue',
            target: 15.0,
            status: fcfYield > 15 ? 'excellent' : fcfYield > 10 ? 'good' : 'poor'
          },
          cashROIC: {
            value: Math.round(cashROIC * 100) / 100,
            label: 'Cash ROIC', 
            unit: '%',
            trend: 'stable',
            description: 'Operating Cash Flow Return on Invested Capital',
            wacc: 10.0,
            spread: Math.round((cashROIC - 10) * 100) / 100
          },
          cashConversionQuality: {
            value: Math.round(cashConversionQuality * 100) / 100,
            label: 'Cash Conversion Quality',
            unit: '%',
            trend: cashConversionQuality > 90 ? 'up' : 'stable',
            description: 'Operating Cash Flow to EBITDA',
            quality: cashConversionQuality > 90 ? 'high' : 
                    cashConversionQuality > 70 ? 'medium' : 'low'
          },
          liquidityCoverage: {
            value: Math.round(liquidityCoverage * 100) / 100,
            label: 'Liquidity Coverage Ratio',
            unit: 'ratio',
            trend: liquidityCoverage > 1.5 ? 'up' : 'down',
            description: 'Operating Cash to 30-day Cash Needs',
            threshold: 2.0,
            status: liquidityCoverage > 2.0 ? 'strong' : liquidityCoverage > 1.5 ? 'adequate' : 'weak'
          },
          maFirepower: {
            value: Math.round(Math.abs(kpiData?.free_cash_flow || 0) * 3.5), // 3.5x FCF leverage capacity
            label: 'M&A Firepower',
            unit: '$',
            trend: kpiData?.free_cash_flow > 0 ? 'up' : 'down',
            description: 'Acquisition Capacity Based on FCF',
            capacity: Math.abs(kpiData?.free_cash_flow || 0) * 3.5 > 1000000000 ? 'high' :
                     Math.abs(kpiData?.free_cash_flow || 0) * 3.5 > 100000000 ? 'medium' : 'limited'
          },
          ebitdaMargin: {
            value: Math.round(ebitdaMargin * 100) / 100,
            label: 'EBITDA Margin',
            unit: '%',
            trend: ebitdaMargin > 20 ? 'up' : 'stable',
            description: 'EBITDA as % of Revenue',
            benchmark: 25.0,
            status: ebitdaMargin > 25 ? 'excellent' : ebitdaMargin > 15 ? 'good' : 'poor'
          }
        },
        fcfValueBridge: fcfValueBridge || [],
        liquidityTimeline: liquidityTimeline || [],
        capitalAllocation: capitalAllocation || [],
        cashFlowForecast: cashFlowForecast || [],
        varianceAnalysis: varianceAnalysis || [],
        filters: {
          companyCodes: companyCodes || [],
          glCategories: glCategories || []
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          filters: parsedFilters,
          dataPoints: {
            fcfBridge: fcfValueBridge?.length || 0,
            liquidityDays: liquidityTimeline?.length || 0,
            allocationCategories: capitalAllocation?.length || 0,
            forecastMonths: cashFlowForecast?.length || 0,
            varianceMonths: varianceAnalysis?.length || 0
          }
        }
      }
    };

    console.log('Response prepared successfully');
    
    // Store in cache
    cache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });
    
    // Clean old cache entries
    if (cache.size > 100) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in Cash Flow Analysis API:', error);
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