"use client";
import React from "react";
import { FilterBar } from "components/index";

interface SegmentationFiltersProps {
  filters: {
    dateRange: {
      startDate: string;
      endDate: string;
    };
    customerSegments: string[];
    valueCategories: string[];
    behaviorTypes: string[];
  };
  onFiltersChange: (filters: any) => void;
  onReset: () => void;
}

export function SegmentationFilters({ filters, onFiltersChange, onReset }: SegmentationFiltersProps) {
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
              { value: "Enterprise", label: "Enterprise" },
              { value: "Mid-Market", label: "Mid-Market" },
              { value: "Small Business", label: "Small Business" },
              { value: "Startup", label: "Startup" },
            ],
            value: filters.customerSegments,
            onChange: (values) => onFiltersChange({ ...filters, customerSegments: values }),
          },
          {
            id: "valueCategories",
            label: "Value Categories",
            options: [
              { value: "High Value", label: "High Value" },
              { value: "Medium Value", label: "Medium Value" },
              { value: "Low Value", label: "Low Value" },
              { value: "At Risk", label: "At Risk" },
            ],
            value: filters.valueCategories,
            onChange: (values) => onFiltersChange({ ...filters, valueCategories: values }),
          },
          {
            id: "behaviorTypes",
            label: "Behavior Types",
            options: [
              { value: "Active", label: "Active" },
              { value: "Declining", label: "Declining" },
              { value: "New", label: "New" },
              { value: "Dormant", label: "Dormant" },
            ],
            value: filters.behaviorTypes,
            onChange: (values) => onFiltersChange({ ...filters, behaviorTypes: values }),
          },
        ],
      }}
      onReset={onReset}
    />
  );
}
