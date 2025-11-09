/**
 * Frequency Table Component
 * Customer details table
 */

import React from 'react';
import { DataTable, getShiftClickManager } from 'components/index';

interface FrequencyTableProps {
  data: Array<{
    customer_id: string;
    customer_name: string;
    purchase_count: number;
    avg_days_between_purchases: number;
    total_spent: number;
    frequency_segment: string;
    loyalty_status: string;
  }>;
  loading?: boolean;
}

export function FrequencyTable({ data, loading }: FrequencyTableProps) {
  const shiftClickManager = getShiftClickManager();

  const columns = [
    {
      id: 'customer_name',
      header: 'Customer Name',
      accessor: 'customer_name' as const,
      sortable: true,
    },
    {
      id: 'purchase_count',
      header: 'Purchase Count',
      accessor: 'purchase_count' as const,
      sortable: true,
    },
    {
      id: 'avg_days_between_purchases',
      header: 'Avg Days Between',
      accessor: 'avg_days_between_purchases' as const,
      sortable: true,
      render: (value: any) => value?.toFixed(1) || 'N/A',
    },
    {
      id: 'total_spent',
      header: 'Total Spent',
      accessor: 'total_spent' as const,
      sortable: true,
      render: (value: any) => `$${value?.toLocaleString() || 0}`,
    },
    {
      id: 'frequency_segment',
      header: 'Segment',
      accessor: 'frequency_segment' as const,
      sortable: true,
      render: (value: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'High' ? 'bg-green-500/20 text-green-400' :
          value === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {value}
        </span>
      ),
    },
    {
      id: 'loyalty_status',
      header: 'Loyalty',
      accessor: 'loyalty_status' as const,
      sortable: true,
      render: (value: any) => value || 'N/A',
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      loading={loading}
      searchable
      searchPlaceholder="Search customers..."
      onRowClick={(row, event) => {
        if (event?.shiftKey) {
          shiftClickManager.addPoint({
            label: row.customer_name,
            value: `${row.purchase_count} purchases, $${row.total_spent?.toLocaleString()}`,
            source: 'Purchase Frequency Table'
          }, event.nativeEvent);
        }
      }}
    />
  );
}
