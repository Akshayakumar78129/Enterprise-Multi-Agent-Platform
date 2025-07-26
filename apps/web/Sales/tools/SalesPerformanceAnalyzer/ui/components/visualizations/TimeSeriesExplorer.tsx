import React, { FC, useState, useMemo } from 'react';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { SalesData } from '../../types'; // Assuming SalesData can be used/adapted for time series
import { Button } from '../../../../../../ui-common/design-system/components/Button';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Chart Library...</div>
});

// Helper to convert hex to rgba (can be moved to a shared util if used elsewhere)
const hexToRgba = (hex: string, alpha: number): string => {
  if (typeof hex !== 'string' || !hex.startsWith('#') || (hex.length !== 4 && hex.length !== 7)) {
    return `rgba(0, 0, 0, ${alpha})`; // Fallback color
  }
  try {
    let r_str = '00', g_str = '00', b_str = '00';
    if (hex.length === 4) { 
      r_str = hex[1] + hex[1]; g_str = hex[2] + hex[2]; b_str = hex[3] + hex[3];
    } else { 
      r_str = hex.slice(1, 3); g_str = hex.slice(3, 5); b_str = hex.slice(5, 7);
    }
    const r = parseInt(r_str, 16);
    const g = parseInt(g_str, 16);
    const b = parseInt(b_str, 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0, 0, 0, ${alpha})`;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch (error) {
    return `rgba(0, 0, 0, ${alpha})`; 
  }
};

interface TimeSeriesExplorerProps {
  data?: SalesData[]; // Data for the time series chart
  loading: boolean;
  selectedMetric: string | null;
  initialGranularity?: 'daily' | 'weekly' | 'monthly'; // Added for initial setup from parent
  // Props for time range selector, entity selector, aggregation, comparison, analysis tools from Spec 4.2
  // For simplicity, these are mostly placeholders for now
}

export const TimeSeriesExplorer: FC<TimeSeriesExplorerProps> = ({
  data,
  loading,
  selectedMetric,
  initialGranularity = 'daily'
}) => {
  const theme = useTheme();
  // State for controls like time granularity, moving average, etc.
  const [granularity, setGranularity] = useState(initialGranularity);
  const [showTrendLine, setShowTrendLine] = useState(false);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Assuming data is already sorted by date from API or can be sorted here if needed
    const sortedData = [...data].sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

    return {
      x: sortedData.map(item => item.date), // Dates for X-axis
      y: sortedData.map(item => item.metricValue), // Metric values for Y-axis
      type: 'scatter', // 'scatter' for lines, 'bar' for bar chart etc.
      mode: 'lines+markers',
      name: selectedMetric || 'Metric',
      line: { color: theme.colors.electricCyan, width: 2 },
      marker: { 
        size: 5, 
        color: theme.colors.electricCyan, 
        line: { color: theme.colors.midnight, width: 1}
      },
      hoverinfo: 'x+y',
    };
  }, [data, selectedMetric, theme.colors]);

  const renderChart = () => {
    if (loading) {
      return <div style={{ color: theme.colors.cloudWhite, textAlign: 'center', padding: theme.spacing[4], height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Time Series...</div>;
    }
    if (!chartData) {
      return <div style={{ color: theme.colors.cloudWhite, textAlign: 'center', padding: theme.spacing[4], height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No time series data available for {selectedMetric}.</div>;
    }
    
    const layout = {
      height: 350,
      autosize: true,
      plot_bgcolor: theme.colors.graphiteDark,
      paper_bgcolor: theme.colors.graphiteDark,
      font: { color: theme.colors.cloudWhite, family: 'Inter, sans-serif' },
      xaxis: {
        type: 'date',
        title: 'Date',
        gridcolor: hexToRgba(theme.colors.graphite, 0.3),
        zerolinecolor: hexToRgba(theme.colors.graphite, 0.5),
        linecolor: theme.colors.graphite,
        tickformat: '%Y-%m-%d', // Customize date format as needed
        automargin: true,
      },
      yaxis: {
        title: selectedMetric || 'Value',
        gridcolor: hexToRgba(theme.colors.graphite, 0.3),
        zerolinecolor: hexToRgba(theme.colors.graphite, 0.5),
        linecolor: theme.colors.graphite,
        automargin: true,
      },
      margin: { l: 70, r: 30, b: 70, t: 30, pad: 5 },
      showlegend: false, // Can be true if multiple traces
      hoverlabel: { 
        bgcolor: theme.colors.midnight, 
        bordercolor: theme.colors.electricCyan, 
        font: { color: theme.colors.cloudWhite, size: 13, family: 'Inter, sans-serif' }
      },
    };

    return (
      <Plot
        data={[chartData] as any} 
        layout={layout as any}
        style={{ width: '100%', height: '100%' }}
        config={{ displayModeBar: false }}
      />
    );
  };

  return (
    <Card 
      elevation="md" 
      style={{
        padding: theme.spacing[3],
        background: theme.colors.midnight,
        height: '100%'
      }}
    >
      <h3 style={{ color: theme.colors.cloudWhite, margin: `0 0 ${theme.spacing[2]}px 0` }}>Time Series Explorer</h3>
      
      {/* Placeholder for controls mentioned in Spec 4.2 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: theme.spacing[1], marginBottom: theme.spacing[2] }}>
        <div>
          <span style={{color: theme.colors.cloudWhite, marginRight: theme.spacing[1]}}>Granularity:</span>
          {['daily', 'weekly', 'monthly'].map(g => (
            <Button key={g} size="sm" variant={granularity === g ? 'primary' : 'outline'} onClick={() => setGranularity(g as any)} style={{marginRight: theme.spacing[1]}}>{g.charAt(0).toUpperCase() + g.slice(1)}</Button>
          ))}
        </div>
        {/* Trendline functionality is not implemented in this Plotly version, would require stats library or custom calc */}
        {/* <Button size="sm" variant={showTrendLine ? 'primary' : 'outline'} onClick={() => setShowTrendLine(!showTrendLine)}>Trend Line</Button> */}
      </div>
      {/* Placeholder for Time Range Selector (brush area), Entity Selector, Comparison, Analysis Tools */}
      <div style={{fontSize: '12px', color: theme.colors.graphite, marginBottom: theme.spacing[2]}}>Controls like time brush, entity multi-select, PoP comparison will be added. Granularity control is visual only for now.</div>

      {renderChart()}
      
      {/* Placeholder for Entity Details Panel */}
      {/* <div style={{marginTop: theme.spacing[2], padding: theme.spacing[2], background: theme.colors.graphiteDark, borderRadius: '4px'}}>Entity Details Panel</div> */}
    </Card>
  );
}; 