// Frontend API client for Cash Flow Analysis

export interface CashFlowFilters {
  startDate: string;
  endDate: string;
  companyCode: string;
  forecastHorizon: string;
  scenario: string;
}

export interface CashFlowDashboardData {
  success: boolean;
  data: {
    kpis: {
      fcfYield: KPIMetric;
      cashROIC: KPIMetric;
      cashConversionQuality: KPIMetric;
      liquidityCoverage: KPIMetric;
      maFirepower: KPIMetric;
    };
    fcfValueBridge: FCFBridgeData[];
    liquidityTimeline: LiquidityTimelineData[];
    capitalAllocation: CapitalAllocationData[];
    cashFlowForecast: CashFlowForecastData[];
    varianceAnalysis: VarianceAnalysisData[];
    filters: {
      companyCodes: CompanyCode[];
      glCategories: GLCategory[];
    };
    metadata: {
      lastUpdated: string;
      filters: CashFlowFilters;
      dataPoints: {
        fcfBridge: number;
        liquidityDays: number;
        allocationCategories: number;
        forecastMonths: number;
        varianceMonths: number;
      };
    };
  };
}

export interface KPIMetric {
  value: number;
  label: string;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  description: string;
  [key: string]: any; // For additional metric-specific properties
}

export interface FCFBridgeData {
  component: string;
  value: number;
  sequence_order: number;
  impact_type: 'baseline' | 'reduction' | 'addition';
}

export interface LiquidityTimelineData {
  date: string;
  daily_change: number;
  cash_balance: number;
  transaction_count: number;
  volatility_7d: number;
  liquidity_status: 'critical' | 'warning' | 'healthy';
}

export interface CapitalAllocationData {
  category: string;
  amount: number;
  percentage: number;
  transaction_count: number;
  avg_size: number;
  active_days: number;
  allocation_type: 'growth' | 'operations' | 'returns' | 'other';
}

export interface CashFlowForecastData {
  month: string;
  monthly_inflow: number;
  monthly_outflow: number;
  net_monthly_flow: number;
  base_forecast: number;
  optimistic_forecast: number;
  pessimistic_forecast: number;
  confidence_level: 'high' | 'medium' | 'low';
}

export interface VarianceAnalysisData {
  month: string;
  actual: number;
  forecast: number;
  variance: number;
  variance_percentage: number;
  variance_type: 'favorable' | 'unfavorable' | 'on_target';
  transaction_count: number;
}

export interface CompanyCode {
  code: string;
  name: string;
  transaction_count: number;
}

export interface GLCategory {
  category_code: string;
  category_name: string;
  account_count: number;
}

export async function fetchCashFlowData(filters: Partial<CashFlowFilters> = {}): Promise<CashFlowDashboardData> {
  try {
    const response = await fetch('/api/finance/cash-flow-analysis/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters),
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
    console.error('Error fetching cash flow data:', error);
    throw error;
  }
}

export async function fetchCashFlowForecast(
  filters: Partial<CashFlowFilters> = {},
  scenario: 'base' | 'optimistic' | 'pessimistic' = 'base'
): Promise<CashFlowForecastData[]> {
  try {
    const data = await fetchCashFlowData({ ...filters, scenario });
    return data.data.cashFlowForecast;
  } catch (error) {
    console.error('Error fetching cash flow forecast:', error);
    throw error;
  }
}

export async function fetchLiquidityAnalysis(filters: Partial<CashFlowFilters> = {}): Promise<LiquidityTimelineData[]> {
  try {
    const data = await fetchCashFlowData(filters);
    return data.data.liquidityTimeline;
  } catch (error) {
    console.error('Error fetching liquidity analysis:', error);
    throw error;
  }
}

// Utility functions for data processing
export function calculateFCFYield(freeCashFlow: number, enterpriseValue: number): number {
  if (enterpriseValue === 0) return 0;
  return (freeCashFlow / enterpriseValue) * 100;
}

export function calculateCashROIC(operatingCashFlow: number, investedCapital: number): number {
  if (investedCapital === 0) return 0;
  return (operatingCashFlow / investedCapital) * 100;
}

export function formatCurrency(amount: number, compact: boolean = false): string {
  if (compact && Math.abs(amount) >= 1000000) {
    const millions = amount / 1000000;
    return `$${millions.toFixed(1)}M`;
  } else if (compact && Math.abs(amount) >= 1000) {
    const thousands = amount / 1000;
    return `$${thousands.toFixed(0)}K`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function getHealthStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'excellent':
    case 'strong':
    case 'high':
    case 'healthy':
      return '#00ff88'; // Success green
    case 'good':
    case 'medium':
    case 'adequate':
      return '#ffd600'; // Warning yellow
    case 'poor':
    case 'low':
    case 'weak':
    case 'critical':
      return '#ff5252'; // Error red
    default:
      return '#00e0ff'; // Default cyan
  }
}

export function getTrendIcon(trend: string): string {
  switch (trend?.toLowerCase()) {
    case 'up':
      return '↗️';
    case 'down':
      return '↘️';
    case 'stable':
      return '→';
    default:
      return '→';
  }
}