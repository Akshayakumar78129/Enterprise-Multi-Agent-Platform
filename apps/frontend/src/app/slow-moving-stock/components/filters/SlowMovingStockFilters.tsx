"use client";

import React from "react";
import { FilterBar } from "components/index";
import { SlowMovingStockFilters as FilterType } from "../../context";

interface SlowMovingStockFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  onReset: () => void;
}

export function SlowMovingStockFilters({
  filters,
  onFiltersChange,
  onReset
}: SlowMovingStockFiltersProps) {
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
            id: "category",
            label: "Product Category",
            options: [
              { value: "Bikes", label: "Bikes" },
              { value: "Racks", label: "Racks" },
              { value: "Cargo", label: "Cargo" },
              { value: "Other", label: "Other" },
            ],
            value: filters.category || [],
            onChange: (values) => onFiltersChange({ ...filters, category: values }),
            placeholder: "All Categories"
          },
        ],
        sliders: [
          {
            id: "turnoverThreshold",
            label: "Turnover Threshold (turns/year)",
            min: 0,
            max: 100,
            step: 5,
            value: filters.turnoverThreshold,
            onChange: (value) => onFiltersChange({ ...filters, turnoverThreshold: value }),
            helpText: "Items with turnover rate below this threshold are considered slow-moving"
          }
        ],
      }}
      onReset={onReset}
    />
  );
}

export default SlowMovingStockFilters;
