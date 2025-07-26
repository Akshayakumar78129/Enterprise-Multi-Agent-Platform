export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export const anomalyDetectionFunctions: FunctionDeclaration[] = [
  {
    name: "highlightAnomalousCustomer",
    description: "Highlight a specific customer in the anomaly detection dashboard by customer ID or name",
    parameters: {
      type: "object",
      properties: {
        customerId: {
          type: "number",
          description: "The unique customer ID to highlight"
        },
        customerName: {
          type: "string", 
          description: "The customer name to search for and highlight"
        },
        explanation: {
          type: "string",
          description: "Explanation of why this customer is being highlighted"
        }
      },
      required: ["explanation"]
    }
  },
  {
    name: "filterBySeverity",
    description: "Filter anomalies by severity level(s) to focus on specific risk categories",
    parameters: {
      type: "object",
      properties: {
        severityLevels: {
          type: "array",
          items: {
            type: "number",
            minimum: 1,
            maximum: 5
          },
          description: "Array of severity levels to include (1-5, where 5 is most severe)"
        },
        explanation: {
          type: "string",
          description: "Explanation of why these severity levels are being filtered"
        }
      },
      required: ["severityLevels", "explanation"]
    }
  },
  {
    name: "filterByRegion",
    description: "Filter anomalies by geographic region to analyze regional patterns",
    parameters: {
      type: "object",
      properties: {
        regions: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Array of region names to include in the analysis"
        },
        explanation: {
          type: "string",
          description: "Explanation of why these regions are being analyzed"
        }
      },
      required: ["regions", "explanation"]
    }
  },
  {
    name: "analyzeFeatureContribution",
    description: "Focus on specific features that contribute to anomaly detection",
    parameters: {
      type: "object",
      properties: {
        xAxisFeature: {
          type: "string",
          enum: ["anomalyScore", "transactionCount", "totalAmount", "avgAmount", "severity"],
          description: "Feature to display on the X-axis of the scatter plot"
        },
        yAxisFeature: {
          type: "string", 
          enum: ["anomalyScore", "transactionCount", "totalAmount", "avgAmount", "severity"],
          description: "Feature to display on the Y-axis of the scatter plot"
        },
        explanation: {
          type: "string",
          description: "Explanation of why these features are being compared"
        }
      },
      required: ["xAxisFeature", "yAxisFeature", "explanation"]
    }
  },
  {
    name: "compareAnomalyScores",
    description: "Compare anomaly scores between different customer segments or time periods",
    parameters: {
      type: "object",
      properties: {
        segments: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Customer segments to compare (e.g., 'Premium', 'Standard', 'Basic')"
        },
        scoreThreshold: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Minimum anomaly score threshold for comparison"
        },
        explanation: {
          type: "string",
          description: "Explanation of the comparison being performed"
        }
      },
      required: ["explanation"]
    }
  },
  {
    name: "explainAnomalyPattern",
    description: "Provide detailed explanation of anomaly patterns and their business implications",
    parameters: {
      type: "object",
      properties: {
        patternType: {
          type: "string",
          enum: ["severity_distribution", "feature_correlation", "regional_clustering", "temporal_trends"],
          description: "Type of anomaly pattern to explain"
        },
        focusArea: {
          type: "string",
          description: "Specific area or aspect to focus the explanation on"
        },
        businessContext: {
          type: "string",
          description: "Business context for the explanation (e.g., 'fraud detection', 'customer retention')"
        }
      },
      required: ["patternType", "businessContext"]
    }
  },
  {
    name: "adjustSeverityThreshold",
    description: "Adjust the severity threshold for anomaly classification",
    parameters: {
      type: "object",
      properties: {
        thresholdLevel: {
          type: "number",
          minimum: 1,
          maximum: 5,
          description: "New threshold level for severity classification"
        },
        explanation: {
          type: "string",
          description: "Explanation of why the threshold is being adjusted"
        }
      },
      required: ["thresholdLevel", "explanation"]
    }
  },
  {
    name: "sortAnomaliesByMetric",
    description: "Sort the anomaly table by a specific metric to identify top performers or outliers",
    parameters: {
      type: "object",
      properties: {
        sortField: {
          type: "string",
          enum: ["anomalyScore", "severity", "totalAmount", "transactionCount", "customerName", "region"],
          description: "Field to sort the anomaly table by"
        },
        sortDirection: {
          type: "string",
          enum: ["asc", "desc"],
          description: "Sort direction (ascending or descending)"
        },
        explanation: {
          type: "string",
          description: "Explanation of why this sorting is being applied"
        }
      },
      required: ["sortField", "sortDirection", "explanation"]
    }
  },
  {
    name: "showCorrelationMatrix",
    description: "Display the feature correlation matrix to understand relationships between anomaly features",
    parameters: {
      type: "object",
      properties: {
        show: {
          type: "boolean",
          description: "Whether to show or hide the correlation matrix"
        },
        explanation: {
          type: "string",
          description: "Explanation of why the correlation matrix is being shown/hidden"
        }
      },
      required: ["show", "explanation"]
    }
  },
  {
    name: "investigateCustomerAnomaly",
    description: "Deep dive into a specific customer's anomalous behavior patterns",
    parameters: {
      type: "object",
      properties: {
        customerId: {
          type: "number",
          description: "Customer ID to investigate"
        },
        investigationFocus: {
          type: "string",
          enum: ["transaction_patterns", "spending_behavior", "frequency_changes", "product_preferences"],
          description: "Specific aspect of customer behavior to investigate"
        },
        explanation: {
          type: "string",
          description: "Explanation of the investigation purpose and expected insights"
        }
      },
      required: ["customerId", "investigationFocus", "explanation"]
    }
  }
];

export default anomalyDetectionFunctions; 