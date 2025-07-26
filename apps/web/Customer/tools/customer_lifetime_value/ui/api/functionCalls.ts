export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export const customerLifetimeValueFunctions: FunctionDeclaration[] = [
  // Highlighting Functions
  {
    name: "highlightValueTier",
    description: "Highlight customers in a specific LTV value tier across all visualizations",
    parameters: {
      type: "object",
      properties: {
        tier: {
          type: "string",
          enum: ["Premium", "High Value", "Medium Value", "Standard"],
          description: "The value tier to highlight"
        },
        explanation: {
          type: "string",
          description: "Explanation of why this tier is being highlighted"
        }
      },
      required: ["tier", "explanation"]
    }
  },
  {
    name: "highlightCustomerSegment",
    description: "Highlight a specific customer segment across all LTV visualizations",
    parameters: {
      type: "object",
      properties: {
        segment: {
          type: "string",
          description: "The customer segment to highlight (e.g., 'Premium', 'Business', 'Standard')"
        },
        explanation: {
          type: "string",
          description: "Explanation of why this segment is being highlighted"
        }
      },
      required: ["segment", "explanation"]
    }
  },
  {
    name: "highlightRegion",
    description: "Highlight customers from a specific geographic region",
    parameters: {
      type: "object",
      properties: {
        region: {
          type: "string",
          description: "The region to highlight (e.g., 'North', 'South', 'East', 'West')"
        },
        explanation: {
          type: "string",
          description: "Explanation of why this region is being highlighted"
        }
      },
      required: ["region", "explanation"]
    }
  },
  {
    name: "highlightPredictionErrors",
    description: "Highlight customers with high prediction errors in the accuracy visualization",
    parameters: {
      type: "object",
      properties: {
        errorThreshold: {
          type: "number",
          description: "Minimum error percentage to highlight (e.g., 20 for 20%)"
        },
        explanation: {
          type: "string",
          description: "Explanation of why prediction errors are being highlighted"
        }
      },
      required: ["errorThreshold", "explanation"]
    }
  },

  // Filtering Functions
  {
    name: "filterByValueRange",
    description: "Filter all visualizations to show only customers within a specific LTV range",
    parameters: {
      type: "object",
      properties: {
        minValue: {
          type: "number",
          description: "Minimum LTV value in dollars"
        },
        maxValue: {
          type: "number",
          description: "Maximum LTV value in dollars"
        },
        explanation: {
          type: "string",
          description: "Explanation of why this value range is being filtered"
        }
      },
      required: ["minValue", "maxValue", "explanation"]
    }
  },
  {
    name: "filterByCustomerType",
    description: "Filter visualizations to show only specific customer types",
    parameters: {
      type: "object",
      properties: {
        customerTypes: {
          type: "array",
          items: { type: "string" },
          description: "Array of customer types to include (e.g., ['Premium', 'Business'])"
        },
        explanation: {
          type: "string",
          description: "Explanation of why these customer types are being filtered"
        }
      },
      required: ["customerTypes", "explanation"]
    }
  },
  {
    name: "filterByRegion",
    description: "Filter visualizations to show only customers from specific regions",
    parameters: {
      type: "object",
      properties: {
        regions: {
          type: "array",
          items: { type: "string" },
          description: "Array of regions to include"
        },
        explanation: {
          type: "string",
          description: "Explanation of why these regions are being filtered"
        }
      },
      required: ["regions", "explanation"]
    }
  },

  // Comparative Functions
  {
    name: "compareSegmentPerformance",
    description: "Compare LTV performance between different customer segments",
    parameters: {
      type: "object",
      properties: {
        segments: {
          type: "array",
          items: { type: "string" },
          description: "Array of customer segments to compare"
        },
        metric: {
          type: "string",
          enum: ["avgLTV", "totalValue", "customerCount", "predictionAccuracy"],
          description: "The metric to use for comparison"
        },
        explanation: {
          type: "string",
          description: "Explanation of what is being compared and why"
        }
      },
      required: ["segments", "metric", "explanation"]
    }
  },
  {
    name: "compareRegionalPerformance",
    description: "Compare LTV performance between different geographic regions",
    parameters: {
      type: "object",
      properties: {
        regions: {
          type: "array",
          items: { type: "string" },
          description: "Array of regions to compare"
        },
        metric: {
          type: "string",
          enum: ["avgLTV", "totalValue", "customerCount"],
          description: "The metric to use for comparison"
        },
        explanation: {
          type: "string",
          description: "Explanation of what is being compared and why"
        }
      },
      required: ["regions", "metric", "explanation"]
    }
  },
  {
    name: "comparePredictionAccuracy",
    description: "Compare prediction accuracy across different customer segments or value tiers",
    parameters: {
      type: "object",
      properties: {
        groupBy: {
          type: "string",
          enum: ["segment", "valueTier", "region"],
          description: "How to group customers for accuracy comparison"
        },
        explanation: {
          type: "string",
          description: "Explanation of what accuracy comparison is being made"
        }
      },
      required: ["groupBy", "explanation"]
    }
  },

  // Explanatory Functions
  {
    name: "explainValueDistribution",
    description: "Provide explanation about the customer lifetime value distribution patterns",
    parameters: {
      type: "object",
      properties: {
        focusArea: {
          type: "string",
          enum: ["overall", "highValue", "lowValue", "outliers"],
          description: "Which aspect of the distribution to explain"
        },
        explanation: {
          type: "string",
          description: "Detailed explanation of the distribution patterns"
        }
      },
      required: ["focusArea", "explanation"]
    }
  },
  {
    name: "explainPredictionModel",
    description: "Explain how the LTV prediction model works and its accuracy",
    parameters: {
      type: "object",
      properties: {
        aspect: {
          type: "string",
          enum: ["methodology", "accuracy", "features", "limitations"],
          description: "Which aspect of the model to explain"
        },
        explanation: {
          type: "string",
          description: "Detailed explanation of the prediction model"
        }
      },
      required: ["aspect", "explanation"]
    }
  },
  {
    name: "explainSegmentContribution",
    description: "Explain how different customer segments contribute to total value",
    parameters: {
      type: "object",
      properties: {
        segment: {
          type: "string",
          description: "Specific segment to explain, or 'all' for overall analysis"
        },
        explanation: {
          type: "string",
          description: "Explanation of segment value contribution patterns"
        }
      },
      required: ["segment", "explanation"]
    }
  },
  {
    name: "explainGeographicPatterns",
    description: "Explain geographic patterns in customer lifetime value",
    parameters: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          enum: ["concentration", "dispersion", "regional_differences", "outliers"],
          description: "Which geographic pattern to explain"
        },
        explanation: {
          type: "string",
          description: "Explanation of the geographic value patterns"
        }
      },
      required: ["pattern", "explanation"]
    }
  },

  // Control Functions
  {
    name: "adjustTimeHorizon",
    description: "Adjust the time horizon for LTV projections",
    parameters: {
      type: "object",
      properties: {
        months: {
          type: "number",
          description: "Number of months for the projection horizon (12-60)"
        },
        explanation: {
          type: "string",
          description: "Explanation of why this time horizon is being set"
        }
      },
      required: ["months", "explanation"]
    }
  },
  {
    name: "changeViewMode",
    description: "Change the view mode of visualizations (e.g., absolute vs percentage, cumulative vs velocity)",
    parameters: {
      type: "object",
      properties: {
        component: {
          type: "string",
          enum: ["distribution", "contribution", "projection"],
          description: "Which component's view mode to change"
        },
        mode: {
          type: "string",
          description: "The new view mode (e.g., 'percentage', 'absolute', 'velocity', 'cumulative')"
        },
        explanation: {
          type: "string",
          description: "Explanation of why this view mode is being changed"
        }
      },
      required: ["component", "mode", "explanation"]
    }
  },
  {
    name: "resetAllFilters",
    description: "Reset all filters and return to the default view of all LTV data",
    parameters: {
      type: "object",
      properties: {
        explanation: {
          type: "string",
          description: "Explanation of why filters are being reset"
        }
      },
      required: ["explanation"]
    }
  },
  {
    name: "focusOnCustomer",
    description: "Focus on a specific customer's LTV profile and details",
    parameters: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "The ID of the customer to focus on"
        },
        explanation: {
          type: "string",
          description: "Explanation of why this customer is being focused on"
        }
      },
      required: ["customerId", "explanation"]
    }
  },

  // Analysis Functions
  {
    name: "identifyValueDrivers",
    description: "Identify and highlight the key factors driving customer lifetime value",
    parameters: {
      type: "object",
      properties: {
        segment: {
          type: "string",
          description: "Customer segment to analyze, or 'all' for overall analysis"
        },
        explanation: {
          type: "string",
          description: "Explanation of the value drivers being identified"
        }
      },
      required: ["segment", "explanation"]
    }
  },
  {
    name: "findValueOptimizationOpportunities",
    description: "Identify opportunities to optimize customer lifetime value",
    parameters: {
      type: "object",
      properties: {
        focusArea: {
          type: "string",
          enum: ["underperforming_segments", "high_potential_customers", "retention_risks", "growth_opportunities"],
          description: "Which area to focus optimization analysis on"
        },
        explanation: {
          type: "string",
          description: "Explanation of the optimization opportunities being identified"
        }
      },
      required: ["focusArea", "explanation"]
    }
  }
];

export default customerLifetimeValueFunctions; 