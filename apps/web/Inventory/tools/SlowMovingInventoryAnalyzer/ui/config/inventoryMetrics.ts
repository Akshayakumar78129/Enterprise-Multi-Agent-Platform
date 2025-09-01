/**
 * Inventory Metrics Configuration
 * Defines KPI calculations, thresholds, and color mappings for the Slow Moving Inventory Analyzer
 */

export interface KPIMetrics {
  totalSlowMovingItems: number;
  slowMovingValue: number;
  averageTurnoverRatio: number;
  agedInventoryPercent: number;
  carryingCostImpact: number;
}

export interface SlowMovingItem {
  item_id: string;
  item_name: string;
  category: string;
  warehouse_location: string;
  current_stock: number;
  unit_cost: number;
  stock_value: number;
  sales_12m: number;
  turnover_ratio: number;
  days_since_movement: number;
}

// Color coding system as specified in the UI spec
export const TURNOVER_COLOR_MAPPING = {
  CRITICAL: { threshold: 0.5, color: '#e930ff', label: 'Critical (< 0.5)' },    // Signal Magenta
  SLOW: { threshold: 1.0, color: '#d45d79', label: 'Slow (0.5-1.0)' },         // Muted Magenta
  MODERATE: { threshold: 3.0, color: '#ffc145', label: 'Moderate (1.0-3.0)' }, // Amber
  FAST: { threshold: 6.0, color: '#5fd4d6', label: 'Fast (3.0-6.0)' },         // Lighter Cyan
  VERY_FAST: { threshold: Infinity, color: '#00e0ff', label: 'Very Fast (> 6.0)' } // Electric Cyan
};

// KPI tile color mappings
export const KPI_COLORS = {
  IMPROVING: '#00e0ff',    // Electric Cyan
  WORSENING: '#e930ff',    // Signal Magenta
  STABLE: '#94a3b8'        // Slate Gray
};

// Dashboard theme colors
export const THEME_COLORS = {
  PRIMARY_CYAN: '#00e0ff',
  SIGNAL_MAGENTA: '#e930ff',
  GRAPHITE: '#232a36',
  MIDNIGHT_NAVY: '#0a1224',
  CLOUD_WHITE: '#f7f9fb',
  INVENTORY_PURPLE: '#8b5cf6'
};

// Threshold settings
export const INVENTORY_THRESHOLDS = {
  SLOW_MOVING_TURNOVER: 4.0,     // Items with turnover < 4x are slow-moving
  AGED_INVENTORY_DAYS: 90,       // Items aged > 90 days
  CRITICAL_DAYS: 180,            // Items aged > 180 days are critical
  CARRYING_COST_RATE: 0.02       // 2% monthly carrying cost rate
};

// Age bracket definitions
export const AGE_BRACKETS = [
  { label: '0-30 days', min: 0, max: 30, color: '#00e0ff' },
  { label: '31-60 days', min: 31, max: 60, color: '#5fd4d6' },
  { label: '61-90 days', min: 61, max: 90, color: '#ffc145' },
  { label: '91-180 days', min: 91, max: 180, color: '#d45d79' },
  { label: '180+ days', min: 181, max: Infinity, color: '#e930ff' }
];

// Helper function to get turnover color
export const getTurnoverColor = (turnoverRatio: number): string => {
  if (turnoverRatio < TURNOVER_COLOR_MAPPING.CRITICAL.threshold) return TURNOVER_COLOR_MAPPING.CRITICAL.color;
  if (turnoverRatio < TURNOVER_COLOR_MAPPING.SLOW.threshold) return TURNOVER_COLOR_MAPPING.SLOW.color;
  if (turnoverRatio < TURNOVER_COLOR_MAPPING.MODERATE.threshold) return TURNOVER_COLOR_MAPPING.MODERATE.color;
  if (turnoverRatio < TURNOVER_COLOR_MAPPING.FAST.threshold) return TURNOVER_COLOR_MAPPING.FAST.color;
  return TURNOVER_COLOR_MAPPING.VERY_FAST.color;
};

// Helper function to get age color
export const getAgeColor = (daysOld: number): string => {
  const bracket = AGE_BRACKETS.find(b => daysOld >= b.min && daysOld <= b.max);
  return bracket ? bracket.color : '#94a3b8';
};

// Sample metrics for development
export const SAMPLE_METRICS: KPIMetrics = {
  totalSlowMovingItems: 450,
  slowMovingValue: 1250000,
  averageTurnoverRatio: 2.3,
  agedInventoryPercent: 18.5,
  carryingCostImpact: 89000
};
