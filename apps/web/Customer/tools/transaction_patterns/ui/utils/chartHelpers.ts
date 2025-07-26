import { useTheme } from '../../../../../ui-common/design-system/theme';

// Generate Plotly colorscale for heatmaps
export const generateHeatmapColorscale = (theme: any) => {
  return [
    [0, theme.colors.midnight],
    [1, theme.colors.electricCyan]
  ];
};

// Create a dual axis chart config
export const generateDualAxisConfig = (theme: any, { 
  barColor = theme.colors.electricCyan, 
  lineColor = theme.colors.signalMagenta 
} = {}) => {
  return {
    barMode: 'group',
    paper_bgcolor: theme.colors.graphite,
    plot_bgcolor: theme.colors.graphite,
    font: {
      family: theme.typography.fontFamily,
      color: theme.colors.cloudWhite
    },
    margin: { l: 60, r: 60, t: 40, b: 60 },
    legend: {
      orientation: 'h',
      y: -0.2
    },
    xaxis: {
      gridcolor: theme.colors.graphiteDark,
      zerolinecolor: theme.colors.graphiteDark
    },
    yaxis: {
      gridcolor: theme.colors.graphiteDark,
      zerolinecolor: theme.colors.graphiteDark,
      title: { standoff: 20 }
    },
    yaxis2: {
      gridcolor: theme.colors.graphiteDark,
      zerolinecolor: theme.colors.graphiteDark,
      overlaying: 'y',
      side: 'right',
      title: { standoff: 20 }
    },
    colorway: [barColor, lineColor]
  };
};

// Generate network graph layout options
export const generateNetworkGraphLayout = (theme: any) => {
  return {
    paper_bgcolor: theme.colors.graphite,
    plot_bgcolor: theme.colors.graphite,
    font: {
      family: theme.typography.fontFamily,
      color: theme.colors.cloudWhite
    },
    showlegend: false,
    margin: { l: 20, r: 20, t: 40, b: 20 },
    hovermode: 'closest',
    xaxis: {
      showgrid: false,
      zeroline: false,
      showticklabels: false
    },
    yaxis: {
      showgrid: false,
      zeroline: false,
      showticklabels: false
    }
  };
};

// Generate anomaly scatter plot layout
export const generateAnomalyScatterLayout = (theme: any) => {
  return {
    paper_bgcolor: theme.colors.graphite,
    plot_bgcolor: theme.colors.graphite,
    font: {
      family: theme.typography.fontFamily,
      color: theme.colors.cloudWhite
    },
    margin: { l: 50, r: 20, t: 40, b: 60 },
    hovermode: 'closest',
    xaxis: {
      title: 'Hour of Day',
      gridcolor: theme.colors.graphiteDark,
      tickvals: Array.from({ length: 25 }, (_, i) => i)
    },
    yaxis: {
      title: 'Transaction Value',
      gridcolor: theme.colors.graphiteDark
    },
    showlegend: true,
    legend: {
      x: 0,
      y: 1.1,
      orientation: 'h'
    }
  };
};

// Generate donut chart layout
export const generateDonutChartLayout = (theme: any) => {
  return {
    paper_bgcolor: theme.colors.graphite,
    plot_bgcolor: theme.colors.graphite,
    font: {
      family: theme.typography.fontFamily,
      color: theme.colors.cloudWhite
    },
    margin: { l: 20, r: 20, t: 40, b: 20 },
    showlegend: true,
    legend: {
      orientation: 'v',
      x: 1,
      y: 0.5
    }
  };
};

// Create color scales for various visualizations
export const getColorScales = (theme: any) => {
  // Electric Cyan gradient for normal data
  const normalGradient = [
    theme.colors.midnight,
    theme.colors.electricCyanDark,
    theme.colors.electricCyan
  ];
  
  // Signal Magenta gradient for anomalies
  const anomalyGradient = [
    theme.colors.midnight,
    theme.colors.signalMagentaDark,
    theme.colors.signalMagenta
  ];
  
  // Combined scale for continuous colorization
  const fullScale = [
    [0, theme.colors.midnight],
    [0.5, theme.colors.electricCyan],
    [1, theme.colors.signalMagenta]
  ];
  
  return {
    normalGradient,
    anomalyGradient,
    fullScale
  };
};

// Custom hover template generators
export const transactionHoverTemplate = `
  <b>%{text}</b><br>
  Time: %{x}<br>
  Value: $%{y:.2f}<br>
  Products: %{customdata.products}<br>
  <extra></extra>
`;

export const heatmapHoverTemplate = `
  <b>%{y} at %{x}:00</b><br>
  Transactions: %{z}<br>
  <extra></extra>
`;

export const donutHoverTemplate = `
  <b>%{label}</b><br>
  %{percent} of transactions<br>
  <extra></extra>
`;

// Hook to get all chart configs
export const useChartConfigs = () => {
  const theme = useTheme();
  
  return {
    heatmapColorscale: generateHeatmapColorscale(theme),
    dualAxisConfig: generateDualAxisConfig(theme),
    networkGraphLayout: generateNetworkGraphLayout(theme),
    anomalyScatterLayout: generateAnomalyScatterLayout(theme),
    donutChartLayout: generateDonutChartLayout(theme),
    colorScales: getColorScales(theme),
    hoverTemplates: {
      transaction: transactionHoverTemplate,
      heatmap: heatmapHoverTemplate,
      donut: donutHoverTemplate
    }
  };
}; 