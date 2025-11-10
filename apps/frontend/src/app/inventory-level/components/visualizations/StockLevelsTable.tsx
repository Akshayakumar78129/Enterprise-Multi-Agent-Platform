"use client";

import React, { useMemo } from 'react';
import { DataTable, getShiftClickManager } from 'components/index';

interface StockLevel {
  itemName: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  stockValue: number;
  status: string;
  daysOnHand: number;
}

interface StockLevelsTableProps {
  data: StockLevel[];
  loading?: boolean;
}

export function StockLevelsTable({ data = [], loading = false }: StockLevelsTableProps) {
  const shiftClickManager = getShiftClickManager();

  const getStatusBadge = (status: string) => {
    const colors = {
      low: 'bg-error/20 text-error border-error/30',
      excess: 'bg-warning/20 text-warning border-warning/30',
      normal: 'bg-success/20 text-success border-success/30'
    };
    const color = colors[status.toLowerCase() as keyof typeof colors] || colors.normal;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${color}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'low':
        return 'text-error';
      case 'excess':
        return 'text-warning';
      default:
        return 'text-success';
    }
  };

  // Define columns for DataTable
  const columns = useMemo(() => [
    {
      id: 'itemName',
      accessor: 'itemName' as const,
      header: 'Item Name',
      sortable: true,
      render: (_value: any, row: StockLevel) => (
        <div>
          <div className="text-foreground font-medium">{row?.itemName || 'Unknown'}</div>
          <div className="text-xs text-muted">{row?.category || 'N/A'}</div>
        </div>
      )
    },
    {
      id: 'currentStock',
      accessor: 'currentStock' as const,
      header: 'Current Stock',
      sortable: true,
      render: (_value: any, row: StockLevel) => (
        <div className="text-foreground font-mono">
          {(row?.currentStock || 0).toLocaleString()}
        </div>
      )
    },
    {
      id: 'minMax',
      accessor: 'minimumStock' as const,
      header: 'Min / Max',
      sortable: false,
      render: (_value: any, row: StockLevel) => (
        <div className="text-muted font-mono text-sm">
          {(row?.minimumStock || 0).toLocaleString()} / {(row?.maximumStock || 0).toLocaleString()}
        </div>
      )
    },
    {
      id: 'stockValue',
      accessor: 'stockValue' as const,
      header: 'Value',
      sortable: true,
      render: (_value: any, row: StockLevel) => (
        <div className="text-foreground font-semibold">
          ${(row?.stockValue || 0).toLocaleString()}
        </div>
      )
    },
    {
      id: 'daysOnHand',
      accessor: 'daysOnHand' as const,
      header: 'Days on Hand',
      sortable: true,
      render: (_value: any, row: StockLevel) => {
        const status = row?.status || 'normal';
        return (
          <div className={`font-mono ${getStatusColor(status)}`}>
            {(row?.daysOnHand || 0).toFixed(0)}
          </div>
        );
      }
    },
    {
      id: 'status',
      accessor: 'status' as const,
      header: 'Status',
      sortable: true,
      render: (_value: any, row: StockLevel) => getStatusBadge(row?.status || 'normal')
    }
  ], []);

  // Handle row click with shift-click support
  const handleRowClick = (row: StockLevel, event: React.MouseEvent) => {
    if (event.shiftKey && row) {
      shiftClickManager.addPoint({
        label: row.itemName || 'Unknown Item',
        value: `Stock: ${(row.currentStock || 0).toLocaleString()}, Value: $${(row.stockValue || 0).toLocaleString()}, Status: ${row.status || 'N/A'}`,
        source: 'Inventory Level Table'
      }, event.nativeEvent);
    }
  };

  // Summary info for header
  const summaryInfo = useMemo(() => {
    if (!data || data.length === 0) return 'No items';
    const totalValue = data.reduce((sum, row) => sum + (row?.stockValue || 0), 0);
    return `${data.length} items • $${(totalValue / 1000000).toFixed(2)}M total value`;
  }, [data]);

  // Ensure data has unique keys
  const dataWithKeys = useMemo(() => {
    if (!data) return [];
    return data.map((row, index) => ({
      ...row,
      id: row?.itemName || `row-${index}`
    }));
  }, [data]);

  return (
    <div>
      {/* Summary info header */}
      <div className="mb-4 px-4 pt-4">
        <p className="text-sm text-muted">{summaryInfo}</p>
      </div>

      <DataTable
        data={dataWithKeys}
        columns={columns}
        onRowClick={handleRowClick}
        searchable={true}
        searchPlaceholder="Search items..."
        pageSize={20}
        showPagination={true}
      />
    </div>
  );
}

export default StockLevelsTable;
