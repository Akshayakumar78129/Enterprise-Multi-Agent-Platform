export const engagementClassifierFunctions = [
  {
    name: "highlightEngagementLevel",
    description: "Highlight customers in a specific engagement level (High, Medium, or Low) in the pyramid visualization",
    parameters: {
      type: "object",
      properties: {
        engagementLevel: {
          type: "string",
          enum: ["High", "Medium", "Low"],
          description: "The engagement level to highlight"
        },
        explanation: {
          type: "string",
          description: "Explanation of why this engagement level is being highlighted"
        }
      },
      required: ["engagementLevel"]
    }
  },
  {
    name: "filterByEngagementLevel",
    description: "Filter the dashboard to show only customers with specific engagement levels",
    parameters: {
      type: "object",
      properties: {
        engagementLevels: {
          type: "array",
          items: {
            type: "string",
            enum: ["High", "Medium", "Low"]
          },
          description: "Array of engagement levels to filter by"
        }
      },
      required: ["engagementLevels"]
    }
  },
  {
    name: "analyzeReengagementOpportunities",
    description: "Identify and highlight re-engagement opportunities based on customer value and inactivity thresholds",
    parameters: {
      type: "object",
      properties: {
        valueThreshold: {
          type: "number",
          description: "Minimum customer lifetime value to consider (in dollars)",
          minimum: 1000,
          maximum: 50000
        },
        daysInactiveThreshold: {
          type: "number",
          description: "Maximum days since last activity to be considered for re-engagement",
          minimum: 30,
          maximum: 365
        },
        opportunityType: {
          type: "string",
          enum: ["High Value Winback", "Medium Value Nurture", "Frequent Buyer Reactivation", "Loyal Customer Recovery", "Standard Reengagement"],
          description: "Specific type of re-engagement opportunity to focus on"
        }
      },
      required: ["valueThreshold", "daysInactiveThreshold"]
    }
  },
  {
    name: "compareEngagementPeriods",
    description: "Compare engagement metrics between different time periods to identify trends",
    parameters: {
      type: "object",
      properties: {
        currentPeriod: {
          type: "string",
          enum: ["This Week", "This Month", "Last 3 Months", "Last 6 Months", "Last Year"],
          description: "Current time period to analyze"
        },
        comparisonPeriod: {
          type: "string",
          enum: ["This Week", "This Month", "Last 3 Months", "Last 6 Months", "Last Year"],
          description: "Previous time period to compare against"
        }
      },
      required: ["currentPeriod", "comparisonPeriod"]
    }
  },
  {
    name: "explainEngagementMetrics",
    description: "Provide detailed explanations of engagement metrics and their business implications",
    parameters: {
      type: "object",
      properties: {
        metric: {
          type: "string",
          enum: ["avg_engagement_score", "avg_days_since_activity", "engagement_trend", "reengagement_opportunities", "total_customers"],
          description: "The specific engagement metric to explain"
        },
        engagementLevel: {
          type: "string",
          enum: ["High", "Medium", "Low"],
          description: "Optional engagement level to focus the explanation on"
        }
      },
      required: ["metric"]
    }
  },
  {
    name: "generateCampaignRecommendations",
    description: "Generate targeted marketing campaign recommendations based on engagement analysis",
    parameters: {
      type: "object",
      properties: {
        targetSegment: {
          type: "string",
          enum: ["High", "Medium", "Low"],
          description: "Engagement level to target with the campaign"
        },
        campaignObjective: {
          type: "string",
          enum: ["retention", "reactivation", "upsell", "winback", "loyalty"],
          description: "Primary objective of the marketing campaign"
        },
        budgetRange: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Available budget range for the campaign"
        }
      },
      required: ["targetSegment", "campaignObjective"]
    }
  },
  {
    name: "analyzeRFMComponents",
    description: "Break down and analyze the Recency, Frequency, and Monetary components of customer engagement",
    parameters: {
      type: "object",
      properties: {
        component: {
          type: "string",
          enum: ["Recency", "Frequency", "Monetary", "All"],
          description: "RFM component to focus analysis on"
        },
        engagementLevel: {
          type: "string",
          enum: ["High", "Medium", "Low"],
          description: "Optional engagement level to filter the RFM analysis"
        }
      },
      required: ["component"]
    }
  },
  {
    name: "identifyEngagementTrends",
    description: "Identify and highlight trends in customer engagement over time",
    parameters: {
      type: "object",
      properties: {
        trendType: {
          type: "string",
          enum: ["improving", "declining", "stable", "seasonal"],
          description: "Type of engagement trend to identify"
        },
        timeframe: {
          type: "string",
          enum: ["weekly", "monthly", "quarterly", "yearly"],
          description: "Timeframe for trend analysis"
        }
      },
      required: ["trendType"]
    }
  },
  {
    name: "benchmarkEngagementPerformance",
    description: "Compare current engagement performance against historical benchmarks or industry standards",
    parameters: {
      type: "object",
      properties: {
        benchmarkType: {
          type: "string",
          enum: ["historical", "industry", "target"],
          description: "Type of benchmark to compare against"
        },
        metric: {
          type: "string",
          enum: ["engagement_score", "retention_rate", "reactivation_rate", "customer_lifetime_value"],
          description: "Specific metric to benchmark"
        }
      },
      required: ["benchmarkType", "metric"]
    }
  },
  {
    name: "segmentCustomersByEngagement",
    description: "Create custom customer segments based on engagement behavior patterns",
    parameters: {
      type: "object",
      properties: {
        segmentationCriteria: {
          type: "array",
          items: {
            type: "string",
            enum: ["rfm_score", "days_since_activity", "purchase_frequency", "loyalty_status", "customer_value"]
          },
          description: "Criteria to use for customer segmentation"
        },
        segmentCount: {
          type: "number",
          description: "Number of segments to create",
          minimum: 2,
          maximum: 10
        }
      },
      required: ["segmentationCriteria"]
    }
  }
]; 