// Revenue Forecast API - Uses database only, no mock data
export const fetchDashboardData = async (filters: any) => {
  try {
    // Call the API endpoint with POST method like other dashboards
    const response = await fetch('/api/finance/revenue-forecast/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: filters.startDate || '2021-01-01',
        endDate: filters.endDate || '2021-12-31',
        segment: filters.segment || 'all',
        product: filters.product || 'all',
        region: filters.region || 'all',
        customer_type: filters.customer_type || 'all',
        revenue_type: filters.revenue_type || 'all',
        forecast_horizon: filters.forecast_horizon || '12_months',
        confidence_level: filters.confidence_level || 80,
        scenario: filters.scenario || 'base',
        comparison_period: filters.comparison_period || 'previous_year',
        companyCode: filters.companyCode || 'all'
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'API returned unsuccessful response');
    }
    
    return data;
    
  } catch (error) {
    console.error('Error fetching revenue forecast data from database:', error);
    throw error; // Propagate error, no fallback
  }
};