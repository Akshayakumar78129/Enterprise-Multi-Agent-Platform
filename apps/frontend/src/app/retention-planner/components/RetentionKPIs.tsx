import React from 'react';
import { Card } from 'components/index';

interface RetentionKPIsProps {
  data: {
    totalCustomers?: number;
    retentionRate?: number;
    atRiskCount?: number;
    atRiskValue?: number;
    interventionSuccess?: number;
    costSavings?: number;
    highRiskSegments?: number;
    activeCustomers?: number;
  };
  loading?: boolean;
  onKPIShiftClick?: (kpi: { label: string; value: string; sublabel: string }, event: React.MouseEvent) => void;
}

export function RetentionKPIs({ data, loading, onKPIShiftClick }: RetentionKPIsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-2" />
              <div className="h-8 bg-muted rounded w-16" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Helper function to format large numbers
  const formatLargeNumber = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    } else {
      return `$${value.toFixed(0)}`;
    }
  };

  const kpis = [
    {
      label: 'Retention Rate',
      value: data?.retentionRate != null ? `${data.retentionRate.toFixed(1)}%` : 'N/A',
      sublabel: `${data?.activeCustomers || 0} active`,
      trend: data?.retentionRate && data.retentionRate > 70 ? 'positive' : 'negative'
    },
    {
      label: 'At-Risk Customers',
      value: (data?.atRiskCount || 0).toLocaleString(),
      sublabel: `${formatLargeNumber(data?.atRiskValue || 0)} value`,
      trend: 'negative'
    },
    {
      label: 'Intervention Success',
      value: data?.interventionSuccess != null ? `${data.interventionSuccess.toFixed(0)}%` : 'N/A',
      sublabel: 'Historical rate',
      trend: 'positive'
    },
    {
      label: 'Projected Savings',
      value: formatLargeNumber(data?.costSavings || 0),
      sublabel: 'From interventions',
      trend: 'positive'
    }
  ];

  const handleKPIClick = (kpi: typeof kpis[0], event: React.MouseEvent) => {
    if (event.shiftKey && onKPIShiftClick) {
      onKPIShiftClick(kpi, event);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <Card
          key={index}
          className="p-6 cursor-pointer transition-all hover:shadow-lg"
          onClick={(e) => handleKPIClick(kpi, e)}
        >
          <div className="flex flex-col">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              {kpi.label}
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">
              {kpi.value}
            </div>
            <div className="text-xs text-muted-foreground">
              {kpi.sublabel}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
