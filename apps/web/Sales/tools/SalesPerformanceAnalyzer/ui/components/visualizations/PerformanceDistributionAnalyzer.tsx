import React, { FC, useState, useMemo } from 'react';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { SalesData } from '../../types';
import { Button } from '../../../../../../ui-common/design-system/components/Button';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Chart Library...</div>
});

const hexToRgba = (hex: string, alpha: number): string => {
  if (typeof hex !== 'string' || !hex.startsWith('#') || (hex.length !== 4 && hex.length !== 7)) {
    return `rgba(0, 0, 0, ${alpha})`; 
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

interface PerformanceDistributionAnalyzerProps {
  data?: SalesData[];
  loading: boolean;
  selectedDimension: string | null;
  selectedMetric: string | null;
}

export const PerformanceDistributionAnalyzer: FC<PerformanceDistributionAnalyzerProps> = ({
  data,
  loading,
  selectedDimension,
  selectedMetric,
}) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'treemap'>('bar');
  const [showTopN, setShowTopN] = useState<number | 'all'> (10);

  const isTimeDimension = selectedDimension === 'time';

  const processedChartTrace = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Aggregate data by the selected dimension
    const aggregatedData = data.reduce((acc, item) => {
      const key = item.dimension || (isTimeDimension && item.date ? item.date : 'Unknown'); // Use date if dimension is time
      if (!acc[key]) {
        acc[key] = { dimension: key, metricValue: 0 };
      }
      acc[key].metricValue += item.metricValue;
      return acc;
    }, {} as Record<string, { dimension: string, metricValue: number }>);

    let chartArray = Object.values(aggregatedData).sort((a, b) => b.metricValue - a.metricValue);

    if (showTopN !== 'all' && !isTimeDimension) { // Top N might not make sense for a full time series
      chartArray = chartArray.slice(0, showTopN);
    }
    
    if (chartArray.length === 0) return null;

    // If dimension is time, force bar chart as pie/treemap are less suitable
    const effectiveChartType = isTimeDimension ? 'bar' : chartType;

    switch (effectiveChartType) {
      case 'pie':
        return {
          labels: chartArray.map(item => item.dimension),
          values: chartArray.map(item => item.metricValue),
          type: 'pie',
          hole: 0.4, 
          hoverinfo: 'label+percent+value',
          textinfo: 'percent',
          automargin: true,
          marker: { 
            colors: chartArray.map((_, i) => theme.colors.graphiteDark) // Default, will be overridden by Plotly default sequence
            // Using a Plotly qualitative scale is better, e.g. Plotly.Colors.PLOTLY_DEFAULT_COLORS or similar
            // For simplicity, let Plotly handle colors if specific theme array is not suitable or complete
          }
        };
      case 'treemap':
        return {
          type: 'treemap',
          labels: chartArray.map(item => item.dimension),
          parents: chartArray.map(() => selectedDimension || 'Root'), 
          values: chartArray.map(item => item.metricValue),
          textinfo: 'label+value+percent root',
          hoverinfo: 'label+value+percent parent',
          marker: { 
            // Using a colorscale that works well with treemaps by default
            // `colorscale: 'Blues'` was fine, or let Plotly decide based on values if not specified
            // Add padding to see individual blocks better
            pad: {t: 10, l: 5, r: 5, b: 10}
           },
        };
      case 'bar': 
      default:
        return {
          [isTimeDimension ? 'x' : 'y']: chartArray.map(item => item.dimension), // Dates on X for time, categories on Y otherwise
          [isTimeDimension ? 'y' : 'x']: chartArray.map(item => item.metricValue),
          type: 'bar',
          orientation: isTimeDimension ? 'v' : 'h', // Vertical for time, horizontal for categories
          name: selectedMetric || 'Metric',
          hoverinfo: 'all',
          marker: { color: theme.colors.electricCyan },
        };
    }
  }, [data, chartType, showTopN, selectedDimension, selectedMetric, theme.colors, isTimeDimension]);

  const renderChart = () => {
    if (loading) {
      return <div style={{ color: theme.colors.cloudWhite, textAlign: 'center', padding: theme.spacing[4], height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Distribution...</div>;
    }
    if (!processedChartTrace) {
      return <div style={{ color: theme.colors.cloudWhite, textAlign: 'center', padding: theme.spacing[4], height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No distribution data available for {selectedMetric} by {selectedDimension}.</div>;
    }
    
    const effectiveChartType = isTimeDimension ? 'bar' : chartType;

    const layout = {
      height: 350,
      autosize: true,
      plot_bgcolor: theme.colors.graphiteDark,
      paper_bgcolor: theme.colors.graphiteDark,
      font: { color: theme.colors.cloudWhite, family: 'Inter, sans-serif' },
      xaxis: {
        title: effectiveChartType === 'bar' ? (isTimeDimension ? (selectedDimension || 'Date') : (selectedMetric || 'Value')) : '',
        gridcolor: hexToRgba(theme.colors.graphite, 0.3),
        zerolinecolor: hexToRgba(theme.colors.graphite, 0.5),
        linecolor: theme.colors.graphite,
        automargin: true,
        visible: effectiveChartType === 'bar', 
        type: isTimeDimension ? 'date' : '-', // Set x-axis type to date if dimension is time
        tickformat: isTimeDimension ? '%Y-%m-%d' : undefined,
      },
      yaxis: {
        title: effectiveChartType === 'bar' ? (isTimeDimension ? (selectedMetric || 'Value') : (selectedDimension || 'Dimension')) : '',
        gridcolor: hexToRgba(theme.colors.graphite, 0.3),
        zerolinecolor: hexToRgba(theme.colors.graphite, 0.5),
        linecolor: theme.colors.graphite,
        automargin: true,
        visible: effectiveChartType === 'bar',
        categoryorder: (effectiveChartType === 'bar' && !isTimeDimension) ? 'total ascending' : undefined, 
      },
      margin: { l: (effectiveChartType === 'bar' && !isTimeDimension) ? 150 : 70, r: 30, b: 70, t: 50, pad: 5 },
      showlegend: effectiveChartType === 'pie', 
      legend: { font: { size: 10 } },
      hoverlabel: { 
        bgcolor: theme.colors.midnight, 
        bordercolor: theme.colors.electricCyan, 
        font: { color: theme.colors.cloudWhite, size: 13, family: 'Inter, sans-serif' }
      },
      // Treemap specific layout options
      ...(effectiveChartType === 'treemap' && {
        treemapcolorway: [theme.colors.electricCyan, theme.colors.signalMagenta], // Example colorway for treemap
      })
    };

    return (
      <Plot
        data={[processedChartTrace] as any} 
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[2], flexWrap: 'wrap', gap: theme.spacing[1] }}>
        <h3 style={{ color: theme.colors.cloudWhite, margin: 0 }}>Performance Distribution</h3>
        <div style={{display: 'flex', gap: theme.spacing[1]}}>
          {(['bar', 'pie', 'treemap'] as const).map(type => (
            <Button 
              key={type} 
              variant={chartType === type ? 'primary' : 'outline'} 
              onClick={() => setChartType(type)}
              size="sm"
              disabled={isTimeDimension && (type === 'pie' || type === 'treemap')} // Disable pie/treemap for time dimension
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: theme.spacing[2], alignItems: 'center', marginBottom: theme.spacing[2], flexWrap: 'wrap' }}>
        <span style={{color: theme.colors.cloudWhite}}>Show:</span>
        {[10, 20, 'all'].map(n => (
          <Button key={n} size="sm" variant={showTopN === n ? 'primary' : 'outline'} onClick={() => setShowTopN(n as any)} disabled={isTimeDimension}>{n === 'all' ? 'All' : `Top ${n}`}</Button>
        ))}
      </div>
      {isTimeDimension && (
        <div style={{fontSize: '12px', color: theme.colors.warning, marginBottom: theme.spacing[2]}}>
          Note: Pie and Treemap charts are less suitable for 'time' dimension and are disabled. Displaying as a time-based bar chart.
        </div>
      )}
      <div style={{fontSize: '12px', color: theme.colors.graphite, marginBottom: theme.spacing[2]}}>Further controls (Pareto, concentration, threshold markers, distribution curve) to be added.</div>

      {renderChart()}
      
    </Card>
  );
}; 