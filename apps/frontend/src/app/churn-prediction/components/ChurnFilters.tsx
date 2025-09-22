"use client";
import React, { useEffect, useState } from "react";
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
  const [categories, setCategories] = useState<string[]>([
    // SaaS/B2B product categories matching web folder
    "Core Platform",
    "Analytics Suite",
    "API Services",
    "Professional Services",
    "Support Packages",
    "Add-ons"
  ]);

  useEffect(() => {
    // Try to fetch categories from backend, but use defaults if it fails
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/churn/categories`;
    console.log('Fetching categories from:', url);
    fetch(url)
      .then(res => {
        console.log('Categories response status:', res.status);
        // Don't throw error, just handle gracefully
        if (!res.ok) {
          console.log('Categories endpoint not available, using defaults');
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data) {
          console.log('Categories data:', data);
          if (data.categories && data.categories.length > 0) {
            setCategories(data.categories);
          }
        }
      })
      .catch(err => {
        console.log('Categories endpoint not available, using defaults');
        // Keep default categories on error - no need to log as error
      });
  }, []);
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