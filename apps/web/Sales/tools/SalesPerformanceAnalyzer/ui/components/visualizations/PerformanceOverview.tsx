import React, { FC } from 'react';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { SalesData } from '../../types'; // Assuming SalesData contains data for the chart
import { Button } from '../../../../../../ui-common/design-system/components/Button'; // For chart type toggle
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Chart Library...</div>
});

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  if (typeof hex !== 'string' || !hex.startsWith('#') || (hex.length !== 4 && hex.length !== 7)) {
    console.warn(`Invalid hex color '${hex}' passed to hexToRgba. Defaulting to transparent black.`);
    return `rgba(0, 0, 0, ${alpha})`; // Fallback color
  }
  try {
    let r_str = '00', g_str = '00', b_str = '00';
    if (hex.length === 4) { // Handle shorthand hex #RGB
      r_str = hex[1] + hex[1];
      g_str = hex[2] + hex[2];
      b_str = hex[3] + hex[3];
    } else { // Handle #RRGGBB
      r_str = hex.slice(1, 3);
      g_str = hex.slice(3, 5);
      b_str = hex.slice(5, 7);
    }
    const r = parseInt(r_str, 16);
    const g = parseInt(g_str, 16);
    const b = parseInt(b_str, 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        console.warn(`Error parsing hex color '${hex}'. Defaulting to transparent black.`);
        return `rgba(0, 0, 0, ${alpha})`;
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch (error) {
    console.error(`Error in hexToRgba with hex: ${hex}`, error);
    return `rgba(0, 0, 0, ${alpha})`; // Fallback on any error
  }
};

interface PerformanceOverviewProps {
  data?: SalesData[]; // Data for the chart, adjust based on actual data structure from API
  loading: boolean;
  selectedDimension: string | null;
  selectedMetric: string | null;
  dateRange?: { startDate: string; endDate: string }; // Add date range to determine aggregation
  // Add props for total, period comparison, contribution, top performer as per spec 4.1 Performance Summary
  summaryData?: {
    total: string | number;
    periodComparison: string; // e.g., "+5% vs last period"
    contribution?: string; // Made optional as it might be complex to get initially
    topPerformerName?: string; // e.g., "Region X"
    topPerformerLabel?: string; // e.g., "Top Region"
  };
  chartType?: 'bar' | 'line' | 'area';
  onChartTypeChange?: (type: 'bar' | 'line' | 'area') => void;
}

export const PerformanceOverview: FC<PerformanceOverviewProps> = ({
  data,
  loading,
  selectedDimension,
  selectedMetric,
  dateRange,
  summaryData,
  chartType = 'bar',
  onChartTypeChange
}) => {
  const theme = useTheme();

  // Helper function to aggregate data by month
  const aggregateByMonth = (dataPoints: SalesData[]) => {
    const monthlyData: Record<string, { value: number; count: number }> = {};
    
    dataPoints.forEach(item => {
      if (item.date) {
        const date = new Date(item.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { value: 0, count: 0 };
        }
        
        monthlyData[monthKey].value += item.metricValue;
        monthlyData[monthKey].count += 1;
      }
    });
    
    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        date: `${month}-01`,
        metricValue: data.value / data.count, // Average for the month
        dimension: 'time'
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const processedChartTrace = useMemo(() => {
    if (!data || data.length === 0 || !selectedDimension || !selectedMetric) {
      return null;
    }

    const effectiveChartType = selectedDimension === 'time' && chartType === 'bar' ? 'line' : chartType;

    if (selectedDimension === 'time' || effectiveChartType === 'line' || effectiveChartType === 'area') {
      // Aggregate data to prevent too many points
      const timeData = data.filter(item => item.date);
      
      // Determine aggregation level based on date range
      let processedData = timeData;
      
      if (dateRange) {
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        // For ranges > 90 days, aggregate by month
        // For ranges > 30 days, aggregate by week
        // Otherwise show daily data
        if (daysDiff > 90 || timeData.length > 50) {
          processedData = aggregateByMonth(timeData);
        } else {
          processedData = [...timeData].sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
        }
      } else {
        // Default: if more than 50 points, aggregate by month
        processedData = timeData.length > 50 
          ? aggregateByMonth(timeData)
          : [...timeData].sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
      }

      return {
        x: processedData.map(item => item.date),
        y: processedData.map(item => item.metricValue),
        type: effectiveChartType,
        mode: 'lines+markers',
        name: selectedMetric,
        line: { color: theme.colors.electricCyan, width: 3 },
        marker: { 
          size: 6, 
          color: theme.colors.electricCyan, 
          line: { color: theme.colors.midnight, width: 1} // Added border to markers
        },
        fill: effectiveChartType === 'area' ? 'tozeroy' : 'none',
        fillcolor: effectiveChartType === 'area' ? hexToRgba(theme.colors.electricCyan, 0.3) : undefined,
        hoverinfo: 'x+y',
      };
    } else { // Categorical bar chart
      const aggregated = data.reduce((acc, item) => {
        const key = item.dimension;
        if (!acc[key]) {
          acc[key] = 0;
        }
        acc[key] += item.metricValue;
        return acc;
      }, {} as Record<string, number>);

      let categories = Object.keys(aggregated);
      // Sort categories by performance (descending)
      categories.sort((a, b) => aggregated[b] - aggregated[a]);
      
      // Limit to top 20 categories to prevent browser crash
      const MAX_CATEGORIES = 20;
      if (categories.length > MAX_CATEGORIES) {
        // Keep top performers and group the rest as "Others"
        const topCategories = categories.slice(0, MAX_CATEGORIES - 1);
        const othersValue = categories.slice(MAX_CATEGORIES - 1)
          .reduce((sum, cat) => sum + aggregated[cat], 0);
        
        categories = [...topCategories, 'Others'];
        aggregated['Others'] = othersValue;
      }
      
      const metricValues = categories.map(cat => aggregated[cat]);

      // Determine bar colors based on performance gradient
      // Low: #5fd4d6, Medium: #00e0ff, High: #e930ff
      const minVal = Math.min(...metricValues);
      const maxVal = Math.max(...metricValues);
      const range = maxVal - minVal;

      const barColors = metricValues.map(value => {
        if (range === 0) return theme.colors.electricCyan; // Single color if all values are same
        const normalizedValue = (value - minVal) / range;
        if (normalizedValue < 0.33) return '#5fd4d6'; // Low performance
        if (normalizedValue < 0.66) return theme.colors.electricCyan; // Medium performance
        return '#e930ff'; // High performance
      });

      return {
        y: categories, // Dimension values for Y-axis (horizontal bar)
        x: metricValues, // Metric values for X-axis (horizontal bar)
        type: 'bar',
        orientation: 'h',
        name: selectedMetric,
        marker: { 
          color: barColors,
          line: { color: theme.colors.midnight, width: 1 } // Added border to bars
        },
        hoverinfo: 'y+x',
      };
    }
  }, [data, selectedDimension, selectedMetric, chartType, theme]);

  const renderChart = () => {
    if (loading) {
      return <div style={{ color: theme.colors.cloudWhite, textAlign: 'center', padding: theme.spacing[4], height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Chart Data...</div>;
    }
    if (!processedChartTrace) {
      return <div style={{ color: theme.colors.cloudWhite, textAlign: 'center', padding: theme.spacing[4], height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No data available for {selectedMetric} by {selectedDimension}.</div>;
    }
    
    const plotData = [processedChartTrace];
    const effectiveChartType = selectedDimension === 'time' && chartType === 'bar' ? 'line' : chartType;

    const layout = {
      height: 400,
      autosize: true,
      plot_bgcolor: theme.colors.graphiteDark,
      paper_bgcolor: theme.colors.graphiteDark,
      font: {
        color: theme.colors.cloudWhite,
        family: 'Inter, sans-serif' // Ensuring consistent futuristic font
      },
      xaxis: {
        title: (effectiveChartType === 'bar' && selectedDimension !== 'time') ? 
               (selectedMetric ? selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1) : 'Value') :
               (selectedDimension === 'time' ? 'Date' : (selectedDimension ? selectedDimension.charAt(0).toUpperCase() + selectedDimension.slice(1) : 'Dimension')),
        automargin: true,
        gridcolor: hexToRgba(theme.colors.graphite, 0.3), // Subtle grid lines
        zerolinecolor: hexToRgba(theme.colors.graphite, 0.5),
        zerolinewidth: 1,
        linecolor: theme.colors.graphite, // Axis line
        linewidth: 1,
        tickangle: (effectiveChartType !== 'bar' || selectedDimension === 'time') && processedChartTrace.x && processedChartTrace.x.length > 10 ? 45 : 0,
        titlefont: { size: 14 },
        tickfont: { size: 12 }
      },
      yaxis: {
        title: (effectiveChartType === 'bar' && selectedDimension !== 'time') ?
               (selectedDimension ? selectedDimension.charAt(0).toUpperCase() + selectedDimension.slice(1) : 'Dimension') :
               (selectedMetric ? selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1) : 'Value'),
        gridcolor: hexToRgba(theme.colors.graphite, 0.3), // Subtle grid lines
        zerolinecolor: hexToRgba(theme.colors.graphite, 0.5),
        zerolinewidth: 1,
        linecolor: theme.colors.graphite, // Axis line
        linewidth: 1,
        automargin: true,
        dtick: (effectiveChartType === 'bar' && selectedDimension !== 'time' && processedChartTrace.y && processedChartTrace.y.length > 15) ? 1 : undefined, // Show all ticks if many categories
        titlefont: { size: 14 },
        tickfont: { size: 12 }
      },
      margin: { l: (effectiveChartType === 'bar' && selectedDimension !== 'time' && processedChartTrace.y && processedChartTrace.y.length > 0 && String(processedChartTrace.y[0]).length > 10) ? 180 : ((effectiveChartType === 'bar' && selectedDimension !== 'time') ? 150 : 70) , r: 30, b: 70, t: 50, pad: 5 }, // Adjusted left margin for long labels
      showlegend: plotData.length > 1 && (effectiveChartType === 'line' || effectiveChartType === 'area'), // Show legend for multi-trace line/area
      legend: {
        bgcolor: hexToRgba(theme.colors.midnight, 0.7),
        bordercolor: theme.colors.graphite,
        borderwidth: 1,
        font: { size: 12 }
      },
      hoverlabel: { // Custom hover label style
        bgcolor: theme.colors.midnight,
        bordercolor: theme.colors.electricCyan,
        font: { color: theme.colors.cloudWhite, size: 13, family: 'Inter, sans-serif' }
      },
      // Potentially add modebar styling if not fully disabled
      // modebar: { bgcolor: 'transparent', color: theme.colors.electricCyan, activecolor: theme.colors.signalMagenta }
    };

    return (
      <Plot
        data={plotData as any} 
        layout={layout as any}
        style={{ width: '100%', height: '100%' }}
        config={{ displayModeBar: false }}
      />
    );
  };

  const renderSummary = () => {
    if (!summaryData) return null;
    return (
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: theme.spacing[2], background: theme.colors.graphite, borderRadius: '4px', marginTop: theme.spacing[2] }}>
        <div style={{textAlign: 'center', color: theme.colors.cloudWhite}}><span style={{opacity: 0.7}}>Total {selectedMetric}:</span> {summaryData.total}</div>
        <div style={{textAlign: 'center', color: theme.colors.cloudWhite}}><span style={{opacity: 0.7}}>vs. Prev Period:</span> {summaryData.periodComparison}</div>
        {summaryData.contribution && <div style={{textAlign: 'center', color: theme.colors.cloudWhite}}><span style={{opacity: 0.7}}>Contribution:</span> {summaryData.contribution}</div>}
        {summaryData.topPerformerName && <div style={{textAlign: 'center', color: theme.colors.cloudWhite}}><span style={{opacity: 0.7}}>{summaryData.topPerformerLabel || 'Top Performer'}:</span> {summaryData.topPerformerName}</div>}
      </div>
    );
  }

  return (
    <Card 
      elevation="md" 
      style={{
        padding: theme.spacing[3],
        background: theme.colors.midnight, // Consistent with FilterControls Card
        height: '100%' // Fill GridItem
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[2] }}>
        <h3 style={{ color: theme.colors.cloudWhite, margin: 0, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>Performance Overview</h3>
        {onChartTypeChange && (
          <div style={{display: 'flex', gap: theme.spacing[1]}}>
            {(['bar', 'line', 'area'] as const).map(type => (
              <Button 
                key={type} 
                variant={chartType === type ? 'primary' : 'outline'} 
                onClick={() => onChartTypeChange(type)}
                size="sm"
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        )}
      </div>
      {renderChart()}
      {renderSummary()} 
      {/* Secondary metrics row placeholder if needed based on spec section 4.1 */}
    </Card>
  );
}; 