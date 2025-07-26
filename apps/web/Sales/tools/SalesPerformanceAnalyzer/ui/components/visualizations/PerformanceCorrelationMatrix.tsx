import React, { FC, useState, useMemo, useEffect } from 'react';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { Button } from '../../../../../../ui-common/design-system/components/Button';
import { SalesData } from '../../types';
import { fetchAggregatedSalesDataAPI } from '../../api';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Chart Library...</div>
});

// Helper to convert hex to rgba
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

interface PerformanceCorrelationMatrixProps {
  data?: SalesData[];
  loading: boolean;
  selectedDimension: string | null;
  dateRange?: { startDate: string; endDate: string };
}

interface CorrelationData {
  entity: string;
  revenue: number;
  units: number;
  aov: number;
  growth: number;
  margin: number;
}

export const PerformanceCorrelationMatrix: FC<PerformanceCorrelationMatrixProps> = ({
  data,
  loading,
  selectedDimension,
  dateRange
}) => {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<'scatter' | 'heatmap'>('scatter');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['revenue', 'units', 'aov']);
  const [showTrendLines, setShowTrendLines] = useState(true);
  
  // State for aggregated data
  const [aggregatedData, setAggregatedData] = useState<SalesData[]>([]);
  const [aggregatedLoading, setAggregatedLoading] = useState(false);

  // Fetch aggregated data when filters change
  useEffect(() => {
    const fetchAggregatedData = async () => {
      if (!selectedDimension || !dateRange) return;
      
      setAggregatedLoading(true);
      try {
        const result = await fetchAggregatedSalesDataAPI({
          dateRange,
          dimension: selectedDimension,
          metric: 'revenue', // Use revenue as default for correlation analysis
        });
        
        if (result.status === 'success' && result.results?.chartData) {
          setAggregatedData(result.results.chartData);
        } else {
          console.error('Failed to fetch aggregated data:', result.message);
          setAggregatedData([]);
        }
      } catch (error) {
        console.error('Error fetching aggregated data:', error);
        setAggregatedData([]);
      } finally {
        setAggregatedLoading(false);
      }
    };

    fetchAggregatedData();
  }, [selectedDimension, dateRange]);

  const availableMetrics = [
    { key: 'revenue', label: 'Revenue' },
    { key: 'units', label: 'Units' },
    { key: 'aov', label: 'AOV' },
    { key: 'growth', label: 'Growth' },
    { key: 'margin', label: 'Margin' }
  ];

  const processedData = useMemo(() => {
    const dataToUse = aggregatedData.length > 0 ? aggregatedData : data || [];
    if (dataToUse.length === 0) return [];

    // Aggregate data by dimension to handle any duplicates (similar to PerformanceOverview)
    const aggregated = dataToUse.reduce((acc, item) => {
      const key = item.dimension;
      if (!acc[key]) {
        acc[key] = {
          entity: key,
          revenue: 0,
          units: 0,
          aov: 0,
          growth: 0,
          margin: 0,
          totalOrders: 0
        };
      }
      
      acc[key].revenue += item.revenue || 0;
      acc[key].units += item.units_sold || 0;
      acc[key].totalOrders += item.order_count || 0;
      acc[key].margin += (item.margin || 0) * (item.revenue || 0); // Weight margin by revenue
      
      return acc;
    }, {} as Record<string, CorrelationData & { totalOrders: number }>);

    // Calculate final metrics
    const correlationData = Object.values(aggregated).map(item => ({
      entity: item.entity,
      revenue: item.revenue,
      units: item.units,
      aov: item.totalOrders > 0 ? item.revenue / item.totalOrders : 0,
      growth: 0, // Growth calculation requires historical data
      margin: item.revenue > 0 ? item.margin / item.revenue : 0
    }));

    // Filter out entities with insufficient data (less than 2 metrics with values)
    return correlationData.filter(item => {
      const nonZeroMetrics = [item.revenue, item.units, item.aov, item.margin].filter(val => val > 0);
      return nonZeroMetrics.length >= 2;
    });
  }, [aggregatedData, data]);

  const calculateCorrelation = (x: number[], y: number[]): number => {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const correlationMatrix = useMemo(() => {
    if (processedData.length === 0) return {};
    
    const matrix: Record<string, Record<string, number>> = {};
    
    selectedMetrics.forEach(metric1 => {
      matrix[metric1] = {};
      selectedMetrics.forEach(metric2 => {
        const values1 = processedData.map(d => d[metric1 as keyof CorrelationData] as number);
        const values2 = processedData.map(d => d[metric2 as keyof CorrelationData] as number);
        matrix[metric1][metric2] = calculateCorrelation(values1, values2);
      });
    });
    
    return matrix;
  }, [processedData, selectedMetrics]);

  const toggleMetric = (metric: string) => {
    if (selectedMetrics.includes(metric)) {
      if (selectedMetrics.length > 2) {
        setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
      }
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };

  const renderScatterMatrix = () => {
    if (processedData.length === 0) return null;

    const traces: any[] = [];
    
    // Create scatter plots for each metric pair
    for (let i = 0; i < selectedMetrics.length; i++) {
      for (let j = 0; j < selectedMetrics.length; j++) {
        if (i !== j) {
          const xMetric = selectedMetrics[j];
          const yMetric = selectedMetrics[i];
          const xValues = processedData.map(d => d[xMetric as keyof CorrelationData] as number);
          const yValues = processedData.map(d => d[yMetric as keyof CorrelationData] as number);
          
          traces.push({
            x: xValues,
            y: yValues,
            type: 'scatter',
            mode: 'markers',
            name: `${yMetric} vs ${xMetric}`,
            marker: {
              size: 8,
              color: theme.colors.electricCyan,
              opacity: 0.7,
              line: { color: theme.colors.midnight, width: 1 }
            },
            text: processedData.map(d => d.entity),
            hovertemplate: `<b>%{text}</b><br>${xMetric}: %{x}<br>${yMetric}: %{y}<extra></extra>`,
            xaxis: `x${j + 1}`,
            yaxis: `y${i + 1}`,
            showlegend: false
          });

          // Add trend line if enabled
          if (showTrendLines && xValues.length > 1) {
            const correlation = calculateCorrelation(xValues, yValues);
            if (Math.abs(correlation) > 0.1) {
              // Simple linear regression
              const n = xValues.length;
              const sumX = xValues.reduce((a, b) => a + b, 0);
              const sumY = yValues.reduce((a, b) => a + b, 0);
              const sumXY = xValues.reduce((sum, x, idx) => sum + x * yValues[idx], 0);
              const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
              
              const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
              const intercept = (sumY - slope * sumX) / n;
              
              const minX = Math.min(...xValues);
              const maxX = Math.max(...xValues);
              const trendX = [minX, maxX];
              const trendY = trendX.map(x => slope * x + intercept);
              
              traces.push({
                x: trendX,
                y: trendY,
                type: 'scatter',
                mode: 'lines',
                line: {
                  color: theme.colors.cloudWhite,
                  width: 2,
                  dash: 'dash'
                },
                name: `Trend (R²=${(correlation * correlation).toFixed(2)})`,
                xaxis: `x${j + 1}`,
                yaxis: `y${i + 1}`,
                showlegend: false,
                hoverinfo: 'skip'
              });
            }
          }
        }
      }
    }

    // Create subplot layout
    const layout: any = {
      height: 380,
      autosize: true,
      plot_bgcolor: theme.colors.graphiteDark,
      paper_bgcolor: theme.colors.graphiteDark,
      font: { color: theme.colors.cloudWhite, family: 'Inter, sans-serif' },
      margin: { l: 60, r: 30, b: 60, t: 30, pad: 5 },
      showlegend: false,
      grid: {
        rows: selectedMetrics.length,
        columns: selectedMetrics.length,
        pattern: 'independent'
      }
    };

    // Configure axes for each subplot
    selectedMetrics.forEach((metric, i) => {
      selectedMetrics.forEach((_, j) => {
        const xAxisKey = j === 0 ? 'xaxis' : `xaxis${j + 1}`;
        const yAxisKey = i === 0 ? 'yaxis' : `yaxis${i + 1}`;
        
        layout[xAxisKey] = {
          title: j === selectedMetrics.length - 1 ? metric : '',
          gridcolor: hexToRgba(theme.colors.graphite, 0.3),
          zerolinecolor: hexToRgba(theme.colors.graphite, 0.5),
          linecolor: theme.colors.graphite,
          showticklabels: j === selectedMetrics.length - 1
        };
        
        layout[yAxisKey] = {
          title: j === 0 ? metric : '',
          gridcolor: hexToRgba(theme.colors.graphite, 0.3),
          zerolinecolor: hexToRgba(theme.colors.graphite, 0.5),
          linecolor: theme.colors.graphite,
          showticklabels: j === 0
        };
      });
    });

    return (
      <Plot
        data={traces}
        layout={layout}
        style={{ width: '100%', height: '100%' }}
        config={{ displayModeBar: false }}
      />
    );
  };

  const renderHeatmap = () => {
    if (Object.keys(correlationMatrix).length === 0) return null;

    const z = selectedMetrics.map(metric1 => 
      selectedMetrics.map(metric2 => correlationMatrix[metric1][metric2])
    );

    const trace = {
      z: z,
      x: selectedMetrics,
      y: selectedMetrics,
      type: 'heatmap',
      colorscale: [
        [0, theme.colors.signalMagenta],
        [0.5, theme.colors.midnight],
        [1, theme.colors.electricCyan]
      ],
      zmin: -1,
      zmax: 1,
      text: z.map(row => row.map(val => val.toFixed(2))),
      texttemplate: '%{text}',
      textfont: { color: theme.colors.cloudWhite, size: 14 },
      hoverongaps: false,
      hovertemplate: 'Correlation: %{z:.3f}<extra></extra>'
    };

    const layout = {
      height: 380,
      autosize: true,
      plot_bgcolor: theme.colors.graphiteDark,
      paper_bgcolor: theme.colors.graphiteDark,
      font: { color: theme.colors.cloudWhite, family: 'Inter, sans-serif' },
      margin: { l: 80, r: 30, b: 80, t: 30, pad: 5 },
      xaxis: {
        side: 'bottom',
        gridcolor: 'transparent',
        linecolor: 'transparent',
        tickangle: 45
      },
      yaxis: {
        gridcolor: 'transparent',
        linecolor: 'transparent'
      }
    };

    return (
      <Plot
        data={[trace] as any}
        layout={layout as any}
        style={{ width: '100%', height: '100%' }}
        config={{ displayModeBar: false }}
      />
    );
  };

  const renderVisualization = () => {
    const isLoading = loading || aggregatedLoading;
    
    if (isLoading) {
      return (
        <div style={{ 
          color: theme.colors.cloudWhite, 
          textAlign: 'center', 
          padding: theme.spacing[4], 
          height: '400px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          Loading Correlation Matrix...
        </div>
      );
    }

    if (processedData.length === 0) {
      return (
        <div style={{ 
          color: theme.colors.cloudWhite, 
          textAlign: 'center', 
          padding: theme.spacing[4], 
          height: '380px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          No data available for correlation analysis.
        </div>
      );
    }

    return viewMode === 'scatter' ? renderScatterMatrix() : renderHeatmap();
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: theme.spacing[3],
        flexWrap: 'wrap',
        gap: theme.spacing[2]
      }}>
        <h3 style={{ color: theme.colors.cloudWhite, margin: 0 }}>
          Performance Correlation Matrix
        </h3>
        
        <div style={{ display: 'flex', gap: theme.spacing[2], alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: theme.spacing[1] }}>
            <Button 
              size="sm" 
              variant={viewMode === 'scatter' ? 'primary' : 'outline'}
              onClick={() => setViewMode('scatter')}
            >
              Scatter Matrix
            </Button>
            <Button 
              size="sm" 
              variant={viewMode === 'heatmap' ? 'primary' : 'outline'}
              onClick={() => setViewMode('heatmap')}
            >
              Heatmap
            </Button>
          </div>
          
          {viewMode === 'scatter' && (
            <Button 
              size="sm" 
              variant={showTrendLines ? 'primary' : 'outline'}
              onClick={() => setShowTrendLines(!showTrendLines)}
            >
              Trend Lines
            </Button>
          )}
        </div>
      </div>

      {/* Metric selector */}
      <div style={{ marginBottom: theme.spacing[3] }}>
        <div style={{ color: theme.colors.cloudWhite, marginBottom: theme.spacing[1], fontSize: '14px' }}>
          Select Metrics (min 2):
        </div>
        <div style={{ display: 'flex', gap: theme.spacing[1], flexWrap: 'wrap' }}>
          {availableMetrics.map(metric => (
            <Button
              key={metric.key}
              size="sm"
              variant={selectedMetrics.includes(metric.key) ? 'primary' : 'outline'}
              onClick={() => toggleMetric(metric.key)}
              disabled={selectedMetrics.includes(metric.key) && selectedMetrics.length <= 2}
            >
              {metric.label}
            </Button>
          ))}
        </div>
      </div>

      {renderVisualization()}

      {/* Correlation insights */}
      {Object.keys(correlationMatrix).length > 0 && (
        <div style={{ 
          marginTop: theme.spacing[3], 
          padding: theme.spacing[2], 
          background: theme.colors.graphiteDark, 
          borderRadius: '4px'
        }}>
          <div style={{ color: theme.colors.cloudWhite, fontSize: '14px', fontWeight: 600, marginBottom: theme.spacing[1] }}>
            Key Correlations:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing[2] }}>
            {selectedMetrics.slice(0, -1).map((metric1, i) => 
              selectedMetrics.slice(i + 1).map(metric2 => {
                const correlation = correlationMatrix[metric1]?.[metric2] || 0;
                const strength = Math.abs(correlation) > 0.7 ? 'Strong' : 
                               Math.abs(correlation) > 0.4 ? 'Moderate' : 'Weak';
                const direction = correlation > 0 ? 'Positive' : 'Negative';
                
                return (
                  <div key={`${metric1}-${metric2}`} style={{ 
                    fontSize: '12px', 
                    color: theme.colors.cloudWhite,
                    opacity: 0.8
                  }}>
                    <span style={{ fontWeight: 500 }}>{metric1} ↔ {metric2}:</span> {strength} {direction} ({correlation.toFixed(2)})
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </Card>
  );
}; 