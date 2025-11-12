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
    productCategories?: string[];
  };
  onFiltersChange: (filters: any) => void;
  onReset: () => void;
}

export function ChurnFilters({ filters, onFiltersChange, onReset }: ChurnFiltersProps) {
  // Static product categories - no need to fetch from API
  const categories = [
    "Core Platform",
    "Analytics Suite",
    "API Services",
    "Professional Services",
    "Support Packages",
    "Add-ons"
  ];
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
          {
            id: "categories",
            label: "Product Categories",
            options: categories.map(cat => ({ value: cat, label: cat })),
            value: filters.productCategories || [],
            onChange: (values) => onFiltersChange({ ...filters, productCategories: values }),
          },
        ],
      }}
      onReset={onReset}
    />
  );
}