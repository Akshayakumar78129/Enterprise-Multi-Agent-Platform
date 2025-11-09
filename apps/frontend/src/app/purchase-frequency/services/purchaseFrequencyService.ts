/**
 * Purchase Frequency Service
 * API service for purchase frequency dashboard
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export interface PurchaseFrequencyFilters {
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  customerSegments?: string[];
  productCategories?: string[];
  frequencyRange?: string;
  timeRange?: string;
  search?: string;
}

export interface PurchaseFrequencySummary {
  kpiMetrics: {
    total_customers: number;
    avg_frequency: number;
    high_frequency_customers: number;
    medium_frequency_customers: number;
    low_frequency_customers: number;
    total_revenue: number;
  };
  frequencyDistribution: Array<{
    bin_range: string;
    customer_count: number;
    percentage: number;
    total_revenue: number;
  }>;
  customerSegmentation: Array<{
    segment: string;
    customer_count: number;
    avg_frequency: number;
    avg_customer_value: number;
    total_revenue: number;
  }>;
  purchaseIntervals: Array<{
    interval_days: string;
    customer_count: number;
    percentage: number;
  }>;
  lifecycleStages: Array<{
    stage: string;
    customer_count: number;
    avg_frequency: number;
    total_revenue: number;
  }>;
  customerDetails: Array<{
    customer_id: string;
    customer_name: string;
    purchase_count: number;
    avg_days_between_purchases: number;
    last_purchase_date: string;
    first_purchase_date: string;
    total_spent: number;
    avg_order_value: number;
    frequency_segment: string;
    recency_days: number;
    loyalty_status: string;
  }>;
  insights: string[];
  metadata: {
    filters: any;
    totalCustomers: number;
    dateRange: {
      from: string;
      to: string;
    };
    generatedAt: string;
  };
}

export async function getPurchaseFrequencySummary(
  filters: PurchaseFrequencyFilters
): Promise<PurchaseFrequencySummary> {
  const response = await fetch(`${API_BASE_URL}/api/purchase-frequency/summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateFrom: filters.dateRange?.startDate,
      dateTo: filters.dateRange?.endDate,
      customerSegments: filters.customerSegments || [],
      productCategories: filters.productCategories || [],
      frequencyRange: filters.frequencyRange,
      timeRange: filters.timeRange,
      search: filters.search,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch purchase frequency data: ${response.statusText}`);
  }

  return response.json();
}
