"use client";

import React, { useMemo } from 'react';
import { DataTable, Skeleton, getShiftClickManager } from 'components/index';

interface RegionalPerformanceData {
  country: string;
  state: string;
  totalSales: number;
  netSales: number;
  totalQuantity: number;
  grossProfit: number;
  profitMargin: number;
  customerCount: number;
  transactionCount: number;
  avgTransactionValue: number;
  firstSaleDate: string | null;
  lastSaleDate: string | null;
}

interface RegionalPerformanceTableProps {
  data: RegionalPerformanceData[];
  loading?: boolean;
}

export function RegionalPerformanceTable({ data, loading }: RegionalPerformanceTableProps) {
  const shiftClickManager = getShiftClickManager();

  const columns = useMemo(() => [
    {
      id: 'region',
      header: 'Region',
      accessor: (row: RegionalPerformanceData) => row?.state && row?.country ? `${row.state}, ${row.country}` : 'N/A',
      sortable: true
    },
    {
      id: 'totalSales',
      header: 'Total Sales',
      accessor: 'totalSales' as keyof RegionalPerformanceData,
      sortable: true,
      render: (value: number) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value ?? 0)
    },
    {
      id: 'customerCount',
      header: 'Customers',
      accessor: 'customerCount' as keyof RegionalPerformanceData,
      sortable: true,
      render: (value: number) => (value ?? 0).toLocaleString()
    },
    {
      id: 'transactionCount',
      header: 'Transactions',
      accessor: 'transactionCount' as keyof RegionalPerformanceData,
      sortable: true,
      render: (value: number) => (value ?? 0).toLocaleString()
    },
    {
      id: 'avgTransactionValue',
      header: 'Avg Order Value',
      accessor: 'avgTransactionValue' as keyof RegionalPerformanceData,
      sortable: true,
      render: (value: number) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value ?? 0)
    },
    {
      id: 'profitMargin',
      header: 'Profit Margin',
      accessor: 'profitMargin' as keyof RegionalPerformanceData,
      sortable: true,
      render: (value: number) => `${(value ?? 0).toFixed(1)}%`
    }
  ], []);

  if (loading) {
    return <Skeleton height={400} className="animate-pulse" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground">No regional performance data available</p>
        </div>
      </div>
    );
  }

  return (
    <DataTable
      data={data}
      columns={columns}
      searchable={true}
      searchPlaceholder="Search regions..."
      defaultSortKey="totalSales"
      defaultSortDirection="desc"
      showPagination={true}
      pageSize={10}
      onRowClick={(row, event) => {
        if (event?.shiftKey) {
          // Shift+click: Add to Business Intelligence panel
          shiftClickManager.addPoint({
            label: `Region: ${row.state}, ${row.country}`,
            value: `Sales: $${(row.totalSales || 0).toLocaleString()} | Margin: ${(row.profitMargin || 0).toFixed(1)}% | Customers: ${(row.customerCount || 0).toLocaleString()}`,
            source: 'Regional Sales - Performance Table'
          }, event.nativeEvent);
        }
      }}
    />
  );
}
