"use client";
import React from "react";
import { FilterBar } from "components/index";

interface DeviationFiltersProps {
  filters: {
    dateRange: {
      startDate: string;
      endDate: string;
    };
    businessFunctions: string[];
    significanceThreshold: number;
    productCategories: string[];
  };
  onFiltersChange: (filters: any) => void;
  onReset: () => void;
}

export function DeviationFilters({ filters, onFiltersChange, onReset }: DeviationFiltersProps) {
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
            id: "businessFunctions",
            label: "Business Functions",
            options: [
              { value: "sales", label: "Sales" },
              { value: "customer", label: "Customer" },
              { value: "finance", label: "Finance" },
              { value: "operations", label: "Operations" },
              { value: "marketing", label: "Marketing" },
            ],
            value: filters.businessFunctions,
            onChange: (values) => onFiltersChange({ ...filters, businessFunctions: values }),
          },
          {
            id: "productCategories",
            label: "Product Categories",
            options: [
              { value: "Core Platform", label: "Core Platform" },
              { value: "Analytics Suite", label: "Analytics Suite" },
              { value: "API Services", label: "API Services" },
              { value: "Professional Services", label: "Professional Services" },
              { value: "Support Packages", label: "Support Packages" },
              { value: "Add-ons", label: "Add-ons" },
            ],
            value: filters.productCategories,
            onChange: (values) => onFiltersChange({ ...filters, productCategories: values }),
          },
        ],
      }}
      onReset={onReset}
    />
  );
}
