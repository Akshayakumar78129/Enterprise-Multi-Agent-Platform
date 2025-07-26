export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: any;
    required?: string[];
  };
}

export const salesTrendFunctions: FunctionDeclaration[] = [
  // Highlighting Functions
  {
    name: "highlightTrendPeriod",
    description: "Highlight specific time periods in the trend visualization",
    parameters: {
      type: "object",
      properties: {
        periods: {
          type: "array",
          items: { type: "string" },
          description: "Array of period identifiers to highlight (e.g., ['2020-03', '2020-04'])"
        },
        explanation: {
          type: "string",
          description: "Explanation of why these periods are highlighted"
        }
      },
      required: ["periods"]
    }
  },
  {
    name: "highlightGrowthAnomalies",
    description: "Highlight periods with unusual growth rates or pattern deviations",
    parameters: {
      type: "object",
      properties: {
        threshold: {
          type: "number",
          description: "Growth rate threshold for anomaly detection (percentage)"
        },
        explanation: {
          type: "string",
          description: "Explanation of the anomaly pattern being highlighted"
        }
      },
      required: ["threshold"]
    }
  },
  {
    name: "highlightSeasonalPeaks",
    description: "Highlight seasonal peaks and valleys in the data",
    parameters: {
      type: "object",
      properties: {
        season: {
          type: "string",
          enum: ["spring", "summer", "fall", "winter", "holiday", "all"],
          description: "Which seasonal patterns to highlight"
        },
        explanation: {
          type: "string",
          description: "Explanation of the seasonal pattern significance"
        }
      },
      required: ["season"]
    }
  },

  // Filtering Functions
  {
    name: "filterByTimePeriod",
    description: "Filter the trend analysis to focus on specific time periods",
    parameters: {
      type: "object",
      properties: {
        startDate: {
          type: "string",
          description: "Start date for filtering (YYYY-MM-DD format)"
        },
        endDate: {
          type: "string",
          description: "End date for filtering (YYYY-MM-DD format)"
        },
        granularity: {
          type: "string",
          enum: ["daily", "weekly", "monthly", "quarterly", "annual"],
          description: "Time granularity for analysis"
        }
      },
      required: ["startDate", "endDate"]
    }
  },
  {
    name: "filterByMetric",
    description: "Switch between different metrics for trend analysis",
    parameters: {
      type: "object",
      properties: {
        metric: {
          type: "string",
          enum: ["revenue", "units", "aov", "margin"],
          description: "Metric to analyze trends for"
        },
        explanation: {
          type: "string",
          description: "Explanation of why this metric is being analyzed"
        }
      },
      required: ["metric"]
    }
  },
  {
    name: "filterByDimension",
    description: "Filter trends by business dimensions like product categories or regions",
    parameters: {
      type: "object",
      properties: {
        dimension: {
          type: "string",
          enum: ["product", "category", "channel", "region", "customer"],
          description: "Dimension to filter by"
        },
        values: {
          type: "array",
          items: { type: "string" },
          description: "Specific dimension values to include"
        }
      },
      required: ["dimension"]
    }
  },

  // Comparative Functions
  {
    name: "compareTimePeriodsGrowth",
    description: "Compare growth rates between different time periods",
    parameters: {
      type: "object",
      properties: {
        period1: {
          type: "object",
          properties: {
            startDate: { type: "string" },
            endDate: { type: "string" },
            label: { type: "string" }
          },
          description: "First time period for comparison"
        },
        period2: {
          type: "object",
          properties: {
            startDate: { type: "string" },
            endDate: { type: "string" },
            label: { type: "string" }
          },
          description: "Second time period for comparison"
        },
        explanation: {
          type: "string",
          description: "Context for why these periods are being compared"
        }
      },
      required: ["period1", "period2"]
    }
  },
  {
    name: "compareSeasonalPatterns",
    description: "Compare seasonal patterns across different years",
    parameters: {
      type: "object",
      properties: {
        years: {
          type: "array",
          items: { type: "string" },
          description: "Years to compare seasonal patterns for"
        },
        season: {
          type: "string",
          description: "Specific season to focus comparison on"
        },
        explanation: {
          type: "string",
          description: "Why these seasonal patterns are being compared"
        }
      },
      required: ["years"]
    }
  },
  {
    name: "compareTrendVsProjection",
    description: "Compare actual trends with projected or forecasted values",
    parameters: {
      type: "object",
      properties: {
        projectionPeriod: {
          type: "string",
          description: "Time period for projection comparison"
        },
        confidenceLevel: {
          type: "number",
          description: "Confidence level for projection comparison (0-100)"
        },
        explanation: {
          type: "string",
          description: "Context for the trend vs projection analysis"
        }
      },
      required: ["projectionPeriod"]
    }
  },

  // Explanatory Functions
  {
    name: "explainTrendDirection",
    description: "Provide explanation for the overall trend direction and patterns",
    parameters: {
      type: "object",
      properties: {
        period: {
          type: "string",
          description: "Specific period to explain trend for"
        },
        includeFactors: {
          type: "boolean",
          description: "Whether to include potential contributing factors"
        },
        detail: {
          type: "string",
          enum: ["summary", "detailed", "technical"],
          description: "Level of detail for explanation"
        }
      },
      required: ["period"]
    }
  },
  {
    name: "explainGrowthPattern",
    description: "Explain growth rate patterns and their business implications",
    parameters: {
      type: "object",
      properties: {
        growthType: {
          type: "string",
          enum: ["acceleration", "deceleration", "volatility", "stability"],
          description: "Type of growth pattern to explain"
        },
        businessContext: {
          type: "string",
          description: "Business context for the growth pattern explanation"
        }
      },
      required: ["growthType"]
    }
  },
  {
    name: "explainSeasonalityStrength",
    description: "Explain the strength and characteristics of seasonal patterns",
    parameters: {
      type: "object",
      properties: {
        seasonalityMetric: {
          type: "string",
          enum: ["strength", "consistency", "amplitude", "timing"],
          description: "Aspect of seasonality to explain"
        },
        comparison: {
          type: "string",
          description: "What to compare the seasonality against"
        }
      },
      required: ["seasonalityMetric"]
    }
  },

  // Control Functions
  {
    name: "resetTrendView",
    description: "Reset the trend visualization to default settings",
    parameters: {
      type: "object",
      properties: {
        resetType: {
          type: "string",
          enum: ["all", "filters", "highlights", "zoom"],
          description: "What aspects to reset"
        }
      },
      required: ["resetType"]
    }
  },
  {
    name: "adjustTrendSmoothing",
    description: "Adjust the smoothing parameters for trend visualization",
    parameters: {
      type: "object",
      properties: {
        smoothingWindow: {
          type: "number",
          description: "Number of periods for moving average smoothing"
        },
        smoothingType: {
          type: "string",
          enum: ["moving_average", "exponential", "linear", "polynomial"],
          description: "Type of smoothing algorithm to apply"
        }
      },
      required: ["smoothingWindow"]
    }
  }
]; 