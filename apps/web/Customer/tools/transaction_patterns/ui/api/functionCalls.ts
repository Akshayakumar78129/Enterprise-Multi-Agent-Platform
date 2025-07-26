import { FunctionDeclaration } from '../../../../../ui-common/utils/api/types';

// Define function declarations for Transaction Patterns tool
// Note: Implementation will be added in a later phase
export const transactionPatternsFunctions = [
  {
    name: "highlightTemporalPattern",
    description: "Highlight specific time periods in the temporal heatmap to show transaction patterns",
    parameters: {
      type: "object",
      properties: {
        day: {
          type: "string",
          description: "Day of week to highlight (e.g., 'Monday', 'Tuesday')",
          enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        },
        hour: {
          type: "number",
          description: "Hour of day to highlight (0-23)",
          minimum: 0,
          maximum: 23
        },
        explanation: {
          type: "string",
          description: "Explanation of why this pattern is significant"
        }
      },
      required: ["day", "hour", "explanation"]
    }
  },
  {
    name: "filterByDateRange",
    description: "Filter all transaction data to show patterns within a specific date range",
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
          description: "Reason for focusing on this time period"
        }
      },
      required: ["startDate", "endDate", "explanation"]
    }
  },
  {
    name: "highlightAnomalousTransactions",
    description: "Highlight and explain anomalous transactions in the scatter plot",
    parameters: {
      type: "object",
      properties: {
        anomalyLevel: {
          type: "string",
          description: "Level of anomalies to highlight",
          enum: ["Low", "Medium", "High", "All"]
        },
        explanation: {
          type: "string",
          description: "Explanation of what makes these transactions anomalous"
        }
      },
      required: ["anomalyLevel", "explanation"]
    }
  },
  {
    name: "compareTimeSeriesPeriods",
    description: "Compare transaction patterns between different time periods",
    parameters: {
      type: "object",
      properties: {
        period1Start: {
          type: "string",
          description: "Start date of first period (YYYY-MM-DD)"
        },
        period1End: {
          type: "string",
          description: "End date of first period (YYYY-MM-DD)"
        },
        period2Start: {
          type: "string",
          description: "Start date of second period (YYYY-MM-DD)"
        },
        period2End: {
          type: "string",
          description: "End date of second period (YYYY-MM-DD)"
        },
        comparisonType: {
          type: "string",
          description: "Type of comparison to perform",
          enum: ["volume", "value", "both"]
        },
        explanation: {
          type: "string",
          description: "Explanation of the comparison insights"
        }
      },
      required: ["period1Start", "period1End", "period2Start", "period2End", "comparisonType", "explanation"]
    }
  },
  {
    name: "explainPaymentMethodTrends",
    description: "Explain trends and patterns in payment method usage",
    parameters: {
      type: "object",
      properties: {
        paymentMethod: {
          type: "string",
          description: "Specific payment method to focus on (optional)"
        },
        trendType: {
          type: "string",
          description: "Type of trend to explain",
          enum: ["growth", "decline", "seasonal", "overall"]
        },
        explanation: {
          type: "string",
          description: "Detailed explanation of the payment method trends"
        }
      },
      required: ["trendType", "explanation"]
    }
  },
  {
    name: "identifyPeakTransactionPeriods",
    description: "Identify and explain peak transaction periods in the data",
    parameters: {
      type: "object",
      properties: {
        periodType: {
          type: "string",
          description: "Type of peak period to identify",
          enum: ["hourly", "daily", "weekly", "monthly"]
        },
        threshold: {
          type: "number",
          description: "Minimum transaction count to consider as peak",
          minimum: 1
        },
        explanation: {
          type: "string",
          description: "Business explanation for these peak periods"
        }
      },
      required: ["periodType", "explanation"]
    }
  },
  {
    name: "analyzeProductAssociations",
    description: "Analyze and explain product association patterns in transactions",
    parameters: {
      type: "object",
      properties: {
        productA: {
          type: "string",
          description: "First product to analyze associations for"
        },
        productB: {
          type: "string",
          description: "Second product to analyze associations for (optional)"
        },
        confidenceThreshold: {
          type: "number",
          description: "Minimum confidence level for associations (0-1)",
          minimum: 0,
          maximum: 1
        },
        explanation: {
          type: "string",
          description: "Business insights about these product associations"
        }
      },
      required: ["productA", "explanation"]
    }
  },
  {
    name: "explainSeasonalPatterns",
    description: "Explain seasonal patterns and trends in transaction data",
    parameters: {
      type: "object",
      properties: {
        seasonType: {
          type: "string",
          description: "Type of seasonal pattern to explain",
          enum: ["daily", "weekly", "monthly", "quarterly", "yearly"]
        },
        metric: {
          type: "string",
          description: "Metric to analyze for seasonality",
          enum: ["volume", "value", "frequency", "all"]
        },
        explanation: {
          type: "string",
          description: "Detailed explanation of the seasonal patterns and their business implications"
        }
      },
      required: ["seasonType", "metric", "explanation"]
    }
  },
  {
    name: "investigateTransactionAnomaly",
    description: "Investigate specific transaction anomalies and provide detailed analysis",
    parameters: {
          type: "object",
          properties: {
        transactionId: {
          type: "number",
          description: "ID of the specific transaction to investigate"
        },
        anomalyType: {
          type: "string",
          description: "Type of anomaly detected",
          enum: ["amount", "quantity", "timing", "pattern", "combined"]
        },
        investigation: {
          type: "string",
          description: "Detailed investigation findings and potential causes"
        },
        recommendation: {
          type: "string",
          description: "Recommended actions based on the anomaly investigation"
        }
          },
      required: ["transactionId", "anomalyType", "investigation", "recommendation"]
    }
        },
  {
    name: "generateTransactionInsights",
    description: "Generate comprehensive insights about transaction patterns and trends",
    parameters: {
          type: "object",
          properties: {
        insightType: {
          type: "string",
          description: "Type of insights to generate",
          enum: ["performance", "trends", "anomalies", "opportunities", "risks", "comprehensive"]
        },
        timeframe: {
          type: "string",
          description: "Timeframe for the insights",
          enum: ["daily", "weekly", "monthly", "quarterly", "yearly", "custom"]
        },
        insights: {
          type: "string",
          description: "Generated insights and analysis"
        },
        actionItems: {
          type: "array",
          items: {
            type: "string"
          },
          description: "List of actionable recommendations based on the insights"
        }
      },
      required: ["insightType", "timeframe", "insights", "actionItems"]
    }
  },
  {
    name: "adjustVisualizationFocus",
    description: "Adjust the focus and zoom level of visualizations to highlight specific patterns",
    parameters: {
      type: "object",
      properties: {
        visualization: {
          type: "string",
          description: "Which visualization to adjust",
          enum: ["heatmap", "timeseries", "network", "scatter", "all"]
        },
        focusArea: {
          type: "string",
          description: "Area to focus on in the visualization"
        },
        zoomLevel: {
          type: "string",
          description: "Level of zoom/detail to apply",
          enum: ["overview", "detailed", "granular"]
        },
        explanation: {
          type: "string",
          description: "Explanation of why this focus is important"
        }
          },
      required: ["visualization", "focusArea", "explanation"]
    }
  },
  {
    name: "predictTransactionTrends",
    description: "Predict future transaction trends based on historical patterns",
    parameters: {
      type: "object",
      properties: {
        predictionHorizon: {
          type: "string",
          description: "How far into the future to predict",
          enum: ["1_week", "1_month", "3_months", "6_months", "1_year"]
        },
        metric: {
          type: "string",
          description: "What metric to predict",
          enum: ["volume", "value", "anomaly_rate", "peak_hours"]
        },
        confidence: {
          type: "number",
          description: "Confidence level of the prediction (0-100)",
          minimum: 0,
          maximum: 100
        },
        prediction: {
          type: "string",
          description: "Detailed prediction with reasoning and methodology"
        },
        factors: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Key factors influencing the prediction"
        }
      },
      required: ["predictionHorizon", "metric", "confidence", "prediction", "factors"]
    }
  }
];

export default transactionPatternsFunctions; 