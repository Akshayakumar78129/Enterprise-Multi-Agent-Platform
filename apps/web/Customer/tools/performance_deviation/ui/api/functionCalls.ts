export const performanceDeviationFunctions = [
  // HIGHLIGHTING FUNCTIONS
  {
    name: "highlightKPIDeviation",
    description: "Highlight specific KPI deviations in the performance explorer with explanation",
    parameters: {
      type: "object",
      properties: {
        kpiName: {
          type: "string",
          description: "Name of the KPI to highlight (e.g. 'daily_revenue', 'transaction_volume')"
        },
        timeRange: {
          type: "object",
          properties: {
            start: { type: "string", description: "Start date (YYYY-MM-DD)" },
            end: { type: "string", description: "End date (YYYY-MM-DD)" }
          },
          description: "Optional time range to focus on"
        },
        explanation: {
          type: "string",
          description: "Explanation of why this KPI deviation is significant"
        }
      },
      required: ["kpiName", "explanation"]
    }
  },
  {
    name: "highlightFeatureImportance",
    description: "Highlight and explain the importance of specific external factors",
    parameters: {
      type: "object",
      properties: {
        feature: {
          type: "string",
          description: "Feature to highlight (e.g. 'is_weekend', 'season_summer', 'market_condition')"
        },
        kpi: {
          type: "string",
          description: "Optional KPI context to explain feature impact"
        },
        explanation: {
          type: "string",
          description: "Explanation of the feature's influence on performance"
        }
      },
      required: ["feature", "explanation"]
    }
  },
  {
    name: "highlightAnomalyPattern",
    description: "Highlight specific anomaly patterns in the deviation explorer",
    parameters: {
      type: "object",
      properties: {
        patternType: {
          type: "string",
          enum: ["positive_anomaly", "negative_anomaly", "seasonal_pattern"],
          description: "Type of pattern to highlight"
        },
        timeframe: {
          type: "string",
          description: "Time period of the pattern (e.g. 'Q1 2020', 'Summer 2019')"
        },
        explanation: {
          type: "string",
          description: "Explanation of the anomaly pattern and its implications"
        }
      },
      required: ["patternType", "explanation"]
    }
  },

  // FILTERING FUNCTIONS
  {
    name: "filterByBusinessFunction",
    description: "Filter analysis to focus on specific business functions",
    parameters: {
      type: "object",
      properties: {
        functions: {
          type: "array",
          items: {
            type: "string",
            enum: ["sales", "customer", "finance"]
          },
          description: "Business functions to include in analysis"
        },
        explanation: {
          type: "string",
          description: "Reason for focusing on these business functions"
        }
      },
      required: ["functions", "explanation"]
    }
  },
  {
    name: "filterByTimeWindow",
    description: "Filter analysis to a specific time window for focused investigation",
    parameters: {
      type: "object",
      properties: {
        startDate: {
          type: "string",
          description: "Start date for analysis window (YYYY-MM-DD)"
        },
        endDate: {
          type: "string",
          description: "End date for analysis window (YYYY-MM-DD)"
        },
        reasoning: {
          type: "string",
          description: "Reason for selecting this time window"
        }
      },
      required: ["startDate", "endDate", "reasoning"]
    }
  },
  {
    name: "filterBySignificanceLevel",
    description: "Adjust significance threshold to focus on more or less significant deviations",
    parameters: {
      type: "object",
      properties: {
        threshold: {
          type: "number",
          description: "Statistical significance threshold (0.01-0.1)"
        },
        scope: {
          type: "string",
          enum: ["strict", "moderate", "inclusive"],
          description: "Interpretation of the threshold level"
        },
        explanation: {
          type: "string",
          description: "Reasoning for the chosen significance level"
        }
      },
      required: ["threshold", "explanation"]
    }
  },

  // COMPARATIVE FUNCTIONS
  {
    name: "compareKPIVariance",
    description: "Compare variance decomposition across multiple KPIs",
    parameters: {
      type: "object",
      properties: {
        kpis: {
          type: "array",
          items: { type: "string" },
          description: "List of KPIs to compare"
        },
        metric: {
          type: "string",
          enum: ["explanation_power", "model_accuracy", "total_variance"],
          description: "Metric to use for comparison"
        },
        insights: {
          type: "string",
          description: "Key insights from the comparison"
        }
      },
      required: ["kpis", "metric", "insights"]
    }
  },
  {
    name: "compareSeasonalPatterns",
    description: "Compare deviation patterns across different seasons or time periods",
    parameters: {
      type: "object",
      properties: {
        periods: {
          type: "array",
          items: { type: "string" },
          description: "Time periods to compare (e.g. ['Q1', 'Q2', 'Q3', 'Q4'])"
        },
        analysisType: {
          type: "string",
          enum: ["seasonal", "quarterly", "yearly", "monthly"],
          description: "Type of temporal comparison"
        },
        findings: {
          type: "string",
          description: "Key findings from the seasonal comparison"
        }
      },
      required: ["periods", "analysisType", "findings"]
    }
  },
  {
    name: "compareBusinessFunctionPerformance",
    description: "Compare performance deviation patterns across business functions",
    parameters: {
      type: "object",
      properties: {
        functions: {
          type: "array",
          items: {
            type: "string",
            enum: ["sales", "customer", "finance"]
          },
          description: "Business functions to compare"
        },
        comparisonMetric: {
          type: "string",
          enum: ["average_deviation", "anomaly_frequency", "predictability"],
          description: "Metric to use for comparison"
        },
        analysis: {
          type: "string",
          description: "Analysis of performance differences between functions"
        }
      },
      required: ["functions", "comparisonMetric", "analysis"]
    }
  },

  // EXPLANATORY FUNCTIONS
  {
    name: "explainVarianceDecomposition",
    description: "Provide detailed explanation of variance decomposition for a specific KPI",
    parameters: {
      type: "object",
      properties: {
        kpi: {
          type: "string",
          description: "KPI to explain variance decomposition for"
        },
        focus: {
          type: "string",
          enum: ["explained_variance", "unexplained_variance", "model_quality"],
          description: "Aspect of variance to focus explanation on"
        },
        actionableInsights: {
          type: "string",
          description: "Actionable insights based on the variance analysis"
        }
      },
      required: ["kpi", "actionableInsights"]
    }
  },
  {
    name: "explainFeatureInfluence",
    description: "Explain how external factors influence KPI performance",
    parameters: {
      type: "object",
      properties: {
        factors: {
          type: "array",
          items: { type: "string" },
          description: "External factors to explain"
        },
        impactAnalysis: {
          type: "string",
          description: "Detailed analysis of how these factors impact performance"
        },
        businessImplications: {
          type: "string",
          description: "Business implications and recommended actions"
        }
      },
      required: ["factors", "impactAnalysis", "businessImplications"]
    }
  },
  {
    name: "explainAnomalyRoot",
    description: "Provide root cause analysis for significant anomalies",
    parameters: {
      type: "object",
      properties: {
        anomalyDate: {
          type: "string",
          description: "Date of the anomaly (YYYY-MM-DD)"
        },
        magnitude: {
          type: "number",
          description: "Magnitude of the deviation"
        },
        rootCauses: {
          type: "array",
          items: { type: "string" },
          description: "Potential root causes for the anomaly"
        },
        preventionStrategies: {
          type: "string",
          description: "Strategies to prevent similar anomalies in the future"
        }
      },
      required: ["anomalyDate", "rootCauses", "preventionStrategies"]
    }
  },
  {
    name: "explainPredictabilityScore",
    description: "Explain the model's predictability and reliability for specific KPIs",
    parameters: {
      type: "object",
      properties: {
        kpis: {
          type: "array",
          items: { type: "string" },
          description: "KPIs to explain predictability for"
        },
        confidenceLevel: {
          type: "string",
          enum: ["high", "medium", "low"],
          description: "Overall confidence in predictions"
        },
        reliabilityFactors: {
          type: "string",
          description: "Factors affecting prediction reliability"
        },
        improvementSuggestions: {
          type: "string",
          description: "Suggestions for improving model performance"
        }
      },
      required: ["kpis", "reliabilityFactors", "improvementSuggestions"]
    }
  },

  // CONTROL FUNCTIONS
  {
    name: "adjustAnalysisParameters",
    description: "Adjust analysis parameters for deeper investigation",
    parameters: {
      type: "object",
      properties: {
        parameters: {
          type: "object",
          properties: {
            significanceThreshold: { type: "number", description: "Statistical significance threshold" },
            timeWindow: { type: "string", description: "Analysis time window" },
            businessFunctions: { 
              type: "array", 
              items: { type: "string" },
              description: "Business functions to include" 
            }
          },
          description: "Analysis parameters to adjust"
        },
        objective: {
          type: "string",
          description: "Objective for the parameter adjustment"
        }
      },
      required: ["parameters", "objective"]
    }
  },
  {
    name: "switchVisualizationMode",
    description: "Switch between different visualization modes for better insights",
    parameters: {
      type: "object",
      properties: {
        component: {
          type: "string",
          enum: ["performance_explorer", "feature_importance", "deviation_patterns"],
          description: "Component to modify"
        },
        mode: {
          type: "string",
          description: "Visualization mode to switch to"
        },
        purpose: {
          type: "string",
          description: "Purpose of switching to this visualization mode"
        }
      },
      required: ["component", "mode", "purpose"]
    }
  },
  {
    name: "resetDashboardView",
    description: "Reset the dashboard to default view with explanation",
    parameters: {
      type: "object",
      properties: {
        resetScope: {
          type: "string",
          enum: ["filters", "selections", "all"],
          description: "Scope of the reset operation"
        },
        reason: {
          type: "string",
          description: "Reason for resetting the dashboard"
        }
      },
      required: ["resetScope", "reason"]
    }
  }
]; 