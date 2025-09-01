// API client for Inventory Optimization Analyzer

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  category?: string;
  metric?: string;
}

export interface DashboardData {
  success: boolean;
  data: {
    kpis: any;
    healthMatrix: any[];
    costImpact: any[];
    performanceTimeline: any[];
    actionPriority: any[];
    agingAnalysis: any[];
    filters: {
      warehouses: any[];
      categories: any[];
    };
    metadata: {
      lastUpdated: string;
      filters: DashboardFilters;
    };
  };
}

export async function fetchDashboardData(filters: DashboardFilters = {}): Promise<DashboardData> {
  try {
    const response = await fetch(
      '/api/inventory/optimization-analyzer/data',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
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
        prompt: `Analyze this inventory data: ${JSON.stringify(data)}`,
        context: data,
        mode: 'explain',
        action: 'analyze',
        source: 'inventory_optimization'
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
        'Based on current data patterns',
        'Consider optimization opportunities',
        'Monitor key metrics closely'
      ],
      recommendations: [
        'Review inventory levels',
        'Analyze slow-moving items',
        'Optimize reorder points'
      ]
    };
  }
}