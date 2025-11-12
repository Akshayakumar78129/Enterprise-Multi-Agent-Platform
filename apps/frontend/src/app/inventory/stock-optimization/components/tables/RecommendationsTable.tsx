"use client";

import React, { useMemo } from 'react';
import { DataTable, Skeleton, getShiftClickManager } from 'components/index';

interface Recommendation {
  itemName: string;
  category: string;
  currentLevel: number;
  recommendedLevel: number;
  reorderPoint: number;
  safetyStock: number;
  orderQuantity: number;
  savings: number;
  dailyDemand: number;
  leadTime: number;
  serviceLevel: number;
  unitCost: number;
  stockDifference: number;
}

interface RecommendationsTableProps {
  data: Recommendation[];
  loading?: boolean;
  maxItems?: number;
}

export function RecommendationsTable({ data, loading = false, maxItems = 20 }: RecommendationsTableProps) {
  const shiftClickManager = getShiftClickManager();

  // Normalize data for DataTable
  const rows = useMemo(() => {
    if (!data) return [];

    return (data || []).map((item: Recommendation, index: number) => ({
      id: `${item.itemName}-${index}`,
      itemName: item.itemName,
      category: item.category || 'Unknown',
      currentLevel: item.currentLevel,
      recommendedLevel: item.recommendedLevel,
      reorderPoint: item.reorderPoint,
      safetyStock: item.safetyStock,
      orderQuantity: item.orderQuantity,
      savings: item.savings,
      dailyDemand: item.dailyDemand,
      leadTime: item.leadTime,
      serviceLevel: item.serviceLevel,
      unitCost: item.unitCost,
      stockDifference: item.stockDifference,
      needsReorder: item.currentLevel <= item.reorderPoint
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
      id: 'itemName',
      header: 'Item',
      accessor: 'itemName' as const,
      sortable: true,
      render: (_: any, row: any) => (
        <div>
          <span className="text-sm font-medium block">{row.itemName}</span>
          <span className="text-xs text-muted-foreground">{row.category}</span>
        </div>
      )
    },
    {
      id: 'currentLevel',
      header: 'Current',
      accessor: 'currentLevel' as const,
      sortable: true,
      render: (value: number, row: any) => (
        <span className={`text-sm font-medium ${row.needsReorder ? 'text-orange-500' : ''}`}>
          {value}
        </span>
      )
    },
    {
      id: 'recommendedLevel',
      header: 'Recommended',
      accessor: 'recommendedLevel' as const,
      sortable: true,
      render: (value: number) => (
        <span className="text-sm font-medium text-green-500">{value}</span>
      )
    },
    {
      id: 'reorderPoint',
      header: 'Reorder Point',
      accessor: 'reorderPoint' as const,
      sortable: true
    },
    {
      id: 'safetyStock',
      header: 'Safety Stock',
      accessor: 'safetyStock' as const,
      sortable: true
    },
    {
      id: 'orderQuantity',
      header: 'EOQ',
      accessor: 'orderQuantity' as const,
      sortable: true
    },
    {
      id: 'savings',
      header: 'Annual Savings',
      accessor: 'savings' as const,
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
              label: `Item: ${row.itemName}`,
              value: `Savings: ${formatCurrency(row.savings)}, Reorder: ${row.needsReorder ? 'YES' : 'NO'}`,
              source: 'Stock Optimization Table'
            }, event.nativeEvent);
          }
        }}
      />
    </div>
  );
}
