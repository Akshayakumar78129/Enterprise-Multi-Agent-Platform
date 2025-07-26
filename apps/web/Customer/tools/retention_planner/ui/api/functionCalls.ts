export const retentionPlannerFunctions = [
  {
    name: "highlightHighRiskCustomers",
    description: "Highlight customers with high churn risk on the value-risk matrix",
    parameters: {
      type: "object",
      properties: {
        riskThreshold: {
          type: "number",
          description: "Risk threshold above which customers are considered high risk (0.0-1.0)",
          minimum: 0,
          maximum: 1
        },
        explanation: {
          type: "string",
          description: "Explanation of why these customers are highlighted"
        }
      },
      required: ["riskThreshold"]
    }
  },
  {
    name: "filterByCustomerSegment",
    description: "Filter the retention analysis by specific customer loyalty segments",
    parameters: {
      type: "object",
      properties: {
        segments: {
          type: "array",
          items: {
            type: "string",
            enum: ["Active", "Active, Loyal", "Active, New", "Inactive", "Lost", "Prospect"]
          },
          description: "List of customer segments to focus on"
        },
        explanation: {
          type: "string",
          description: "Reason for filtering to these segments"
        }
      },
      required: ["segments"]
    }
  },
  {
    name: "analyzeQuadrantStrategy",
    description: "Focus analysis on a specific value-risk quadrant and show recommended strategies",
    parameters: {
      type: "object",
      properties: {
        quadrant: {
          type: "string",
          enum: ["Nurture", "Rescue", "Monitor", "Evaluate"],
          description: "The value-risk quadrant to analyze"
        },
        explanation: {
          type: "string",
          description: "Explanation of why this quadrant is being analyzed"
        }
      },
      required: ["quadrant"]
    }
  },
  {
    name: "compareRetentionActions",
    description: "Compare the effectiveness and ROI of different retention actions",
    parameters: {
      type: "object",
      properties: {
        actions: {
          type: "array",
          items: {
            type: "string",
            enum: ["Premium package", "Loyalty upgrade", "Standard package", "Targeted discount", "Basic offer", "Standard comm", "No action needed"]
          },
          description: "List of retention actions to compare"
        },
        metric: {
          type: "string",
          enum: ["effectiveness", "roi", "cost", "benefit", "customer_count"],
          description: "The metric to use for comparison"
        },
        explanation: {
          type: "string",
          description: "Explanation of what is being compared and why"
        }
      },
      required: ["actions", "metric"]
    }
  },
  {
    name: "adjustRiskThreshold",
    description: "Adjust the churn risk threshold and show how it affects customer classifications",
    parameters: {
      type: "object",
      properties: {
        threshold: {
          type: "number",
          description: "New risk threshold value (0.0-1.0)",
          minimum: 0,
          maximum: 1
        },
        explanation: {
          type: "string",
          description: "Explanation of why this threshold is being set"
        }
      },
      required: ["threshold"]
    }
  },
  {
    name: "explainSegmentPlaybook",
    description: "Show detailed retention playbook for a specific customer segment",
    parameters: {
      type: "object",
      properties: {
        segment: {
          type: "string",
          enum: ["Active", "Active, Loyal", "Active, New", "Inactive", "Lost", "Prospect"],
          description: "Customer segment to explain"
        },
        churnCause: {
          type: "string",
          enum: ["Inactive", "At Risk", "Engaged"],
          description: "Specific churn cause within the segment to focus on"
        },
        explanation: {
          type: "string",
          description: "Context for why this playbook is being explained"
        }
      },
      required: ["segment"]
    }
  },
  {
    name: "highlightActionEffectiveness",
    description: "Highlight retention actions by their effectiveness rates",
    parameters: {
      type: "object",
      properties: {
        minEffectiveness: {
          type: "number",
          description: "Minimum effectiveness threshold (0.0-1.0)",
          minimum: 0,
          maximum: 1
        },
        sortBy: {
          type: "string",
          enum: ["effectiveness", "customer_count", "total_benefit"],
          description: "How to sort the highlighted actions"
        },
        explanation: {
          type: "string",
          description: "Explanation of the effectiveness analysis"
        }
      },
      required: ["minEffectiveness"]
    }
  },
  {
    name: "analyzeROIImpact",
    description: "Analyze the financial impact and ROI of the retention strategy",
    parameters: {
      type: "object",
      properties: {
        viewMode: {
          type: "string",
          enum: ["cumulative", "individual"],
          description: "Whether to show cumulative waterfall or individual action ROI"
        },
        focusAction: {
          type: "string",
          description: "Specific action to focus the ROI analysis on"
        },
        explanation: {
          type: "string",
          description: "Context for the ROI analysis"
        }
      },
      required: ["viewMode"]
    }
  },
  {
    name: "identifyHighValueAtRisk",
    description: "Identify and highlight high-value customers who are at risk of churning",
    parameters: {
      type: "object",
      properties: {
        valueThreshold: {
          type: "string",
          enum: ["High", "Medium", "Low"],
          description: "Minimum customer value to consider"
        },
        riskThreshold: {
          type: "number",
          description: "Minimum risk level to consider (0.0-1.0)",
          minimum: 0,
          maximum: 1
        },
        explanation: {
          type: "string",
          description: "Explanation of why these customers are being identified"
        }
      },
      required: ["valueThreshold", "riskThreshold"]
    }
  },
  {
    name: "resetRetentionView",
    description: "Reset all filters and highlights to show the complete retention analysis",
    parameters: {
      type: "object",
      properties: {
        explanation: {
          type: "string",
          description: "Explanation of why the view is being reset"
        }
      }
    }
  },
  {
    name: "calculateSegmentROI",
    description: "Calculate and show ROI projections for specific customer segments",
    parameters: {
      type: "object",
      properties: {
        segments: {
          type: "array",
          items: {
            type: "string",
            enum: ["Active", "Active, Loyal", "Active, New", "Inactive", "Lost", "Prospect"]
          },
          description: "Segments to calculate ROI for"
        },
        timeframe: {
          type: "string",
          enum: ["monthly", "quarterly", "yearly"],
          description: "Timeframe for ROI calculation"
        },
        explanation: {
          type: "string",
          description: "Context for the ROI calculation"
        }
      },
      required: ["segments"]
    }
  },
  {
    name: "showActionBreakdown",
    description: "Show detailed breakdown of how customers flow from segments to retention actions",
    parameters: {
      type: "object",
      properties: {
        focusSegment: {
          type: "string",
          enum: ["High", "Medium", "Low"],
          description: "Customer value segment to focus on"
        },
        explanation: {
          type: "string",
          description: "Explanation of what breakdown is being shown"
        }
      }
    }
  }
]; 