import React from 'react';
import { AnimatedKPITile } from 'components/index';
import { DollarSign, Calendar, AlertTriangle, TrendingUp, Shield } from 'lucide-react';

// Export filters
export { ARAgingFilters } from './ARAgingFilters';

export function ARAgingKPIs({ metrics, loading }: { metrics: any; loading?: boolean }) {
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

  const kpis = [
    {
      title: 'Total A/R',
      value: metrics?.totalAR?.formatted_value || '$0',
      subtitle: 'Outstanding receivables',
      icon: DollarSign,
      trend: getTrendValue(metrics?.totalAR),
      color: getStatusColor(metrics?.totalAR?.status || 'good')
    },
    {
      title: 'Days Sales Outstanding',
      value: metrics?.dso?.formatted_value || '0 days',
      subtitle: 'Average collection time',
      icon: Calendar,
      trend: getTrendValue(metrics?.dso),
      color: getStatusColor(metrics?.dso?.status || 'good')
    },
    {
      title: 'Overdue Amount',
      value: metrics?.overdueAmount?.formatted_value || '$0',
      subtitle: 'Past due receivables',
      icon: AlertTriangle,
      trend: getTrendValue(metrics?.overdueAmount),
      color: getStatusColor(metrics?.overdueAmount?.status || 'warning')
    },
    {
      title: 'Collection Efficiency',
      value: metrics?.collectionEfficiency?.formatted_value || '0%',
      subtitle: 'Current / Total AR',
      icon: TrendingUp,
      trend: getTrendValue(metrics?.collectionEfficiency),
      color: getStatusColor(metrics?.collectionEfficiency?.status || 'good')
    },
    {
      title: 'High Risk Exposure',
      value: metrics?.riskExposure?.formatted_value || '$0',
      subtitle: '90+ days overdue',
      icon: Shield,
      trend: getTrendValue(metrics?.riskExposure),
      color: getStatusColor(metrics?.riskExposure?.status || 'good')
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {kpis.map((kpi, index) => (
        <AnimatedKPITile key={index} {...kpi} loading={loading} />
      ))}
    </div>
  );
}

// Export visualization components
export { NPVPortfolioChart } from './visualizations/NPVPortfolioChart';
export { CustomerMatrix } from './visualizations/CustomerMatrix';
export { CollectionForecast } from './visualizations/CollectionForecast';
export { RiskHeatmap } from './visualizations/RiskHeatmap';
export { AgingTable } from './visualizations/AgingTable';
