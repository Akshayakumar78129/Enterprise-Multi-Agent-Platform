"use client";

import React, { useState, useEffect } from 'react';
import { DataTable, Skeleton, getShiftClickManager } from 'components/index';
import { engagementClassifierService } from '../services/engagementClassifierService';
import { useEngagementClassifierContext } from '../context';

interface CustomerSearchAnalyticsProps {
  onCustomerSelect?: (customer: any) => void;
}

export function CustomerSearchAnalytics({ onCustomerSelect }: CustomerSearchAnalyticsProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const shiftClickManager = getShiftClickManager();
  const { filters } = useEngagementClassifierContext();

  // Fetch all customers
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const response = await engagementClassifierService.getDashboardSummary(filters);

        // Get customers from the response
        const customerData = response.data?.customers || response.mlResults?.customers || [];

        // Deduplicate customers by customer_key or Customer Key
        const uniqueCustomers = customerData.reduce((acc: any[], customer: any) => {
          const key = customer.customer_key || customer["Customer Key"];
          const exists = acc.some(c => (c.customer_key || c["Customer Key"]) === key);
          if (!exists && key) {
            acc.push(customer);
          }
          return acc;
        }, []);

        setCustomers(uniqueCustomers);
      } catch (error) {
        console.error('Error fetching customers:', error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [filters]);

  // Normalize customer data for table display
  const rows = customers.map((customer, index) => {
    const name = customer.customer_name || customer["Customer Name"] || `Customer ${index + 1}`;
    const engagementLevel = customer.engagement_level || customer["Engagement Level"] || "Medium";
    const ltv = customer.ltv || customer["LTD Sales Amount"] || customer.ltd_sales_amount || 0;
    const transactions = customer["Number Sales Txns"] || customer.number_sales_txns || customer["Number of Invoices"] || customer.total_transactions || 0;
    const lastActivity = customer.days_since_last_activity || customer["Days Since Last Activity"] || customer.days_since_activity || 0;
    const rfmScore = customer.rfm_score || customer["RFM Score"] || 0;
    const loyaltyStatus = customer.loyalty_status || customer["Loyalty Status"] || "Unknown";
    const id = customer.customer_key || customer["Customer Key"] || index;

    // Add engagement level sort value
    const engagementSortValue = {
      "High": 3,
      "Medium": 2,
      "Low": 1
    }[engagementLevel] || 0;

    return {
      id,
      name,
      engagementLevel,
      engagementSortValue,
      ltv,
      transactions,
      lastActivity,
      rfmScore,
      loyaltyStatus,
      rawData: customer // Keep original data for callbacks
    };
  });

  const tableColumns = [
    {
      id: "name",
      header: "Customer Name",
      accessor: "name" as const,
      sortable: true,
    },
    {
      id: "engagementLevel",
      header: "Engagement Level",
      accessor: (row: any) => row.engagementSortValue,
      sortable: true,
      render: (_: any, row: any) => {
        const value = row.engagementLevel;
        const colors: Record<string, string> = {
          "High": "text-success",
          "Medium": "text-warning",
          "Low": "text-error",
        };
        const bgColors: Record<string, string> = {
          "High": "bg-emerald-100 dark:bg-emerald-900/30",
          "Medium": "bg-amber-100 dark:bg-amber-900/30",
          "Low": "bg-red-100 dark:bg-red-900/30",
        };
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[value] || ""} ${bgColors[value] || ""}`}>
            {value}
          </span>
        );
      },
    },
    {
      id: "ltv",
      header: "Lifetime Value",
      accessor: "ltv" as const,
      sortable: true,
      render: (value: number) => `$${Number.isFinite(value) ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}`,
    },
    {
      id: "transactions",
      header: "Transactions",
      accessor: "transactions" as const,
      sortable: true,
      render: (value: number) => Number.isFinite(value) ? value.toLocaleString() : '0',
    },
    {
      id: "lastActivity",
      header: "Days Since Activity",
      accessor: "lastActivity" as const,
      sortable: true,
      render: (value: number) => {
        const days = Number.isFinite(value) ? value : 0;
        const color = days > 180 ? "text-error" : days > 90 ? "text-warning" : "text-success";
        return <span className={color}>{days}</span>;
      },
    },
    {
      id: "rfmScore",
      header: "RFM Score",
      accessor: "rfmScore" as const,
      sortable: true,
      render: (value: number) => {
        const score = Number.isFinite(value) ? value.toFixed(1) : '0.0';
        const numScore = parseFloat(score);
        const color = numScore >= 7 ? "text-success" : numScore >= 4 ? "text-warning" : "text-error";
        return <span className={color}>{score}</span>;
      },
    },
    {
      id: "loyaltyStatus",
      header: "Loyalty Status",
      accessor: "loyaltyStatus" as const,
      sortable: true,
      render: (value: string) => {
        const colors: Record<string, string> = {
          "Active, Loyal": "text-success",
          "Active": "text-primary",
          "Active, New": "text-info",
          "Inactive": "text-warning",
          "Lost": "text-error",
          "Prospect": "text-muted-foreground",
        };
        return <span className={`text-xs font-medium ${colors[value] || ""}`}>{value}</span>;
      },
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
              value: `${row.engagementLevel} Engagement | LTV: $${row.ltv.toFixed(0)} | ${row.transactions} transactions`,
              source: 'Customer Table'
            }, event?.nativeEvent || event);
          }
          // Regular click does nothing - all details are in the table
        }}
      />
    </div>
  );
}
