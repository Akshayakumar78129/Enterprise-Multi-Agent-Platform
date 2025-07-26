import { FunctionDeclaration } from '../../../../../ui-common/utils/api/types';

/**
 * Function declarations for Product Performance Analyzer tool
 * Note: Implementation will be added in a later phase
 */
export const productPerformanceFunctions: FunctionDeclaration[] = [
  {
    name: "analyzeProductSales",
    description: "Analyzes sales performance for products and highlights key insights",
    parameters: {
      type: "object",
      properties: {
        chartId: {
          type: "string",
          description: "ID of the chart to analyze"
        },
        productId: {
          type: "string",
          description: "ID of the specific product to analyze (optional)"
        },
        categoryId: {
          type: "string",
          description: "ID of the specific category to analyze (optional)"
        },
        timeframe: {
          type: "string",
          enum: ["week", "month", "quarter", "year"],
          description: "Timeframe for the analysis"
        },
        highlightThreshold: {
          type: "number",
          description: "Threshold for highlighting significant metrics"
        }
      },
      required: ["chartId", "timeframe"]
    }
  },
  {
    name: "explainMarginPerformance",
    description: "Explains margin performance for selected products and provides recommendations",
    parameters: {
      type: "object",
      properties: {
        chartId: {
          type: "string",
          description: "ID of the margin chart"
        },
        quadrant: {
          type: "string",
          enum: ["high-sales-high-margin", "high-sales-low-margin", "low-sales-high-margin", "low-sales-low-margin"],
          description: "Quadrant of the chart to analyze"
        },
        dataPoints: {
          type: "array",
          items: {
            type: "object",
            properties: {
              productId: { type: "string" },
              x: { type: "number" },
              y: { type: "number" }
            }
          },
          description: "Data points to analyze"
        },
        targetMargin: {
          type: "number",
          description: "Target margin percentage for recommendations"
        }
      },
      required: ["chartId"]
    }
  },
  {
    name: "optimizePriceBands",
    description: "Provides price optimization recommendations for products in different price bands",
    parameters: {
      type: "object",
      properties: {
        chartId: {
          type: "string",
          description: "ID of the price band chart"
        },
        selectedBand: {
          type: "string",
          description: "Price band to optimize (e.g., '$0-10', '$10-20')"
        },
        optimizationGoal: {
          type: "string",
          enum: ["maximize_revenue", "maximize_margin", "increase_volume", "balance"],
          description: "Goal for price optimization"
        },
        competitivePosition: {
          type: "string",
          enum: ["premium", "competitive", "budget"],
          description: "Target competitive positioning"
        }
      },
      required: ["chartId", "optimizationGoal"]
    }
  },
  {
    name: "compareProductCategories",
    description: "Compares performance across product categories and highlights differences",
    parameters: {
      type: "object",
      properties: {
        chartId: {
          type: "string",
          description: "ID of the category comparison chart"
        },
        categories: {
          type: "array",
          items: { type: "string" },
          description: "Categories to compare"
        },
        metrics: {
          type: "array",
          items: { 
            type: "string",
            enum: ["sales", "units", "margin", "average_price", "growth"]
          },
          description: "Metrics to include in the comparison"
        },
        highlightDifferences: {
          type: "boolean",
          description: "Whether to highlight significant differences"
        }
      },
      required: ["chartId", "categories"]
    }
  },
  {
    name: "identifyGrowthOpportunities",
    description: "Identifies growth opportunities based on product performance data",
    parameters: {
      type: "object",
      properties: {
        chartId: {
          type: "string",
          description: "ID of the growth matrix chart"
        },
        focusArea: {
          type: "string",
          enum: ["stars", "question_marks", "cash_cows", "dogs"],
          description: "Area of the growth matrix to focus on"
        },
        productCount: {
          type: "number",
          description: "Number of products to identify opportunities for"
        },
        minimumPotential: {
          type: "number",
          description: "Minimum sales potential as percentage increase"
        }
      },
      required: ["chartId"]
    }
  }
];

export default productPerformanceFunctions; 