export const nextPurchaseFunctions = [
  {
    name: "highlightCustomerPrediction",
    description: "Highlight a specific customer's purchase prediction in the dashboard",
    parameters: {
      type: "object",
      properties: {
        customerId: {
          type: "number",
          description: "Customer ID to highlight"
        },
        explanation: {
          type: "string",
          description: "Explanation of why this customer is highlighted"
        }
      },
      required: ["customerId"]
    }
  },
  {
    name: "highlightProductAssociation",
    description: "Highlight product associations and recommendation paths in the network",
    parameters: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "Product ID to highlight (e.g., 'M-3003')"
        },
        showPath: {
          type: "boolean",
          description: "Whether to show recommendation path from this product"
        },
        explanation: {
          type: "string",
          description: "Explanation of the product relationship being highlighted"
        }
      },
      required: ["productId"]
    }
  },
  {
    name: "highlightConfidenceLevel",
    description: "Highlight predictions with specific confidence levels in the matrix",
    parameters: {
      type: "object",
      properties: {
        confidenceThreshold: {
          type: "number",
          description: "Minimum confidence level to highlight (0.0-1.0)"
        },
        segment: {
          type: "string",
          description: "Customer segment to focus on (optional)"
        },
        explanation: {
          type: "string",
          description: "Explanation of why this confidence level is significant"
        }
      },
      required: ["confidenceThreshold"]
    }
  },
  {
    name: "filterByTimeWindow",
    description: "Filter predictions by time window for next purchase",
    parameters: {
      type: "object",
      properties: {
        timeframe: {
          type: "string",
          enum: ["7days", "30days", "90days"],
          description: "Time window for predictions"
        },
        onlyHighConfidence: {
          type: "boolean",
          description: "Only show high confidence predictions"
        }
      },
      required: ["timeframe"]
    }
  },
  {
    name: "filterByCustomerSegment",
    description: "Filter the dashboard to show predictions for specific customer segments",
    parameters: {
      type: "object",
      properties: {
        segments: {
          type: "array",
          items: { type: "string" },
          description: "Customer segments to include (e.g., ['High Value', 'Medium Value'])"
        },
        includeNewCustomers: {
          type: "boolean",
          description: "Whether to include new customers without purchase history"
        }
      },
      required: ["segments"]
    }
  },
  {
    name: "filterByProductCategory",
    description: "Filter predictions to focus on specific product categories",
    parameters: {
      type: "object",
      properties: {
        categories: {
          type: "array",
          items: { type: "string" },
          description: "Product categories to focus on (e.g., ['M', 'R'])"
        },
        showAssociations: {
          type: "boolean",
          description: "Whether to show product associations for these categories"
        }
      },
      required: ["categories"]
    }
  },
  {
    name: "compareSegmentPredictions",
    description: "Compare prediction patterns between different customer segments",
    parameters: {
      type: "object",
      properties: {
        primarySegment: {
          type: "string",
          description: "Primary customer segment for comparison"
        },
        compareSegments: {
          type: "array",
          items: { type: "string" },
          description: "Additional segments to compare against"
        },
        comparisonMetric: {
          type: "string",
          enum: ["confidence", "timing", "product_preference"],
          description: "Metric to use for comparison"
        }
      },
      required: ["primarySegment", "compareSegments"]
    }
  },
  {
    name: "compareProductPerformance",
    description: "Compare prediction performance across different products",
    parameters: {
      type: "object",
      properties: {
        products: {
          type: "array",
          items: { type: "string" },
          description: "Products to compare (e.g., ['M-3003', 'R-4003'])"
        },
        metric: {
          type: "string",
          enum: ["prediction_count", "avg_confidence", "time_to_purchase"],
          description: "Comparison metric"
        },
        timeframe: {
          type: "string",
          enum: ["7days", "30days", "90days"],
          description: "Time window for comparison"
        }
      },
      required: ["products", "metric"]
    }
  },
  {
    name: "comparePredictionAccuracy",
    description: "Compare model accuracy across different time periods or segments",
    parameters: {
      type: "object",
      properties: {
        timeframePrimary: {
          type: "string",
          description: "Primary time period for comparison"
        },
        timeframeSecondary: {
          type: "string",
          description: "Secondary time period for comparison"
        },
        segmentBreakdown: {
          type: "boolean",
          description: "Whether to break down accuracy by customer segment"
        }
      },
      required: ["timeframePrimary", "timeframeSecondary"]
    }
  },
  {
    name: "explainPredictionFactors",
    description: "Explain the factors contributing to a specific prediction",
    parameters: {
      type: "object",
      properties: {
        customerId: {
          type: "number",
          description: "Customer ID to explain prediction for"
        },
        productId: {
          type: "string",
          description: "Product being predicted"
        },
        includeHistory: {
          type: "boolean",
          description: "Whether to include purchase history in explanation"
        }
      },
      required: ["customerId", "productId"]
    }
  },
  {
    name: "explainModelAccuracy",
    description: "Explain current model performance and accuracy metrics",
    parameters: {
      type: "object",
      properties: {
        includeFeatureImportance: {
          type: "boolean",
          description: "Whether to show feature importance in explanation"
        },
        compareToBaseline: {
          type: "boolean",
          description: "Whether to compare to baseline performance"
        },
        segmentBreakdown: {
          type: "boolean",
          description: "Whether to break down accuracy by segments"
        }
      },
      required: []
    }
  },
  {
    name: "explainProductAssociations",
    description: "Explain why certain products are frequently bought together",
    parameters: {
      type: "object",
      properties: {
        productA: {
          type: "string",
          description: "First product in the association"
        },
        productB: {
          type: "string",
          description: "Second product in the association"
        },
        includeCustomerExamples: {
          type: "boolean",
          description: "Whether to include specific customer examples"
        }
      },
      required: ["productA", "productB"]
    }
  },
  {
    name: "adjustConfidenceThreshold",
    description: "Adjust the confidence threshold for displaying predictions",
    parameters: {
      type: "object",
      properties: {
        threshold: {
          type: "number",
          description: "New confidence threshold (0.0-1.0)"
        },
        applyToAll: {
          type: "boolean",
          description: "Whether to apply to all visualizations"
        }
      },
      required: ["threshold"]
    }
  },
  {
    name: "resetDashboardView",
    description: "Reset the dashboard to default view with all data visible",
    parameters: {
      type: "object",
      properties: {
        includeFilters: {
          type: "boolean",
          description: "Whether to reset filters as well"
        }
      },
      required: []
    }
  }
]; 