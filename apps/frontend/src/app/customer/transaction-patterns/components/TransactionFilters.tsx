"use client";
import React from 'react';
import { FilterBar } from 'components';

export interface TransactionFiltersProps {
  filters: {
    dateRange?: {
      startDate: string;
      endDate: string;
    };
    paymentMethods?: string[];
    segments?: string[];
    productCategories?: string[];
  };
  onFiltersChange: (filters: any) => void;
  onReset?: () => void;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset
}) => {
  return (
    <FilterBar
      config={{
        dateRange: {
          enabled: true,
          value: filters.dateRange || { startDate: '2021-01-01', endDate: '2021-12-31' },
          onChange: (range) => onFiltersChange({ ...filters, dateRange: range }),
        },
        multiSelect: [
          {
            id: "payment",
            label: "Payment Method",
            options: [
              { value: "Standard", label: "Standard" },
              { value: "Express", label: "Express" },
              { value: "Corporate", label: "Corporate" },
              { value: "Manual", label: "Manual" },
            ],
            value: filters.paymentMethods || [],
            onChange: (values) => onFiltersChange({ ...filters, paymentMethods: values }),
          },
          {
            id: "segment",
            label: "Customer Segment",
            options: [
              { value: "Premium", label: "Premium" },
              { value: "Regular", label: "Regular" },
              { value: "New", label: "New" },
              { value: "At-Risk", label: "At-Risk" },
            ],
            value: filters.segments || [],
            onChange: (values) => onFiltersChange({ ...filters, segments: values }),
          },
          {
            id: "categories",
            label: "Product Categories",
            options: [
              { value: "Electronics", label: "Electronics" },
              { value: "Clothing", label: "Clothing" },
              { value: "Food", label: "Food" },
              { value: "Home", label: "Home" },
              { value: "Books", label: "Books" },
              { value: "Sports", label: "Sports" },
            ],
            value: filters.productCategories || [],
            onChange: (values) => onFiltersChange({ ...filters, productCategories: values }),
          },
        ],
      }}
      onReset={onReset}
    />
  );
};