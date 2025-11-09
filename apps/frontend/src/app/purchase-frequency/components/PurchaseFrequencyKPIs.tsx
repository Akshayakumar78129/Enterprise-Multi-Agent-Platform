/**
 * Purchase Frequency KPIs Component
 */

import React, { useMemo } from 'react';
import { KPIRow, getShiftClickManager } from 'components/index';

interface PurchaseFrequencyKPIsProps {
  data: {
    total_customers: number;
    avg_frequency: number;
    high_frequency_customers: number;
    medium_frequency_customers: number;
    low_frequency_customers: number;
    total_revenue: number;
  };
  loading?: boolean;
}

export function PurchaseFrequencyKPIs({ data, loading }: PurchaseFrequencyKPIsProps) {
  const shiftClickManager = getShiftClickManager();

  console.log('PurchaseFrequencyKPIs - loading:', loading, 'data:', data);

  const kpis = useMemo(() => {
    console.log('PurchaseFrequencyKPIs - building KPIs with data:', data);
    return [
      {
        id: 'total-customers',
        title: 'Total Customers',
        value: data?.total_customers || 0,
        format: 'number' as const,
        color: '#3b82f6',
      },
      {
        id: 'avg-frequency',
        title: 'Avg Purchase Frequency',
        value: data?.avg_frequency || 0,
        format: 'number' as const,
        color: '#8b5cf6',
      },
      {
        id: 'high-frequency',
        title: 'High Frequency (10+)',
        value: data?.high_frequency_customers || 0,
        format: 'number' as const,
        color: '#10b981',
      },
      {
        id: 'medium-frequency',
        title: 'Medium Frequency (5-9)',
        value: data?.medium_frequency_customers || 0,
        format: 'number' as const,
        color: '#f59e0b',
      },
      {
        id: 'low-frequency',
        title: 'Low Frequency (<5)',
        value: data?.low_frequency_customers || 0,
        format: 'number' as const,
        color: '#ef4444',
      },
      {
        id: 'total-revenue',
        title: 'Total Revenue',
        value: data?.total_revenue || 0,
        format: 'currency' as const,
        color: '#06b6d4',
      },
    ];
  }, [data]);

  return (
    <KPIRow
      kpis={kpis}
      columns={6}
      animationDelay={50}
      onKPIShiftClick={(kpi, event) => {
        shiftClickManager.addPoint({
          label: kpi.title,
          value: typeof kpi.value === 'number' ? kpi.value.toString() : kpi.value,
          source: 'Purchase Frequency KPIs'
        }, event.nativeEvent);
      }}
    />
  );
}
