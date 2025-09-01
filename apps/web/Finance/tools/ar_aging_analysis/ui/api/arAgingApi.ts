// API client for AR Aging Analysis

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  region?: string;
  customerType?: string;
  segment?: string;
}

export interface DashboardData {
  success: boolean;
  data: {
    kpis: any;
    agingBreakdown: any[];
    riskMetrics: any[];
    trendAnalysis: any[];
    customerInsights: any[];
    collectionPerformance: any[];
    filters: {
      regions: any[];
      customerTypes: any[];
      segments: any[];
    };
    metadata: {
      lastUpdated: string;
      filters: DashboardFilters;
    };
  };
}

export async function fetchDashboardData(filters: DashboardFilters = {}): Promise<DashboardData> {
  try {
    console.log('📡 API Client: Sending request with filters:', filters);
    const response = await fetch(
      '/api/finance/ar-aging-analysis/data',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      }
    );

    console.log('📡 API Client: Response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📡 API Client: Response data received, Total AR:', data?.data?.kpis?.totalAR?.value);
    return data;
  } catch (error) {
    console.error('❌ API Client error:', error);
    throw error;
  }
}

// AI Insights API
export async function fetchAIInsights(data: any, context: string) {
  try {
    const response = await fetch('/api/insights/explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `Analyze this AR aging data: ${JSON.stringify(data)}`,
        context: data,
        mode: 'explain',
        action: 'analyze',
        source: 'ar_aging_analysis'
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    // Return default insights if API fails
    return {
      insights: [
        'Based on current AR data patterns',
        'Consider collection strategy improvements',
        'Monitor high-risk accounts closely'
      ],
      recommendations: [
        'Review overdue accounts prioritization',
        'Implement proactive collection processes',
        'Analyze customer payment trends'
      ]
    };
  }
}