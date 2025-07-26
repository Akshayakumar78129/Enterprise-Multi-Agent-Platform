import tokens from '../../design-system/tokens';

/**
 * Enterprise IQ Plotly Chart Theme
 * 
 * This file provides consistent Plotly.js theming across all Enterprise IQ applications
 * based on the design system tokens.
 */

const { colors, chartColors } = tokens;

/**
 * Default Plotly theme configuration for Enterprise IQ
 */
export const defaultTheme = {
  // Layout configuration
  layout: {
    paper_bgcolor: colors.graphite,
    plot_bgcolor: colors.graphite,
    font: {
      family: "'Inter', sans-serif",
      color: colors.cloudWhite,
      size: 12,
    },
    title: {
      font: {
        family: "'Inter', sans-serif",
        size: 18,
        color: colors.cloudWhite,
        weight: 600,
      },
      x: 0.5,
      xanchor: 'center',
    },
    margin: {
      l: 40,
      r: 20,
      t: 40,
      b: 30,
      pad: 0,
    },
    colorway: [
      colors.electricCyan,
      colors.signalMagenta,
      colors.lighterCyan,
      colors.mutedPurple,
      colors.amber,
      colors.teal,
      colors.mutedMagenta,
      colors.blueGray,
    ],
    xaxis: {
      gridcolor: chartColors.grid,
      zerolinecolor: chartColors.grid,
      linecolor: colors.midnightNavy,
      tickfont: {
        family: "'Inter', sans-serif",
        size: 11,
        color: colors.cloudWhite,
      },
      title: {
        font: {
          family: "'Inter', sans-serif",
          size: 13,
          color: colors.cloudWhite,
        },
        standoff: 10,
      },
    },
    yaxis: {
      gridcolor: chartColors.grid,
      zerolinecolor: chartColors.grid,
      linecolor: colors.midnightNavy,
      tickfont: {
        family: "'Inter', sans-serif",
        size: 11,
        color: colors.cloudWhite,
      },
      title: {
        font: {
          family: "'Inter', sans-serif",
          size: 13,
          color: colors.cloudWhite,
        },
        standoff: 10,
      },
    },
    legend: {
      font: {
        family: "'Inter', sans-serif",
        size: 11,
        color: colors.cloudWhite,
      },
      bgcolor: colors.graphite,
      bordercolor: colors.graphiteLight,
    },
    hoverlabel: {
      bgcolor: colors.graphiteLight,
      bordercolor: colors.electricCyan,
      font: {
        family: "'Inter', sans-serif",
        size: 12,
        color: colors.cloudWhite,
      },
    },
    modebar: {
      bgcolor: 'transparent',
      color: colors.cloudWhite,
      activecolor: colors.electricCyan,
    },
  },

  // Config defaults
  config: {
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d', 'toggleSpikelines'],
    toImageButtonOptions: {
      format: 'png',
      filename: 'enterprise_iq_chart',
      height: 500,
      width: 700,
      scale: 2,
    },
  },
};

/**
 * Specialized theme for time series charts
 */
export const timeSeriesTheme = {
  ...defaultTheme,
  layout: {
    ...defaultTheme.layout,
    xaxis: {
      ...defaultTheme.layout.xaxis,
      type: 'date',
      tickformat: '%b %d',
      hoverformat: '%b %d, %Y',
      rangeslider: {
        visible: false,
      },
    },
  },
};

/**
 * Specialized theme for heatmaps
 */
export const heatmapTheme = {
  ...defaultTheme,
  layout: {
    ...defaultTheme.layout,
    colorscale: chartColors.heatmapColdToHot,
  },
};

/**
 * Specialized theme for anomaly detection charts
 */
export const anomalyTheme = {
  ...defaultTheme,
  config: {
    ...defaultTheme.config,
    displayModeBar: true,
  },
  layout: {
    ...defaultTheme.layout,
    shapes: [], // Will be populated with anomaly regions
    annotations: [], // Will be populated with anomaly markers
  },
};

/**
 * Helper function to apply anomaly highlighting to charts
 */
export const applyAnomalyHighlighting = (layout, anomalies, options = {}) => {
  const anomalyLayout = { ...layout };
  
  if (!anomalyLayout.shapes) {
    anomalyLayout.shapes = [];
  }
  
  if (!anomalyLayout.annotations) {
    anomalyLayout.annotations = [];
  }
  
  // Add shapes for each anomaly region
  anomalies.forEach((anomaly, index) => {
    const { x0, x1, y0, y1, sentiment = 'bad' } = anomaly;
    
    // Different coloring based on anomaly sentiment
    const fillColor = sentiment === 'good' 
      ? `rgba(57, 255, 20, 0.2)` // Good anomaly - green
      : `rgba(255, 31, 79, 0.2)`; // Bad anomaly - red
      
    const lineColor = sentiment === 'good' 
      ? colors.success 
      : colors.error;
    
    // Add a semi-transparent region for the anomaly
    anomalyLayout.shapes.push({
      type: 'rect',
      x0,
      x1,
      y0: y0 || 0,
      y1: y1 || 1,
      yref: y0 && y1 ? 'y' : 'paper',
      fillcolor: fillColor,
      line: {
        color: lineColor,
        width: 1,
        dash: 'dot',
      },
      layer: 'below',
    });
    
    // Add annotation if specified
    if (anomaly.text) {
      anomalyLayout.annotations.push({
        x: (x0 + x1) / 2,
        y: y1 || 1,
        yref: y0 && y1 ? 'y' : 'paper',
        text: anomaly.text,
        showarrow: true,
        arrowhead: 4,
        arrowcolor: lineColor,
        arrowsize: 1,
        arrowwidth: 2,
        ax: 0,
        ay: -40,
        bgcolor: colors.graphiteLight,
        bordercolor: lineColor,
        borderwidth: 1,
        borderpad: 4,
        font: {
          family: "'Inter', sans-serif",
          size: 10,
          color: colors.cloudWhite,
        },
      });
    }
  });
  
  return anomalyLayout;
};

/**
 * Helper function to create a custom marker for highlighting data points
 */
export const createCustomMarker = (type = 'default') => {
  switch (type) {
    case 'anomaly':
      return {
        size: 10,
        color: colors.signalMagenta,
        line: {
          color: colors.cloudWhite,
          width: 1,
        },
      };
    case 'highlight':
      return {
        size: 10,
        color: colors.electricCyan,
        line: {
          color: colors.cloudWhite,
          width: 1,
        },
      };
    case 'selected':
      return {
        size: 12,
        color: colors.success,
        line: {
          color: colors.cloudWhite,
          width: 2,
        },
      };
    default:
      return {
        size: 6,
        color: colors.electricCyan,
        line: {
          color: colors.graphite,
          width: 1,
        },
      };
  }
};

/**
 * Utility functions for Plotly charts
 */
export const plotlyUtils = {
  // Apply a consistent colors to a series
  applySeriesColors: (dataPoints, colorIndex = 0) => {
    const { colorway } = defaultTheme.layout;
    const color = colorway[colorIndex % colorway.length];
    
    return dataPoints.map(point => ({
      ...point,
      marker: {
        ...point.marker,
        color,
      },
      line: {
        ...point.line,
        color,
      },
    }));
  },
  
  // Create a consistent Plotly line config
  createLineConfig: (color = colors.electricCyan, isDashed = false) => {
    return {
      color,
      width: 2,
      dash: isDashed ? 'dash' : 'solid',
    };
  },
  
  // Create a gradient for bar charts
  createBarGradient: (baseColor = colors.electricCyan) => {
    return [baseColor, `${baseColor}80`]; // 50% transparent version
  },
};

export default {
  defaultTheme,
  timeSeriesTheme,
  heatmapTheme,
  anomalyTheme,
  applyAnomalyHighlighting,
  createCustomMarker,
  plotlyUtils,
}; 