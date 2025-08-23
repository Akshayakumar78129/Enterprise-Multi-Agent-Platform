import React from "react";
import { KpiTile } from "../../../../../../ui-common/design-system/components/KpiTile";
import styles from './TransactionKPITiles.module.css';

const TransactionKPITiles = ({ kpis, isLoading = false, onKPIClick = null }) => {
  if (!kpis) return null;

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatNumber = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  const formatHour = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const tiles = [
    {
      label: "Total Transactions",
      value: kpis.totalTransactions || 0,
      formatter: formatNumber,
      subtitle: `${formatCurrency(kpis.totalAmount || 0)} total value`,
      variant: "default",
      icon: "💳",
      trend: 8.5,
      trendDirection: "up",
      onClick: () => onKPIClick && onKPIClick('totalTransactions')
    },
    {
      label: "Anomaly Rate",
      value: kpis.anomalyRate || 0,
      formatter: (val) => `${val.toFixed(1)}%`,
      subtitle: "Unusual transactions detected",
      variant: kpis.anomalyRate > 10 ? "warning" : "default",
      icon: "⚠️",
      trend: -2.3,
      trendDirection: "down",
      onClick: () => onKPIClick && onKPIClick('anomalyRate')
    },
    {
      label: "Peak Hour",
      value: formatHour(kpis.peakHour || 12),
      subtitle: "Highest transaction volume",
      variant: "default",
      icon: "⏰",
      trend: 0,
      trendDirection: "neutral",
      onClick: () => onKPIClick && onKPIClick('peakHour')
    },
    {
      label: "Top Payment Method",
      value: kpis.topPaymentMethod || 'Standard',
      subtitle: `${(kpis.topPaymentPercentage || 0).toFixed(1)}% of all transactions`,
      variant: "default",
      icon: "💼",
      trend: 12.7,
      trendDirection: "up",
      onClick: () => onKPIClick && onKPIClick('topPaymentMethod')
    },
    {
      label: "Avg Transaction",
      value: kpis.avgAmount || 0,
      formatter: formatCurrency,
      subtitle: `Across ${formatNumber(kpis.uniqueCustomers || 0)} customers`,
      variant: "default",
      icon: "📊",
      trend: 5.8,
      trendDirection: "up",
      onClick: () => onKPIClick && onKPIClick('avgAmount')
    },
    {
      label: "Product Diversity",
      value: kpis.uniqueItems || 0,
      formatter: formatNumber,
      subtitle: "Unique items sold",
      variant: "default",
      icon: "📦",
      trend: 15.2,
      trendDirection: "up",
      onClick: () => onKPIClick && onKPIClick('uniqueItems')
    }
  ];

  return (
    <div className={styles['kpi-grid']}>
      {tiles.map((tile, index) => (
        <KpiTile 
          key={index}
          {...tile} 
          isLoading={isLoading}
          className={styles['kpi-tile-custom']}
        />
      ))}
    </div>
  );
};

export default TransactionKPITiles; 