"use client";

import React, { useMemo, useState } from 'react';
import { Skeleton } from 'components/index';

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
  const [sortColumn, setSortColumn] = useState<string>('totalSales');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  console.log('🔍 RegionalPerformanceTable received data:', data);
  console.log('🔍 Data length:', data?.length);
  console.log('🔍 First item:', data?.[0]);

  const columns = useMemo(() => [
    {
      key: 'region',
      label: 'Region',
      sortable: true,
      render: (row: RegionalPerformanceData) => row?.state && row?.country ? `${row.state}, ${row.country}` : 'N/A'
    },
    {
      key: 'totalSales',
      label: 'Total Sales',
      sortable: true,
      render: (row: RegionalPerformanceData) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(row?.totalSales ?? 0)
    },
    {
      key: 'customerCount',
      label: 'Customers',
      sortable: true,
      render: (row: RegionalPerformanceData) => (row?.customerCount ?? 0).toLocaleString()
    },
    {
      key: 'transactionCount',
      label: 'Transactions',
      sortable: true,
      render: (row: RegionalPerformanceData) => (row?.transactionCount ?? 0).toLocaleString()
    },
    {
      key: 'avgTransactionValue',
      label: 'Avg Order Value',
      sortable: true,
      render: (row: RegionalPerformanceData) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(row?.avgTransactionValue ?? 0)
    },
    {
      key: 'profitMargin',
      label: 'Profit Margin',
      sortable: true,
      render: (row: RegionalPerformanceData) => `${(row?.profitMargin ?? 0).toFixed(1)}%`
    }
  ], []);

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const sorted = [...data].sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortColumn) {
        case 'region':
          aVal = `${a?.state || ''}, ${a?.country || ''}`;
          bVal = `${b?.state || ''}, ${b?.country || ''}`;
          break;
        case 'totalSales':
          aVal = a?.totalSales ?? 0;
          bVal = b?.totalSales ?? 0;
          break;
        case 'customerCount':
          aVal = a?.customerCount ?? 0;
          bVal = b?.customerCount ?? 0;
          break;
        case 'transactionCount':
          aVal = a?.transactionCount ?? 0;
          bVal = b?.transactionCount ?? 0;
          break;
        case 'avgTransactionValue':
          aVal = a?.avgTransactionValue ?? 0;
          bVal = b?.avgTransactionValue ?? 0;
          break;
        case 'profitMargin':
          aVal = a?.profitMargin ?? 0;
          bVal = b?.profitMargin ?? 0;
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return sorted;
  }, [data, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

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
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '500px' }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-20 bg-muted border-b border-border">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left font-semibold whitespace-nowrap bg-muted ${
                    column.sortable ? 'cursor-pointer hover:bg-muted/80' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortColumn === column.key && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr
                key={`${row?.country}-${row?.state}-${index}`}
                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 whitespace-nowrap">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
