"use client";

import React from 'react';
import { DataTable, Skeleton, getShiftClickManager } from 'components/index';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TopCustomersProps {
  data: any[];
  loading?: boolean;
  onCustomerSelect?: (customer: any) => void;
}

export function TopCustomers({ data = [], loading = false, onCustomerSelect }: TopCustomersProps) {
  const shiftClickManager = getShiftClickManager();

  // Normalize data to consistent format
  const rows = (data || []).map((customer, index) => {
    const name = customer.name || customer.customer_name || `Customer ${customer.customer_id || index + 1}`;
    const id = customer.id || customer.customer_id || index;
    const ltv = customer.ltv || customer.lifetime_value || 0;
    const transactions = customer.transactions || customer.transaction_count || 0;
    const avgOrder = customer.avgOrder || customer.avg_order_value || 0;
    const segment = customer.segment || customer.customerType || 'Standard';
    const trend = customer.trend || 0;

    return {
      id,
      name,
      customerId: id,
      ltv,
      transactions,
      avgOrder,
      segment,
      trend,
      rawData: customer
    };
  });

  const tableColumns = [
    {
      id: "name",
      header: "Customer",
      accessor: "name" as const,
      sortable: true,
    },
    {
      id: "customerId",
      header: "ID",
      accessor: "customerId" as const,
      sortable: true,
      render: (value: string | number) => (
        <span className="text-muted-foreground">{value}</span>
      ),
    },
    {
      id: "ltv",
      header: "LTV",
      accessor: "ltv" as const,
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-primary">${value.toLocaleString()}</span>
      ),
    },
    {
      id: "transactions",
      header: "Transactions",
      accessor: "transactions" as const,
      sortable: true,
    },
    {
      id: "avgOrder",
      header: "Avg Order",
      accessor: "avgOrder" as const,
      sortable: true,
      render: (value: number) => `$${value.toLocaleString()}`,
    },
    {
      id: "segment",
      header: "Segment",
      accessor: "segment" as const,
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 rounded-full text-xs bg-primary/20 text-primary">
          {value}
        </span>
      ),
    },
    {
      id: "trend",
      header: "Trend",
      accessor: "trend" as const,
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center justify-end gap-1">
          {value > 0 ? (
            <>
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-success">+{value}%</span>
            </>
          ) : (
            <>
              <TrendingDown className="h-4 w-4 text-error" />
              <span className="text-error">{value}%</span>
            </>
          )}
        </div>
      ),
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
            // Shift+click: Add to global shift+click selection
            shiftClickManager.addPoint({
              label: `Customer: ${row.name}`,
              value: `LTV: $${row.ltv.toLocaleString()}, Segment: ${row.segment}`,
              source: 'Top Customers'
            }, event.nativeEvent);
          } else if (onCustomerSelect) {
            // Regular click: Execute provided handler
            onCustomerSelect(row.rawData);
          }
        }}
      />
    </div>
  );
}