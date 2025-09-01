const { ARAgingQueries } = require('../database/queries');

// Transform aging breakdown data to match UI expectations
function transformAgingBreakdown(agingData, totalAR) {
  const colorMap = {
    'Current': '#00e0ff',
    '1-30 Days': '#5fd4d6', 
    '31-60 Days': '#ffc145',
    '61-90 Days': '#e930ff',
    '90+ Days': '#e930ff'
  };

  return agingData.map(item => ({
    bucket: item.aging_bucket,
    amount: Math.round((item.total_amount || 0) * 100) / 100,
    percentage: Math.round((totalAR > 0 ? (item.total_amount / totalAR * 100) : 0) * 100) / 100,
    color: colorMap[item.aging_bucket] || '#8892a8',
    customerCount: item.invoice_count || 0,
    npvImpact: 0 // Could be calculated based on aging
  }));
}

// Transform customer insights data to match UI expectations
function transformCustomerInsights(customerData) {
  const industries = ['Technology', 'Manufacturing', 'Retail', 'Healthcare', 'Finance', 'Energy'];
  const quadrants = ['Strategic Partners', 'Growth Opportunities', 'Efficiency Targets', 'Value Destroyers'];
  
  return customerData.map((customer, index) => {
    const riskScore = Math.max(5, Math.min(95, (customer.avg_days_overdue || 0) * 1.2)); // More variation in risk scores
    const clv = customer.total_outstanding * (2.2 + Math.random() * 1.6); // More CLV variation
    
    return {
      id: `CUST${String(customer['Customer Key']).padStart(3, '0')}`,
      name: `Customer ${customer['Customer Key']}`,
      'Customer Key': customer['Customer Key'],
      clv: Math.round(clv * 100) / 100,
      riskScore: Math.round(riskScore * 100) / 100,
      arAmount: Math.round((customer.total_outstanding || 0) * 100) / 100,
      total_outstanding: Math.round((customer.total_outstanding || 0) * 100) / 100,
      avg_days_overdue: Math.round((customer.avg_days_overdue || 0) * 100) / 100,
      daysPastDue: Math.floor(customer.avg_days_overdue || 0),
      industry: industries[index % industries.length],
      quadrant: quadrants[index % quadrants.length],
      // Additional properties for better bubble positioning
      x: Math.max(10, Math.min(90, riskScore)), // X position based on risk
      y: Math.max(10, Math.min(90, (clv / 10000))), // Y position based on CLV
      size: Math.max(20, Math.min(60, customer.total_outstanding / 10000)) // Bubble size based on AR amount
    };
  });
}

// Transform collection performance data to match UI expectations  
function transformCollectionPerformance(performanceData) {
  const periods = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Month 2', 'Month 3', 'Quarter', 'Year'];
  
  return performanceData.slice(0, 8).map((item, index) => ({
    period: periods[index] || item.month || `Period ${index + 1}`,
    amount: Math.round((item.total_invoices * 50000 * (1 - index * 0.1)) * 100) / 100, // Declining collection amounts over time
    confidence: Math.round(Math.min(95, Math.max(60, (item.collection_rate || 75) - index * 2)) * 100) / 100, // Declining confidence
    scenario: 'realistic'
  }));
}

// Transform risk metrics data to match UI expectations (for heat map)
function transformRiskMetrics(riskData) {
  const customers = ['Customer A', 'Customer B', 'Customer C', 'Customer D', 'Customer E', 'Customer F'];
  const buckets = ['0-30', '31-45', '46-60', '60+'];
  const result = [];
  
  riskData.slice(0, 24).forEach((risk, index) => {
    const customerIndex = index % customers.length;
    const bucketIndex = Math.floor(index / customers.length) % buckets.length;
    
    result.push({
      customer: customers[customerIndex],
      bucket: buckets[bucketIndex],
      amount: Math.round((risk.total_outstanding || 0) * 100) / 100,
      riskScore: Math.round((risk.avg_days_overdue || 0) * 100) / 100,
      color: risk.avg_days_overdue > 70 ? '#e930ff' : 
             risk.avg_days_overdue > 50 ? '#ffc145' : 
             risk.avg_days_overdue > 30 ? '#5fd4d6' : '#00e0ff'
    });
  });
  
  return result;
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    console.log('AR Aging API Request received with body:', req.body);
    
    let queries;
    try {
      queries = new ARAgingQueries();
      console.log('Financial database connection established');
    } catch (dbError) {
      console.error('Financial database connection failed:', dbError);
      throw dbError;
    }
    const filters = req.body || {};

    // Parse filters - using dates that match our financial database (2017-2021)
    const parsedFilters = {
      startDate: filters.startDate || '2017-01-01',
      endDate: filters.endDate || '2021-12-31',
      region: filters.region || 'all',
      customerType: filters.customerType || 'all',
      segment: filters.segment || 'all'
    };

    // Fetch all data in parallel
    const [
      kpiData,
      agingBreakdown,
      riskMetrics,
      trendAnalysis,
      customerInsights,
      collectionPerformance,
      regions,
      customerTypes,
      segments
    ] = await Promise.all([
      queries.getKPIData(parsedFilters),
      queries.getAgingBreakdown(parsedFilters),
      queries.getRiskMetrics(parsedFilters),
      queries.getTrendAnalysis(parsedFilters),
      queries.getCustomerInsights(parsedFilters),
      queries.getCollectionPerformance(parsedFilters),
      queries.getRegions(),
      queries.getCustomerTypes(),
      queries.getSegments()
    ]);

    console.log('KPI Data:', kpiData);
    console.log('Aging Breakdown count:', agingBreakdown?.length);
    console.log('Regions:', regions);

    // Close database connection
    queries.close();

    // Structure response
    const response = {
      success: true,
      data: {
        kpis: {
          totalAR: {
            value: Math.round((kpiData?.total_ar || 0) * 100) / 100,
            label: 'Total A/R',
            unit: '$',
            trend: 'stable',
            description: 'Total accounts receivable'
          },
          daysOutstanding: {
            value: Math.round((kpiData?.days_sales_outstanding || 0) * 100) / 100,
            label: 'Days Sales Outstanding',
            unit: 'days',
            trend: 'down',
            description: 'Average collection period'
          },
          overdueAmount: {
            value: Math.round((kpiData?.overdue_amount || 0) * 100) / 100,
            label: 'Overdue Amount',
            unit: '$',
            trend: 'up',
            percentage: Math.round((kpiData?.overdue_percentage || 0) * 100) / 100,
            description: 'Total overdue receivables'
          },
          collectionEfficiency: {
            value: Math.round((kpiData?.collection_efficiency || 0) * 100) / 100,
            label: 'Collection Efficiency',
            unit: '%',
            trend: 'stable',
            description: 'Collection success rate'
          },
          riskExposure: {
            value: Math.round((kpiData?.high_risk_amount || 0) * 100) / 100,
            label: 'High Risk Exposure',
            unit: '$',
            trend: 'down',
            description: 'At-risk receivables'
          }
        },
        agingBreakdown: transformAgingBreakdown(agingBreakdown || [], kpiData?.total_ar || 0),
        riskMetrics: transformRiskMetrics(riskMetrics || []),
        trendAnalysis: trendAnalysis || [],
        customerInsights: transformCustomerInsights(customerInsights || []),
        collectionPerformance: transformCollectionPerformance(collectionPerformance || []),
        filters: {
          regions: regions || [],
          customerTypes: customerTypes || [],
          segments: segments || []
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          filters: parsedFilters
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in AR Aging Analysis API:', error);
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