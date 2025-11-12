const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface InventoryOptimizationFilters {
  start_date?: string;
  end_date?: string;
  category?: string;
  annual_holding_cost_rate?: number;
  opportunity_cost_rate?: number;
  service_level?: number;
  lead_time_days?: number;
}

export interface HoldingCostData {
  total_inventory_value: number;
  total_annual_holding_cost: number;
  avg_holding_cost_pct: number;
  excessive_cost_items: number;
  potential_annual_savings: number;
  category_analysis: Array<{
    category: string;
    total_value: number;
    avg_holding_cost_pct: number;
    excessive_items: number;
  }>;
  high_cost_items: Array<{
    item_number: string;
    category: string;
    total_value: number;
    total_holding_cost: number;
    holding_cost_pct: number;
    storage_cost: number;
    opportunity_cost: number;
    risk_cost: number;
    excessive_holding_cost: boolean;
  }>;
  cost_breakdown: {
    storage_costs: number;
    opportunity_costs: number;
    risk_costs: number;
  };
  insights: string[];
}

export interface StockOptimizationData {
  total_optimized_value: number;
  total_cost_savings: number;
  items_analyzed: number;
  items_needing_reorder: number;
  items_overstock: number;
  service_level: number;
  ordering_cost_savings: number;
  current_ordering_cost: number;
  optimized_ordering_cost: number;
  recommendations: Array<{
    itemName: string;
    category: string;
    currentLevel: number;
    recommendedLevel: number;
    reorderPoint: number;
    safetyStock: number;
    orderQuantity: number;
    savings: number;
    unitCost: number;
  }>;
  metrics: Array<{
    metric: string;
    current: number;
    optimized: number;
    improvement: number;
  }>;
  insights: string[];
}

export interface CombinedInventoryOptimizationData {
  holding_cost: HoldingCostData;
  stock_optimization: StockOptimizationData;
  combined_insights: string[];
  total_savings_potential: number;
  optimization_score: number;
}

/**
 * Fetch holding cost analysis data
 */
export async function fetchHoldingCostData(
  filters: InventoryOptimizationFilters = {}
): Promise<HoldingCostData> {
  const params = new URLSearchParams();

  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  if (filters.category) params.append('category', filters.category);
  if (filters.annual_holding_cost_rate !== undefined) {
    params.append('annual_holding_cost_rate', filters.annual_holding_cost_rate.toString());
  }
  if (filters.opportunity_cost_rate !== undefined) {
    params.append('opportunity_cost_rate', filters.opportunity_cost_rate.toString());
  }

  const response = await fetch(`${API_BASE_URL}/api/inventory/holding-cost?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch stock optimization recommendations
 */
export async function fetchStockOptimizationData(
  filters: InventoryOptimizationFilters = {}
): Promise<StockOptimizationData> {
  const params = new URLSearchParams();

  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  if (filters.category) params.append('category', filters.category);
  if (filters.service_level !== undefined) {
    params.append('service_level', filters.service_level.toString());
  }
  if (filters.lead_time_days !== undefined) {
    params.append('lead_time_days', filters.lead_time_days.toString());
  }

  const response = await fetch(`${API_BASE_URL}/api/inventory/stock-optimization?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch combined inventory optimization data (holding cost + stock optimization)
 */
export async function fetchInventoryOptimizationData(
  filters: InventoryOptimizationFilters = {}
): Promise<CombinedInventoryOptimizationData> {
  const params = new URLSearchParams();

  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  if (filters.category) params.append('category', filters.category);
  if (filters.annual_holding_cost_rate !== undefined) {
    params.append('annual_holding_cost_rate', filters.annual_holding_cost_rate.toString());
  }
  if (filters.opportunity_cost_rate !== undefined) {
    params.append('opportunity_cost_rate', filters.opportunity_cost_rate.toString());
  }
  if (filters.service_level !== undefined) {
    params.append('service_level', filters.service_level.toString());
  }
  if (filters.lead_time_days !== undefined) {
    params.append('lead_time_days', filters.lead_time_days.toString());
  }

  const response = await fetch(`${API_BASE_URL}/api/inventory/optimization?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Export inventory optimization recommendations to CSV
 */
export async function exportInventoryOptimizationData(
  filters: InventoryOptimizationFilters = {}
): Promise<Blob> {
  const params = new URLSearchParams();

  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  if (filters.category) params.append('category', filters.category);

  const response = await fetch(`${API_BASE_URL}/api/inventory/optimization/export?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.blob();
}
