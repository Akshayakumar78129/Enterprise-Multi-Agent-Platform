"use client";

import React from "react";
import { FilterBar } from "components/index";
import { SalesPerformanceFilters } from "../context";
import { useSalesPerformanceContext } from "../context";

interface SalesFiltersProps {
  filters: SalesPerformanceFilters;
  onFiltersChange: (filters: SalesPerformanceFilters) => void;
  onReset: () => void;
}

export function SalesFilters({ filters, onFiltersChange, onReset }: SalesFiltersProps) {
  const { selectedDimension, setSelectedDimension, selectedMetric, setSelectedMetric } = useSalesPerformanceContext();

  // Analysis dimension options
  const dimensions = [
    { value: "category", label: "Category" },
    { value: "product", label: "Product" },
    { value: "region", label: "Region" },
    { value: "channel", label: "Channel" },
    { value: "customer", label: "Customer" },
    { value: "time", label: "Time Series" },
  ];

  // Performance metric options
  const metrics = [
    { value: "revenue", label: "Revenue" },
    { value: "units_sold", label: "Units Sold" },
    { value: "averageOrderValue", label: "Avg Order Value" },
    { value: "grossMargin", label: "Gross Margin" },
    { value: "conversionRate", label: "Conversion Rate" },
  ];

  // Region options (from database)
  const regions = [
    "Canada",
    "Mexico",
    "United States"
  ];

  // Category options (from database)
  const categories = [
    "Bikes",
    "Cargo",
    "Racks"
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
        singleSelect: [
          {
            id: "dimension",
            label: "Analysis Dimension",
            options: dimensions,
            value: selectedDimension,
            onChange: setSelectedDimension,
          },
          {
            id: "metric",
            label: "Performance Metric",
            options: metrics,
            value: selectedMetric,
            onChange: setSelectedMetric,
          },
        ],
        multiSelect: [
          {
            id: "regions",
            label: "Region",
            options: regions.map(r => ({ value: r, label: r })),
            value: filters.regions,
            onChange: (values) => onFiltersChange({ ...filters, regions: values }),
          },
          {
            id: "categories",
            label: "Category",
            options: categories.map(c => ({ value: c, label: c })),
            value: filters.categories,
            onChange: (values) => onFiltersChange({ ...filters, categories: values }),
          },
        ],
      }}
      onReset={onReset}
    />
  );
}
