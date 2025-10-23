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
          onChange: (range) =>
            onFiltersChange({ ...filters, dateRange: range }),
          presets: [
            { label: "All Time", startDate: "2017-01-01", endDate: "2021-12-31" },
            { label: "2021", startDate: "2021-01-01", endDate: "2021-12-31" },
            { label: "2020", startDate: "2020-01-01", endDate: "2020-12-31" },
            { label: "Last 6 Months", startDate: "2021-06-01", endDate: "2021-12-31" },
            { label: "Q4 2021", startDate: "2021-10-01", endDate: "2021-12-31" },
            { label: "Q3 2021", startDate: "2021-07-01", endDate: "2021-09-30" },
          ],
        },
        singleSelect: [
          {
            id: "customerType",
            label: "Customer Type",
            options: [
              { value: "all", label: "All Customer Types" },
              { value: "enterprise", label: "Enterprise" },
              { value: "smb", label: "Small-Medium Business" },
              { value: "retail", label: "Retail" },
              { value: "government", label: "Government" },
            ],
            value: filters.customerType,
            onChange: (value) =>
              onFiltersChange({ ...filters, customerType: value }),
          },
          {
            id: "region",
            label: "Region",
            options: [
              { value: "all", label: "All Regions" },
              { value: "north", label: "North" },
              { value: "south", label: "South" },
              { value: "east", label: "East" },
              { value: "west", label: "West" },
            ],
            value: filters.region,
            onChange: (value) =>
              onFiltersChange({ ...filters, region: value }),
          },
          {
            id: "segment",
            label: "Segment",
            options: [
              { value: "all", label: "All Segments" },
              { value: "high_value", label: "High Value" },
              { value: "medium_value", label: "Medium Value" },
              { value: "low_value", label: "Low Value" },
              { value: "new_customer", label: "New Customer" },
            ],
            value: filters.segment,
            onChange: (value) =>
              onFiltersChange({ ...filters, segment: value }),
          },
        ],
      }}
      onReset={onReset}
    />
  );
}
