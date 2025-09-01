/**
 * Inventory State Management
 * Simple state management for inventory dashboard (without external dependencies)
 */

import { KPIMetrics, SlowMovingItem } from '../config/inventoryMetrics';
import { 
  TurnoverMatrixData, 
  AgingAnalysisData, 
  CategoryBreakdownData, 
  TrendData,
  InventoryDataService 
} from '../services/dataService';

// Initialize data service
const dataService = new InventoryDataService();

// State interface
export interface InventoryState {
  // Data
  kpiMetrics: KPIMetrics | null;
  slowMovingItems: SlowMovingItem[];
  turnoverMatrix: TurnoverMatrixData[];
  agingAnalysis: AgingAnalysisData[];
  categoryBreakdown: CategoryBreakdownData[];
  trendData: TrendData[];
  
  // UI State
  isLoading: boolean;
  selectedCategory: string | null;
  selectedWarehouse: string | null;
  selectedItems: string[];
  turnoverThreshold: number;
  agingThreshold: number;
  
  // Filters
  filters: {
    category: string[];
    warehouse: string[];
    turnoverRange: [number, number];
    ageRange: [number, number];
  };
  
  // Dashboard view state
  activeView: 'overview' | 'category' | 'warehouse' | 'trends';
  chatOpen: boolean;
  
  // Error handling
  error: string | null;
}

// Initial state
export const initialInventoryState: InventoryState = {
  // Data
  kpiMetrics: null,
  slowMovingItems: [],
  turnoverMatrix: [],
  agingAnalysis: [],
  categoryBreakdown: [],
  trendData: [],
  
  // UI State
  isLoading: false,
  selectedCategory: null,
  selectedWarehouse: null,
  selectedItems: [],
  turnoverThreshold: 4.0,
  agingThreshold: 90,
  
  // Filters
  filters: {
    category: [],
    warehouse: [],
    turnoverRange: [0, 10],
    ageRange: [0, 365]
  },
  
  // Dashboard view state
  activeView: 'overview',
  chatOpen: false,
  
  // Error handling
  error: null
};

// Export singleton instance for simple usage
export const inventoryStateManager = {
  getState: () => ({ ...initialInventoryState }),
  setState: (updates: Partial<InventoryState>) => {
    // Simple state management - will be enhanced in later phases
  }
};
