"use client";

import React from "react";
import { FilterBar } from "components/index";
import { ProductPerformanceFilters } from "../context";
import { useProductPerformanceContext } from "../context";

interface ProductFiltersProps {
  filters: ProductPerformanceFilters;
  onFiltersChange: (filters: ProductPerformanceFilters) => void;
  onReset: () => void;
}

export function ProductFilters({ filters, onFiltersChange, onReset }: ProductFiltersProps) {
  // Category options (from database)
  const categories = [
    "Bikes",
    "Cargo",
    "Racks"
  ];

  // Price band options
  const priceBands = [
    { value: "budget", label: "Budget ($0-$500)" },
    { value: "mid", label: "Mid-Range ($500-$1500)" },
    { value: "premium", label: "Premium ($1500-$3000)" },
    { value: "luxury", label: "Luxury ($3000+)" },
  ];

  return (
    <FilterBar
      config={{
        dateRange: {
          enabled: true,
          value: filters.dateRange,
          onChange: (range) => onFiltersChange({ ...filters, dateRange: range }),
          presets: [
            { label: "All Time", startDate: "2017-01-01", endDate: "2021-12-31" },
            { label: "Last Year", startDate: "2020-01-01", endDate: "2020-12-31" },
            { label: "Last 6 Months", startDate: "2021-06-01", endDate: "2021-12-31" },
            { label: "Last 3 Months", startDate: "2021-09-01", endDate: "2021-12-31" },
            { label: "Last Month", startDate: "2021-11-01", endDate: "2021-11-30" },
            { label: "This Year", startDate: "2021-01-01", endDate: "2021-12-31" },
          ],
        },
        multiSelect: [
          {
            id: "categories",
            label: "Category",
            options: categories.map(c => ({ value: c, label: c })),
            value: filters.categories,
            onChange: (values) => onFiltersChange({ ...filters, categories: values }),
          },
          {
            id: "priceBands",
            label: "Price Band",
            options: priceBands,
            value: filters.priceBands,
            onChange: (values) => onFiltersChange({ ...filters, priceBands: values }),
          },
        ],
      }}
      onReset={onReset}
    />
  );
}
