"use client";

import React from "react";
import { FilterBar } from "components/index";
import { InventorylevelFilters } from "../../context";

interface InventoryLevelFiltersProps {
  filters: InventorylevelFilters;
  onFiltersChange: (filters: InventorylevelFilters) => void;
  onReset: () => void;
}

export function InventoryLevelFilters({
  filters,
  onFiltersChange,
  onReset
}: InventoryLevelFiltersProps) {
  return (
    <FilterBar
      config={{
        dateRange: {
          enabled: true,
          value: filters.dateRange,
          onChange: (range) => onFiltersChange({ ...filters, dateRange: range }),
        },
        multiSelect: [
          {
            id: "status",
            label: "Stock Status",
            options: [
              { value: "low", label: "Low Stock" },
              { value: "normal", label: "Normal" },
              { value: "excess", label: "Excess Stock" },
            ],
            value: filters.status || [],
            onChange: (values) => onFiltersChange({ ...filters, status: values }),
            placeholder: "All Status"
          },
        ],
      }}
      onReset={onReset}
    />
  );
}

export default InventoryLevelFilters;
