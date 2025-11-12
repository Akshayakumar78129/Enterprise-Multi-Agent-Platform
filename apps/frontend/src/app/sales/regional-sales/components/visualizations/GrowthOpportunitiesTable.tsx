"use client";

import React, { useMemo } from 'react';
import { DataTable, Skeleton, getShiftClickManager } from 'components/index';

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
  const shiftClickManager = getShiftClickManager();

  const columns = useMemo(() => [
    {
      id: 'region',
      header: 'Region',
      accessor: (row: OpportunityData) => row?.state && row?.country ? `${row.state}, ${row.country}` : 'N/A',
      sortable: true
    },
    {
      id: 'opportunityCategory',
      header: 'Category',
      accessor: 'opportunityCategory' as keyof OpportunityData,
      sortable: true,
      render: (value: string, row: OpportunityData) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'Star Region' ? 'bg-purple-100 text-purple-800' :
          value === 'Growth Opportunity' ? 'bg-green-100 text-green-800' :
          value === 'Cash Cow' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value || 'N/A'}
        </span>
      )
    },
    {
      id: 'totalSales',
      header: 'Total Sales',
      accessor: 'totalSales' as keyof OpportunityData,
      sortable: true,
      render: (value: number) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value ?? 0)
    },
    {
      id: 'salesVsAvg',
      header: 'Sales vs Avg',
      accessor: 'salesVsAvg' as keyof OpportunityData,
      sortable: true,
      render: (value: number) => {
        const isPositive = value >= 0;
        return (
          <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
            {isPositive ? '+' : ''}{value.toFixed(1)}%
          </span>
        );
      }
    },
    {
      id: 'customerCount',
      header: 'Customers',
      accessor: 'customerCount' as keyof OpportunityData,
      sortable: true,
      render: (value: number) => (value ?? 0).toLocaleString()
    },
    {
      id: 'customersVsAvg',
      header: 'Customers vs Avg',
      accessor: 'customersVsAvg' as keyof OpportunityData,
      sortable: true,
      render: (value: number) => {
        const isPositive = value >= 0;
        return (
          <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
            {isPositive ? '+' : ''}{value.toFixed(1)}%
          </span>
        );
      }
    },
    {
      id: 'profitMargin',
      header: 'Profit Margin',
      accessor: 'profitMargin' as keyof OpportunityData,
      sortable: true,
      render: (value: number) => `${(value ?? 0).toFixed(1)}%`
    }
  ], []);

  // Filter to show only growth opportunities
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.filter(
      item => item.opportunityCategory === 'Growth Opportunity' ||
              item.opportunityCategory === 'Star Region'
    );
  }, [data]);

  if (loading) {
    return <Skeleton height={400} className="animate-pulse" />;
  }

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground">No growth opportunities identified</p>
        </div>
      </div>
    );
  }

  return (
    <DataTable
      data={filteredData}
      columns={columns}
      searchable={true}
      searchPlaceholder="Search opportunities..."
      defaultSortKey="salesVsAvg"
      defaultSortDirection="desc"
      showPagination={true}
      pageSize={10}
      onRowClick={(row, event) => {
        if (event?.shiftKey) {
          // Shift+click: Add to Business Intelligence panel
          shiftClickManager.addPoint({
            label: `${row.opportunityCategory}: ${row.state}, ${row.country}`,
            value: `Sales: $${(row.totalSales || 0).toLocaleString()} | vs Avg: ${(row.salesVsAvg >= 0 ? '+' : '')}${(row.salesVsAvg || 0).toFixed(1)}%`,
            source: 'Regional Sales - Growth Opportunities'
          }, event.nativeEvent);
        }
      }}
    />
  );
}
