"use client";

import React, { useMemo } from 'react';
import { DataTable, Badge } from 'components/index';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface CustomerAnomaliesTableProps {
  data: any[];
  loading?: boolean;
  onCustomerSelect?: (customer: any) => void;
}

export function CustomerAnomaliesTable({
  data,
  loading,
  onCustomerSelect
}: CustomerAnomaliesTableProps) {
  const columns = useMemo(() => [
    {
      id: 'customer_name',
      header: 'Customer',
      accessor: 'customer_name',
      sortable: true,
      cell: (row: any) => (
        <div>
          <div className="font-medium">{row.customer_name || `Customer ${row.customer_id}`}</div>
          <div className="text-xs text-muted-foreground">ID: {row.customer_id}</div>
        </div>
      )
    },
    {
      id: 'severity_level',
      header: 'Severity',
      accessor: 'severity_level',
      sortable: true,
      cell: (row: any) => {
        const colors = {
          5: 'destructive',
          4: 'destructive',
          3: 'warning',
          2: 'secondary',
          1: 'default'
        } as const;
        const labels = {
          5: 'Critical',
          4: 'High',
          3: 'Medium',
          2: 'Low',
          1: 'Minimal'
        };
        return (
          <Badge variant={colors[row.severity_level as keyof typeof colors] || 'default'}>
            <AlertTriangle className="w-3 h-3 mr-1" />
            {labels[row.severity_level as keyof typeof labels] || 'Unknown'}
          </Badge>
        );
      }
    },
    {
      id: 'anomaly_score',
      header: 'Anomaly Score',
      accessor: 'anomaly_score',
      sortable: true,
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <div className="w-20 bg-background rounded-full h-2 overflow-hidden">
            <div
              className="h-full transition-all"
              style={{
                width: `${row.anomaly_score * 100}%`,
                backgroundColor: row.anomaly_score > 0.7 ? '#ef4444' :
                               row.anomaly_score > 0.4 ? '#f59e0b' : '#10b981'
              }}
            />
          </div>
          <span className="text-sm font-medium">{row.anomaly_score.toFixed(3)}</span>
        </div>
      )
    },
    {
      id: 'segment',
      header: 'Segment',
      accessor: 'segment',
      sortable: true,
      cell: (row: any) => (
        <Badge variant="outline">{row.segment || 'Unknown'}</Badge>
      )
    },
    {
      id: 'region',
      header: 'Region',
      accessor: 'region',
      sortable: true,
      cell: (row: any) => row.region || 'N/A'
    },
    {
      id: 'transaction_count',
      header: 'Transactions',
      accessor: 'transaction_count',
      sortable: true,
      cell: (row: any) => (
        <div className="text-right">
          <div>{row.transaction_count}</div>
          <div className="text-xs text-muted-foreground">
            ${row.avg_transaction_value?.toFixed(2)} avg
          </div>
        </div>
      )
    },
    {
      id: 'days_since_last_txn',
      header: 'Last Activity',
      accessor: 'days_since_last_txn',
      sortable: true,
      cell: (row: any) => {
        const days = row.days_since_last_txn;
        if (!days && days !== 0) return 'N/A';
        return (
          <div className="flex items-center gap-1">
            {days > 30 ? (
              <TrendingDown className="w-3 h-3 text-red-500" />
            ) : (
              <TrendingUp className="w-3 h-3 text-green-500" />
            )}
            <span>{days} days ago</span>
          </div>
        );
      }
    }
  ], []);

  return (
    <DataTable
      title="Customer Anomalies"
      description="Detailed list of detected anomalies"
      columns={columns}
      data={data}
      loading={loading}
      searchable
      sortable
      paginated
      pageSize={10}
      onRowClick={onCustomerSelect}
      emptyMessage="No anomalies detected"
    />
  );
}