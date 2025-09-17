"use client";
import React from "react";
import { DataTable, Skeleton } from "components/index";

// We accept raw customer objects from the churn/summary API and normalize below
type RawCustomer = Record<string, any>;

interface ChurnCustomerTableProps {
  data: RawCustomer[];
  loading: boolean;
  onRowClick?: (row: any) => void;
}

export function ChurnCustomerTable({ data, loading, onRowClick }: ChurnCustomerTableProps) {
  // Normalize raw API rows to the three fields we display
  const rows = (data || []).map((c: RawCustomer, index: number) => {
    const name = c.name ?? c.customer_name ?? `Customer ${index + 1}`;
    const riskLevel = c.riskLevel ?? c.risk_level ?? "Low";
    const riskPercentage = typeof c.riskPercentage === "number"
      ? c.riskPercentage
      : Math.round(((c.churn_probability ?? 0) as number) * 100);
    const id = (c.id ?? c.customer_id ?? index).toString();
    return { id, name, riskLevel, riskPercentage };
  });

  const tableColumns = [
    {
      id: "name",
      header: "Customer",
      accessor: "name" as const,
      sortable: true,
    },
    {
      id: "riskLevel",
      header: "Risk Level",
      accessor: "riskLevel" as const,
      sortable: true,
      render: (value: string) => {
        const colors: Record<string, string> = {
          "Very High": "text-error bg-error/20",
          High: "text-warning bg-warning/20",
          Medium: "text-yellow-500 bg-yellow-500/20",
          Low: "text-success bg-success/20",
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[value] || ""}`}>
            {value}
          </span>
        );
      },
    },
    {
      id: "riskPercentage",
      header: "Risk %",
      accessor: "riskPercentage" as const,
      sortable: true,
      render: (value: number) => `${Number.isFinite(value) ? value.toFixed(0) : 0}%`,
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
        selectable
        pageSize={10}
        onRowClick={onRowClick || ((row) => console.log("Row clicked:", row))}
      />
    </div>
  );
}