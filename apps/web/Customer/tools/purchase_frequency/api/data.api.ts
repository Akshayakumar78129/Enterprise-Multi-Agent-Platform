// Data API for Purchase Frequency Analyzer
import { KPIData, HistogramData, IntervalData, CustomerSegment, RegularityData, ValueSegment } from '../ui/types';

// Function to fetch purchase frequency data from backend
export async function fetchPurchaseFrequencyData(startDate: string, endDate: string, segments?: string[]) {
  try {
    const response = await fetch('/api/purchase-frequency/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
        customer_segments: segments || [],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch purchase frequency data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching purchase frequency data:', error);
    throw error;
  }
}

// Function to transform raw data into KPI format
export function transformKPIData(data: any): KPIData {
  const currentPeriod = {
    total_customers: data.total_customers || 0,
    avg_purchase_frequency: data.avg_purchase_frequency || 0,
    avg_interval_days: data.avg_interval_days || 0,
    active_customers_percentage: data.active_customers_percentage || 0,
    high_value_customers_percentage: data.high_value_customers_percentage || 0,
  };

  // If previous period data is available
  const previousPeriod = data.previous_period ? {
    total_customers: data.previous_period.total_customers || 0,
    avg_purchase_frequency: data.previous_period.avg_purchase_frequency || 0,
    avg_interval_days: data.previous_period.avg_interval_days || 0,
    active_customers_percentage: data.previous_period.active_customers_percentage || 0,
    high_value_customers_percentage: data.previous_period.high_value_customers_percentage || 0,
  } : undefined;

  return {
    ...currentPeriod,
    previous_period_comparison: previousPeriod,
  };
}

// Function to transform raw data into histogram format
export function transformHistogramData(data: any): { 
  data: HistogramData[]; 
  mean: number; 
  highThreshold: number; 
  lowThreshold: number 
} {
  const meanFrequency = data.avg_purchase_frequency || 0;
  const highThreshold = meanFrequency * 1.5;
  const lowThreshold = meanFrequency * 0.5;

  // Create bins from raw frequency data
  const histogramData = data.frequency_distribution?.map((item: any, index: number) => ({
    bin: item.bin,
    count: item.count,
    segmentType: item.bin > highThreshold 
      ? 'high' 
      : item.bin < lowThreshold 
        ? 'low' 
        : 'medium',
  })) || [];

  return {
    data: histogramData,
    mean: meanFrequency,
    highThreshold,
    lowThreshold,
  };
}

// Function to transform raw data into interval heatmap format
export function transformIntervalData(data: any): IntervalData[] {
  return data.interval_data?.map((item: any) => ({
    day: item.day,
    hour: item.hour,
    value: item.density,
    transactionCount: item.transaction_count,
    avgTransactionValue: item.avg_transaction_value,
  })) || [];
}

// Function to transform raw data into customer segment quadrant format
export function transformCustomerSegments(data: any): CustomerSegment[] {
  return data.customer_segments?.map((item: any) => ({
    id: item.customer_id,
    frequency: item.frequency,
    recency: item.recency,
    monetary: item.monetary,
    segment: determineSegment(item.frequency, item.recency, item.monetary),
  })) || [];
}

// Helper function to determine segment based on RFM values
function determineSegment(frequency: number, recency: number, monetary: number): CustomerSegment['segment'] {
  // High frequency, high recency, high monetary
  if (frequency > 1.5 && recency > 1.5 && monetary > 1.5) {
    return 'champions';
  }
  
  // High frequency, high recency, lower monetary
  if (frequency > 1.5 && recency > 1.5) {
    return 'loyal';
  }
  
  // Lower frequency, higher monetary
  if (monetary > 1.5 && frequency < 1.5) {
    return 'big_spenders';
  }
  
  // Low frequency, low recency
  if (frequency < 0.5 && recency < 0.5) {
    return 'at_risk';
  }
  
  return 'others';
}

// Function to transform raw data into regularity chart format
export function transformRegularityData(data: any): RegularityData[] {
  return data.regularity_data?.map((item: any) => ({
    timeframe: item.timeframe,
    percentage: item.percentage,
  })) || [];
}

// Function to transform raw data into value segment treemap format
export function transformValueSegments(data: any): ValueSegment[] {
  return data.value_segments?.map((item: any) => ({
    segment: item.segment,
    count: item.count,
    percentage: item.percentage,
    avgValue: item.avg_value,
  })) || [];
}

// Function to compare two time periods
export async function comparePeriods(
  period1Start: string,
  period1End: string,
  period2Start: string,
  period2End: string,
  segments?: string[]
) {
  try {
    const response = await fetch('/api/purchase-frequency/compare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        period1: {
          start_date: period1Start,
          end_date: period1End,
        },
        period2: {
          start_date: period2Start,
          end_date: period2End,
        },
        customer_segments: segments || [],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to compare time periods');
    }

    return await response.json();
  } catch (error) {
    console.error('Error comparing time periods:', error);
    throw error;
  }
} 