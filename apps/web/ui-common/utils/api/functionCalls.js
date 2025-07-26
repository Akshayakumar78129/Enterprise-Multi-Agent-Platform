/**
 * Enterprise IQ Function Calling Declarations
 * 
 * This file defines function declarations that can be registered with the Gemini client
 * to allow the LLM to control UI components, manipulate charts, and interact with data.
 */

/**
 * Chart Manipulation Functions
 */
export const chartFunctions = {
  /**
   * Change the date range for a chart
   */
  setDateRange: {
    declaration: {
      name: "setDateRange",
      description: "Change the date range for data visualization",
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
          comparison: {
            type: "string",
            enum: ["previous_period", "previous_year", "custom", "none"],
            description: "Type of comparison to show"
          },
          chartId: {
            type: "string",
            description: "ID of the chart to update (optional, updates all if not provided)"
          }
        },
        required: ["startDate", "endDate"]
      }
    },
    
    // Example implementation - would need to be customized for actual components
    implementation: async (args) => {
      console.log(`Setting date range: ${args.startDate} to ${args.endDate}`);
      // In a real implementation, this would update the chart state
      // Example: await chartStore.updateDateRange(args);
      return {
        success: true,
        updatedRange: {
          startDate: args.startDate,
          endDate: args.endDate,
          comparison: args.comparison || "none"
        }
      };
    }
  },
  
  /**
   * Change chart type (e.g., bar, line, scatter)
   */
  changeChartType: {
    declaration: {
      name: "changeChartType",
      description: "Change the visualization type for a chart",
      parameters: {
        type: "object",
        properties: {
          chartId: {
            type: "string",
            description: "ID of the chart to update"
          },
          chartType: {
            type: "string",
            enum: ["line", "bar", "scatter", "pie", "area", "heatmap"],
            description: "Type of chart to display"
          },
          animated: {
            type: "boolean",
            description: "Whether to animate the transition"
          }
        },
        required: ["chartId", "chartType"]
      }
    },
    
    implementation: async (args) => {
      console.log(`Changing chart type to ${args.chartType} for chart ${args.chartId}`);
      // Example: await chartStore.updateChartType(args.chartId, args.chartType, args.animated);
      return {
        success: true,
        chartId: args.chartId,
        newType: args.chartType
      };
    }
  },
  
  /**
   * Highlight specific data points on a chart
   */
  highlightDataPoints: {
    declaration: {
      name: "highlightDataPoints",
      description: "Highlight specific data points on a chart",
      parameters: {
        type: "object",
        properties: {
          chartId: {
            type: "string",
            description: "ID of the chart"
          },
          pointIndices: {
            type: "array",
            items: {
              type: "integer"
            },
            description: "Array of indices to highlight"
          },
          highlightColor: {
            type: "string",
            description: "Color to use for highlighting (optional)"
          },
          message: {
            type: "string",
            description: "Explanation message to show about highlighted points"
          }
        },
        required: ["chartId", "pointIndices"]
      }
    },
    
    implementation: async (args) => {
      console.log(`Highlighting points ${args.pointIndices.join(', ')} on chart ${args.chartId}`);
      // Example: await chartStore.highlightPoints(args.chartId, args.pointIndices, args.highlightColor);
      return {
        success: true,
        highlightedPoints: args.pointIndices,
        message: args.message || "Points highlighted"
      };
    }
  },
  
  /**
   * Add annotation to chart
   */
  addChartAnnotation: {
    declaration: {
      name: "addChartAnnotation",
      description: "Add an annotation to a specific point or region on a chart",
      parameters: {
        type: "object",
        properties: {
          chartId: {
            type: "string",
            description: "ID of the chart"
          },
          text: {
            type: "string",
            description: "Annotation text"
          },
          x: {
            type: "string",
            description: "X position (date or category)"
          },
          y: {
            type: "number",
            description: "Y position (value)"
          },
          arrowDirection: {
            type: "string",
            enum: ["up", "down", "left", "right", "none"],
            description: "Direction of annotation arrow"
          }
        },
        required: ["chartId", "text", "x"]
      }
    },
    
    implementation: async (args) => {
      console.log(`Adding annotation "${args.text}" to chart ${args.chartId} at x=${args.x}, y=${args.y}`);
      // Example: await chartStore.addAnnotation(args.chartId, { text: args.text, x: args.x, y: args.y });
      return {
        success: true,
        annotationId: `anno-${Date.now()}`,
        chartId: args.chartId
      };
    }
  }
};

/**
 * AI Character Control Functions
 */
export const aiCharacterFunctions = {
  /**
   * Move the robot character to a specific position
   */
  moveRobotCharacter: {
    declaration: {
      name: "moveRobotCharacter",
      description: "Move the robot character to a specific position on screen",
      parameters: {
        type: "object",
        properties: {
          x: {
            type: "number",
            description: "X coordinate (pixels from left)"
          },
          y: {
            type: "number",
            description: "Y coordinate (pixels from top)"
          },
          animated: {
            type: "boolean",
            description: "Whether to animate the movement"
          }
        },
        required: ["x", "y"]
      }
    },
    
    implementation: async (args) => {
      console.log(`Moving robot to x=${args.x}, y=${args.y}`);
      // Example: robotCharacterRef.current.moveTo(args.x, args.y, args.animated);
      return {
        success: true,
        newPosition: { x: args.x, y: args.y }
      };
    }
  },
  
  /**
   * Make the robot character point at a specific element
   */
  pointAtElement: {
    declaration: {
      name: "pointAtElement",
      description: "Make the robot character point at a specific element with laser",
      parameters: {
        type: "object",
        properties: {
          elementId: {
            type: "string",
            description: "ID of element to point at"
          },
          duration: {
            type: "number",
            description: "Duration to point in milliseconds"
          },
          laserColor: {
            type: "string",
            enum: ["red", "green"],
            description: "Color of the laser pointer"
          },
          message: {
            type: "string",
            description: "Message to display while pointing"
          }
        },
        required: ["elementId"]
      }
    },
    
    implementation: async (args) => {
      console.log(`Pointing at element ${args.elementId} with ${args.laserColor || 'red'} laser`);
      // Example: robotCharacterRef.current.pointAt(args.elementId, args.duration, args.message);
      return {
        success: true,
        pointing: true,
        elementId: args.elementId,
        message: args.message
      };
    }
  },
  
  /**
   * Make the robot character say something
   */
  robotSay: {
    declaration: {
      name: "robotSay",
      description: "Make the robot character display a speech bubble with text",
      parameters: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "Message to display in speech bubble"
          },
          duration: {
            type: "number",
            description: "Duration to show message in milliseconds (0 for until dismissed)"
          },
          isThinking: {
            type: "boolean",
            description: "Whether to show as a thought bubble instead of speech"
          }
        },
        required: ["message"]
      }
    },
    
    implementation: async (args) => {
      console.log(`Robot ${args.isThinking ? 'thinking' : 'saying'}: "${args.message}"`);
      // Example: robotCharacterRef.current.say(args.message, args.duration, args.isThinking);
      return {
        success: true,
        message: args.message,
        isThinking: args.isThinking || false
      };
    }
  }
};

/**
 * Data Analysis Functions
 */
export const dataAnalysisFunctions = {
  /**
   * Generate insights from chart data
   */
  generateInsights: {
    declaration: {
      name: "generateInsights",
      description: "Generate insights about the data in a visualization",
      parameters: {
        type: "object",
        properties: {
          chartId: {
            type: "string",
            description: "ID of the chart to analyze"
          },
          insightTypes: {
            type: "array",
            items: {
              type: "string",
              enum: ["trends", "anomalies", "patterns", "comparisons", "distributions"]
            },
            description: "Types of insights to generate"
          },
          maxInsights: {
            type: "integer",
            description: "Maximum number of insights to generate"
          }
        },
        required: ["chartId"]
      }
    },
    
    implementation: async (args) => {
      console.log(`Generating insights for chart ${args.chartId}`);
      // In a real implementation, this would analyze chart data
      // Example: const insights = await insightEngine.analyzeChart(args.chartId, args.insightTypes);
      
      // Mock insights for example
      const mockInsights = [
        { type: "trend", text: "Upward trend detected over the last quarter with 15% growth" },
        { type: "anomaly", text: "Unusual spike on April 15th deviates 45% from expected pattern" },
        { type: "pattern", text: "Recurring weekly pattern shows higher activity on Wednesdays" }
      ];
      
      return {
        success: true,
        insights: mockInsights.slice(0, args.maxInsights || 3)
      };
    }
  },
  
  /**
   * Filter dashboard by dimension
   */
  filterByDimension: {
    declaration: {
      name: "filterByDimension",
      description: "Filter the current view by a specific dimension",
      parameters: {
        type: "object",
        properties: {
          dimension: {
            type: "string",
            description: "Dimension to filter by (e.g. 'product', 'region', 'customer')"
          },
          value: {
            type: "string",
            description: "Value to filter for"
          },
          operation: {
            type: "string",
            enum: ["equals", "contains", "greater_than", "less_than", "between"],
            description: "Filter operation"
          },
          secondValue: {
            type: "string",
            description: "Second value for 'between' operation"
          }
        },
        required: ["dimension", "value", "operation"]
      }
    },
    
    implementation: async (args) => {
      console.log(`Filtering by ${args.dimension} ${args.operation} ${args.value}`);
      // Example: await dashboardStore.applyFilter(args.dimension, args.value, args.operation);
      return {
        success: true,
        appliedFilter: {
          dimension: args.dimension,
          value: args.value,
          operation: args.operation
        }
      };
    }
  }
};

// Bundle all function declarations for easy registration
export const allFunctionDeclarations = {
  ...chartFunctions,
  ...aiCharacterFunctions,
  ...dataAnalysisFunctions
};

export default {
  chartFunctions,
  aiCharacterFunctions, 
  dataAnalysisFunctions,
  allFunctionDeclarations
}; 