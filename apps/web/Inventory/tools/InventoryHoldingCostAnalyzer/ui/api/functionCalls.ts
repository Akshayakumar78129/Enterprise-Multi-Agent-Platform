// LLM Function Declarations for Inventory Holding Cost Analyzer
export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export const inventoryHoldingCostFunctions: FunctionDeclaration[] = [
  // HIGHLIGHTING FUNCTIONS
  {
    name: "highlightHighCostItems",
    description: "Highlight items with excessive holding costs above a specified threshold",
    parameters: {
      type: "object",
      properties: {
        threshold: {
          type: "number",
          description: "Holding cost percentage threshold (e.g., 0.30 for 30%)",
          minimum: 0.1,
          maximum: 0.5
        },
        explanation: {
          type: "string",
          description: "Explanation of why these items are highlighted"
        },
        maxItems: {
          type: "number",
          description: "Maximum number of items to highlight",
          default: 10
        }
      },
      required: ["threshold", "explanation"]
    }
  },
  {
    name: "highlightCostComponent",
    description: "Highlight and focus on a specific cost component in the breakdown visualization",
    parameters: {
      type: "object",
      properties: {
        component: {
          type: "string",
          enum: ["Capital Cost", "Opportunity Cost", "Storage Cost", "Risk Cost"],
          description: "The cost component to highlight"
        },
        explanation: {
          type: "string",
          description: "Explanation of why this component is significant"
        },
        showBreakdown: {
          type: "boolean",
          description: "Whether to show detailed breakdown of this component",
          default: true
        }
      },
      required: ["component", "explanation"]
    }
  },
  {
    name: "highlightCategoryWithHighCosts",
    description: "Highlight a specific product category with concerning holding costs",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "The product category to highlight"
        },
        reason: {
          type: "string",
          description: "The reason for highlighting this category (e.g., 'highest average cost percentage', 'largest potential savings')"
        },
        metrics: {
          type: "array",
          items: { type: "string" },
          description: "Specific metrics to emphasize (e.g., 'total_cost', 'cost_percentage', 'potential_savings')"
        }
      },
      required: ["category", "reason"]
    }
  },

  // FILTERING FUNCTIONS
  {
    name: "filterByCostRange",
    description: "Filter items to show only those within a specific holding cost range",
    parameters: {
      type: "object",
      properties: {
        minCost: {
          type: "number",
          description: "Minimum annual holding cost in dollars"
        },
        maxCost: {
          type: "number",
          description: "Maximum annual holding cost in dollars"
        },
        includePercentage: {
          type: "boolean",
          description: "Whether to also consider percentage-based thresholds",
          default: false
        },
        minPercentage: {
          type: "number",
          description: "Minimum holding cost percentage (if includePercentage is true)"
        },
        maxPercentage: {
          type: "number",
          description: "Maximum holding cost percentage (if includePercentage is true)"
        }
      },
      required: ["minCost", "maxCost"]
    }
  },
  {
    name: "filterByWarehouseType",
    description: "Filter the analysis to focus on specific warehouse types or locations",
    parameters: {
      type: "object",
      properties: {
        warehouseTypes: {
          type: "array",
          items: { 
            type: "string",
            enum: ["Central", "Regional", "Local", "Special"]
          },
          description: "Types of warehouses to include in the analysis"
        },
        specificWarehouses: {
          type: "array",
          items: { type: "string" },
          description: "Specific warehouse IDs to include (optional)"
        },
        comparison: {
          type: "boolean",
          description: "Whether to show comparison between filtered and total",
          default: true
        }
      },
      required: ["warehouseTypes"]
    }
  },
  {
    name: "filterByCategory",
    description: "Filter the analysis to focus on specific product categories",
    parameters: {
      type: "object",
      properties: {
        categories: {
          type: "array",
          items: { type: "string" },
          description: "Product categories to include in the analysis"
        },
        excludeMode: {
          type: "boolean",
          description: "If true, exclude these categories instead of including them",
          default: false
        },
        showCategoryComparison: {
          type: "boolean",
          description: "Whether to show comparison between categories",
          default: true
        }
      },
      required: ["categories"]
    }
  },

  // COMPARATIVE FUNCTIONS
  {
    name: "compareWarehouseCosts",
    description: "Compare holding costs between different warehouses",
    parameters: {
      type: "object",
      properties: {
        primaryWarehouse: {
          type: "string",
          description: "Primary warehouse ID for comparison"
        },
        comparisonWarehouses: {
          type: "array",
          items: { type: "string" },
          description: "Warehouse IDs to compare against the primary"
        },
        metrics: {
          type: "array",
          items: { 
            type: "string",
            enum: ["total_cost", "cost_percentage", "cost_per_item", "potential_savings"]
          },
          description: "Metrics to compare",
          default: ["total_cost", "cost_percentage"]
        },
        explanation: {
          type: "string",
          description: "Explanation of the comparison purpose"
        }
      },
      required: ["primaryWarehouse", "comparisonWarehouses", "explanation"]
    }
  },
  {
    name: "compareCostComponents",
    description: "Compare the relative impact of different cost components",
    parameters: {
      type: "object",
      properties: {
        focusComponents: {
          type: "array",
          items: { 
            type: "string",
            enum: ["Capital Cost", "Opportunity Cost", "Storage Cost", "Risk Cost"]
          },
          description: "Cost components to focus the comparison on"
        },
        scope: {
          type: "string",
          enum: ["overall", "by_category", "by_warehouse"],
          description: "Scope of the comparison",
          default: "overall"
        },
        showTrends: {
          type: "boolean",
          description: "Whether to show trend analysis for components",
          default: false
        },
        explanation: {
          type: "string",
          description: "Explanation of why this comparison is important"
        }
      },
      required: ["focusComponents", "explanation"]
    }
  },
  {
    name: "compareBeforeAfterOptimization",
    description: "Compare current state with potential optimized state based on recommendations",
    parameters: {
      type: "object",
      properties: {
        optimizationScenario: {
          type: "string",
          enum: ["conservative", "moderate", "aggressive"],
          description: "Level of optimization to model"
        },
        targetReduction: {
          type: "number",
          description: "Target percentage reduction in holding costs (0-50)",
          minimum: 0,
          maximum: 50
        },
        focusAreas: {
          type: "array",
          items: { 
            type: "string",
            enum: ["high_cost_items", "excess_inventory", "storage_optimization", "risk_reduction"]
          },
          description: "Areas to focus optimization efforts on"
        },
        timeframe: {
          type: "string",
          description: "Expected timeframe for achieving optimization results"
        }
      },
      required: ["optimizationScenario", "targetReduction"]
    }
  },

  // EXPLANATORY FUNCTIONS
  {
    name: "explainCostDrivers",
    description: "Provide detailed explanation of the primary cost drivers in the analysis",
    parameters: {
      type: "object",
      properties: {
        scope: {
          type: "string",
          enum: ["overall", "category", "warehouse", "item"],
          description: "Scope for the cost driver analysis"
        },
        scopeValue: {
          type: "string",
          description: "Specific category, warehouse, or item to analyze (if scope is not 'overall')"
        },
        includeRecommendations: {
          type: "boolean",
          description: "Whether to include specific recommendations for addressing cost drivers",
          default: true
        },
        detailLevel: {
          type: "string",
          enum: ["summary", "detailed", "technical"],
          description: "Level of detail for the explanation",
          default: "detailed"
        }
      },
      required: ["scope"]
    }
  },
  {
    name: "explainSavingsOpportunities",
    description: "Explain the identified cost savings opportunities and their implementation",
    parameters: {
      type: "object",
      properties: {
        opportunityType: {
          type: "string",
          enum: ["all", "high_impact", "quick_wins", "long_term"],
          description: "Type of opportunities to explain",
          default: "all"
        },
        prioritization: {
          type: "string",
          enum: ["impact", "difficulty", "roi", "timeframe"],
          description: "How to prioritize the explanation",
          default: "impact"
        },
        includeImplementationSteps: {
          type: "boolean",
          description: "Whether to include specific implementation steps",
          default: true
        },
        maxOpportunities: {
          type: "number",
          description: "Maximum number of opportunities to explain",
          default: 5
        }
      },
      required: []
    }
  },
  {
    name: "explainCostCalculations",
    description: "Explain how holding costs are calculated and what factors influence them",
    parameters: {
      type: "object",
      properties: {
        componentFocus: {
          type: "string",
          enum: ["all", "capital", "opportunity", "storage", "risk"],
          description: "Which cost component to focus the explanation on",
          default: "all"
        },
        includeFormulas: {
          type: "boolean",
          description: "Whether to include calculation formulas",
          default: false
        },
        useExamples: {
          type: "boolean",
          description: "Whether to use specific examples from the data",
          default: true
        },
        audienceLevel: {
          type: "string",
          enum: ["executive", "manager", "analyst"],
          description: "Target audience level for the explanation",
          default: "manager"
        }
      },
      required: []
    }
  },

  // CONTROL FUNCTIONS
  {
    name: "adjustAnalysisParameters",
    description: "Adjust the analysis parameters to model different scenarios",
    parameters: {
      type: "object",
      properties: {
        holdingCostRate: {
          type: "number",
          description: "Annual holding cost percentage (0.15-0.35)",
          minimum: 0.15,
          maximum: 0.35
        },
        opportunityCostRate: {
          type: "number",
          description: "Opportunity cost rate (0.05-0.15)",
          minimum: 0.05,
          maximum: 0.15
        },
        excessiveThreshold: {
          type: "number",
          description: "Threshold for excessive cost identification (0.25-0.40)",
          minimum: 0.25,
          maximum: 0.40
        },
        scenarioName: {
          type: "string",
          description: "Name for this parameter scenario"
        },
        explanation: {
          type: "string",
          description: "Explanation of why these parameters were chosen"
        }
      },
      required: ["scenarioName", "explanation"]
    }
  },
  {
    name: "resetToDefaultView",
    description: "Reset all filters and views to the default dashboard state",
    parameters: {
      type: "object",
      properties: {
        preserveParameters: {
          type: "boolean",
          description: "Whether to preserve the analysis parameters (holding cost rates, etc.)",
          default: true
        },
        refreshData: {
          type: "boolean",
          description: "Whether to refresh data from the database",
          default: false
        },
        explanation: {
          type: "string",
          description: "Explanation of why the reset is being performed"
        }
      },
      required: ["explanation"]
    }
  }
];

// Export the function declarations for use in the LLM integration
export default inventoryHoldingCostFunctions; 