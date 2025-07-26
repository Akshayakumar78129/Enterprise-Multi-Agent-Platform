// Function declarations for LLM control of Purchase Frequency Analyzer
import { FunctionDeclaration } from '../../../../../../../Project/ui-common/utils/api/types';

export const purchaseFrequencyFunctions: FunctionDeclaration[] = [
  // Highlighting Functions
  {
    name: "highlightFrequencyBin",
    description: "Highlight a specific frequency bin in the purchase frequency distribution chart",
    parameters: {
      type: "object",
      properties: {
        frequencyBin: {
          type: "string",
          description: "The frequency bin to highlight (e.g., '1', '2', '3', '4-5', '6-10', '11-20', '20+')",
          enum: ["1", "2", "3", "4-5", "6-10", "11-20", "20+"]
        },
        explanation: {
          type: "string",
          description: "Explanation of why this frequency bin is being highlighted"
        }
      },
      required: ["frequencyBin"]
    }
  },
  {
    name: "highlightDateInterval",
    description: "Highlight specific cells in the interval heatmap calendar",
    parameters: {
      type: "object",
      properties: {
        cells: {
          type: "array",
          items: {
            type: "object",
            properties: {
              day: { type: "string", description: "Date in YYYY-MM-DD format" },
              hour: { type: "number", description: "Hour (0-23)" }
            },
            required: ["day", "hour"]
          },
          description: "Calendar cells to highlight"
        },
        explanation: {
          type: "string",
          description: "Text explanation of why these cells are being highlighted"
        }
      },
      required: ["cells", "explanation"]
    }
  },
  {
    name: "highlightCustomerSegment",
    description: "Highlight specific customer segments in the RFM quadrant",
    parameters: {
      type: "object",
      properties: {
        segments: {
          type: "array",
          items: {
            type: "string",
            enum: ["champions", "loyal", "big_spenders", "at_risk", "others"]
          },
          description: "Customer segments to highlight"
        },
        explanation: {
          type: "string",
          description: "Text explanation of why these segments are being highlighted"
        }
      },
      required: ["segments", "explanation"]
    }
  },

  // Filtering Functions
  {
    name: "setDateRange",
    description: "Set the date range for all visualizations",
    parameters: {
      type: "object",
      properties: {
        start: {
          type: "string",
          description: "Start date in YYYY-MM-DD format"
        },
        end: {
          type: "string",
          description: "End date in YYYY-MM-DD format"
        }
      },
      required: ["start", "end"]
    }
  },
  {
    name: "filterByFrequency",
    description: "Filter data to show only customers with purchase frequency in specified range",
    parameters: {
      type: "object",
      properties: {
        min: {
          type: "number",
          description: "Minimum number of purchases"
        },
        max: {
          type: "number",
          description: "Maximum number of purchases"
        }
      },
      required: ["min"]
    }
  },
  {
    name: "filterBySegment",
    description: "Filter data to show only specified customer segments",
    parameters: {
      type: "object",
      properties: {
        segments: {
          type: "array",
          items: {
            type: "string",
            enum: ["champions", "loyal", "big_spenders", "at_risk", "others"]
          },
          description: "Customer segments to include"
        }
      },
      required: ["segments"]
    }
  },
  {
    name: "filterByCustomerSegment",
    description: "Filter the dashboard to show only customers from a specific RFM segment",
    parameters: {
      type: "object",
      properties: {
        segment: {
          type: "string",
          description: "The customer segment to filter by",
          enum: ["Champions", "Loyal", "Big Spenders", "At Risk", "Others"]
        },
        explanation: {
          type: "string",
          description: "Explanation of why this segment is being analyzed"
        }
      },
      required: ["segment"]
    }
  },

  // Comparative Functions
  {
    name: "compareTimePeriods",
    description: "Compare purchase frequency data between two time periods",
    parameters: {
      type: "object",
      properties: {
        period1: {
          type: "object",
          properties: {
            start: { type: "string", description: "Start date in YYYY-MM-DD format" },
            end: { type: "string", description: "End date in YYYY-MM-DD format" }
          },
          required: ["start", "end"],
          description: "First time period"
        },
        period2: {
          type: "object",
          properties: {
            start: { type: "string", description: "Start date in YYYY-MM-DD format" },
            end: { type: "string", description: "End date in YYYY-MM-DD format" }
          },
          required: ["start", "end"],
          description: "Second time period"
        },
        label1: {
          type: "string",
          description: "Label for first time period"
        },
        label2: {
          type: "string",
          description: "Label for second time period"
        }
      },
      required: ["period1", "period2"]
    }
  },
  {
    name: "compareSegments",
    description: "Compare purchase frequency metrics between selected segments",
    parameters: {
      type: "object",
      properties: {
        segment1: {
          type: "string",
          enum: ["champions", "loyal", "big_spenders", "at_risk", "others"],
          description: "First segment to compare"
        },
        segment2: {
          type: "string",
          enum: ["champions", "loyal", "big_spenders", "at_risk", "others"],
          description: "Second segment to compare"
        }
      },
      required: ["segment1", "segment2"]
    }
  },
  {
    name: "compareFrequencySegments",
    description: "Compare different frequency segments to show purchasing behavior differences",
    parameters: {
      type: "object",
      properties: {
        primarySegment: {
          type: "string",
          description: "The primary frequency segment to focus on",
          enum: ["High Frequency", "Medium Frequency", "Low Frequency", "One-time"]
        },
        comparisonSegment: {
          type: "string",
          description: "The comparison frequency segment",
          enum: ["High Frequency", "Medium Frequency", "Low Frequency", "One-time"]
        },
        metric: {
          type: "string",
          description: "The metric to compare between segments",
          enum: ["value", "frequency", "recency", "all"]
        }
      },
      required: ["primarySegment", "comparisonSegment"]
    }
  },

  // Explanatory Functions
  {
    name: "explainFrequencyPattern",
    description: "Generate explanation about the purchase frequency distribution",
    parameters: {
      type: "object",
      properties: {
        focusArea: {
          type: "string",
          enum: ["high_frequency", "low_frequency", "average", "outliers", "overall"],
          description: "Area of the distribution to explain"
        },
        includeRecommendations: {
          type: "boolean",
          description: "Whether to include actionable recommendations"
        }
      },
      required: ["focusArea"]
    }
  },
  {
    name: "explainSegmentDetails",
    description: "Generate detailed explanation of a customer segment",
    parameters: {
      type: "object",
      properties: {
        segment: {
          type: "string",
          enum: ["champions", "loyal", "big_spenders", "at_risk", "others"],
          description: "Customer segment to explain"
        },
        aspects: {
          type: "array",
          items: {
            type: "string",
            enum: ["frequency", "recency", "value", "trends", "recommendations"]
          },
          description: "Specific aspects of the segment to explain"
        }
      },
      required: ["segment"]
    }
  },
  {
    name: "explainMetricChange",
    description: "Explain the change in a specific KPI metric",
    parameters: {
      type: "object",
      properties: {
        metric: {
          type: "string",
          enum: ["total_customers", "avg_purchase_frequency", "avg_interval_days", "active_customers_percentage", "high_value_customers_percentage"],
          description: "The KPI metric to explain"
        },
        timeContext: {
          type: "string",
          description: "Time context for the explanation (e.g., 'since last month', 'year over year')"
        }
      },
      required: ["metric"]
    }
  },

  // Control Functions
  {
    name: "zoomFrequencyHistogram",
    description: "Zoom the frequency histogram to focus on a specific range",
    parameters: {
      type: "object",
      properties: {
        start: {
          type: "number",
          description: "Starting bin for zoom"
        },
        end: {
          type: "number",
          description: "Ending bin for zoom"
        }
      },
      required: ["start", "end"]
    }
  },
  {
    name: "focusQuadrantRegion",
    description: "Focus on a specific region in the RFM quadrant chart",
    parameters: {
      type: "object",
      properties: {
        frequencyMin: {
          type: "number",
          description: "Minimum frequency value for focus region"
        },
        frequencyMax: {
          type: "number",
          description: "Maximum frequency value for focus region"
        },
        valueMin: {
          type: "number",
          description: "Minimum transaction value for focus region"
        },
        valueMax: {
          type: "number",
          description: "Maximum transaction value for focus region"
        }
      },
      required: ["frequencyMin", "frequencyMax", "valueMin", "valueMax"]
    }
  },
  {
    name: "resetView",
    description: "Reset all visualizations to their default view",
    parameters: {
      type: "object",
      properties: {
        component: {
          type: "string",
          enum: ["all", "histogram", "heatmap", "quadrant", "regularity", "treemap"],
          description: "Specific component to reset, or 'all' for all components"
        }
      },
      required: []
    }
  },
  {
    name: "toggleIntelligencePanel",
    description: "Toggle the visibility of the Purchase Pattern Intelligence Panel",
    parameters: {
      type: "object",
      properties: {
        state: {
          type: "string",
          enum: ["expanded", "collapsed", "toggle"],
          description: "State to set the panel to, or 'toggle' to switch"
        }
      },
      required: []
    }
  },
  {
    name: "highlightValueSegment",
    description: "Highlight a specific value segment in the treemap visualization",
    parameters: {
      type: "object",
      properties: {
        valueSegment: {
          type: "string",
          description: "The value segment to highlight",
          enum: ["Premium", "Standard", "Budget", "Occasional"]
        },
        explanation: {
          type: "string",
          description: "Explanation of why this value segment is important"
        }
      },
      required: ["valueSegment"]
    }
  },
  {
    name: "analyzeCustomersByPurchasePattern",
    description: "Analyze customers based on their purchase patterns and frequency",
    parameters: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "The purchase pattern to analyze",
          enum: ["frequent_high_value", "infrequent_high_value", "frequent_low_value", "declining", "new_customers"]
        },
        includeRecommendations: {
          type: "boolean",
          description: "Whether to include actionable recommendations",
          default: true
        }
      },
      required: ["pattern"]
    }
  },
  {
    name: "focusOnDateRange",
    description: "Focus the analysis on a specific date range to show temporal purchase patterns",
    parameters: {
      type: "object",
      properties: {
        startDate: {
          type: "string",
          description: "Start date in YYYY-MM-DD format"
        },
        endDate: {
          type: "string",
          description: "End date in YYYY-MM-DD format"
        },
        explanation: {
          type: "string",
          description: "Explanation of why this date range is being analyzed"
        }
      },
      required: ["startDate", "endDate"]
    }
  },
  {
    name: "identifyAtRiskCustomers",
    description: "Identify customers who are at risk of churning based on purchase frequency patterns",
    parameters: {
      type: "object",
      properties: {
        riskLevel: {
          type: "string",
          description: "The level of risk to focus on",
          enum: ["high", "medium", "low", "all"]
        },
        daysSinceLastPurchase: {
          type: "number",
          description: "Minimum days since last purchase to consider at risk",
          default: 90
        },
        includeSegmentation: {
          type: "boolean",
          description: "Whether to segment at-risk customers by value",
          default: true
        }
      },
      required: ["riskLevel"]
    }
  },
  {
    name: "showFrequencyTrends",
    description: "Display trends in purchase frequency over time periods",
    parameters: {
      type: "object",
      properties: {
        trendPeriod: {
          type: "string",
          description: "The time period for trend analysis",
          enum: ["weekly", "monthly", "quarterly", "yearly"]
        },
        segment: {
          type: "string",
          description: "Optional segment to focus trend analysis on",
          enum: ["Champions", "Loyal", "Big Spenders", "At Risk", "Others"]
        }
      },
      required: ["trendPeriod"]
    }
  },
  {
    name: "generateCustomerInsights",
    description: "Generate AI insights about customer purchase frequency patterns",
    parameters: {
      type: "object",
      properties: {
        focusArea: {
          type: "string",
          description: "The area to focus insights on",
          enum: ["frequency_optimization", "value_improvement", "retention_strategy", "segmentation_analysis"]
        },
        includeActionItems: {
          type: "boolean",
          description: "Whether to include specific action items",
          default: true
        }
      },
      required: ["focusArea"]
    }
  },
  {
    name: "resetFrequencyFilters",
    description: "Reset all filters and selections to show the complete purchase frequency view",
    parameters: {
      type: "object",
      properties: {
        resetToDefaultDateRange: {
          type: "boolean",
          description: "Whether to also reset the date range to default (last 90 days)",
          default: false
        }
      }
    }
  }
]; 