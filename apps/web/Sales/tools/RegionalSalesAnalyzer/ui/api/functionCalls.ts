export const regionalSalesAnalyzerFunctions = [
  {
    name: "highlightTopPerformingRegions",
    description: "Highlight and focus on the top performing regions by sales volume or other metrics",
    parameters: {
      type: "object",
      properties: {
        metric: {
          type: "string",
          enum: ["totalSales", "profitMargin", "customerCount", "growthRate"],
          description: "The metric to use for determining top performance"
        },
        count: {
          type: "integer",
          minimum: 1,
          maximum: 10,
          description: "Number of top regions to highlight (default: 5)"
        },
        explanation: {
          type: "string",
          description: "Explanation of why these regions are being highlighted"
        }
      },
      required: ["metric"]
    }
  },
  {
    name: "filterRegionsByCountry",
    description: "Filter the regional analysis to focus on specific countries",
    parameters: {
      type: "object",
      properties: {
        countries: {
          type: "array",
          items: { type: "string" },
          description: "List of country names to filter by"
        },
        includeComparison: {
          type: "boolean",
          description: "Whether to include comparison between the selected countries"
        }
      },
      required: ["countries"]
    }
  },
  {
    name: "analyzeRegionalGrowthOpportunities",
    description: "Identify and analyze regions with high growth potential",
    parameters: {
      type: "object",
      properties: {
        opportunityType: {
          type: "string",
          enum: ["Growth Opportunity", "Star Region", "Cash Cow", "Focus Area"],
          description: "Type of opportunity to analyze"
        },
        minSalesThreshold: {
          type: "number",
          description: "Minimum sales amount to consider for opportunities"
        },
        explanation: {
          type: "string",
          description: "Context for why this analysis is being performed"
        }
      },
      required: ["opportunityType"]
    }
  },
  {
    name: "compareRegionalPerformance",
    description: "Compare performance metrics between specific regions",
    parameters: {
      type: "object",
      properties: {
        regions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              country: { type: "string" },
              state: { type: "string" }
            },
            required: ["country", "state"]
          },
          description: "List of regions to compare"
        },
        metrics: {
          type: "array",
          items: {
            type: "string",
            enum: ["totalSales", "profitMargin", "customerCount", "avgTransactionValue", "growthRate"]
          },
          description: "Metrics to compare between regions"
        },
        timeRange: {
          type: "string",
          enum: ["last_quarter", "last_year", "ytd", "custom"],
          description: "Time range for the comparison"
        }
      },
      required: ["regions", "metrics"]
    }
  },
  {
    name: "showRegionalTimeTrends",
    description: "Display time series trends for specific regions or overall performance",
    parameters: {
      type: "object",
      properties: {
        regions: {
          type: "array",
          items: { type: "string" },
          description: "List of region identifiers (country-state format) or 'overall' for aggregate"
        },
        metric: {
          type: "string",
          enum: ["totalSales", "totalQuantity", "transactionCount", "regionCount"],
          description: "Metric to display in the time series"
        },
        aggregation: {
          type: "string",
          enum: ["day", "week", "month", "quarter"],
          description: "Time aggregation level"
        },
        showTrend: {
          type: "boolean",
          description: "Whether to include trend lines"
        }
      },
      required: ["metric"]
    }
  },
  {
    name: "highlightUnderperformingRegions",
    description: "Identify and highlight regions that are underperforming",
    parameters: {
      type: "object",
      properties: {
        metric: {
          type: "string",
          enum: ["totalSales", "profitMargin", "customerCount", "growthRate"],
          description: "Metric to use for determining underperformance"
        },
        threshold: {
          type: "string",
          enum: ["bottom_10_percent", "below_average", "negative_growth", "custom"],
          description: "Threshold for defining underperformance"
        },
        count: {
          type: "integer",
          minimum: 1,
          maximum: 15,
          description: "Maximum number of underperforming regions to highlight"
        },
        includeRecommendations: {
          type: "boolean",
          description: "Whether to include improvement recommendations"
        }
      },
      required: ["metric", "threshold"]
    }
  },
  {
    name: "analyzeMarketConcentration",
    description: "Analyze sales concentration across regions and identify concentration patterns",
    parameters: {
      type: "object",
      properties: {
        level: {
          type: "string",
          enum: ["country", "state", "region"],
          description: "Geographic level for concentration analysis"
        },
        includeGiniCoefficient: {
          type: "boolean",
          description: "Whether to calculate Gini coefficient for concentration"
        },
        topRegionsCount: {
          type: "integer",
          minimum: 3,
          maximum: 20,
          description: "Number of top regions to analyze for concentration"
        }
      },
      required: ["level"]
    }
  },
  {
    name: "generateRegionalInsights",
    description: "Generate AI-powered insights about regional performance patterns",
    parameters: {
      type: "object",
      properties: {
        analysisType: {
          type: "string",
          enum: ["performance_summary", "growth_patterns", "opportunity_analysis", "risk_assessment"],
          description: "Type of insights to generate"
        },
        focusRegions: {
          type: "array",
          items: { type: "string" },
          description: "Specific regions to focus the analysis on"
        },
        timeframe: {
          type: "string",
          enum: ["last_month", "last_quarter", "last_year", "ytd"],
          description: "Timeframe for the analysis"
        },
        includeForecasting: {
          type: "boolean",
          description: "Whether to include performance forecasting"
        }
      },
      required: ["analysisType"]
    }
  },
  {
    name: "setRegionalDateRange",
    description: "Change the date range for regional analysis",
    parameters: {
      type: "object",
      properties: {
        startDate: {
          type: "string",
          format: "date",
          description: "Start date for the analysis (YYYY-MM-DD format)"
        },
        endDate: {
          type: "string",
          format: "date",
          description: "End date for the analysis (YYYY-MM-DD format)"
        },
        preset: {
          type: "string",
          enum: ["last_7_days", "last_30_days", "last_quarter", "last_year", "ytd"],
          description: "Preset date range option"
        }
      }
    }
  },
  {
    name: "drillDownToRegion",
    description: "Drill down to detailed analysis of a specific region",
    parameters: {
      type: "object",
      properties: {
        country: {
          type: "string",
          description: "Country name to drill down to"
        },
        state: {
          type: "string",
          description: "State/province name to drill down to"
        },
        includeSubregions: {
          type: "boolean",
          description: "Whether to include sub-regional breakdown if available"
        },
        analysisDepth: {
          type: "string",
          enum: ["overview", "detailed", "comprehensive"],
          description: "Level of detail for the drill-down analysis"
        }
      },
      required: ["country"]
    }
  },
  {
    name: "exportRegionalData",
    description: "Export regional sales data in various formats",
    parameters: {
      type: "object",
      properties: {
        format: {
          type: "string",
          enum: ["csv", "excel", "pdf", "json"],
          description: "Export format for the data"
        },
        includeCharts: {
          type: "boolean",
          description: "Whether to include visualization charts in the export"
        },
        regions: {
          type: "array",
          items: { type: "string" },
          description: "Specific regions to include in export (empty for all)"
        },
        metrics: {
          type: "array",
          items: { type: "string" },
          description: "Specific metrics to include in export"
        }
      },
      required: ["format"]
    }
  },
  {
    name: "resetRegionalView",
    description: "Reset the regional analysis view to default settings",
    parameters: {
      type: "object",
      properties: {
        resetFilters: {
          type: "boolean",
          description: "Whether to reset all applied filters"
        },
        resetDateRange: {
          type: "boolean",
          description: "Whether to reset the date range to default"
        },
        resetSelections: {
          type: "boolean",
          description: "Whether to clear all region selections"
        }
      }
    }
  }
]; 