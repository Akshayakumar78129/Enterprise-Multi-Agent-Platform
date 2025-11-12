"use client";
import React from "react";
import { FilterBar } from "components/index";

interface DemandForecastFiltersProps {
  filters: {
    dateRange: {
      startDate: string;
      endDate: string;
    };
    categories: string[];
    regions: string[];
  };
  onFiltersChange: (filters: any) => void;
  onReset: () => void;
}

export function DemandForecastFilters({ filters, onFiltersChange, onReset }: DemandForecastFiltersProps) {
  // Static product categories for demand forecasting
  const categories = [
    "Electronics",
    "Clothing",
    "Food & Beverage",
    "Home & Garden",
    "Sports & Outdoors",
    "Books & Media",
    "Health & Beauty",
    "Toys & Games"
  ];

  // Static regions for demand forecasting
  const regions = [
    "North America",
    "Europe",
    "Asia Pacific",
    "Latin America",
    "Middle East & Africa"
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
            id: "categories",
            label: "Product Categories",
            options: categories.map(cat => ({ value: cat, label: cat })),
            value: filters.categories || [],
            onChange: (values) => onFiltersChange({ ...filters, categories: values }),
          },
          {
            id: "regions",
            label: "Regions",
            options: regions.map(region => ({ value: region, label: region })),
            value: filters.regions || [],
            onChange: (values) => onFiltersChange({ ...filters, regions: values }),
          },
        ],
      }}
      onReset={onReset}
    />
  );
}
