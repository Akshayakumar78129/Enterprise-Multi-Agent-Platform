"use client";

import React from "react";
import { DataTable, Skeleton, getShiftClickManager } from "components/index";
import { User } from "lucide-react";

interface CustomerTableProps {
  data: any[];
  loading: boolean;
  onCustomerSelect?: (customer: any) => void;
}

export function CustomerTable({ data, loading, onCustomerSelect }: CustomerTableProps) {
  const shiftClickManager = getShiftClickManager();

  // Normalize data to consistent format
  const rows = (data || []).map((customer, index) => {
    const name = customer.customer_name || customer.customerName || customer.name || `Customer ${index + 1}`;
    const segment = customer.customer_type || customer.customerType || customer.segment || "Unknown";
    const totalSpend = customer.total_spend || customer.totalSpend || 0;
    const avgOrderValue = customer.avg_order_value || customer.avgOrderValue || 0;
    const purchaseCount = customer.purchase_count || customer.transactionCount || 0;
    const avgDaysBetween = customer.avg_days_between_purchases || customer.avgDaysBetweenPurchases;
    const purchaseFrequency = customer.purchase_frequency || customer.purchaseFrequency;
    const lastPurchase = customer.last_purchase_date || customer.lastPurchaseDate ||
                        (customer.recencyDays ? `${customer.recencyDays}d ago` : "N/A");
    const engagementScore = customer.engagement_score || 0;
    const id = customer.customer_id || customer.customerId || customer.id || index;

    // Calculate engagement status
    let status = "At Risk";
    let statusColor = "text-error";
    if (engagementScore > 0.7) {
      status = "Highly Engaged";
      statusColor = "text-success";
    } else if (engagementScore > 0.4) {
      status = "Moderate";
      statusColor = "text-warning";
    }

    return {
      id,
      name,
      segment,
      totalSpend,
      avgOrderValue,
      purchaseCount,
      frequency: avgDaysBetween || purchaseFrequency,
      lastPurchase,
      status,
      statusColor,
      engagementScore,
      rawData: customer
    };
  });

  const tableColumns = [
    {
      id: "name",
      header: "Customer",
      accessor: "name" as const,
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="font-medium">{value}</div>
        </div>
      ),
    },
    {
      id: "segment",
      header: "Segment",
      accessor: "segment" as const,
      sortable: true,
      render: (value: string) => (
        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
          {value}
        </span>
      ),
    },
    {
      id: "totalSpend",
      header: "Total Spend",
      accessor: "totalSpend" as const,
      sortable: true,
      render: (value: number, row: any) => (
        <div className="text-right">
          <div className="font-medium text-success">${value.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">{row.purchaseCount} orders</div>
        </div>
      ),
    },
    {
      id: "avgOrderValue",
      header: "Avg Order",
      accessor: "avgOrderValue" as const,
      sortable: true,
      render: (value: number) => `$${value.toFixed(2)}`,
    },
    {
      id: "frequency",
      header: "Frequency",
      accessor: "frequency" as const,
      sortable: true,
      render: (value: number) => {
        if (!value) return "N/A";
        return value > 1 ? `${value.toFixed(1)} days` : `${value.toFixed(1)}/mo`;
      },
    },
    {
      id: "lastPurchase",
      header: "Last Purchase",
      accessor: "lastPurchase" as const,
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      accessor: "status" as const,
      sortable: true,
      render: (value: string, row: any) => (
        <span className={`text-xs font-medium ${row.statusColor}`}>
          {value}
        </span>
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
              value: `Total Spend: $${row.totalSpend.toFixed(2)}, ${row.status}`,
              source: 'Behavior Table'
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