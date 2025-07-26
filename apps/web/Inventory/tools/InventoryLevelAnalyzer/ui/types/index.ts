// Main inventory item interface
export interface InventoryItem {
  Item_Key: number;
  Item_Number: string;
  Item_Name: string;
  Item_Category: string;
  Unit_Cost: number;
  Warehouse_Key: number;
  Warehouse_ID: string;
  Warehouse_Name: string;
  Current_Stock: number;
  Snapshot_Date: string;
}

// Enhanced inventory item with calculated metrics
export interface InventoryItemMetrics extends InventoryItem {
  totalSales: number;
  avgDailySales: number;
  daysOfSupply: number;
  stockLevelPct: number;
  inventoryValue: number;
  isLowStock: boolean;
  stockoutRisk: boolean;
}

// KPI data interface
export interface InventoryKPIs {
  overallStockHealth: number;
  itemsAtRisk: number;
  avgDaysSupply: number;
  valueAtRisk: number;
  restockPriority: string;
  totalItems: number;
  lowStockItems: number;
  totalInventoryValue: number;
}

// Health matrix cell data
export interface HealthMatrixCell {
  items: InventoryItemMetrics[];
  avgStockLevel: number;
  avgDaysSupply: number;
  riskCount: number;
}

// Health matrix data structure
export interface HealthMatrixData {
  [category: string]: {
    [warehouse: string]: HealthMatrixCell;
  };
}

// Stockout risk item
export interface StockoutRiskItem extends InventoryItemMetrics {
  riskLevel: 'critical' | 'high' | 'moderate';
}

// Warehouse distribution data
export interface WarehouseDistribution {
  warehouseName: string;
  warehouseId: string;
  totalItems: number;
  totalValue: number;
  criticalItems: number;
  lowStockItems: number;
  adequateItems: number;
  excessItems: number;
}

// Item analyzer data
export interface ItemAnalyzerData {
  itemId: string;
  itemName: string;
  category: string;
  warehouse: string;
  currentStock: number;
  stockLevelPct: number;
  daysOfSupply: number;
  avgDailySales: number;
  inventoryValue: number;
  status: 'Critical' | 'Low' | 'Adequate' | 'Excess';
}

// Trend data point
export interface TrendDataPoint {
  date: string;
  avgStockLevel: number;
  riskItems: number;
}

// Filter state interface
export interface FilterState {
  category?: string;
  warehouse_id?: string;
  time_period?: string;
  min_stock_threshold?: number;
}

// Dashboard state interface
export interface DashboardState {
  kpis: InventoryKPIs | null;
  visualizations: {
    healthMatrix: HealthMatrixData;
    stockoutRisk: StockoutRiskItem[];
    distribution: WarehouseDistribution[];
    itemAnalyzer: ItemAnalyzerData[];
    trends: TrendDataPoint[];
  };
  rawData: InventoryItem[];
  filters: FilterState;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// Component props interfaces
export interface KPITilesProps {
  kpis: InventoryKPIs | null;
  isLoading?: boolean;
}

export interface HealthMatrixProps {
  data: HealthMatrixData;
  isLoading?: boolean;
  onCellClick?: (category: string, warehouse: string, cell: HealthMatrixCell) => void;
  threshold?: number;
  onThresholdChange?: (threshold: number) => void;
}

export interface StockoutRiskProps {
  data: StockoutRiskItem[];
  isLoading?: boolean;
  onItemClick?: (item: StockoutRiskItem) => void;
  maxDaysSupply?: number;
  onMaxDaysChange?: (days: number) => void;
}

export interface InventoryDistributionProps {
  data: WarehouseDistribution[];
  isLoading?: boolean;
  onWarehouseClick?: (warehouse: WarehouseDistribution) => void;
  viewMode?: 'value' | 'count';
  onViewModeChange?: (mode: 'value' | 'count') => void;
}

export interface ItemAnalyzerProps {
  data: ItemAnalyzerData[];
  isLoading?: boolean;
  onItemSelect?: (items: ItemAnalyzerData[]) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: FilterState) => void;
}

export interface TrendAnalyzerProps {
  data: TrendDataPoint[];
  isLoading?: boolean;
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  showMovingAverage?: boolean;
  onMovingAverageToggle?: (show: boolean) => void;
}

// API response interface
export interface InventoryLevelResponse {
  success: boolean;
  data: {
    kpis: InventoryKPIs;
    visualizations: {
      healthMatrix: HealthMatrixData;
      stockoutRisk: StockoutRiskItem[];
      distribution: WarehouseDistribution[];
      itemAnalyzer: ItemAnalyzerData[];
      trends: TrendDataPoint[];
    };
    rawData: InventoryItem[];
    filters: FilterState;
    lastUpdated: string;
  };
  error?: string;
  message?: string;
}

// Chart data interfaces
export interface ChartPoint {
  x: number | string;
  y: number;
  label?: string;
  color?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartPoint[];
  color?: string;
  type?: 'line' | 'bar' | 'scatter';
}

// Color mapping for stock levels
export const STOCK_LEVEL_COLORS = {
  critical: '#e930ff',    // Signal Magenta
  low: '#d45d79',         // Muted magenta
  moderate: '#ffc145',    // Amber
  adequate: '#5fd4d6',    // Lighter cyan
  excess: '#00e0ff'       // Electric Cyan
} as const;

// Status type
export type StockStatus = keyof typeof STOCK_LEVEL_COLORS;

// Theme colors
export const THEME_COLORS = {
  primary: '#0a1224',     // Midnight Navy
  accent: '#00e0ff',      // Electric Cyan
  secondary: '#e930ff',   // Signal Magenta
  background: '#232a36',  // Graphite
  text: '#f7f9fb'         // Cloud White
} as const; 