import { SalesPerformanceState, SalesAnalysisResult } from '../types'; // Assuming types are in ../types

export const fetchSalesPerformanceDataAPI = async (
  params: {
    dateRange: { startDate: string; endDate: string };
    dimension: string | null;
    metric: string | null;
    filters?: Record<string, any>;
    timeGranularity?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    aggregateByDimension?: boolean;
  }
): Promise<SalesAnalysisResult> => {
  try {
    if (!params.dimension || !params.metric) {
      // Handle cases where dimension or metric might be null if that's not allowed by API
      // Or ensure they have default values before this call if API requires them
      console.warn('Dimension or Metric is null, API call might fail or use defaults');
      // return { status: 'error', message: 'Dimension and Metric are required for API call' };
    }

    const response = await fetch('/api/sales-performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_date: params.dateRange.startDate,
        end_date: params.dateRange.endDate,
        dimension: params.dimension,
        metric: params.metric,
        filters: params.filters,
        time_granularity: params.timeGranularity || 'daily',
        aggregate_by_dimension: params.aggregateByDimension || false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Sales Performance API Error:', errorData);
      return {
        status: 'error',
        message: errorData.message || `API request failed with status ${response.status}`,
        // results: undefined // or provide some default error structure if your type expects results
      };
    }

    const data = await response.json();
    if (data.status === 'success') {
      return {
        status: 'success',
        results: data.results, // The API directly returns the structure for results.kpi and results.chartData
        message: 'Data fetched successfully'
      };
    }
    else {
      return {
        status: 'error',
        message: data.message || 'API returned success false but no error message.',
        // results: undefined
      };
    }

  } catch (error) {
    console.error('Network or other error fetching sales performance data:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      status: 'error',
      message: errorMessage,
      // results: undefined
    };
  }
};

// New function specifically for aggregated data used by comparative components
export const fetchAggregatedSalesDataAPI = async (
  params: {
    dateRange: { startDate: string; endDate: string };
    dimension: string | null;
    metric: string | null;
    filters?: Record<string, any>;
  }
): Promise<SalesAnalysisResult> => {
  return fetchSalesPerformanceDataAPI({
    ...params,
    timeGranularity: 'daily',
    aggregateByDimension: true
  });
}; 