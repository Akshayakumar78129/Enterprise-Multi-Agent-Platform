"use client";

import React, { useMemo } from 'react';
import { DataTable, getShiftClickManager } from 'components/index';

interface SlowMovingItem {
  itemName: string;
  category: string;
  currentStock: number;
  stockValue: number;
  turnoverRate: number;
  daysSinceLastSale: number;
  lastSaleDate: string;
  transactionCount: number;
}

interface SlowMovingItemsTableProps {
  data: SlowMovingItem[];
  loading?: boolean;
}

export function SlowMovingItemsTable({ data = [], loading = false }: SlowMovingItemsTableProps) {
  const shiftClickManager = getShiftClickManager();

  const columns = useMemo(() => [
    {
      id: 'itemName',
      accessor: 'itemName' as const,
      header: 'Item Name',
      sortable: true,
      render: (_value: any, row: SlowMovingItem) => (
        <div>
          <div className="text-foreground font-medium">{row?.itemName}</div>
          <div className="text-xs text-muted-foreground">{row?.category}</div>
        </div>
      )
    },
    {
      id: 'currentStock',
      accessor: 'currentStock' as const,
      header: 'Current Stock',
      sortable: true,
      render: (value: any) => (
        <span className="text-foreground">{value?.toLocaleString() || 0}</span>
      )
    },
    {
      id: 'stockValue',
      accessor: 'stockValue' as const,
      header: 'Stock Value',
      sortable: true,
      render: (value: any) => (
        <span className="text-foreground">${(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      )
    },
    {
      id: 'turnoverRate',
      accessor: 'turnoverRate' as const,
      header: 'Turnover Rate',
      sortable: true,
      render: (value: any, row: SlowMovingItem) => (
        <div>
          <div className="text-foreground">{(value || 0).toFixed(2)} turns/year</div>
          <div className={`text-xs ${value < 1 ? 'text-red-500' : value < 2 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
            {value < 1 ? 'Very Slow' : value < 2 ? 'Slow' : 'Moderate'}
          </div>
        </div>
      )
    },
    {
      id: 'daysSinceLastSale',
      accessor: 'daysSinceLastSale' as const,
      header: 'Days Since Last Sale',
      sortable: true,
      render: (value: any) => (
        <div>
          <div className="text-foreground">{Math.round(value || 0)} days</div>
          <div className={`text-xs ${value > 180 ? 'text-red-500' : value > 90 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
            {value > 180 ? 'Critical' : value > 90 ? 'High Risk' : 'Monitor'}
          </div>
        </div>
      )
    },
    {
      id: 'lastSaleDate',
      accessor: 'lastSaleDate' as const,
      header: 'Last Sale',
      sortable: true,
      render: (value: any) => (
        <span className="text-foreground">{value || 'N/A'}</span>
      )
    },
  ], []);

  const handleRowClick = (row: SlowMovingItem, event: React.MouseEvent) => {
    if (event.shiftKey) {
      shiftClickManager.addPoint({
        id: `item-${row.itemName}`,
        label: row.itemName,
        value: `${row.turnoverRate.toFixed(2)} turns/year`,
        source: 'Slow Moving Items Table',
        metadata: {
          fromShiftClick: true,
          timestamp: Date.now(),
          dashboardContext: 'slow-moving-stock',
          itemDetails: {
            category: row.category,
            stockValue: row.stockValue,
            daysSinceLastSale: row.daysSinceLastSale
          }
        }
      }, event);
    }
  };

  const dataWithKeys = useMemo(() => {
    return data.map((row, index) => ({
      ...row,
      id: row?.itemName || `row-${index}`
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Loading slow moving items...
      </div>
    );
  }

  return (
    <DataTable
      data={dataWithKeys}
      columns={columns}
      onRowClick={handleRowClick}
      searchable={true}
      pageSize={20}
    />
  );
}
