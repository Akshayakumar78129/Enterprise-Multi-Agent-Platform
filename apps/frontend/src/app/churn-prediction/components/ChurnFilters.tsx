"use client";
import React from "react";
import { FilterBar } from "components/index";

interface ChurnFiltersProps {
  filters: {
    dateRange: {
      startDate: string;
      endDate: string;
    };
    riskLevels: string[];
    segments: string[];
    search: string;
  };
  onFiltersChange: (filters: any) => void;
  onReset: () => void;
}

export function ChurnFilters({ filters, onFiltersChange, onReset }: ChurnFiltersProps) {
  return (
    <FilterBar
      config={{
        dateRange: {
          enabled: true,
          value: filters.dateRange,
          onChange: (range) => onFiltersChange({ ...filters, dateRange: range }),
        },
        search: {
          enabled: true,
          value: filters.search,
          onChange: (value) => onFiltersChange({ ...filters, search: value }),
          placeholder: "Search customers...",
        },
        multiSelect: [
          {
            id: "risk",
            label: "Risk Level",
            options: [
              { value: "Very High", label: "Very High" },
              { value: "High", label: "High" },
              { value: "Medium", label: "Medium" },
              { value: "Low", label: "Low" },
            ],
            value: filters.riskLevels,
            onChange: (values) => onFiltersChange({ ...filters, riskLevels: values }),
          },
          {
            id: "segment",
            label: "Customer Segment",
            options: [
              { value: "Enterprise", label: "Enterprise" },
              { value: "Mid-Market", label: "Mid-Market" },
              { value: "Small Business", label: "Small Business" },
              { value: "Startup", label: "Startup" },
            ],
            value: filters.segments,
            onChange: (values) => onFiltersChange({ ...filters, segments: values }),
          },
        ],
      }}
      onReset={onReset}
    />
  );
}