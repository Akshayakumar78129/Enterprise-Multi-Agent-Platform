import React, { FC, useState, useMemo, useEffect } from 'react';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { Button } from '../../../../../../ui-common/design-system/components/Button';
import { SalesData } from '../../types';
import dynamic from 'next/dynamic';
import { fetchAggregatedSalesDataAPI } from '../../api';

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

interface PerformanceDriverAnalysisProps {
  data?: SalesData[];
  loading: boolean;
  selectedDimension: string | null;
  selectedMetric: string | null;
  dateRange?: { startDate: string; endDate: string };
}

interface DriverData {
  name: string;
  impact: number;
  percentage: number;
  category: string;
  direction: 'positive' | 'negative';
}

export const PerformanceDriverAnalysis: FC<PerformanceDriverAnalysisProps> = ({
  data,
  loading,
  selectedDimension,
  selectedMetric,
  dateRange
}) => {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<'waterfall' | 'tree' | 'impact'>('waterfall');
  const [sortBy, setSortBy] = useState<'impact' | 'percentage'>('impact');
  const [showPositiveOnly, setShowPositiveOnly] = useState(false);
  
  // State for aggregated data
  const [aggregatedData, setAggregatedData] = useState<SalesData[]>([]);
  const [aggregatedLoading, setAggregatedLoading] = useState(false);

  // Fetch aggregated data when filters change
  useEffect(() => {
    const fetchAggregatedData = async () => {
      if (!selectedDimension || !selectedMetric || !dateRange) return;
      
      setAggregatedLoading(true);
      try {
        const result = await fetchAggregatedSalesDataAPI({
          dateRange,
          dimension: selectedDimension,
          metric: selectedMetric,
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
  }, [selectedDimension, selectedMetric, dateRange]);

  const driversData = useMemo((): DriverData[] => {
    const dataToUse = aggregatedData.length > 0 ? aggregatedData : data || [];
    if (dataToUse.length === 0) return [];

    // Aggregate data by dimension to handle any duplicates (similar to PerformanceOverview)
    const aggregated = dataToUse.reduce((acc, item) => {
      const key = item.dimension;
      if (!acc[key]) {
        acc[key] = {
          dimension: key,
          revenue: 0,
          units: 0,
          aov: 0,
          margin: 0,
          totalOrders: 0
        };
      }
      
      acc[key].revenue += item.revenue || 0;
      acc[key].units += item.units_sold || 0;
      acc[key].totalOrders += item.order_count || 0;
      acc[key].margin += (item.margin || 0) * (item.revenue || 0); // Weight margin by revenue
      
      return acc;
    }, {} as Record<string, { dimension: string; revenue: number; units: number; aov: number; margin: number; totalOrders: number }>);

    // Calculate final metrics
    const dimensionMetrics = Object.values(aggregated).map(item => ({
      dimension: item.dimension,
      revenue: item.revenue,
      units: item.units,
      aov: item.totalOrders > 0 ? item.revenue / item.totalOrders : 0,
      margin: item.revenue > 0 ? item.margin / item.revenue : 0
    }));

    // Calculate overall averages
    const totalRevenue = dimensionMetrics.reduce((sum, item) => sum + item.revenue, 0);
    const avgRevenue = dimensionMetrics.length > 0 ? totalRevenue / dimensionMetrics.length : 0;
    
    // Sort by the selected metric or revenue as default
    const metricKey = selectedMetric === 'units_sold' ? 'units' : 
                     selectedMetric === 'averageOrderValue' ? 'aov' :
                     selectedMetric === 'grossMargin' ? 'margin' : 'revenue';
    
    const sortedDimensions = dimensionMetrics.sort((a, b) => b[metricKey] - a[metricKey]);
    
    // Create drivers based on performance variance
    const drivers: DriverData[] = [];
    sortedDimensions.forEach((item, index) => {
      const metricValue = item[metricKey];
      const avgValue = metricKey === 'units' ? dimensionMetrics.reduce((sum, d) => sum + d.units, 0) / dimensionMetrics.length :
                      metricKey === 'aov' ? dimensionMetrics.reduce((sum, d) => sum + d.aov, 0) / dimensionMetrics.length :
                      metricKey === 'margin' ? dimensionMetrics.reduce((sum, d) => sum + d.margin, 0) / dimensionMetrics.length :
                      avgRevenue;
      
      const impact = metricValue - avgValue;
      const percentage = avgValue > 0 ? (impact / avgValue) * 100 : 0;
      
      // Only include significant drivers (more than 5% variance)
      if (Math.abs(percentage) > 5) {
        drivers.push({
          name: `${item.dimension} Performance`,
          impact: impact,
          percentage: Math.round(percentage),
          category: selectedDimension || 'Performance',
          direction: impact >= 0 ? 'positive' : 'negative'
        });
      }
    });

    return drivers.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 8); // Limit to top 8 drivers
  }, [aggregatedData, data, selectedDimension, selectedMetric]);

  const processedDrivers = useMemo(() => {
    if (showPositiveOnly) {
      return driversData.filter(d => d.direction === 'positive');
    }
    return driversData;
  }, [driversData, showPositiveOnly]);

  const renderWaterfall = () => {
    if (processedDrivers.length === 0) return null;

    const baseValue = data?.reduce((sum, item) => sum + item.metricValue, 0) || 0;
    const totalChange = processedDrivers.reduce((sum, driver) => sum + driver.impact, 0);
    const finalValue = baseValue + totalChange;

    // Create waterfall data
    const categories = ['Previous Period', ...processedDrivers.map(d => d.name), 'Current Period'];
    const values = [baseValue, ...processedDrivers.map(d => d.impact), finalValue];
    const colors = [
      theme.colors.graphite, // Previous period
      ...processedDrivers.map(d => d.direction === 'positive' ? theme.colors.electricCyan : theme.colors.signalMagenta),
      theme.colors.cloudWhite // Current period
    ];

    // Calculate cumulative positions for waterfall effect
    let cumulative = baseValue;
    const waterfallData = values.map((value, index) => {
      if (index === 0 || index === values.length - 1) {
        // Start and end bars
        return { y: value, base: 0 };
      } else {
        // Driver bars
        const base = cumulative;
        cumulative += value;
        return { y: Math.abs(value), base: value >= 0 ? base : base + value };
      }
    });

    const trace = {
      x: categories,
      y: waterfallData.map(d => d.y),
      base: waterfallData.map(d => d.base),
      type: 'bar',
      marker: { color: colors },
      text: values.map((val, idx) => {
        if (idx === 0 || idx === values.length - 1) {
          return `$${val.toLocaleString()}`;
        }
        return `${val >= 0 ? '+' : ''}$${val.toLocaleString()}`;
      }),
      textposition: 'outside',
      textfont: { color: theme.colors.cloudWhite, size: 12 },
      hovertemplate: '%{x}<br>Value: %{text}<extra></extra>'
    };

    const layout = {
      height: 400,
      autosize: true,
      plot_bgcolor: theme.colors.graphiteDark,
      paper_bgcolor: theme.colors.graphiteDark,
      font: { color: theme.colors.cloudWhite, family: 'Inter, sans-serif' },
      margin: { l: 70, r: 30, b: 120, t: 30, pad: 5 },
      xaxis: {
        tickangle: 45,
        gridcolor: hexToRgba(theme.colors.graphite, 0.3),
        linecolor: theme.colors.graphite
      },
      yaxis: {
        title: selectedMetric || 'Value',
        gridcolor: hexToRgba(theme.colors.graphite, 0.3),
        zerolinecolor: hexToRgba(theme.colors.graphite, 0.5),
        linecolor: theme.colors.graphite
      },
      showlegend: false
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

  const renderHorizontalBars = () => {
    if (processedDrivers.length === 0) return null;

    const trace = {
      y: processedDrivers.map(d => d.name),
      x: processedDrivers.map(d => d.impact),
      type: 'bar',
      orientation: 'h',
      marker: {
        color: processedDrivers.map(d => d.direction === 'positive' ? theme.colors.electricCyan : theme.colors.signalMagenta)
      },
      text: processedDrivers.map(d => `${d.percentage >= 0 ? '+' : ''}${d.percentage}%`),
      textposition: 'outside',
      textfont: { color: theme.colors.cloudWhite, size: 12 },
      hovertemplate: '%{y}<br>Impact: $%{x:,.0f} (%{text})<extra></extra>'
    };

    const layout = {
      height: 400,
      autosize: true,
      plot_bgcolor: theme.colors.graphiteDark,
      paper_bgcolor: theme.colors.graphiteDark,
      font: { color: theme.colors.cloudWhite, family: 'Inter, sans-serif' },
      margin: { l: 150, r: 30, b: 50, t: 30, pad: 5 },
      xaxis: {
        title: 'Impact Value',
        gridcolor: hexToRgba(theme.colors.graphite, 0.3),
        zerolinecolor: hexToRgba(theme.colors.graphite, 0.5),
        linecolor: theme.colors.graphite
      },
      yaxis: {
        gridcolor: 'transparent',
        linecolor: theme.colors.graphite,
        automargin: true
      },
      showlegend: false
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

  const renderBreakdownTable = () => {
    if (processedDrivers.length === 0) return null;

    return (
      <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: theme.colors.graphiteDark }}>
              <th style={{ 
                padding: theme.spacing[2], 
                textAlign: 'left', 
                color: theme.colors.cloudWhite,
                borderBottom: `1px solid ${theme.colors.graphite}`
              }}>
                Driver
              </th>
              <th style={{ 
                padding: theme.spacing[2], 
                textAlign: 'center', 
                color: theme.colors.cloudWhite,
                borderBottom: `1px solid ${theme.colors.graphite}`
              }}>
                Category
              </th>
              <th style={{ 
                padding: theme.spacing[2], 
                textAlign: 'right', 
                color: theme.colors.cloudWhite,
                borderBottom: `1px solid ${theme.colors.graphite}`
              }}>
                Impact Value
              </th>
              <th style={{ 
                padding: theme.spacing[2], 
                textAlign: 'right', 
                color: theme.colors.cloudWhite,
                borderBottom: `1px solid ${theme.colors.graphite}`
              }}>
                Percentage
              </th>
              <th style={{ 
                padding: theme.spacing[2], 
                textAlign: 'center', 
                color: theme.colors.cloudWhite,
                borderBottom: `1px solid ${theme.colors.graphite}`
              }}>
                Direction
              </th>
            </tr>
          </thead>
          <tbody>
            {processedDrivers.map((driver, index) => (
              <tr key={driver.name} style={{ 
                background: index % 2 === 0 ? theme.colors.midnight : hexToRgba(theme.colors.graphite, 0.3)
              }}>
                <td style={{ 
                  padding: theme.spacing[2], 
                  color: theme.colors.cloudWhite,
                  borderBottom: `1px solid ${theme.colors.graphite}`,
                  fontWeight: 500
                }}>
                  {driver.name}
                </td>
                <td style={{ 
                  padding: theme.spacing[2], 
                  textAlign: 'center',
                  color: theme.colors.cloudWhite,
                  borderBottom: `1px solid ${theme.colors.graphite}`
                }}>
                  <span style={{ 
                    padding: `${theme.spacing[1]}px ${theme.spacing[2]}px`,
                    background: hexToRgba(theme.colors.electricCyan, 0.2),
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    {driver.category}
                  </span>
                </td>
                <td style={{ 
                  padding: theme.spacing[2], 
                  textAlign: 'right',
                  color: theme.colors.cloudWhite,
                  borderBottom: `1px solid ${theme.colors.graphite}`,
                  fontWeight: 600
                }}>
                  ${driver.impact.toLocaleString()}
                </td>
                <td style={{ 
                  padding: theme.spacing[2], 
                  textAlign: 'right',
                  color: driver.direction === 'positive' ? theme.colors.electricCyan : theme.colors.signalMagenta,
                  borderBottom: `1px solid ${theme.colors.graphite}`,
                  fontWeight: 600
                }}>
                  {driver.percentage >= 0 ? '+' : ''}{driver.percentage}%
                </td>
                <td style={{ 
                  padding: theme.spacing[2], 
                  textAlign: 'center',
                  borderBottom: `1px solid ${theme.colors.graphite}`
                }}>
                  <span style={{ 
                    color: driver.direction === 'positive' ? theme.colors.electricCyan : theme.colors.signalMagenta,
                    fontSize: '18px'
                  }}>
                    {driver.direction === 'positive' ? '↗' : '↘'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderChart = () => {
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
          Loading Driver Analysis...
        </div>
      );
    }

    if (processedDrivers.length === 0) {
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
          No driver data available for analysis.
        </div>
      );
    }

    switch (viewMode) {
      case 'waterfall':
        return renderWaterfall();
      case 'tree':
        return renderHorizontalBars(); // Reuse horizontal bars for tree view
      case 'impact':
        return renderBreakdownTable(); // Reuse breakdown table for impact view
      default:
        return renderWaterfall();
    }
  };

  const totalPositiveImpact = processedDrivers
    .filter(d => d.direction === 'positive')
    .reduce((sum, d) => sum + d.impact, 0);

  const totalNegativeImpact = processedDrivers
    .filter(d => d.direction === 'negative')
    .reduce((sum, d) => sum + Math.abs(d.impact), 0);

  const netImpact = totalPositiveImpact - totalNegativeImpact;

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
          Performance Driver Analysis
        </h3>
        
        <div style={{ display: 'flex', gap: theme.spacing[2], alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: theme.spacing[2] }}>
            <Button 
              size="sm" 
              variant={viewMode === 'waterfall' ? 'primary' : 'outline'}
              onClick={() => setViewMode('waterfall')}
            >
              Waterfall
            </Button>
            <Button 
              size="sm" 
              variant={viewMode === 'tree' ? 'primary' : 'outline'}
              onClick={() => setViewMode('tree')}
            >
              Tree Map
            </Button>
            <Button 
              size="sm" 
              variant={viewMode === 'impact' ? 'primary' : 'outline'}
              onClick={() => setViewMode('impact')}
            >
              Impact Chart
            </Button>
          </div>
          
          <div style={{ display: 'flex', gap: theme.spacing[1] }}>
            <Button 
              size="sm" 
              variant={showPositiveOnly ? 'primary' : 'outline'}
              onClick={() => setShowPositiveOnly(!showPositiveOnly)}
            >
              Positive Drivers Only
            </Button>
          </div>
        </div>
      </div>

      {renderChart()}

      {/* Summary statistics */}
      {processedDrivers.length > 0 && (
        <div style={{ 
          marginTop: theme.spacing[3], 
          padding: theme.spacing[2], 
          background: theme.colors.graphiteDark, 
          borderRadius: '4px',
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: theme.spacing[2]
        }}>
          <div style={{ textAlign: 'center', color: theme.colors.cloudWhite }}>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Positive Drivers</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: theme.colors.electricCyan }}>
              +${totalPositiveImpact.toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'center', color: theme.colors.cloudWhite }}>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Negative Drivers</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: theme.colors.signalMagenta }}>
              -${totalNegativeImpact.toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'center', color: theme.colors.cloudWhite }}>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Net Impact</div>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 600,
              color: netImpact >= 0 ? theme.colors.electricCyan : theme.colors.signalMagenta
            }}>
              {netImpact >= 0 ? '+' : ''}${netImpact.toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'center', color: theme.colors.cloudWhite }}>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Total Drivers</div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>
              {processedDrivers.length}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}; 