import React from "react";
import { KpiTile } from "../../../../../../ui-common/design-system/components/KpiTile";

const PerformanceKPITiles = ({ kpis, isLoading = false }) => {
  if (!kpis) return null;

  // Helper function to determine variant based on performance
  const getDeviationVariant = (deviation) => {
    if (deviation < 50) return "success";  // Low deviation is good
    if (deviation < 100) return "warning"; // Medium deviation
    return "danger"; // High deviation
  };

  const getExplanationVariant = (power) => {
    if (power >= 80) return "success";   // High explanation power
    if (power >= 60) return "warning";   // Medium explanation power
    return "danger"; // Low explanation power
  };

  const getAnomalyVariant = (count) => {
    if (count < 10) return "success";    // Few anomalies
    if (count < 25) return "warning";    // Some anomalies
    return "danger"; // Many anomalies
  };

  const getTrendVariant = (trend) => {
    if (trend === 'improving') return "success";
    if (trend === 'stable') return "default";
    return "warning";
  };

  const tiles = [
    {
      label: "Average Deviation",
      value: kpis.averageDeviation || 0,
      formatter: (val) => val.toFixed(2),
      subtitle: "vs Expected",
      variant: getDeviationVariant(kpis.averageDeviation || 0),
      icon: "📊",
      trend: kpis.averageDeviation > 0 ? 'up' : 'down',
      trendValue: `${Math.abs(kpis.averageDeviation || 0).toFixed(1)}%`
    },
    {
      label: "Explanation Power",
      value: kpis.explanationPower || 0,
      formatter: (val) => `${val.toFixed(1)}%`,
      subtitle: "Model Accuracy",
      variant: getExplanationVariant(kpis.explanationPower || 0),
      icon: "🎯",
      progress: {
        value: kpis.explanationPower || 0,
        max: 100,
        color: kpis.explanationPower >= 80 ? "#00e0ff" : 
               kpis.explanationPower >= 60 ? "#ffa500" : "#e930ff"
      }
    },
    {
      label: "Anomaly Count",
      value: kpis.anomalyCount || 0,
      formatter: (val) => val.toLocaleString(),
      subtitle: "Significant Deviations",
      variant: getAnomalyVariant(kpis.anomalyCount || 0),
      icon: "⚠️",
      sparkline: generateAnomalySparkline(kpis.anomalyCount || 0)
    },
    {
      label: "Top Factor",
      value: formatFactorName(kpis.topFactor || "unknown"),
      formatter: (val) => val,
      subtitle: "Primary Influence",
      variant: "default",
      icon: "🔍",
      displayValue: formatFactorName(kpis.topFactor || "unknown"),
      valueStyle: { fontSize: "16px", fontWeight: "600" }
    },
    {
      label: "Forecast Trend",
      value: kpis.forecastTrend || "stable",
      formatter: (val) => val.charAt(0).toUpperCase() + val.slice(1),
      subtitle: "Next 30 Days",
      variant: getTrendVariant(kpis.forecastTrend || "stable"),
      icon: getTrendIcon(kpis.forecastTrend || "stable"),
      arrow: getTrendArrow(kpis.forecastTrend || "stable")
    }
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "24px",
      }}
    >
      {tiles.map((tile, index) => (
        <KpiTile key={index} {...tile} isLoading={isLoading} />
      ))}
    </div>
  );
};

// Helper functions
function formatFactorName(factor) {
  // Convert snake_case to readable format
  return factor
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace('Is ', '')
    .replace('Condition ', '');
}

function getTrendIcon(trend) {
  switch (trend) {
    case 'improving': return "📈";
    case 'declining': return "📉";
    case 'stable': return "📊";
    default: return "📊";
  }
}

function getTrendArrow(trend) {
  switch (trend) {
    case 'improving': return "↗️";
    case 'declining': return "↘️";
    case 'stable': return "→";
    default: return "→";
  }
}

function generateAnomalySparkline(count) {
  // Generate simple sparkline data based on anomaly count
  const dataPoints = [];
  const baseValue = Math.max(1, count / 10);
  
  for (let i = 0; i < 12; i++) {
    const variation = (Math.random() - 0.5) * 0.4;
    dataPoints.push(Math.max(0, baseValue * (1 + variation)));
  }
  
  return dataPoints;
}

export default PerformanceKPITiles; 