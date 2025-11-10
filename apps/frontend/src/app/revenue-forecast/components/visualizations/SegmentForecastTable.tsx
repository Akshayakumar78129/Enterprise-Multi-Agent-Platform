"use client";

import React from 'react';
import { DataTable, getShiftClickManager } from 'components/index';

interface SegmentForecastTableProps {
  data: any[];
  loading?: boolean;
}

export function SegmentForecastTable({ data, loading }: SegmentForecastTableProps) {
  const shiftClickManager = getShiftClickManager();

  const columns = [
    {
      id: 'segment',
      header: 'Segment',
      accessor: 'segment',
      sortable: true,
      cell: (row: any) => (
        <span className="font-medium text-foreground">{row.segment}</span>
      )
    },
    {
      id: 'avg_monthly_revenue',
      header: 'Avg Monthly Revenue',
      accessor: 'avg_monthly_revenue',
      sortable: true,
      align: 'right' as const,
      cell: (row: any) => (
        <span className="text-foreground">
          ${(row.avg_monthly_revenue || 0).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          })}
        </span>
      )
    },
    {
      id: 'total_revenue',
      header: 'Total Revenue',
      accessor: 'total_revenue',
      sortable: true,
      align: 'right' as const,
      cell: (row: any) => (
        <span className="text-foreground">
          ${(row.total_revenue || 0).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          })}
        </span>
      )
    },
    {
      id: 'month_count',
      header: 'Months',
      accessor: 'month_count',
      sortable: true,
      align: 'right' as const,
      cell: (row: any) => (
        <span className="text-muted">{row.month_count || 0}</span>
      )
    },
    {
      id: 'volatility_pct',
      header: 'Volatility',
      accessor: 'volatility_pct',
      sortable: true,
      align: 'right' as const,
      cell: (row: any) => {
        const volatility = row.volatility_pct || 0;
        const colorClass = volatility > 50 ? 'text-error' :
                          volatility > 25 ? 'text-warning' : 'text-success';
        return (
          <span className={colorClass}>
            {volatility.toFixed(1)}%
          </span>
        );
      }
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      searchable
      exportable
      exportFileName="revenue-forecast-segments"
      searchPlaceholder="Search segments..."
      onRowClick={(row, event) => {
        if (event?.shiftKey) {
          shiftClickManager.addPoint({
            label: row.segment,
            value: `Total: $${(row.total_revenue || 0).toLocaleString(undefined, { notation: 'compact' })} | Avg Monthly: $${(row.avg_monthly_revenue || 0).toLocaleString(undefined, { notation: 'compact' })}`,
            source: 'Revenue Forecast - Segment Breakdown'
          }, event.nativeEvent);
        }
      }}
    />
  );
}
