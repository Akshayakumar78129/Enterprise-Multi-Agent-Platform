import React, { useMemo } from 'react';
import {
  BarChart,
  ChartCard,
  useChartTooltip,
  Skeleton,
  AIFeatureImportance
} from 'components';
import { CustomTooltip } from './CustomTooltip';

interface FeatureImportanceChartProps {
  data: any;
  selectedKPI?: string;
  loading?: boolean;
}

export function FeatureImportanceChart({
  data,
  selectedKPI,
  loading
}: FeatureImportanceChartProps) {
  const { tooltipData, showTooltip, hideTooltip } = useChartTooltip();

  // Get feature importance data
  const importanceData = selectedKPI && data?.byKPI?.[selectedKPI]?.feature_importance
    ? data.byKPI[selectedKPI].feature_importance
    : data?.aggregated || [];

  // Prepare formatted data for AIFeatureImportance (must be before conditional returns)
  const formattedData = useMemo(() => {
    if (importanceData.length > 0 && importanceData[0].feature &&
        (importanceData[0].importance !== undefined || importanceData[0].avg_importance !== undefined)) {
      return importanceData.slice(0, 10).map((item: any) => ({
        name: item.feature.replace(/_/g, ' '),
        feature: item.feature,
        importance: (item.importance || item.avg_importance) * 100,
        impact: (item.importance || item.avg_importance) * 100
      }));
    }
    return null;
  }, [importanceData]);

  // Prepare chart data for BarChart fallback
  const chartData = useMemo(() => {
    if (!importanceData.length) {
      return { labels: [], datasets: [] };
    }

    const top10 = importanceData.slice(0, 10);

    return {
      labels: top10.map((item: any) => item.feature),
      datasets: [{
        label: 'Importance',
        data: top10.map((item: any) => (item.importance || item.avg_importance || 0) * 100),
        backgroundColor: 'rgba(0, 224, 255, 0.8)',
        borderColor: 'rgb(0, 224, 255)',
        borderWidth: 1
      }]
    };
  }, [importanceData]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false,
        external: (context: any) => {
          const { chart, tooltip } = context;
          if (tooltip.opacity === 0) {
            hideTooltip();
            return;
          }

          const position = chart.canvas.getBoundingClientRect();
          const x = position.left + window.pageXOffset + tooltip.caretX;
          const y = position.top + window.pageYOffset + tooltip.caretY;

          showTooltip(
            x,
            y,
            tooltip.title?.[0] || '',
            [{
              label: 'Importance',
              value: `${tooltip.dataPoints?.[0]?.raw?.toFixed(1)}%`,
              color: 'rgb(0, 224, 255)'
            }]
          );
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Importance (%)'
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        border: {
          display: false
        }
      },
      y: {
        grid: {
          display: false,
          drawBorder: false
        },
        border: {
          display: false
        }
      }
    }
  }), [showTooltip, hideTooltip]);

  // Loading state - AFTER all hooks
  if (loading) {
    return (
      <ChartCard className="glass-card card-hover">
        <Skeleton height={400} />
      </ChartCard>
    );
  }

  // If we have the proper format for AIFeatureImportance component, use it
  if (formattedData) {
    return (
      <ChartCard
        title="Feature Importance"
        className="glass-card card-hover"
      >
        <AIFeatureImportance
          data={formattedData}
          title=""
        />
      </ChartCard>
    );
  }

  // Fallback to BarChart if AIFeatureImportance format doesn't match
  return (
    <ChartCard
      title="Feature Importance"
      className="glass-card card-hover"
    >
      <div style={{ height: 350 }}>
        <BarChart
          data={chartData}
          options={chartOptions}
          height={350}
        />
      </div>

      {/* Custom Tooltip */}
      <CustomTooltip
        x={tooltipData.x}
        y={tooltipData.y}
        title={tooltipData.title}
        items={tooltipData.items}
        visible={tooltipData.visible}
      />
    </ChartCard>
  );
}