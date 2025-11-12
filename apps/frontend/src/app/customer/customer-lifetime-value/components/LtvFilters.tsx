"use client";
import React from "react";
import { FilterBar } from "components/index";

interface LtvFiltersProps {
  filters: {
    dateRange: {
      startDate: string;
      endDate: string;
    };
    regions: string[];
    customerTypes: string[];
    minValue?: number;
    maxValue?: number;
  };
  onFiltersChange: (filters: any) => void;
  onReset: () => void;
}

export function LtvFilters({ filters, onFiltersChange, onReset }: LtvFiltersProps) {
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
            id: "regions",
            label: "Regions",
            options: [
              { value: "North America", label: "North America" },
              { value: "Europe", label: "Europe" },
              { value: "Asia Pacific", label: "Asia Pacific" },
              { value: "Latin America", label: "Latin America" },
              { value: "Middle East", label: "Middle East" },
            ],
            value: filters.regions,
            onChange: (values) => onFiltersChange({ ...filters, regions: values }),
          },
          {
            id: "customerTypes",
            label: "Customer Types",
            options: [
              { value: "Enterprise", label: "Enterprise" },
              { value: "Mid-Market", label: "Mid-Market" },
              { value: "Small Business", label: "Small Business" },
              { value: "Startup", label: "Startup" },
            ],
            value: filters.customerTypes,
            onChange: (values) => onFiltersChange({ ...filters, customerTypes: values }),
          },
        ],
      }}
      onReset={onReset}
    />
  );
}
