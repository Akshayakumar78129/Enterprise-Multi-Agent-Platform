"use client";

import React from "react";
import { FilterBar } from "components/index";
import { ARAgingFilters as ARAgingFiltersType } from "../context";

interface ARAgingFiltersProps {
  filters: ARAgingFiltersType;
  onFiltersChange: (filters: ARAgingFiltersType) => void;
  onReset: () => void;
}

export function ARAgingFilters({
  filters,
  onFiltersChange,
  onReset
}: ARAgingFiltersProps) {
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
            id: "customerSegments",
            label: "Customer Segments",
            options: [
              { value: "enterprise", label: "Enterprise" },
              { value: "smb", label: "Small-Medium Business" },
              { value: "retail", label: "Retail" },
              { value: "government", label: "Government" },
            ],
            value: filters.customerSegments || [],
            onChange: (values) => onFiltersChange({ ...filters, customerSegments: values }),
            placeholder: "All Customer Segments"
          },
          {
            id: "regions",
            label: "Regions",
            options: [
              { value: "north", label: "North" },
              { value: "south", label: "South" },
              { value: "east", label: "East" },
              { value: "west", label: "West" },
            ],
            value: filters.regions || [],
            onChange: (values) => onFiltersChange({ ...filters, regions: values }),
            placeholder: "All Regions"
          },
          {
            id: "riskLevels",
            label: "Risk Levels",
            options: [
              { value: "high", label: "High Risk" },
              { value: "medium", label: "Medium Risk" },
              { value: "low", label: "Low Risk" },
            ],
            value: filters.riskLevels || [],
            onChange: (values) => onFiltersChange({ ...filters, riskLevels: values }),
            placeholder: "All Risk Levels"
          },
        ],
      }}
      onReset={onReset}
      showResetButton={true}
    />
  );
}
