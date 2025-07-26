export const inventoryLevelAnalyzerFunctions: FunctionDeclaration[] = [
  {
    name: "highlightLowStockItems",
    description: "Highlight items with low stock levels in the inventory analyzer",
    parameters: {
      type: "object",
      properties: {
        threshold: {
          type: "number",
          description: "Stock level threshold percentage (0.0 to 1.0)",
          minimum: 0.0,
          maximum: 1.0
        },
        category: {
          type: "string",
          description: "Product category to focus on (optional)"
        },
        explanation: {
          type: "string",
          description: "Explanation of why these items are highlighted"
        }
      },
      required: ["threshold"]
    }
  },
  {
    name: "filterByStockoutRisk",
    description: "Filter inventory view to show only items at risk of stockout",
    parameters: {
      type: "object",
      properties: {
        maxDaysSupply: {
          type: "number",
          description: "Maximum days of supply to consider as at-risk",
          minimum: 1,
          maximum: 30
        },
        warehouse: {
          type: "string",
          description: "Specific warehouse to filter by (optional)"
        },
        sortBy: {
          type: "string",
          enum: ["daysOfSupply", "inventoryValue", "itemName"],
          description: "How to sort the filtered results"
        }
      },
      required: ["maxDaysSupply"]
    }
  },
  {
    name: "compareInventoryLevels",
    description: "Compare inventory levels between categories or warehouses",
    parameters: {
      type: "object",
      properties: {
        comparisonType: {
          type: "string",
          enum: ["category", "warehouse"],
          description: "What to compare: categories or warehouses"
        },
        items: {
          type: "array",
          items: {
            type: "string"
          },
          description: "List of categories or warehouses to compare"
        },
        metric: {
          type: "string",
          enum: ["stockLevel", "daysOfSupply", "inventoryValue", "riskItems"],
          description: "Which metric to focus the comparison on"
        },
        explanation: {
          type: "string",
          description: "Explanation of what the comparison reveals"
        }
      },
      required: ["comparisonType", "items", "metric"]
    }
  },
  {
    name: "identifyStockImbalances",
    description: "Identify and highlight inventory imbalances across warehouses",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Product category to analyze for imbalances"
        },
        imbalanceThreshold: {
          type: "number",
          description: "Percentage difference to consider as imbalance",
          minimum: 10,
          maximum: 100
        },
        showTransferSuggestions: {
          type: "boolean",
          description: "Whether to show suggested transfers to balance inventory"
        }
      },
      required: ["category"]
    }
  },
  {
    name: "explainInventoryHealth",
    description: "Provide detailed explanation of inventory health metrics",
    parameters: {
      type: "object",
      properties: {
        scope: {
          type: "string",
          enum: ["overall", "category", "warehouse", "item"],
          description: "Scope of the health explanation"
        },
        target: {
          type: "string",
          description: "Specific target (category name, warehouse name, or item ID) when scope is not 'overall'"
        },
        includeRecommendations: {
          type: "boolean",
          description: "Whether to include actionable recommendations"
        }
      },
      required: ["scope"]
    }
  },
  {
    name: "forecastStockoutDates",
    description: "Predict when items will stock out based on current consumption rates",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Product category to forecast (optional)"
        },
        warehouse: {
          type: "string",
          description: "Warehouse to forecast (optional)"
        },
        daysAhead: {
          type: "number",
          description: "Number of days to forecast ahead",
          minimum: 7,
          maximum: 365
        },
        confidenceLevel: {
          type: "string",
          enum: ["high", "medium", "low"],
          description: "Confidence level for predictions"
        }
      },
      required: ["daysAhead"]
    }
  },
  {
    name: "generateRestockPlan",
    description: "Generate a prioritized restocking plan based on current inventory levels",
    parameters: {
      type: "object",
      properties: {
        timeframe: {
          type: "string",
          enum: ["immediate", "week", "month", "quarter"],
          description: "Timeframe for the restocking plan"
        },
        priorityMethod: {
          type: "string",
          enum: ["daysOfSupply", "inventoryValue", "salesVelocity", "critical"],
          description: "Method to prioritize restocking items"
        },
        budget: {
          type: "number",
          description: "Budget constraint for restocking (optional)"
        },
        includeSupplierInfo: {
          type: "boolean",
          description: "Whether to include supplier recommendations"
        }
      },
      required: ["timeframe", "priorityMethod"]
    }
  },
  {
    name: "highlightHealthMatrixCell",
    description: "Highlight specific cells in the inventory health matrix",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Product category to highlight"
        },
        warehouse: {
          type: "string",
          description: "Warehouse to highlight"
        },
        highlightType: {
          type: "string",
          enum: ["critical", "attention", "good", "info"],
          description: "Type of highlight to apply"
        },
        explanation: {
          type: "string",
          description: "Explanation of why this cell is highlighted"
        }
      },
      required: ["category", "warehouse", "highlightType"]
    }
  },
  {
    name: "adjustStockThresholds",
    description: "Adjust stock level thresholds for analysis and alerts",
    parameters: {
      type: "object",
      properties: {
        lowStockThreshold: {
          type: "number",
          description: "New low stock threshold percentage (0.0 to 1.0)",
          minimum: 0.0,
          maximum: 1.0
        },
        criticalThreshold: {
          type: "number",
          description: "New critical stock threshold percentage (0.0 to 1.0)",
          minimum: 0.0,
          maximum: 1.0
        },
        applyToCategory: {
          type: "string",
          description: "Apply threshold only to specific category (optional)"
        },
        reason: {
          type: "string",
          description: "Reason for adjusting thresholds"
        }
      },
      required: ["lowStockThreshold"]
    }
  },
  {
    name: "analyzeSeasonalPatterns",
    description: "Analyze seasonal patterns in inventory consumption and stock levels",
    parameters: {
      type: "object",
      properties: {
        timeRange: {
          type: "string",
          enum: ["quarter", "halfYear", "year", "twoYears"],
          description: "Time range for seasonal analysis"
        },
        category: {
          type: "string",
          description: "Product category to analyze (optional)"
        },
        showPredictions: {
          type: "boolean",
          description: "Whether to show seasonal predictions"
        },
        highlightAnomalies: {
          type: "boolean",
          description: "Whether to highlight seasonal anomalies"
        }
      },
      required: ["timeRange"]
    }
  }
];

// Type definitions for function call parameters
export interface HighlightLowStockParams {
  threshold: number;
  category?: string;
  explanation?: string;
}

export interface FilterByStockoutRiskParams {
  maxDaysSupply: number;
  warehouse?: string;
  sortBy?: "daysOfSupply" | "inventoryValue" | "itemName";
}

export interface CompareInventoryLevelsParams {
  comparisonType: "category" | "warehouse";
  items: string[];
  metric: "stockLevel" | "daysOfSupply" | "inventoryValue" | "riskItems";
  explanation?: string;
}

export interface IdentifyStockImbalancesParams {
  category: string;
  imbalanceThreshold?: number;
  showTransferSuggestions?: boolean;
}

export interface ExplainInventoryHealthParams {
  scope: "overall" | "category" | "warehouse" | "item";
  target?: string;
  includeRecommendations?: boolean;
}

export interface ForecastStockoutDatesParams {
  category?: string;
  warehouse?: string;
  daysAhead: number;
  confidenceLevel?: "high" | "medium" | "low";
}

export interface GenerateRestockPlanParams {
  timeframe: "immediate" | "week" | "month" | "quarter";
  priorityMethod: "daysOfSupply" | "inventoryValue" | "salesVelocity" | "critical";
  budget?: number;
  includeSupplierInfo?: boolean;
}

export interface HighlightHealthMatrixCellParams {
  category: string;
  warehouse: string;
  highlightType: "critical" | "attention" | "good" | "info";
  explanation?: string;
}

export interface AdjustStockThresholdsParams {
  lowStockThreshold: number;
  criticalThreshold?: number;
  applyToCategory?: string;
  reason?: string;
}

export interface AnalyzeSeasonalPatternsParams {
  timeRange: "quarter" | "halfYear" | "year" | "twoYears";
  category?: string;
  showPredictions?: boolean;
  highlightAnomalies?: boolean;
}

// Function declaration type
export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
} 