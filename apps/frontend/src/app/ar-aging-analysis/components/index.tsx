import React, { useMemo } from 'react';
import { KPIRow, getShiftClickManager } from 'components/index';

// Export filters
export { ARAgingFilters } from './ARAgingFilters';

export function ARAgingKPIs({ metrics, loading }: { metrics: any; loading?: boolean }) {
  const shiftClickManager = getShiftClickManager();

  // Map status to color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return '#10b981'; // green
      case 'warning': return '#f59e0b'; // amber
      case 'critical': return '#ef4444'; // red
      default: return '#8b5cf6'; // purple
    }
  };

  const getTrendValue = (kpi: any) => {
    if (kpi?.trend === 'up') return Math.abs(kpi?.change || 0);
    if (kpi?.trend === 'down') return -Math.abs(kpi?.change || 0);
    return 0;
  };

  const kpis = useMemo(() => {
    return [
      {
        id: "total-ar",
        title: 'Total A/R',
        value: metrics?.totalAR?.value || 0,
        format: "currency" as const,
        subtitle: 'Outstanding receivables',
        trend: getTrendValue(metrics?.totalAR),
        color: getStatusColor(metrics?.totalAR?.status || 'good')
      },
      {
        id: "days-sales-outstanding",
        title: 'Days Sales Outstanding',
        value: metrics?.dso?.value || 0,  // Raw number
        format: "number" as const,
        subtitle: 'Average collection time',
        trend: getTrendValue(metrics?.dso),
        color: getStatusColor(metrics?.dso?.status || 'good')
      },
      {
        id: "overdue-amount",
        title: 'Overdue Amount',
        value: metrics?.overdueAmount?.value || 0,  // Raw number
        format: "currency" as const,
        subtitle: 'Past due receivables',
        trend: getTrendValue(metrics?.overdueAmount),
        color: getStatusColor(metrics?.overdueAmount?.status || 'warning')
      },
      {
        id: "collection-efficiency",
        title: 'Collection Efficiency',
        value: metrics?.collectionEfficiency?.value || 0,  // Raw number
        format: "percentage" as const,
        subtitle: 'Current / Total AR',
        trend: getTrendValue(metrics?.collectionEfficiency),
        color: getStatusColor(metrics?.collectionEfficiency?.status || 'good')
      },
      {
        id: "high-risk-exposure",
        title: 'High Risk Exposure',
        value: metrics?.riskExposure?.value || 0,  // Raw number
        format: "currency" as const,
        subtitle: '90+ days overdue',
        trend: getTrendValue(metrics?.riskExposure),
        color: getStatusColor(metrics?.riskExposure?.status || 'good')
      }
    ];
  }, [metrics]);

  return (
    <KPIRow
      kpis={kpis}
      columns={5}
      animationDelay={50}
      onKPIShiftClick={(kpi, event) => {
        // Format the value based on the KPI format type
        let formattedValue = '';
        if (kpi.format === 'currency') {
          formattedValue = `$${kpi.value.toLocaleString()}`;
        } else if (kpi.format === 'percentage') {
          formattedValue = `${kpi.value.toFixed(1)}%`;
        } else if (kpi.format === 'number') {
          formattedValue = kpi.value.toLocaleString();
        } else {
          formattedValue = kpi.value.toString();
        }

        shiftClickManager.addPoint({
          label: kpi.title,
          value: formattedValue,
          source: 'AR Aging KPIs'
        }, event.nativeEvent);
      }}
    />
  );
}

// Export visualization components
export { NPVPortfolioChart } from './visualizations/NPVPortfolioChart';
export { CustomerMatrix } from './visualizations/CustomerMatrix';
export { CollectionForecast } from './visualizations/CollectionForecast';
export { RiskHeatmap } from './visualizations/RiskHeatmap';
export { AgingTable } from './visualizations/AgingTable';
