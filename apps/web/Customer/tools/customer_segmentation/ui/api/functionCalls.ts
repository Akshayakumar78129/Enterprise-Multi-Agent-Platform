import { FunctionDeclaration } from '../../../../types/ai';

export const customerSegmentationFunctions: FunctionDeclaration[] = [
  {
    name: "highlightCustomerSegments",
    description: "Highlight specific customer segments on the distribution map and profile cards",
    parameters: {
      type: "object",
      properties: {
        segmentNames: {
          type: "array",
          items: { type: "string" },
          description: "Names of customer segments to highlight (e.g., 'Champions', 'Loyal Customers', 'At Risk')"
        },
        explanation: {
          type: "string",
          description: "Explanation of why these segments are being highlighted"
        },
        duration: {
          type: "number",
          description: "Duration in seconds to maintain highlight (optional)"
        }
      },
      required: ["segmentNames"]
    }
  },
  {
    name: "filterBySegmentCharacteristics",
    description: "Filter customers based on segment characteristics like RFM scores, lifetime value, etc.",
    parameters: {
      type: "object",
      properties: {
        rfmScoreRange: {
          type: "array",
          items: { type: "number" },
          description: "Range of RFM-RL scores to filter [min, max]"
        },
        lifetimeValueRange: {
          type: "array",
          items: { type: "number" },
          description: "Range of lifetime values to filter [min, max]"
        },
        segmentCharacteristics: {
          type: "object",
          properties: {
            highValue: { type: "boolean", description: "Filter for high-value customers" },
            atRisk: { type: "boolean", description: "Filter for at-risk customers" },
            loyal: { type: "boolean", description: "Filter for loyal customers" },
            recent: { type: "boolean", description: "Filter for recently active customers" }
          },
          description: "Specific segment characteristics to filter by"
        },
        explanation: {
          type: "string",
          description: "Explanation of the filtering criteria"
        }
      },
      required: ["explanation"]
    }
  },
  {
    name: "compareSegmentMetrics",
    description: "Compare specific metrics across different customer segments",
    parameters: {
      type: "object",
      properties: {
        segments: {
          type: "array",
          items: { type: "string" },
          description: "Segment names to compare"
        },
        metrics: {
          type: "array",
          items: { type: "string" },
          description: "Metrics to compare (e.g., 'avg_lifetime_value', 'avg_order_value', 'avg_frequency')"
        },
        showPercentage: {
          type: "boolean",
          description: "Whether to show metrics as percentage relative to average"
        },
        highlightDifferences: {
          type: "boolean",
          description: "Whether to highlight significant differences between segments"
        },
        explanation: {
          type: "string",
          description: "Explanation of what comparison insights to focus on"
        }
      },
      required: ["segments", "metrics"]
    }
  },
  {
    name: "explainSegmentCharacteristics",
    description: "Provide detailed explanation of specific segment characteristics and behaviors",
    parameters: {
      type: "object",
      properties: {
        segmentName: {
          type: "string",
          description: "Name of the segment to explain"
        },
        aspects: {
          type: "array",
          items: { type: "string" },
          description: "Specific aspects to explain (e.g., 'behavior', 'value', 'risks', 'opportunities')"
        },
        includeRecommendations: {
          type: "boolean",
          description: "Whether to include marketing recommendations"
        }
      },
      required: ["segmentName"]
    }
  },
  {
    name: "identifySegmentOpportunities",
    description: "Identify business opportunities within specific customer segments",
    parameters: {
      type: "object",
      properties: {
        focusAreas: {
          type: "array",
          items: { type: "string" },
          description: "Areas to focus on (e.g., 'retention', 'upsell', 'acquisition', 'engagement')"
        },
        segmentPriority: {
          type: "string",
          enum: ["high_value", "high_risk", "growth_potential", "all"],
          description: "Priority segments to analyze for opportunities"
        },
        timeframe: {
          type: "string",
          description: "Timeframe for opportunity implementation (e.g., 'short-term', 'long-term')"
        }
      },
      required: ["focusAreas"]
    }
  },
  {
    name: "showCustomerDetails",
    description: "Display detailed information for specific customers within segments",
    parameters: {
      type: "object",
      properties: {
        customerIdentifier: {
          type: "string",
          description: "Customer name or identifier to show details for"
        },
        segmentName: {
          type: "string",
          description: "Segment the customer belongs to (optional filter)"
        },
        includeComparison: {
          type: "boolean",
          description: "Whether to compare customer to segment averages"
        }
      },
      required: ["customerIdentifier"]
    }
  },
  {
    name: "analyzeSegmentDistribution",
    description: "Analyze the distribution and balance of customer segments",
    parameters: {
      type: "object",
      properties: {
        focusMetric: {
          type: "string",
          enum: ["customer_count", "revenue_contribution", "growth_potential", "risk_level"],
          description: "Primary metric to analyze distribution by"
        },
        identifyImbalances: {
          type: "boolean",
          description: "Whether to identify potential segment imbalances"
        },
        benchmarkComparison: {
          type: "boolean",
          description: "Whether to compare against industry benchmarks"
        }
      },
      required: ["focusMetric"]
    }
  },
  {
    name: "generateSegmentReport",
    description: "Generate a comprehensive report for specific segments or overall segmentation",
    parameters: {
      type: "object",
      properties: {
        reportType: {
          type: "string",
          enum: ["executive_summary", "detailed_analysis", "action_plan", "performance_metrics"],
          description: "Type of report to generate"
        },
        segments: {
          type: "array",
          items: { type: "string" },
          description: "Specific segments to include (optional, defaults to all)"
        },
        includeRecommendations: {
          type: "boolean",
          description: "Whether to include actionable recommendations"
        },
        timeframe: {
          type: "string",
          description: "Time period for the report analysis"
        }
      },
      required: ["reportType"]
    }
  },
  {
    name: "highlightSegmentOutliers",
    description: "Identify and highlight outliers within customer segments",
    parameters: {
      type: "object",
      properties: {
        outlierType: {
          type: "string",
          enum: ["high_value", "low_engagement", "unusual_behavior", "recent_changes"],
          description: "Type of outliers to identify"
        },
        segmentScope: {
          type: "array",
          items: { type: "string" },
          description: "Segments to analyze for outliers (optional, defaults to all)"
        },
        threshold: {
          type: "number",
          description: "Statistical threshold for outlier detection (e.g., 2.0 for 2 standard deviations)"
        }
      },
      required: ["outlierType"]
    }
  },
  {
    name: "predictSegmentMovement",
    description: "Predict potential movement of customers between segments",
    parameters: {
      type: "object",
      properties: {
        fromSegment: {
          type: "string",
          description: "Source segment to analyze movement from"
        },
        toSegment: {
          type: "string",
          description: "Target segment to analyze movement to (optional)"
        },
        riskFactors: {
          type: "array",
          items: { type: "string" },
          description: "Risk factors to consider (e.g., 'recency', 'frequency', 'value_decline')"
        },
        timeHorizon: {
          type: "string",
          description: "Time horizon for prediction (e.g., '30_days', '90_days', '1_year')"
        }
      },
      required: ["fromSegment"]
    }
  }
];

export default customerSegmentationFunctions; 