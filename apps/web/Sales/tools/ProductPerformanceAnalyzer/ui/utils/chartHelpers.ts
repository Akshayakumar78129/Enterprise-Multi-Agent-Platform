import { useTheme } from '../../../../../ui-common/design-system/theme';
import { Product, ChartPoint } from '../types';

/**
 * Utility functions for chart configuration in the Product Performance Analyzer
 */

/**
 * Generate the plotly color scale based on the theme
 */
export const generateColorScale = (theme: any) => {
  return [
    [0, theme.colors.electricCyan],
    [0.5, '#43cad0'],
    [1, theme.colors.signalMagenta]
  ];
};

/**
 * Generate plotly.js layout config with Enterprise IQ theming
 */
export const generateChartLayout = (theme: any, options = {}) => {
  return {
    paper_bgcolor: theme.colors.graphite,
    plot_bgcolor: theme.colors.graphite,
    font: {
      family: theme.typography.fontFamily,
      color: theme.colors.cloudWhite,
    },
    margin: { t: 10, r: 10, b: 40, l: 50 },
    xaxis: {
      gridcolor: `${theme.colors.midnight}80`,
      zerolinecolor: theme.colors.cloudWhite,
    },
    yaxis: {
      gridcolor: `${theme.colors.midnight}80`,
      zerolinecolor: theme.colors.cloudWhite,
    },
    colorway: [
      theme.colors.electricCyan,
      theme.colors.signalMagenta,
      '#5fd4d6', // Lighter cyan
      '#aa45dd', // Muted purple
      '#43cad0', // Teal
    ],
    legend: {
      bgcolor: theme.colors.midnight,
      font: {
        color: theme.colors.cloudWhite,
      },
    },
    ...options,
  };
};

/**
 * Convert product data to format suitable for sales bar chart
 */
export const prepareSalesBarChartData = (
  data: Product[],
  sortBy: 'sales_amount' | 'quantity' | 'margin_pct' = 'sales_amount',
  limit: number = 10
) => {
  const sortedData = [...data].sort((a, b) => b[sortBy] - a[sortBy]).slice(0, limit);
  
  return {
    type: 'bar',
    x: sortedData.map(p => p[sortBy]),
    y: sortedData.map(p => p.product_name),
    orientation: 'h',
    text: sortedData.map(p => p[sortBy].toFixed(2)),
    textposition: 'auto',
    hoverinfo: 'x+y+text',
    marker: {
      color: sortedData.map(p => p[sortBy]),
      colorscale: 'Viridis',
    },
  };
};

/**
 * Convert product data to format suitable for margin scatter plot
 */
export const prepareMarginScatterData = (data: Product[]) => {
  return {
    type: 'scatter',
    x: data.map(p => p.sales_amount),
    y: data.map(p => p.margin_pct || 0),
    mode: 'markers',
    marker: {
      size: data.map(p => Math.min(Math.max(p.quantity / 100, 6), 16)),
      color: data.map(p => p.margin_pct || 0),
      colorscale: 'Viridis',
    },
    text: data.map(p => p.product_name),
    hoverinfo: 'text+x+y',
  };
};

/**
 * Prepare data for price band donut chart
 */
export const preparePriceBandData = (distribution: Record<string, { count: number }>) => {
  const bands = Object.keys(distribution);
  const counts = bands.map(band => distribution[band].count);
  
  return {
    type: 'pie',
    hole: 0.6,
    values: counts,
    labels: bands,
    textinfo: 'percent',
    textposition: 'outside',
    automargin: true,
  };
};

/**
 * Prepare data for category comparison radar chart
 */
export const prepareCategoryRadarData = (
  categories: string[],
  metrics: string[],
  data: Record<string, Record<string, number>>
) => {
  return categories.map(category => {
    return {
      type: 'scatterpolar',
      r: metrics.map(metric => data[category][metric] || 0),
      theta: metrics,
      fill: 'toself',
      name: category,
    };
  });
};

/**
 * Prepare data for growth matrix
 */
export const prepareGrowthMatrixData = (data: Product[], marginThreshold: number, growthThreshold: number) => {
  // In a real implementation, we would calculate growth rate based on historical data
  // For this example, we'll simulate it with random values
  const simulatedData = data.map(p => ({
    ...p,
    growth_rate: Math.random() * 40 - 10, // -10% to +30%
  }));
  
  // Segment products into quadrants
  const quadrants = {
    stars: simulatedData.filter(p => (p.margin_pct || 0) >= marginThreshold && p.growth_rate >= growthThreshold),
    questionMarks: simulatedData.filter(p => (p.margin_pct || 0) < marginThreshold && p.growth_rate >= growthThreshold),
    cashCows: simulatedData.filter(p => (p.margin_pct || 0) >= marginThreshold && p.growth_rate < growthThreshold),
    dogs: simulatedData.filter(p => (p.margin_pct || 0) < marginThreshold && p.growth_rate < growthThreshold),
  };
  
  // Generate scatter plot data for each quadrant
  return Object.entries(quadrants).map(([quadrant, products]) => {
    return {
      type: 'scatter',
      x: products.map(p => p.margin_pct || 0),
      y: products.map(p => p.growth_rate),
      mode: 'markers',
      name: quadrant,
      marker: {
        size: products.map(p => Math.min(Math.max(p.sales_amount / 1000, 8), 20)),
      },
      text: products.map(p => p.product_name),
      hoverinfo: 'text+x+y',
    };
  });
}; 