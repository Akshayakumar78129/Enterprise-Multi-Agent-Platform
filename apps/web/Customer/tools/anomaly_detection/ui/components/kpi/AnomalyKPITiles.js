import React from 'react';
import { KpiTile } from '../../../../../../ui-common/design-system/components/KpiTile';

const AnomalyKPITiles = ({ kpis, isLoading = false }) => {
  if (!kpis) {
    return null;
  }

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (num) => {
    return `${(num || 0).toFixed(1)}%`;
  };

  const formatScore = (score) => {
    return (score || 0).toFixed(3);
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return '↗';
    if (trend < 0) return '↘';
    return '→';
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return '#e930ff'; // Signal Magenta for increasing anomalies
    if (trend < 0) return '#00e0ff'; // Electric Cyan for decreasing anomalies
    return '#5891cb'; // Blue for stable
  };

  const getAnomalyRateStatus = (rate) => {
    if (rate > 10) return 'critical';
    if (rate > 5) return 'warning';
    return 'normal';
  };

  const getSeverityStatus = (count) => {
    if (count > 50) return 'critical';
    if (count > 20) return 'warning';
    return 'normal';
  };

  const getTrendDirection = (trend, isGoodIncrease = false) => {
    if (trend > 0) return isGoodIncrease ? 'up-good' : 'up-bad';
    if (trend < 0) return isGoodIncrease ? 'down-bad' : 'down-good';
    return 'neutral';
  };

  const tiles = [
    {
      label: 'Anomaly Rate',
      value: kpis.anomalyRate || 0,
      formatter: formatPercentage,
      subtitle: 'Of total customers',
      trend: kpis.anomalyRateTrend ? `${kpis.anomalyRateTrend > 0 ? '+' : ''}${kpis.anomalyRateTrend.toFixed(1)}%` : null,
      trendDirection: getTrendDirection(kpis.anomalyRateTrend || 0, false),
      variant: getAnomalyRateStatus(kpis.anomalyRate || 0) === 'critical' ? 'anomaly' : 'default',
      icon: '📊'
    },
    {
      label: 'High Severity',
      value: kpis.highSeverityCount || 0,
      formatter: formatNumber,
      subtitle: 'Severity 4-5',
      variant: getSeverityStatus(kpis.highSeverityCount || 0) === 'critical' ? 'anomaly' : 'default',
      icon: '🚨'
    },
    {
      label: 'Top Feature',
      value: kpis.topAnomalousFeature || 'N/A',
      subtitle: 'Most frequent deviation',
      variant: 'default',
      icon: getFeatureIcon(kpis.topAnomalousFeature)
    },
    {
      label: 'Mean Score',
      value: kpis.meanAnomalyScore || 0,
      formatter: formatScore,
      subtitle: 'Average anomaly score',
      trend: kpis.meanAnomalyScoreTrend ? `${kpis.meanAnomalyScoreTrend > 0 ? '+' : ''}${kpis.meanAnomalyScoreTrend.toFixed(3)}` : null,
      trendDirection: getTrendDirection(kpis.meanAnomalyScoreTrend || 0, false),
      variant: kpis.meanAnomalyScore > 0.7 ? 'anomaly' : 'default',
      icon: '⚖️'
    },
    {
      label: 'New Anomalies',
      value: kpis.newAnomalies24h || 0,
      formatter: formatNumber,
      subtitle: 'Last 24h',
      variant: kpis.newAnomalies24h > 10 ? 'anomaly' : 'default',
      icon: '🔔'
    }
  ];

  function getFeatureIcon(featureName) {
    const iconMap = {
      'transactionCount': '📊',
      'totalAmount': '💰',
      'avgAmount': '💸',
      'daysSinceLastTransaction': '📅',
      'uniqueProducts': '📦',
      'avgDaysBetweenTransactions': '⏰'
    };
    return iconMap[featureName] || '📈';
  }

  function generateSparklineData() {
    // Generate sample sparkline data for new anomalies
    return Array.from({ length: 7 }, () => Math.floor(Math.random() * 15) + 2);
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {tiles.map((tile, index) => (
        <KpiTile
          key={index}
          label={tile.label}
          value={tile.value}
          formatter={tile.formatter}
          subtitle={tile.subtitle}
          trend={tile.trend}
          trendDirection={tile.trendDirection}
          variant={tile.variant}
          icon={tile.icon}
          isLoading={isLoading}
          onClick={() => handleTileClick(tile.label)}
        />
      ))}
    </div>
  );

  function handleTileClick(label) {
    // Handle KPI tile interactions
    console.log(`Clicked on ${label} tile`);
    // Could trigger filtering or detailed view
  }
};

export default AnomalyKPITiles; 