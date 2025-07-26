import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { SeasonalPatternAnalyzerProps, THEME } from '../../types';
import { formatCurrency } from '../../utils/formatters';

// Dynamic import for Plotly
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const SeasonalPatternAnalyzer: React.FC<SeasonalPatternAnalyzerProps> = ({
  data,
  isLoading = false,
  timePeriod,
  onTimePeriodChange
}) => {
  const chartData = useMemo(() => {
    if (!data?.length) return null;

    // Group data by year
    const yearGroups = data.reduce((acc, point) => {
      if (!acc[point.year]) {
        acc[point.year] = [];
      }
      acc[point.year].push(point);
      return acc;
    }, {} as Record<string, typeof data>);

    // Create a trace for each year
    const traces = Object.entries(yearGroups).map(([year, points]) => ({
      x: points.map(p => p.month),
      y: points.map(p => p.revenue),
      type: 'scatter',
      mode: 'lines+markers',
      name: year,
      line: {
        color: year === new Date().getFullYear().toString() 
          ? THEME.colors.electricCyan 
          : THEME.colors.signalMagenta,
        width: year === new Date().getFullYear().toString() ? 3 : 2
      },
      marker: {
        size: 6
      }
    }));

    // Calculate average seasonal pattern
    const monthlyAverages = Array.from({ length: 12 }, (_, month) => {
      const monthStr = String(month + 1).padStart(2, '0');
      const monthData = data.filter(p => p.month === monthStr);
      return {
        month: monthStr,
        revenue: monthData.reduce((sum, p) => sum + p.revenue, 0) / monthData.length
      };
    });

    // Add average trace
    traces.push({
      x: monthlyAverages.map(m => m.month),
      y: monthlyAverages.map(m => m.revenue),
      type: 'scatter',
      mode: 'lines',
      name: 'Average Pattern',
      line: {
        color: THEME.colors.cloudWhite,
        width: 2,
        dash: 'dash'
      }
    });

    return traces;
  }, [data]);

  const layout = {
    width: THEME.dimensions.seasonalPatternAnalyzer.width,
    height: THEME.dimensions.seasonalPatternAnalyzer.height,
    paper_bgcolor: THEME.colors.midnightNavy,
    plot_bgcolor: THEME.colors.midnightNavy,
    margin: { t: 40, r: 20, b: 40, l: 60 },
    title: {
      text: 'Seasonal Sales Pattern',
      font: {
        color: THEME.colors.cloudWhite,
        size: 16
      }
    },
    xaxis: {
      title: {
        text: 'Month',
        font: {
          color: THEME.colors.cloudWhite
        }
      },
      showgrid: true,
      gridcolor: THEME.colors.lightGraphite,
      gridwidth: 1,
      tickfont: {
        color: THEME.colors.cloudWhite
      },
      tickmode: 'array',
      ticktext: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      tickvals: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
    },
    yaxis: {
      title: {
        text: 'Revenue',
        font: {
          color: THEME.colors.cloudWhite
        }
      },
      showgrid: true,
      gridcolor: THEME.colors.lightGraphite,
      gridwidth: 1,
      tickfont: {
        color: THEME.colors.cloudWhite
      },
      tickformat: '$,.0f'
    },
    showlegend: true,
    legend: {
      font: {
        color: THEME.colors.cloudWhite
      },
      bgcolor: 'rgba(0,0,0,0)'
    }
  };

  const config = {
    responsive: true,
    displayModeBar: false
  };

  if (!data?.length && !isLoading) {
    return (
      <Card title="Seasonal Pattern Analyzer" isLoading={isLoading}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '300px',
            color: THEME.colors.cloudWhite
          }}
        >
          No data available
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Seasonal Pattern Analyzer"
      isLoading={isLoading}
      style={{
        backgroundColor: THEME.colors.midnightNavy,
        borderRadius: '12px',
        padding: '16px'
      }}
    >
      {chartData && (
        <Plot
          data={chartData}
          layout={layout}
          config={config}
        />
      )}
    </Card>
  );
};

export default SeasonalPatternAnalyzer; 