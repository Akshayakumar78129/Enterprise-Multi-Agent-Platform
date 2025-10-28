"use client";

import React, { useMemo } from 'react';
import { DataTable, getShiftClickManager } from 'components/index';

interface AgingTableRow {
  customerId: string;
  customerName: string;
  totalOutstanding: number;
  avgDaysOverdue: number;
  invoiceCount: number;
  region: string;
  customerType: string;
}

interface AgingTableProps {
  data: AgingTableRow[];
  loading?: boolean;
}

export function AgingTable({ data, loading }: AgingTableProps) {
  const shiftClickManager = getShiftClickManager();

  // Define columns for DataTable
  const columns = useMemo(() => [
    {
      id: 'customerName',
      key: 'customerName',
      header: 'Customer',
      sortable: true,
      render: (row: AgingTableRow) => (
        <div>
          <div className="text-foreground font-medium">{row?.customerName || 'Unknown'}</div>
          <div className="text-xs text-muted">{row?.customerId || 'N/A'}</div>
        </div>
      )
    },
    {
      id: 'totalOutstanding',
      key: 'totalOutstanding',
      header: 'Outstanding AR',
      sortable: true,
      align: 'right' as const,
      render: (row: AgingTableRow) => (
        <div className="text-foreground font-semibold">
          ${(row?.totalOutstanding || 0).toLocaleString()}
        </div>
      )
    },
    {
      id: 'avgDaysOverdue',
      key: 'avgDaysOverdue',
      header: 'Avg Days Overdue',
      sortable: true,
      align: 'right' as const,
      render: (row: AgingTableRow) => {
        const days = row?.avgDaysOverdue || 0;
        return (
          <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
            days > 90
              ? 'bg-red-500/20 text-red-600'
              : days > 60
              ? 'bg-orange-500/20 text-orange-600'
              : days > 30
              ? 'bg-yellow-500/20 text-yellow-600'
              : 'bg-green-500/20 text-green-600'
          }`}>
            {days.toFixed(0)} days
          </div>
        );
      }
    },
    {
      id: 'invoiceCount',
      key: 'invoiceCount',
      header: 'Invoices',
      sortable: true,
      align: 'right' as const,
      render: (row: AgingTableRow) => (
        <div className="text-foreground">{row?.invoiceCount || 0}</div>
      )
    },
    {
      id: 'region',
      key: 'region',
      header: 'Region',
      sortable: false,
      render: (row: AgingTableRow) => (
        <div className="text-foreground-muted">{row?.region || 'N/A'}</div>
      )
    },
    {
      id: 'customerType',
      key: 'customerType',
      header: 'Type',
      sortable: false,
      render: (row: AgingTableRow) => (
        <div className="text-foreground-muted">{row?.customerType || 'N/A'}</div>
      )
    }
  ], []);

  // Handle row click with shift-click support
  const handleRowClick = (row: AgingTableRow, event: React.MouseEvent) => {
    if (event.shiftKey && row) {
      shiftClickManager.addPoint({
        label: row.customerName || 'Unknown Customer',
        value: `AR: $${(row.totalOutstanding || 0).toLocaleString()}, ${(row.avgDaysOverdue || 0).toFixed(0)} days overdue`,
        source: 'AR Aging Table'
      }, event.nativeEvent);
    }
  };

  // Summary info for header
  const summaryInfo = useMemo(() => {
    if (!data || data.length === 0) return 'No customers';
    const totalAR = data.reduce((sum, row) => sum + (row?.totalOutstanding || 0), 0);
    return `${data.length} customers • $${(totalAR / 1000000).toFixed(2)}M total AR`;
  }, [data]);

  // Ensure data has unique keys - use customerId or generate index-based keys
  const dataWithKeys = useMemo(() => {
    if (!data) return [];
    return data.map((row, index) => ({
      ...row,
      _id: row?.customerId || `row-${index}`
    }));
  }, [data]);

  return (
    <DataTable
      data={dataWithKeys}
      columns={columns}
      loading={loading}
      onRowClick={handleRowClick}
      enableShiftClick={true}
      searchPlaceholder="Search customers..."
      defaultSortKey="totalOutstanding"
      defaultSortDirection="desc"
      pageSize={20}
      headerInfo={summaryInfo}
      rowKey="_id"
    />
  );
}
