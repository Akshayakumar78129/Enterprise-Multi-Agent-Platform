// Main data interfaces
export interface InventoryItem {
  Item_Key: number;
  Item_Number: string;
  Item_Name: string;
  Item_Category: string;
  Unit_Cost: number;
  Warehouse_Key: number;
  Warehouse_ID: string;
  Warehouse_Name: string;
  Storage_Cost_Per_Unit: number;
  Warehouse_Type: string;
  Current_Stock: number;
  Average_Stock_Level: number;
  Snapshot_Date: string;
  Lead_Time_Days: number;
  Obsolescence_Risk: number;
  Storage_Requirements: string;
  Average_Inventory_Value: number;
  Annual_Holding_Cost: number;
  Annual_Opportunity_Cost: number;
  Annual_Storage_Cost: number;
  Annual_Risk_Cost: number;
  totalHoldingCost: number;
  holdingCostPercentage: number;
}

export interface ExcessiveItem extends InventoryItem {
  Total_Holding_Cost: number;
  Holding_Cost_Percentage: number;
  Is_Excessive: boolean;
  Potential_Savings: number;
  Severity: 'High' | 'Medium' | 'Low';
}

export interface SavingOpportunity {
  itemNumber: string;
  itemName: string;
  category: string;
  warehouse: string;
  inventoryValue: number;
  currentHoldingCost: number;
  holdingCostPercentage: number;
  potentialSavings: number;
  implementationDifficulty: number;
  severity: 'High' | 'Medium' | 'Low';
  primaryCostDriver: string;
  recommendedActions: string[];
}

// KPI interface
export interface HoldingCostKPIs {
  totalHoldingCost: number;
  holdingCostPercentage: number;
  excessiveCostItems: number;
  potentialSavings: number;
  topCostDriver: string;
  totalInventoryValue: number;
  componentTotals: {
    'Capital Cost': number;
    'Opportunity Cost': number;
    'Storage Cost': number;
    'Risk Cost': number;
  };
}

// Cost breakdown interfaces
export interface CostComponentBreakdown {
  'Capital Cost': number;
  'Opportunity Cost': number;
  'Storage Cost': number;
  'Risk Cost': number;
}

export interface CategoryBreakdown {
  [category: string]: {
    totalCost: number;
    totalValue: number;
    itemCount: number;
    components: {
      capital: number;
      opportunity: number;
      storage: number;
      risk: number;
    };
  };
}

export interface WarehouseBreakdown {
  [warehouseId: string]: {
    warehouseName: string;
    warehouseType: string;
    totalCost: number;
    totalValue: number;
    itemCount: number;
    components: {
      capital: number;
      opportunity: number;
      storage: number;
      risk: number;
    };
  };
}

export interface CostBreakdownData {
  byComponent: CostComponentBreakdown;
  byCategory: CategoryBreakdown;
  byWarehouse: WarehouseBreakdown;
  overall: {
    totalCapitalCost: number;
    totalOpportunityCost: number;
    totalStorageCost: number;
    totalRiskCost: number;
    totalValue: number;
  };
}

// Trend data interface
export interface TrendDataPoint {
  Snapshot_Date: string;
  Total_Inventory_Value: number;
  Item_Count: number;
  Estimated_Holding_Cost: number;
  Holding_Cost_Percentage: number;
}

// Filter interfaces
export interface FilterOptions {
  categories: string[];
  warehouses: Array<{ id: string; name: string }>;
  dateRange: {
    min_date: string | null;
    max_date: string | null;
  };
}

export interface FilterState {
  dateRange?: { start: string; end: string };
  category?: string;
  warehouseId?: string;
  annualHoldingCostPercentage?: number;
  opportunityCostRate?: number;
  excessiveThreshold?: number;
}

// Recommendation interfaces
export interface RecommendationItem {
  action: string;
  impact: string;
  effort: 'Low' | 'Medium' | 'High' | 'Very High';
}

export interface Recommendations {
  immediate: RecommendationItem[];
  shortTerm: RecommendationItem[];
  longTerm: RecommendationItem[];
  priority: 'low' | 'medium' | 'high';
}

// Summary interface
export interface AnalysisSummary {
  totalItems: number;
  totalInventoryValue: number;
  averageHoldingCostPercentage: number;
  categoriesAnalyzed: number;
  warehousesAnalyzed: number;
  highImpactOpportunities: number;
}

// Main API response interface
export interface HoldingCostAnalysisData {
  kpis: HoldingCostKPIs;
  mainData: InventoryItem[];
  costBreakdown: CostBreakdownData;
  excessiveItems: ExcessiveItem[];
  savingOpportunities: SavingOpportunity[];
  trendData: TrendDataPoint[];
  filterOptions: FilterOptions;
  summary: AnalysisSummary;
  recommendations: Recommendations;
  appliedFilters: FilterState;
}

export interface APIResponse {
  status: string;
  data: HoldingCostAnalysisData;
  timestamp?: string;
  error?: string;
  message?: string;
}

// Component prop interfaces
export interface HoldingCostKPITilesProps {
  kpis: HoldingCostKPIs | null;
  isLoading?: boolean;
  error?: string | null;
}

export interface CostBreakdownVisualizationProps {
  data: CostBreakdownData | null;
  isLoading?: boolean;
  viewType?: 'component' | 'category' | 'warehouse' | 'item';
  onViewTypeChange?: (viewType: string) => void;
  onSegmentClick?: (segment: any) => void;
  selectedSegment?: any;
  width?: number;
  height?: number;
}

export interface ExcessiveCostGridProps {
  data: ExcessiveItem[];
  isLoading?: boolean;
  threshold?: number;
  onThresholdChange?: (threshold: number) => void;
  onItemSelect?: (item: ExcessiveItem) => void;
  selectedItem?: ExcessiveItem | null;
  sortBy?: 'cost' | 'percentage' | 'savings' | 'value';
  onSortChange?: (sortBy: string) => void;
  groupBy?: 'category' | 'warehouse' | 'component';
  onGroupByChange?: (groupBy: string) => void;
  width?: number;
  height?: number;
}

export interface CostTrendAnalyzerProps {
  data: TrendDataPoint[];
  isLoading?: boolean;
  viewType?: 'absolute' | 'percentage' | 'both';
  onViewTypeChange?: (viewType: string) => void;
  timeRange?: { start: string; end: string };
  onTimeRangeChange?: (range: { start: string; end: string }) => void;
  showForecast?: boolean;
  onForecastToggle?: (show: boolean) => void;
  width?: number;
  height?: number;
}

export interface SavingOpportunityAnalyzerProps {
  data: SavingOpportunity[];
  isLoading?: boolean;
  groupBy?: 'item' | 'category' | 'warehouse' | 'component';
  onGroupByChange?: (groupBy: string) => void;
  difficultyFilter?: number;
  onDifficultyFilterChange?: (difficulty: number) => void;
  minSavings?: number;
  onMinSavingsChange?: (minSavings: number) => void;
  onOpportunitySelect?: (opportunity: SavingOpportunity) => void;
  selectedOpportunity?: SavingOpportunity | null;
  width?: number;
  height?: number;
}

export interface WarehouseCostComparisonProps {
  data: WarehouseBreakdown;
  isLoading?: boolean;
  sortBy?: 'cost' | 'percentage' | 'costPerUnit' | 'name';
  onSortChange?: (sortBy: string) => void;
  showComponents?: boolean;
  onComponentToggle?: (show: boolean) => void;
  selectedWarehouses?: string[];
  onWarehouseSelect?: (warehouseIds: string[]) => void;
  normalized?: boolean;
  onNormalizedToggle?: (normalized: boolean) => void;
  width?: number;
  height?: number;
}

export interface CostComponentAnalysisProps {
  data: CostBreakdownData | null;
  isLoading?: boolean;
  expandedComponent?: string | null;
  onComponentExpand?: (component: string | null) => void;
  benchmarkData?: any;
  showBenchmarks?: boolean;
  onBenchmarkToggle?: (show: boolean) => void;
  sortBy?: 'cost' | 'percentage' | 'change' | 'savings';
  onSortChange?: (sortBy: string) => void;
  width?: number;
  height?: number;
}

export interface FilterPanelProps {
  filters: FilterState;
  filterOptions: FilterOptions;
  onFiltersChange: (filters: FilterState) => void;
  isLoading?: boolean;
  onReset?: () => void;
  compact?: boolean;
}

// Dashboard state interface
export interface DashboardState {
  data: HoldingCostAnalysisData | null;
  isLoading: boolean;
  error: string | null;
  filters: FilterState;
  selectedView: 'dashboard' | 'breakdown' | 'opportunities' | 'trends';
  selectedItems: ExcessiveItem[];
  lastUpdated: string | null;
}

// Chart configuration interfaces
export interface ChartColors {
  capitalCost: string;
  opportunityCost: string;
  storageCost: string;
  riskCost: string;
  primary: string;
  secondary: string;
  background: string;
  text: string;
  grid: string;
  accent: string;
}

export interface ChartConfig {
  colors: ChartColors;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  animations: {
    duration: number;
    easing: string;
  };
  responsive: boolean;
}

// Utility types
export type SortDirection = 'asc' | 'desc';
export type ViewType = 'component' | 'category' | 'warehouse' | 'item';
export type TimeRange = 'last_month' | 'last_quarter' | 'last_6_months' | 'last_year' | 'custom';
export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'png';

// Event handler types
export type DataPointClickHandler = (dataPoint: any, event: MouseEvent) => void;
export type FilterChangeHandler = (filters: FilterState) => void;
export type ViewChangeHandler = (view: string) => void;
export type SelectionChangeHandler = (selection: any[]) => void; 