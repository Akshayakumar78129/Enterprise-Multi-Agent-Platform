const { RevenueForecastQueries } = require('../database/queries');

// Simple in-memory cache with 5-minute TTL
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(filters) {
  return JSON.stringify(filters);
}

// API endpoint handler for revenue forecast data
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }
  
  let queries;
  
  try {
    console.log('Revenue Forecast API Request received with body:', req.body);
    
    try {
      queries = new RevenueForecastQueries();
      console.log('Database connection established');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      throw dbError;
    }
    
    const filters = req.body || {};
    
    // Parse filters with default values
    const parsedFilters = {
      startDate: filters.startDate || '2021-01-01',
      endDate: filters.endDate || '2021-12-31',
      companyCode: filters.companyCode || 'all',
      segment: filters.segment || 'all',
      product: filters.product || 'all',
      region: filters.region || 'all',
      customer_type: filters.customer_type || 'all',
      revenue_type: filters.revenue_type || 'all',
      forecast_horizon: filters.forecast_horizon || '12_months',
      confidence_level: filters.confidence_level || 80,
      scenario: filters.scenario || 'base',
      comparison_period: filters.comparison_period || 'previous_year'
    };
    
    console.log('Parsed filters:', parsedFilters);
    
    // Check cache
    const cacheKey = getCacheKey(parsedFilters);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Returning cached data');
      return res.status(200).json(cached.data);
    }
    
    // Fetch all data components
    const dbFilters = {
      startDate: parsedFilters.startDate,
      endDate: parsedFilters.endDate,
      companyCode: parsedFilters.companyCode === 'all' ? null : parsedFilters.companyCode,
      segment: parsedFilters.segment === 'all' ? null : parsedFilters.segment,
      product: parsedFilters.product === 'all' ? null : parsedFilters.product,
      region: parsedFilters.region === 'all' ? null : parsedFilters.region,
      customer_type: parsedFilters.customer_type === 'all' ? null : parsedFilters.customer_type,
      revenue_type: parsedFilters.revenue_type === 'all' ? null : parsedFilters.revenue_type,
      forecast_horizon: parsedFilters.forecast_horizon,
      confidence_level: parsedFilters.confidence_level,
      scenario: parsedFilters.scenario,
      comparison_period: parsedFilters.comparison_period
    };
    
    const [
      kpiData,
      growthDecomposition,
      cohortRetention,
      tamMarketShare,
      pricingElasticity,
      bcgMatrix,
      customerEconomics,
      modelPerformance,
      segmentForecast,
      companyCodes,
      segments,
      products,
      regions,
      customerTypes
    ] = await Promise.all([
      queries.getKPIData(dbFilters),
      queries.getRevenueGrowthDecomposition(dbFilters),
      queries.getCohortRetentionData(dbFilters),
      queries.getTAMMarketShareData(dbFilters),
      queries.getPricingElasticityData(dbFilters),
      queries.getBCGMatrixData(dbFilters),
      queries.getCustomerEconomicsData(dbFilters),
      queries.getModelPerformanceData(dbFilters),
      queries.getSegmentForecastData(dbFilters),
      queries.getCompanyCodes(),
      queries.getSegments(),
      queries.getProducts(),
      queries.getRegions(),
      queries.getCustomerTypes()
    ]);
    
    // Format KPIs for dashboard
    const kpis = {
      ruleOf40: {
        label: 'Rule of 40',
        value: kpiData?.rule_of_40 || 45,
        unit: '',
        trend: { 
          direction: kpiData?.rule_of_40 > 40 ? 'up' : 'down', 
          value: `+${(kpiData?.revenue_growth_rate * 0.1).toFixed(1)}` 
        },
        status: kpiData?.rule_of_40 > 50 ? 'excellent' : kpiData?.rule_of_40 > 40 ? 'good' : kpiData?.rule_of_40 > 30 ? 'warning' : 'critical'
      },
      netRevenueRetention: {
        label: 'Net Revenue Retention',
        value: kpiData?.net_revenue_retention || 115,
        unit: '%',
        trend: { direction: 'up', value: '+8%' },
        status: kpiData?.net_revenue_retention > 120 ? 'excellent' : kpiData?.net_revenue_retention > 100 ? 'good' : 'warning'
      },
      ltvCacRatio: {
        label: 'LTV/CAC Ratio',
        value: kpiData?.ltv_cac_ratio || 3.2,
        unit: 'x',
        trend: { direction: 'up', value: '+0.5x' },
        status: kpiData?.ltv_cac_ratio > 3 ? 'excellent' : kpiData?.ltv_cac_ratio > 2 ? 'good' : 'critical'
      },
      revenueQualityScore: {
        label: 'Revenue Quality Score',
        value: kpiData?.revenue_quality_score || 82,
        unit: '/100',
        trend: { direction: 'stable', value: '0' },
        status: kpiData?.revenue_quality_score > 80 ? 'excellent' : kpiData?.revenue_quality_score > 60 ? 'good' : 'warning'
      },
      marketShareMomentum: {
        label: 'Market Share Momentum',
        value: `+${kpiData?.market_share_momentum || 2.5}`,
        unit: 'pp',
        trend: { direction: 'up', value: '+0.8pp' },
        status: kpiData?.market_share_momentum > 2 ? 'good' : kpiData?.market_share_momentum > 0 ? 'warning' : 'critical'
      }
    };
    
    // Transform cohort retention data for visualization
    const transformedCohortData = (cohortRetention || []).map(cohort => ({
      cohort_month: cohort.cohort,
      retention_rate: cohort.gross_retention_rate || 85,
      revenue_retention: cohort.net_retention_rate || 100,
      expansion_rate: Math.max(0, (cohort.net_retention_rate || 100) - (cohort.gross_retention_rate || 85)),
      churn_rate: Math.max(0, 100 - (cohort.gross_retention_rate || 85))
    }));
    
    // Transform growth decomposition for waterfall chart
    const transformedWaterfall = (growthDecomposition || []).map(item => ({
      name: item.component,
      value: item.value,
      type: item.type,
      color: item.color || (item.type === 'base' ? '#5fd4d6' : 
                           item.type === 'organic' ? '#00e0ff' : 
                           item.type === 'negative' ? '#e930ff' : '#ffc145')
    }));
    
    // Format response
    const response = {
      success: true,
      data: {
        kpis,
        growthDecomposition: {
          waterfall: transformedWaterfall,
          totalGrowth: ((growthDecomposition?.[growthDecomposition.length - 1]?.value || 0) / (growthDecomposition?.[0]?.value || 1) - 1) * 100,
          organicGrowth: 48,
          inorganicGrowth: 5,
          revenueMultiple: 8.2,
          enterpriseValue: 1250000000,
          qualityMetrics: {
            organic_growth: 85,
            predictability: 78,
            concentration: 72,
            recurring_percentage: 68,
            overall_score: 76
          }
        },
        cohortRetention: transformedCohortData,
        tamMarketShare: {
          ...tamMarketShare,
          competitorData: [
            { name: 'Us', marketShare: tamMarketShare?.market_share_percentage || 3.1, growth: tamMarketShare?.our_growth_rate || 53, color: '#00e0ff' },
            { name: 'Leader A', marketShare: 18.5, growth: 22, color: '#5fd4d6' },
            { name: 'Leader B', marketShare: 15.2, growth: 18, color: '#43cad0' },
            { name: 'Competitor C', marketShare: 8.7, growth: 35, color: '#ffc145' },
            { name: 'Others', marketShare: 54.5, growth: 15, color: 'rgba(247, 249, 251, 0.2)' }
          ],
          tamBreakdown: [
            { name: 'SOM', value: tamMarketShare?.som || 153, color: '#00e0ff' },
            { name: 'SAM Available', value: (tamMarketShare?.sam || 5000) - (tamMarketShare?.som || 153), color: '#5fd4d6' },
            { name: 'TAM Remaining', value: (tamMarketShare?.tam_size || 15000) - (tamMarketShare?.sam || 5000), color: 'rgba(0, 224, 255, 0.1)' }
          ],
          tam_size: tamMarketShare?.tam_size || 15000000000,
          sam_size: tamMarketShare?.sam || 5000000000,
          growth_vs_market: tamMarketShare?.growth_vs_market || 28
        },
        pricingElasticity: {
          scenarios: pricingElasticity?.scenarios || [
            { priceChange: -10, volumeChange: 8, revenueChange: -3, marginImpact: -7 },
            { priceChange: -5, volumeChange: 4, revenueChange: -1, marginImpact: -3.5 },
            { priceChange: 0, volumeChange: 0, revenueChange: 0, marginImpact: 0 },
            { priceChange: 5, volumeChange: -4, revenueChange: 1, marginImpact: 3.5 },
            { priceChange: 10, volumeChange: -8, revenueChange: 1.2, marginImpact: 7 }
          ],
          optimal_price_point: pricingElasticity?.optimal_price_point || 7,
          optimal_revenue_impact: pricingElasticity?.optimal_revenue_impact || 8500000,
          price_elasticity: pricingElasticity?.price_elasticity || -0.8,
          volume_risk: pricingElasticity?.volume_risk || -5.6
        },
        bcgMatrix: {
          products: (bcgMatrix || []).map(product => ({
            name: product.name,
            x: product.relative_market_share || 1,
            y: product.market_growth_rate || 10,
            size: product.size || 100,
            quadrant: product.quadrant,
            color: product.quadrant === 'star' ? '#00e0ff' : 
                   product.quadrant === 'cash_cow' ? '#5fd4d6' : 
                   product.quadrant === 'question_mark' ? '#ffc145' : '#e930ff'
          }))
        },
        customerEconomics: {
          waterfall: [
            { name: 'CAC', value: -(customerEconomics?.cac || 15000), cumulative: -(customerEconomics?.cac || 15000), color: '#e930ff' },
            { name: 'Year 1 GM', value: customerEconomics?.year1_value || 12000, cumulative: (customerEconomics?.year1_value || 12000) - (customerEconomics?.cac || 15000), color: '#00e0ff' },
            { name: 'Year 2 GM', value: customerEconomics?.year2_value || 15000, cumulative: (customerEconomics?.year1_value || 12000) + (customerEconomics?.year2_value || 15000) - (customerEconomics?.cac || 15000), color: '#00e0ff' },
            { name: 'Year 3 GM', value: customerEconomics?.year3_value || 18000, cumulative: (customerEconomics?.year1_value || 12000) + (customerEconomics?.year2_value || 15000) + (customerEconomics?.year3_value || 18000) - (customerEconomics?.cac || 15000), color: '#00e0ff' },
            { name: 'Total LTV', value: 0, cumulative: customerEconomics?.total_ltv || 48000, color: '#5fd4d6' }
          ],
          cac: -(customerEconomics?.cac || 15000),
          ltv: customerEconomics?.total_ltv || 48000,
          payback_months: customerEconomics?.payback_months || 12
        },
        modelPerformance: {
          metrics: (modelPerformance || []).map(m => ({
            month: m.period,
            actual: m.actual_revenue / 1000000,
            predicted: m.predicted_revenue / 1000000,
            accuracy: m.accuracy
          })),
          models: [
            { model: 'ARIMA', mape: 4.2, accuracy: 92 },
            { model: 'Prophet', mape: 3.8, accuracy: 94 },
            { model: 'XGBoost', mape: 3.5, accuracy: 95 },
            { model: 'Ensemble', mape: 3.2, accuracy: 96 }
          ],
          bestModel: 'Ensemble',
          forecastConfidence: 82
        },
        segmentForecast: {
          segments: (segmentForecast || []).map(s => ({
            month: s.forecast_month,
            enterprise: s.enterprise || 0,
            midMarket: s.mid_market || 0,
            smb: s.smb || 0,
            selfServe: s.self_serve || 0
          })),
          treemap: [
            { name: 'Enterprise', size: 95, growth: 46, color: '#00e0ff' },
            { name: 'Mid-Market', size: 68, growth: 51, color: '#5fd4d6' },
            { name: 'SMB', size: 32, growth: 28, color: '#43cad0' },
            { name: 'Self-Serve', size: 28, growth: 56, color: '#ffc145' }
          ]
        },
        filters: {
          segments: segments || [],
          products: products || [],
          regions: regions || [],
          customer_types: customerTypes || [],
          company_codes: companyCodes || []
        }
      }
    };
    
    // Cache the response
    cache.set(cacheKey, {
      timestamp: Date.now(),
      data: response
    });
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('Error fetching revenue forecast data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue forecast data',
      message: error.message
    });
  } finally {
    if (queries) {
      queries.close();
    }
  }
}

module.exports = handler;