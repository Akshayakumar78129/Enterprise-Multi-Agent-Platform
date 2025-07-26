import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { GrowthRateVisualizerProps, THEME } from '../../types';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

// Dynamic import for Plotly
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const GrowthRateVisualizer: React.FC<GrowthRateVisualizerProps> = ({
  data,
  isLoading = false,
  timePeriod,
  onTimePeriodChange
}) => {
  const chartData = useMemo(() => {
    if (!data?.length) return null;

    // Bar chart for growth rates
    const growthBars = {
      x: data.map(d => d.period),
      y: data.map(d => d.growth_rate),
      type: 'bar',
      name: 'Growth Rate',
      marker: {
        color: data.map(d => d.growth_rate >= 0 ? THEME.colors.electricCyan : THEME.colors.signalMagenta)
      }
    };

    // Line for average growth rate
    const avgLine = {
      x: data.map(d => d.period),
      y: Array(data.length).fill(data[0].avg_growth_rate),
      type: 'scatter',
      mode: 'lines',
      name: 'Average Growth',
      line: {
        color: THEME.colors.cloudWhite,
        width: 2,
        dash: 'dash'
      }
    };

    return [growthBars, avgLine];
  }, [data]);

  const layout = {
    width: THEME.dimensions.growthRateVisualizer.width,
    height: THEME.dimensions.growthRateVisualizer.height,
    paper_bgcolor: THEME.colors.midnightNavy,
    plot_bgcolor: THEME.colors.midnightNavy,
    margin: { t: 40, r: 20, b: 40, l: 60 },
    title: {
      text: 'Growth Rate Analysis',
      font: {
        color: THEME.colors.cloudWhite,
        size: 16
      }
    },
    xaxis: {
      title: {
        text: 'Period',
        font: {
          color: THEME.colors.cloudWhite
        }
      },
      showgrid: true,
      gridcolor: THEME.colors.lightGraphite,
      gridwidth: 1,
      tickfont: {
        color: THEME.colors.cloudWhite
      }
    },
    yaxis: {
      title: {
        text: 'Growth Rate (%)',
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
      tickformat: '.1%'
    },
    showlegend: true,
    legend: {
      font: {
        color: THEME.colors.cloudWhite
      },
      bgcolor: 'rgba(0,0,0,0)'
    },
    bargap: 0.3
  };

  const config = {
    responsive: true,
    displayModeBar: false
  };

  // Summary metrics
  const metrics = useMemo(() => {
    if (!data?.length) return null;

    return [
      {
        label: 'Average Growth',
        value: data[0].avg_growth_rate,
        formatter: formatPercentage
      },
      {
        label: 'Highest Growth',
        value: data[0].max_growth_rate,
        formatter: formatPercentage
      },
      {
        label: 'Lowest Growth',
        value: data[0].min_growth_rate,
        formatter: formatPercentage
      },
      {
        label: 'Latest Growth',
        value: data[data.length - 1].growth_rate,
        formatter: formatPercentage
      }
    ];
  }, [data]);

  if (!data?.length && !isLoading) {
    return (
      <Card title="Growth Rate Analysis" isLoading={isLoading}>
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
      title="Growth Rate Analysis"
      isLoading={isLoading}
      style={{
        backgroundColor: THEME.colors.midnightNavy,
        borderRadius: '12px',
        padding: '16px'
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {metrics?.map((metric, index) => (
          <div
            key={index}
            style={{
              backgroundColor: THEME.colors.graphite,
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center'
            }}
          >
            <div style={{ color: THEME.colors.cloudWhite, fontSize: '14px', marginBottom: '8px' }}>
              {metric.label}
            </div>
            <div
              style={{
                color: metric.value >= 0 ? THEME.colors.electricCyan : THEME.colors.signalMagenta,
                fontSize: '24px',
                fontWeight: 'bold'
              }}
            >
              {metric.formatter(metric.value)}
            </div>
          </div>
        ))}
      </div>

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

export default GrowthRateVisualizer; 