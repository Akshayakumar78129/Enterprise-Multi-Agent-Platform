"use client";

import React from 'react';
import { DataTable, Skeleton } from 'components/index';

interface CashFlowTransaction {
  date: string;
  category: string;
  description: string;
  amount: number;
  region?: string;
  customer?: string;
  type: string;
  flowDirection: string;
}

interface CashFlowTableProps {
  data: CashFlowTransaction[];
  loading?: boolean;
}

export function CashFlowTable({ data, loading }: CashFlowTableProps) {
  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
    return amount < 0 ? `-${formatted}` : formatted;
  };

  const rows = (data || []).map((transaction, index) => ({
    id: index.toString(),
    date: transaction.date,
    category: transaction.category,
    description: transaction.description,
    type: transaction.type,
    region: transaction.region || 'N/A',
    customer: transaction.customer || 'N/A',
    amount: transaction.amount,
    flowDirection: transaction.flowDirection,
  }));

  const tableColumns = [
    {
      id: 'date',
      header: 'Date',
      accessor: 'date' as const,
      sortable: true,
    },
    {
      id: 'category',
      header: 'Category',
      accessor: 'category' as const,
      sortable: true,
      render: (value: string) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
          {value}
        </span>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      accessor: 'description' as const,
      sortable: true,
    },
    {
      id: 'type',
      header: 'Type',
      accessor: 'type' as const,
      sortable: true,
      render: (value: string) => {
        const colors: Record<string, string> = {
          operating: 'bg-green-500/10 text-green-400',
          investing: 'bg-amber-500/10 text-amber-400',
          financing: 'bg-purple-500/10 text-purple-400',
        };
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[value] || 'bg-gray-500/10 text-gray-400'}`}>
            {value}
          </span>
        );
      },
    },
    {
      id: 'region',
      header: 'Region',
      accessor: 'region' as const,
      sortable: true,
    },
    {
      id: 'customer',
      header: 'Customer',
      accessor: 'customer' as const,
      sortable: true,
    },
    {
      id: 'amount',
      header: 'Amount',
      accessor: 'amount' as const,
      sortable: true,
      render: (value: number, row: any) => {
        const isInflow = row.flowDirection === 'inflow';
        return (
          <span className={`font-semibold ${isInflow ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(value)}
          </span>
        );
      },
    },
  ];

  if (loading) {
    return <Skeleton height={500} className="animate-pulse" />;
  }

  return (
    <div className="responsive-table">
      <DataTable
        data={rows}
        columns={tableColumns}
        searchable
        selectable={false}
        pageSize={20}
      />
    </div>
  );
}
