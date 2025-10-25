"use client";

import React, { useMemo, useState } from 'react';
import { Skeleton } from 'components/index';

interface OpportunityData {
  country: string;
  state: string;
  totalSales: number;
  grossProfit: number;
  customerCount: number;
  transactionCount: number;
  avgTransactionValue: number;
  opportunityCategory: string;
  salesVsAvg: number;
  customersVsAvg: number;
  profitMargin: number;
}

interface GrowthOpportunitiesTableProps {
  data: OpportunityData[];
  loading?: boolean;
}

export function GrowthOpportunitiesTable({ data, loading }: GrowthOpportunitiesTableProps) {
  const [sortColumn, setSortColumn] = useState<string>('salesVsAvg');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const columns = useMemo(() => [
    {
      key: 'region',
      label: 'Region',
      sortable: true,
      render: (row: OpportunityData) => row?.state && row?.country ? `${row.state}, ${row.country}` : 'N/A'
    },
    {
      key: 'opportunityCategory',
      label: 'Category',
      sortable: true,
      render: (row: OpportunityData) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row?.opportunityCategory === 'Star Region' ? 'bg-purple-100 text-purple-800' :
          row?.opportunityCategory === 'Growth Opportunity' ? 'bg-green-100 text-green-800' :
          row?.opportunityCategory === 'Cash Cow' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {row?.opportunityCategory || 'N/A'}
        </span>
      )
    },
    {
      key: 'totalSales',
      label: 'Total Sales',
      sortable: true,
      render: (row: OpportunityData) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(row?.totalSales ?? 0)
    },
    {
      key: 'salesVsAvg',
      label: 'Sales vs Avg',
      sortable: true,
      render: (row: OpportunityData) => {
        const value = row?.salesVsAvg ?? 0;
        const isPositive = value >= 0;
        return (
          <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
            {isPositive ? '+' : ''}{value.toFixed(1)}%
          </span>
        );
      }
    },
    {
      key: 'customerCount',
      label: 'Customers',
      sortable: true,
      render: (row: OpportunityData) => (row?.customerCount ?? 0).toLocaleString()
    },
    {
      key: 'customersVsAvg',
      label: 'Customers vs Avg',
      sortable: true,
      render: (row: OpportunityData) => {
        const value = row?.customersVsAvg ?? 0;
        const isPositive = value >= 0;
        return (
          <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
            {isPositive ? '+' : ''}{value.toFixed(1)}%
          </span>
        );
      }
    },
    {
      key: 'profitMargin',
      label: 'Profit Margin',
      sortable: true,
      render: (row: OpportunityData) => `${(row?.profitMargin ?? 0).toFixed(1)}%`
    }
  ], []);

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Filter to show only growth opportunities
    const growthOpportunities = data.filter(
      item => item.opportunityCategory === 'Growth Opportunity' ||
              item.opportunityCategory === 'Star Region'
    );

    const sorted = [...growthOpportunities].sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortColumn) {
        case 'region':
          aVal = `${a?.state || ''}, ${a?.country || ''}`;
          bVal = `${b?.state || ''}, ${b?.country || ''}`;
          break;
        case 'opportunityCategory':
          aVal = a?.opportunityCategory || '';
          bVal = b?.opportunityCategory || '';
          break;
        case 'totalSales':
          aVal = a?.totalSales ?? 0;
          bVal = b?.totalSales ?? 0;
          break;
        case 'salesVsAvg':
          aVal = a?.salesVsAvg ?? 0;
          bVal = b?.salesVsAvg ?? 0;
          break;
        case 'customerCount':
          aVal = a?.customerCount ?? 0;
          bVal = b?.customerCount ?? 0;
          break;
        case 'customersVsAvg':
          aVal = a?.customersVsAvg ?? 0;
          bVal = b?.customersVsAvg ?? 0;
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

  if (sortedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground">No growth opportunities identified</p>
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
                  className={`px-4 py-3 text-left font-semibold whitespace-nowrap bg-muted ${column.sortable ? 'cursor-pointer hover:bg-muted/80' : ''}`}
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
              className="border-b border-border hover:bg-accent/50 transition-colors"
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
