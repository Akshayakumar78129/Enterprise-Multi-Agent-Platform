// Engagement Classifier Charts Component - Following churn pattern
import React from "react";
import {
  ChartCard,
  BarChart,
  LineChart,
  ScatterPlot,
  TreeMap,
  HeatMap,
  RadarChart,
  PieChart
} from "components";

interface EngagementClassifierChartsProps {
  data: any;
  loading: boolean;
  onDataPointClick?: (data: any, event: React.MouseEvent) => void;
}

export function EngagementClassifierCharts({ data, loading, onDataPointClick }: EngagementClassifierChartsProps) {

  const renderChart = (chartType: string, chartData: any, title: string) => {
    if (loading) {
      return (
        <ChartCard title={title} className="glass-card">
          <div className="h-64 flex items-center justify-center">
            <div className="text-muted">Loading...</div>
          </div>
        </ChartCard>
      );
    }

    // Select appropriate chart component based on type
    switch (chartType) {
      case "bar":
        return (
          <ChartCard title={title} className="glass-card card-hover">
            <BarChart
              data={chartData || []}
              height={300}
              onClick={onDataPointClick}
            />
          </ChartCard>
        );

      case "line":
        return (
          <ChartCard title={title} className="glass-card card-hover">
            <LineChart
              data={chartData || []}
              height={300}
              onClick={onDataPointClick}
            />
          </ChartCard>
        );

      case "scatter":
        return (
          <ChartCard title={title} className="glass-card card-hover">
            <ScatterPlot
              data={chartData || []}
              height={300}
              onClick={onDataPointClick}
            />
          </ChartCard>
        );

      case "treemap":
        return (
          <ChartCard title={title} className="glass-card card-hover">
            <TreeMap
              data={chartData || []}
              height={300}
              onClick={onDataPointClick}
            />
          </ChartCard>
        );

      case "heatmap":
        return (
          <ChartCard title={title} className="glass-card card-hover">
            <HeatMap
              data={chartData || []}
              height={300}
              onClick={onDataPointClick}
            />
          </ChartCard>
        );

      case "radar":
        return (
          <ChartCard title={title} className="glass-card card-hover">
            <RadarChart
              data={chartData || []}
              height={300}
            />
          </ChartCard>
        );

      case "pie":
        return (
          <ChartCard title={title} className="glass-card card-hover">
            <PieChart
              data={chartData || []}
              height={300}
              onClick={onDataPointClick}
            />
          </ChartCard>
        );

      default:
        return (
          <ChartCard title={title} className="glass-card card-hover">
            <div className="h-64 flex items-center justify-center">
              <div className="text-muted">No data available</div>
            </div>
          </ChartCard>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
      {renderChart("bar", data.engagementmatrixData, "Engagementmatrix")}
      {renderChart("line", data.activityheatmapData, "Activityheatmap")}
      {renderChart("scatter", data.channeldistributionData, "Channeldistribution")}
      {renderChart("treemap", data.engagementflowData, "Engagementflow")}
    </div>
  );
}
