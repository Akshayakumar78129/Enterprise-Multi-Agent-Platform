import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { TimeSeriesExplorerProps, THEME, SalesDataPoint } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';

// Dynamic import for Plotly
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const TimeSeriesExplorer: React.FC<TimeSeriesExplorerProps> = ({
  data,
  isLoading = false,
  filters,
  onFilterChange,
  onDataPointClick
}) => {
  const chartData = useMemo(() => {
    if (!data?.length) return null;

    const formatValue = filters.metric === 'revenue' ? formatCurrency : formatNumber;
    
    // Main series
    const mainSeries = {
      x: data.map(d => d.period),
      y: data.map(d => d[filters.metric]),
      type: 'scatter',
      mode: 'lines+markers',
      name: filters.metric.toUpperCase(),
      line: {
        color: THEME.colors.electricCyan,
        width: 3
      },
      marker: {
        color: THEME.colors.electricCyan,
        size: 6
      }
    };

    // Moving average
    const windowSize = 3;
    const movingAvg = data.map((_, i) => {
      const start = Math.max(0, i - windowSize + 1);
      const window = data.slice(start, i + 1);
      return window.reduce((sum, d) => sum + d[filters.metric], 0) / window.length;
    });

    const movingAvgSeries = {
      x: data.map(d => d.period),
      y: movingAvg,
      type: 'scatter',
      mode: 'lines',
      name: 'Moving Average',
      line: {
        color: THEME.colors.cloudWhite,
        width: 2,
        dash: 'dash'
      }
    };

    return [mainSeries, movingAvgSeries];
  }, [data, filters.metric]);

  const layout = {
    width: THEME.dimensions.timeSeriesExplorer.width,
    height: THEME.dimensions.timeSeriesExplorer.height,
    paper_bgcolor: THEME.colors.midnightNavy,
    plot_bgcolor: THEME.colors.midnightNavy,
    margin: { t: 40, r: 20, b: 40, l: 60 },
    title: {
      text: `${filters.metric.toUpperCase()} Over Time`,
      font: {
        color: THEME.colors.cloudWhite,
        size: 16
      }
    },
    xaxis: {
      title: 'Period',
      showgrid: true,
      gridcolor: THEME.colors.lightGraphite,
      gridwidth: 1,
      tickfont: {
        color: THEME.colors.cloudWhite
      }
    },
    yaxis: {
      title: filters.metric.toUpperCase(),
      showgrid: true,
      gridcolor: THEME.colors.lightGraphite,
      gridwidth: 1,
      tickfont: {
        color: THEME.colors.cloudWhite
      },
      tickformat: filters.metric === 'revenue' ? '$,.0f' : ',d'
    },
    showlegend: true,
    legend: {
      font: {
        color: THEME.colors.cloudWhite
      }
    }
  };

  const config = {
    responsive: true,
    displayModeBar: false
  };

  if (!data?.length && !isLoading) {
    return (
      <Card title="Time Series Explorer" isLoading={isLoading}>
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
      title="Time Series Explorer"
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
          onClick={(e) => {
            if (onDataPointClick && e.points?.[0]) {
              const point = data[e.points[0].pointIndex];
              onDataPointClick(point);
            }
          }}
        />
      )}
    </Card>
  );
};

export default TimeSeriesExplorer; 