"use client";

import React, { useMemo } from 'react';
import { DataTable, Skeleton, getShiftClickManager } from 'components/index';

interface HighCostItem {
  item_number: string;
  item_name: string;
  category: string;
  inventory_value: number;
  annual_holding_cost: number;
  total_holding_cost: number;
  holding_cost_pct: number;
  excessive_holding_cost: boolean;
  potential_savings: number;
}

interface HighCostItemsTableProps {
  data: HighCostItem[];
  loading?: boolean;
  maxItems?: number;
}

export function HighCostItemsTable({ data, loading = false, maxItems = 20 }: HighCostItemsTableProps) {
  const shiftClickManager = getShiftClickManager();

  // Normalize data for DataTable
  const rows = useMemo(() => {
    if (!data) return [];

    return (data || []).map((item: HighCostItem, index: number) => ({
      id: `${item.item_number}-${index}`,
      item_number: item.item_number,
      item_name: item.item_name,
      category: item.category || 'Unknown',
      inventory_value: item.inventory_value,
      total_holding_cost: item.total_holding_cost,
      holding_cost_pct: item.holding_cost_pct,
      potential_savings: item.potential_savings,
      excessive_holding_cost: item.excessive_holding_cost
    })).slice(0, maxItems);
  }, [data, maxItems]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const tableColumns = [
    {
      id: 'item_number',
      header: 'Item',
      accessor: 'item_number' as const,
      sortable: true
    },
    {
      id: 'category',
      header: 'Category',
      accessor: 'category' as const,
      sortable: true,
    },
    {
      id: 'inventory_value',
      header: 'Inventory Value',
      accessor: 'inventory_value' as const,
      sortable: true,
      render: (value: number) => formatCurrency(value)
    },
    {
      id: 'total_holding_cost',
      header: 'Holding Cost',
      accessor: 'total_holding_cost' as const,
      sortable: true,
      render: (value: number) => formatCurrency(value)
    },
    {
      id: 'holding_cost_pct',
      header: 'Cost %',
      accessor: 'holding_cost_pct' as const,
      sortable: true,
      render: (value: number) => (
        <span className={`text-sm font-semibold ${value > 0.3 ? 'text-red-500' : 'text-green-500'}`}>
          {(value * 100).toFixed(1)}%
        </span>
      )
    },
    {
      id: 'potential_savings',
      header: 'Potential Savings',
      accessor: 'potential_savings' as const,
      sortable: true,
      render: (value: number) => (
        <span className="text-accent font-semibold">{formatCurrency(value)}</span>
      )
    },
  ];

  if (loading) {
    return <Skeleton height={400} className="animate-pulse" />;
  }

  return (
    <div className="responsive-table">
      <DataTable
        data={rows}
        columns={tableColumns}
        searchable
        selectable={false}
        pageSize={10}
        onRowClick={(row, event) => {
          if (event?.shiftKey) {
            shiftClickManager.addPoint({
              label: `Item: ${row.item_number}`,
              value: `Cost: ${formatCurrency(row.total_holding_cost)} (${(row.holding_cost_pct * 100).toFixed(1)}%)`,
              source: 'High Cost Items Table'
            }, event.nativeEvent);
          }
        }}
      />
    </div>
  );
}
